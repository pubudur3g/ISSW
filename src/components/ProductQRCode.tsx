import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, QrCode as QrIcon, Copy, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductQRCodeProps {
  product: Product;
  size?: number;
  showDetails?: boolean;
  showActions?: boolean;
}

export const ProductQRCode: React.FC<ProductQRCodeProps> = ({
  product,
  size = 160,
  showDetails = true,
  showActions = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // QR Code Payload: distinct JSON object or string containing product code, ID, name, and supplier code
  const qrPayload = JSON.stringify({
    code: product.code,
    id: product.id,
    name: product.name,
    qrCode: product.qrCode || product.code,
    supplierCode: product.supplierProductCode,
  });

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrPayload,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR Code:', error);
          if (canvasRef.current) {
            setDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [product, size, qrPayload]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${product.code}_${product.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(product.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=500,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Label - ${product.code}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; text-align: center; color: #1e293b; }
            .label-box { border: 2px solid #0f172a; border-radius: 12px; padding: 16px; max-width: 320px; margin: 0 auto; background: #ffffff; }
            .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #0f172a; }
            .code { font-family: monospace; font-size: 14px; font-weight: bold; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
            .meta { font-size: 11px; color: #64748b; margin-top: 8px; text-align: left; line-height: 1.4; border-top: 1px border-dash #cbd5e1; padding-top: 8px; }
            .qr-img { width: 180px; height: 180px; margin: 0 auto; display: block; }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="title">${product.name}</div>
            <div class="code">${product.code}</div>
            <img class="qr-img" src="${dataUrl}" alt="QR Code" />
            <div class="meta">
              <div><strong>Brand/Category:</strong> ${product.brand}</div>
              <div><strong>Location:</strong> ${product.storageLocation || 'Warehouse'}</div>
              <div><strong>Unit Size:</strong> ${product.packageSize} (${product.unit})</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
      <div className="relative group p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
        <canvas ref={canvasRef} className="rounded-lg shadow-2xs" />
      </div>

      {showDetails && (
        <div className="space-y-1 max-w-xs">
          <h4 className="font-extrabold text-slate-900 text-xs truncate">{product.name}</h4>
          <div className="flex items-center justify-center space-x-1">
            <span className="font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {product.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 text-slate-400 hover:text-slate-700 transition"
              title="Copy Product Code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 truncate">
            {product.brand} • {product.storageLocation || 'Main Shelf'}
          </p>
        </div>
      )}

      {showActions && (
        <div className="flex items-center space-x-2 pt-1 w-full justify-center">
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
            title="Download PNG QR Image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handlePrintLabel}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
            title="Print Shelf / Item Label"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Label</span>
          </button>
        </div>
      )}
    </div>
  );
};
