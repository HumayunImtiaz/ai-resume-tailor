"use client";

import React, { useState } from "react";
import { DashboardProvider, useDashboard } from "@/lib/DashboardContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Menu, X } from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCheckingAuth } = useDashboard();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-body font-sans antialiased overflow-hidden selection:bg-primary/20">

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <DashboardSidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative h-full w-full min-w-0">

        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-lg border-b border-navy-100 sticky top-0 z-30">
          <div className="font-fraunces font-bold text-navy-900 flex items-center gap-2">
            ShortlistAI
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white rounded-lg border border-navy-200 shadow-sm text-navy-700">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Soft background accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-primary/15 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-sky-300/15 via-primary/10 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-8 md:px-14 py-6 sm:py-8 md:py-12 max-w-[900px] w-full mx-auto min-h-full flex flex-col">
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
