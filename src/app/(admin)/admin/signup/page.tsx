"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sendAdminWelcomeEmailAction } from '@/app/actions/emailActions';

export default function AdminSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedEmails = useMemo(() => (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!allowedEmails.includes(email.trim().toLowerCase())) {
      setError('Signup is restricted. Contact the administrator.');
      return;
    }
    setLoading(true);
    try {
      if (!auth) throw new Error('Auth unavailable');
      await createUserWithEmailAndPassword(auth, email, password);
      // Send welcome email (Fire & Forget)
      sendAdminWelcomeEmailAction(email).catch(err => console.error("Failed to send welcome email", err));

      try { if (auth.currentUser) { await signOut(auth); } } catch { }
      router.push('/admin/login');
    } catch {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  px-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur border border-orange-100 rounded-3xl p-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-3.5 w-3.5 rounded-full bg-orange-500 animate-pulse" />
          <h1 className="text-4xl font-semibold text-gray-900">Admin Signup</h1>
        </div>
        <p className="mt-4 text-lg text-gray-600">Create your admin credentials</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-800">Admin Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full h-14 rounded-2xl border border-gray-300 bg-gray-50/60 px-5 text-lg shadow-sm placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-800">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full h-14 rounded-2xl border border-gray-300 bg-gray-50/60 px-5 text-lg shadow-sm placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-base font-medium text-gray-800">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 block w-full h-14 rounded-2xl border border-gray-300 bg-gray-50/60 px-5 text-lg shadow-sm placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-base text-red-700 border border-red-200">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-center h-14 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-transform active:scale-[0.99]"
          >
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-600 text-center">
          Already have access? <Link href="/admin/login" className="text-orange-600 hover:text-orange-800">Sign in</Link>
        </div>
      </div>
    </div>
  );
}


