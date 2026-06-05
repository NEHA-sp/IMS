'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import { api, DailyReport, Blocker } from '@/lib/api';

interface TrendDay {
  date: string;
  label: string;
  completed: number;
  validated: number;
}

interface MentorDashboardStats {
  assignedInterns: number;
  pendingReviews: number;
  blockedTasks: number;
  pendingApprovals: DailyReport[];
  blockers: Blocker[];
}

export default function MentorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<MentorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [trend, setTrend] = useState<TrendDay[]>([]);

  // Comments Popup modal states
  const [commentingReportId, setCommentingReportId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentStatus, setCommentStatus] = useState('');

  const fetchStats = async () => {
    try {
      const data = await api.get<MentorDashboardStats>('/dashboard/mentor');
      setStats(data);
    } catch (err) {
      console.error('Failed to load mentor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async () => {
    try {
      const data = await api.get<{ trend: TrendDay[] }>('/dashboard/task-trend');
      setTrend(data.trend);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ims_token') : null;
    if (!token) {
      router.push('/');
      return;
    }
    fetchStats();
    fetchTrend();
  }, [router]);

  const handleApproveReport = async (reportId: number) => {
    setSubmittingId(reportId);
    try {
      await api.patch(`/reports/daily/${reportId}/status`, { status: 'approved' });
      if (stats) {
        setStats({
          ...stats,
          pendingReviews: Math.max(0, stats.pendingReviews - 1),
          pendingApprovals: stats.pendingApprovals.filter(r => r.id !== reportId)
        });
      }
    } catch (err) {
      console.error('Failed to approve report:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !commentingReportId) return;
    setCommenting(true);
    setCommentStatus('');
    try {
      await api.post(`/reports/${commentingReportId}/comments`, { comment: commentText });
      setCommentStatus('Feedback logged successfully!');
      setCommentText('');
      setTimeout(() => {
        setCommentingReportId(null);
        setCommentStatus('');
      }, 1500);
    } catch (err: any) {
      setCommentStatus(err.message || 'Failed to submit comment feedback.');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const approvals = stats?.pendingApprovals || [];
  const activeBlockers = stats?.blockers || [];

  // Helper to format blocker relative time
  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 5) return 'just now';
    if (diffMins < 60) return `${diffMins}h ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <MobileLayout role="mentor">
      <div className="space-y-6 max-w-xl mx-auto pb-12">
        
        {/* Mentor Overview Mockup Header Section */}
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[#0B1A30] font-serif tracking-tight">
            Mentor Overview
          </h2>
          <p className="text-xs font-semibold text-slate-500 leading-normal">
            Manage your assigned cohorts and accelerate academic excellence.
          </p>
        </div>

        {/* 3 Stats Stacked Cards matches mockup exactly */}
        <div className="space-y-4">
          
          {/* Card 1: ASSIGNED INTERNS */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="absolute top-5 right-5 text-[9px] font-black uppercase text-indigo-500 tracking-wider">
              Active
            </span>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg">
                👥
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  Assigned Interns
                </span>
                <span className="text-4xl font-extrabold text-[#0B1A30] block mt-1.5 font-serif">
                  {stats?.assignedInterns || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: PENDING REVIEWS */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="absolute top-5 right-5 text-[9px] font-black uppercase text-[#856404] tracking-wider animate-pulse">
              Urgent
            </span>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#856404] text-lg">
                📁
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  Pending Reviews
                </span>
                <span className="text-4xl font-extrabold text-[#856404] block mt-1.5 font-serif">
                  {String(stats?.pendingReviews || 0).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: BLOCKED TASKS */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="absolute top-5 right-5 text-[9px] font-black uppercase text-rose-500 tracking-wider">
              Critical
            </span>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-lg">
                🚫
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  Blocked Tasks
                </span>
                <span className="text-4xl font-extrabold text-rose-600 block mt-1.5 font-serif">
                  {String(stats?.blockedTasks || 0).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Pending Approvals Card matches mockup exactly */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Pending Approvals
            </h3>
            <span className="text-[10px] text-slate-400 font-bold hover:underline cursor-pointer">
              View All
            </span>
          </div>

          <div className="space-y-4">
            {approvals.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                All done! No pending approvals.
              </div>
            ) : (
              approvals.map((r) => (
                <div key={r.id} className="flex items-start gap-3.5 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                  {/* Round avatar representation matching UI image */}
                  <div className="w-10 h-10 rounded-full bg-indigo-150 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                    {r.intern_name ? r.intern_name.charAt(0).toUpperCase() : 'I'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-800 leading-snug truncate">
                      {r.intern_name}
                    </span>
                    <span className="block text-[10px] text-slate-450 font-semibold truncate leading-normal mt-0.5">
                      {r.task_title || 'Mains Model Paper Formulation'}
                    </span>
                    
                    {/* Action buttons matching mockup exactly */}
                    <div className="flex gap-2.5 mt-3">
                      <button 
                        onClick={() => setCommentingReportId(r.id)}
                        className="py-1.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-750 text-xs font-bold rounded cursor-pointer transition-colors shadow-sm"
                      >
                        Comment
                      </button>
                      <button 
                        onClick={() => handleApproveReport(r.id)}
                        disabled={submittingId === r.id}
                        className="py-1.5 px-4 bg-[#0B1A30] hover:bg-[#122744] text-white text-xs font-bold rounded cursor-pointer transition-all shadow shadow-slate-900/10"
                      >
                        {submittingId === r.id ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blockers Alert Card matches mockup exactly */}
        <div className="bg-[#0B1A30] border border-[#11243E] rounded-xl p-5 shadow-lg space-y-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-100">
              Blockers Alert
            </span>
          </div>

          <div className="space-y-3">
            {activeBlockers.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs bg-[#0F223D] rounded-lg border border-[#172D4D]">
                No active blockers reported.
              </div>
            ) : (
              activeBlockers.map((b) => (
                <div key={b.id} className="p-3 bg-[#0F223D] border border-[#172D4D] rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#FBBF24]">
                    <span>{b.intern_name}</span>
                    <span className="text-slate-400 font-medium font-sans uppercase">
                      • {getRelativeTime(b.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed italic">
                    "{b.description}"
                  </p>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => router.push('/dashboard/mentor/blockers')}
            className="w-full py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-slate-950 font-black rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
          >
            Resolve Blockers
          </button>
        </div>

        {/* ── 7-Day Task Completion Trend ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">7-Day Completion Trend</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed tasks &amp; mentor-validated reports</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#0B1A30] inline-block"></span>Completed</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"></span>Validated</span>
            </div>
          </div>

          {(() => {
            const allZero = trend.every(d => d.completed === 0 && d.validated === 0);
            const maxVal = allZero ? 5 : Math.max(...trend.flatMap(d => [d.completed, d.validated]), 1);
            const CHART_H = 96; // px — height of the chart area

            // Y-axis scale labels
            const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

            return (
              <div className="space-y-2">
                {/* Chart area */}
                <div className="flex gap-1">
                  {/* Y-axis labels */}
                  <div className="flex flex-col justify-between items-end pr-1.5" style={{ height: CHART_H }}>
                    {[...yTicks].reverse().map((v, i) => (
                      <span key={i} className="text-[8px] font-bold text-slate-300 leading-none">{v}</span>
                    ))}
                  </div>

                  {/* Bars */}
                  <div className="flex-1 flex items-end gap-1.5" style={{ height: CHART_H }}>
                    {trend.map((day, idx) => {
                      const compH = allZero ? 0 : Math.round((day.completed / maxVal) * CHART_H);
                      const valH  = allZero ? 0 : Math.round((day.validated  / maxVal) * CHART_H);
                      return (
                        <div key={idx} className="flex-1 flex flex-col justify-end h-full gap-0.5 group relative">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center">
                            <div className="bg-[#0B1A30] text-white text-[9px] font-black rounded px-2 py-1 whitespace-nowrap shadow-lg">
                              ✓ {day.completed} done · ★ {day.validated} validated
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#0B1A30] rotate-45 -mt-0.5"></div>
                          </div>

                          {/* Bars side-by-side within a track */}
                          <div className="flex items-end gap-0.5 w-full" style={{ height: CHART_H }}>
                            {/* Completed column track */}
                            <div className="flex-1 bg-slate-100 rounded-t relative flex items-end overflow-hidden" style={{ height: CHART_H }}>
                              <div
                                className="w-full bg-[#0B1A30] rounded-t transition-all duration-700"
                                style={{ height: compH > 0 ? `${compH}px` : '3px', opacity: compH > 0 ? 1 : 0.15 }}
                              />
                            </div>
                            {/* Validated column track */}
                            <div className="flex-1 bg-slate-100 rounded-t relative flex items-end overflow-hidden" style={{ height: CHART_H }}>
                              <div
                                className="w-full bg-amber-400 rounded-t transition-all duration-700"
                                style={{ height: valH > 0 ? `${valH}px` : '3px', opacity: valH > 0 ? 1 : 0.2 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis day labels */}
                <div className="flex gap-1 pl-5">
                  {trend.map((day, idx) => (
                    <div key={idx} className="flex-1 text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{day.label}</span>
                    </div>
                  ))}
                </div>

                {allZero && (
                  <p className="text-center text-[10px] text-slate-400 italic">No completions recorded yet — data will appear as tasks are finished.</p>
                )}
              </div>
            );
          })()}

          {/* Summary row */}
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <div className="text-center">
              <span className="block text-lg font-black text-[#0B1A30]">
                {trend.reduce((s, d) => s + d.completed, 0)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Tasks Done</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-black text-amber-500">
                {trend.reduce((s, d) => s + d.validated, 0)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Validated</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-black text-emerald-600">
                {trend.length > 0 ? Math.max(...trend.map(d => d.completed)) : 0}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Best Day</span>
            </div>
          </div>
        </div>

        {/* Team Progress Tracking Section matches mockup exactly */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">
            Team Progress
          </h3>

          <div className="space-y-4">
            
            {/* Metric 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Curriculum Completion</span>
                <span className="text-slate-800">68%</span>
              </div>
              <div className="w-full bg-[#f1f3f6] rounded-full h-2">
                <div className="bg-[#F59E0B] h-2 rounded-full shadow-sm" style={{ width: '68%' }}></div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Review Response Time</span>
                <span className="text-slate-800">1.2d</span>
              </div>
              <div className="w-full bg-[#f1f3f6] rounded-full h-2">
                <div className="bg-[#785E0B] h-2 rounded-full shadow-sm" style={{ width: '85%' }}></div>
              </div>
            </div>

          </div>

          {/* Action pills at bottom matches mockup exactly */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            
            <button 
              onClick={() => router.push('/dashboard/intern/tasks')} // Navigate to dynamic task formulation board
              className="py-4 bg-[#F1F3F6] hover:bg-[#E2E8F0] text-slate-800 flex flex-col items-center justify-center gap-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer shadow-sm border border-slate-200/40"
            >
              <span className="text-base">📋</span>
              <span>New Task</span>
            </button>

            <button 
              onClick={() => alert('Feature incoming: Group email blast to cohort')}
              className="py-4 bg-[#F1F3F6] hover:bg-[#E2E8F0] text-slate-800 flex flex-col items-center justify-center gap-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer shadow-sm border border-slate-200/40"
            >
              <span className="text-base">✉️</span>
              <span>Blast Mail</span>
            </button>

          </div>
        </div>

        {/* Comment Overlay Modal Form */}
        {commentingReportId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative space-y-4">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1A30]">Log Intern Feedback</h3>
                <button 
                  onClick={() => {
                    setCommentingReportId(null);
                    setCommentStatus('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {commentStatus && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[10px] text-emerald-650 font-bold animate-fadeIn">
                  {commentStatus}
                </div>
              )}

              <form onSubmit={handleAddComment} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Feedback Comment</label>
                  <textarea
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    placeholder="Provide recommendations, outline suggestions or direct notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={commenting}
                  className="w-full py-2.5 bg-[#0B1A30] hover:bg-[#122744] disabled:opacity-50 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
                >
                  {commenting ? 'Saving...' : 'Save Feedback Comment ✓'}
                </button>
              </form>

            </div>
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
