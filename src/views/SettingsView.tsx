import React, { useState } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  Building,
  DollarSign,
  Bell,
  KeyRound,
  Lock,
  ShieldCheck,
  Eraser,
  Eye,
  EyeOff,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { StorageService } from '../lib/storage';
import { User } from '../types';

interface SettingsViewProps {
  currentUser: User;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [savedMsg, setSavedMsg] = useState(false);

  // Password / PIN Change State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pinSavedMsg, setPinSavedMsg] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const isAdminOrSupervisor = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSavedMsg(false);

    const expected =
      currentUser.password || (currentUser.role === 'ADMIN' ? 'admin123' : '1234');

    if (currentPass.trim() !== expected) {
      setPinError('Current password / PIN is incorrect.');
      return;
    }

    if (!newPass.trim()) {
      setPinError('New password / PIN cannot be empty.');
      return;
    }

    if (newPass.trim().length < 3) {
      setPinError('New password / PIN should be at least 3 characters long.');
      return;
    }

    if (newPass.trim() !== confirmPass.trim()) {
      setPinError('New password and confirm password do not match.');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPass.trim(),
      isLocked: false,
    };

    StorageService.saveUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);
    StorageService.logAudit(
      currentUser,
      'Update Personal Password',
      'User',
      currentUser.id,
      currentUser.name,
      'Updated own login password / PIN'
    );

    setPinSavedMsg(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPinSavedMsg(false), 4000);
  };

  const handleEmptyStock = () => {
    if (confirm('Are you sure you want to zero out/empty all product stock quantities across the inventory?')) {
      StorageService.emptyAllStockValues(currentUser);
      window.location.reload();
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all inventory data, transactions, and settings to original seed state?')) {
      StorageService.resetToSeedData();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="h-6 w-6 text-slate-800" />
          <span>{isAdminOrSupervisor ? 'System & Security Settings' : 'My Account & Password Settings'}</span>
        </h2>
        <p className="text-xs text-slate-500">
          Manage your personal login credentials, PIN security, and system configuration
        </p>
      </div>

      {savedMsg && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <p className="font-bold text-sm">Settings saved successfully!</p>
        </div>
      )}

      {/* Personal PIN & Password Settings Card for All Users */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-extrabold">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Change My Password / PIN ({currentUser.name})
              </h3>
              <p className="text-[11px] text-slate-500">
                All users can change their own login credentials at any time
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-[10px] font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full uppercase tracking-wider">
            {currentUser.role} Account
          </span>
        </div>

        {pinSavedMsg && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-900 text-xs font-bold flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Your password / PIN has been updated successfully! You can now use your new password.</span>
          </div>
        )}

        {pinError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800 text-xs font-bold flex items-center space-x-2.5 animate-fade-in">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Current Password / PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current PIN..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-8 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                New Password / PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new PIN..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-8 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new PIN..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-8 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500">
              Username for login: <strong>{currentUser.name}</strong> • Email: <span className="font-mono">{currentUser.email}</span>
            </p>

            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-purple-600/30 active:scale-95 transition shrink-0"
            >
              <Lock className="h-4 w-4" />
              <span>Update My Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin / Supervisor Company Settings Form */}
      {isAdminOrSupervisor && (
        <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building className="h-4 w-4 text-emerald-600" />
              <span>Company Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Central Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={settings.stockLocation}
                  onChange={(e) => setSettings({ ...settings, stockLocation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Inventory & Currency Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">System Currency Symbol</label>
                <input
                  type="text"
                  required
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Default Delivery Lead Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={settings.expectedDeliveryDays}
                  onChange={(e) => setSettings({ ...settings, expectedDeliveryDays: parseInt(e.target.value) || 3 })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Bell className="h-4 w-4 text-amber-600" />
              <span>Alert Preferences</span>
            </h3>

            <div className="space-y-2 text-xs font-semibold text-slate-800">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableLowStockAlerts}
                  onChange={(e) => setSettings({ ...settings, enableLowStockAlerts: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Enable automatic low stock alerts when product drops below reorder level</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableOutOfStockAlerts}
                  onChange={(e) => setSettings({ ...settings, enableOutOfStockAlerts: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Enable critical out-of-stock red warnings</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEmptyStock}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
              >
                <Eraser className="h-4 w-4 text-amber-600" />
                <span>Empty All Stock Values</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset Database to Seed State</span>
              </button>
            </div>

            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 shadow-md transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
