"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Briefcase,
  Settings,
  MoreVertical,
  Trash2,
  Eye,
  AlertTriangle,
  X
} from "lucide-react";
import { useDashboard, TailoredVersion } from "@/lib/DashboardContext";
import { apiFetch } from "@/lib/api";
import { Toast } from "@/components/Toast";

function scoreBadgeClasses(score: number): string {
  if (score >= 75) return "bg-accent/20 text-accent border-accent/30";
  if (score >= 50) return "bg-navy-700 text-white border-navy-600";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

function scoreDotClasses(score: number): string {
  if (score >= 75) return "bg-accent";
  if (score >= 50) return "bg-navy-300";
  return "bg-red-400";
}

export default function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { versions, isLoading, handleLogout, removeVersion } = useDashboard();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Menu & Deletion state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<TailoredVersion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteVersion = async () => {
    if (!versionToDelete) return;
    const versionId = versionToDelete.id;
    setIsDeleting(true);

    try {
      const res = await apiFetch(`/api/jobs/versions/${versionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        removeVersion(versionId);
        setToastMessage("Tailored resume version deleted successfully.");
        setVersionToDelete(null);
        if (pathname === `/dashboard/tailor/result/${versionId}`) {
          router.push("/dashboard");
        }
      } else {
        const json = await res.json();
        setToastMessage(json.message || "Failed to delete version.");
      }
    } catch (err: any) {
      setToastMessage(err.message || "Failed to delete version.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isNewJobActive = pathname === "/dashboard" || pathname === "/dashboard/";
  const isProfileResumeActive = pathname === "/dashboard/profile/resume";
  const isProfileCLActive = pathname === "/dashboard/profile/cover-letter";
  const isProfileAnyActive = isProfileResumeActive || isProfileCLActive;
  const isSettingsActive = pathname === "/dashboard/settings";

  if (isCollapsed) {
    return (
      <aside className="w-[64px] bg-navy-900 text-white flex flex-col h-full border-r border-white/10 shrink-0 shadow-2xl transition-all duration-300 items-center py-6">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative flex items-center justify-center w-10 h-10 rounded-[12px] bg-accent p-0.5 shadow-md shadow-accent/20 mb-8 hover:scale-105 transition-transform"
          title="Expand Sidebar"
        >
          <div className="relative flex items-center justify-center w-full h-full bg-navy-900 rounded-[10px]">
            <PanelLeftOpen className="w-5 h-5 text-accent" />
          </div>
        </button>

        {/* Profile */}
        <div className="mb-4">
          <Link
            href="/dashboard/profile/resume"
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${isProfileAnyActive ? 'text-accent bg-white/10 border-accent/40' : 'text-white/70 hover:text-white border-white/10 hover:bg-white/10'}`}
            title="Profile & Documents"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>

        {/* New Job */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md
              ${isNewJobActive && !isProfileAnyActive && !isSettingsActive
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-white/10 hover:bg-accent hover:text-white text-white/80 border border-white/10"
              }
            `}
            title="New Job Description"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </Link>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <Link
            href="/dashboard/settings"
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${isSettingsActive ? 'text-accent bg-white/10 border-accent/40' : 'text-white/70 hover:text-white border-white/10 hover:bg-white/10'}`}
            title="Settings & Danger Zone"
          >
            <Settings className="w-5 h-5" />
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
                  ${isActive ? "ring-2 ring-accent bg-white/20 scale-110" : "hover:bg-white/15"}
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
            className="w-10 h-10 rounded-xl hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-[280px] bg-navy-900 text-white flex flex-col h-full border-r border-white/10 shrink-0 shadow-2xl transition-all duration-300">
        {/* Brand Header & Collapse Toggle */}
        <div className="p-5 pb-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-accent p-0.5 shadow-md shadow-accent/20 group-hover:scale-105 transition-transform">
              <div className="relative flex items-center justify-center w-full h-full bg-navy-900 rounded-[10px]">
                <Hexagon className="w-5 h-5 text-accent fill-accent/20" />
              </div>
            </div>
            <div>
              <span className="font-fraunces text-lg font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
                AI Tailor <Sparkles className="w-3.5 h-3.5 text-accent" />
              </span>
              <span className="text-[10px] text-white/50 font-semibold tracking-wider block uppercase">
                Resume Engine
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden md:flex p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-white/10 space-y-1.5">
          {/* Profile Section (Dropdown) */}
          <div
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${isProfileAnyActive ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 text-white/80 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold">Profile & Resumes</span>
              </div>
              {isProfileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
                isProfileOpen ? "max-h-40 opacity-100 mt-1 pointer-events-auto" : "max-h-0 opacity-0 mt-0 pointer-events-none"
              }`}
            >
              <div className="ml-4 pl-3 border-l border-white/10 flex flex-col gap-1">
                <Link
                  href="/dashboard/profile/resume"
                  onClick={onClose}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${isProfileResumeActive ? 'text-accent bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Upload Resume
                </Link>
                <Link
                  href="/dashboard/profile/cover-letter"
                  onClick={onClose}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${isProfileCLActive ? 'text-accent bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Cover Letter
                </Link>
              </div>
            </div>
          </div>

          {/* Job Description (New Job) */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
              isNewJobActive && !isProfileAnyActive && !isSettingsActive
                ? 'bg-accent/15 text-accent border border-accent/30 font-bold text-xs'
                : 'hover:bg-white/5 text-white/80 hover:text-white font-semibold text-xs'
            }`}
          >
            {isNewJobActive && !isProfileAnyActive && !isSettingsActive ? (
              <Plus className="w-4 h-4 stroke-[3]" />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
            New Job Description
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
              isSettingsActive
                ? 'bg-accent/15 text-accent border border-accent/30 font-bold text-xs'
                : 'hover:bg-white/5 text-white/80 hover:text-white font-semibold text-xs'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings & Danger Zone
          </Link>
        </div>

        {/* Scrollable Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/50 uppercase tracking-wider px-1 mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent" />
              Generated Resumes
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80 font-bold">
              {versions.length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2.5 pt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-white/5 rounded-xl animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 px-3 text-white/40 text-xs leading-relaxed">
              No tailored versions yet. Paste a Job Description to start tailoring!
            </div>
          ) : (
            versions.map((version) => {
              const resultUrl = `/dashboard/tailor/result/${version.id}`;
              const isActive = pathname === resultUrl;
              const isMenuOpen = openMenuId === version.id;

              return (
                <div
                  key={version.id}
                  className={`
                    relative rounded-xl border transition-all flex items-center justify-between group
                    ${isActive
                      ? "bg-white/15 border-accent/50 text-white shadow-md"
                      : "bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/10"
                    }
                  `}
                >
                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      router.push(resultUrl);
                    }}
                    className="flex-1 text-left p-3 min-w-0 pr-1"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreBadgeClasses(
                          version.matchScore
                        )}`}
                      >
                        {version.matchScore}%
                      </span>
                      <span className="text-[10px] text-white/50 truncate font-medium">
                        {new Date(version.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate group-hover:text-accent transition-colors">
                      {version.jobDescription.title}
                    </p>
                    {version.jobDescription.company && (
                      <p className="text-[10px] text-white/50 truncate font-medium mt-0.5">
                        {version.jobDescription.company}
                      </p>
                    )}
                  </button>

                  {/* Three-Dot (⋮) Menu Button */}
                  <div className="relative pr-2" ref={isMenuOpen ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : version.id);
                      }}
                      className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Context Menu Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 w-36 bg-navy-800 border border-white/15 rounded-xl shadow-2xl z-30 py-1 overflow-hidden animate-fadeIn">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            if (onClose) onClose();
                            router.push(resultUrl);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-accent hover:text-white transition-colors text-left"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setVersionToDelete(version);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors text-left border-t border-white/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Log Out Bottom Action */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Delete Single Tailored Resume Confirmation Modal */}
      {versionToDelete && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-navy-100 relative">
            <button
              onClick={() => setVersionToDelete(null)}
              className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-navy-900 mb-2 font-fraunces">Delete Tailored Resume?</h3>
            <p className="text-navy-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete the tailored resume version for <span className="font-semibold text-navy-900">{versionToDelete.jobDescription.title}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setVersionToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-navy-200 text-navy-700 text-sm font-semibold hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVersion}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Delete Version"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </>
  );
}
