import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Building2,
  Users,
  Repeat,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Edit2,
  Trash2,
  Wrench,
  ChevronRight,
  Printer,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  X,
  Layers,
  Settings,
} from 'lucide-react';
import {
  DeepCleaningTask,
  DeepCleaningTaskType,
  DeepCleaningTaskStatus,
  DeepCleaningTaskPriority,
  DeepCleaningTeam,
  User,
  DEEP_CLEANING_TASK_CREATORS,
  canUserAddDeepCleaningTask,
  canUserManageDeepCleaningTeam,
} from '../types';
import { StorageService } from '../lib/storage';
import { DeepCleaningTaskModal } from '../components/DeepCleaningTaskModal';
import { CompleteDeepCleaningModal } from '../components/CompleteDeepCleaningModal';
import { DeepCleaningTeamModal } from '../components/DeepCleaningTeamModal';

interface DeepCleaningViewProps {
  currentUser: User;
}

export const DeepCleaningView: React.FC<DeepCleaningViewProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<DeepCleaningTask[]>([]);
  const [teams, setTeams] = useState<DeepCleaningTeam[]>([]);
  const [rosterMembers, setRosterMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REPEAT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEADLINE' | 'WHEN' | 'PRIORITY'>('DEADLINE');

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DeepCleaningTask | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<DeepCleaningTask | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<DeepCleaningTask | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const canCreate = canUserAddDeepCleaningTask(currentUser);
  const canManageTeams = canUserManageDeepCleaningTeam(currentUser);

  const refreshTasks = () => {
    setTasks(StorageService.getDeepCleaningTasks());
    setTeams(StorageService.getDeepCleaningTeams());
    setRosterMembers(StorageService.getDeepCleaningTeamMembers());
  };

  useEffect(() => {
    refreshTasks();

    const handleDataUpdate = () => {
      refreshTasks();
    };
    window.addEventListener('cleanstock_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('cleanstock_data_updated', handleDataUpdate);
    };
  }, []);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status Filter
      if (activeStatusTab === 'PENDING' && t.status !== 'PENDING') return false;
      if (activeStatusTab === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
      if (activeStatusTab === 'DONE' && t.status !== 'DONE') return false;
      if (activeStatusTab === 'REPEAT' && t.taskType !== 'REPEAT_TASK') return false;

      // Category Filter
      if (selectedCategory !== 'ALL' && t.taskType !== selectedCategory) return false;

      // Priority Filter
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(query);
        const inClient = t.clientName.toLowerCase().includes(query);
        const inLoc = t.location.toLowerCase().includes(query);
        const inCode = t.taskCode.toLowerCase().includes(query);
        const inMembers = t.assignedMembers.some((m) => m.toLowerCase().includes(query));
        if (!inTitle && !inClient && !inLoc && !inCode && !inMembers) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DEADLINE') {
        return new Date(`${a.deadlineDate}T${a.deadlineTime || '23:59'}`).getTime() -
               new Date(`${b.deadlineDate}T${b.deadlineTime || '23:59'}`).getTime();
      }
      if (sortBy === 'WHEN') {
        return new Date(`${a.whenDate}T${a.startTime || '00:00'}`).getTime() -
               new Date(`${b.whenDate}T${b.startTime || '00:00'}`).getTime();
      }
      if (sortBy === 'PRIORITY') {
        const pMap: { [key: string]: number } = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      return 0;
    });
  }, [tasks, activeStatusTab, selectedCategory, selectedPriority, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const repeat = tasks.filter((t) => t.taskType === 'REPEAT_TASK').length;
    const urgent = tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'DONE').length;

    return { total, pending, inProgress, done, repeat, urgent };
  }, [tasks]);

  const handleSaveTask = (taskPayload: DeepCleaningTask) => {
    StorageService.saveDeepCleaningTask(taskPayload, currentUser);
    setIsTaskModalOpen(false);
    setEditingTask(null);
    refreshTasks();
  };

  const handleDeleteTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this deep cleaning task?')) {
      StorageService.deleteDeepCleaningTask(taskId, currentUser);
      if (selectedDetailTask?.id === taskId) {
        setSelectedDetailTask(null);
      }
      refreshTasks();
    }
  };

  const handleStartTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    StorageService.updateDeepCleaningTaskStatus(taskId, 'IN_PROGRESS', currentUser);
    refreshTasks();
  };

  const handleInitiateComplete = (task: DeepCleaningTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTaskToComplete(task);
    setIsCompleteModalOpen(true);
  };

  const handleConfirmComplete = (notes: string) => {
    if (!taskToComplete) return;
    StorageService.updateDeepCleaningTaskStatus(taskToComplete.id, 'DONE', currentUser, notes);
    setIsCompleteModalOpen(false);
    setTaskToComplete(null);
    refreshTasks();
  };

  const handleReopenTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    StorageService.updateDeepCleaningTaskStatus(taskId, 'PENDING', currentUser, 'Reopened for review');
    refreshTasks();
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryBadge = (type: DeepCleaningTaskType) => {
    switch (type) {
      case 'GENERAL_FURNITURE_REMOVAL':
        return { label: 'General Furniture Moval', bg: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/40' };
      case 'CONFERENCE_ROOM_FURNITURE_REMOVAL':
        return { label: 'Conference Room Furniture Moval', bg: 'bg-purple-950/80 text-purple-200 border-purple-500/40' };
      case 'REPEAT_TASK':
        return { label: 'Repeat Task', bg: 'bg-teal-950/80 text-teal-200 border-teal-500/40' };
      case 'DEEP_CLEANING':
      default:
        return { label: 'Deep Cleaning', bg: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40' };
    }
  };

  const getPriorityBadge = (priority: DeepCleaningTaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-600 text-white border-red-400 animate-pulse font-black shadow-xs';
      case 'HIGH':
        return 'bg-amber-950 text-amber-300 border-amber-500/60 font-bold';
      case 'MEDIUM':
        return 'bg-blue-950 text-blue-300 border-blue-500/50';
      case 'LOW':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = useMemo(() => {
    const list = tasks.filter((t) => {
      // 1. Tasks scheduled to start today
      if (t.whenDate === todayStr) return true;
      // 2. Tasks with deadline today
      if (t.deadlineDate === todayStr) return true;
      // 3. Start date has already gone/passed and task is still NOT DONE (active backlog/overdue)
      if (t.status !== 'DONE' && t.whenDate && t.whenDate < todayStr) return true;
      // 4. Deadline has passed and task is still NOT DONE
      if (t.status !== 'DONE' && t.deadlineDate && t.deadlineDate < todayStr) return true;
      // 5. Tasks currently actively in progress
      if (t.status === 'IN_PROGRESS') return true;
      // 6. Tasks completed today
      if (t.status === 'DONE' && t.completedAt && t.completedAt.startsWith(todayStr)) return true;
      return false;
    });

    // Sort: Urgent & In-Progress -> Overdue/Past Start Dates -> Starts Today -> Completed
    return list.sort((a, b) => {
      if (a.status === 'DONE' && b.status !== 'DONE') return 1;
      if (a.status !== 'DONE' && b.status === 'DONE') return -1;
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;
      if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
      if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
      return (a.whenDate || '').localeCompare(b.whenDate || '');
    });
  }, [tasks, todayStr]);

  return (
    <div className="space-y-6 bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-800/90 shadow-2xl">
      
      {/* 1. TODAY'S WORK RED BOX WITH HOW MANY TODAY'S WORKS */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-2 border-red-500 p-5 shadow-2xl shadow-red-950/60 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/40 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white font-black shadow-lg shadow-red-600/50 animate-pulse">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="font-black text-white text-lg sm:text-xl tracking-tight">
                  🔥 TODAY'S WORK
                </h2>
                <span className="rounded-full bg-red-600 border border-red-400 px-3 py-0.5 text-xs font-black uppercase text-white tracking-wider shadow-md animate-pulse">
                  {todayTasks.length} {todayTasks.length === 1 ? 'TASK' : 'TASKS'}
                </span>
              </div>
              <p className="text-xs text-red-200/90 mt-0.5 font-medium">
                Active tasks starting today or with start dates already passed awaiting completion ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-red-200 bg-red-900/60 border border-red-500/40 px-3 py-1.5 rounded-xl">
              {todayTasks.filter((t) => t.status === 'DONE').length} Done • {todayTasks.filter((t) => t.status === 'IN_PROGRESS').length} In Progress • {todayTasks.filter((t) => t.status === 'PENDING').length} Pending
            </span>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="rounded-xl bg-black/40 border border-red-500/30 p-6 text-center text-slate-300">
            <p className="text-sm font-semibold">No specialized deep cleaning tasks due, in progress, or past start date for today.</p>
            <p className="text-xs text-slate-400 mt-1">Browse all scheduled cycles below or click "Add Task" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {todayTasks.map((task) => {
              const isDone = task.status === 'DONE';
              const isUrgent = task.priority === 'URGENT';
              const isInProgress = task.status === 'IN_PROGRESS';
              const isPastStartDate = !isDone && task.whenDate && task.whenDate < todayStr;
              const isStartsToday = task.whenDate === todayStr;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedDetailTask(task)}
                  className={`cursor-pointer rounded-xl p-4 shadow-lg space-y-3 transition-all group ${
                    isDone
                      ? 'bg-emerald-950/80 border-2 border-emerald-500 hover:border-emerald-400 ring-1 ring-emerald-500/40'
                      : isPastStartDate
                      ? 'bg-red-950/90 border-2 border-red-500 hover:border-red-400 ring-2 ring-red-500/60 shadow-red-950/80 hover:bg-red-900/70'
                      : isUrgent
                      ? 'bg-red-950/80 border-2 border-red-500 hover:border-red-400 ring-1 ring-red-500/50 hover:bg-red-900/60'
                      : isInProgress
                      ? 'bg-amber-950/70 border-2 border-amber-500 hover:border-amber-400 ring-1 ring-amber-500/40'
                      : 'bg-slate-900/90 border border-red-500/50 hover:border-red-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-mono text-xs font-bold ${isDone ? 'text-emerald-400' : isPastStartDate || isUrgent ? 'text-red-400' : 'text-slate-300'}`}>
                        {task.taskCode}
                      </span>
                      {isPastStartDate && (
                        <span className="rounded bg-red-600 px-1.5 py-0.2 text-[9px] font-black text-white uppercase animate-pulse">
                          PAST START DATE
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isPastStartDate
                          ? 'bg-red-600 text-white shadow-xs animate-pulse ring-1 ring-red-300'
                          : isUrgent
                          ? 'bg-red-600 text-white shadow-xs animate-pulse'
                          : isInProgress
                          ? 'bg-amber-600 text-white shadow-xs'
                          : isStartsToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {isDone
                        ? '✓ TASK DONE'
                        : isPastStartDate
                        ? '⚠️ OVERDUE START'
                        : isUrgent
                        ? '🔥 URGENT'
                        : isInProgress
                        ? '⚡ IN PROGRESS'
                        : isStartsToday
                        ? '📅 STARTS TODAY'
                        : task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className={`text-sm font-black line-clamp-1 ${
                    isDone
                      ? 'text-emerald-200 group-hover:text-emerald-100'
                      : isPastStartDate || isUrgent
                      ? 'text-red-100 group-hover:text-white'
                      : 'text-white group-hover:text-slate-200'
                  }`}>
                    {task.title}
                  </h4>

                  {/* Highlighted Start Time & Deadline Badge */}
                  <div className={`grid grid-cols-2 gap-2 rounded-lg p-2.5 text-center text-xs border ${
                    isDone
                      ? 'bg-emerald-900/50 border-emerald-500/40'
                      : isPastStartDate || isUrgent
                      ? 'bg-black/60 border-red-500/50'
                      : 'bg-black/40 border-slate-700'
                  }`}>
                    <div>
                      <span className={`text-[9px] font-bold uppercase block ${isPastStartDate ? 'text-red-300 font-extrabold' : 'text-slate-400'}`}>
                        {isPastStartDate ? 'START WAS' : 'START DATE'}
                      </span>
                      <span className={`text-xs font-black ${isPastStartDate ? 'text-red-300' : 'text-emerald-400'}`}>
                        {task.whenDate || 'Today'} ({task.startTime || '08:00'})
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase block ${isDone ? 'text-emerald-300' : 'text-red-300'}`}>
                        {isDone ? 'COMPLETED' : 'DEADLINE'}
                      </span>
                      <span className={`text-xs font-black ${isDone ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                        {isDone ? 'Done' : `${task.deadlineDate || task.whenDate} (${task.deadlineTime || '15:30'})`}
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between text-xs pt-1.5 border-t ${
                    isDone ? 'border-emerald-800/80 text-emerald-300' : isPastStartDate ? 'border-red-800/80 text-red-200' : 'border-slate-800 text-slate-400'
                  }`}>
                    <span className="truncate max-w-[150px] font-medium text-slate-300">{task.location}</span>
                    <span className={`font-bold group-hover:underline ${isDone ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isDone ? 'View Details ✓' : 'Execute & Review →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Header Operations & Crew Banner - Dark Black Theme */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">Deep Cleaning Operations</h1>
              <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-xs font-extrabold text-purple-300">
                Team Access Module
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl">
              Dedicated operations for client-notified deep cleaning requests, conference room furniture movements, general furniture relocations, and recurring repeat tasks.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="flex items-center space-x-2 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/40 px-3.5 py-2.5 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              <Users className="h-4 w-4" />
              <span>{canManageTeams ? 'Manage Teams & Crew' : 'View Teams & Crew'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 shadow-2xs transition-colors"
            >
              <Printer className="h-4 w-4 text-purple-400" />
              <span>Print</span>
            </button>

            {canCreate ? (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Add Task</span>
              </button>
            ) : (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-semibold block">Task Creators:</span>
                <span className="text-xs text-purple-300 font-bold">
                  {DEEP_CLEANING_TASK_CREATORS.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Configured Teams & Roster Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          {/* Teams Row */}
          {teams.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Layers className="h-4 w-4 text-purple-400" />
                <span className="font-bold">Configured Squads ({teams.length}):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {teams.map((t) => (
                  <span
                    key={t.id}
                    onClick={() => setIsTeamModalOpen(true)}
                    className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-purple-200 border border-purple-500/40 shadow-2xs hover:bg-slate-750 transition"
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded-full font-black">
                      {t.members.length}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roster Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">Designated Crew Roster ({rosterMembers.length}):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {rosterMembers.map((name) => {
                const isCreator = DEEP_CLEANING_TASK_CREATORS.includes(name);
                const isCurrent = currentUser.name.toLowerCase().includes(name.toLowerCase());
                return (
                  <span
                    key={name}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      isCurrent
                        ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                        : isCreator
                        ? 'bg-slate-800 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>{name}</span>
                    {isCreator && <span className="text-[9px] bg-purple-950 text-purple-300 px-1 rounded font-extrabold">Creator</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - High Contrast on Dark Canvas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setActiveStatusTab('ALL')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeStatusTab === 'ALL'
              ? 'bg-purple-900/80 text-white border-purple-400 shadow-md shadow-purple-900/40'
              : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeStatusTab === 'ALL' ? 'text-purple-200' : 'text-slate-400'}`}>
              Total Tasks
            </span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-white">{stats.total}</p>
          <p className={`text-[11px] mt-0.5 ${activeStatusTab === 'ALL' ? 'text-purple-200' : 'text-slate-400'}`}>All specialized cycles</p>
        </div>

        <div
          onClick={() => setActiveStatusTab('PENDING')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeStatusTab === 'PENDING'
              ? 'bg-blue-900/80 text-white border-blue-400 shadow-md shadow-blue-900/40'
              : 'bg-blue-950/40 text-blue-200 border-blue-500/30 hover:border-blue-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeStatusTab === 'PENDING' ? 'text-blue-200' : 'text-blue-400'}`}>
              Pending / Scheduled
            </span>
            <Calendar className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-white">{stats.pending}</p>
          <p className={`text-[11px] mt-0.5 ${activeStatusTab === 'PENDING' ? 'text-blue-200' : 'text-blue-300'}`}>Awaiting execution</p>
        </div>

        <div
          onClick={() => setActiveStatusTab('IN_PROGRESS')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeStatusTab === 'IN_PROGRESS'
              ? 'bg-amber-900/80 text-white border-amber-400 shadow-md shadow-amber-900/40'
              : 'bg-amber-950/40 text-amber-200 border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeStatusTab === 'IN_PROGRESS' ? 'text-amber-200' : 'text-amber-400'}`}>
              In Progress
            </span>
            <PlayCircle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-white">{stats.inProgress}</p>
          <p className={`text-[11px] mt-0.5 ${activeStatusTab === 'IN_PROGRESS' ? 'text-amber-200' : 'text-amber-300'}`}>Actively being done</p>
        </div>

        <div
          onClick={() => setActiveStatusTab('DONE')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeStatusTab === 'DONE'
              ? 'bg-emerald-900/80 text-white border-emerald-400 shadow-md shadow-emerald-900/40'
              : 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30 hover:border-emerald-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeStatusTab === 'DONE' ? 'text-emerald-200' : 'text-emerald-400'}`}>
              Task Done (Normal Green)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-white">{stats.done}</p>
          <p className={`text-[11px] mt-0.5 ${activeStatusTab === 'DONE' ? 'text-emerald-200' : 'text-emerald-300'}`}>Completed & signed off</p>
        </div>

        <div
          onClick={() => setActiveStatusTab('REPEAT')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeStatusTab === 'REPEAT'
              ? 'bg-teal-900/80 text-white border-teal-400 shadow-md shadow-teal-900/40'
              : 'bg-teal-950/40 text-teal-200 border-teal-500/30 hover:border-teal-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeStatusTab === 'REPEAT' ? 'text-teal-200' : 'text-teal-400'}`}>
              Repeat Tasks
            </span>
            <Repeat className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-white">{stats.repeat}</p>
          <p className={`text-[11px] mt-0.5 ${activeStatusTab === 'REPEAT' ? 'text-teal-200' : 'text-teal-300'}`}>Recurring schedules</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-slate-900 p-4 shadow-sm border border-slate-800 space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Tasks', count: stats.total },
              { id: 'PENDING', label: 'Pending', count: stats.pending },
              { id: 'IN_PROGRESS', label: 'In Progress', count: stats.inProgress },
              { id: 'DONE', label: 'Task Done', count: stats.done },
              { id: 'REPEAT', label: 'Repeat Tasks', count: stats.repeat },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatusTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                  activeStatusTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeStatusTab === tab.id ? 'bg-purple-800 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none bg-slate-800"
            >
              <option value="DEADLINE">Task Deadline</option>
              <option value="WHEN">Scheduled Date</option>
              <option value="PRIORITY">Urgency / Priority</option>
            </select>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task title, location, client, or staff..."
              className="w-full rounded-xl border border-slate-700 pl-9 pr-3 py-2 text-xs font-medium text-white focus:border-red-500 focus:outline-none bg-slate-800 placeholder-slate-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-red-500 focus:outline-none bg-slate-800"
            >
              <option value="ALL">All Task Types</option>
              <option value="GENERAL_FURNITURE_REMOVAL">General Furniture Moval</option>
              <option value="CONFERENCE_ROOM_FURNITURE_REMOVAL">Conference Room Furniture Moval</option>
              <option value="REPEAT_TASK">Repeat Tasks</option>
              <option value="DEEP_CLEANING">Deep Cleaning</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-red-500 focus:outline-none bg-slate-800"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority (Red)</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 p-12 text-center border border-slate-800 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-purple-400 mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white">No deep cleaning tasks found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'ALL' || selectedPriority !== 'ALL'
              ? 'Try changing your search keywords or filter criteria.'
              : 'Authorized team creators (Dayan, Eranga, Pubudu, Ashen) can create and schedule new deep cleaning tasks above.'}
          </p>
          {canCreate && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const catBadge = getCategoryBadge(task.taskType);
            const isDone = task.status === 'DONE';
            const isUrgent = task.priority === 'URGENT';
            const isInProgress = task.status === 'IN_PROGRESS';

            return (
              <div
                key={task.id}
                onClick={() => setSelectedDetailTask(task)}
                className={`group cursor-pointer rounded-2xl p-5 shadow-lg border transition-all hover:scale-[1.01] ${
                  isDone
                    ? 'border-2 border-emerald-500 bg-emerald-950/40 text-emerald-100 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                    : isUrgent
                    ? 'border-2 border-red-500 bg-red-950/40 text-red-100 shadow-md shadow-red-950/40 ring-1 ring-red-500/50'
                    : isInProgress
                    ? 'border-2 border-amber-500 bg-amber-950/40 text-amber-100 ring-1 ring-amber-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                {/* Card Top Row: Code, Category, Priority, and Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                      isDone
                        ? 'bg-emerald-900/80 text-emerald-300 font-black'
                        : isUrgent
                        ? 'bg-red-900/80 text-red-300 font-black'
                        : 'text-slate-300 bg-slate-800'
                    }`}>
                      {task.taskCode}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      isDone ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' : catBadge.bg
                    }`}>
                      {catBadge.label}
                    </span>
                    {task.taskType === 'REPEAT_TASK' && task.repeatFrequency !== 'NONE' && (
                      <span className="inline-flex items-center text-[10px] font-bold text-teal-300 bg-teal-950 border border-teal-500/40 px-1.5 py-0.5 rounded">
                        <Repeat className="h-3 w-3 mr-0.5" />
                        {task.repeatFrequency}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isDone ? (
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-600 text-white shadow-xs flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>DONE</span>
                      </span>
                    ) : (
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Task Title */}
                <h3 className={`text-base font-extrabold leading-snug transition-colors ${
                  isDone
                    ? 'text-emerald-200 group-hover:text-emerald-100'
                    : isUrgent
                    ? 'text-red-200 group-hover:text-white'
                    : isInProgress
                    ? 'text-amber-200 group-hover:text-amber-100'
                    : 'text-white group-hover:text-purple-300'
                }`}>
                  {isDone && <span className="text-emerald-400 mr-1.5">✓</span>}
                  {task.title}
                </h3>

                {/* Description snippet */}
                {task.description && (
                  <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                    isDone ? 'text-emerald-300/90' : isUrgent ? 'text-red-200/90' : 'text-slate-400'
                  }`}>
                    {task.description}
                  </p>
                )}

                {/* Meta details: Client, Location */}
                <div className={`mt-3.5 pt-3 border-t space-y-1.5 text-xs ${
                  isDone ? 'border-emerald-800/80 text-emerald-200' : isUrgent ? 'border-red-800/80 text-red-200' : 'border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <Building2 className={`h-3.5 w-3.5 flex-shrink-0 ${isDone ? 'text-emerald-400' : isUrgent ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="font-semibold truncate">Client: <strong>{task.clientName}</strong></span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${isDone ? 'text-emerald-400' : isUrgent ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{task.location}</span>
                  </div>

                  {/* Date and Timing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${isDone ? 'text-emerald-400' : 'text-blue-400'}`} />
                      <span>When: <strong className="text-white">{task.whenDate}</strong> at {task.startTime || '08:00'}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${isDone ? 'text-emerald-400' : isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
                      <span>Deadline: <strong className={isUrgent ? 'text-red-300 font-black' : 'text-white'}>{task.deadlineDate}</strong> ({task.deadlineTime || '17:00'})</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Members */}
                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between flex-wrap gap-2 ${
                  isDone ? 'border-emerald-800/80' : isUrgent ? 'border-red-800/80' : 'border-slate-800'
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <Users className={`h-3.5 w-3.5 ${isDone ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className={`text-[11px] font-bold ${isDone ? 'text-emerald-300' : 'text-slate-400'}`}>Staff ({task.assignedMembers.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {task.assignedMembers.map((m) => (
                        <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isDone ? 'bg-emerald-900/80 text-emerald-200' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  {isDone ? (
                    <div className="flex items-center space-x-1.5 bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-lg shadow-sm">
                      <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                      <span>TASK DONE (NORMAL GREEN)</span>
                    </div>
                  ) : isInProgress ? (
                    <div className="flex items-center space-x-1 bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>IN PROGRESS</span>
                    </div>
                  ) : isUrgent ? (
                    <div className="flex items-center space-x-1 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm animate-pulse">
                      <Clock className="h-3.5 w-3.5" />
                      <span>URGENT PENDING</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-blue-950 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>PENDING</span>
                    </div>
                  )}
                </div>

                {/* Done details box if completed */}
                {isDone && task.completedByUserName && (
                  <div className="mt-2.5 rounded-xl bg-emerald-900/60 p-2.5 text-xs text-emerald-100 border border-emerald-500/50 flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Completed &amp; Signed off by {task.completedByUserName} on {task.completedAt?.split('T')[0]}</span>
                      {task.completionNotes && <p className="text-emerald-200 font-medium italic mt-0.5">"{task.completionNotes}"</p>}
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    {!isDone ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleInitiateComplete(task, e)}
                          className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Done</span>
                        </button>

                        {!isInProgress && (
                          <button
                            type="button"
                            onClick={(e) => handleStartTask(task.id, e)}
                            className="flex items-center space-x-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                          >
                            <PlayCircle className="h-3.5 w-3.5 text-amber-400" />
                            <span>Start Task</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleReopenTask(task.id, e)}
                        className="flex items-center space-x-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>

                  {canCreate && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Inspection Modal */}
      {selectedDetailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{selectedDetailTask.taskCode}</span>
                  <h3 className="text-base font-bold">{selectedDetailTask.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailTask(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto text-sm text-slate-700">
              {/* Category & Status Banner */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Task Category</span>
                  <span className="text-xs font-bold text-slate-900">{selectedDetailTask.taskType.replace(/_/g, ' ')}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Priority</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${getPriorityBadge(selectedDetailTask.priority)}`}>
                    {selectedDetailTask.priority}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Status</span>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                    selectedDetailTask.status === 'DONE'
                      ? 'bg-emerald-600 text-white'
                      : selectedDetailTask.status === 'IN_PROGRESS'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {selectedDetailTask.status === 'DONE' ? 'TASK DONE ✅' : selectedDetailTask.status}
                  </span>
                </div>
              </div>

              {/* Client & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Informed Client</span>
                  <p className="font-bold text-slate-900">{selectedDetailTask.clientName}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Location Details</span>
                  <p className="font-bold text-slate-900">{selectedDetailTask.location}</p>
                </div>
              </div>

              {/* Schedule and Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase block mb-0.5">When / Start Time</span>
                  <p className="font-extrabold text-slate-900 text-sm">📅 {selectedDetailTask.whenDate} at {selectedDetailTask.startTime || '08:00'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase block mb-0.5">Task Deadline</span>
                  <p className="font-extrabold text-amber-900 text-sm">⏰ {selectedDetailTask.deadlineDate} ({selectedDetailTask.deadlineTime || '17:00'})</p>
                </div>
              </div>

              {/* Description */}
              {selectedDetailTask.description && (
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Client Task Instructions</span>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedDetailTask.description}
                  </div>
                </div>
              )}

              {/* Assigned Members */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Assigned Deep Cleaning Team Members
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedDetailTask.assignedMembers.map((name) => (
                    <span key={name} className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-lg">
                      👤 {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Equipment / Tools */}
              {selectedDetailTask.specialToolsEquipment && selectedDetailTask.specialToolsEquipment.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Special Equipment & Tools Required
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDetailTask.specialToolsEquipment.map((tool) => (
                      <span key={tool} className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg">
                        🔧 {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Log Info */}
              {selectedDetailTask.status === 'DONE' && (
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-300 space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>TASK DONE & SIGNED OFF</span>
                  </div>
                  <p className="text-xs text-emerald-950">
                    Completed by <strong>{selectedDetailTask.completedByUserName}</strong> on {selectedDetailTask.completedAt?.replace('T', ' ').substring(0, 16)}
                  </p>
                  {selectedDetailTask.completionNotes && (
                    <p className="text-xs text-emerald-800 bg-white/70 p-2.5 rounded-lg border border-emerald-200 mt-2 font-medium">
                      "{selectedDetailTask.completionNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Created by {selectedDetailTask.createdByUserName} ({selectedDetailTask.createdAt.split('T')[0]})
                </div>

                <div className="flex items-center space-x-2">
                  {selectedDetailTask.status !== 'DONE' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDetailTask(null);
                        handleInitiateComplete(selectedDetailTask);
                      }}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 transition-colors flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Task Done</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleReopenTask(selectedDetailTask.id);
                        setSelectedDetailTask(null);
                      }}
                      className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-300 transition-colors"
                    >
                      Reopen Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <DeepCleaningTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        currentUser={currentUser}
      />

      {/* Task Completion Modal */}
      <CompleteDeepCleaningModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setTaskToComplete(null);
        }}
        onConfirm={handleConfirmComplete}
        task={taskToComplete}
        currentUser={currentUser}
      />
      {/* Deep Cleaning Teams and Crew Modal */}
      <DeepCleaningTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        currentUser={currentUser}
        onTeamsUpdated={refreshTasks}
      />
    </div>
  );
};
