import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children, linkText, linkHref }: { children: React.ReactNode, linkText: string, linkHref: string }) {
  return (
    <div className="flex min-h-screen w-full bg-navy-50">
      {/* Left Panel - Immersive brand showcase */}
      <div className="hidden lg:flex flex-col w-[45%] bg-navy-900 text-white p-12 relative overflow-hidden justify-between">
        {/* Animated background blobs */}
        <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-accent/20 rounded-full blur-[100px] animate-pulse2" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[80px] animate-pulse2" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Top - Brand */}
        <div className="relative z-10 animate-fadeIn">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              </svg>
            </div>
            <span className="font-fraunces text-xl font-bold tracking-tight">AI Resume Tailor</span>
          </Link>
        </div>

        {/* Center - Animated document mockup */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative animate-float">
            {/* Main document card */}
            <div className="w-64 h-80 bg-navy-800 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Document header */}
              <div className="w-28 h-3 bg-accent/40 rounded-full mb-4" />
              
              {/* Document lines */}
              <div className="space-y-3">
                <div className="w-full h-2 bg-white/10 rounded-full" />
                <div className="w-5/6 h-2 bg-white/10 rounded-full" />
                <div className="w-full h-2 bg-white/10 rounded-full" />
                <div className="w-3/4 h-2 bg-white/10 rounded-full" />
              </div>
              
              {/* Skills section */}
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-accent/20 border border-accent/30 rounded-full">
                  <div className="w-12 h-2 bg-accent/60 rounded-full" />
                </div>
                <div className="px-3 py-1 bg-accent/20 border border-accent/30 rounded-full">
                  <div className="w-8 h-2 bg-accent/60 rounded-full" />
                </div>
                <div className="px-3 py-1 bg-accent/20 border border-accent/30 rounded-full">
                  <div className="w-14 h-2 bg-accent/60 rounded-full" />
                </div>
              </div>
              
              {/* More lines */}
              <div className="mt-6 space-y-3">
                <div className="w-full h-2 bg-white/10 rounded-full" />
                <div className="w-4/6 h-2 bg-white/10 rounded-full" />
              </div>
              
              {/* Scanning line */}
              <div className="absolute left-0 right-0 h-[2px] bg-accent shadow-[0_0_16px_4px_rgba(37,99,235,0.5)] motion-safe:animate-scan z-10" />
            </div>
            
            {/* Floating score badge */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-xl shadow-accent/30 animate-scaleIn" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <span className="block text-lg font-bold text-white leading-none">92</span>
                <span className="block text-[10px] text-accent-200 font-medium">%</span>
              </div>
            </div>
            
            {/* Floating checkmark */}
            <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-navy-700 border border-accent/40 rounded-xl flex items-center justify-center shadow-lg animate-scaleIn" style={{ animationDelay: '0.6s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom - Tagline */}
        <div className="relative z-10 text-center max-w-sm mx-auto opacity-0 animate-fadeIn-delay-3">
          <h2 className="font-fraunces text-2xl font-bold text-white mb-3">Built to pass the scan.</h2>
          <p className="text-navy-300 text-sm leading-relaxed">
            AI-powered resume optimization that navigates ATS systems and lands your resume in the hands of recruiters.
          </p>
        </div>
      </div>
      
      {/* Right Panel - Auth form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Mobile Header Brand */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            </svg>
          </div>
          <span className="font-fraunces text-xl font-bold tracking-tight text-navy-900">AI Resume Tailor</span>
        </div>

        {/* Subtle background accent */}
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 opacity-0 animate-fadeIn-delay-1">
          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-navy-100/50">
            {children}
            
            <div className="mt-8 text-center">
              <Link href={linkHref} className="text-navy-500 hover:text-accent text-sm font-semibold transition-colors">
                {linkText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
