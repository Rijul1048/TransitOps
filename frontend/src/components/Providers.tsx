'use client';

import { SearchProvider } from '@/contexts/SearchContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}
