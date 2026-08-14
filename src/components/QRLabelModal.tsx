import React, { useEffect, useState } from 'react';
import { Printer, Download, X, QrCode } from 'lucide-react';
import { Product } from '../types';
import { generateQRDataURL } from '../lib/qr';
import { StorageService } from '../lib/storage';

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  batchProducts?: Product[];
}

export const QRLabelModal: React.FC<QRLabelModalProps> = ({
  isOpen,
  onClose,
  product,
  batchProducts,
}) => {
  const [qrImages, setQrImages] = useState<{ [key: string]: string }>({});
  const company = StorageService.getSettings();

  const productsToPrint = product
    ? [product]
    : batchProducts && batchProducts.length > 0
    ? batchProducts
    : [];

  useEffect(() => {
    if (isOpen && productsToPrint.length > 0) {
      loadQRImages();
    }
  }, [isOpen, product, batchProducts]);

  const loadQRImages = async () => {
    const images: { [key: string]: string } = {};
    for (const p of productsToPrint) {
      images[p.id] = await generateQRDataURL(p.qrCode || p.code);
    }
    setQrImages(images);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Printable Product QR Labels</h3>
              <p className="text-xs text-slate-500">
                {productsToPrint.length === 1
                  ? `Label for ${productsToPrint[0]?.name}`
                  : `Batch QR Labels (${productsToPrint.length} Products)`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Labels</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Labels Sheet Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100/60 print:bg-white print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
            {productsToPrint.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border-2 border-slate-800 bg-white p-4 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden break-inside-avoid print:shadow-none print:border-slate-900"
              >
                {/* Header Band */}
                <div className="w-full border-b border-slate-200 pb-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {company.companyName}
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight mt-0.5 line-clamp-1">
                    {p.name}
                  </h4>
                </div>

                {/* QR Image */}
                <div className="my-2 bg-white p-2 rounded-lg border border-slate-100 shadow-inner">
                  {qrImages[p.id] ? (
                    <img
                      src={qrImages[p.id]}
                      alt={`QR ${p.code}`}
                      className="h-32 w-32 object-contain mx-auto"
                    />
                  ) : (
                    <div className="h-32 w-32 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                      Generating...
                    </div>
                  )}
                </div>

                {/* Code & Location */}
                <div className="w-full border-t border-slate-200 pt-2 mt-1 space-y-0.5">
                  <p className="font-mono font-extrabold text-slate-900 text-base tracking-wider">
                    {p.code}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Location: <strong className="text-slate-800">{p.storageLocation}</strong></span>
                    <span>Unit: <strong className="text-slate-800">{p.unit}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .fixed {
              position: static !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
