"use client";

import React from "react";
import { DashboardProvider, useDashboard } from "@/lib/DashboardContext";
import DashboardSidebar from "@/components/DashboardSidebar";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCheckingAuth } = useDashboard();

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-amber/10" />
          <div className="absolute inset-0 rounded-full border-4 border-amber border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8F9FA] text-ink-navy font-sans antialiased overflow-hidden selection:bg-amber/20">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto relative h-full">
        {/* Soft background accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-amber/15 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-sky-300/15 via-indigo-300/10 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-8 md:px-14 py-8 md:py-12 max-w-[900px] mx-auto min-h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
