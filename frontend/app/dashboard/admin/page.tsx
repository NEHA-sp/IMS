'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import { api } from '@/lib/api';

interface DashboardStats {
  totalInterns: number;
  activeTasks: number;
  pendingReviews: number;
  criticalBlockers: number;
  weeklyCompletion: Array<{ day: string; count: number }>;
  recentActivity: Array<{ type: string; message: string; created_at: string }>;
}

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  batch_name: string | null;
  completed_tasks: number;
  validated_reports: number;
  current_streak: number;
  longest_streak: number;
}

interface TrendDay {
  date: string;
  label: string;
  completed: number;
  validated: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [trend, setTrend] = useState<TrendDay[]>([]);

  // New Intern Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newBatch, setNewBatch] = useState('UPSC Batch 2026-A');
  const [addingIntern, setAddingIntern] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const fetchStats = async () => {
    try {
      const data = await api.get<DashboardStats>('/dashboard/admin');
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await api.get<{ leaderboard: LeaderboardEntry[] }>('/dashboard/leaderboard');
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
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
    fetchLeaderboard();
    fetchTrend();
  }, [router]);

  const handleAddInternSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      setAddError('Name and email are required.');
      return;
    }
    setAddingIntern(true);
    setAddError('');
    setAddSuccess('');
    try {
      await api.post('/auth/signup', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: 'intern',
        batch_name: newBatch
      });
      setAddSuccess('New intern onboarded successfully!');
      setNewName('');
      setNewEmail('');
      setNewPassword('password123');
      fetchStats();
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'Failed to onboard intern.');
    } finally {
      setAddingIntern(false);
    }
  };

  const handleExportReport = () => {
    if (!stats) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Interns,${stats.totalInterns}\n`
      + `Active Tasks,${stats.activeTasks}\n`
      + `Pending Reviews,${stats.pendingReviews}\n`
      + `Critical Blockers,${stats.criticalBlockers}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "topper_ias_admin_stats.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activities = stats?.recentActivity || [];
  const weeklyData = stats?.weeklyCompletion || [];

  // Helper to format timestamps to relative time strings (e.g. "12 MINUTES AGO")
  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins < 60) return `${diffMins} MINUTES AGO`;
    if (diffHours < 24) return `${diffHours} HOURS AGO`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <MobileLayout role="admin">
      <div className="space-y-6 max-w-xl mx-auto pb-12">
        
        {/* Sub-header matching mockup */}
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[#0B1A30] font-serif tracking-tight">
            Administrative Overview
          </h2>
          <p className="text-xs font-semibold text-slate-500 leading-normal">
            Monitoring intern excellence and institutional progress.
          </p>
        </div>

        {/* 4 Cards stacked matches mockup style */}
        <div className="space-y-4">
          
          {/* Card 1: TOTAL INTERNS */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
              Total Interns
            </span>
            <span className="text-4xl font-extrabold text-[#0B1A30] block mt-2 font-serif">
              {stats?.totalInterns || 0}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold mt-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +12% this month
            </span>
          </div>

          {/* Card 2: ACTIVE TASKS */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
              Active Tasks
            </span>
            <span className="text-4xl font-extrabold text-[#0B1A30] block mt-2 font-serif">
              {stats?.activeTasks || 0}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mt-2.5">
              <span>📋</span>
              Across 12 cohorts
            </span>
          </div>

          {/* Card 3: PENDING REVIEWS */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
              Pending Reviews
            </span>
            <span className="text-4xl font-extrabold text-[#856404] block mt-2 font-serif">
              {stats?.pendingReviews || 0}
            </span>
            <span className="flex items-center gap-1.5 text-[#856404] text-[10px] font-bold mt-2.5">
              <span>📁</span>
              Requires attention
            </span>
          </div>

          {/* Card 4: CRITICAL BLOCKERS (mockup style with red left border) */}
          <div className="bg-white border border-slate-100 border-l-4 border-l-rose-600 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <span className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">
              Critical Blockers
            </span>
            <span className="text-4xl font-extrabold text-rose-600 block mt-2 font-serif">
              {String(stats?.criticalBlockers || 0).padStart(2, '0')}
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold mt-2.5 animate-pulse">
              <span>⚠️</span>
              Action required
            </span>
          </div>

        </div>

        {/* Weekly Task Completion Chart Section matches mockup style */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Weekly Task Completion
            </h3>
            <button className="bg-slate-100 px-3 py-1 rounded text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors">
              Last 7 Days ⏷
            </button>
          </div>

          <div className="h-36 flex items-end gap-3 justify-around pt-2 border-b border-slate-100 pb-1">
            {weeklyData.map((d, index) => {
              const maxVal = Math.max(...weeklyData.map(item => item.count), 1);
              const pct = Math.max(8, (d.count / maxVal) * 90);
              
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full bg-[#f1f3f6] rounded-md relative overflow-hidden h-24 flex items-end">
                    <div 
                      className="bg-[#DDE2EB] hover:bg-amber-500/80 w-full rounded-md transition-all duration-300 shadow-sm"
                      style={{ height: `${pct}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Card matches mockup style */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">
            Recent Activity
          </h3>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No recent activity logged.
              </div>
            ) : (
              activities.map((a, index) => {
                // Determine icon background matching mockup colors
                let bgClass = "bg-slate-100 text-slate-650";
                let icon = "📌";
                if (a.type === 'report') {
                  bgClass = "bg-[#FEF3C7] text-[#D97706]";
                  icon = "📄";
                } else if (a.type === 'blocker') {
                  bgClass = "bg-red-50 text-red-600";
                  icon = "⚠️";
                } else if (a.type === 'task') {
                  bgClass = "bg-[#E0F2FE] text-[#0369A1]";
                  icon = "✓";
                }

                // Extract a simplified sub-title / context
                const splitMsg = a.message.split(':');
                const title = splitMsg[0];
                const subtitle = splitMsg[1] || 'Action review outline logs';

                return (
                  <div key={index} className="flex gap-4">
                    <div className={`w-8.5 h-8.5 rounded-full ${bgClass} flex items-center justify-center text-sm flex-shrink-0 border border-slate-200/20`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {title}
                      </p>
                      <p className="text-[10px] text-slate-450 font-semibold truncate leading-normal mt-0.5">
                        {subtitle}
                      </p>
                      <span className="block text-[8px] text-slate-400 font-extrabold tracking-wider mt-1.5 uppercase">
                        {getRelativeTime(a.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 7-Day Completion Trend ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">7-Day Completion Trend</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tasks completed &amp; mentor-validated reports</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#0B1A30] inline-block"></span>Done</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block"></span>Validated</span>
            </div>
          </div>

          {(() => {
            const allZero = trend.every(d => d.completed === 0 && d.validated === 0);
            const maxVal = allZero ? 5 : Math.max(...trend.flatMap(d => [d.completed, d.validated]), 1);
            const CHART_H = 88;
            const yTicks = [0, Math.ceil(maxVal / 2), maxVal];
            return (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {/* Y-axis */}
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
                        <div key={idx} className="flex-1 h-full group relative flex flex-col justify-end">
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center">
                            <div className="bg-[#0B1A30] text-white text-[8px] font-black rounded px-1.5 py-1 whitespace-nowrap shadow-lg">
                              ✓{day.completed} · ★{day.validated}
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#0B1A30] rotate-45 -mt-0.5"></div>
                          </div>
                          <div className="flex items-end gap-0.5 w-full" style={{ height: CHART_H }}>
                            <div className="flex-1 bg-slate-100 rounded-t flex items-end overflow-hidden" style={{ height: CHART_H }}>
                              <div className="w-full bg-[#0B1A30] rounded-t transition-all duration-700"
                                style={{ height: compH > 0 ? `${compH}px` : '3px', opacity: compH > 0 ? 1 : 0.12 }} />
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-t flex items-end overflow-hidden" style={{ height: CHART_H }}>
                              <div className="w-full bg-amber-400 rounded-t transition-all duration-700"
                                style={{ height: valH > 0 ? `${valH}px` : '3px', opacity: valH > 0 ? 1 : 0.18 }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-1 pl-5">
                  {trend.map((day, idx) => (
                    <div key={idx} className="flex-1 text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{day.label}</span>
                    </div>
                  ))}
                </div>
                {allZero && (
                  <p className="text-center text-[10px] text-slate-400 italic">No data yet — bars will fill as tasks are completed.</p>
                )}
              </div>
            );
          })()}

          <div className="flex justify-around pt-2 border-t border-slate-100 text-center">
            <div>
              <span className="block text-base font-black text-[#0B1A30]">{trend.reduce((s, d) => s + d.completed, 0)}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Tasks Done</span>
            </div>
            <div>
              <span className="block text-base font-black text-amber-500">{trend.reduce((s, d) => s + d.validated, 0)}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Validated</span>
            </div>
            <div>
              <span className="block text-base font-black text-emerald-600">{trend.length > 0 ? Math.max(...trend.map(d => d.completed)) : 0}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Best Day</span>
            </div>
          </div>
        </div>

        {/* ── Intern Leaderboard ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">🏆 Intern Leaderboard</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ranked by completed &amp; validated tasks</p>
            </div>
            <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              All-Time
            </span>
          </div>

          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No intern data yet.</div>
            ) : (
              leaderboard.slice(0, 10).map((entry) => {
                const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                const isTop3 = entry.rank <= 3;
                const initials = entry.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
                const avatarColors = ['bg-indigo-500', 'bg-purple-500', 'bg-teal-500', 'bg-rose-500', 'bg-blue-500'];
                const avatarColor = avatarColors[entry.id % avatarColors.length];

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isTop3
                        ? 'bg-gradient-to-r from-amber-50 to-white border border-amber-200'
                        : 'bg-slate-50 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-[11px] font-black text-slate-400">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-[10px] font-black flex-shrink-0`}>
                      {initials}
                    </div>

                    {/* Name + batch */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${isTop3 ? 'text-[#0B1A30]' : 'text-slate-700'}`}>
                        {entry.name}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold truncate">
                        {entry.batch_name || 'No batch'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <span className="block text-sm font-black text-[#0B1A30]">{entry.completed_tasks}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Done</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-black text-amber-600">{entry.validated_reports}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Validated</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-black text-emerald-600">🔥{entry.current_streak}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Streak</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Executive Actions Section matches mockup style */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">
            Quick Executive Actions
          </h3>

          <div className="grid grid-cols-2 gap-3.5">
            <button 
              onClick={() => setShowAddModal(true)}
              className="py-3 bg-[#0B1A30] hover:bg-[#122744] text-white flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all shadow cursor-pointer h-[46px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Add Intern</span>
            </button>

            <button 
              onClick={() => router.push('/dashboard/admin/interns')}
              className="py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-slate-950 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all shadow cursor-pointer h-[46px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Assign Mentor</span>
            </button>

            <button 
              onClick={handleExportReport}
              className="col-span-2 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2 rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer h-[46px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Add Intern popup modal form */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative space-y-4">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1A30]">Onboard New UPSC Intern</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-[10px] text-red-650 font-bold">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[10px] text-emerald-650 font-bold">
                  {addSuccess}
                </div>
              )}

              <form onSubmit={handleAddInternSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rahul Gupta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@topperias.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Default Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">UPSC Batch Cohort</label>
                  <input
                    type="text"
                    required
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingIntern}
                  className="w-full py-2.5 bg-[#0B1A30] hover:bg-[#122744] disabled:opacity-50 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
                >
                  {addingIntern ? 'Onboarding...' : 'Onboard Intern ✓'}
                </button>
              </form>

            </div>
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
