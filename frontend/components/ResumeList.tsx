"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Sparkles, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Resume {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface ResumeListProps {
  /** Incremented by the parent whenever a new upload succeeds, to trigger a refetch. */
  refreshKey: number;
}

export default function ResumeList({ refreshKey }: ResumeListProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/resumes");
      const json = await res.json();
      setResumes(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes, refreshKey]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(`/api/resumes/${id}`, { method: "DELETE" });
      // Optimistically remove from list
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete resume.");
    } finally {
      setDeletingId(null);
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-ink-navy/5 animate-pulse"
          >
            <div className="w-10 h-10 rounded-lg bg-ink-navy/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-ink-navy/5" />
              <div className="h-3 w-24 rounded bg-ink-navy/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
        {error}
      </div>
    );
  }

  // Empty state
  if (resumes.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-xl bg-ink-navy/5 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-ink-navy/30" />
        </div>
        <p className="text-ink-navy/70 font-medium mb-1">No resumes yet</p>
        <p className="text-ink-navy/50 text-sm">Upload one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className={`
            flex items-center gap-4 p-4 rounded-xl bg-white border border-ink-navy/5
            shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)]
            transition-all duration-200 group
            ${deletingId === resume.id ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          {/* File icon */}
          <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-amber" />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-ink-navy font-medium text-sm truncate">{resume.originalFilename}</p>
            <p className="text-ink-navy/50 text-xs mt-0.5">
              Uploaded {formatDate(resume.uploadedAt)}
            </p>
          </div>

          {/* Tailor button */}
          <Link
            href={`/dashboard/tailor?resumeId=${resume.id}`}
            className="px-3.5 py-2 rounded-lg bg-amber/10 text-amber font-medium text-xs hover:bg-amber/20 transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 flex items-center gap-1.5 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tailor
          </Link>

          {/* Delete button */}
          <button
            onClick={() => handleDelete(resume.id)}
            disabled={deletingId === resume.id}
            className="p-2 rounded-lg text-ink-navy/30 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 flex-shrink-0"
            aria-label={`Delete ${resume.originalFilename}`}
          >
            {deletingId === resume.id ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
