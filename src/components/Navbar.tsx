import React, { useState } from 'react';
import {
  Store,
  Search,
  Bell,
  QrCode,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  Menu,
  ChevronDown,
  LogOut,
  Building2,
  Lock,
  KeyRound,
} from 'lucide-react';
import { User, AppNotification, UserRole } from '../types';
import { StorageService } from '../lib/storage';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  currentUser: User;
  onUserChange?: (user: User) => void;
  onSwitchUser?: (user: User) => void;
  onLogout?: () => void;
  onOpenScanner: () => void;
  onOpenNotifications?: () => void;
  onSelectNotifications?: () => void;
  onOpenGlobalSearch?: (term: string) => void;
  onToggleMobileSidebar: () => void;
  unreadCount?: number;
  unreadNotificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  onSwitchUser,
  onLogout,
  onOpenScanner,
  onOpenNotifications,
  onSelectNotifications,
  onOpenGlobalSearch,
  onToggleMobileSidebar,
  unreadCount = 0,
  unreadNotificationCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const users = StorageService.getUsers();
  const company = StorageService.getSettings();

  const userNotifs = StorageService.getNotificationsForUser(currentUser);
  const calculatedUnread = userNotifs.filter((n) => !n.read).length;
  const activeUnreadCount = unreadCount || unreadNotificationCount || calculatedUnread;

  const handleUserSwitch = onUserChange || onSwitchUser || (() => {});
  const handleOpenNotifs = onOpenNotifications || onSelectNotifications || (() => {});

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && onOpenGlobalSearch) {
      onOpenGlobalSearch(searchTerm.trim());
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SUPERVISOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FOREMAN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EMPLOYEE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Side: Mobile Menu Toggle & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Store className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">ISS Store</h1>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase truncate max-w-[200px]">
                {company.companyName || 'ISS Deep Cleaning and Grocery Store'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, codes (e.g. STK-000009), sites, employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </form>
        </div>

        {/* Right Side: Quick Action + Notifications + Direct Log Out + Role Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Scan Button */}
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan QR Code</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={handleOpenNotifs}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {activeUnreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {activeUnreadCount > 9 ? '9+' : activeUnreadCount}
              </span>
            )}
          </button>

          {/* Direct Top Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition shadow-2xs"
              title="Log Out / Lock Session"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          )}

          {/* Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50/60 p-1.5 pl-2.5 hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-2 text-left">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-lg object-cover ring-2 ring-emerald-500/30"
                />
                <div className="hidden xl:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                  <span
                    className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadge(
                      currentUser.role
                    )}`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-scale-up">
                <div className="border-b border-slate-100 p-2.5 mb-1 bg-slate-50/80 rounded-xl">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(
                      currentUser.role
                    )}`}
                  >
                    Current Role: {currentUser.role}
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 my-1">
                  Switch Role / Test Persona:
                </p>

                <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        handleUserSwitch(u);
                        setShowRoleMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl p-2 text-left text-xs transition ${
                        currentUser.id === u.id
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-md object-cover" />
                        <div>
                          <p className="text-xs font-semibold flex items-center space-x-1">
                            <span>{u.name}</span>
                            {(u.role === 'ADMIN' || u.role === 'SUPERVISOR' || u.role === 'FOREMAN') && (
                              <Lock className="h-3 w-3 text-purple-600" title="Password protected" />
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">{u.role}</p>
                        </div>
                      </div>
                      {currentUser.id === u.id ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        (u.role === 'ADMIN' || u.role === 'SUPERVISOR' || u.role === 'FOREMAN') && (
                          <span className="text-[9px] bg-slate-100 font-mono text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                            🔒 PIN
                          </span>
                        )
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-2 pt-2 space-y-1.5">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-purple-50 border border-purple-200 p-2 text-center text-xs font-bold text-purple-800 hover:bg-purple-100 transition shadow-2xs"
                  >
                    <KeyRound className="h-4 w-4 text-purple-600" />
                    <span>Change My Password / PIN</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout();
                      }}
                      className="flex w-full items-center justify-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-2 text-center text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out / Lock Session</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal for all users */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        currentUser={currentUser}
        onClose={() => setIsChangePasswordOpen(false)}
        onPasswordChanged={(updatedUser) => {
          if (onUserChange) onUserChange(updatedUser);
        }}
      />
    </header>
  );
};
