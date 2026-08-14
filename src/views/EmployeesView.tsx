import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Mail, Phone, Building2, CheckCircle2, X, Lock, Unlock, KeyRound, ShieldAlert } from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../lib/storage';

interface EmployeesViewProps {
  currentUser: User;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const transactions = StorageService.getTransactions();
  const sites = StorageService.getSites();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPinModalUser, setResetPinModalUser] = useState<User | null>(null);
  const [newPinInput, setNewPinInput] = useState('1234');

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    phone: string;
    password: string;
    isLocked: boolean;
    assignedSites: string[];
    active: boolean;
  }>({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    phone: '',
    password: '1234',
    isLocked: false,
    assignedSites: sites.map((s) => s.id),
    active: true,
  });

  const refreshUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'EMPLOYEE',
      phone: '',
      password: '1234',
      isLocked: false,
      assignedSites: sites.map((s) => s.id),
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      password: user.password || (user.role === 'ADMIN' ? 'admin123' : '1234'),
      isLocked: !!user.isLocked,
      assignedSites: user.assignedSites || [],
      active: user.active,
    });
    setIsModalOpen(true);
  };

  const handleQuickResetPin = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setResetPinModalUser(user);
    setNewPinInput('1234');
  };

  const handleConfirmResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinModalUser) return;

    const updatedUser: User = {
      ...resetPinModalUser,
      password: newPinInput.trim() || '1234',
      isLocked: false, // Unlock user!
    };

    StorageService.saveUser(updatedUser);
    StorageService.logAudit(
      currentUser,
      'Reset PIN & Unlock Account',
      'User',
      updatedUser.id,
      updatedUser.name
    );

    refreshUsers();
    setResetPinModalUser(null);
    alert(`PIN for ${updatedUser.name} has been successfully reset to "${updatedUser.password}" and unlocked!`);
  };

  const handleDeleteUser = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete employee "${user.name}"?`)) {
      StorageService.deleteUser(user.id);
      StorageService.logAudit(currentUser, 'Delete Employee', 'User', user.id, user.name);
      refreshUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
    }
  };

  const handleToggleSite = (siteId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedSites: prev.assignedSites.includes(siteId)
        ? prev.assignedSites.filter((id) => id !== siteId)
        : [...prev.assignedSites, siteId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and Email are required.');
      return;
    }

    const newUser: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      phone: formData.phone.trim() || '+358 40 000 0000',
      password: formData.password.trim() || (formData.role === 'ADMIN' ? 'admin123' : '1234'),
      isLocked: formData.isLocked,
      active: formData.active,
      assignedSites: formData.assignedSites,
      avatar: editingUser
        ? editingUser.avatar
        : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    };

    StorageService.saveUser(newUser);
    StorageService.logAudit(
      currentUser,
      editingUser ? 'Update Employee' : 'Add Employee',
      'User',
      newUser.id,
      newUser.name
    );

    refreshUsers();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <span>Employee & Staff Directory</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage employee access, user roles, system authority, and reset employee PINs
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((u) => {
          const userTxs = transactions.filter((t) => t.employeeId === u.id || t.createdByUserId === u.id);
          const totalItemsTaken = userTxs
            .filter((t) => t.type === 'OUT')
            .reduce((acc, t) => acc + t.quantity, 0);

          return (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`cursor-pointer rounded-2xl bg-white p-5 shadow-sm border transition space-y-3 relative group ${
                selectedUser?.id === u.id
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={u.name}
                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                      <span>{u.name}</span>
                    </h4>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'SUPERVISOR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.isLocked ? (
                        <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                          <Lock className="h-2.5 w-2.5" />
                          <span>LOCKED</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                          PIN: {u.password || '1234'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => handleQuickResetPin(u, e)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition"
                    title="Reset PIN / Unlock"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenEditModal(u, e)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Employee"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteUser(u, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                    title="Delete Employee"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="flex items-center space-x-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
                <p className="flex items-center space-x-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{u.phone}</span>
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 flex items-center justify-between text-xs text-slate-800 font-medium">
                <span>Total Items Issued:</span>
                <span className="font-extrabold text-emerald-600">{totalItemsTaken} units</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected User Transaction Breakdown */}
      {selectedUser && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Recent Stock Activity for {selectedUser.name} ({selectedUser.role})
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Assigned Sites: {selectedUser.assignedSites?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter((t) => t.employeeId === selectedUser.id || t.createdByUserId === selectedUser.id)
                  .map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 px-3 font-semibold">{t.date} {t.time}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{t.productName}</td>
                      <td className="py-2 px-3 font-bold">{t.type}</td>
                      <td className="py-2 px-3 text-center font-extrabold text-emerald-600">{t.quantity}</td>
                      <td className="py-2 px-3">{t.siteName || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Reset PIN Modal */}
      {resetPinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Admin PIN Reset</h3>
                  <p className="text-[11px] text-slate-500">{resetPinModalUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setResetPinModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign New PIN / Password
                </label>
                <input
                  type="text"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="e.g. 1234 or 5678"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  This will immediately reset {resetPinModalUser.name}'s PIN and unlock their account.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPinModalUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 font-bold text-white shadow-md hover:bg-purple-700 transition flex items-center space-x-1"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Reset & Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingUser ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name (Username for Login) *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maria Virtanen"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. maria@cleanstock.fi"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +358 40 123 4567"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">User Role & System Authority</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs bg-white font-bold"
                >
                  <option value="EMPLOYEE">EMPLOYEE — Standard Staff (Can Issue/Check out Stock)</option>
                  <option value="SUPERVISOR">SUPERVISOR — Site Manager (Receive, Issue & Reorder Authority)</option>
                  <option value="ADMIN">ADMIN — Full System Owner (Full Authority, User & Password Management)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {formData.role === 'ADMIN' && '⚡ Full Authority: Granted total control over stock, employees, sites, and configuration.'}
                  {formData.role === 'SUPERVISOR' && '🛡️ Supervisor Authority: Can receive stock, approve reorders, and manage site operations.'}
                  {formData.role === 'EMPLOYEE' && '🔑 Staff Authority: Can log stock consumption and scan items.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Login Password / PIN *</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Login Credential</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. admin123 or 1234"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex items-center space-x-2 pb-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.isLocked}
                      onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className={formData.isLocked ? 'text-rose-700 font-extrabold' : ''}>
                      🔒 Lock PIN Access
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Assigned Cleaning Sites</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {sites.map((site) => {
                    const isChecked = formData.assignedSites.includes(site.id);
                    return (
                      <label
                        key={site.id}
                        onClick={() => handleToggleSite(site.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border text-xs font-medium transition ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{site.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-md hover:bg-emerald-700 transition"
                >
                  {editingUser ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
