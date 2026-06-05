'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface BottomNavProps {
  role: 'admin' | 'mentor' | 'intern';
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    router.push('/');
  };

  // Define nav items based on user role
  const getNavItems = () => {
    switch (role) {
      case 'intern':
        return [
          {
            label: 'Home',
            path: '/dashboard/intern',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Tasks',
            path: '/dashboard/intern/tasks',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            )
          },
          {
            label: 'Report',
            path: '/dashboard/intern/reports',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )
          }
        ];
      case 'mentor':
        return [
          {
            label: 'Home',
            path: '/dashboard/mentor',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Blockers',
            path: '/dashboard/mentor/blockers',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )
          }
        ];
      case 'admin':
        return [
          {
            label: 'Home',
            path: '/dashboard/admin',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Interns',
            path: '/dashboard/admin/interns',
            icon: (active: boolean) => (
              <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-amber-500 scale-110' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )
          }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-transparent pointer-events-none p-4">
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl flex justify-around items-center py-2.5 px-4 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center justify-center group flex-1">
              <div className="p-1.5 rounded-xl group-hover:bg-slate-800/50 transition-colors">
                {item.icon(isActive)}
              </div>
              <span className={`text-[10px] font-medium mt-0.5 tracking-wide transition-colors duration-300 ${isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Logout Button */}
        <button onClick={handleLogout} className="flex flex-col items-center justify-center group flex-1 cursor-pointer">
          <div className="p-1.5 rounded-xl group-hover:bg-red-950/20 transition-colors">
            <svg className="w-6 h-6 text-slate-400 group-hover:text-red-400 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="text-[10px] font-medium mt-0.5 text-slate-400 group-hover:text-red-400 transition-colors">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
