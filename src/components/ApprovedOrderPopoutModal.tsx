import React from 'react';
import { CheckCircle2, X, Package, Hash, User, Calendar, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { PurchaseOrder, User as UserType } from '../types';

interface ApprovedOrderPopoutModalProps {
  isOpen: boolean;
  order: PurchaseOrder | null;
  currentUser: UserType;
  onClose: () => void;
  onOpenForemanReport: () => void;
}

export const ApprovedOrderPopoutModal: React.FC<ApprovedOrderPopoutModalProps> = ({
  isOpen,
  order,
  currentUser,
  onClose,
  onOpenForemanReport,
}) => {
  if (!isOpen || !order) return null;

  const totalUnits = order.items.reduce((acc, i) => acc + i.orderedQuantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-emerald-200 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with celebratory green badge */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
                <CheckCircle2 className="h-7 w-7 text-emerald-200" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 border border-emerald-300/30 mb-1">
                  Order Approved & Added to Foreman List
                </span>
                <h3 className="text-xl font-black tracking-tight text-white">
                  Order Request Approved!
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  PO: <span className="font-mono font-bold text-white">{order.poNumber}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Requested By</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">
                {order.requestedByUserName || 'Employee'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Approved By</p>
              <p className="font-bold text-emerald-700 truncate mt-0.5">
                {order.approvedByUserName || currentUser.name}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Total Quantity</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {totalUnits} Units ({order.items.length} SKUs)
              </p>
            </div>
          </div>

          {/* Simple Item List (Item name, Supplier Code, Quantity) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Approved Items for Foreman Report ({order.items.length})
              </h4>
              <span className="text-[11px] text-slate-500">Foreman: Pasi Ylitalo</span>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 leading-tight">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Supplier Code: <span className="font-semibold text-slate-700">{item.productCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200">
                      {item.orderedQuantity} {item.unit || 'Unit'}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-start space-x-2 text-xs text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              This order has been officially approved and automatically aggregated into the <strong>Weekly Total Order Requests List for Foreman (Pasi Ylitalo)</strong>.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Dismiss Popout
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenForemanReport();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <FileText className="h-4 w-4" />
            <span>Open Foreman Weekly Report</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
