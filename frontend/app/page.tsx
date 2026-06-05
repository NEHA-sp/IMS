'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<'admin' | 'mentor' | 'intern'>('intern');
  
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [batchName, setBatchName] = useState('UPSC Batch 2026-A');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRoleChange = (selectedRole: 'admin' | 'mentor' | 'intern') => {
    setRole(selectedRole);
    setError('');
    setSuccess('');
    
    // Autofill working credentials for ease of demo/testing
    if (selectedRole === 'admin') {
      setEmail('admin@topperias.com');
    } else if (selectedRole === 'mentor') {
      setEmail('vikas.kumar@topperias.com');
    } else {
      setEmail('intern1@topperias.com');
    }
    setPassword('password123');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !name)) {
      setError('Please enter all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignup) {
        // Sign Up
        const data = await api.post<{ token: string; user: any }>('/auth/signup', {
          name,
          email,
          password,
          role,
          batch_name: role === 'intern' ? batchName : null
        });

        setSuccess('Account created successfully! Redirecting...');
        localStorage.setItem('ims_token', data.token);
        localStorage.setItem('ims_user', JSON.stringify(data.user));
        
        setTimeout(() => {
          router.push(`/dashboard/${role}`);
        }, 1500);

      } else {
        // Sign In
        const data = await api.post<{ token: string; user: any }>('/auth/login', {
          email,
          password
        });

        if (data.user.role !== role) {
          setError(`This account is registered as ${data.user.role.toUpperCase()}, not ${role.toUpperCase()}.`);
          setLoading(false);
          return;
        }

        localStorage.setItem('ims_token', data.token);
        localStorage.setItem('ims_user', JSON.stringify(data.user));
        router.push(`/dashboard/${role}`);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your inputs.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 font-sans selection:bg-amber-500 selection:text-slate-900 relative">
      
      {/* Background ambient gold/off-white lighting */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>

      {/* Main card matching login UI mockup exactly */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-8 sm:p-10 relative overflow-hidden flex flex-col">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#0B1A30] font-serif tracking-tight">
            Topper IAS
          </h1>
          <p className="text-[11px] font-bold text-[#A88038] tracking-[0.22em] mt-1.5 uppercase">
            {role} portal
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-center text-red-650 text-xs animate-shake">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2 items-center text-emerald-650 text-xs">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleAuth} className="space-y-5">
          
          {/* Access Role Tab Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest">
              Access Role
            </label>
            <div className="grid grid-cols-3 bg-[#F1F3F6] p-1 rounded-lg border border-slate-200/50">
              {(['admin', 'mentor', 'intern'] as const).map((r) => {
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer capitalize ${
                      isActive
                        ? 'bg-[#0B1A30] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name input (Signup only) */}
          {isSignup && (
            <div className="space-y-2 animate-fadeIn">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aryan Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-[46px]"
                />
              </div>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@topperias.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-[46px]"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Password
              </label>
              <button
                type="button"
                onClick={() => setError('Please contact IT system support for password resets.')}
                className="text-[10px] font-bold text-[#A88038] hover:underline cursor-pointer tracking-wider uppercase"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-[46px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
              >
                {showPassword ? (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Batch input (Intern signup only) */}
          {isSignup && role === 'intern' && (
            <div className="space-y-2 animate-fadeIn">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest">
                UPSC Batch Details
              </label>
              <input
                type="text"
                required
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. UPSC Batch 2026-A"
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 h-[46px]"
              />
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0B1A30] hover:bg-[#122744] disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10 cursor-pointer mt-6 h-[48px]"
          >
            {loading ? (
              <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignup ? 'Register & Sign In' : 'Sign In to Portal'}</span>
                {!isSignup && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </>
            )}
          </button>

        </form>

        {/* Separator line */}
        <hr className="border-t border-slate-100 my-6" />

        {/* Footer dynamic switch matching signup requirement & login UI */}
        <div className="text-center">
          {role === 'intern' ? (
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
                setSuccess('');
              }}
              className="text-[11px] font-bold text-slate-650 hover:text-amber-700 tracking-wider uppercase transition-colors"
            >
              {isSignup ? 'Already registered? ' : 'New intern? '}
              <span className="text-[#A88038] hover:underline font-black">
                {isSignup ? 'Sign In' : 'Create Account / Register'}
              </span>
            </button>
          ) : (
            <p className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">
              New administrative staff?{' '}
              <span className="text-slate-800 font-extrabold">Contact System Admin</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
