"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Hexagon, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import TailoredResult from "@/components/TailoredResult";

interface TailoredVersionDetail {
  id: string;
  matchScore: number;
  missingKeywords: string[];
  tailoredResume: any;
  createdAt: string;
  jobDescription: {
    id: string;
    title: string;
    company: string | null;
    rawText: string;
  };
}

type FetchState = "loading" | "success" | "error";

export default function TailoredVersionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const versionId = params?.versionId as string;

  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [version, setVersion] = useState<TailoredVersionDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Auth + data fetch on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!versionId) {
      setErrorMessage("Invalid version ID.");
      setFetchState("error");
      return;
    }

    let cancelled = false;

    async function fetchVersion() {
      setFetchState("loading");
      try {
        const res = await apiFetch(`/api/jobs/versions/${versionId}`);
        const json = await res.json();
        if (!cancelled) {
          setVersion(json.data ?? json);
          setFetchState("success");
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMessage(
            err.message?.includes("404") || err.message?.toLowerCase().includes("not found")
              ? "This tailored version could not be found."
              : err.message || "Failed to load this tailored version. Please try again."
          );
          setFetchState("error");
        }
      }
    }

    fetchVersion();
    return () => { cancelled = true; };
  }, [versionId, router]);

  // ── Loading ──
  if (fetchState === "loading") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-ink-navy font-sans antialiased flex flex-col relative overflow-hidden selection:bg-amber/20">
        {/* Background gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber/20 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-sky-300/20 via-indigo-300/10 to-transparent blur-[120px] pointer-events-none" />

        {/* Header */}
        <PageHeader />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-amber/10" />
              <div className="absolute inset-0 rounded-full border-4 border-amber border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />
            </div>
            <div className="text-center">
              <p className="font-fraunces text-xl font-semibold text-ink-navy">Loading tailored version…</p>
              <p className="text-ink-navy/40 text-sm mt-1">Fetching your saved resume data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (fetchState === "error") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-ink-navy font-sans antialiased flex flex-col relative overflow-hidden selection:bg-amber/20">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber/20 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-sky-300/20 via-indigo-300/10 to-transparent blur-[120px] pointer-events-none" />

        <PageHeader />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-8">
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 md:p-14 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-ink-navy mb-3">
              Version Not Found
            </h1>
            <p className="text-ink-navy/55 text-sm mb-8 leading-relaxed">
              {errorMessage || "This tailored version could not be found."}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber to-orange-400 rounded-xl text-white text-sm font-bold shadow-[0_4px_15px_rgba(232,163,61,0.3)] hover:shadow-[0_6px_20px_rgba(232,163,61,0.4)] transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──
  const jobTitle = version?.jobDescription?.title ?? "Tailored Version";
  const jobCompany = version?.jobDescription?.company;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-ink-navy font-sans antialiased flex flex-col relative overflow-hidden selection:bg-amber/20">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber/20 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-sky-300/20 via-indigo-300/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tr from-orange-200/20 to-transparent blur-[80px] pointer-events-none" />

      <PageHeader />

      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-5 md:px-8 pb-16">
        {/* ── Result Header ── */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200/50 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-bold text-ink-navy mb-2 leading-tight">
            {jobTitle}
            {jobCompany && (
              <span className="block text-ink-navy/40 font-medium text-xl mt-1">
                {jobCompany}
              </span>
            )}
          </h1>
          <p className="text-ink-navy/50 text-sm max-w-md mx-auto">
            Saved tailored resume — match score and full optimized draft below.
          </p>
          {version?.createdAt && (
            <p className="text-ink-navy/30 text-xs mt-1.5">
              Tailored on{" "}
              {new Date(version.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        {/* ── Shared Result Component ── */}
        <div className="flex flex-col items-center">
          <TailoredResult
            matchScore={version?.matchScore ?? null}
            missingKeywords={version?.missingKeywords ?? []}
            tailoredResume={version?.tailoredResume ?? null}
            jobDescriptionId={version?.jobDescription?.id ?? null}
          />

          {/* ── Back to Dashboard ── */}
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-ink-navy/15 text-ink-navy font-semibold text-sm hover:bg-ink-navy hover:text-white hover:border-ink-navy transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Shared top navigation bar — matches the dashboard's visual style. */
function PageHeader() {
  return (
    <header className="relative z-10 flex justify-between items-center bg-white/60 backdrop-blur-xl border border-white shadow-[0_4px_40px_rgb(0,0,0,0.02)] rounded-[24px] p-4 md:px-6 m-5 mb-8 transition-all">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-[14px] bg-gradient-to-br from-amber to-orange-400 p-0.5 shadow-lg shadow-amber/20">
          <div className="relative flex items-center justify-center w-full h-full bg-white rounded-[12px]">
            <Hexagon className="w-6 h-6 text-amber fill-amber/10" />
          </div>
        </div>
        <div>
          <span className="font-fraunces text-xl font-bold tracking-tight text-ink-navy leading-tight inline-flex items-center gap-1.5">
            AI Tailor <Sparkles className="w-4 h-4 text-amber" />
          </span>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink-navy/60 hover:text-ink-navy transition-all rounded-[14px] bg-white hover:bg-gray-50 border border-gray-100 shadow-sm hover:shadow"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>
    </header>
  );
}
