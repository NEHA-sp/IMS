'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import GanttChart from '@/components/GanttChart';
import KanbanBoard from '@/components/KanbanBoard';
import { api, Task } from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'gantt' | 'kanban'>('gantt');

  const fetchTasks = async () => {
    try {
      const data = await api.get<Task[]>('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ims_token') : null;
    if (!token) {
      router.push('/');
      return;
    }
    fetchTasks();
  }, [router]);

  if (loading) {
    return (
      <MobileLayout role="admin">
        <div className="flex justify-center items-center py-16">
          <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout role="admin">
      <div className="max-w-6xl space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black text-[#0B1A30] tracking-tight">Analytics & Planning</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Visualize task progress, timelines, and workflow distribution.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'gantt'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Gantt Chart
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-21h10a2 2 0 012 2v14a2 2 0 01-2 2m0 0H9m10 0h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m0 0H9" />
            </svg>
            Kanban Board
          </button>
        </div>

        {/* Gantt View */}
        {viewMode === 'gantt' && (
          <div className="space-y-4">
            <GanttChart tasks={tasks} height={500} />
            
            {/* Gantt Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 mb-2">📊 How to Read the Gantt Chart</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Bar Length</strong> = Days remaining until deadline</li>
                <li>• <strong>Color</strong> = Task status (green=done, amber=in progress, red=overdue)</li>
                <li>• <strong>Hover</strong> over bars to see task details and priorities</li>
                <li>• <strong>Sorted</strong> by urgency (most urgent at bottom)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="space-y-4">
            <KanbanBoard
              tasks={tasks}
              onTasksUpdate={setTasks}
              isLoading={loading}
            />
            
            {/* Kanban Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-amber-900 mb-2">📋 How to Use Kanban Board</h3>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• <strong>Drag & Drop</strong> tasks to change their status</li>
                <li>• <strong>Card Color</strong> = Priority level (red=high, orange=medium, green=low)</li>
                <li>• <strong>Column Count</strong> shows tasks in each status</li>
                <li>• <strong>Quick Overview</strong> of entire workflow distribution</li>
              </ul>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <div className="text-sm font-bold text-slate-600">Total Tasks</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{tasks.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <div className="text-sm font-bold text-slate-600">In Progress</div>
            <div className="text-2xl font-black text-amber-500 mt-1">
              {tasks.filter(t => (t.assignment_status || t.status) === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <div className="text-sm font-bold text-slate-600">Completed</div>
            <div className="text-2xl font-black text-emerald-500 mt-1">
              {tasks.filter(t => (t.assignment_status || t.status) === 'completed').length}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <div className="text-sm font-bold text-slate-600">Blocked</div>
            <div className="text-2xl font-black text-red-500 mt-1">
              {tasks.filter(t => (t.assignment_status || t.status) === 'blocked').length}
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
