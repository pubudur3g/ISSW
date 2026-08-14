import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  QrCode,
  Edit2,
  Trash2,
  Eye,
  Tag,
  Boxes,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  Building2,
  DollarSign,
  Info,
  PackagePlus,
  MessageSquareQuote,
  Check,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Product, Category, Supplier, UnitType, User, ProductRequest } from '../types';
import { StorageService } from '../lib/storage';
import { QRLabelModal } from '../components/QRLabelModal';
import { ProductQRCode } from '../components/ProductQRCode';
import { UnregisteredProductRequestModal } from '../components/UnregisteredProductRequestModal';

interface ProductsViewProps {
  currentUser: User;
  onOpenScanner: () => void;
  onSelectProductForIssue?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  currentUser,
  onOpenScanner,
  onSelectProductForIssue,
}) => {
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const categories = StorageService.getCategories();
  const suppliers = StorageService.getSuppliers();
  const settings = StorageService.getSettings();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(null);
  const [isBatchLabelOpen, setIsBatchLabelOpen] = useState(false);

  // Unregistered Product Requests State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [showRequestsTab, setShowRequestsTab] = useState(false);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>(
    StorageService.getProductRequests()
  );
  const pendingRequestsCount = productRequests.filter((r) => r.status === 'PENDING').length;

  const refreshProductRequests = () => {
    setProductRequests(StorageService.getProductRequests());
  };

  const handleApproveRequestToProduct = (req: ProductRequest) => {
    // Pre-fill form with requested item data
    setEditingProduct(null);
    const cat = categories.find((c) => c.name.toLowerCase() === (req.category || '').toLowerCase());

    setFormData({
      code: StorageService.generateNextProductCode(),
      name: req.productName,
      categoryId: cat?.id || categories[0]?.id || 'cat-1',
      brand: req.brand || 'General',
      description: `Requested by ${req.requestedByUserName}: "${req.reason}"`,
      unit: (req.unit as UnitType) || 'Packet',
      packageSize: '1 pack',
      currentStock: req.estimatedQuantity || 5,
      minStock: 10,
      targetStock: Math.max(30, (req.estimatedQuantity || 5) * 2),
      maxStock: 100,
      supplierId: suppliers[0]?.id || 'sup-1',
      supplierProductCode: '',
      purchasePrice: 10.0,
      storageLocation: 'Central Receiving',
    });

    // Mark request as approved
    const updatedReq: ProductRequest = {
      ...req,
      status: 'APPROVED',
      adminNotes: `Approved and converted to registered product by ${currentUser.name}`,
    };
    StorageService.saveProductRequest(updatedReq, currentUser);
    refreshProductRequests();

    setIsAddEditOpen(true);
  };

  // New Category Creation state inside Add Product
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    code: StorageService.generateNextProductCode(),
    name: '',
    categoryId: categories[0]?.id || '',
    brand: '',
    description: '',
    unit: 'Packet',
    packageSize: '',
    currentStock: 0,
    minStock: 10,
    targetStock: 50,
    maxStock: 100,
    supplierId: suppliers[0]?.id || '',
    supplierProductCode: '',
    purchasePrice: 0,
    storageLocation: 'Aisle 1',
  });

  const refreshProducts = () => {
    setProducts(StorageService.getProducts());
  };

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;

    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchName = p.name.toLowerCase().includes(term);
      const matchCode = p.code.toLowerCase().includes(term);
      const matchBrand = p.brand.toLowerCase().includes(term);
      const matchLoc = p.storageLocation.toLowerCase().includes(term);
      const matchSupplierCode = (p.supplierProductCode || '').toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchBrand && !matchLoc && !matchSupplierCode) return false;
    }

    // Category
    if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;

    // Stock Status
    if (selectedStatus !== 'ALL') {
      const status = StorageService.getStockStatus(p);
      if (selectedStatus === 'NORMAL' && status !== 'NORMAL') return false;
      if (selectedStatus === 'LOW' && status !== 'LOW') return false;
      if (selectedStatus === 'REORDER' && status !== 'REORDER_REQUIRED') return false;
      if (selectedStatus === 'OUT' && status !== 'OUT_OF_STOCK') return false;
    }

    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      code: StorageService.generateNextProductCode(),
      name: '',
      categoryId: categories[0]?.id || '',
      brand: '',
      description: '',
      unit: 'Packet',
      packageSize: '1 pack',
      currentStock: 0,
      minStock: 20,
      targetStock: 100,
      maxStock: 200,
      supplierId: suppliers[0]?.id || '',
      supplierProductCode: '',
      purchasePrice: 5.0,
      storageLocation: 'Aisle 1 - Shelf A',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const prodToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      code: formData.code || StorageService.generateNextProductCode(),
      name: formData.name,
      categoryId: formData.categoryId || categories[0]?.id || 'cat-1',
      brand: formData.brand || '',
      description: formData.description || '',
      unit: (formData.unit as UnitType) || 'Packet',
      packageSize: formData.packageSize || '1 pack',
      currentStock: Number(formData.currentStock) || 0,
      minStock: Number(formData.minStock) || 10,
      targetStock: Number(formData.targetStock) || 50,
      maxStock: Number(formData.maxStock) || 100,
      supplierId: formData.supplierId || suppliers[0]?.id || 'sup-1',
      supplierProductCode: formData.supplierProductCode || '',
      purchasePrice: Number(formData.purchasePrice) || 0,
      storageLocation: formData.storageLocation || 'Warehouse 1',
      qrCode: formData.code || StorageService.generateNextProductCode(),
      active: true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveProduct(prodToSave, currentUser);
    refreshProducts();
    setIsAddEditOpen(false);
  };

  const handleDeactivate = (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate "${name}"? Existing transaction history will be preserved.`)) {
      StorageService.deactivateProduct(id, currentUser);
      refreshProducts();
    }
  };

  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'Custom product category',
    };
    StorageService.saveCategory(cat);
    setFormData((prev) => ({ ...prev, categoryId: cat.id }));
    setNewCatName('');
    setNewCatDesc('');
    setShowAddCategoryModal(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="h-6 w-6 text-emerald-600" />
            <span>Product Master Catalog</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage cleaning products, categories, suppliers, reorder thresholds & QR codes ({filteredProducts.length} items)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
          >
            <PackagePlus className="h-4 w-4 text-amber-600" />
            <span>Request Unregistered Product</span>
          </button>

          {currentUser.role !== 'EMPLOYEE' && (
            <button
              onClick={() => setShowRequestsTab(!showRequestsTab)}
              className={`inline-flex items-center space-x-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                showRequestsTab
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <MessageSquareQuote className="h-4 w-4" />
              <span>Employee Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan QR & Issue</span>
          </button>

          <button
            onClick={() => setIsBatchLabelOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print QR Labels</span>
          </button>

          {currentUser.role !== 'EMPLOYEE' && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Unregistered Product Requests Panel (Admins/Supervisors view) */}
      {showRequestsTab && currentUser.role !== 'EMPLOYEE' && (
        <div className="rounded-2xl bg-amber-50/60 border-2 border-amber-200 p-5 space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <MessageSquareQuote className="h-5 w-5 text-amber-700" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Employee Unregistered Product Requests ({productRequests.length})
                </h3>
                <p className="text-[11px] text-amber-900/80">
                  Messages and item requests sent by staff for products not registered in the system catalog
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestsTab(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {productRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No unregistered product requests submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl bg-white p-4 border border-amber-200 shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">{req.productName}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.urgency === 'URGENT'
                            ? 'bg-rose-100 text-rose-800'
                            : req.urgency === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status === 'APPROVED' ? '✓ REGISTERED' : req.urgency}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      "{req.reason}"
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                      <div><strong>Requested By:</strong> {req.requestedByUserName}</div>
                      <div><strong>Site Needed:</strong> {req.siteName || 'All Sites'}</div>
                      <div><strong>Category:</strong> {req.category}</div>
                      <div><strong>Est. Quantity:</strong> {req.estimatedQuantity} {req.unit}</div>
                    </div>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                      <button
                        onClick={() => handleApproveRequestToProduct(req)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Approve & Register Item</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>Converted to registered inventory product</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, code, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="NORMAL">🟢 Normal Stock</option>
            <option value="LOW">🟠 Low Stock</option>
            <option value="REORDER">🔴 Reorder Required</option>
            <option value="OUT">⚫ Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Product Data Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Code / QR</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Current Stock</th>
                <th className="py-3.5 px-4 text-center">Min / Target</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Storage Location</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const status = StorageService.getStockStatus(p);
                  const cat = categories.find((c) => c.id === p.categoryId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span>{p.code}</span>
                        </div>
                      </td>

                      {/* Name & Brand */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <span>{p.brand} • {p.packageSize}</span>
                          {p.supplierProductCode && (
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              Sup. Item #: {p.supplierProductCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {cat?.name || 'General'}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-sm text-slate-900">
                          {p.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">{p.unit}s</span>
                      </td>

                      {/* Min / Target */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                        <span className="text-amber-700 font-semibold">{p.minStock}</span> /{' '}
                        <span className="text-slate-800 font-semibold">{p.targetStock}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            status === 'OUT_OF_STOCK'
                              ? 'bg-slate-900 text-white'
                              : status === 'REORDER_REQUIRED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : status === 'LOW'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {status === 'OUT_OF_STOCK'
                            ? '⚫ Out of Stock'
                            : status === 'REORDER_REQUIRED'
                            ? '🔴 Reorder'
                            : status === 'LOW'
                            ? '🟠 Low'
                            : '🟢 Normal'}
                        </span>
                      </td>

                      {/* Storage Location */}
                      <td className="py-3 px-4 text-slate-600 font-medium text-[11px]">
                        {p.storageLocation}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              if (onSelectProductForIssue) {
                                onSelectProductForIssue(p);
                              }
                            }}
                            title="Issue Stock (Stock OUT)"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition flex items-center space-x-0.5"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setViewingProduct(p)}
                            title="View Product Details & QR"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setLabelModalProduct(p)}
                            title="Print Product QR Label"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>

                          {currentUser.role !== 'EMPLOYEE' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                title="Edit Product"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handleDeactivate(p.id, p.name)}
                                title="Deactivate Product"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW PRODUCT DETAIL MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{viewingProduct.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{viewingProduct.code}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product QR Code Card */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Separate Product 2D QR Code</p>
                <ProductQRCode product={viewingProduct} size={150} showDetails={false} showActions={true} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Brand / Spec</p>
                  <p className="font-bold text-slate-800">{viewingProduct.brand || 'N/A'} ({viewingProduct.packageSize})</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Supplier Item #</p>
                  <p className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                    {viewingProduct.supplierProductCode || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Current Stock</p>
                  <p className="font-extrabold text-emerald-700 text-sm">
                    {viewingProduct.currentStock} {viewingProduct.unit}s
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Reorder / Target Level</p>
                  <p className="font-bold text-slate-800">
                    Min: {viewingProduct.minStock} | Target: {viewingProduct.targetStock}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Storage Location</p>
                  <p className="font-bold text-slate-800">{viewingProduct.storageLocation}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Description:</p>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  {viewingProduct.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    setLabelModalProduct(viewingProduct);
                    setViewingProduct(null);
                  }}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Print QR Label</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingProduct ? 'Edit Product Master' : 'Add New Cleaning Product'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Code (Unique ID)</label>
                  <input
                    type="text"
                    required
                    readOnly={!!editingProduct}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 px-3 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garbage Bags 75L"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Category & New Category button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                    >
                      + New Category
                    </button>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Safepack / KW"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Supplier Item Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Item Number / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SP-GB75 / SUP-9901"
                    value={formData.supplierProductCode || ''}
                    onChange={(e) => setFormData({ ...formData, supplierProductCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Packet">Packet</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Can">Can</option>
                    <option value="Roll">Roll</option>
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>

                {/* Package Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Package Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 25 pcs/pack, 1L bottle"
                    value={formData.packageSize}
                    onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Min / Reorder Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reorder Level (Minimum Stock)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Target Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Stock Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.targetStock}
                    onChange={(e) => setFormData({ ...formData, targetStock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Storage Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle 2 - Shelf B"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional specifications, chemical safety notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Category</h3>
            <form onSubmit={handleSaveNewCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KW Products / Microfiber Cloths"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of products in category"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT SINGLE LABEL MODAL */}
      <QRLabelModal
        isOpen={!!labelModalProduct}
        onClose={() => setLabelModalProduct(null)}
        product={labelModalProduct}
      />

      {/* PRINT BATCH LABELS MODAL */}
      <QRLabelModal
        isOpen={isBatchLabelOpen}
        onClose={() => setIsBatchLabelOpen(false)}
        batchProducts={filteredProducts}
      />

      {/* UNREGISTERED PRODUCT REQUEST MODAL */}
      <UnregisteredProductRequestModal
        isOpen={isRequestModalOpen}
        currentUser={currentUser}
        onClose={() => setIsRequestModalOpen(false)}
        onRequestSubmitted={refreshProductRequests}
      />
    </div>
  );
};
