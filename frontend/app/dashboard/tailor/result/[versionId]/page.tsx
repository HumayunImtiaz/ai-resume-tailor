"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import TailoredResult from "@/components/TailoredResult";

interface TailoredVersionDetail {
  id: string;
  matchScore: number;
  matchedSkills?: string[];
  missingSkills?: { skill: string; reason: string }[];
  atsAnalysis?: {
    initialMatchScore?: number;
    initialMissingSkills?: string[];
    initialMissingKeywords?: string[];
    scoreImprovement?: number;
    addedSkills?: string[];
    addedKeywords?: string[];
    improvedSections?: string[];
    strengths?: string[];
    gaps?: string[];
    recommendations?: string[];
  } | null;
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
  const params = useParams();
  const versionId = params?.versionId as string;

  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [version, setVersion] = useState<TailoredVersionDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  if (fetchState === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-fraunces text-lg font-semibold text-heading">Loading tailored version...</p>
        <p className="text-body text-xs mt-1">Fetching saved resume data.</p>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4 text-error">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-fraunces text-2xl font-bold text-heading mb-2">
            Version Not Found
          </h1>
          <p className="text-body text-sm mb-6">
            {errorMessage || "This tailored version could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const jobTitle = version?.jobDescription?.title ?? "Tailored Version";
  const jobCompany = version?.jobDescription?.company;

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-[900px] mx-auto py-2">
      {/* ── Header ── */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success-200 flex items-center justify-center mx-auto mb-4 text-success shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="font-fraunces text-3xl font-bold text-heading mb-1 leading-tight">
          {jobTitle}
        </h1>
        {jobCompany && (
          <p className="text-body font-medium text-lg mb-1">
            {jobCompany}
          </p>
        )}
        {version?.createdAt && (
          <p className="text-body text-xs">
            Tailored on{" "}
            {new Date(version.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* ── Tailored Result ── */}
      <TailoredResult
        matchScore={version?.matchScore ?? null}
        matchedSkills={version?.matchedSkills ?? []}
        missingSkills={version?.missingSkills ?? []}
        atsAnalysis={version?.atsAnalysis ?? null}
        tailoredResume={version?.tailoredResume ?? null}
        jobDescriptionId={version?.jobDescription?.id ?? null}
      />
    </div>
  );
}
