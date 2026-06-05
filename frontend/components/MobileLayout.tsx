'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface MobileLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'mentor' | 'intern';
}

export default function MobileLayout({ children, role }: MobileLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('User');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('ims_user');
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          setUserName(userObj.name || 'User');
        } catch (e) {
          // ignore
        }
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<Notification[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    router.push('/');
  };

  // Define sidebar menu links based on role
  const getSidebarLinks = () => {
    const base = `/dashboard/${role}`;
    switch (role) {
      case 'intern':
        return [
          { label: 'Overview', path: base, icon: '🏠' },
          { label: 'Tasks & Goals', path: `${base}/tasks`, icon: '📋' },
          { label: 'Submit Report', path: `${base}/reports`, icon: '✍️' }
        ];
      case 'mentor':
        return [
          { label: 'Overview', path: base, icon: '🏠' },
          { label: 'Cohort Blockers', path: `${base}/blockers`, icon: '⚠️' }
        ];
      case 'admin':
        return [
          { label: 'Overview', path: base, icon: '🏠' },
          { label: 'Manage Cohorts', path: `${base}/interns`, icon: '👥' },
          { label: 'Cohort Blockers', path: `/dashboard/mentor/blockers`, icon: '⚠️' }
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-amber-500 selection:text-slate-900">

      {/* 1. Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30">
        <div className="p-6">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center shadow font-serif text-white font-black text-base">
              T
            </div>
            <div>
              <span className="block text-sm font-black tracking-widest text-slate-900 uppercase leading-none">Topper IAS</span>
              <span className="block text-[9px] text-amber-600 tracking-wider font-extrabold uppercase leading-none mt-1">{role} portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span className="text-sm">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info / Logout at bottom */}
        <div className="p-6 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-slate-800 truncate">{userName}</span>
              <span className="block text-[9px] text-slate-500 font-semibold uppercase">{role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 font-bold transition-all text-[10px] uppercase tracking-widest rounded-xl cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Area (Navbar + scrollable main content) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Sticky Desktop Top Navbar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-4 px-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
              {role === 'admin' ? 'Administrative Hub' : role === 'mentor' ? 'Mentor Console' : 'Intern Workspace'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification trigger */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-600 transition-colors relative cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Notifications Panel Popup */}
        {showNotifications && (
          <div className="fixed right-8 top-[68px] z-50 bg-white border border-slate-200/80 shadow-2xl rounded-2xl max-w-sm w-full max-h-[400px] overflow-y-auto p-4 transition-all duration-300">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alerts & Messages</h4>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-amber-600 hover:text-amber-500 font-semibold cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No alerts logged.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      n.is_read
                        ? 'bg-slate-50 border-slate-100 text-slate-400'
                        : 'bg-amber-500/5 border-amber-500/20 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className={`text-[9px] font-bold uppercase ${n.is_read ? 'text-slate-400' : 'text-amber-600'}`}>
                        {n.title}
                      </span>
                      <span className="text-[8px] text-slate-400">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="leading-normal">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Workspace Canvas */}
        <main className="flex-grow p-8 max-w-6xl w-full mx-auto animate-fadeIn pb-16">
          {children}
        </main>

      </div>
    </div>
  );
}
