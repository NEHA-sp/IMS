'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface TaskTemplate {
  id: number;
  name: string;
  description: string;
  title_template: string;
  priority: 'low' | 'medium' | 'high';
  estimated_days: number;
  category: string;
  usage_count: number;
  is_public: boolean;
  created_by_name?: string;
}

interface TaskTemplateManagerProps {
  onSelectTemplate?: (template: TaskTemplate) => void;
  showCreateOnly?: boolean;
}

export default function TaskTemplateManager({ onSelectTemplate, showCreateOnly = false }: TaskTemplateManagerProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    titleTemplate: '',
    descriptionTemplate: '',
    priority: 'medium' as const,
    estimatedDays: 7,
    category: 'general',
    isPublic: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTemplates = async () => {
    try {
      const data = await api.get<TaskTemplate[]>('/templates');
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.titleTemplate) {
      setError('Name and title template are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const newTemplate = await api.post<TaskTemplate>('/templates', formData);
      setTemplates([newTemplate, ...templates]);
      setFormData({
        name: '',
        description: '',
        titleTemplate: '',
        descriptionTemplate: '',
        priority: 'medium',
        estimatedDays: 7,
        category: 'general',
        isPublic: false,
      });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Template Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900">Create New Template</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateTemplate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Template name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />

              <input
                type="text"
                placeholder="Title template (e.g., 'Report: {Topic}')"
                value={formData.titleTemplate}
                onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />

              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <input
                type="number"
                placeholder="Est. days"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: parseInt(e.target.value) })}
                className="px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />

              <textarea
                placeholder="Description template"
                value={formData.descriptionTemplate}
                onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none h-20"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isPublic" className="text-xs text-slate-600">
                Share with other mentors
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-amber-500 text-white px-3 py-2 rounded text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition"
              >
                {saving ? 'Creating...' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-100 text-slate-600 px-3 py-2 rounded text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white border-2 border-dashed border-slate-200 hover:border-amber-400 rounded p-3 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          + Create New Template
        </button>
      )}

      {/* Display Templates */}
      {templates.length === 0 && !showForm && (
        <div className="text-center py-6 text-slate-400">
          <p className="text-xs">No templates available yet</p>
        </div>
      )}

      {templates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-600">Available Templates ({templates.length})</p>
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-slate-200 rounded p-3 flex items-start justify-between hover:shadow-sm transition cursor-pointer"
              onClick={() => onSelectTemplate && onSelectTemplate(template)}
            >
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">{template.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {template.title_template}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    template.priority === 'high' ? 'bg-red-100 text-red-600' :
                    template.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {template.priority}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {template.estimated_days}d • Used {template.usage_count}x
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
