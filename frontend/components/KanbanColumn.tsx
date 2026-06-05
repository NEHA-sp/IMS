'use client';

import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { TaskAssignment } from './KanbanBoard';

interface KanbanColumnProps {
  columnId: string;
  label: string;
  tasks: TaskAssignment[];
  color: string;
  textColor: string;
  isUpdating: number | null;
}

export default function KanbanColumn({
  columnId,
  label,
  tasks,
  color,
  textColor,
  isUpdating,
}: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className={`rounded-lg p-4 ${color} border border-slate-200 min-h-96`}>
        {/* Column Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`font-bold text-sm ${textColor}`}>{label}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 bg-white bg-opacity-50 rounded-full text-xs font-semibold">
            {tasks.length}
          </span>
        </div>

        {/* Tasks Container */}
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No tasks here yet
              </div>
            ) : (
              tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  isUpdating={isUpdating === task.id}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
