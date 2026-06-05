'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: 'admin' | 'mentor' | 'intern';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const getMenuItems = () => {
    const baseItems = [
      { icon: '🏠', label: 'Home', href: `/dashboard/${role}` },
      { icon: '📋', label: 'Tasks', href: `/dashboard/${role}/tasks` },
      { icon: '📊', label: 'Reports', href: `/dashboard/${role}/reports` },
      { icon: '👤', label: 'Profile', href: `/dashboard/${role}/profile` },
    ];

    if (role === 'admin') {
      return [
        ...baseItems.slice(0, 1),
        { icon: '👥', label: 'Interns', href: '/dashboard/admin/interns' },
        { icon: '📈', label: 'Analytics', href: '/dashboard/admin/analytics' },
        ...baseItems.slice(1),
      ];
    }

    if (role === 'mentor') {
      return [
        ...baseItems.slice(0, 1),
        { icon: '⚠️', label: 'Blockers', href: '/dashboard/mentor/blockers' },
        ...baseItems.slice(1),
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
      <Link href="/" className="mb-8">
        <h2 className="text-xl font-bold">Topper IAS</h2>
      </Link>

      <nav className="flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
              pathname === item.href
                ? 'bg-amber-400 text-gray-900 font-medium'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-400">v1.0.0</p>
      </div>
    </aside>
  );
}
