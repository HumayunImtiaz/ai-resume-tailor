"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileText,
  Plus,
} from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { apiFetch } from "@/lib/api";
import ResumeUploader from "@/components/ResumeUploader";
import TailorProgress from "@/components/TailorProgress";
import TailoredResult from "@/components/TailoredResult";

type PageState = "form" | "processing" | "completed" | "failed";

export default function DashboardPage() {
  const router = useRouter();
  const { activeResume, isLoading, refreshDashboard } = useDashboard();

  // Form state
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Processing state
  const [pageState, setPageState] = useState<PageState>("form");
  const [queueJobId, setQueueJobId] = useState<string | null>(null);
  const [queueState, setQueueState] = useState("waiting");
  const [jobDescId, setJobDescId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Completed results
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [tailoredResume, setTailoredResume] = useState<any>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        try {
          const res = await apiFetch(`/api/jobs/status/${jobId}`);
          const json = await res.json();
          const state = json.data?.state;

          setQueueState(state || "waiting");

          if (state === "completed") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (typeof json.data?.matchScore === "number") {
              setMatchScore(json.data.matchScore);
            }
            if (Array.isArray(json.data?.missingKeywords)) {
              setMissingKeywords(json.data.missingKeywords);
            }
            if (json.data?.tailoredResume) {
              setTailoredResume(json.data.tailoredResume);
            }
            setPageState("completed");
            // Refresh sidebar to display the new tailored version
            await refreshDashboard();
          } else if (state === "failed") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPageState("failed");
          }
        } catch {
          // Retry on network errors
        }
      }, 1500);
    },
    [refreshDashboard]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!activeResume) {
      setFormError("No resume available. Please upload a resume first.");
      return;
    }
    if (!title.trim()) {
      setFormError("Job title is required.");
      return;
    }
    if (rawText.length < 20) {
      setFormError("Job description must be at least 20 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          resumeId: activeResume.id,
          title: title.trim(),
          company: company.trim() || undefined,
          rawText,
          coverLetterText: coverLetterText.trim() || undefined,
        }),
      });
      const json = await res.json();
      const jobId = json.data?.queueJobId;
      const descId = json.data?.jobDescription?.id;

      if (!jobId) {
        setFormError("Unexpected response — no job ID returned.");
        setIsSubmitting(false);
        return;
      }

      setQueueJobId(jobId);
      if (descId) setJobDescId(descId);
      setPageState("processing");
      startPolling(jobId);
    } catch (err: any) {
      setFormError(err.message || "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setCompany("");
    setRawText("");
    setCoverLetterText("");
    setFormError("");
    setQueueJobId(null);
    setJobDescId(null);
    setQueueState("waiting");
    setMatchScore(null);
    setMissingKeywords([]);
    setTailoredResume(null);
    setPageState("form");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-amber border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-ink-navy/50 text-sm font-medium">Loading dashboard...</p>
      </div>
    );
  }

  // ── No Resume Uploaded View ──
  if (!activeResume) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-5 text-amber">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-ink-navy mb-2">
            Upload Your Resume
          </h2>
          <p className="text-ink-navy/60 text-sm max-w-md mx-auto mb-8">
            Upload your base resume to get started. We will analyze and rewrite it for any job description.
          </p>
          <div className="min-h-[260px] flex flex-col">
            <ResumeUploader onUploadSuccess={refreshDashboard} />
          </div>
        </div>
      </div>
    );
  }

  // ── Main Tailor Job Form View ──
  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-[900px] mx-auto py-2">
      {/* ── FORM STATE ── */}
      {pageState === "form" && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10">
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <h1 className="font-fraunces text-3xl font-bold text-ink-navy">
                Tailor Resume to Job
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-navy/5 text-ink-navy/70 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5 text-amber" />
                Active: <span className="text-ink-navy font-bold truncate max-w-[180px]">{activeResume.originalFilename}</span>
              </div>
            </div>
            <p className="text-ink-navy/60 text-sm">
              Paste the target job description below and we&apos;ll craft an optimized version tailored specifically for this role.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="job-title" className="block text-ink-navy font-semibold text-sm mb-1.5">
                Job Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-navy/40" />
                <input
                  id="job-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-navy/15 bg-white text-ink-navy text-sm placeholder:text-ink-navy/30 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-ink-navy font-semibold text-sm mb-1.5">
                Company Name <span className="text-ink-navy/40 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-navy/40" />
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-navy/15 bg-white text-ink-navy text-sm placeholder:text-ink-navy/30 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label htmlFor="raw-text" className="block text-ink-navy font-semibold text-sm mb-1.5">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={9}
                className="w-full px-4 py-3 rounded-xl border border-ink-navy/15 bg-white text-ink-navy text-sm placeholder:text-ink-navy/30 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent transition-shadow resize-y min-h-[160px]"
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className={`text-xs ${rawText.length < 20 ? "text-ink-navy/40" : "text-emerald-600 font-medium"}`}>
                  {rawText.length < 20
                    ? `${20 - rawText.length} more characters required`
                    : "✓ Length requirement met"}
                </p>
                <p className="text-xs text-ink-navy/40">{rawText.length.toLocaleString()} chars</p>
              </div>
            </div>

            {/* Cover Letter Textarea (optional) */}
            <div>
              <label htmlFor="cover-letter-text" className="block text-ink-navy font-semibold text-sm mb-1.5">
                Cover Letter for this Job <span className="text-ink-navy/40 font-normal">(optional)</span>
              </label>
              <textarea
                id="cover-letter-text"
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="Paste an optional cover letter — helps us find more relevant experience to highlight..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-ink-navy/15 bg-white text-ink-navy text-sm placeholder:text-ink-navy/30 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent transition-shadow resize-y min-h-[110px]"
              />
              <p className="text-xs text-ink-navy/40 mt-1.5">
                Optional — helps us find more relevant experience to highlight in your tailored resume.
              </p>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber to-orange-400 text-ink-navy font-bold text-base shadow-lg shadow-amber/20 hover:shadow-amber/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-ink-navy border-t-transparent rounded-full animate-spin" />
                  Submitting Job...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-ink-navy/20" />
                  Generate Tailored Resume
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── PROCESSING STATE ── */}
      {pageState === "processing" && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 flex flex-col items-center text-center">
          <div className="mb-8">
            <h2 className="font-fraunces text-3xl font-bold text-ink-navy mb-2">
              Tailoring in Progress
            </h2>
            <p className="text-ink-navy/60 text-sm">
              Analyzing keywords and rewriting resume bullet points...
            </p>
          </div>
          <div className="w-full max-w-md">
            <TailorProgress state={queueState} />
          </div>
        </div>
      )}

      {/* ── COMPLETED STATE ── */}
      {pageState === "completed" && (
        <div className="w-full flex flex-col items-center">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="font-fraunces text-3xl font-bold text-ink-navy mb-2">
              Your Tailored Resume is Ready!
            </h2>
            <p className="text-ink-navy/60 text-sm max-w-md mx-auto">
              Review your match breakdown and download your tailored resume below.
            </p>
          </div>

          <TailoredResult
            matchScore={matchScore}
            missingKeywords={missingKeywords}
            tailoredResume={tailoredResume}
            jobDescriptionId={jobDescId}
          />

          <div className="mt-8">
            <button
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink-navy text-parchment font-bold text-sm hover:bg-ink-navy/90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-amber" />
              Tailor for Another Job
            </button>
          </div>
        </div>
      )}

      {/* ── FAILED STATE ── */}
      {pageState === "failed" && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-ink-navy mb-2">
            Tailoring Failed
          </h2>
          <p className="text-ink-navy/60 text-sm max-w-md mx-auto mb-8">
            Something went wrong while optimizing your resume. Please try submitting again.
          </p>

          <button
            onClick={handleResetForm}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink-navy text-parchment font-bold text-sm hover:bg-ink-navy/90 transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
