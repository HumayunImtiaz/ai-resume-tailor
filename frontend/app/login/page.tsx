"use client";

import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import { FormInput } from '@/components/FormInput';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const json = await res.json();
      
      if (json.data && json.data.token) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during login';
      if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: msg });
      } else if (msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: msg });
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout linkText="New here? Create an account" linkHref="/signup">
      <div className="mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-navy-900 mb-2">Welcome back</h1>
        <p className="text-navy-400 text-sm">Please enter your details to sign in.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-1">
        <FormInput
          label="Email address"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          icon={<Mail className="w-4 h-4" />}
        />
        <FormInput
          label="Password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          icon={<Lock className="w-4 h-4" />}
        />
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover active:scale-[0.99] focus-ring flex justify-center items-center disabled:opacity-70 shadow-lg shadow-accent/20 transition-all"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             "Log in"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
