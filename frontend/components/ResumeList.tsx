"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  ArrowRight,
  MoreVertical,
  Trash2,
  Eye,
  History,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Sparkles
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Toast } from "@/components/Toast";
import { useDashboard } from "@/lib/DashboardContext";

export interface ResumeItem {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

export interface TailoredVersionItem {
  id: string;
  matchScore: number;
  createdAt: string;
  jobDescription: {
    id: string;
    title: string;
    company: string | null;
  };
}

function scoreBadgeClasses(score: number): string {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export default function ResumeList() {
  const router = useRouter();
  const { removeVersion, refreshDashboard } = useDashboard();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [versionCounts, setVersionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeItem | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<{ id: string; title: string; resumeId: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expandable tailored versions state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versionsMap, setVersionsMap] = useState<Record<string, TailoredVersionItem[]>>({});
  const [versionsLoading, setVersionsLoading] = useState<Record<string, boolean>>({});

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/resumes");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Failed to load resumes");
      }

      const list: ResumeItem[] = json.data || [];
      const sorted = [...list].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      setResumes(sorted);

      // Fetch version counts for each resume
      const counts: Record<string, number> = {};
      await Promise.all(
        sorted.map(async (r) => {
          try {
            const vRes = await apiFetch(`/api/resumes/${r.id}/versions`);
            if (vRes.ok) {
              const vJson = await vRes.json();
              counts[r.id] = (vJson.data || []).length;
            }
          } catch {
            counts[r.id] = 0;
          }
        })
      );
      setVersionCounts(counts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = async (resumeId: string) => {
    if (expandedId === resumeId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(resumeId);

    if (!versionsMap[resumeId]) {
      try {
        setVersionsLoading((prev) => ({ ...prev, [resumeId]: true }));
        const res = await apiFetch(`/api/resumes/${resumeId}/versions`);
        if (res.ok) {
          const json = await res.json();
          setVersionsMap((prev) => ({ ...prev, [resumeId]: json.data || [] }));
        }
      } catch (err) {
        console.error("Failed to load versions for resume", err);
      } finally {
        setVersionsLoading((prev) => ({ ...prev, [resumeId]: false }));
      }
    }
  };

  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;
    const id = resumeToDelete.id;
    setDeletingId(id);

    try {
      const response = await apiFetch(`/api/resumes/${id}`, { method: "DELETE" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Failed to delete resume");
      }

      setResumes((prev) => prev.filter((r) => r.id !== id));
      setToastMessage("Resume deleted successfully.");
      setResumeToDelete(null);
      refreshDashboard();
    } catch (err: any) {
      setToastMessage(err.message || "Could not delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteVersion = async () => {
    if (!versionToDelete) return;
    const { id, resumeId } = versionToDelete;
    setDeletingId(id);

    try {
      const response = await apiFetch(`/api/jobs/versions/${id}`, { method: "DELETE" });
      if (response.ok) {
        // Remove locally from versions map
        setVersionsMap((prev) => ({
          ...prev,
          [resumeId]: (prev[resumeId] || []).filter((v) => v.id !== id),
        }));
        // Decrement count
        setVersionCounts((prev) => ({
          ...prev,
          [resumeId]: Math.max(0, (prev[resumeId] || 1) - 1),
        }));
        removeVersion(id);
        setToastMessage("Tailored version deleted successfully.");
        setVersionToDelete(null);
      } else {
        const json = await response.json();
        setToastMessage(json.message || "Could not delete version");
      }
    } catch (err: any) {
      setToastMessage(err.message || "Could not delete version");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-navy-100 shadow-sm animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-navy-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/3 rounded bg-navy-200" />
              <div className="h-3 w-1/4 rounded bg-navy-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
        Error: {error}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[320px] text-center border-2 border-dashed border-navy-200 rounded-3xl bg-white/60 p-6">
        <div className="w-14 h-14 rounded-2xl bg-navy-50 shadow-sm border border-navy-100 flex items-center justify-center mb-4 text-navy-400">
          <FileText className="w-6 h-6" />
        </div>
        <p className="text-navy-900 font-bold text-lg mb-1">Your Library is Empty</p>
        <p className="text-navy-500 text-sm max-w-[260px]">Upload your base resume to start tailoring job applications.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
        {resumes.map((resume) => {
          const count = versionCounts[resume.id] ?? null;
          const isExpanded = expandedId === resume.id;
          const versions = versionsMap[resume.id] || [];
          const isLoadingVersions = versionsLoading[resume.id];
          const isMenuOpen = openMenuId === resume.id;

          return (
            <div key={resume.id} className="flex flex-col">
              {/* Resume Card */}
              <div
                className={`
                  group relative flex flex-col rounded-2xl bg-white border border-navy-100
                  shadow-sm transition-all duration-300 hover:shadow-md
                  ${deletingId === resume.id ? "opacity-50 pointer-events-none" : ""}
                  ${isExpanded ? "rounded-b-none border-b-0" : "hover:-translate-y-0.5"}
                `}
              >
                <div className="flex items-center justify-between p-4">
                  {/* Left Side: Info */}
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <div className="w-11 h-11 rounded-xl border border-navy-100 bg-navy-50 flex items-center justify-center shrink-0 text-navy-600 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <button
                        onClick={() => router.push(`/dashboard/tailor?resumeId=${resume.id}`)}
                        className="text-left font-bold text-[15px] text-navy-900 truncate hover:text-accent transition-colors"
                      >
                        {resume.originalFilename}
                      </button>
                      <div className="flex items-center gap-1.5 text-navy-400 text-xs mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Added {formatDate(resume.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Primary Tailor Action & Three-Dot Context Menu */}
                  <div className="flex items-center gap-2 relative">
                    <Link
                      href={`/dashboard/tailor?resumeId=${resume.id}`}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent text-white hover:bg-accent-hover rounded-xl font-semibold text-xs transition-colors shadow-sm"
                    >
                      Tailor
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Three-Dot (⋮) Menu Button */}
                    <div className="relative" ref={isMenuOpen ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : resume.id);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-navy-400 hover:text-navy-900 hover:bg-navy-100 rounded-xl transition-all"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Contextual Menu Dropdown */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-10 w-44 bg-white border border-navy-100 rounded-xl shadow-xl z-30 py-1 overflow-hidden animate-fadeIn">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              router.push(`/dashboard/tailor?resumeId=${resume.id}`);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:text-accent transition-colors text-left"
                          >
                            <Eye className="w-4 h-4" />
                            View / Tailor
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setResumeToDelete(resume);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-navy-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Resume
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle for tailored versions */}
                {count !== null && count > 0 && (
                  <button
                    onClick={() => toggleExpand(resume.id)}
                    className="flex items-center gap-2 px-4 pb-3 pt-0 text-xs font-semibold text-navy-500 hover:text-accent transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View past tailored versions ({count})</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {count !== null && count === 0 && (
                  <div className="flex items-center gap-2 px-4 pb-3 pt-0 text-[11px] font-medium text-navy-400 italic">
                    <Sparkles className="w-3 h-3 text-accent" />
                    Not tailored yet
                  </div>
                )}
              </div>

              {/* Expanded History Panel */}
              {isExpanded && count !== null && count > 0 && (
                <div className="bg-navy-50/60 border border-t-0 border-navy-100 rounded-b-2xl overflow-hidden transition-all duration-300">
                  {isLoadingVersions ? (
                    <div className="flex items-center justify-center py-5 gap-2 text-xs text-navy-400">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Loading versions...
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-5 text-xs text-navy-400">
                      No tailored versions found.
                    </div>
                  ) : (
                    <div className="divide-y divide-navy-100/60">
                      {versions.map((version) => {
                        const isVersionMenuOpen = openMenuId === version.id;

                        return (
                          <div
                            key={version.id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-white/80 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-lg border min-w-[2.8rem] text-center ${scoreBadgeClasses(version.matchScore)}`}>
                                {version.matchScore}%
                              </span>
                              <div className="min-w-0 flex flex-col">
                                <span className="text-navy-900 text-xs font-semibold truncate">
                                  {version.jobDescription.title}
                                  {version.jobDescription.company && (
                                    <span className="text-navy-400 font-normal"> · {version.jobDescription.company}</span>
                                  )}
                                </span>
                                <span className="text-[11px] text-navy-400 font-medium">
                                  {formatDate(version.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Options Menu for Single Tailored Version */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/tailor/result/${version.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-navy-700 hover:text-accent bg-white border border-navy-200 rounded-lg shadow-2xs hover:border-accent transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>

                              <button
                                onClick={() => setVersionToDelete({ id: version.id, title: version.jobDescription.title, resumeId: resume.id })}
                                className="p-1 text-navy-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete tailored version"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Base Resume Deletion */}
      {resumeToDelete && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-navy-100 relative">
            <button
              onClick={() => setResumeToDelete(null)}
              className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-navy-900 mb-2 font-fraunces">Delete Resume?</h3>
            <p className="text-navy-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-navy-900">{resumeToDelete.originalFilename}</span>? This action cannot be undone and will remove all associated tailored versions.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResumeToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-navy-200 text-navy-700 text-sm font-semibold hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteResume}
                disabled={Boolean(deletingId)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                {deletingId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Delete Resume"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Version Deletion */}
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

            <h3 className="text-lg font-bold text-navy-900 mb-2 font-fraunces">Delete Tailored Version?</h3>
            <p className="text-navy-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete the tailored version for <span className="font-semibold text-navy-900">{versionToDelete.title}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setVersionToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-navy-200 text-navy-700 text-sm font-semibold hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVersion}
                disabled={Boolean(deletingId)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                {deletingId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Delete Version"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </>
  );
}
