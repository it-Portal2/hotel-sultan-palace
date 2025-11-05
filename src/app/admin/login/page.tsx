"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const pupilOffset = useMemo(() => {
    const emailLen = email.length;
    const pwdLen = password.length;
    const x = Math.min(6, Math.floor((emailLen + pwdLen) / 2));
    const y = Math.min(3, Math.floor(pwdLen / 3));
    return { x, y };
  }, [email, password]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!auth) throw new Error('Auth unavailable');
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err: unknown) {
      setError('Login failed. Please check your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4">
      <div ref={cardRef} className={`w-full max-w-2xl bg-white/80 backdrop-blur border border-orange-100 rounded-3xl p-10 shadow-2xl transition-transform ${shake ? 'shake' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full bg-orange-500 ${typing ? 'animate-ping' : 'animate-pulse'}`}></div>
            <h1 className="text-4xl font-semibold text-gray-900">Admin Login</h1>
          </div>
          {/* Animated avatar */}
          <div className="relative h-12 w-12 rounded-full bg-orange-100 border border-orange-200 grid place-items-center">
            <div className="relative flex gap-1">
              <span className="relative h-3.5 w-3.5 bg-white rounded-full border border-orange-200 overflow-hidden">
                <i className="absolute h-2 w-2 bg-orange-600 rounded-full" style={{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }} />
              </span>
              <span className="relative h-3.5 w-3.5 bg-white rounded-full border border-orange-200 overflow-hidden">
                <i className="absolute h-2 w-2 bg-orange-600 rounded-full" style={{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }} />
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-lg text-gray-600">Access the admin dashboard</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-800">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setTyping(true); }}
              className="mt-2 block w-full h-14 rounded-2xl border border-gray-300 bg-gray-50/60 px-5 text-lg shadow-sm placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-800">Password</label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setTyping(true); }}
                className="block w-full h-14 rounded-2xl border border-gray-300 bg-gray-50/60 px-5 pr-12 text-lg shadow-sm placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors cursor-pointer z-10 p-1 flex items-center justify-center"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-center h-14 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-transform active:scale-[0.99]"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-5 text-sm text-gray-600 text-center">
          Don&apos;t have an admin account? <Link href="/admin/signup" className="text-orange-600 hover:text-orange-800">Create one</Link>
        </div>
      </div>
      <style jsx>{`
        .shake { animation: shake 0.5s ease-in-out; }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}


