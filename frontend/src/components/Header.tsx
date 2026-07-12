'use client';

import { Search } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

export default function Header() {
  const { query, setQuery } = useSearch();

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
        <span className="text-sm font-medium text-gray-300">Raven K.</span>
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700">
          Dispatcher RK
        </span>
      </div>
    </header>
  );
}
