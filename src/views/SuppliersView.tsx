import React, { useState } from 'react';
import { Truck, Plus, Edit2, Trash2, Mail, Phone, MapPin, Package, X } from 'lucide-react';
import { Supplier, User } from '../types';
import { StorageService } from '../lib/storage';

interface SuppliersViewProps {
  currentUser: User;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ currentUser }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(StorageService.getSuppliers());
  const products = StorageService.getProducts();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(suppliers[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    active: true,
  });

  const refreshSuppliers = () => {
    const updated = StorageService.getSuppliers();
    setSuppliers(updated);
    if (selectedSupplier) {
      const found = updated.find((s) => s.id === selectedSupplier.id);
      setSelectedSupplier(found || updated[0] || null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes || '',
      active: supplier.active,
    });
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      StorageService.deleteSupplier(supplier.id);
      StorageService.logAudit(currentUser, 'Delete Supplier', 'Supplier', supplier.id, supplier.name);
      refreshSuppliers();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Supplier Name is required.');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim() || 'N/A',
      email: formData.email.trim() || 'orders@supplier.com',
      phone: formData.phone.trim() || '+358 00 000 0000',
      address: formData.address.trim() || 'Helsinki, Finland',
      notes: formData.notes.trim(),
      active: formData.active,
    };

    StorageService.saveSupplier(newSupplier);
    StorageService.logAudit(
      currentUser,
      editingSupplier ? 'Update Supplier' : 'Add Supplier',
      'Supplier',
      newSupplier.id,
      newSupplier.name
    );

    refreshSuppliers();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Truck className="h-6 w-6 text-purple-600" />
            <span>Supplier Management & Vendors</span>
          </h2>
          <p className="text-xs text-slate-500">
            Primary cleaning chemical & paper products vendors, contacts, and product catalogs
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 active:scale-95 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => {
          const supplierProducts = products.filter((p) => p.supplierId === s.id);

          return (
            <div
              key={s.id}
              onClick={() => setSelectedSupplier(s)}
              className={`cursor-pointer rounded-2xl p-5 border transition space-y-3 relative group ${
                selectedSupplier?.id === s.id
                  ? 'bg-purple-50/80 border-purple-400 shadow-md ring-2 ring-purple-500/20'
                  : 'bg-white border-slate-200/80 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{s.name}</h4>
                  <p className="text-xs text-slate-500">Contact: <strong className="text-slate-800">{s.contactPerson}</strong></p>
                </div>

                <div className="flex items-center space-x-1">
                  <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[10px] font-bold mr-1">
                    {supplierProducts.length} Items
                  </span>
                  <button
                    onClick={(e) => handleOpenEditModal(s, e)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Supplier"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSupplier(s, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                    title="Delete Supplier"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="flex items-center space-x-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{s.email}</span>
                </p>
                <p className="flex items-center space-x-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{s.phone}</span>
                </p>
              </div>

              <p className="text-xs text-slate-500 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{s.address}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Supplier Product Catalog */}
      {selectedSupplier && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Package className="h-4 w-4 text-purple-600" />
            <span>Product Catalog Supplied by {selectedSupplier.name}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {products
              .filter((p) => p.supplierId === selectedSupplier.id)
              .map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{p.code} • Supplier Code: {p.supplierProductCode || 'N/A'}</p>
                  <p className="pt-1 font-semibold text-emerald-700">
                    Stock Quantity: {p.currentStock} {p.unit}s
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                <label className="block font-bold text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nordic Cleaning Supplies Oy"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Markus Lindholm"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +358 40 123 4567"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. orders@nordicclean.fi"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Varastotie 8, Espoo"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
                />
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
                  className="rounded-xl bg-purple-600 px-5 py-2 font-bold text-white shadow-md hover:bg-purple-700 transition"
                >
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
