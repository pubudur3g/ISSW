import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  Users,
  Repeat,
  Package,
  CheckCircle2,
  Wrench,
  Layers,
} from 'lucide-react';
import {
  DeepCleaningTask,
  DeepCleaningTaskType,
  DeepCleaningTaskPriority,
  RepeatFrequency,
  User,
  DeepCleaningTeam,
  CleaningSite,
} from '../types';
import { StorageService } from '../lib/storage';

interface DeepCleaningTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: DeepCleaningTask) => void;
  initialTask?: DeepCleaningTask | null;
  currentUser: User;
}

const COMMON_TOOLS = [
  'Heavy-duty Furniture Dolly',
  'Felt Sliders',
  'Industrial Carpet Extractor',
  'Single-disc Rotary Machine',
  'Wet Vacuum Extractor',
  'High-Pressure Steam Cleaner',
  'Telescopic Carbon Extension Poles',
  'Corner Guards & Straps',
  'Alkaline Degreaser Kit',
  'Floor Stripping Pads',
  'Safety Harness & PPE',
];

export const DeepCleaningTaskModal: React.FC<DeepCleaningTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  currentUser,
}) => {
  const [sites, setSites] = useState<CleaningSite[]>([]);
  const [rosterMembers, setRosterMembers] = useState<string[]>([]);
  const [teams, setTeams] = useState<DeepCleaningTeam[]>([]);
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<DeepCleaningTaskType>('DEEP_CLEANING');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [siteId, setSiteId] = useState('');
  const [whenDate, setWhenDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('17:00');
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('NONE');
  const [priority, setPriority] = useState<DeepCleaningTaskPriority>('HIGH');
  const [description, setDescription] = useState('');
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customToolInput, setCustomToolInput] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setSites(StorageService.getSites());
      setRosterMembers(StorageService.getDeepCleaningTeamMembers());
      setTeams(StorageService.getDeepCleaningTeams());
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setTaskType(initialTask.taskType);
      setClientName(initialTask.clientName || '');
      setLocation(initialTask.location);
      setSiteId(initialTask.siteId || '');
      setWhenDate(initialTask.whenDate);
      setStartTime(initialTask.startTime || '08:00');
      setDeadlineDate(initialTask.deadlineDate);
      setDeadlineTime(initialTask.deadlineTime || '17:00');
      setRepeatFrequency(initialTask.repeatFrequency || 'NONE');
      setPriority(initialTask.priority);
      setDescription(initialTask.description);
      setAssignedMembers(initialTask.assignedMembers || []);
      setSelectedTools(initialTask.specialToolsEquipment || []);
    } else {
      // Default new task setup
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setTaskType('DEEP_CLEANING');
      setClientName('');
      setLocation('');
      setSiteId('');
      setWhenDate(today);
      setStartTime('08:00');
      setDeadlineDate(today);
      setDeadlineTime('17:00');
      setRepeatFrequency('NONE');
      setPriority('HIGH');
      setDescription('');
      setAssignedMembers([currentUser.name]);
      setSelectedTools([]);
    }
    setErrors({});
  }, [initialTask, isOpen, currentUser]);

  if (!isOpen) return null;

  const toggleMember = (memberName: string) => {
    setAssignedMembers((prev) =>
      prev.includes(memberName)
        ? prev.filter((m) => m !== memberName)
        : [...prev, memberName]
    );
  };

  const handleAssignEntireTeam = (team: DeepCleaningTeam) => {
    const combined = Array.from(new Set([...assignedMembers, ...team.members]));
    setAssignedMembers(combined);
  };

  const handleClearAssigned = () => {
    setAssignedMembers([]);
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleAddCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (customToolInput.trim() && !selectedTools.includes(customToolInput.trim())) {
      setSelectedTools([...selectedTools, customToolInput.trim()]);
      setCustomToolInput('');
    }
  };

  const handleSiteChange = (selectedSiteId: string) => {
    setSiteId(selectedSiteId);
    if (selectedSiteId) {
      const site = sites.find((s) => s.id === selectedSiteId);
      if (site) {
        setLocation(`${site.name} - ${site.address}`);
        if (!clientName) {
          setClientName(site.name.replace(/^(Site [A-Z]|Office Building [A-Z]|Hotel|School|Shopping Centre)\s*\((.*?)\)/, '$2') || site.name);
        }
      }
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Task title or summary is required';
    if (!clientName.trim()) newErrors.clientName = 'Client name or requester is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!whenDate) newErrors.whenDate = 'Scheduled date ("When") is required';
    if (!deadlineDate) newErrors.deadlineDate = 'Deadline date is required';
    if (assignedMembers.length === 0) newErrors.assignedMembers = 'Assign at least one Deep Cleaning team member';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const taskCode = initialTask?.taskCode || `DCT-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const matchedSite = sites.find((s) => s.id === siteId);

    const taskPayload: DeepCleaningTask = {
      id: initialTask?.id || `task-dc-${Date.now()}`,
      taskCode,
      title: title.trim(),
      taskType,
      location: location.trim(),
      siteId: siteId || undefined,
      siteName: matchedSite?.name || undefined,
      clientName: clientName.trim(),
      whenDate,
      startTime: startTime || '08:00',
      deadlineDate,
      deadlineTime: deadlineTime || '17:00',
      repeatFrequency: taskType === 'REPEAT_TASK' ? repeatFrequency : 'NONE',
      description: description.trim(),
      assignedMembers,
      priority,
      status: initialTask?.status || 'PENDING',
      specialToolsEquipment: selectedTools,
      createdByUserId: initialTask?.createdByUserId || currentUser.id,
      createdByUserName: initialTask?.createdByUserName || currentUser.name,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
      completedAt: initialTask?.completedAt,
      completedByUserId: initialTask?.completedByUserId,
      completedByUserName: initialTask?.completedByUserName,
      completionNotes: initialTask?.completionNotes,
    };

    onSave(taskPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialTask ? 'Edit Deep Cleaning Task' : 'Add New Deep Cleaning Task'}
              </h3>
              <p className="text-xs text-slate-300">
                Authorized Task Creator: <span className="font-semibold text-emerald-400">{currentUser.name}</span> ({currentUser.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto space-y-5">
          {/* Task Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Task Category / Type *
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as DeepCleaningTaskType)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50"
              >
                <option value="GENERAL_FURNITURE_REMOVAL">📦 General Furniture Removal / Movement</option>
                <option value="CONFERENCE_ROOM_FURNITURE_REMOVAL">🏢 Conference Room Furniture Removal</option>
                <option value="REPEAT_TASK">🔁 Repeat Tasks (Scheduled Recurrence)</option>
                <option value="DEEP_CLEANING">✨ Deep Cleaning (Floor, Kitchen, High-Level)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urgency / Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DeepCleaningTaskPriority)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50"
              >
                <option value="URGENT">🔴 URGENT Priority (Immediate / Strict Client Deadline)</option>
                <option value="HIGH">🟠 HIGH Priority (Client Priority Request)</option>
                <option value="MEDIUM">🔵 MEDIUM Priority (Standard Service Window)</option>
                <option value="LOW">⚪ LOW Priority (Flexible Schedule)</option>
              </select>
            </div>
          </div>

          {/* Repeat Frequency if Repeat Task */}
          {taskType === 'REPEAT_TASK' && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
              <label className="flex items-center text-xs font-bold text-teal-900 uppercase tracking-wider mb-1.5">
                <Repeat className="h-4 w-4 mr-1.5 text-teal-600" />
                Repeat Frequency Cycle
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'] as RepeatFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setRepeatFrequency(freq)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                      repeatFrequency === freq
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-100/50'
                    }`}
                  >
                    {freq === 'BI_WEEKLY' ? 'Bi-Weekly' : freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task Title / Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              What is the Task? (Title / Summary) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conference Room Furniture Removal & Carpet Deep Extraction"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.title}</p>}
          </div>

          {/* Site Link & Client Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Link to Cleaning Site (Optional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={siteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">-- Select Managed Site (or manual location) --</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client Name / Requester *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Grand Galleria Operations, Nordic Corp HQ"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.clientName && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.clientName}</p>}
            </div>
          </div>

          {/* Location Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Specific Location / Room / Floor *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. HQ Main Tower - 4th Floor Executive Boardroom Suite B"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {errors.location && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.location}</p>}
          </div>

          {/* Timing Section: When vs Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* When / Start Time */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold text-slate-900 flex items-center">
                <Calendar className="h-4 w-4 text-emerald-600 mr-1.5" />
                When (Scheduled Start Date &amp; Time)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={whenDate}
                    onChange={(e) => setWhenDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
              {errors.whenDate && <p className="text-xs text-rose-600 font-semibold">{errors.whenDate}</p>}
            </div>

            {/* Deadline */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold text-slate-900 flex items-center">
                <Clock className="h-4 w-4 text-amber-600 mr-1.5" />
                Task Deadline
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Deadline Time</label>
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
              {errors.deadlineDate && <p className="text-xs text-rose-600 font-semibold">{errors.deadlineDate}</p>}
            </div>
          </div>

          {/* Assigned Members from Deep Cleaning Teams & Roster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Deep Cleaning Crew * ({assignedMembers.length} selected)
              </label>
              <div className="flex items-center space-x-2">
                {assignedMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAssigned}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-[11px] text-slate-500 font-medium">Authorized Roster</span>
              </div>
            </div>

            {/* Quick Team Assignment Buttons */}
            {teams.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                  <Layers className="h-3 w-3 text-indigo-500" />
                  <span>1-Click Team Assignment:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAssignEntireTeam(t)}
                      className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center space-x-1.5 transition active:scale-95"
                    >
                      <Users className="h-3 w-3" />
                      <span>{t.name} ({t.members.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
              {rosterMembers.map((memberName) => {
                const isSelected = assignedMembers.includes(memberName);
                return (
                  <button
                    key={memberName}
                    type="button"
                    onClick={() => toggleMember(memberName)}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-left border transition-all text-xs font-semibold ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                    <span className="truncate">{memberName}</span>
                  </button>
                );
              })}
            </div>
            {errors.assignedMembers && (
              <p className="text-xs text-rose-600 mt-1.5 font-semibold">{errors.assignedMembers}</p>
            )}
          </div>

          {/* Description & Client Specific Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Details &amp; Client Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specific instructions (e.g. Move 20 conference chairs to temporary storage room 204, run hot water extraction on stain zone, use felt sliders)..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Special Tools and Equipment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Required Special Tools &amp; Machinery
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TOOLS.map((tool) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tool}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customToolInput}
                onChange={(e) => setCustomToolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTool(e);
                  }
                }}
                placeholder="Type custom equipment and press Enter (e.g. Heavy Straps, Scaffolding)..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomTool}
                className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Add Tool
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{initialTask ? 'Save Changes' : 'Schedule & Send Task Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
