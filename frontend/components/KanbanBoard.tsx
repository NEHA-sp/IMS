'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  Over,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { api, Task } from '@/lib/api';
import KanbanColumn from './KanbanColumn';

export interface TaskAssignment extends Task {
  assignment_id?: number;
  assigned_to?: number;
}

interface KanbanBoardProps {
  tasks: TaskAssignment[];
  onTasksUpdate: (tasks: TaskAssignment[]) => void;
  isLoading?: boolean;
}

const STATUS_COLUMNS = [
  { id: 'pending', label: 'To Do', color: 'bg-slate-100', textColor: 'text-slate-700' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-100', textColor: 'text-amber-700' },
  { id: 'under_review', label: 'Review', color: 'bg-purple-100', textColor: 'text-purple-700' },
  { id: 'completed', label: 'Done', color: 'bg-emerald-100', textColor: 'text-emerald-700' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-100', textColor: 'text-red-700' },
];

export default function KanbanBoard({ tasks, onTasksUpdate, isLoading = false }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<TaskAssignment[]>(tasks);
  const [updating, setUpdating] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const getTasksByStatus = (status: string): TaskAssignment[] => {
    return localTasks.filter((task) => task.assignment_status === status || task.status === status);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Extract status from over id (format: "status-taskid")
    const overStr = String(over.id);
    const newStatus = overStr.split('-')[0];
    const taskId = Number(active.id);

    const taskIndex = localTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const task = localTasks[taskIndex];

    // Only update if status actually changed
    if ((task.assignment_status || task.status) === newStatus) {
      return;
    }

    // Optimistic update
    const updatedTasks = [...localTasks];
    updatedTasks[taskIndex] = {
      ...task,
      assignment_status: newStatus as any,
      status: newStatus as any,
    };
    setLocalTasks(updatedTasks);
    setUpdating(taskId);

    try {
      // Update via API
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      onTasksUpdate(updatedTasks);
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert on error
      setLocalTasks(tasks);
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-80 h-96 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 min-h-96">
        {STATUS_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              label={column.label}
              tasks={columnTasks}
              color={column.color}
              textColor={column.textColor}
              isUpdating={updating}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
