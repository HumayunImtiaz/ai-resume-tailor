"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, FileText, CheckCircle2, AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import TailorProgress from "@/components/TailorProgress";

type PageState = "form" | "processing" | "completed" | "failed";

function TailorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId") || "";

  // Auth check
  const [isChecking, setIsChecking] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Form state
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Processing state
  const [pageState, setPageState] = useState<PageState>("form");
  const [queueJobId, setQueueJobId] = useState<string | null>(null);
  const [queueState, setQueueState] = useState("waiting");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // --- Form submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!resumeId) {
      setFormError("No resume selected. Please go back and choose a resume.");
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
          resumeId,
          title: title.trim(),
          company: company.trim() || undefined,
          rawText,
        }),
      });
      const json = await res.json();
      const jobId = json.data?.queueJobId;

      if (!jobId) {
        setFormError("Unexpected response — no job ID returned.");
        setIsSubmitting(false);
        return;
      }

      setQueueJobId(jobId);
      setPageState("processing");
      startPolling(jobId);
    } catch (err: any) {
      setFormError(err.message || "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Polling ---
  const startPolling = useCallback((jobId: string) => {
    // Clear any existing interval
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/jobs/status/${jobId}`);
        const json = await res.json();
        const state = json.data?.state;

        setQueueState(state || "waiting");

        if (state === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPageState("completed");
        } else if (state === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPageState("failed");
        }
      } catch {
        // Silently retry on network errors — the interval will try again
      }
    }, 1500);
  }, []);

  // --- Retry after failure ---
  const handleRetry = () => {
    setPageState("form");
    setQueueJobId(null);
    setQueueState("waiting");
    setFormError("");
  };

  // --- Loading guard ---
  if (isChecking) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#14213D" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // --- No resumeId guard ---
  if (!resumeId) {
    return (
      <main className="min-h-screen bg-parchment flex flex-col justify-center items-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-xl bg-ink-navy/5 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-ink-navy/30" />
          </div>
          <p className="text-ink-navy font-medium mb-2">No resume selected</p>
          <p className="text-ink-navy/50 text-sm mb-6">Go back to your dashboard and click &quot;Tailor&quot; on a resume.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 rounded-lg bg-ink-navy text-parchment font-medium text-sm hover:bg-ink-navy/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment flex flex-col p-6 sm:p-12">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-10 pb-6 border-b border-ink-navy/10">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 rounded-lg hover:bg-ink-navy/5 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-ink-navy" />
        </button>
        <div className="font-fraunces text-2xl font-bold text-ink-navy flex items-center gap-2">
          AI Resume <span className="text-amber">Tailor</span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto">
        {/* ── FORM VIEW ── */}
        {pageState === "form" && (
          <>
            <div className="mb-8">
              <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold text-ink-navy mb-2">
                Tailor Your Resume
              </h1>
              <p className="text-ink-navy/60 text-sm">
                Paste the job description below and we&apos;ll optimize your resume to match.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Job Title */}
              <div>
                <label htmlFor="job-title" className="block text-ink-navy font-medium text-sm mb-1.5">
                  Job Title <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-navy/30" />
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
                <label htmlFor="company" className="block text-ink-navy font-medium text-sm mb-1.5">
                  Company <span className="text-ink-navy/30 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-navy/30" />
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
                <label htmlFor="raw-text" className="block text-ink-navy font-medium text-sm mb-1.5">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="raw-text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl border border-ink-navy/15 bg-white text-ink-navy text-sm placeholder:text-ink-navy/30 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent transition-shadow resize-y min-h-[160px]"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className={`text-xs ${rawText.length < 20 ? "text-ink-navy/40" : "text-emerald-600"}`}>
                    {rawText.length < 20
                      ? `${20 - rawText.length} more characters needed`
                      : "✓ Minimum length met"}
                  </p>
                  <p className="text-xs text-ink-navy/40">
                    {rawText.length.toLocaleString()} chars
                  </p>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-ink-navy text-parchment font-semibold text-sm hover:bg-ink-navy/90 transition-all focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Tailoring
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ── PROCESSING VIEW ── */}
        {pageState === "processing" && (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold text-ink-navy mb-2">
                Tailoring in Progress
              </h1>
              <p className="text-ink-navy/60 text-sm">
                Sit tight — we&apos;re optimizing your resume for this role.
              </p>
            </div>

            <div className="w-full max-w-md">
              <TailorProgress state={queueState} />
            </div>
          </div>
        )}

        {/* ── COMPLETED VIEW ── */}
        {pageState === "completed" && (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold text-ink-navy mb-2">
                Your Tailored Resume is Ready
              </h1>
              <p className="text-ink-navy/60 text-sm max-w-md mx-auto">
                The analysis is complete. Detailed results are coming in the next update.
              </p>
            </div>

            {/* Placeholder result cards */}
            <div className="w-full max-w-lg space-y-4">
              {/* Fit Score */}
              <div className="p-6 rounded-2xl bg-white border border-ink-navy/5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
                <h3 className="font-fraunces text-lg font-semibold text-ink-navy mb-1">Fit Score</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-full h-3 rounded-full bg-ink-navy/5 overflow-hidden">
                    <div className="h-full w-0 rounded-full bg-gradient-to-r from-amber to-emerald-400 transition-all" />
                  </div>
                  <span className="text-ink-navy/40 text-sm font-medium">—</span>
                </div>
                <p className="text-ink-navy/40 text-xs mt-2">Coming in the next update</p>
              </div>

              {/* Missing Keywords */}
              <div className="p-6 rounded-2xl bg-white border border-ink-navy/5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
                <h3 className="font-fraunces text-lg font-semibold text-ink-navy mb-1">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full bg-ink-navy/5 text-ink-navy/30 text-xs">Pending analysis…</span>
                </div>
                <p className="text-ink-navy/40 text-xs mt-2">Coming in the next update</p>
              </div>

              {/* Tailored Draft */}
              <div className="p-6 rounded-2xl bg-white border border-ink-navy/5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
                <h3 className="font-fraunces text-lg font-semibold text-ink-navy mb-1">Tailored Draft</h3>
                <div className="mt-3 p-4 rounded-xl bg-ink-navy/[0.02] border border-dashed border-ink-navy/10 min-h-[80px] flex items-center justify-center">
                  <p className="text-ink-navy/30 text-sm text-center">Your optimized resume text will appear here</p>
                </div>
                <p className="text-ink-navy/40 text-xs mt-2">Coming in the next update</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 rounded-lg border border-ink-navy/20 text-ink-navy font-medium text-sm hover:bg-ink-navy hover:text-parchment transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── FAILED VIEW ── */}
        {pageState === "failed" && (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold text-ink-navy mb-2">
                Something Went Wrong
              </h1>
              <p className="text-ink-navy/60 text-sm max-w-md mx-auto">
                The tailoring job failed. You can try again with the same inputs.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 rounded-lg bg-ink-navy text-parchment font-medium text-sm hover:bg-ink-navy/90 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 rounded-lg border border-ink-navy/20 text-ink-navy font-medium text-sm hover:bg-ink-navy hover:text-parchment transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function TailorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-parchment flex flex-col justify-center items-center">
          <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#14213D" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      }
    >
      <TailorPageContent />
    </Suspense>
  );
}
