'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const PUBLIC_PATHS = ['/login', '/register'];

  useEffect(() => {
    if (!isLoading && !token && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login');
    }
  }, [token, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!token && !PUBLIC_PATHS.includes(pathname)) return null;

  return <>{children}</>;
}
