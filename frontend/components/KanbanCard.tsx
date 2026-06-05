'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskAssignment } from './KanbanBoard';

interface KanbanCardProps {
  task: TaskAssignment;
  isUpdating: boolean;
}

export default function KanbanCard({ task, isUpdating }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const PRIORITY_COLOR: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const daysLeft = task.deadline
    ? Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-3 border border-slate-200 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : 'shadow-sm hover:shadow-md'
      } ${isUpdating ? 'opacity-75' : ''}`}
    >
      {/* Task Title */}
      <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Priority Badge */}
      {task.priority && (
        <div className="mb-2 inline-block">
          <span className={`text-xs font-medium px-2 py-1 rounded border ${PRIORITY_COLOR[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      )}

      {/* Deadline Info */}
      {task.deadline && (
        <div className={`text-xs font-medium mt-2 ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isOverdue ? (
              <span>🔴 Overdue</span>
            ) : daysLeft === 0 ? (
              <span>📌 Due today</span>
            ) : daysLeft && daysLeft <= 2 ? (
              <span>⚠️ Due in {daysLeft}d</span>
            ) : (
              <span>{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isUpdating && (
        <div className="mt-2 text-xs text-slate-500 animate-pulse">
          Updating...
        </div>
      )}
    </div>
  );
}
