import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, Search, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { StorageService } from '../lib/storage';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (product: Product) => void;
  title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Product QR Code',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScannedProduct(null);
      setSearchError(null);
      setManualCode('');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to access device camera.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleFoundCode(code.data);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleFoundCode = (codeStr: string) => {
    stopCamera();
    const cleanCode = codeStr.trim();
    let product = StorageService.getProductByCode(cleanCode);

    if (product) {
      setScannedProduct(product);
      setSearchError(null);
      setTimeout(() => {
        onScanSuccess(product);
        onClose();
      }, 600);
    } else {
      setSearchError(`No product found matching "${cleanCode}".`);
      startCamera(); // Resume scanning
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const product = StorageService.getProductByCode(manualCode.trim());
    if (product) {
      setScannedProduct(product);
      setSearchError(null);
      stopCamera();
      setTimeout(() => {
        onScanSuccess(product);
        onClose();
      }, 500);
    } else {
      setSearchError(`Product "${manualCode}" not found. Try searching by name (e.g. Gloves, Bag, KW) or code (e.g. STK-000001).`);
    }
  };

  const allProducts = StorageService.getProducts().filter((p) => p.active);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
              <p className="text-xs text-slate-500">Scan product label or select from list</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 space-y-5">
          {scannedProduct ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-center animate-scale-up">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md mb-3">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">QR Code Matched!</p>
              <h4 className="mt-1 text-xl font-bold text-slate-900">{scannedProduct.name}</h4>
              <p className="text-sm text-slate-600 font-mono mt-0.5">{scannedProduct.code} • Stock: {scannedProduct.currentStock} {scannedProduct.unit}s</p>
            </div>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 shadow-inner flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* QR Framing Overlay */}
              {cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative h-48 w-48 rounded-xl border-2 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                    <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
                    <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/70 shadow-emerald-400 shadow-sm animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Camera Fallback State */}
              {!cameraActive && (
                <div className="p-6 text-center text-slate-300 space-y-3">
                  <Camera className="mx-auto h-10 w-10 text-slate-500" />
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {cameraError || 'Camera stream unavailable in this preview environment. You can enter or select the Product Code below.'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center space-x-2 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Try Camera Again</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {searchError && (
            <div className="flex items-center space-x-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Manual Code Entry */}
          <form onSubmit={handleManualSearch} className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Or Enter Product Code / Scan Barcode Manually:
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. STK-000009 or Gloves Size 9"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition flex items-center space-x-1"
              >
                <span>Find</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Select Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">Quick Select Inventory Items ({allProducts.length}):</p>
              <span className="text-[10px] text-slate-400">Tap item to issue/receive</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {allProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleFoundCode(prod.code)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-left text-xs hover:border-emerald-500 hover:bg-emerald-50/70 transition group shadow-2xs"
                >
                  <div className="truncate pr-1">
                    <p className="font-bold text-slate-900 group-hover:text-emerald-700 truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{prod.code}</p>
                  </div>
                  <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold shrink-0 ${
                    prod.currentStock <= prod.minStock
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {prod.currentStock} {prod.unit[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
