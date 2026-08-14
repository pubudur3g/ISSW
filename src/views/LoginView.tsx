import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Clock,
  ShieldOff,
  Smartphone,
  ChevronRight,
  Store,
  Boxes,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../lib/storage';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const users = StorageService.getUsers();
  const settings = StorageService.getSettings();

  const [loginMethod, setLoginMethod] = useState<'persona' | 'email'>('persona');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [emailInput, setEmailInput] = useState<string>('pubudur3g@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
    setEmailInput(user.email);
    setPasswordInput('');
    setErrorMsg(null);
  };

  const handlePersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedUser) {
      setErrorMsg('Please select a valid employee account.');
      return;
    }

    if (selectedUser.isLocked) {
      setErrorMsg(`Account for ${selectedUser.name} is locked! Contact Admin (Pubudu) to unlock.`);
      return;
    }

    const expectedPassword =
      selectedUser.password || (selectedUser.role === 'ADMIN' ? 'admin123' : '1234');

    if (passwordInput.trim() !== expectedPassword) {
      setErrorMsg(`Incorrect password for ${selectedUser.name}.`);
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(`Welcome back, ${selectedUser.name}! Logging in...`);

    setTimeout(() => {
      onLoginSuccess(selectedUser);
    }, 400);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const matchedUser = users.find(
      (u) => u.email.toLowerCase().trim() === emailInput.toLowerCase().trim()
    );

    if (!matchedUser) {
      setErrorMsg('No employee account found matching this email address.');
      return;
    }

    if (matchedUser.isLocked) {
      setErrorMsg(`Account for ${matchedUser.name} is locked! Contact Admin to unlock.`);
      return;
    }

    const expectedPassword =
      matchedUser.password || (matchedUser.role === 'ADMIN' ? 'admin123' : '1234');

    if (passwordInput.trim() !== expectedPassword) {
      setErrorMsg('Invalid password. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(`Authenticated successfully! Welcome, ${matchedUser.name}.`);

    setTimeout(() => {
      onLoginSuccess(matchedUser);
    }, 400);
  };

  const handleQuickDemoLogin = (user: User) => {
    setErrorMsg(null);
    if (user.isLocked) {
      setErrorMsg(`Account for ${user.name} is locked!`);
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg(`Signing in as ${user.name} (${user.role})...`);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 300);
  };

  const getRoleBadgeColor = (role: UserRole) => {
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

  // Extract key role accounts for quick one-click access
  const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
  const supervisorUser = users.find((u) => u.role === 'SUPERVISOR') || users[1];
  const foremanUser = users.find((u) => u.role === 'FOREMAN' || u.name.toLowerCase() === 'pasi ylitalo') || users[2];
  const employeeUser = users.find((u) => u.role === 'EMPLOYEE') || users[3];
  const quickUsers = [adminUser, supervisorUser, foremanUser, employeeUser].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">
              ISS Cleaning and Grocery Store
            </h1>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
              Inventory & Material Management System
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700/70">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Authorized Staff Access Only</span>
          </div>
        </div>
      </header>

      {/* Main Login Interface Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Left Column: Information & Brand Banner */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
                <Boxes className="h-3.5 w-3.5" />
                <span>ISS Stock & Store Portal</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                ISS Deep Cleaning and Grocery Store
              </h2>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Centralized portal for cleaning supplies checkout, grocery items, reorder approvals, and foreman stock reporting.
              </p>

              {/* System Features list */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center space-x-3 text-xs text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Quick QR Stock Issue & Scan</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Order Approval System with Notifications</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Weekly Foreman Reports & In-Hand Stock Summary</span>
                </div>
              </div>
            </div>

            {/* Quick Login Role Cards */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                ⚡ Quick Role Sign-in:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(u)}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition text-xs group"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-6 w-6 rounded-md object-cover shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-bold text-slate-200 text-xs truncate group-hover:text-emerald-400 transition">
                          {u.name}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate font-semibold">{u.role}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900 flex flex-col justify-center">
            {/* Header Tabs: Select Employee vs Email */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-white">Sign In to ISS Store</h3>
                <p className="text-xs text-slate-400">Select employee account & enter password</p>
              </div>

              <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setLoginMethod('persona')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    loginMethod === 'persona'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Employee Account
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    loginMethod === 'email'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Email & Password
                </button>
              </div>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-5 rounded-2xl bg-rose-950/60 border border-rose-800/80 p-3.5 flex items-start space-x-3 text-xs text-rose-300 animate-shake">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 p-3.5 flex items-center space-x-3 text-xs text-emerald-300 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Mode 1: Select employee account & Password */}
            {loginMethod === 'persona' && (
              <form onSubmit={handlePersonaSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Select employee account
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      const u = users.find((usr) => usr.id === e.target.value);
                      if (u) handleSelectUser(u);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 px-3.5 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <optgroup label="Management & Foreman">
                      {users
                        .filter((u) => u.role !== 'EMPLOYEE')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.role} {u.isLocked ? '🔒 (LOCKED)' : ''}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Employees (Cleaning Staff)">
                      {users
                        .filter((u) => u.role === 'EMPLOYEE')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — Employee {u.isLocked ? '🔒 (LOCKED)' : ''}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Selected User Info Card */}
                {selectedUser && (
                  <div className="flex items-center space-x-3.5 rounded-2xl bg-slate-800/60 p-3.5 border border-slate-700/80">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm truncate flex items-center space-x-1.5">
                          <span>{selectedUser.name}</span>
                          {selectedUser.isLocked && (
                            <ShieldOff className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                        </h4>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getRoleBadgeColor(
                            selectedUser.role
                          )}`}
                        >
                          {selectedUser.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-10 text-xs font-mono font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <span>Remember login session</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Need help? Contact Admin</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedUser?.isLocked}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition flex items-center justify-center space-x-2 disabled:opacity-50 text-xs"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Sign In to Store</span>
                </button>
              </form>
            )}

            {/* Form Mode 2: Traditional Email & Password */}
            {loginMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. pubudur3g@gmail.com, pasi.ylitalo@cleanstock.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Password</label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter account password..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-10 text-xs font-mono font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <span>Keep me logged in</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition flex items-center justify-center space-x-2 disabled:opacity-50 text-xs"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Authenticate & Sign In</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-[11px] text-slate-500 border-t border-slate-800/60">
        © {new Date().getFullYear()} ISS Cleaning and Grocery Store • All rights reserved
      </footer>
    </div>
  );
};

