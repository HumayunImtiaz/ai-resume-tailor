import Link from 'next/link';
import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-navy-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-accent/8 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[35%] h-[35%] bg-navy-900/5 blur-[100px] rounded-full" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(15,23,42,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.2) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="max-w-2xl text-center z-10 flex flex-col items-center opacity-0 animate-fadeIn">
        {/* Animated document icon */}
        <div className="w-14 h-18 border-2 border-navy-900 rounded-lg mb-8 relative hidden sm:flex flex-col p-2 space-y-2 overflow-hidden shadow-lg">
          <div className="w-full h-1 bg-navy-200 rounded" />
          <div className="w-full h-1 bg-navy-200 rounded" />
          <div className="w-3/4 h-1 bg-navy-200 rounded" />
          <div className="absolute left-0 right-0 h-[2px] bg-accent shadow-[0_0_10px_rgba(37,99,235,0.6)] motion-safe:animate-scan z-10" />
        </div>

        <h1 className="font-fraunces text-5xl sm:text-6xl md:text-7xl font-bold text-navy-900 tracking-tight mb-6">
          AI Resume <span className="text-accent">Tailor</span>
        </h1>
        
        <p className="font-sans text-lg sm:text-xl text-navy-400 mb-10 max-w-xl mx-auto leading-relaxed">
          The smart way to format and customize your resume. Designed to pass Applicant Tracking Systems using tailored AI parsing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center opacity-0 animate-fadeIn-delay-2">
          <Link
            href="/login"
            className="w-full sm:w-[200px] h-12 rounded-xl border-2 border-navy-900 text-navy-900 font-semibold hover:bg-navy-900 hover:text-white focus-ring flex justify-center items-center"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-[200px] h-12 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover focus-ring flex justify-center items-center shadow-lg shadow-accent/20"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
