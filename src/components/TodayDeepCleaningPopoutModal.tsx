import React from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  AlertTriangle,
  MapPin,
  Users,
  CheckCircle2,
  Play,
  ArrowRight,
  X,
  Flame,
  ShieldAlert,
  Wrench,
  Building,
} from 'lucide-react';
import { DeepCleaningTask, User } from '../types';
import { StorageService } from '../lib/storage';

interface TodayDeepCleaningPopoutModalProps {
  isOpen: boolean;
  tasks: DeepCleaningTask[];
  currentUser: User;
  onClose: () => void;
  onNavigateToDeepCleaning: () => void;
  onTaskUpdated?: () => void;
}

export const TodayDeepCleaningPopoutModal: React.FC<TodayDeepCleaningPopoutModalProps> = ({
  isOpen,
  tasks,
  currentUser,
  onClose,
  onNavigateToDeepCleaning,
  onTaskUpdated,
}) => {
  if (!isOpen || tasks.length === 0) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleStartTask = (task: DeepCleaningTask) => {
    StorageService.updateDeepCleaningTaskStatus(task.id, 'IN_PROGRESS', currentUser);
    if (onTaskUpdated) onTaskUpdated();
  };

  const handleCompleteTask = (task: DeepCleaningTask) => {
    StorageService.updateDeepCleaningTaskStatus(
      task.id,
      'DONE',
      currentUser,
      `Signed off by ${currentUser.name} (${currentUser.role}) from Today's Task Popout`
    );
    if (onTaskUpdated) onTaskUpdated();
  };

  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT');
  const pendingOrActiveTasks = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-red-500/80 shadow-2xl shadow-red-900/40 p-6 space-y-6 text-white animate-scale-up custom-scrollbar">
        {/* Urgent Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/50 animate-pulse shrink-0">
              <Flame className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-black text-red-400 uppercase tracking-wider">
                  ⚠️ ACTION REQUIRED • SUPERVISORS & FOREMAN
                </span>
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                  {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Scheduled Today
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Today's Deep Cleaning Tasks Pop-Out
              </h2>
              <p className="text-xs text-red-200/80">
                Critical focus on task <strong>Start Time</strong> and <strong>Deadlines</strong> for operations team
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-start sm:self-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Attention Callout */}
        <div className="rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-500/40 p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-red-400 font-bold">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Attention: Pasi Ylitalo (Foreman), Supervisors & Admin</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Please ensure assigned team crew members have all necessary specialized equipment checked out, verified onsite attendance, and adhere to strict start and completion deadlines.
          </p>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.map((task) => {
            const isUrgent = task.priority === 'URGENT';
            const isDone = task.status === 'DONE';
            const isInProgress = task.status === 'IN_PROGRESS';

            return (
              <div
                key={task.id}
                className={`rounded-2xl p-5 border transition space-y-4 ${
                  isDone
                    ? 'bg-gradient-to-b from-emerald-950/90 to-slate-900 border-2 border-emerald-500 shadow-lg shadow-emerald-950/60'
                    : isUrgent
                    ? 'bg-gradient-to-b from-red-950/40 to-slate-900 border-red-500 shadow-lg shadow-red-950/50'
                    : 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Task Top Meta */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                  isDone ? 'border-emerald-500/40' : 'border-slate-700/60'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`font-mono text-xs font-bold ${isDone ? 'text-emerald-400' : 'text-red-400'}`}>{task.taskCode}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isUrgent
                          ? 'bg-red-600 text-white animate-pulse'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase flex items-center space-x-1 ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                          : isInProgress
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isDone ? '✓ TASK DONE' : task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Client: <strong className="text-slate-200">{task.clientName || 'ISS Contract'}</strong>
                  </span>
                </div>

                {/* Title and Location */}
                <div>
                  <h3 className={`text-base font-extrabold leading-snug ${isDone ? 'text-emerald-200' : 'text-white'}`}>
                    {isDone && <span className="text-emerald-400 mr-1.5">✓</span>}
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-1.5">
                    <MapPin className={`h-3.5 w-3.5 shrink-0 ${isDone ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span>{task.location}</span>
                  </div>
                </div>

                {/* START TIME & DEADLINE FOCUS BOX (HIGH CONTRAST RED/AMBER) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-slate-950/80 border border-red-500/30 p-3.5">
                  {/* Start Time Box */}
                  <div className="flex items-center space-x-3 rounded-xl bg-slate-900/90 border border-slate-800 p-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Start Time</p>
                      <p className="text-sm font-black text-white">
                        {task.startTime || '08:00'} <span className="text-xs text-emerald-400 font-normal">({task.whenDate === todayStr ? 'Today' : task.whenDate})</span>
                      </p>
                    </div>
                  </div>

                  {/* Deadline Time Box */}
                  <div className="flex items-center space-x-3 rounded-xl bg-red-950/40 border border-red-500/40 p-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-600 text-white font-black shrink-0 animate-pulse">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-300">DEADLINE TIME</p>
                      <p className="text-sm font-black text-red-200">
                        {task.deadlineTime || '17:00'} <span className="text-xs text-red-400 font-normal">({task.deadlineDate === todayStr ? 'Today' : task.deadlineDate})</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Crew Members */}
                {task.assignedMembers && task.assignedMembers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-300" />
                      <span>Assigned Crew Members:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {task.assignedMembers.map((member, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200"
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Equipment */}
                {task.specialToolsEquipment && task.specialToolsEquipment.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
                      <Wrench className="h-3.5 w-3.5 text-slate-400" />
                      <span>Special Tools / Equipment:</span>
                    </p>
                    <p className="text-xs text-slate-300 bg-slate-950/40 rounded-xl p-2 font-mono">
                      {task.specialToolsEquipment.join(' • ')}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                  <div className="flex items-center space-x-2">
                    {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                      <button
                        onClick={() => handleStartTask(task)}
                        className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Start Task (In Progress)</span>
                      </button>
                    )}

                    {task.status !== 'DONE' && (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Sign Off & Mark Done</span>
                      </button>
                    )}

                    {isDone && (
                      <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed & Verified</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToDeepCleaning();
                    }}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition"
                  >
                    <span>View in Deep Cleaning Tab</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Dismiss Pop-Out
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToDeepCleaning();
            }}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-red-600/40 active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Go to Deep Cleaning Operations</span>
          </button>
        </div>
      </div>
    </div>
  );
};
