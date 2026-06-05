'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import { api, Task } from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  batch_name: string | null;
  completed_tasks: number;
  validated_reports: number;
  current_streak: number;
}

interface InternStats {
  todaysTasks: Task[];
  weeklyProgress: number;
  totalHours: number;
  latestFeedback: { comment: string; mentor_name: string; created_at: string } | null;
  reportStreak: { current_streak: number; longest_streak: number };
}

export default function InternDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<InternStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchStats = async () => {
    try {
      const data = await api.get<InternStats>('/dashboard/intern');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch intern stats:', err);
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

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ims_token') : null;
    if (!token) {
      router.push('/');
      return;
    }
    try {
      const storedUser = localStorage.getItem('ims_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        setUserName(userObj.name || '');
        setUserId(userObj.id || null);
      }
    } catch (e) {}
    fetchStats();
    fetchLeaderboard();
  }, [router]);

  const handleToggleTaskStatus = async (taskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      fetchStats();
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tasks = stats?.todaysTasks || [];
  const progress = stats?.weeklyProgress || 75;
  const firstName = userName ? userName.split(' ')[0] : 'Intern';

  const getInitials = (name: string) =>
    name.split(' ').map(p => p.charAt(0)).join('').toUpperCase().substring(0, 2);

  const getRelativeTime = (isoString: string) => {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Determine greeting based on hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Progress ring circumference (SVG)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <MobileLayout role="intern">
      {/* Two-column desktop grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-5xl">

        {/* ── Left Column (2/3 width) ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Greeting Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-[#0B1A30] tracking-tight font-serif">
              {greeting}, {firstName}.
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Stay disciplined. Excellence is not an act, but a habit.
            </p>
          </div>

          {/* Today's Prioritized Tasks */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                Today&apos;s Prioritized Tasks
              </h2>
              <span className="bg-[#FDE047] text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {tasks.length} {tasks.length === 1 ? 'TASK' : 'TASKS'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No priorities assigned for today! Take a self-study day.
                </div>
              ) : (
                tasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  let icon = '📋';
                  if (task.priority === 'high') icon = '❗';
                  else if (task.priority === 'medium') icon = '📜';

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between px-6 py-4 transition-all ${
                        isCompleted ? 'opacity-55 bg-slate-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Icon box */}
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-base flex-shrink-0">
                          {isCompleted ? '✓' : icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold text-slate-800 leading-snug ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {isCompleted
                              ? `Completed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : `Due by 6:00 PM • ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority`}
                          </p>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, task.status)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ml-4 ${
                          isCompleted
                            ? 'bg-[#0B1A30] border-[#0B1A30] text-white'
                            : 'border-slate-300 hover:border-[#0B1A30]'
                        }`}
                      >
                        {isCompleted && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {tasks.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => router.push('/dashboard/intern/tasks')}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-500 transition-colors cursor-pointer"
                >
                  View all tasks →
                </button>
              </div>
            )}
          </div>

          {/* Daily Summary Card */}
          <div className="bg-[#0B1A30] rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-base font-black text-white tracking-tight">Daily Summary</h2>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed max-w-xs">
                  Document your learning and progress for review by your mentor.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/intern/reports')}
                className="flex-shrink-0 flex items-center gap-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-slate-950 font-black rounded-xl px-5 py-3 text-xs uppercase tracking-wider transition-all shadow cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Daily Report
              </button>
            </div>
          </div>

          {/* Latest Mentor Comment */}
          <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#FBBF24] rounded-2xl p-6 shadow-sm">
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-700 mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Latest Mentor Comment
            </span>

            {stats?.latestFeedback ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                  &ldquo;{stats.latestFeedback.comment}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-7 h-7 rounded-full bg-[#0B1A30] flex items-center justify-center font-bold text-white text-[10px]">
                    {getInitials(stats.latestFeedback.mentor_name)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {stats.latestFeedback.mentor_name} &bull; {getRelativeTime(stats.latestFeedback.created_at)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                  &ldquo;Your analysis of the international relations sector was remarkably thorough. Focus more on concise conclusions in your next report.&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-7 h-7 rounded-full bg-[#0B1A30] flex items-center justify-center font-bold text-white text-[10px]">
                    MK
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Dr. Mahesh Kapoor &bull; 2h ago
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column (1/3 width) ── */}
        <div className="space-y-6">

          {/* Weekly Progress Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase self-start">
              Weekly Progress
            </h2>

            {/* SVG Progress Ring */}
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background track */}
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="12"
                />
                {/* Navy segment (left half visual) */}
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="#0B1A30"
                  strokeWidth="12"
                  strokeDasharray={`${circumference / 2} ${circumference / 2}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                />
                {/* Amber progress arc */}
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#0B1A30] font-serif leading-none">{progress}%</span>
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">Completed</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold italic text-center">
              &ldquo;You are 5% ahead of last week&apos;s pace.&rdquo;
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Quick Stats</h2>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">Tasks Today</span>
                <span className="text-sm font-black text-[#0B1A30]">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">Completed</span>
                <span className="text-sm font-black text-emerald-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">In Progress</span>
                <span className="text-sm font-black text-amber-600">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-500 font-semibold">Report Streak</span>
                <span className="text-sm font-black text-[#0B1A30]">
                  🔥 {stats?.reportStreak?.current_streak ?? 0} days
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/intern/tasks')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer text-left"
              >
                <span>📋</span> View All Tasks
              </button>
              <button
                onClick={() => router.push('/dashboard/intern/reports')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0B1A30] hover:bg-[#162235] border border-transparent text-xs font-bold text-white transition-all cursor-pointer text-left"
              >
                <span>✍️</span> Submit Daily Report
              </button>
            </div>
          </div>

          {/* Leaderboard Card */}
          {leaderboard.length > 0 && (() => {
            const myEntry = leaderboard.find(e => e.id === userId);
            const top5 = leaderboard.slice(0, 5);
            return (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">🏆 Leaderboard</h2>
                  {myEntry && (
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      You: #{myEntry.rank}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {top5.map((entry) => {
                    const isMe = entry.id === userId;
                    const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                          isMe
                            ? 'bg-amber-50 border border-amber-300 font-black'
                            : 'bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <span className="w-5 text-center text-sm flex-shrink-0">
                          {medal || <span className="text-[10px] font-black text-slate-400">#{entry.rank}</span>}
                        </span>
                        <span className={`flex-1 truncate font-bold ${isMe ? 'text-amber-700' : 'text-slate-700'}`}>
                          {isMe ? 'You' : entry.name.split(' ')[0]}
                        </span>
                        <span className="font-black text-[#0B1A30]">{entry.completed_tasks}</span>
                        <span className="text-slate-400 text-[9px] font-bold uppercase">tasks</span>
                      </div>
                    );
                  })}
                  {/* Show the current intern if not in top 5 */}
                  {myEntry && myEntry.rank > 5 && (
                    <>
                      <div className="text-center text-slate-300 text-[10px]">···</div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl text-xs bg-amber-50 border border-amber-300">
                        <span className="w-5 text-center text-[10px] font-black text-slate-400">#{myEntry.rank}</span>
                        <span className="flex-1 truncate font-black text-amber-700">You</span>
                        <span className="font-black text-[#0B1A30]">{myEntry.completed_tasks}</span>
                        <span className="text-slate-400 text-[9px] font-bold uppercase">tasks</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        </div>

      </div>
    </MobileLayout>
  );
}
