"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default function TailoredResultPage({ params }: { params: { versionId: string } }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-ink-navy font-sans antialiased flex flex-col items-center justify-center p-8 relative overflow-hidden selection:bg-amber/20">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber/20 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-sky-300/20 via-indigo-300/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 md:p-14 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-6">
          <Construction className="w-7 h-7 text-amber" />
        </div>

        <h1 className="font-fraunces text-2xl font-bold text-ink-navy mb-3">
          Tailored Version Detail
        </h1>
        <p className="text-ink-navy/50 text-sm mb-2">
          Version ID: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded-md font-mono">{params.versionId}</code>
        </p>
        <p className="text-ink-navy/40 text-sm mb-8">
          This page will show the full tailored resume, match score breakdown, and download options. Coming in the next module.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber to-orange-400 rounded-xl text-white text-sm font-bold shadow-[0_4px_15px_rgba(232,163,61,0.3)] hover:shadow-[0_6px_20px_rgba(232,163,61,0.4)] transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
