import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  Calendar,
  Building2,
  UserCheck,
} from 'lucide-react';
import { StockTransaction, TransactionType } from '../types';
import { StorageService } from '../lib/storage';

export const TransactionsView: React.FC = () => {
  const transactions = StorageService.getTransactions();
  const products = StorageService.getProducts();
  const employees = StorageService.getUsers();
  const sites = StorageService.getSites();

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [selectedSite, setSelectedSite] = useState<string>('ALL');

  const filteredTransactions = transactions.filter((t) => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchTxId = t.transactionId.toLowerCase().includes(term);
      const matchProd = t.productName.toLowerCase().includes(term);
      const matchCode = t.productCode.toLowerCase().includes(term);
      const matchEmp = t.employeeName?.toLowerCase().includes(term);
      const matchSite = t.siteName?.toLowerCase().includes(term);
      const matchReason = t.reason?.toLowerCase().includes(term);
      if (!matchTxId && !matchProd && !matchCode && !matchEmp && !matchSite && !matchReason) {
        return false;
      }
    }

    if (selectedType !== 'ALL' && t.type !== selectedType) return false;
    if (selectedProduct !== 'ALL' && t.productId !== selectedProduct) return false;
    if (selectedEmployee !== 'ALL' && t.employeeId !== selectedEmployee) return false;
    if (selectedSite !== 'ALL' && t.siteId !== selectedSite) return false;

    return true;
  });

  const exportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Type',
      'Product Code',
      'Product Name',
      'Quantity',
      'Employee',
      'Site',
      'Supplier',
      'Reason/Notes',
    ];

    const rows = filteredTransactions.map((t) => [
      t.transactionId,
      t.date,
      t.time,
      t.type,
      t.productCode,
      `"${t.productName}"`,
      t.quantity,
      `"${t.employeeName || ''}"`,
      `"${t.siteName || ''}"`,
      `"${t.supplierName || ''}"`,
      `"${t.reason || t.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CleanStock_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'IN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OUT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ADJUSTMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DAMAGED':
      case 'EXPIRED':
      case 'LOST':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <History className="h-6 w-6 text-slate-800" />
            <span>Stock Transaction History Log</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable audit record of all Stock IN, OUT, and Adjustments ({filteredTransactions.length} records)
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search TXN ID, product, site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500"
        >
          <option value="ALL">All Transaction Types</option>
          <option value="IN">IN (Received)</option>
          <option value="OUT">OUT (Issued)</option>
          <option value="ADJUSTMENT">ADJUSTMENT</option>
          <option value="DAMAGED">DAMAGED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>

        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500"
        >
          <option value="ALL">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500"
        >
          <option value="ALL">All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500"
        >
          <option value="ALL">All Cleaning Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Product Code / Name</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Employee / Created By</th>
                <th className="py-3 px-4">Cleaning Site</th>
                <th className="py-3 px-4">Notes / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <p className="font-bold text-slate-900">{t.date}</p>
                      <p className="text-[10px] text-slate-400">{t.time}</p>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                      {t.transactionId}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${getTypeBadge(
                          t.type
                        )}`}
                      >
                        {t.type === 'IN' ? '⬇ IN' : t.type === 'OUT' ? '⬆ OUT' : t.type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{t.productName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{t.productCode}</p>
                    </td>

                    <td className="py-3 px-4 text-center font-extrabold text-sm">
                      <span
                        className={
                          t.type === 'IN'
                            ? 'text-emerald-600'
                            : t.type === 'OUT'
                            ? 'text-rose-600'
                            : 'text-purple-600'
                        }
                      >
                        {t.type === 'IN' ? `+${t.quantity}` : t.type === 'OUT' ? `-${t.quantity}` : t.quantity}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {t.employeeName || t.createdByName}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {t.siteName || (t.supplierName ? `Supplier: ${t.supplierName}` : '-')}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {t.reason || t.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
