import React from 'react';
import {
  LayoutDashboard,
  Package,
  QrCode,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  ShoppingCart,
  History,
  Users,
  Building2,
  Truck,
  BarChart3,
  ShieldCheck,
  Bell,
  Settings,
  X,
  Store,
  Sparkles,
} from 'lucide-react';
import { UserRole, User, isUserInDeepCleaningTeam } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'products'
  | 'scan'
  | 'stock-in'
  | 'stock-out'
  | 'adjustment'
  | 'reorder'
  | 'transactions'
  | 'employees'
  | 'sites'
  | 'suppliers'
  | 'reports'
  | 'audit'
  | 'notifications'
  | 'settings'
  | 'deep-cleaning';

interface SidebarProps {
  role?: UserRole;
  currentUserRole?: UserRole;
  currentUser?: User | null;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unreadCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentUserRole,
  currentUser,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  unreadCount = 0,
  lowStockCount = 0,
}) => {
  const userRole = role || currentUserRole || currentUser?.role || 'ADMIN';
  const isEmployee = userRole === 'EMPLOYEE';
  const isDeepCleaningMember = isUserInDeepCleaningTeam(currentUser);

  const menuItems = [
    {
      id: 'deep-cleaning',
      label: 'Deep Cleaning',
      icon: Sparkles,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN', 'EMPLOYEE'],
      isDeepCleaningOnly: true,
      isPurpleTab: true,
    },
    {
      id: 'dashboard',
      label: 'Grocery Store Dashboard',
      icon: Store,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN'],
    },
    {
      id: 'products',
      label: 'Products Catalog (Stock in Hand)',
      icon: Package,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN'],
    },
    {
      id: 'scan',
      label: 'Scan QR & Quick Issue',
      icon: QrCode,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'stock-in',
      label: 'Receive Stock (IN)',
      icon: ArrowDownRight,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'stock-out',
      label: 'Issue Stock (OUT)',
      icon: ArrowUpRight,
      roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
    },
    {
      id: 'adjustment',
      label: 'Stock Adjustments',
      icon: SlidersHorizontal,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'reorder',
      label: isEmployee ? 'Stock Request' : 'Reorder & POs',
      icon: ShoppingCart,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN', 'EMPLOYEE'],
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'transactions',
      label: 'Transactions History',
      icon: History,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN'],
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'sites',
      label: 'Cleaning Sites',
      icon: Building2,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'reports',
      label: 'Reports & Foreman Presentation',
      icon: BarChart3,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN'],
    },
    {
      id: 'audit',
      label: 'Audit Trail Logs',
      icon: ShieldCheck,
      roles: ['ADMIN'],
    },
    {
      id: 'notifications',
      label: 'Alerts & Messages',
      icon: Bell,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN', 'EMPLOYEE'],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'settings',
      label: isEmployee ? 'My Security & PIN' : 'Company Settings & PIN',
      icon: Settings,
      roles: ['ADMIN', 'SUPERVISOR', 'FOREMAN', 'EMPLOYEE'],
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (item.isDeepCleaningOnly) {
      return isDeepCleaningMember;
    }
    return item.roles.includes(userRole);
  });

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 bg-slate-900 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 pt-2 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-tight leading-none">ISS Store</h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Deep Cleaning &amp; Grocery</p>
              <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold mt-1 ${
                userRole === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-300'
                  : userRole === 'SUPERVISOR'
                  ? 'bg-blue-500/20 text-blue-300'
                  : userRole === 'FOREMAN'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {userRole} Mode
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1 custom-scrollbar">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPurple = (item as any).isPurpleTab || item.id === 'deep-cleaning';

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as ActiveTab);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition group ${
                  isPurple
                    ? isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/80 font-bold'
                      : 'bg-purple-950/40 text-purple-300 border border-purple-700/50 hover:bg-purple-900/50 hover:text-purple-100 shadow-xs'
                    : isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isPurple
                        ? isActive
                          ? 'text-white'
                          : 'text-purple-300 group-hover:text-purple-200'
                        : isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className={`truncate ${isPurple ? 'font-bold' : ''}`}>{item.label}</span>
                </div>

                {isPurple && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      isActive
                        ? 'bg-white text-purple-700'
                        : 'bg-purple-700 text-white shadow-xs'
                    }`}
                  >
                    TEAM
                  </span>
                )}

                {item.badge !== undefined && !isPurple && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-emerald-800'
                        : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Footer Card */}
      <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700/60 mt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Status</p>
        <p className="text-xs font-semibold text-slate-200 mt-0.5">Online • Real-time DB Sync</p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">ISS Cleaning & Grocery OS</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-slate-800 bg-slate-900 min-h-[calc(100vh-64px)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
