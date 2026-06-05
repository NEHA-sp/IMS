'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import AIBlockerPanel, { AISuggestion } from '@/components/AIBlockerPanel';
import { api, Task } from '@/lib/api';

const BLOCKER_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'dependency', label: 'Dependency' },
  { value: 'system', label: 'Administrative' },
] as const;

type BlockerCat = typeof BLOCKER_CATEGORIES[number]['value'];

export default function DailyReportPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [hoursWorked, setHoursWorked] = useState('0.0');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Blocker States
  const [blockerCategory, setBlockerCategory] = useState<BlockerCat>('technical');
  const [blockerDescription, setBlockerDescription] = useState('');
  const [blockerSeverity, setBlockerSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [showBlockers, setShowBlockers] = useState(true);

  // AI Resolution states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [submittedBlockerId, setSubmittedBlockerId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Report streak (fetched from dashboard stats)
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 5 });

  // Auto-save draft ref
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ims_token') : null;
    if (!token) { router.push('/'); return; }

    const fetchData = async () => {
      try {
        const [taskData, statsData] = await Promise.allSettled([
          api.get<Task[]>('/tasks/intern/assigned'),
          api.get<{ reportStreak: { current_streak: number; longest_streak: number } }>('/dashboard/intern'),
        ]);
        if (taskData.status === 'fulfilled') {
          setTasks(taskData.value.filter(t => t.status !== 'completed'));
        }
        if (statsData.status === 'fulfilled' && statsData.value.reportStreak) {
          setStreak({
            current: statsData.value.reportStreak.current_streak,
            longest: statsData.value.reportStreak.longest_streak,
          });
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-save draft every 30s
    autoSaveRef.current = setInterval(() => {
      if (selectedTaskId || description) {
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }, 30000);

    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !description) {
      setErrorMsg('Please select a task and add a description.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post<{ id: number }>('/reports/daily', {
        taskId: parseInt(selectedTaskId),
        description,
        hoursWorked: parseFloat(hoursWorked) || 0,
        completionPercentage,
      });

      if (blockerDescription.trim()) {
        const blocker = await api.post<{ id: number }>('/blockers', {
          taskId: parseInt(selectedTaskId),
          blockerType: blockerCategory,
          description: blockerDescription,
          severity: blockerSeverity,
        });
        setSubmittedBlockerId(blocker.id);
        setAiLoading(true);
        try {
          const aiResponse = await api.post<AISuggestion>('/ai/resolve-blocker', {
            blockerId: blocker.id,
            description: blockerDescription,
            category: blockerCategory,
          });
          setAiSuggestion(aiResponse);
        } catch (aiErr) {
          console.error('AI Resolver error:', aiErr);
        } finally {
          setAiLoading(false);
        }
      }

      setSuccessMsg('Daily report submitted successfully!');
      if (!blockerDescription.trim()) {
        setTimeout(() => router.push('/dashboard/intern'), 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit daily report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const streakGoal = Math.max(streak.longest, 5);
  const streakPct = Math.min((streak.current / streakGoal) * 100, 100);

  return (
    <MobileLayout role="intern">
      <div className="max-w-5xl space-y-5">

        {/* ── Page Header ── */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intern Portal</p>
          <h1 className="text-3xl font-black text-[#0B1A30] tracking-tight">Daily Reporting</h1>
          <p className="text-sm text-slate-500 font-medium">Keep up the great work! Your consistency builds excellence.</p>
        </div>

        {/* ── Status Alerts ── */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex gap-2.5 items-center text-emerald-700 text-xs animate-fadeIn">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex gap-2.5 items-center text-red-700 text-xs animate-fadeIn">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* ── AI Blocker Panel ── */}
        {(aiLoading || aiSuggestion) && submittedBlockerId && (
          <AIBlockerPanel
            suggestion={aiSuggestion}
            loading={aiLoading}
            blockerId={submittedBlockerId}
            onResolved={() => router.push('/dashboard/intern')}
          />
        )}

        {/* ── Two-column layout ── */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* ── LEFT: Main Form (2/3) ── */}
            <div className="xl:col-span-2 space-y-4">

              {/* Current Date card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Date</p>
                  <p className="text-sm font-black text-[#0B1A30]">{currentDate}</p>
                </div>
              </div>

              {/* Task Details card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
                {/* Section header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-black text-[#0B1A30]">Task Details</span>
                </div>

                {/* Task Title dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">Task Title</label>
                  <div className="relative">
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer"
                    >
                      <option value="">Select an assigned task...</option>
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Brief Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">Brief Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Outline the specific milestones reached today..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Blockers & Challenges card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Section header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#0B1A30]">Blockers &amp; Challenges</span>
                    <p className="text-[11px] text-slate-400 font-medium">Identify any hurdles preventing progress.</p>
                  </div>
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2">
                  {BLOCKER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setBlockerCategory(cat.value)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        blockerCategory === cat.value
                          ? 'bg-[#0B1A30] text-white border-[#0B1A30]'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Severity pills */}
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setBlockerSeverity(sev)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        blockerSeverity === sev
                          ? sev === 'critical' ? 'bg-red-600 text-white border-red-600'
                          : sev === 'high' ? 'bg-orange-500 text-white border-orange-500'
                          : sev === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-600 text-white border-slate-600'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                {/* Blocker description */}
                <div>
                  <textarea
                    value={blockerDescription}
                    onChange={(e) => setBlockerDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the blocker in detail..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                    Leave blank if no blocker. Gemini AI will suggest resolutions automatically.
                  </p>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Sidebar (1/3) ── */}
            <div className="space-y-4">

              {/* Effort Tracking — dark navy card */}
              <div className="bg-[#0B1A30] rounded-2xl p-5 shadow-lg space-y-5 relative overflow-hidden">
                {/* Decorative chart icon */}
                <div className="absolute top-4 right-4 opacity-15">
                  <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>

                <h2 className="text-sm font-black text-white">Effort Tracking</h2>

                {/* Hours input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-400">Hours Dedicated Today</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      className="w-24 bg-[#162235] border border-[#1E3250] rounded-lg py-2.5 px-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all text-center"
                    />
                    <span className="text-sm text-slate-400 font-medium">Hours</span>
                  </div>
                </div>

                {/* Completion slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-400">Current Completion %</label>
                    <span className="text-sm font-black text-amber-400">{completionPercentage}%</span>
                  </div>

                  {/* Custom progress track */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={completionPercentage}
                      onChange={(e) => setCompletionPercentage(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer accent-amber-400"
                      style={{
                        background: `linear-gradient(to right, #FBBF24 ${completionPercentage}%, #1E3250 ${completionPercentage}%)`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Start</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>

              {/* Weekly Milestone card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-black text-[#0B1A30]">Weekly Milestone</h2>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-semibold">Report Submission Streak</span>
                    <span className="text-sm font-black text-amber-500">
                      {streak.current}/{streakGoal} Days
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                      style={{ width: `${streakPct}%` }}
                    />
                  </div>
                </div>

                <blockquote className="text-[11px] text-slate-500 font-medium italic border-l-2 border-amber-400 pl-3 leading-relaxed">
                  &ldquo;Excellence is not an act, but a habit.&rdquo; &mdash; Aristotle
                </blockquote>
              </div>

              {/* Submit button card */}
              <div className="bg-[#0B1A30] rounded-2xl p-5 shadow-lg space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/20 text-white font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Daily Report
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-medium">
                  {lastSaved
                    ? `Draft saved at ${lastSaved}`
                    : 'Drafts are saved automatically every 30s.'}
                </p>
              </div>

            </div>
          </div>
        </form>

      </div>
    </MobileLayout>
  );
}
