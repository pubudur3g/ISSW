import React, { useState } from 'react';
import {
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Package,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Product, User } from '../types';
import { StorageService } from '../lib/storage';

interface StockAdjustmentViewProps {
  currentUser: User;
}

export const StockAdjustmentView: React.FC<StockAdjustmentViewProps> = ({ currentUser }) => {
  const products = StorageService.getProducts().filter((p) => p.active);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const [newPhysicalStock, setNewPhysicalStock] = useState<number>(
    selectedProduct ? selectedProduct.currentStock : 0
  );
  const [adjustmentType, setAdjustmentType] = useState<
    'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED' | 'LOST'
  >('ADJUSTMENT');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = products.find((prod) => prod.id === prodId);
    if (p) {
      setNewPhysicalStock(p.currentStock);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!reason.trim()) {
      setErrorMsg('A detailed reason is required for audit trail tracking.');
      return;
    }

    const res = StorageService.adjustStock(
      selectedProduct.id,
      newPhysicalStock,
      adjustmentType,
      reason.trim(),
      currentUser,
      notes
    );

    if (res.success) {
      setSuccessMsg(res.message);
      setErrorMsg(null);
      setReason('');
      setNotes('');
    } else {
      setErrorMsg(res.message);
      setSuccessMsg(null);
    }
  };

  if (currentUser.role === 'EMPLOYEE') {
    return (
      <div className="rounded-2xl bg-rose-50 p-8 border border-rose-200 text-center text-rose-900 space-y-3">
        <ShieldCheck className="h-12 w-12 text-rose-600 mx-auto" />
        <h3 className="font-extrabold text-lg">Access Restricted</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          Stock adjustments require Supervisor or Administrator privileges.
        </p>
      </div>
    );
  }

  const stockDelta = selectedProduct ? newPhysicalStock - selectedProduct.currentStock : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <SlidersHorizontal className="h-6 w-6 text-purple-600" />
          <span>Stock Adjustment & Auditing</span>
        </h2>
        <p className="text-xs text-slate-500">
          Reconcile physical stock counts, record damaged/expired items, and generate audit entries
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 flex items-center space-x-3 animate-scale-up">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Select Product *</label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-xs font-bold text-slate-900 focus:border-purple-500 focus:bg-white"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name} (System Stock: {p.currentStock} {p.unit}s)
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">System Stock</p>
              <p className="text-lg font-bold text-white">{selectedProduct.currentStock} {selectedProduct.unit}s</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">New Physical Stock</p>
              <p className="text-lg font-bold text-emerald-400">{newPhysicalStock} {selectedProduct.unit}s</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Variance Delta</p>
              <p className={`text-lg font-bold ${stockDelta < 0 ? 'text-rose-400' : stockDelta > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {stockDelta > 0 ? `+${stockDelta}` : stockDelta} {selectedProduct.unit}s
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleConfirmAdjustment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Physical Count */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Actual Physical Stock Count *</label>
              <input
                type="number"
                min="0"
                required
                value={newPhysicalStock}
                onChange={(e) => setNewPhysicalStock(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm font-extrabold text-slate-900 focus:border-purple-500"
              />
            </div>

            {/* Adjustment Reason Type */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Adjustment Reason Category *</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-bold text-slate-900 focus:border-purple-500"
              >
                <option value="ADJUSTMENT">Stock Count Correction</option>
                <option value="DAMAGED">Damaged Goods</option>
                <option value="EXPIRED">Expired Chemical / Product</option>
                <option value="LOST">Lost / Unaccounted</option>
              </select>
            </div>
          </div>

          {/* Detailed Reason text */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Detailed Audit Reason *</label>
            <input
              type="text"
              required
              placeholder="e.g. Physical inventory count discrepancy or bottle cracked in storage"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-purple-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Additional Notes</label>
            <input
              type="text"
              placeholder="e.g. Verified by Marcus Vance during monthly audit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-purple-500"
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
            className="w-full rounded-2xl bg-purple-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition"
          >
            CONFIRM STOCK ADJUSTMENT
          </button>
        </form>
      </div>
    </div>
  );
};
