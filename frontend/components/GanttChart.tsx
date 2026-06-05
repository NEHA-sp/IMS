'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Task } from '@/lib/api';

interface GanttChartProps {
  tasks: Task[];
  height?: number;
}

interface GanttData {
  id: number;
  title: string;
  daysUntilDue: number;
  daysPassed: number;
  isOverdue: boolean;
  priority: string;
  status: string;
}

export default function GanttChart({ tasks, height = 400 }: GanttChartProps) {
  const data: GanttData[] = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.deadline) // Only show tasks with deadlines
      .map((task) => {
        const deadline = new Date(task.deadline);
        const daysUntilDue = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const created = new Date(task.created_at);
        const daysPassed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;

        return {
          id: task.id,
          title: task.title.length > 25 ? task.title.substring(0, 22) + '...' : task.title,
          daysUntilDue: Math.max(0, daysUntilDue),
          daysPassed: Math.max(0, daysPassed),
          isOverdue,
          priority: task.priority,
          status: task.assignment_status || task.status,
        };
      })
      .sort((a, b) => b.daysUntilDue - a.daysUntilDue);
  }, [tasks]);

  const getBarColor = (task: GanttData): string => {
    if (task.status === 'completed') return '#10b981'; // emerald
    if (task.status === 'blocked') return '#ef4444'; // red
    if (task.isOverdue) return '#dc2626'; // dark red
    if (task.status === 'in_progress') return '#f59e0b'; // amber
    if (task.status === 'under_review') return '#a78bfa'; // purple
    return '#94a3b8'; // slate
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-bold text-slate-900">{data.title}</p>
          <p className="text-xs text-slate-600">
            {data.isOverdue ? (
              <span className="text-red-600">🔴 Overdue by {Math.abs(data.daysUntilDue)} days</span>
            ) : (
              <span className="text-emerald-600">⏱️ {data.daysUntilDue} days remaining</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Status: <span className="font-semibold capitalize">{data.status}</span>
          </p>
          <p className="text-xs text-slate-500">
            Priority: <span className="font-semibold capitalize">{data.priority}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-semibold text-slate-500">No tasks with deadlines</p>
          <p className="text-xs text-slate-400 mt-1">Add deadlines to your tasks to see the Gantt view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Task Timeline</h3>
        <p className="text-xs text-slate-600 mt-1">Visual deadline and progress tracking</p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <YAxis
            type="category"
            dataKey="title"
            stroke="#94a3b8"
            style={{ fontSize: '11px' }}
            width={195}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
          <Bar dataKey="daysUntilDue" radius={[0, 4, 4, 0]} fill="#3b82f6">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-slate-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-slate-600">Under Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-600" />
          <span className="text-slate-600">Blocked/Overdue</span>
        </div>
      </div>
    </div>
  );
}
