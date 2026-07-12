'use client';

import { Search, LogOut } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Analyst',
};

export default function Header() {
  const { query, setQuery } = useSearch();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-[#121212] px-6 flex items-center justify-between">
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search fleet, drivers, trips..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-gray-700 rounded-md pl-9 pr-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm font-medium text-gray-300">{user.email}</span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-800">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </>
        )}
        <button
          id="header-logout"
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 rounded-md text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
