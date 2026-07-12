'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Truck, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('fleet.manager@transitops.test');
  const [password, setPassword] = useState('testpass123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const QUICK_LOGINS = [
    { label: 'Fleet Manager', email: 'fleet.manager@transitops.test' },
    { label: 'Driver', email: 'driver@transitops.test' },
    { label: 'Safety Officer', email: 'safety.officer@transitops.test' },
    { label: 'Analyst', email: 'analyst@transitops.test' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Truck className="w-6 h-6 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TransitOps</span>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your operations dashboard</p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition"
                placeholder="you@transitops.test"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition"
                placeholder="••••••••••"
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-8">
            <p className="text-xs text-gray-600 mb-3 text-center">Quick login (demo accounts)</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LOGINS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword('testpass123'); }}
                  className="text-xs px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:border-amber-700 hover:text-amber-400 transition text-left truncate"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Default password: <span className="text-gray-500 font-mono">testpass123</span>
        </p>
      </div>
    </div>
  );
}
