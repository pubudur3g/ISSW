import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, X, Eye, EyeOff, CheckCircle2, UserCheck, ShieldOff } from 'lucide-react';
import { User } from '../types';
import { StorageService } from '../lib/storage';

interface PasswordAuthModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onSelectUser?: (user: User) => void;
}

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  isOpen,
  targetUser,
  onClose,
  onSuccess,
  onSelectUser,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const users = StorageService.getUsers();

  useEffect(() => {
    setPassword('');
    setError(null);
    setAttemptsLeft(3);
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const expectedPassword =
    targetUser.password || (targetUser.role === 'ADMIN' ? 'admin123' : '1234');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (targetUser.isLocked) {
      setError(`Account for ${targetUser.name} is locked! Contact Admin (Pubudu) to reset PIN.`);
      return;
    }

    if (password.trim() === expectedPassword) {
      onSuccess(targetUser);
      setPassword('');
      setError(null);
    } else {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);

      if (remaining <= 0) {
        // Lock the account!
        const updatedUser: User = { ...targetUser, isLocked: true };
        StorageService.saveUser(updatedUser);
        setError(`PIN locked due to 3 incorrect attempts! Admin (Pubudu) must reset your PIN.`);
      } else {
        setError(`Incorrect PIN/password. ${remaining} attempt(s) remaining before PIN locks.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-scale-up border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">User Login & Security</h3>
              <p className="text-[11px] text-slate-500">Enter Name & PIN to Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Username Selection Dropdown */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Select Employee / Username
          </label>
          <select
            value={targetUser.id}
            onChange={(e) => {
              const selected = users.find((u) => u.id === e.target.value);
              if (selected && onSelectUser) {
                onSelectUser(selected);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}) {u.isLocked ? '🔒 [PIN LOCKED]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* User Card Header */}
        <div className="flex items-center space-x-3 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
          <img
            src={
              targetUser.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
            }
            alt={targetUser.name}
            className="h-11 w-11 rounded-xl object-cover ring-2 ring-purple-500/20"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm truncate flex items-center space-x-1">
              <span>{targetUser.name}</span>
              {targetUser.isLocked && <ShieldOff className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
            </h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded ${
                  targetUser.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : targetUser.role === 'SUPERVISOR'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {targetUser.role}
              </span>
              {targetUser.isLocked && (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded">
                  LOCKED
                </span>
              )}
            </div>
          </div>
        </div>

        {targetUser.isLocked ? (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-2">
            <div className="flex items-center space-x-2 font-extrabold text-rose-900">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>PIN Locked</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700">
              This account PIN is locked because of repeated incorrect attempts or Admin action.
            </p>
            <p className="text-[10px] font-bold text-rose-900 bg-rose-100 p-2 rounded-lg">
              🔑 Contact Admin (Pubudu) to unlock or reset your PIN.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start space-x-2 text-xs text-rose-700">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <span>Enter PIN / Password</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter PIN or password..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 font-bold text-white shadow-md hover:bg-purple-700 transition flex items-center justify-center space-x-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify & Login</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
