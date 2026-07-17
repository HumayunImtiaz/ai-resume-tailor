import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children, linkText, linkHref }: { children: React.ReactNode, linkText: string, linkHref: string }) {
  return (
    <div className="flex min-h-screen w-full bg-parchment">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex flex-col w-[40%] bg-ink-navy text-parchment p-12 relative overflow-hidden justify-center items-center">
        <div className="mt-auto mb-16">
          {/* Document Silhouette */}
          <div className="w-56 h-72 border-2 border-parchment/20 relative rounded-lg flex flex-col p-6 space-y-4 bg-ink-navy shadow-lg overflow-hidden">
            <div className="w-full h-8 bg-parchment/10 rounded"></div>
            <div className="w-3/4 h-2 bg-parchment/10 rounded"></div>
            <div className="w-full h-2 bg-parchment/10 rounded"></div>
            <div className="w-5/6 h-2 bg-parchment/10 rounded"></div>
            <div className="w-full h-10 bg-parchment/10 rounded mt-auto"></div>
            
            {/* Scan Line */}
            <div className="absolute left-0 right-0 h-1 bg-amber shadow-[0_0_12px_4px_#E8A33D] motion-safe:animate-scan z-10" />
          </div>
        </div>
        
        <div className="mt-auto text-center mx-auto max-w-xs mb-12">
          <h2 className="font-fraunces text-3xl font-medium text-parchment mb-3">Built to pass the scan.</h2>
          <p className="font-sans text-parchment/70 text-sm leading-relaxed">Ensure your resume effortlessly navigates ATS systems right into the hands of recruiters.</p>
        </div>
      </div>
      
      {/* Right Panel - Form taking full width on mobile, 60% on desktop */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink-navy/5">
          {children}
          
          <div className="mt-8 text-center">
            <Link href={linkHref} className="text-ink-navy/70 hover:text-amber text-sm font-medium transition-colors">
              {linkText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
