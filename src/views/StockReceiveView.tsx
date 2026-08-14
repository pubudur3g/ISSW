import React, { useState } from 'react';
import {
  ArrowDownRight,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Product, Supplier, User } from '../types';
import { StorageService } from '../lib/storage';
import { QRScannerModal } from '../components/QRScannerModal';

interface StockReceiveViewProps {
  currentUser: User;
  onOpenScanner: () => void;
}

export const StockReceiveView: React.FC<StockReceiveViewProps> = ({
  currentUser,
  onOpenScanner,
}) => {
  const products = StorageService.getProducts().filter((p) => p.active);
  const suppliers = StorageService.getSuppliers().filter((s) => s.active);
  const settings = StorageService.getSettings();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products[0] || null
  );
  const [quantity, setQuantity] = useState<number>(50);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    products[0]?.supplierId || suppliers[0]?.id || ''
  );
  const [purchasePrice, setPurchasePrice] = useState<number>(
    products[0]?.purchasePrice || 0
  );
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setSelectedSupplierId(p.supplierId || suppliers[0]?.id || '');
    setPurchasePrice(p.purchasePrice || 0);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleConfirmStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setErrorMsg('Please select or scan a product.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity received must be greater than zero.');
      return;
    }

    const res = StorageService.receiveStock(
      selectedProduct.id,
      quantity,
      selectedSupplierId,
      currentUser,
      purchasePrice,
      invoiceNo,
      notes
    );

    if (res.success) {
      const updated = StorageService.getProductById(selectedProduct.id);
      if (updated) setSelectedProduct(updated);
      setSuccessMsg(res.message);
      setErrorMsg(null);
      setQuantity(50);
      setInvoiceNo('');
      setNotes('');
    } else {
      setErrorMsg(res.message);
      setSuccessMsg(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <ArrowDownRight className="h-6 w-6 text-emerald-600" />
            <span>Receive Stock (Stock IN)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Log incoming supplier shipments, update store balance and record purchase invoice costs
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
        >
          <QrCode className="h-4 w-4 text-emerald-400" />
          <span>Scan Product QR</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 flex items-center space-x-3 shadow-xs animate-scale-up">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">{successMsg}</p>
            <p className="text-xs text-emerald-700">Stock IN transaction recorded successfully.</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Select Product to Receive
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const p = products.find((prod) => prod.id === e.target.value);
                if (p) handleSelectProduct(p);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} (Current: {p.currentStock} {p.unit}s)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center space-x-2 rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
            >
              <QrCode className="h-4 w-4 text-emerald-600" />
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>

        {selectedProduct && (
          <div className="rounded-xl bg-emerald-950 p-5 text-white shadow-inner space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{selectedProduct.code}</span>
                <h3 className="text-lg font-extrabold text-white">{selectedProduct.name}</h3>
                <p className="text-xs text-emerald-200">{selectedProduct.brand} • {selectedProduct.packageSize}</p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                Current: {selectedProduct.currentStock} {selectedProduct.unit}s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-emerald-900">
              <div>
                <p className="text-[10px] text-emerald-300 font-bold uppercase">Target Level</p>
                <p className="font-bold text-sm text-white">{selectedProduct.targetStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-300 font-bold uppercase">Reorder Level</p>
                <p className="font-bold text-sm text-white">{selectedProduct.minStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-300 font-bold uppercase">Purchase Price</p>
                <p className="font-bold text-sm text-white">{settings.currency} {selectedProduct.purchasePrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleConfirmStockIn} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity Received */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Quantity Received ({selectedProduct?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-base font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1">
                <Truck className="h-3.5 w-3.5 text-blue-600" />
                <span>Supplier *</span>
              </label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1">
                <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                <span>Unit Purchase Price ({settings.currency})</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5 text-slate-600" />
                <span>Invoice / Delivery PO Number</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-98214"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Receipt Notes</label>
            <input
              type="text"
              placeholder="e.g. Delivered to Bay 2, checked for damages"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition flex items-center justify-center space-x-2"
          >
            <span>ADD STOCK TO INVENTORY</span>
            <ArrowDownRight className="h-5 w-5" />
          </button>
        </form>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedProd) => {
          handleSelectProduct(scannedProd);
        }}
      />
    </div>
  );
};
