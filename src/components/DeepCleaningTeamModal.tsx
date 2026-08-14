import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Crown,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { DeepCleaningTeam, User, canUserManageDeepCleaningTeam } from '../types';
import { StorageService } from '../lib/storage';

interface DeepCleaningTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTeamsUpdated: () => void;
}

export const DeepCleaningTeamModal: React.FC<DeepCleaningTeamModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTeamsUpdated,
}) => {
  const [teams, setTeams] = useState<DeepCleaningTeam[]>([]);
  const [rosterMembers, setRosterMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'TEAMS' | 'ROSTER'>('TEAMS');

  // New / Editing Team State
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamId, setTeamId] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [teamLeader, setTeamLeader] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamNotes, setTeamNotes] = useState<string>('');

  // Add Member State
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [selectedExistingUser, setSelectedExistingUser] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const canManage = canUserManageDeepCleaningTeam(currentUser);

  const refreshData = () => {
    setTeams(StorageService.getDeepCleaningTeams());
    setRosterMembers(StorageService.getDeepCleaningTeamMembers());
    setAllUsers(StorageService.getUsers().filter((u) => u.active));
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setIsEditingTeam(false);
      resetTeamForm();
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const resetTeamForm = () => {
    setTeamId('');
    setTeamName('');
    setTeamLeader(currentUser.name || '');
    setSelectedMembers([]);
    setTeamNotes('');
  };

  const handleStartCreateTeam = () => {
    resetTeamForm();
    setIsEditingTeam(true);
  };

  const handleStartEditTeam = (team: DeepCleaningTeam) => {
    setTeamId(team.id);
    setTeamName(team.name);
    setTeamLeader(team.leader || '');
    setSelectedMembers(team.members || []);
    setTeamNotes(team.notes || '');
    setIsEditingTeam(true);
  };

  const handleToggleMember = (name: string) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMsg('Please enter a team name.');
      return;
    }
    if (selectedMembers.length === 0) {
      setErrorMsg('Please select at least 1 member for the team.');
      return;
    }

    const teamToSave: DeepCleaningTeam = {
      id: teamId || `team-dc-${Date.now()}`,
      name: teamName.trim(),
      leader: teamLeader.trim() || undefined,
      members: selectedMembers,
      notes: teamNotes.trim() || undefined,
    };

    StorageService.saveDeepCleaningTeam(teamToSave, currentUser);
    refreshData();
    onTeamsUpdated();
    setIsEditingTeam(false);
    resetTeamForm();
    setSuccessMsg(`Team "${teamToSave.name}" saved successfully!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove the team "${name}"?`)) {
      StorageService.deleteDeepCleaningTeam(id, currentUser);
      refreshData();
      onTeamsUpdated();
      setSuccessMsg(`Team "${name}" removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddMemberToRoster = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToAdd = selectedExistingUser || newMemberName.trim();
    if (!nameToAdd) {
      setErrorMsg('Please specify a staff member name to add.');
      return;
    }

    if (rosterMembers.some((m) => m.toLowerCase() === nameToAdd.toLowerCase())) {
      setErrorMsg(`${nameToAdd} is already in the Deep Cleaning team roster.`);
      return;
    }

    StorageService.addDeepCleaningTeamMember(nameToAdd, currentUser);
    refreshData();
    onTeamsUpdated();
    setNewMemberName('');
    setSelectedExistingUser('');
    setErrorMsg('');
    setSuccessMsg(`Added ${nameToAdd} to Deep Cleaning roster.`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleRemoveMemberFromRoster = (name: string) => {
    if (rosterMembers.length <= 1) {
      setErrorMsg('You must have at least 1 member in the roster.');
      return;
    }
    if (confirm(`Remove ${name} from Deep Cleaning authorization roster?`)) {
      StorageService.removeDeepCleaningTeamMember(name, currentUser);
      refreshData();
      onTeamsUpdated();
      setSuccessMsg(`Removed ${name} from roster.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="deep-cleaning-team-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-500 text-white shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Deep Cleaning Teams &amp; Crew Roster
                </h3>
                <span className="rounded-md bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Admin &amp; Supervisor Control
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Foremen, Supervisors, and Admins can configure specialized teams and authorize crew members.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center space-x-2 text-xs font-bold text-emerald-800 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center space-x-2 text-xs font-bold text-rose-800 animate-fade-in">
            <X className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('TEAMS');
              setIsEditingTeam(false);
            }}
            className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-black transition ${
              activeTab === 'TEAMS'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Specialized Teams ({teams.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ROSTER');
              setIsEditingTeam(false);
            }}
            className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-black transition ${
              activeTab === 'ROSTER'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Authorized Crew Members ({rosterMembers.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {activeTab === 'TEAMS' && !isEditingTeam && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Configured Specialized Teams</h4>
                  <p className="text-xs text-slate-500">
                    Group staff into ready squads for 1-click assignment in Deep Cleaning tasks.
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={handleStartCreateTeam}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-sm transition active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Team</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.length === 0 ? (
                  <div className="col-span-2 text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No teams created yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;Create New Team&quot; above to organize your cleaners.
                    </p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 transition space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs">
                              {team.name.charAt(0)}
                            </span>
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-sm">{team.name}</h5>
                              {team.leader && (
                                <p className="text-[11px] text-amber-700 flex items-center space-x-1 font-bold mt-0.5">
                                  <Crown className="h-3 w-3 text-amber-500" />
                                  <span>Lead: {team.leader}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          {canManage && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleStartEditTeam(team)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                                title="Edit Team"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(team.id, team.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                                title="Delete Team"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {team.notes && (
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {team.notes}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                            Team Members ({team.members?.length || 0})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {team.members?.map((m) => (
                              <span
                                key={m}
                                className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'TEAMS' && isEditingTeam && (
            <form onSubmit={handleSaveTeam} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>{teamId ? 'Edit Team Configuration' : 'Create New Deep Cleaning Team'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingTeam(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Team Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Heavy Furniture Squad, Floor Strip & Polish Crew"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Team Leader / Foreman
                  </label>
                  <input
                    type="text"
                    value={teamLeader}
                    onChange={(e) => setTeamLeader(e.target.value)}
                    placeholder="e.g. Dayan, Pasi Ylitalo"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Team Specialization &amp; Notes
                </label>
                <input
                  type="text"
                  value={teamNotes}
                  onChange={(e) => setTeamNotes(e.target.value)}
                  placeholder="e.g. Equipped with carpet extractors, heavy dollies, and floor polishers"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  Select Team Members from Roster ({selectedMembers.length} selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {rosterMembers.map((m) => {
                    const isSelected = selectedMembers.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleMember(m)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition text-left ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-1 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingTeam(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-md active:scale-95 transition"
                >
                  Save Team
                </button>
              </div>
            </form>
          )}

          {activeTab === 'ROSTER' && (
            <div className="space-y-6">
              {/* Add New Member Section (Foreman, Supervisors, Admin) */}
              {canManage && (
                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-200 p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
                    <UserPlus className="h-4 w-4 text-indigo-600" />
                    <span>Add Staff to Deep Cleaning Roster</span>
                  </h4>
                  <p className="text-xs text-indigo-800">
                    Add registered company employees or specialized technician names to allow them in Deep Cleaning teams and task assignments.
                  </p>

                  <form onSubmit={handleAddMemberToRoster} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-black text-indigo-950 mb-1">
                        Select from Registered Staff
                      </label>
                      <select
                        value={selectedExistingUser}
                        onChange={(e) => {
                          setSelectedExistingUser(e.target.value);
                          if (e.target.value) setNewMemberName('');
                        }}
                        className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600"
                      >
                        <option value="">-- Choose Existing Employee ({allUsers.length}) --</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-black text-indigo-950 mb-1">
                        Or Type Name Directly
                      </label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => {
                          setNewMemberName(e.target.value);
                          if (e.target.value) setSelectedExistingUser('');
                        }}
                        placeholder="e.g. Specialist Cleaner"
                        className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600"
                      />
                    </div>

                    <div className="md:col-span-3 flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 shadow-xs active:scale-95 transition"
                      >
                        Add to Roster
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Roster List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Current Authorized Members ({rosterMembers.length})
                  </h4>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {rosterMembers
                    .filter((m) => m.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map((name) => {
                      const isInitialCore = [
                        'Pasi Ylitalo',
                        'Dayan',
                        'Eranga',
                        'Pubudu',
                        'Ujitha',
                        'Szabina',
                        'Subashana',
                        'Koshitha',
                        'Ashen',
                        'Yugan',
                      ].includes(name);

                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:border-slate-300"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-black text-xs">
                              {name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">{name}</p>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {isInitialCore ? 'Core Deep Cleaner' : 'Added Specialist'}
                              </span>
                            </div>
                          </div>

                          {canManage && (
                            <button
                              onClick={() => handleRemoveMemberFromRoster(name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                              title="Remove from roster"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {canManage
              ? 'Authorized: Foreman, Supervisors, and Admin have permissions to update teams & roster.'
              : 'View-only mode: Contact a Foreman or Supervisor to modify teams.'}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
