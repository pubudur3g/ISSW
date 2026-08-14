import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, MapPin, Building2, UserCheck, Clock } from 'lucide-react';
import { DeepCleaningTask, User } from '../types';

interface CompleteDeepCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  task: DeepCleaningTask | null;
  currentUser: User;
}

export const CompleteDeepCleaningModal: React.FC<CompleteDeepCleaningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  task,
  currentUser,
}) => {
  const [completionNotes, setCompletionNotes] = useState('');

  if (!isOpen || !task) return null;

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(completionNotes.trim());
    setCompletionNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800 bg-emerald-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Mark Task as Completed</h3>
              <p className="text-xs text-emerald-300">Set status to Task Done</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleComplete} className="p-6 space-y-4">
          {/* Task Info Summary Box */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">{task.taskCode}</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {task.taskType.replace(/_/g, ' ')}
              </span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">{task.title}</h4>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 gap-1 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Client: <strong className="text-slate-800">{task.clientName}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">Location: {task.location}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Deadline: {task.deadlineDate} ({task.deadlineTime || 'End of day'})</span>
              </div>
            </div>
          </div>

          {/* Completion Signature Info */}
          <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200 flex items-center space-x-3">
            <UserCheck className="h-5 w-5 text-emerald-700 flex-shrink-0" />
            <div className="text-xs text-emerald-950">
              Completing Staff: <strong>{currentUser.name}</strong> ({currentUser.role})
              <p className="text-[11px] text-emerald-700">Timestamp will be logged to Firestore audit history.</p>
            </div>
          </div>

          {/* Completion Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Completion Notes & Handover Summary (Optional)
            </label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. All desks successfully relocated to staging room, area vacuumed and client facility manager signed off on completion..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Task Done</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
