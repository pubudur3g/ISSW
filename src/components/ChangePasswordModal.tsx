import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../types';
import { StorageService } from '../lib/storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onPasswordChanged?: (updatedUser: User) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const userExpectedPassword =
      currentUser.password || (currentUser.role === 'ADMIN' ? 'admin123' : '1234');

    // 1. Verify current password
    if (currentPassword.trim() !== userExpectedPassword) {
      setError('Current password / PIN is incorrect. Please try again.');
      return;
    }

    // 2. Validate new password
    if (!newPassword.trim()) {
      setError('New password / PIN cannot be empty.');
      return;
    }

    if (newPassword.trim().length < 3) {
      setError('Password / PIN should be at least 3 characters or digits long.');
      return;
    }

    // 3. Check matching confirmation
    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser: User = {
        ...currentUser,
        password: newPassword.trim(),
        isLocked: false,
      };

      StorageService.saveUser(updatedUser);
      StorageService.setCurrentUser(updatedUser);
      StorageService.logAudit(
        currentUser,
        'Change Personal Password',
        'User',
        currentUser.id,
        currentUser.name,
        'Updated personal security password'
      );

      setSuccessMsg('Your password / PIN has been updated successfully!');
      if (onPasswordChanged) {
        onPasswordChanged(updatedUser);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
        onClose();
      }, 1400);
    } catch (err) {
      setError('Failed to update password. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Change My Password / PIN
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Update login credentials for {currentUser.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Identity Chip */}
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-black text-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500">{currentUser.email}</p>
            </div>
          </div>
          <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-[10px] font-black text-purple-800 uppercase tracking-wider">
            {currentUser.role}
          </span>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs font-semibold animate-fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-800 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              Current Password / PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password or PIN..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Default PIN for all users is 1234 (or admin123 for Admin)</p>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              New Password / PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new secret PIN or password..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              Confirm New Password / PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password or PIN..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-purple-600/30 active:scale-95 transition disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
