"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Trash2, ArrowRight, Clock } from "lucide-react";
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
      <div className="p-4 rounded-[20px] bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
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
        <p className="text-ink-navy font-bold text-lg mb-1">Your Library is Empty</p>
        <p className="text-gray-500 text-sm max-w-[250px]">Drop your first document on the left to ignite the engine.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      {resumes.map((resume) => (
        <div
           key={resume.id}
           className={`
             group relative flex items-center justify-between p-4 rounded-[20px] bg-white border border-gray-100 
             shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 overflow-hidden
             ${deletingId === resume.id ? "opacity-50 pointer-events-none" : ""}
           `}
        >
          {/* Subtle Hover Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Left Side: Info */}
          <div className="flex items-center gap-4 min-w-0 pr-4">
             <div className="w-12 h-12 rounded-[14px] border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-amber group-hover:bg-amber/5 group-hover:border-amber/20 transition-all duration-300">
                <FileText className="w-5 h-5" />
             </div>
             <div className="min-w-0 flex flex-col">
                <Link href={`/dashboard/tailor?resumeId=${resume.id}`} className="text-ink-navy font-bold text-[15px] truncate hover:text-amber transition-colors">
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
               className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber to-orange-400 rounded-xl text-white text-sm font-bold shadow-[0_4px_15px_rgba(232,163,61,0.3)] hover:shadow-[0_6px_20px_rgba(232,163,61,0.4)] transition-all hover:-translate-y-0.5"
             >
               Tailor
               <ArrowRight className="w-4 h-4" />
             </Link>
             
             <button
                onClick={(e) => handleDelete(resume.id, e)}
                disabled={deletingId === resume.id}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete resume"
             >
                {deletingId === resume.id ? (
                   <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
                ) : (
                   <Trash2 className="w-5 h-5" />
                )}
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}
