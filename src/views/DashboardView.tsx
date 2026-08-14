import React, { useState } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  ShoppingCart,
  QrCode,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
  Users,
  PackagePlus,
  Clock,
  Send,
  X,
  Check,
  FileText,
  ShieldCheck,
  ExternalLink,
  Layers,
  Store,
  ArrowRight,
} from 'lucide-react';
import { UnregisteredProductRequestModal } from '../components/UnregisteredProductRequestModal';
import { ApprovedOrderPopoutModal } from '../components/ApprovedOrderPopoutModal';
import { WeeklyForemanReportModal } from '../components/WeeklyForemanReportModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Product, StockTransaction, User, StockStatus, UserRole, PurchaseOrder, ProductRequest } from '../types';
import { StorageService } from '../lib/storage';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (tab: any) => void;
  onOpenScanner: () => void;
  onSelectProductForPO?: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenScanner,
}) => {
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [isForemanReportOpen, setIsForemanReportOpen] = useState(false);
  const [popoutOrder, setPopoutOrder] = useState<PurchaseOrder | null>(null);
  const [isPopoutModalOpen, setIsPopoutModalOpen] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(StorageService.getPurchaseOrders());
  const [productRequests, setProductRequests] = useState<ProductRequest[]>(StorageService.getProductRequests());

  const products = StorageService.getProducts().filter((p) => p.active);
  const transactions = StorageService.getTransactions();
  const settings = StorageService.getSettings();

  const isSupervisorOrAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';
  const isForeman = currentUser.role === 'FOREMAN';

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingPOs = purchaseOrders.filter((po) => po.status === 'Pending Approval');
  const approvedPOs = purchaseOrders.filter((po) => po.status === 'Approved' || po.status === 'Ordered');
  const recentlyApprovedPOs = approvedPOs.slice(0, 3);
  const pendingProductRequests = productRequests.filter((r) => r.status === 'PENDING');

  const refreshDashboardData = () => {
    setPurchaseOrders(StorageService.getPurchaseOrders());
    setProductRequests(StorageService.getProductRequests());
  };

  const handleApprovePO = (po: PurchaseOrder) => {
    po.status = 'Approved';
    po.approvedByUserId = currentUser.id;
    po.approvedByUserName = currentUser.name;
    StorageService.savePurchaseOrder(po, currentUser);

    const now = new Date();
    StorageService.addNotification({
      id: `notif-po-approved-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'RECEIPT',
      message: `✅ Purchase Order ${po.poNumber} requested by ${po.requestedByUserName || 'Employee'} was APPROVED by ${currentUser.name}. Added to Foreman report.`,
      read: false,
      severity: 'success',
    });

    refreshDashboardData();

    // Trigger celebratory popout modal
    setPopoutOrder(po);
    setIsPopoutModalOpen(true);
  };

  const handleRejectPO = (po: PurchaseOrder) => {
    po.status = 'Cancelled';
    StorageService.savePurchaseOrder(po, currentUser);

    const now = new Date();
    StorageService.addNotification({
      id: `notif-po-rejected-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'PRODUCT_REQUEST',
      message: `❌ Order request ${po.poNumber} requested by ${po.requestedByUserName || 'Employee'} was REJECTED by ${currentUser.name}.`,
      read: false,
      severity: 'error',
    });

    refreshDashboardData();
  };

  const handleApproveReq = (req: ProductRequest) => {
    req.status = 'APPROVED';
    req.reviewedByUserId = currentUser.id;
    req.reviewedByUserName = currentUser.name;
    StorageService.saveProductRequest(req, currentUser);

    const now = new Date();
    StorageService.addNotification({
      id: `notif-req-approved-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'PRODUCT_REQUEST',
      message: `✅ Unregistered product request for "${req.productName}" requested by ${req.requestedByUserName} was APPROVED by ${currentUser.name}.`,
      read: false,
      severity: 'success',
    });

    refreshDashboardData();
  };

  const handleRejectReq = (req: ProductRequest) => {
    req.status = 'REJECTED';
    req.reviewedByUserId = currentUser.id;
    req.reviewedByUserName = currentUser.name;
    StorageService.saveProductRequest(req, currentUser);

    const now = new Date();
    StorageService.addNotification({
      id: `notif-req-rejected-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      type: 'PRODUCT_REQUEST',
      message: `❌ Unregistered product request for "${req.productName}" requested by ${req.requestedByUserName} was REJECTED by ${currentUser.name}.`,
      read: false,
      severity: 'error',
    });

    refreshDashboardData();
  };

  const handlePopoutOrderClick = (po: PurchaseOrder) => {
    setPopoutOrder(po);
    setIsPopoutModalOpen(true);
  };

  // Metric Calculations
  const totalProducts = products.length;
  const totalStockItems = products.reduce((acc, p) => acc + p.currentStock, 0);

  const outOfStockItems = products.filter((p) => p.currentStock <= 0);
  const reorderRequiredItems = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minStock
  );
  const lowStockItems = products.filter(
    (p) => p.currentStock > p.minStock && p.currentStock <= p.minStock * 1.25
  );
  const normalStockItems = products.filter((p) => p.currentStock > p.minStock * 1.25);

  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  const receivedToday = transactions
    .filter((t) => t.type === 'IN' && t.date === todayStr)
    .reduce((acc, t) => acc + t.quantity, 0);

  const issuedToday = transactions
    .filter((t) => t.type === 'OUT' && t.date === todayStr)
    .reduce((acc, t) => acc + t.quantity, 0);

  const issuedThisMonth = transactions
    .filter((t) => t.type === 'OUT' && t.date.startsWith(currentMonthPrefix))
    .reduce((acc, t) => acc + t.quantity, 0);

  const totalStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );

  // Chart Data 1: Stock IN vs Stock OUT Monthly
  const monthlyData = [
    { month: 'May', in: 420, out: 380 },
    { month: 'Jun', in: 550, out: 490 },
    { month: 'Jul', in: 610, out: 580 },
    { month: 'Aug', in: receivedToday + 350, out: issuedThisMonth },
  ];

  // Chart Data 2: Top Frequently Used Products
  const productUsageMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'OUT')
    .forEach((t) => {
      productUsageMap[t.productName] = (productUsageMap[t.productName] || 0) + t.quantity;
    });

  const topUsedProducts = Object.keys(productUsageMap)
    .map((name) => ({ name, quantity: productUsageMap[name] }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  if (topUsedProducts.length === 0) {
    topUsedProducts.push(
      { name: 'Garbage Bags 75L', quantity: 145 },
      { name: 'Gloves Size 9', quantity: 112 },
      { name: 'Hand Paper Packets', quantity: 95 },
      { name: 'Toilet Paper Boxes', quantity: 48 },
      { name: 'Sure Washroom Cleaner', quantity: 38 }
    );
  }

  // Chart Data 3: Usage by Cleaning Site
  const siteUsageMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'OUT' && t.siteName)
    .forEach((t) => {
      siteUsageMap[t.siteName!] = (siteUsageMap[t.siteName!] || 0) + t.quantity;
    });

  const siteUsageData = Object.keys(siteUsageMap).map((site) => ({
    name: site.replace(/\s*\([^)]*\)/, ''),
    value: siteUsageMap[site],
  }));

  if (siteUsageData.length === 0) {
    siteUsageData.push(
      { name: 'Site A HQ', value: 85 },
      { name: 'Grand Horizon Hotel', value: 120 },
      { name: 'Tech Hub Office A', value: 64 },
      { name: 'Grand Galleria', value: 92 },
      { name: 'St. Jude Academy', value: 45 }
    );
  }

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Chart Data 4: Employee Usage
  const employeeUsageMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'OUT' && t.employeeName)
    .forEach((t) => {
      employeeUsageMap[t.employeeName!] = (employeeUsageMap[t.employeeName!] || 0) + t.quantity;
    });

  const employeeUsageData = Object.keys(employeeUsageMap).map((emp) => ({
    name: emp,
    quantity: employeeUsageMap[emp],
  }));

  if (employeeUsageData.length === 0) {
    employeeUsageData.push(
      { name: 'John Doe', quantity: 150 },
      { name: 'Elena Rostova', quantity: 135 },
      { name: 'Marcus Vance', quantity: 42 }
    );
  }

  // Approaching Reorder Products
  const criticalProducts = [...outOfStockItems, ...reorderRequiredItems];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
              🛒 GROCERY STORE • STOCK MANAGEMENT
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {settings.companyName} • {currentUser.role}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            Welcome back, {currentUser.name}! 👋
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isForeman
              ? 'Foreman Overview: Track stock in hand summary, low stock alerts, approved orders, and weekly reports.'
              : 'Real-time cleaning store inventory, stock transactions, QR code operations, and automatic reorder forecasts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {(isForeman || isSupervisorOrAdmin) && (
            <button
              onClick={() => setIsForemanReportOpen(true)}
              className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
            >
              <FileText className="h-4 w-4" />
              <span>Foreman Weekly Report</span>
            </button>
          )}

          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan QR & Issue</span>
          </button>
          <button
            onClick={() => onNavigate('stock-out')}
            className="inline-flex items-center space-x-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 backdrop-blur-xs transition"
          >
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span>Issue Stock (OUT)</span>
          </button>
          <button
            onClick={() => setIsReqModalOpen(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Request Unregistered Product</span>
          </button>
        </div>
      </div>

      {/* APPROVED ORDERS POPOUT NOTIFICATION BANNER (When supervisors or admin approve an order) */}
      {approvedPOs.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 p-5 shadow-md space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-extrabold shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-emerald-950 text-sm sm:text-base">
                    Approved Order Requests (Popout & Foreman Ready)
                  </h3>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase">
                    {approvedPOs.length} Approved
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Orders approved by Supervisors/Admin aggregated for <strong>Foreman (Pasi Ylitalo)</strong> weekly report
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsForemanReportOpen(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
              >
                <FileText className="h-4 w-4" />
                <span>View Full Foreman Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentlyApprovedPOs.map((po) => {
              const totalItems = po.items.reduce((acc, i) => acc + i.orderedQuantity, 0);
              return (
                <div
                  key={po.id}
                  onClick={() => handlePopoutOrderClick(po)}
                  className="cursor-pointer rounded-xl bg-white border border-emerald-300 p-3.5 shadow-xs hover:shadow-md hover:border-emerald-500 transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-900">{po.poNumber}</span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Approved
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="truncate">
                      <strong>Requested by:</strong> {po.requestedByUserName || 'Employee'}
                    </p>
                    <p className="truncate text-emerald-700 font-semibold">
                      <strong>Approved by:</strong> {po.approvedByUserName || 'Supervisor / Admin'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {po.items.length} Product SKUs ({totalItems} Units)
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:underline">
                    <span>Pop out details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PENDING EMPLOYEE ORDER REQUESTS (Visible to Supervisors & Admins) */}
      {isSupervisorOrAdmin && (pendingPOs.length > 0 || pendingProductRequests.length > 0) && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-6 space-y-4 shadow-md animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-extrabold shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm sm:text-base">
                  Pending Employee Order Requests ({pendingPOs.length + pendingProductRequests.length})
                </h3>
                <p className="text-xs text-amber-800">
                  Orders submitted by employees awaiting Supervisor / Admin approval
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reorder')}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 text-xs font-bold text-amber-950 transition"
            >
              <span>View All in Reorder Tab</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Pending Purchase Orders */}
            {pendingPOs.map((po) => (
              <div key={po.id} className="rounded-xl bg-white border border-amber-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-slate-900">{po.poNumber}</span>
                    <span className="ml-2 text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      Requested by: {po.requestedByUserName || 'Employee'}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">• Date: {po.date}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprovePO(po)}
                      className="inline-flex items-center space-x-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectPO(po)}
                      className="inline-flex items-center space-x-1 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-rose-100 hover:text-rose-700 transition"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {po.items.map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-600 font-mono">
                        Supplier Code: <strong>{item.productCode}</strong> | Qty: <strong>{item.orderedQuantity} {item.unit}s</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pending Unregistered Product Requests */}
            {pendingProductRequests.map((req) => (
              <div key={req.id} className="rounded-xl bg-white border border-amber-200 p-4 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-xs text-slate-900">📦 {req.productName}</span>
                    <span className="ml-2 text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      Requested by: {req.requestedByUserName}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">• Site: {req.siteName}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApproveReq(req)}
                      className="inline-flex items-center space-x-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve Request</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectReq(req)}
                      className="inline-flex items-center space-x-1 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-rose-100 hover:text-rose-700 transition"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Est. Qty: <strong>{req.estimatedQuantity} {req.unit}</strong> | Category: {req.category} | Urgency: <span className="font-bold text-amber-700">{req.urgency}</span>
                </p>
                <p className="text-xs text-slate-500 italic">Reason: "{req.reason}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOREMAN QUICK HUB (STOCK IN HAND & REPORT CENTER) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-extrabold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Stock Summary & Stock in Hand Details
              </h3>
              <p className="text-xs text-slate-500">
                Key inventory summary for Foreman (Pasi Ylitalo) and management reports
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
            >
              <span>View All Reports</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsForemanReportOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
            >
              <FileText className="h-4 w-4" />
              <span>Weekly Foreman Report</span>
            </button>
          </div>
        </div>

        {/* Stock in Hand Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Active SKUs</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{totalProducts} Products</p>
            <p className="text-[11px] text-slate-500 mt-0.5">5 Storage Categories</p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800">Total Stock in Hand</p>
            <p className="text-xl font-extrabold text-emerald-950 mt-1">{totalStockItems.toLocaleString()} Units</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Issued today: {issuedToday} units</p>
          </div>

          <div className="rounded-xl bg-blue-50 p-3.5 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800">Monthly Usage (OUT)</p>
            <p className="text-xl font-extrabold text-blue-950 mt-1">{issuedThisMonth.toLocaleString()} Units</p>
            <p className="text-[11px] text-blue-700 mt-0.5">Received today: {receivedToday} units</p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800">Reorder & Low Stock</p>
            <p className="text-xl font-extrabold text-amber-950 mt-1">{outOfStockItems.length + reorderRequiredItems.length} Alerts</p>
            <p className="text-[11px] text-amber-700 mt-0.5">{outOfStockItems.length} out of stock</p>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalProducts}</p>
          <p className="text-[11px] text-slate-500 mt-1">Across 5 Categories</p>
        </div>

        {/* Total Stock Units */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Stock Units
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalStockItems.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Issued today: {issuedToday} units
          </p>
        </div>

        {/* Low / Reorder Items */}
        <div
          onClick={() => onNavigate('reorder')}
          className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low & Reorder Alert
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">
            {outOfStockItems.length + reorderRequiredItems.length} items
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {outOfStockItems.length} Out of Stock • {reorderRequiredItems.length} Low
          </p>
        </div>

        {/* Issued This Month */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Issued This Month
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{issuedThisMonth}</p>
          <p className="text-[11px] text-slate-500 mt-1">Received today: {receivedToday} units</p>
        </div>
      </div>

      {/* Stock Health Breakdown Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Normal */}
        <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              🟢 Normal Stock
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-950">{normalStockItems.length}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Sufficient stock levels</p>
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              🟠 Low Stock
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-950">{lowStockItems.length}</p>
          <p className="text-[11px] text-amber-700 font-medium">Approaching reorder level</p>
        </div>

        {/* Reorder Required */}
        <div
          onClick={() => onNavigate('reorder')}
          className="cursor-pointer rounded-2xl bg-rose-50/70 p-4 border border-rose-200 hover:bg-rose-100/80 transition"
        >
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
              🔴 Reorder Required
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-950">{reorderRequiredItems.length}</p>
          <p className="text-[11px] text-rose-700 font-bold underline">Action required ➔</p>
        </div>

        {/* Out of Stock */}
        <div className="rounded-2xl bg-slate-100 p-4 border border-slate-300">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-slate-900"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              ⚫ Out of Stock
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{outOfStockItems.length}</p>
          <p className="text-[11px] text-slate-600 font-medium">0 units remaining</p>
        </div>
      </div>

      {/* LOW STOCK ALERTS SECTION */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">LOW STOCK & REORDER ALERTS</h3>
              <p className="text-xs text-slate-500">Products currently below or near reorder minimums</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('reorder')}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Generate Reorder POs</span>
          </button>
        </div>

        {criticalProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800">All stock levels healthy!</p>
            <p className="text-xs text-slate-500">No products require immediate reordering.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalProducts.map((prod) => {
              const status = StorageService.getStockStatus(prod);
              const suggestedOrder = Math.max(0, prod.targetStock - prod.currentStock);

              return (
                <div
                  key={prod.id}
                  className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 transition ${
                    status === 'OUT_OF_STOCK'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-rose-50/50 border-rose-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                        {prod.code}
                      </span>
                      <h4 className="font-bold text-sm leading-snug">{prod.name}</h4>
                      <p className="text-xs opacity-80">{prod.brand} • {prod.packageSize}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        status === 'OUT_OF_STOCK'
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {status === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'REORDER REQUIRED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center rounded-lg bg-black/5 p-2 text-xs">
                    <div>
                      <p className="text-[10px] opacity-70">Current</p>
                      <p className="font-bold text-sm">{prod.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70">Reorder Level</p>
                      <p className="font-bold text-sm">{prod.minStock}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70">Suggested Order</p>
                      <p className="font-bold text-sm text-emerald-600">{suggestedOrder}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] opacity-80">Target: {prod.targetStock} {prod.unit}s</span>
                    <button
                      onClick={() => onNavigate('reorder')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        status === 'OUT_OF_STOCK'
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Stock IN vs OUT */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Stock IN vs Stock OUT</h3>
              <p className="text-xs text-slate-500">Monthly movement volume comparison</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="in" name="Stock IN" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="out" name="Stock OUT" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Frequently Used Products */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Most Frequently Used Products</h3>
              <p className="text-xs text-slate-500">Top 5 consumed items by unit count</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUsedProducts} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="quantity" name="Units Issued" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stock Usage by Cleaning Site */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>Stock Usage by Cleaning Site</span>
              </h3>
              <p className="text-xs text-slate-500">Distribution of items issued across sites</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={siteUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {siteUsageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Employee Usage */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Stock Usage by Employee</span>
              </h3>
              <p className="text-xs text-slate-500">Total items requested/taken per employee</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="quantity" name="Total Items Issued" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Unregistered Product Request Modal */}
      <UnregisteredProductRequestModal
        isOpen={isReqModalOpen}
        currentUser={currentUser}
        onClose={() => setIsReqModalOpen(false)}
      />

      {/* Approved Order Popout Modal */}
      <ApprovedOrderPopoutModal
        isOpen={isPopoutModalOpen}
        order={popoutOrder}
        currentUser={currentUser}
        onClose={() => setIsPopoutModalOpen(false)}
        onOpenForemanReport={() => setIsForemanReportOpen(true)}
      />

      {/* Weekly Foreman Report Presentation Modal */}
      <WeeklyForemanReportModal
        isOpen={isForemanReportOpen}
        currentUser={currentUser}
        onClose={() => setIsForemanReportOpen(false)}
      />
    </div>
  );
};
