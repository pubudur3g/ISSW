import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, UserCheck, BarChart3, X } from 'lucide-react';
import { CleaningSite, User } from '../types';
import { StorageService } from '../lib/storage';

interface SitesViewProps {
  currentUser: User;
}

export const SitesView: React.FC<SitesViewProps> = ({ currentUser }) => {
  const [sites, setSites] = useState<CleaningSite[]>(StorageService.getSites());
  const transactions = StorageService.getTransactions();

  const [selectedSite, setSelectedSite] = useState<CleaningSite | null>(sites[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<CleaningSite | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    supervisor: '',
    contact: '',
    active: true,
  });

  const refreshSites = () => {
    const updated = StorageService.getSites();
    setSites(updated);
    if (selectedSite) {
      const found = updated.find((s) => s.id === selectedSite.id);
      setSelectedSite(found || updated[0] || null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      address: '',
      supervisor: currentUser.name || 'Marcus Vance',
      contact: '+358 40 100 0000',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (site: CleaningSite, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSite(site);
    setFormData({
      name: site.name,
      address: site.address,
      supervisor: site.supervisor,
      contact: site.contact,
      active: site.active,
    });
    setIsModalOpen(true);
  };

  const handleDeleteSite = (site: CleaningSite, e: React.MouseEvent) => {
    e.stopPropagation();
    const siteTxs = transactions.filter((t) => t.siteId === site.id);
    const confirmMsg =
      siteTxs.length > 0
        ? `Site "${site.name}" has ${siteTxs.length} transaction(s) associated with it. Are you sure you want to delete this cleaning site?`
        : `Are you sure you want to delete site "${site.name}"?`;

    if (confirm(confirmMsg)) {
      StorageService.deleteSite(site.id);
      StorageService.logAudit(currentUser, 'Delete Cleaning Site', 'Site', site.id, site.name);
      refreshSites();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Site Name and Address are required.');
      return;
    }

    const newSite: CleaningSite = {
      id: editingSite ? editingSite.id : `site-${Date.now()}`,
      name: formData.name.trim(),
      address: formData.address.trim(),
      supervisor: formData.supervisor.trim() || 'Unassigned',
      contact: formData.contact.trim() || '+358 00 000 0000',
      active: formData.active,
    };

    StorageService.saveSite(newSite);
    StorageService.logAudit(
      currentUser,
      editingSite ? 'Update Site' : 'Add Site',
      'Site',
      newSite.id,
      newSite.name
    );

    refreshSites();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Cleaning Sites & Locations</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage cleaning locations, office towers, hotels, schools, and site supervisors
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Cleaning Site</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((s) => {
          const siteTxs = transactions.filter((t) => t.siteId === s.id);
          const totalUnitsConsumed = siteTxs.reduce((acc, t) => acc + t.quantity, 0);

          return (
            <div
              key={s.id}
              onClick={() => setSelectedSite(s)}
              className={`cursor-pointer rounded-2xl p-5 border transition space-y-3 relative group ${
                selectedSite?.id === s.id
                  ? 'bg-blue-50/80 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200/80 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{s.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{s.address}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleOpenEditModal(s, e)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Site"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSite(s, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                    title="Delete Site"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-3">
                <p>Supervisor: <strong className="text-slate-800">{s.supervisor}</strong></p>
                <p>Contact: <span className="font-mono">{s.contact}</span></p>
              </div>

              <div className="rounded-xl bg-slate-900 text-white p-2.5 flex items-center justify-between text-xs">
                <span>Total Supplies Consumed:</span>
                <span className="font-extrabold text-emerald-400">{totalUnitsConsumed} units</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Site Consumption Breakdown */}
      {selectedSite && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span>Material Consumption History for {selectedSite.name}</span>
            </h3>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={(e) => handleOpenEditModal(selectedSite, e)}
                className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Edit Site</span>
              </button>
              <button
                onClick={(e) => handleDeleteSite(selectedSite, e)}
                className="inline-flex items-center space-x-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Delete Site</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Quantity Issued</th>
                  <th className="py-2.5 px-3">Employee / Staff</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter((t) => t.siteId === selectedSite.id)
                  .map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 px-3 font-semibold">{t.date} {t.time}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{t.productName}</td>
                      <td className="py-2 px-3 font-extrabold text-rose-600">-{t.quantity}</td>
                      <td className="py-2 px-3">{t.employeeName}</td>
                      <td className="py-2 px-3 text-slate-500">{t.notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Site Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingSite ? 'Edit Cleaning Site' : 'Add New Cleaning Site'}
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
                <label className="block font-bold text-slate-700 mb-1">Site Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Site C (North Plaza)"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Hämeentie 45, Helsinki"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    placeholder="e.g. Marcus Vance"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g. +358 40 111 2233"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                  />
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
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  {editingSite ? 'Save Changes' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
