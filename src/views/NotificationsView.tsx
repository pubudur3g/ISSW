import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Flame,
} from 'lucide-react';
import { AppNotification, User } from '../types';
import { StorageService } from '../lib/storage';

interface NotificationsViewProps {
  currentUser?: User;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const user = currentUser || StorageService.getCurrentUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'PRIORITY' | 'DEEP_CLEANING' | 'UNREAD'>('ALL');

  const refreshNotifications = () => {
    if (user) {
      setNotifications(StorageService.getNotificationsForUser(user));
    } else {
      setNotifications(StorageService.getNotifications());
    }
  };

  useEffect(() => {
    refreshNotifications();
    const handleDataUpdate = () => {
      refreshNotifications();
    };
    window.addEventListener('cleanstock_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('cleanstock_data_updated', handleDataUpdate);
    };
  }, [user]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    StorageService.markNotificationAsRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    StorageService.markAllNotificationsAsRead();
    refreshNotifications();
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      StorageService.markNotificationAsRead(n.id);
      refreshNotifications();
    }
    if (n.relatedTab && onNavigateTab) {
      onNavigateTab(n.relatedTab);
    }
  };

  // Sort: Priority Unread First, then unread, then priority read, then chronological
  const sortedNotifications = [...notifications].sort((a, b) => {
    const aPriorityScore = (a.isPriority || a.type === 'DEEP_CLEANING' ? 2 : 0) + (!a.read ? 4 : 0);
    const bPriorityScore = (b.isPriority || b.type === 'DEEP_CLEANING' ? 2 : 0) + (!b.read ? 4 : 0);
    if (aPriorityScore !== bPriorityScore) {
      return bPriorityScore - aPriorityScore;
    }
    return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
  });

  const filteredNotifications = sortedNotifications.filter((n) => {
    if (filterType === 'PRIORITY') return n.isPriority;
    if (filterType === 'DEEP_CLEANING') return n.type === 'DEEP_CLEANING';
    if (filterType === 'UNREAD') return !n.read;
    return true;
  });

  const priorityCount = notifications.filter((n) => (n.isPriority || n.type === 'DEEP_CLEANING') && !n.read).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Alerts &amp; Notifications Center
            </h2>
            {priorityCount > 0 && (
              <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white shadow-xs animate-pulse">
                {priorityCount} High Priority
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized task dispatches, deep cleaning alerts, store reorders, and stock movements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-xs transition"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('PRIORITY')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
            filterType === 'PRIORITY'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Priority Tasks ({notifications.filter((n) => n.isPriority).length})</span>
        </button>
        <button
          onClick={() => setFilterType('DEEP_CLEANING')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
            filterType === 'DEEP_CLEANING'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Deep Cleaning ({notifications.filter((n) => n.type === 'DEEP_CLEANING').length})</span>
        </button>
        <button
          onClick={() => setFilterType('UNREAD')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
            filterType === 'UNREAD'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-800">No notifications found.</p>
            <p className="text-xs text-slate-500 mt-1">You are all up to date in this view.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !n.read;
            const isDeepCleaning = n.type === 'DEEP_CLEANING';
            const isPriority = n.isPriority;

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer ${
                  isDeepCleaning && isUnread
                    ? 'bg-gradient-to-r from-emerald-50/90 to-indigo-50/70 border-emerald-300 shadow-sm hover:border-emerald-400'
                    : isPriority && isUnread
                    ? 'bg-rose-50/80 border-rose-300 shadow-sm hover:border-rose-400'
                    : isUnread
                    ? 'bg-amber-50/70 border-amber-200 shadow-xs hover:border-amber-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-xs ${
                      isDeepCleaning
                        ? 'bg-emerald-600'
                        : n.severity === 'error'
                        ? 'bg-rose-500'
                        : n.severity === 'warning'
                        ? 'bg-amber-500'
                        : n.severity === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {isDeepCleaning ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPriority && (
                        <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                          <Flame className="h-3 w-3" />
                          <span>Priority Task</span>
                        </span>
                      )}
                      {isDeepCleaning && (
                        <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-900 uppercase tracking-wider">
                          Deep Cleaning Task
                        </span>
                      )}
                      {isUnread && (
                        <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-black text-white uppercase">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {n.message}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{n.date}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{n.time}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  {n.relatedTab && (
                    <span className="inline-flex items-center space-x-1 text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl group-hover:bg-indigo-100 transition">
                      <span>View Task</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}

                  {isUnread && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition"
                      title="Mark as Read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
