"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Trash2, ArrowRight, Clock, ChevronDown, ChevronUp, History, Eye, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Resume {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface TailoredVersion {
  id: string;
  matchScore: number;
  createdAt: string;
  jobDescription: {
    id: string;
    title: string;
    company: string | null;
  };
}

interface ResumeListProps {
  /** Incremented by the parent whenever a new upload succeeds, to trigger a refetch. */
  refreshKey: number;
}

/** Returns Tailwind classes for the score badge based on value. */
function scoreBadgeClasses(score: number): string {
  if (score >= 75) return "bg-success-50 text-success-700 border-success-200";
  if (score >= 50) return "bg-primary-50 text-primary-700 border-primary-200";
  return "bg-error/10 text-error border-error-200";
}

export default function ResumeList({ refreshKey }: ResumeListProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Track expanded state and fetched versions per resume
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versionsMap, setVersionsMap] = useState<Record<string, TailoredVersion[]>>({});
  const [versionsLoading, setVersionsLoading] = useState<Record<string, boolean>>({});
  const [versionCounts, setVersionCounts] = useState<Record<string, number | null>>({});

  const fetchResumes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/resumes");
      const json = await res.json();
      const resumeList: Resume[] = json.data || [];
      setResumes(resumeList);

      // Fetch version counts for all resumes in parallel
      const countEntries = await Promise.all(
        resumeList.map(async (r) => {
          try {
            const vRes = await apiFetch(`/api/resumes/${r.id}/versions`);
            const vJson = await vRes.json();
            const versions: TailoredVersion[] = vJson.data || [];
            return { id: r.id, count: versions.length, versions };
          } catch {
            return { id: r.id, count: 0, versions: [] as TailoredVersion[] };
          }
        })
      );

      const counts: Record<string, number> = {};
      const vMap: Record<string, TailoredVersion[]> = {};
      for (const item of countEntries) {
        counts[item.id] = item.count;
        vMap[item.id] = item.versions;
      }
      setVersionCounts(counts);
      setVersionsMap(vMap);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes, refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDeletingId(id);
    try {
      await apiFetch(`/api/resumes/${id}`, { method: "DELETE" });
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete resume.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = async (resumeId: string) => {
    if (expandedId === resumeId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(resumeId);

    // If we already have cached versions, no need to refetch
    if (versionsMap[resumeId] && versionsMap[resumeId].length > 0) return;

    setVersionsLoading((prev) => ({ ...prev, [resumeId]: true }));
    try {
      const res = await apiFetch(`/api/resumes/${resumeId}/versions`);
      const json = await res.json();
      setVersionsMap((prev) => ({ ...prev, [resumeId]: json.data || [] }));
    } catch {
      // Silently ignore — the panel will show empty
    } finally {
      setVersionsLoading((prev) => ({ ...prev, [resumeId]: false }));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
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
          <div key={i} className="flex items-center gap-4 p-4 rounded-[20px] bg-white border border-gray-100 shadow-sm animate-pulse">
            <div className="w-12 h-12 rounded-[14px] bg-gray-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-3 w-1/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-[20px] bg-error/10 border border-error/20 text-error text-sm font-medium">
        Error: {error}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-center border-2 border-dashed border-gray-200 rounded-[24px] bg-white/50">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-heading font-bold text-lg mb-1">Your Library is Empty</p>
        <p className="text-gray-500 text-sm max-w-[250px]">Drop your first document on the left to ignite the engine.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      {resumes.map((resume) => {
        const count = versionCounts[resume.id] ?? null;
        const isExpanded = expandedId === resume.id;
        const versions = versionsMap[resume.id] || [];
        const isLoadingVersions = versionsLoading[resume.id];

        return (
          <div key={resume.id} className="flex flex-col">
            {/* Resume Card */}
            <div
              className={`
                group relative flex flex-col rounded-[20px] bg-white border border-gray-100
                shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden
                ${deletingId === resume.id ? "opacity-50 pointer-events-none" : ""}
                ${isExpanded ? "rounded-b-none border-b-0" : "hover:-translate-y-0.5"}
              `}
            >
              {/* Subtle Hover Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="flex items-center justify-between p-4">
                {/* Left Side: Info */}
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-12 h-12 rounded-[14px] border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <Link href={`/dashboard/tailor?resumeId=${resume.id}`} className="text-heading font-bold text-[15px] truncate hover:text-primary transition-colors">
                      {resume.originalFilename}
                    </Link>
                    <div className="flex items-center gap-1.5 text-gray-500 text-[13px] mt-0.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Added {formatDate(resume.uploadedAt)}
                    </div>
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-2 relative z-10">
                  <Link
                    href={`/dashboard/tailor?resumeId=${resume.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-card hover:bg-primary-hover transition-colors font-bold text-base flex items-center justify-center gap-2"
                  >
                    Tailor
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={(e) => handleDelete(resume.id, e)}
                    disabled={deletingId === resume.id}
                    className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-xl transition-all"
                    title="Delete resume"
                  >
                    {deletingId === resume.id ? (
                      <div className="w-5 h-5 border-2 border-error border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Toggle for tailored versions */}
              {count !== null && count > 0 && (
                <button
                  onClick={() => toggleExpand(resume.id)}
                  className="flex items-center gap-2 px-5 pb-3.5 pt-0.5 text-[13px] font-semibold text-body hover:text-primary transition-colors group/toggle"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>
                    View past tailored versions ({count})
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 transition-transform" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                  )}
                </button>
              )}

              {count !== null && count === 0 && (
                <div className="flex items-center gap-2 px-5 pb-3.5 pt-0.5 text-[12px] font-medium text-gray-400 italic">
                  <Sparkles className="w-3 h-3" />
                  Not tailored yet
                </div>
              )}
            </div>

            {/* Expanded Version History Panel */}
            {isExpanded && count !== null && count > 0 && (
              <div
                className="bg-gray-50/80 border border-t-0 border-gray-100 rounded-b-[20px] overflow-hidden transition-all duration-300"
              >
                {isLoadingVersions ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
                    Loading versions…
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400">
                    No tailored versions found.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-white/60 transition-colors group/version"
                      >
                        {/* Version Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Score Badge */}
                          <span
                            className={`inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-lg border min-w-[3rem] text-center ${scoreBadgeClasses(version.matchScore)}`}
                          >
                            {version.matchScore}%
                          </span>

                          <div className="min-w-0 flex flex-col">
                            <span className="text-heading text-[13px] font-semibold truncate">
                              {version.jobDescription.title}
                              {version.jobDescription.company && (
                                <span className="text-gray-400 font-medium"> · {version.jobDescription.company}</span>
                              )}
                            </span>
                            <span className="text-[12px] text-gray-400 font-medium mt-0.5">
                              {formatDate(version.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* View Button */}
                        <button
                          onClick={() => router.push(`/dashboard/tailor/result/${version.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-body hover:text-primary bg-white border border-gray-100 hover:border-primary/30 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
