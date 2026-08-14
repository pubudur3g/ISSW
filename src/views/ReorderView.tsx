import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  DollarSign,
  Package,
  Calendar,
  X,
  FileText,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { Product, PurchaseOrder, Supplier, User, POStatus } from '../types';
import { StorageService } from '../lib/storage';
import { WeeklyForemanReportModal } from '../components/WeeklyForemanReportModal';

interface ReorderViewProps {
  currentUser: User;
}

export const ReorderView: React.FC<ReorderViewProps> = ({ currentUser }) => {
  const products = StorageService.getProducts().filter((p) => p.active);
  const suppliers = StorageService.getSuppliers().filter((s) => s.active);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    StorageService.getPurchaseOrders()
  );
  const settings = StorageService.getSettings();

  // Determine if user is an employee
  const isEmployee = currentUser.role === 'EMPLOYEE';

  // Selected products for reorder list
  const [customProductIds, setCustomProductIds] = useState<string[]>([]);
  
  // Combine low stock products and manually added products
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock);
  
  // Employees only see items they have explicitly selected/ordered via dropdown
  // Supervisors/Admins see low stock items + custom selected items
  const activeReorderProducts = isEmployee
    ? products.filter((p) => customProductIds.includes(p.id))
    : products.filter((p) => p.currentStock <= p.minStock || customProductIds.includes(p.id));

  // Dropdown selector state for Reorder table
  const [selectedQuickProductId, setSelectedQuickProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [quickQuantity, setQuickQuantity] = useState<number>(0);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);

  // Suggested quantities state
  const [orderQtyMap, setOrderQtyMap] = useState<{ [key: string]: number }>(() => {
    const map: { [key: string]: number } = {};
    lowStockProducts.forEach((p) => {
      map[p.id] = 0;
    });
    return map;
  });

  // Modal State
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isForemanReportOpen, setIsForemanReportOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + settings.expectedDeliveryDays);
    return d.toISOString().split('T')[0];
  });
  const [poNotes, setPoNotes] = useState<string>('');

  // PO builder items state
  const [poBuilderItems, setPoBuilderItems] = useState<
    {
      productId: string;
      productName: string;
      productCode: string;
      unit: string;
      currentStock: number;
      reorderLevel: number;
      targetStock: number;
      suggestedQuantity: number;
      orderedQuantity: number;
      unitPrice: number;
      receivedQuantity: number;
    }[]
  >([]);

  const [poSelectedProductId, setPoSelectedProductId] = useState<string>(products[0]?.id || '');
  const [poItemQuantity, setPoItemQuantity] = useState<number>(0);

  const refreshPOs = () => {
    setPurchaseOrders(StorageService.getPurchaseOrders());
  };

  const handleAddQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedQuickProductId);
    if (!prod) return;

    if (!customProductIds.includes(prod.id)) {
      setCustomProductIds((prev) => [...prev, prod.id]);
    }
    setOrderQtyMap((prev) => ({ ...prev, [prod.id]: quickQuantity }));
    setAddSuccessMsg(`Added ${prod.name} with quantity ${quickQuantity}`);
    setTimeout(() => setAddSuccessMsg(null), 3000);
  };

  const handleRemoveProductFromReorder = (productId: string) => {
    setCustomProductIds((prev) => prev.filter((id) => id !== productId));
    setOrderQtyMap((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Open Create PO Modal and populate items that have orderedQuantity > 0 or are low stock
  const handleOpenCreatePOModal = () => {
    const initialItems = activeReorderProducts
      .filter((p) => (orderQtyMap[p.id] !== undefined ? orderQtyMap[p.id] > 0 : true))
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        unit: p.unit,
        currentStock: p.currentStock,
        reorderLevel: p.minStock,
        targetStock: p.targetStock,
        suggestedQuantity: Math.max(0, p.targetStock - p.currentStock),
        orderedQuantity: orderQtyMap[p.id] ?? 0,
        unitPrice: p.purchasePrice,
        receivedQuantity: 0,
      }));

    setPoBuilderItems(initialItems);
    setIsCreatePOOpen(true);
  };

  const handleAddProductToPO = () => {
    const prod = products.find((p) => p.id === poSelectedProductId);
    if (!prod) return;

    const existingIndex = poBuilderItems.findIndex((item) => item.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...poBuilderItems];
      updated[existingIndex].orderedQuantity = poItemQuantity;
      setPoBuilderItems(updated);
    } else {
      setPoBuilderItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          unit: prod.unit,
          currentStock: prod.currentStock,
          reorderLevel: prod.minStock,
          targetStock: prod.targetStock,
          suggestedQuantity: Math.max(0, prod.targetStock - prod.currentStock),
          orderedQuantity: poItemQuantity,
          unitPrice: prod.purchasePrice,
          receivedQuantity: 0,
        },
      ]);
    }
  };

  const handleRemoveItemFromPO = (productId: string) => {
    setPoBuilderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const supplierObj = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplierObj) return;

    if (poBuilderItems.length === 0) {
      alert('Please add at least one product to the Purchase Order.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const totalEstCost = poBuilderItems.reduce((acc, i) => acc + i.orderedQuantity * i.unitPrice, 0);

    const initialStatus: POStatus = isEmployee ? 'Pending Approval' : 'Ordered';

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      supplierId: supplierObj.id,
      supplierName: supplierObj.name,
      date: dateStr,
      expectedDeliveryDate: expectedDate,
      status: initialStatus,
      items: poBuilderItems,
      estimatedCost: totalEstCost,
      notes: poNotes || `Created by ${currentUser.name} (${currentUser.role}).`,
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      requestedByUserRole: currentUser.role,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    StorageService.savePurchaseOrder(newPO, currentUser);

    if (isEmployee) {
      StorageService.addNotification({
        id: `notif-po-req-${Date.now()}`,
        date: dateStr,
        time: now.toTimeString().split(' ')[0].substring(0, 5),
        type: 'PRODUCT_REQUEST',
        message: `📋 New product order request submitted by ${currentUser.name} (${newPO.items.length} items). Requires Supervisor/Admin approval.`,
        read: false,
        severity: 'warning',
      });
      alert('Order request submitted successfully! It is now pending approval by a Supervisor or Admin.');
    }

    refreshPOs();
    setIsCreatePOOpen(false);
  };

  const handleApprovePO = (po: PurchaseOrder) => {
    po.status = 'Approved';
    po.approvedByUserId = currentUser.id;
    po.approvedByUserName = currentUser.name;
    StorageService.savePurchaseOrder(po, currentUser);

    const now = new Date();
    StorageService.addNotification({
      id: `notif-po-approved-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'RECEIPT',
      message: `✅ Purchase Order ${po.poNumber} requested by ${po.requestedByUserName || 'Employee'} was APPROVED by ${currentUser.name}.`,
      read: false,
      severity: 'success',
    });

    refreshPOs();
  };

  const handleRejectPO = (po: PurchaseOrder) => {
    po.status = 'Cancelled';
    StorageService.savePurchaseOrder(po, currentUser);

    const now = new Date();
    StorageService.addNotification({
      id: `notif-po-rejected-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'PRODUCT_REQUEST',
      message: `❌ Order request ${po.poNumber} requested by ${po.requestedByUserName || 'Employee'} was REJECTED by ${currentUser.name}.`,
      read: false,
      severity: 'error',
    });

    refreshPOs();
  };

  const handleSendSelectedForApproval = () => {
    const itemsToOrder = activeReorderProducts
      .map((p) => ({
        p,
        qty: orderQtyMap[p.id] ?? 0,
      }))
      .filter((item) => item.qty > 0);

    if (itemsToOrder.length === 0) {
      alert('Please enter a quantity greater than 0 for at least one product before sending for approval.');
      return;
    }

    const defaultSupplier = suppliers[0] || { id: 'sup-1', name: 'General Supplier' };
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const poItems = itemsToOrder.map(({ p, qty }) => ({
      productId: p.id,
      productName: p.name,
      productCode: p.code,
      unit: p.unit,
      currentStock: p.currentStock,
      reorderLevel: p.minStock,
      targetStock: p.targetStock,
      suggestedQuantity: Math.max(0, p.targetStock - p.currentStock),
      orderedQuantity: qty,
      unitPrice: p.purchasePrice,
      receivedQuantity: 0,
    }));

    const totalEstCost = poItems.reduce((acc, i) => acc + i.orderedQuantity * i.unitPrice, 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      supplierId: defaultSupplier.id,
      supplierName: defaultSupplier.name,
      date: dateStr,
      expectedDeliveryDate: dateStr,
      status: 'Pending Approval',
      items: poItems,
      estimatedCost: totalEstCost,
      notes: `Order request submitted by ${currentUser.name} (${currentUser.role}).`,
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      requestedByUserRole: currentUser.role,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    StorageService.savePurchaseOrder(newPO, currentUser);

    StorageService.addNotification({
      id: `notif-po-req-${Date.now()}`,
      date: dateStr,
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'PRODUCT_REQUEST',
      message: `📋 New product order request (${poItems.length} items) submitted by ${currentUser.name}. Awaiting Supervisor/Admin approval.`,
      read: false,
      severity: 'warning',
    });

    alert('Order request sent for approval! Your Supervisor or Admin will review it shortly.');

    setCustomProductIds([]);
    setOrderQtyMap({});
    refreshPOs();
  };

  const pendingPOs = purchaseOrders.filter((po) => po.status === 'Pending Approval');

  const handleUpdatePOStatus = (po: PurchaseOrder, newStatus: POStatus) => {
    po.status = newStatus;
    if (newStatus === 'Received') {
      // Auto-receive all quantities into inventory!
      po.items.forEach((item) => {
        StorageService.receiveStock(
          item.productId,
          item.orderedQuantity,
          po.supplierId,
          currentUser,
          item.unitPrice,
          po.poNumber,
          `Received via PO ${po.poNumber}`
        );
      });
    }
    StorageService.savePurchaseOrder(po, currentUser);
    refreshPOs();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
            <span>Reorder & Purchase Orders</span>
          </h2>
          <p className="text-xs text-slate-500">
            Select products, set order quantities, and submit purchase order requests
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser.role !== 'EMPLOYEE' && (
            <button
              onClick={() => setIsForemanReportOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-xs font-extrabold text-indigo-900 hover:bg-indigo-100 transition shadow-xs"
            >
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Weekly Foreman Report</span>
            </button>
          )}

          <button
            onClick={handleOpenCreatePOModal}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Send className="h-4 w-4" />
            <span>{isEmployee ? 'Send Order for Approval' : 'Create Purchase Order'}</span>
          </button>
        </div>
      </div>

      {/* PENDING APPROVAL SECTION FOR SUPERVISORS & ADMINS */}
      {!isEmployee && pendingPOs.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-6 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <h3 className="font-extrabold text-amber-950 text-sm">
                Pending Employee Order Requests ({pendingPOs.length} Awaiting Approval)
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
              Requires Approval
            </span>
          </div>

          <div className="space-y-3">
            {pendingPOs.map((po) => (
              <div key={po.id} className="rounded-xl bg-white border border-amber-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-slate-900">{po.poNumber}</span>
                    <span className="ml-2 text-xs font-bold text-amber-800">
                      • Requested by: <strong>{po.requestedByUserName || 'Employee'}</strong>
                    </span>
                    <span className="ml-2 text-xs text-slate-500">• Date: {po.date}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprovePO(po)}
                      className="inline-flex items-center space-x-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectPO(po)}
                      className="inline-flex items-center space-x-1 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-rose-100 hover:text-rose-700 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {po.items.map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-600 font-mono">
                        Requested Qty: <strong>{item.orderedQuantity} {item.unit}s</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFORMATIONAL BANNER FOR EMPLOYEES WITH PENDING ORDERS */}
      {isEmployee && purchaseOrders.some((po) => po.status === 'Pending Approval' && po.requestedByUserId === currentUser.id) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex items-center space-x-3 text-amber-900 text-xs font-bold">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <span>Your order request has been submitted and is currently pending approval by a Supervisor or Admin.</span>
        </div>
      )}

      {/* QUICK PRODUCT SELECTOR & QUANTITY INPUT PANEL */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 text-white shadow-md">
        <div className="flex items-center space-x-2 mb-2">
          <PlusCircle className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm text-white">Select Product & Set Order Quantity</h3>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Choose any product from the catalog dropdown, input the desired order quantity, and add it to the reorder order list.
        </p>

        <form onSubmit={handleAddQuickProduct} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Select Product (Dropdown)
            </label>
            <select
              value={selectedQuickProductId}
              onChange={(e) => setSelectedQuickProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  [{p.code}] {p.name} — Current Stock: {p.currentStock} {p.unit}s
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Order Quantity
            </label>
            <input
              type="number"
              min="0"
              value={quickQuantity}
              onChange={(e) => setQuickQuantity(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3 text-xs font-bold text-white text-center focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-4 text-xs font-extrabold transition shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Reorder List</span>
            </button>
          </div>
        </form>

        {addSuccessMsg && (
          <div className="mt-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-2 text-center text-xs font-bold text-emerald-300 animate-fade-in">
            ✓ {addSuccessMsg}
          </div>
        )}
      </div>

      {/* REORDER SUGGESTIONS TABLE / EMPLOYEE ORDER LIST */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              {isEmployee ? 'My Selected Order List' : 'Active Reorder Products List'}
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-800">
              {activeReorderProducts.length} {activeReorderProducts.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          {isEmployee && activeReorderProducts.length > 0 && (
            <button
              type="button"
              onClick={handleSendSelectedForApproval}
              className="inline-flex items-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition transform active:scale-95 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Send for Approval</span>
            </button>
          )}
        </div>

        {activeReorderProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">
              {isEmployee ? 'Your order list is empty.' : 'No items selected for reorder right now.'}
            </p>
            <p className="text-xs text-slate-500">
              Select a product from the dropdown above and enter the quantity to build your order!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Code / Product</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center font-semibold">Min Level</th>
                  <th className="py-3 px-4 text-center font-semibold">Target Level</th>
                  <th className="py-3 px-4 text-center">Order Quantity</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeReorderProducts.map((p) => {
                  const currentOrderVal = orderQtyMap[p.id] ?? 0;
                  const isLowStock = p.currentStock <= p.minStock;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 transition ${isLowStock ? 'bg-rose-50/20' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{p.code}</p>
                          </div>
                          {isLowStock && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            isLowStock ? 'text-rose-600 bg-rose-50' : 'text-slate-700 bg-slate-100'
                          }`}
                        >
                          {p.currentStock} {p.unit}s
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{p.minStock}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{p.targetStock}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={currentOrderVal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setOrderQtyMap({ ...orderQtyMap, [p.id]: val });
                          }}
                          className="w-20 rounded-lg border border-slate-300 py-1.5 px-2 text-center text-xs font-bold text-slate-900 focus:border-emerald-500 shadow-2xs"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromReorder(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove from Reorder List"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {isEmployee && activeReorderProducts.length > 0 && (
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSendSelectedForApproval}
              className="inline-flex items-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition transform active:scale-95"
            >
              <Send className="h-4 w-4" />
              <span>Send Order for Approval</span>
            </button>
          </div>
        )}
      </div>

      {/* PURCHASE ORDERS HISTORY & TRACKING */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Truck className="h-4 w-4 text-blue-600" />
          <span>Purchase Orders History & Status</span>
        </h3>

        <div className="space-y-3">
          {purchaseOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No purchase orders created yet.</p>
          ) : (
            purchaseOrders.map((po) => (
              <div key={po.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-slate-900">{po.poNumber}</span>
                    <span className="ml-2 text-xs text-slate-600">• Supplier: <strong>{po.supplierName}</strong></span>
                    <span className="ml-2 text-xs text-slate-500">• Created: {po.date}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        po.status === 'Received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'Approved' || po.status === 'Ordered'
                          ? 'bg-blue-100 text-blue-800'
                          : po.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {po.status}
                    </span>

                    {!isEmployee && po.status === 'Pending Approval' && (
                      <button
                        onClick={() => handleApprovePO(po)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                      >
                        Approve Order
                      </button>
                    )}

                    {!isEmployee && (po.status === 'Approved' || po.status === 'Ordered') && (
                      <button
                        onClick={() => handleUpdatePOStatus(po, 'Received')}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                      >
                        Mark Received & Add Stock
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {po.items.map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-white p-2.5 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Ordered: <strong>{item.orderedQuantity} {item.unit}s</strong> @ {settings.currency}{' '}
                        {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Expected Delivery: <strong>{po.expectedDeliveryDate || 'N/A'}</strong></span>
                  <span className="font-bold text-slate-900 text-sm">
                    Total Estimated Cost: {settings.currency} {po.estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE PO MODAL WITH INTERACTIVE PRODUCT DROPDOWN BUILDER */}
      {isCreatePOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-800 text-base">Generate New Purchase Order</h3>
              <button
                onClick={() => setIsCreatePOOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-bold text-slate-900"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* DROPDOWN SELECTOR TO ADD ITEMS TO PO */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800">
                  Select Product & Add to Purchase Order:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-7">
                    <select
                      value={poSelectedProductId}
                      onChange={(e) => setPoSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-bold text-slate-900 bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Qty"
                      value={poItemQuantity}
                      onChange={(e) => setPoItemQuantity(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-bold text-slate-900 text-center bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddProductToPO}
                      className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2 px-2 text-xs font-bold transition flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LIST OF PO ITEMS */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Order Items ({poBuilderItems.length}):
                </label>

                {poBuilderItems.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-300 rounded-xl">
                    No items added yet. Use the dropdown above to select products and quantities.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {poBuilderItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.productCode} • {settings.currency} {item.unitPrice.toFixed(2)} per {item.unit}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                            <input
                              type="number"
                              min="0"
                              value={item.orderedQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setPoBuilderItems((prev) =>
                                  prev.map((i) =>
                                    i.productId === item.productId
                                      ? { ...i, orderedQuantity: val }
                                      : i
                                  )
                                );
                              }}
                              className="w-16 rounded-lg border border-slate-300 py-1 px-2 text-center text-xs font-bold text-slate-900"
                            />
                          </div>

                          <span className="font-extrabold text-slate-900 w-20 text-right">
                            {settings.currency} {(item.orderedQuantity * item.unitPrice).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPO(item.productId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">PO Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Standard delivery to Warehouse 1 Bay A"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-extrabold text-slate-900">
                  Total Cost:{' '}
                  <span className="text-sm text-emerald-700">
                    {settings.currency}{' '}
                    {poBuilderItems
                      .reduce((acc, i) => acc + i.orderedQuantity * i.unitPrice, 0)
                      .toFixed(2)}
                  </span>
                </span>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatePOOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Create PO Record
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WEEKLY FOREMAN REPORT MODAL */}
      <WeeklyForemanReportModal
        isOpen={isForemanReportOpen}
        currentUser={currentUser}
        onClose={() => setIsForemanReportOpen(false)}
      />
    </div>
  );
};

