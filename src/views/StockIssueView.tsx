import React, { useState } from 'react';
import {
  QrCode,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  Search,
  Package,
  Layers,
  Sparkles,
  PackagePlus,
} from 'lucide-react';
import { Product, CleaningSite, User } from '../types';
import { StorageService } from '../lib/storage';
import { QRScannerModal } from '../components/QRScannerModal';
import { UnregisteredProductRequestModal } from '../components/UnregisteredProductRequestModal';

interface StockIssueViewProps {
  currentUser: User;
  onOpenScanner: () => void;
  preselectedProduct?: Product | null;
}

export const StockIssueView: React.FC<StockIssueViewProps> = ({
  currentUser,
  onOpenScanner,
  preselectedProduct,
}) => {
  const products = StorageService.getProducts().filter((p) => p.active);
  const sites = StorageService.getSites().filter((s) => s.active);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    preselectedProduct || products[0] || null
  );

  React.useEffect(() => {
    if (preselectedProduct) {
      setSelectedProduct(preselectedProduct);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIssuedResult(null);
    }
  }, [preselectedProduct]);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    currentUser.assignedSites[0] || sites[0]?.id || ''
  );
  const [notes, setNotes] = useState<string>('');

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isReqModalOpen, setIsReqModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [issuedResult, setIssuedResult] = useState<{
    productName: string;
    quantity: number;
    unit: string;
    siteName: string;
    newStock: number;
  } | null>(null);

  const handleProductSelect = (p: Product) => {
    setSelectedProduct(p);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIssuedResult(null);
    setQuantity(1);
  };

  const handleConfirmStockOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setErrorMsg('Please select a product first.');
      return;
    }
    if (!selectedSiteId) {
      setErrorMsg('Please select a cleaning site where the supplies will be used.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity taken must be at least 1.');
      return;
    }

    const res = StorageService.issueStock(
      selectedProduct.id,
      quantity,
      selectedSiteId,
      currentUser,
      notes
    );

    if (!res.success) {
      setErrorMsg(res.message);
      setSuccessMsg(null);
    } else {
      const siteObj = sites.find((s) => s.id === selectedSiteId);
      const updatedProd = StorageService.getProductById(selectedProduct.id);

      setIssuedResult({
        productName: selectedProduct.name,
        quantity,
        unit: selectedProduct.unit,
        siteName: siteObj?.name || 'Selected Site',
        newStock: updatedProd?.currentStock || 0,
      });

      setSuccessMsg(`✅ Stock successfully issued!`);
      setErrorMsg(null);
      setQuantity(1);
      setNotes('');
      if (updatedProd) setSelectedProduct(updatedProd);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <ArrowUpRight className="h-6 w-6 text-rose-600" />
            <span>Issue Stock (Stock OUT)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Scan QR code or search product to log items taken for cleaning sites (&lt;30 second workflow)
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
        >
          <QrCode className="h-4 w-4" />
          <span>Launch Camera Scanner</span>
        </button>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {issuedResult && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 shadow-md animate-scale-up text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-900">
              Stock Issued Successfully
            </span>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900">
              {issuedResult.quantity} {issuedResult.unit}(s) of {issuedResult.productName}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Assigned to: <strong className="text-slate-900">{issuedResult.siteName}</strong>
            </p>
            <p className="text-xs font-mono font-bold text-emerald-800 mt-2 bg-emerald-100 py-1.5 px-3 rounded-lg inline-block">
              Updated Stock Balance: {issuedResult.newStock} {issuedResult.unit}(s)
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan Next Product</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN ISSUE FORM CARD */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6">
        {/* Step 1: Select Product */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
              1. Select or Scan Product
            </label>
            <button
              type="button"
              onClick={() => setIsReqModalOpen(true)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline flex items-center space-x-1"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>Can't find product? Send Unregistered Request</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direct Product Dropdown */}
            <div className="relative">
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p) handleProductSelect(p);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} (Stock: {p.currentStock} {p.unit}s)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center space-x-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR Code with Camera</span>
            </button>
          </div>
        </div>

        {/* Selected Product Card Summary */}
        {selectedProduct && (
          <div className="rounded-xl bg-slate-900 p-5 text-white shadow-inner space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                  {selectedProduct.code}
                </span>
                <h3 className="text-lg font-extrabold text-white">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-300">
                  {selectedProduct.brand} • {selectedProduct.packageSize} • Location: {selectedProduct.storageLocation}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selectedProduct.currentStock <= selectedProduct.minStock
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {selectedProduct.currentStock <= selectedProduct.minStock ? 'LOW STOCK' : 'NORMAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Current Store Balance</p>
                <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  {selectedProduct.currentStock} <span className="text-xs text-white">{selectedProduct.unit}s</span>
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Reorder Level Threshold</p>
                <p className="text-xl font-extrabold text-amber-400 mt-0.5">
                  {selectedProduct.minStock} <span className="text-xs text-white">{selectedProduct.unit}s</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Issue Form Inputs */}
        <form onSubmit={handleConfirmStockOut} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity Taken */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Quantity Taken ({selectedProduct?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.currentStock || 100}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-base font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Cleaning Site */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>3. Select Cleaning Site *</span>
              </label>
              <select
                required
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Logged-in Employee Info */}
          <div className="flex items-center space-x-2 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700">
            <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Stock Issuer logged in as: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Optional Notes / Purpose</label>
            <input
              type="text"
              placeholder="e.g. Special floor buffing event or morning restock"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition flex items-center justify-center space-x-2"
          >
            <span>CONFIRM STOCK OUT</span>
            <ArrowUpRight className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedProd) => {
          handleProductSelect(scannedProd);
        }}
      />

      {/* Unregistered Product Request Modal */}
      <UnregisteredProductRequestModal
        isOpen={isReqModalOpen}
        currentUser={currentUser}
        onClose={() => setIsReqModalOpen(false)}
      />
    </div>
  );
};
