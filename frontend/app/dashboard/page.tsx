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

type PageState = "form" | "analyzing" | "analysisReview" | "processing" | "completed" | "failed";

export default function DashboardPage() {
  const router = useRouter();
  const { activeResume, isLoading, refreshDashboard } = useDashboard();

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
  const [jobDescId, setJobDescId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Completed results
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<any[]>([]);
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [tailoredResume, setTailoredResume] = useState<any>(null);

  // Initial Analysis
  const [initialAnalysis, setInitialAnalysis] = useState<any>(null);

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
            if (Array.isArray(json.data?.matchedSkills)) {
              setMatchedSkills(json.data.matchedSkills);
            }
            if (Array.isArray(json.data?.missingSkills)) {
              setMissingSkills(json.data.missingSkills);
            }
            if (json.data?.atsAnalysis) {
              setAtsAnalysis(json.data.atsAnalysis);
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

  const handleAnalyze = async (e: React.FormEvent) => {
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
    setPageState("analyzing");

    try {
      const res = await apiFetch("/api/jobs/analyze", {
        method: "POST",
        body: JSON.stringify({
          resumeId: activeResume.id,
          title: title.trim(),
          company: company.trim() || undefined,
          rawText,
        }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || "Failed to analyze job match.");
      }

      setInitialAnalysis(json.data);
      setPageState("analysisReview");
    } catch (err: any) {
      setFormError(err.message || "Failed to analyze job. Please try again.");
      setPageState("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTailoring = async () => {
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await apiFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          resumeId: activeResume?.id,
          title: title.trim(),
          company: company.trim() || undefined,
          rawText,
        }),
      });
      const json = await res.json();
      const jobId = json.data?.queueJobId;
      const descId = json.data?.jobDescription?.id;

      if (!jobId) {
        setFormError("Unexpected response — no job ID returned.");
        setIsSubmitting(false);
        setPageState("analysisReview");
        return;
      }

      setQueueJobId(jobId);
      if (descId) setJobDescId(descId);
      setPageState("processing");
      startPolling(jobId);
    } catch (err: any) {
      setFormError(err.message || "Failed to create job. Please try again.");
      setPageState("analysisReview");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setCompany("");
    setRawText("");
    setFormError("");
    setQueueJobId(null);
    setJobDescId(null);
    setQueueState("waiting");
    setInitialAnalysis(null);
    setMatchScore(null);
    setMatchedSkills([]);
    setMissingSkills([]);
    setAtsAnalysis(null);
    setTailoredResume(null);
    setPageState("form");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-body text-sm font-medium">Loading dashboard...</p>
      </div>
    );
  }

  // ── No Resume Uploaded View ──
  if (!activeResume) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 text-primary">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-heading mb-2">
            Upload Your Resume
          </h2>
          <p className="text-body text-sm max-w-md mx-auto mb-8">
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
              <h1 className="font-fraunces text-3xl font-bold text-heading">
                Tailor Resume to Job
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heading/5 text-body text-xs font-semibold">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Active: <span className="text-heading font-bold truncate max-w-[180px]">{activeResume.originalFilename}</span>
              </div>
            </div>
            <p className="text-body text-sm mb-6">
              Paste the target job description below and we&apos;ll craft an optimized version tailored specifically for this role.
            </p>

            {/* Trust & Verification Note */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 items-start md:col-span-2">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-heading/80 leading-relaxed">
                <span className="text-primary font-bold">Verified Skills Only:</span> The AI exclusively uses skills present in your uploaded Base Resume and Cover Letter. No fake skills will be added.
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="job-title" className="block text-heading font-semibold text-sm mb-1.5">
                Job Title <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                <input
                  id="job-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-heading/15 bg-white text-heading text-sm placeholder:text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-heading font-semibold text-sm mb-1.5">
                Company Name <span className="text-body font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-heading/15 bg-white text-heading text-sm placeholder:text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label htmlFor="raw-text" className="block text-heading font-semibold text-sm mb-1.5">
                Job Description <span className="text-error">*</span>
              </label>
              <textarea
                id="raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={9}
                className="w-full px-4 py-3 rounded-xl border border-heading/15 bg-white text-heading text-sm placeholder:text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-y min-h-[160px]"
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className={`text-xs ${rawText.length < 20 ? "text-body" : "text-success font-medium"}`}>
                  {rawText.length < 20
                    ? `${20 - rawText.length} more characters required`
                    : "✓ Length requirement met"}
                </p>
                <p className="text-xs text-body">{rawText.length.toLocaleString()} chars</p>
              </div>
            </div>


            {/* Form Error */}
            {formError && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-error" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-primary text-card hover:bg-primary-hover transition-colors font-bold text-base flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-heading border-t-transparent rounded-full animate-spin" />
                  Submitting Job...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-heading/20" />
                  Analyze Match
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── ANALYZING STATE ── */}
      {pageState === "analyzing" && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="font-fraunces text-3xl font-bold text-heading mb-2">
            Analyzing Match...
          </h2>
          <p className="text-body text-sm max-w-md mx-auto">
            Reviewing your base resume against the job requirements to find skill gaps.
          </p>
        </div>
      )}

      {/* ── ANALYSIS REVIEW STATE (BEFORE) ── */}
      {pageState === "analysisReview" && initialAnalysis && (
        <div className="w-full space-y-6">
          <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 flex flex-col items-center text-center">
            <h2 className="font-fraunces text-3xl font-bold text-heading mb-2">
              Initial Match Analysis
            </h2>
            <p className="text-body text-sm max-w-md mx-auto mb-8">
              Here is how your current resume stacks up against the job description before tailoring.
            </p>

            <div className="flex flex-col items-center p-6 rounded-2xl bg-navy-50 border border-navy-100 mb-8 w-full max-w-[240px]">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-2">Original Resume ATS Score</span>
              <span className="text-5xl font-bold text-navy-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                {initialAnalysis.initialMatchScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left max-w-2xl mx-auto">
              {/* Missing Skills */}
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Noticed Gaps
                </h4>
                <ul className="space-y-2">
                  {initialAnalysis.missingSkills?.slice(0, 5).map((skill: string, i: number) => (
                    <li key={i} className="text-sm text-heading/80 flex items-start gap-2">
                      <span className="text-primary mt-1 shrink-0">•</span> {skill}
                    </li>
                  ))}
                  {initialAnalysis.missingSkills?.length === 0 && (
                    <li className="text-sm text-heading/60 italic">No major missing technical skills found.</li>
                  )}
                </ul>
              </div>

              {/* Strengths */}
              <div className="p-5 rounded-2xl bg-success/10 border border-success/20">
                <h4 className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Current Strengths
                </h4>
                <ul className="space-y-2">
                  {initialAnalysis.strengths?.slice(0, 5).map((strength: string, i: number) => (
                    <li key={i} className="text-sm text-heading/80 flex items-start gap-2">
                      <span className="text-success mt-1 shrink-0">•</span> {strength}
                    </li>
                  ))}
                  {initialAnalysis.strengths?.length === 0 && (
                    <li className="text-sm text-heading/60 italic">Could not identify distinct strengths.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="w-full max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setPageState("form")}
                className="flex-1 py-4 rounded-xl border border-heading/15 bg-white text-heading hover:bg-heading/5 transition-colors font-bold text-base"
              >
                Back to Edit
              </button>
              <button
                onClick={handleStartTailoring}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl bg-primary text-card hover:bg-primary-hover transition-colors font-bold text-base flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-heading border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-heading/20" />
                    Optimize Resume Now
                  </>
                )}
              </button>
            </div>
            {formError && (
              <p className="text-error text-sm font-semibold mt-4">{formError}</p>
            )}
          </div>
        </div>
      )}

      {/* ── PROCESSING STATE ── */}
      {pageState === "processing" && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 flex flex-col items-center text-center">
          <div className="mb-8">
            <h2 className="font-fraunces text-3xl font-bold text-heading mb-2">
              Tailoring in Progress
            </h2>
            <p className="text-body text-sm">
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
            <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success-200 flex items-center justify-center mx-auto mb-4 text-success shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="font-fraunces text-3xl font-bold text-heading mb-2">
              Your Tailored Resume is Ready!
            </h2>
            <p className="text-body text-sm max-w-md mx-auto">
              Review your match breakdown and download your tailored resume below.
            </p>
          </div>

          <TailoredResult
            matchScore={matchScore}
            matchedSkills={matchedSkills}
            missingSkills={missingSkills}
            atsAnalysis={atsAnalysis}
            tailoredResume={tailoredResume}
            jobDescriptionId={jobDescId}
          />

          <div className="mt-8">
            <button
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-heading text-card font-bold text-sm hover:bg-heading/90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-primary" />
              Tailor for Another Job
            </button>
          </div>
        </div>
      )}

      {/* ── FAILED STATE ── */}
      {pageState === "failed" && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4 text-error">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-heading mb-2">
            Tailoring Failed
          </h2>
          <p className="text-body text-sm max-w-md mx-auto mb-8">
            Something went wrong while optimizing your resume. Please try submitting again.
          </p>

          <button
            onClick={handleResetForm}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-heading text-card font-bold text-sm hover:bg-heading/90 transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
