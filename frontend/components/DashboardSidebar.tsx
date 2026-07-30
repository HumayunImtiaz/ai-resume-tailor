"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Hexagon,
  Sparkles,
  FileText,
  Plus,
  LogOut,
  ChevronRight,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Briefcase
} from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";

function scoreBadgeClasses(score: number): string {
  if (score >= 75) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (score >= 50) return "bg-amber/20 text-amber border-amber/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

function scoreDotClasses(score: number): string {
  if (score >= 75) return "bg-emerald-400";
  if (score >= 50) return "bg-amber";
  return "bg-red-400";
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { versions, isLoading, handleLogout } = useDashboard();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isNewJobActive = pathname === "/dashboard" || pathname === "/dashboard/";
  const isProfileResumeActive = pathname === "/dashboard/profile/resume";
  const isProfileCLActive = pathname === "/dashboard/profile/cover-letter";
  const isProfileAnyActive = isProfileResumeActive || isProfileCLActive;

  if (isCollapsed) {
    return (
      <aside className="w-[64px] bg-ink-navy text-parchment flex flex-col h-full border-r border-white/10 shrink-0 shadow-2xl transition-all duration-300 items-center py-6">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative flex items-center justify-center w-10 h-10 rounded-[12px] bg-gradient-to-br from-amber to-orange-400 p-0.5 shadow-md shadow-amber/20 mb-8 hover:scale-105 transition-transform"
          title="Expand Sidebar"
        >
          <div className="relative flex items-center justify-center w-full h-full bg-ink-navy rounded-[10px]">
            <PanelLeftOpen className="w-5 h-5 text-amber" />
          </div>
        </button>

        {/* Profile */}
        <div className="mb-6">
          <Link
            href="/dashboard/profile/resume"
            className={`w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors ${isProfileAnyActive ? 'text-amber bg-white/20' : 'text-parchment'}`}
            title="Profile & Documents"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>

        {/* New Job */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md
              ${
                isNewJobActive
                  ? "bg-gradient-to-r from-amber to-orange-400 text-ink-navy shadow-amber/30 ring-2 ring-amber/50"
                  : "bg-white/10 hover:bg-amber hover:text-ink-navy text-white"
              }
            `}
            title="New Job Description"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </Link>
        </div>

        {/* Mini Tailored Versions Dots */}
        <div className="flex-1 overflow-y-auto space-y-3 w-full px-3 flex flex-col items-center scrollbar-none">
          {versions.map((version) => {
            const resultUrl = `/dashboard/tailor/result/${version.id}`;
            const isActive = pathname === resultUrl;

            return (
              <button
                key={version.id}
                onClick={() => router.push(resultUrl)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all relative group
                  ${isActive ? "ring-2 ring-amber bg-white/20 scale-110" : "hover:bg-white/15"}
                `}
                title={`${version.jobDescription.title} (${version.matchScore}%)`}
              >
                <span className={`w-3 h-3 rounded-full ${scoreDotClasses(version.matchScore)} shadow-sm`} />
              </button>
            );
          })}
        </div>

        {/* Mini Logout */}
        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl hover:bg-white/10 text-parchment/60 hover:text-white flex items-center justify-center transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] bg-ink-navy text-parchment flex flex-col h-full border-r border-white/10 shrink-0 shadow-2xl transition-all duration-300">
      {/* Brand Header & Collapse Toggle */}
      <div className="p-6 pb-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-[12px] bg-gradient-to-br from-amber to-orange-400 p-0.5 shadow-md shadow-amber/20">
            <div className="relative flex items-center justify-center w-full h-full bg-ink-navy rounded-[10px]">
              <Hexagon className="w-5 h-5 text-amber fill-amber/20" />
            </div>
          </div>
          <div>
            <span className="font-fraunces text-lg font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
              AI Tailor <Sparkles className="w-4 h-4 text-amber" />
            </span>
            <span className="text-[11px] text-parchment/50 font-medium tracking-wide block uppercase">
              Resume Engine
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-parchment/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-white/10 space-y-2">
        {/* Profile Section (Dropdown) */}
        <div>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${isProfileAnyActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-parchment/80 hover:text-white'}`}
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4" />
              <span className="text-sm font-bold">Profile</span>
            </div>
            {isProfileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {isProfileOpen && (
            <div className="mt-1 ml-4 pl-4 border-l border-white/10 flex flex-col gap-1">
              <Link 
                href="/dashboard/profile/resume"
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${isProfileResumeActive ? 'text-amber bg-white/5' : 'text-parchment/60 hover:text-white hover:bg-white/5'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Upload Resume
              </Link>
              <Link 
                href="/dashboard/profile/cover-letter"
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${isProfileCLActive ? 'text-amber bg-white/5' : 'text-parchment/60 hover:text-white hover:bg-white/5'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Cover Letter
              </Link>
            </div>
          )}
        </div>

        {/* Job Description (New Job) */}
        <Link
          href="/dashboard"
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${isNewJobActive && !isProfileAnyActive ? 'bg-gradient-to-r from-amber to-orange-400 text-ink-navy shadow-[0_0_15px_rgba(232,163,61,0.2)] font-bold' : 'hover:bg-white/5 text-parchment/80 hover:text-white font-bold text-sm'}`}
        >
          {isNewJobActive && !isProfileAnyActive ? <Plus className="w-4 h-4 stroke-[3]" /> : <Briefcase className="w-4 h-4" />}
          Job Description
        </Link>
      </div>

      {/* Scrollable Versions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        <div className="flex items-center justify-between text-xs font-semibold text-parchment/50 uppercase tracking-wider px-1 mb-1">
          <span>Tailored Versions</span>
          <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-parchment/80 font-bold">
            {versions.length}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-white/5 rounded-2xl animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 px-3 text-parchment/40 text-xs leading-relaxed">
            No tailored versions yet. Paste a Job Description to start tailoring!
          </div>
        ) : (
          versions.map((version) => {
            const resultUrl = `/dashboard/tailor/result/${version.id}`;
            const isActive = pathname === resultUrl;

            return (
              <button
                key={version.id}
                onClick={() => router.push(resultUrl)}
                className={`
                  w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group
                  ${
                    isActive
                      ? "bg-white/15 border-amber/50 text-white shadow-md"
                      : "bg-white/5 border-white/5 text-parchment/80 hover:bg-white/10 hover:text-white hover:border-white/10"
                  }
                `}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreBadgeClasses(
                        version.matchScore
                      )}`}
                    >
                      {version.matchScore}%
                    </span>
                    <span className="text-[11px] text-parchment/50 truncate font-medium">
                      {new Date(version.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate group-hover:text-amber transition-colors">
                    {version.jobDescription.title}
                  </p>
                  {version.jobDescription.company && (
                    <p className="text-[11px] text-parchment/50 truncate font-medium mt-0.5">
                      {version.jobDescription.company}
                    </p>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-amber translate-x-0.5" : "text-parchment/30 group-hover:text-parchment/70 group-hover:translate-x-0.5"}`} />
              </button>
            );
          })
        )}
      </div>

      {/* Log Out Bottom Action */}
      <div className="p-6 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-parchment/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group border border-transparent hover:border-white/10"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
