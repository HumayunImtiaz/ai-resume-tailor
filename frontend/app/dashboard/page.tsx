"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Basic verification since we are fully client side
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.replace('/login');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  // Prevent UI flashing before navigation completes
  if (isChecking) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#14213D" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-parchment flex flex-col p-6 sm:p-12">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-16 pb-6 border-b border-ink-navy/10">
        <div className="font-fraunces text-2xl font-bold text-ink-navy flex items-center gap-2">
          <div className="w-6 h-8 border-2 border-ink-navy rounded-sm flex flex-col p-1 space-y-[2px] relative hidden sm:flex">
             <div className="w-full h-[2px] bg-ink-navy/40 rounded-full"></div>
             <div className="w-3/4 h-[2px] bg-ink-navy/40 rounded-full"></div>
             <div className="absolute left-0 right-0 h-0.5 bg-amber top-[40%] opacity-50" />
          </div>
          AI Resume <span className="text-amber">Tailor</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-lg border border-ink-navy/20 text-ink-navy font-medium hover:bg-ink-navy text-sm hover:text-parchment transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 bg-white/50"
        >
          Log out
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-2xl mx-auto -mt-20">
        <h1 className="font-fraunces text-4xl sm:text-5xl font-semibold text-ink-navy mb-6">
          You're logged in.
        </h1>
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink-navy/5 max-w-lg">
          <p className="font-sans text-lg text-ink-navy/80 leading-relaxed mb-2">
            Welcome to your workspace!
          </p>
          <p className="font-sans text-ink-navy/60">
            The full interactive dashboard features and resume parsers will be arriving in a future sprint.
          </p>
        </div>
      </div>
    </main>
  );
}
