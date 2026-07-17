import Link from 'next/link';
import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-parchment flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background abstract decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber/10 blur-3xl rounded-full mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-ink-navy/5 blur-3xl rounded-full mix-blend-multiply" />

      <div className="max-w-2xl text-center z-10 flex flex-col items-center">
        {/* Animated small document icon indicator (optional flourish) */}
        <div className="w-12 h-16 border-2 border-ink-navy rounded mb-8 relative hidden sm:flex flex-col p-1.5 space-y-1.5 overflow-hidden">
           <div className="w-full h-1 bg-ink-navy/20 rounded"></div>
           <div className="w-full h-1 bg-ink-navy/20 rounded"></div>
           <div className="w-3/4 h-1 bg-ink-navy/20 rounded"></div>
           <div className="absolute left-0 right-0 h-[2px] bg-amber shadow-[0_0_8px_#E8A33D] motion-safe:animate-scan z-10" />
        </div>

        <h1 className="font-fraunces text-5xl sm:text-6xl md:text-7xl font-bold text-ink-navy tracking-tight mb-6">
          AI Resume <span className="text-amber">Tailor</span>
        </h1>
        
        <p className="font-sans text-lg sm:text-xl text-ink-navy/70 mb-10 max-w-xl mx-auto leading-relaxed">
          The smart way to format and customize your resume. Designed to pass Applicant Tracking Systems using tailored AI parsing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
          <Link
            href="/login"
            className="w-full sm:w-[200px] h-12 rounded-lg border-2 border-ink-navy text-ink-navy font-semibold hover:bg-ink-navy/5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 flex justify-center items-center"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-[200px] h-12 rounded-lg bg-ink-navy text-parchment font-semibold hover:bg-amber hover:text-ink-navy transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 flex justify-center items-center shadow-lg shadow-ink-navy/10"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
