import React from 'react';
import { ShieldCheck, Calendar, User, FileCode } from 'lucide-react';
import { StorageService } from '../lib/storage';

export const AuditLogView: React.FC = () => {
  const auditLogs = StorageService.getAuditLogs();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-purple-600" />
          <span>System Audit Trail Log</span>
        </h2>
        <p className="text-xs text-slate-500">
          Security audit record for compliance, product edits, stock changes, and user management
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Object Type / Name</th>
                <th className="py-3 px-4">Previous Value</th>
                <th className="py-3 px-4">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {log.objectType}: <strong className="text-slate-900">{log.objectName}</strong>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.previousValue || '-'}</td>
                  <td className="py-3 px-4 text-slate-800 font-mono font-bold text-[11px]">{log.newValue || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
