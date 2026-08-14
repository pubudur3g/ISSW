import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  UserCheck,
  PackageCheck,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { User, Product, PurchaseOrder, ForemanReportCustomItem } from '../types';
import { StorageService } from '../lib/storage';

interface WeeklyForemanReportModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
}

export const WeeklyForemanReportModal: React.FC<WeeklyForemanReportModalProps> = ({
  isOpen,
  currentUser,
  onClose,
}) => {
  const products = StorageService.getProducts();
  const settings = StorageService.getSettings();
  const purchaseOrders = StorageService.getPurchaseOrders();

  // Custom items added by Supervisors or Admins for the Foreman
  const [customItems, setCustomItems] = useState<ForemanReportCustomItem[]>(() =>
    StorageService.getForemanCustomItems()
  );

  // Form State for Adding Item to Foreman Report
  const [addMode, setAddMode] = useState<'catalog' | 'manual'>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [manualItemName, setManualItemName] = useState<string>('');
  const [manualSupplierCode, setManualSupplierCode] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);

  // Selected Week & Sign-off State
  const [reportWeek, setReportWeek] = useState<string>('Week 33 (Aug 10 - Aug 17, 2026)');
  const [foremanName, setForemanName] = useState<string>('Pasi Ylitalo (Foreman)');
  const [foremanStatus, setForemanStatus] = useState<'PENDING' | 'APPROVED' | 'MODIFIED'>('PENDING');
  const [foremanNotes, setForemanNotes] = useState<string>('Reviewed and cleared for supplier PO release.');
  const [isSigned, setIsSigned] = useState<boolean>(false);

  if (!isOpen) return null;

  // Build the consolidated list for the Foreman Report
  // 1. Approved / Ordered Purchase Orders items (including approved employee orders)
  const approvedPOItemsMap: { [key: string]: { name: string; code: string; qty: number; unit: string } } = {};

  purchaseOrders
    .filter((po) => po.status === 'Approved' || po.status === 'Ordered')
    .forEach((po) => {
      po.items.forEach((item) => {
        const key = item.productId || item.productCode || item.productName;
        if (!approvedPOItemsMap[key]) {
          approvedPOItemsMap[key] = {
            name: item.productName,
            code: item.productCode,
            qty: 0,
            unit: item.unit || 'Unit',
          };
        }
        approvedPOItemsMap[key].qty += item.orderedQuantity;
      });
    });

  // 2. Low Stock Reorder Items
  const lowStockItems = products
    .filter((p) => p.currentStock <= p.minStock)
    .map((p) => ({
      name: p.name,
      code: p.supplierProductCode || p.code,
      qty: Math.max(1, p.targetStock - p.currentStock),
      unit: p.unit,
    }));

  // Combine and consolidate all items into ONE list for the Foreman
  const consolidatedMap: { [key: string]: { name: string; code: string; qty: number; unit: string; isCustom?: boolean; customId?: string } } = {};

  // Add low stock items
  lowStockItems.forEach((item) => {
    const key = item.code || item.name;
    consolidatedMap[key] = { ...item };
  });

  // Merge approved PO items
  Object.values(approvedPOItemsMap).forEach((item) => {
    const key = item.code || item.name;
    if (consolidatedMap[key]) {
      consolidatedMap[key].qty += item.qty;
    } else {
      consolidatedMap[key] = { ...item };
    }
  });

  // Merge custom items added by Supervisors/Admins
  customItems.forEach((ci) => {
    const key = `custom-${ci.id}`;
    consolidatedMap[key] = {
      name: ci.productName,
      code: ci.supplierProductCode,
      qty: ci.quantity,
      unit: ci.unit || 'Unit',
      isCustom: true,
      customId: ci.id,
    };
  });

  const finalReportList = Object.values(consolidatedMap);

  const handleAddItemToForemanReport = (e: React.FormEvent) => {
    e.preventDefault();
    let name = '';
    let code = '';
    let unit = 'Unit';

    if (addMode === 'catalog') {
      const prod = products.find((p) => p.id === selectedProductId);
      if (!prod) return;
      name = prod.name;
      code = prod.supplierProductCode || prod.code;
      unit = prod.unit;
    } else {
      if (!manualItemName.trim()) return;
      name = manualItemName.trim();
      code = manualSupplierCode.trim() || 'N/A';
    }

    const newItem: ForemanReportCustomItem = {
      id: `foreman-item-${Date.now()}`,
      productName: name,
      supplierProductCode: code,
      quantity: addQuantity,
      unit: unit,
      addedByUserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const updated = StorageService.addForemanCustomItem(newItem, currentUser);
    setCustomItems(updated);
    setManualItemName('');
    setManualSupplierCode('');
    setAddQuantity(1);
    setAddSuccessMsg(`Added "${name}" (${addQuantity} qty) to Foreman Report list!`);
    setTimeout(() => setAddSuccessMsg(null), 3000);
  };

  const handleDeleteCustomItem = (id: string) => {
    const updated = StorageService.deleteForemanCustomItem(id, currentUser);
    setCustomItems(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSignature = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigned(true);
    StorageService.logAudit(
      currentUser,
      'Signed Weekly Foreman Report',
      'PurchaseOrder',
      'weekly-report',
      reportWeek
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-6 overflow-y-auto backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Modal Top Bar (Screen Only) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 shadow-xs">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Weekly Foreman Order Report
              </h2>
              <p className="text-xs text-slate-500">
                Unified total order list for Foreman review and supplier fulfillment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 shadow-md transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* SUPERVISOR / ADMIN ITEM ADDITION PANEL (Screen Only) */}
        {currentUser.role !== 'EMPLOYEE' && (
          <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">
                  Supervisors & Admins: Add Item to Foreman Report List
                </h3>
              </div>
              <div className="flex items-center bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAddMode('catalog')}
                  className={`px-3 py-1 rounded-lg transition ${
                    addMode === 'catalog' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300'
                  }`}
                >
                  Select From Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('manual')}
                  className={`px-3 py-1 rounded-lg transition ${
                    addMode === 'manual' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300'
                  }`}
                >
                  Custom Manual Item
                </button>
              </div>
            </div>

            <form onSubmit={handleAddItemToForemanReport} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {addMode === 'catalog' ? (
                <div className="md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Select Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.supplierProductCode || p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Heavy Duty Microfiber Cloths"
                      value={manualItemName}
                      onChange={(e) => setManualItemName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs font-bold text-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Supplier Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SUP-MF-009"
                      value={manualSupplierCode}
                      onChange={(e) => setManualSupplierCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs font-bold text-white"
                    />
                  </div>
                </>
              )}

              <div className={addMode === 'catalog' ? 'md:col-span-3' : 'md:col-span-2'}>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs font-bold text-white text-center"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 py-2 px-3 text-xs font-black transition shadow-sm flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Foreman List</span>
                </button>
              </div>
            </form>

            {addSuccessMsg && (
              <p className="text-xs text-amber-300 font-bold text-center animate-fade-in pt-1">
                ✓ {addSuccessMsg}
              </p>
            )}
          </div>
        )}

        {/* PRINTABLE FOREMAN REPORT CONTENT */}
        <div id="printable-foreman-report" className="space-y-6 text-slate-900 bg-white p-2">
          {/* Header Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-indigo-300 font-extrabold text-xs uppercase tracking-widest mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>{settings.companyName || 'CleanStock Professional'}</span>
                  <span>•</span>
                  <span>Foreman Materials Report</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Weekly Order Requests List
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Prepared by: <strong className="text-white">{currentUser.name} ({currentUser.role})</strong> • Reviewer: <strong className="text-amber-300">{foremanName}</strong>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">Report Period</div>
                <div className="text-sm font-extrabold text-white flex items-center justify-end space-x-1 mt-0.5">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span>{reportWeek}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIMPLIFIED FOREMAN REPORT TABLE (EXACTLY 3 COLUMNS REQUIRED: Item Name, Supplier Code, Quantity) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                <span>Foreman Total Weekly Order Requests List</span>
              </h3>
              <span className="text-xs font-bold text-slate-600">
                Total Unique Items: {finalReportList.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-slate-900 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-900 border-collapse">
                <thead className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5 border-b border-slate-800">Item Name</th>
                    <th className="py-3.5 px-5 border-b border-slate-800">Product Item Supplier Code</th>
                    <th className="py-3.5 px-5 border-b border-slate-800 text-center">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {finalReportList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-bold">
                        No orders requested for this week yet.
                      </td>
                    </tr>
                  ) : (
                    finalReportList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-5 font-black text-slate-900 text-sm">
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            {item.isCustom && item.customId && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomItem(item.customId!)}
                                className="text-slate-400 hover:text-rose-600 transition print:hidden ml-2"
                                title="Delete from Foreman list"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono font-extrabold text-indigo-950 text-xs">
                          {item.code || 'N/A'}
                        </td>
                        <td className="py-3.5 px-5 text-center font-black text-emerald-800 text-sm">
                          <span className="inline-block bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300">
                            {item.qty} {item.unit || ''}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOREMAN SIGN-OFF BLOCK */}
          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-indigo-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Foreman Approval & Sign-Off Authorization Block
                </h3>
              </div>
              {isSigned ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>SIGNED & APPROVED FOR PO RELEASE</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Awaiting Foreman Sign-Off
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSignature} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Foreman Name</label>
                <input
                  type="text"
                  required
                  value={foremanName}
                  onChange={(e) => setForemanName(e.target.value)}
                  placeholder="Enter General Foreman Name..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Approval Decision</label>
                <select
                  value={foremanStatus}
                  onChange={(e) => setForemanStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-extrabold text-indigo-900"
                >
                  <option value="APPROVED">APPROVED — Release All Purchase Orders</option>
                  <option value="MODIFIED">APPROVED WITH MODIFICATIONS</option>
                  <option value="PENDING">PENDING — Under Foreman Review</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">Foreman Comments / Notes</label>
                <input
                  type="text"
                  value={foremanNotes}
                  onChange={(e) => setForemanNotes(e.target.value)}
                  placeholder="e.g. Cleared for ordering. Prioritize site supply requests first."
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                />
              </div>

              {!isSigned && (
                <div className="md:col-span-2 flex justify-end pt-2 print:hidden">
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-md transition"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Sign & Approve Weekly Report</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
