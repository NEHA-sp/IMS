'use client';

import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import KanbanBoard from '@/components/KanbanBoard';
import { api, Task } from '@/lib/api';

const FILTER_TABS = [
  { label: 'All',         value: 'All' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed',   value: 'completed' },
  { label: 'Blocked',     value: 'blocked' },
  { label: 'Pending',     value: 'pending' },
  { label: 'Under Review',value: 'under_review' },
] as const;

const PRIORITY_STYLE: Record<string, string> = {
  high:   'text-red-500',
  medium: 'text-amber-500',
  low:    'text-emerald-600',
};
const PRIORITY_LABEL: Record<string, string> = {
  high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority',
};

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending:      { label: 'Pending',      cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  in_progress:  { label: 'In Progress',  cls: 'bg-amber-400 text-white' },
  under_review: { label: 'Under Review', cls: 'bg-purple-100 text-purple-700' },
  completed:    { label: 'Verified',     cls: 'bg-emerald-100 text-emerald-700' },
  blocked:      { label: 'Blocked',      cls: 'bg-red-100 text-red-600' },
};

function getDueLabel(deadline: string | null, status: string): { label: string; cls: string; icon: React.ReactNode } | null {
  if (status === 'completed') {
    return {
      label: 'Done',
      cls: 'text-emerald-600',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
  }
  if (status === 'blocked') {
    return {
      label: 'Blocked',
      cls: 'text-red-500',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    };
  }
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  let label = '';
  if (diffMs < 0) label = 'Overdue';
  else if (diffH < 2) label = 'Due in 2h';
  else if (diffD === 0) label = 'Due today';
  else if (diffD === 1) label = 'Tomorrow';
  else label = `Due in ${diffD}d`;

  const overdue = diffMs < 0;
  return {
    label,
    cls: overdue ? 'text-red-500' : 'text-slate-500',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
}

function getCompletedAgo(createdAt: string): string {
  const diffMs = new Date().getTime() - new Date(createdAt).getTime();
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD === 0) return 'Completed today';
  if (diffD === 1) return 'Completed 1 day ago';
  return `Completed ${diffD} days ago`;
}

function AvatarIcon({ name }: { name?: string }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500'];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-[9px] font-black flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Propose modal
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [proposing, setProposing] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchTasks = async () => {
    try {
      const data = await api.get<Task[]>('/tasks/intern/assigned');
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleProposeTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) { setModalError('Title and description are required.'); return; }
    setProposing(true); setModalError('');
    try {
      await api.post('/tasks/propose', {
        title: newTitle, description: newDesc,
        deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
        priority: newPriority,
      });
      setNewTitle(''); setNewDesc(''); setNewDeadline(''); setNewPriority('medium');
      setShowProposeModal(false);
      fetchTasks();
    } catch (err: any) {
      setModalError(err.message || 'Failed to propose task.');
    } finally { setProposing(false); }
  };

  const handleUpdateStatus = async (taskId: number, currentStatus: string) => {
    if (currentStatus === 'under_review' || currentStatus === 'blocked') return;
    let nextStatus: Task['status'] = 'in_progress';
    if (currentStatus === 'pending') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'pending';
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus, assignment_status: nextStatus } : t));
    } catch (err) { console.error('Failed to update task status:', err); }
  };

  const filteredTasks = tasks.filter((t) => {
    const tStatus = t.assignment_status || t.status;
    const matchFilter = activeFilter === 'All' || tStatus === activeFilter;
    const matchSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const countByStatus = (s: string) =>
    s === 'All' ? tasks.length : tasks.filter(t => (t.assignment_status || t.status) === s).length;

  return (
    <MobileLayout role="intern">
      <div className="max-w-2xl space-y-5">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-3xl font-black text-[#0B1A30] tracking-tight">Assignment Board</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Track your academic goals and administrative tasks.
          </p>
        </div>

        {/* ── View Mode Toggle ── */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-21h10a2 2 0 012 2v14a2 2 0 01-2 2m0 0H9m10 0h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m0 0H9" />
            </svg>
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            List
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            const count = countByStatus(tab.value);
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B1A30] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search Bar ── */}
        {viewMode === 'list' && (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
          />
        </div>
        )}

        {/* ── Kanban View ── */}
        {viewMode === 'kanban' && (
          loading ? (
            <div className="flex justify-center py-16">
              <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              onTasksUpdate={setTasks}
              isLoading={loading}
            />
          )
        )}

        {/* ── List View ── */}
        {viewMode === 'list' && (
        <>
        {/* ── Task List ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-14 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-500">No tasks found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different filter or propose a new task.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const tStatus = task.assignment_status || task.status;
              const isCompleted = tStatus === 'completed';
              const isBlocked = tStatus === 'blocked';
              const dueInfo = getDueLabel(task.deadline, tStatus);
              const statusPill = STATUS_PILL[tStatus] || STATUS_PILL.pending;
              const priorityCls = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.low;
              const priorityLabel = PRIORITY_LABEL[task.priority] || 'Low Priority';
              const canAdvance = !isCompleted && !isBlocked && tStatus !== 'under_review';

              return (
                <div
                  key={task.id}
                  className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all ${
                    isCompleted ? 'opacity-70' : 'hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  {/* Top row: priority + due */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-black ${priorityCls}`}>
                      {priorityLabel}
                    </span>
                    {dueInfo && (
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${dueInfo.cls}`}>
                        {dueInfo.icon}
                        {dueInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className={`text-base font-black text-[#0B1A30] leading-snug mb-1.5 ${
                    isCompleted ? 'line-through text-slate-400' : ''
                  }`}>
                    {task.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {task.description}
                  </p>

                  {/* Completed ago text */}
                  {isCompleted && (
                    <p className="text-[11px] text-slate-400 font-medium mb-3">
                      {getCompletedAgo(task.created_at)}
                    </p>
                  )}

                  {/* Blocker badge */}
                  {isBlocked && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Missing Contact Info
                      </span>
                    </div>
                  )}

                  {/* Bottom row: avatar + status pill */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <AvatarIcon name={task.created_by_name} />
                      {task.deadline && !isCompleted && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Status pill (clickable to advance) */}
                    <button
                      onClick={() => canAdvance && handleUpdateStatus(task.id, tStatus)}
                      className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all ${statusPill.cls} ${
                        canAdvance ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                      }`}
                    >
                      {statusPill.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Propose New Task Dashed Card (List View Only) ── */}
        {viewMode === 'list' && (
        <button
          onClick={() => setShowProposeModal(true)}
          className="w-full bg-white border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl py-7 flex flex-col items-center gap-2 transition-all group cursor-pointer shadow-sm"
        >
          <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 group-hover:border-amber-400 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-600 group-hover:text-slate-800">Propose New Task</p>
            <p className="text-xs text-slate-400 font-medium">Subject to administrator approval</p>
          </div>
        </button>
        </>
        )}

        {/* ── Floating Action Button ── */}
        <button
          onClick={() => setShowProposeModal(true)}
          className="fixed bottom-8 right-8 w-12 h-12 bg-[#0B1A30] hover:bg-[#162235] text-white rounded-2xl shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-30"
          title="Propose Task"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

      </div>

      {/* ── Propose Task Modal ── */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-fadeIn overflow-hidden">

            {/* Modal Header */}
            <div className="bg-[#0B1A30] px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intern Portal</p>
                <h2 className="text-lg font-black text-white">Propose New Task</h2>
              </div>
              <button
                onClick={() => { setShowProposeModal(false); setModalError(''); }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleProposeTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Task Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Summarize Laxmikanth Chapter 6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Objective Details</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Provide research outlines or model draft questions..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">Deadline</label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">Priority</label>
                    <div className="grid grid-cols-3 bg-slate-100 rounded-xl p-1 border border-slate-200">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                            newPriority === p
                              ? p === 'high' ? 'bg-red-500 text-white shadow-sm'
                              : p === 'medium' ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={proposing}
                  className="w-full py-3.5 bg-[#0B1A30] hover:bg-[#162235] disabled:opacity-50 text-white font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {proposing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit for Mentor Approval
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </MobileLayout>
  );
}
