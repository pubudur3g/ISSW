import React, { useState } from 'react';
import { Send, X, PackagePlus, AlertCircle, Building2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { User, ProductRequest } from '../types';
import { StorageService } from '../lib/storage';

interface UnregisteredProductRequestModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

export const UnregisteredProductRequestModal: React.FC<UnregisteredProductRequestModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onRequestSubmitted,
}) => {
  const sites = StorageService.getSites();
  const categories = StorageService.getCategories();

  const [formData, setFormData] = useState({
    productName: '',
    category: categories[0]?.name || 'Chemicals',
    brand: '',
    suggestedSupplier: '',
    siteId: sites[0]?.id || '',
    estimatedQuantity: 0,
    unit: 'Bottle',
    reason: '',
    urgency: 'NORMAL' as 'NORMAL' | 'HIGH' | 'URGENT',
  });

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim() || !formData.reason.trim()) {
      alert('Please fill in the product name and reason for request.');
      return;
    }

    const selectedSite = sites.find((s) => s.id === formData.siteId);

    const newRequest: ProductRequest = {
      id: `req-${Date.now()}`,
      productName: formData.productName.trim(),
      category: formData.category,
      brand: formData.brand.trim() || 'General',
      suggestedSupplier: formData.suggestedSupplier.trim() || 'Any Partner Supplier',
      siteId: formData.siteId,
      siteName: selectedSite?.name || 'Central Warehouse',
      estimatedQuantity: formData.estimatedQuantity || 1,
      unit: formData.unit,
      reason: formData.reason.trim(),
      urgency: formData.urgency,
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      requestedByUserRole: currentUser.role,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    StorageService.saveProductRequest(newRequest, currentUser);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      if (onRequestSubmitted) onRequestSubmitted();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Request Unregistered Product</h3>
              <p className="text-[11px] text-slate-500">
                Send request to Admin & Supervisor to add a new stock item
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Request Sent to Admin!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your request for <strong>"{formData.productName}"</strong> has been transmitted to administrators and supervisors for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Can't find a chemical, mop, tool, or disposable item in system search? Submit details below to notify administrators.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Product Name / Item Description *
              </label>
              <input
                type="text"
                required
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g. Heavy Duty Grout Brush or KW Extra Floor Degreaser"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Tools & Equipment">Tools & Equipment</option>
                  <option value="Other / Special">Other / Special</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand / Model (Optional)</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Vileda, KW, SoftCare"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cleaning Site Needed For</label>
                <select
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.estimatedQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  >
                    <option value="Bottle">Bottle</option>
                    <option value="Box">Box</option>
                    <option value="Packet">Packet</option>
                    <option value="Piece">Piece</option>
                    <option value="Can">Can</option>
                    <option value="Roll">Roll</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Urgency & Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['NORMAL', 'HIGH', 'URGENT'] as const).map((urg) => (
                  <button
                    key={urg}
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: urg })}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border transition ${
                      formData.urgency === urg
                        ? urg === 'URGENT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : urg === 'HIGH'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {urg === 'URGENT' ? '🚨 URGENT' : urg === 'HIGH' ? '⚠️ HIGH' : '🟢 NORMAL'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Message / Reason for Request *
              </label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain why this product is needed, specific cleaning task, or site requirement..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-amber-700 transition flex items-center space-x-1.5"
              >
                <Send className="h-4 w-4" />
                <span>Send Request Message</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
