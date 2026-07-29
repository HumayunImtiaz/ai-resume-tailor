"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TailoredResultProps {
  /** Match score 0–100 */
  matchScore: number | null;
  /** Array of keywords missing from the resume */
  missingKeywords: string[];
  /** The structured/parsed tailored resume object */
  tailoredResume: any;
  /** Job description ID — used for the .docx download endpoint */
  jobDescriptionId: string | null;
}

/** Renders a single section heading in the draft panel */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-navy/40 mt-5 mb-2 first:mt-0 border-b border-ink-navy/5 pb-1">
      {children}
    </h4>
  );
}

/**
 * Shared result component used by both the live tailoring flow and
 * the saved tailored-version detail page.
 */
export default function TailoredResult({
  matchScore,
  missingKeywords,
  tailoredResume,
  jobDescriptionId,
}: TailoredResultProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Build a plain-text representation from the structured resume
  const plainText = tailoredResume ? buildPlainText(tailoredResume) : "";

  const handleCopy = async () => {
    try {
      if (!plainText) return;
      await navigator.clipboard.writeText(plainText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownloadTxt = () => {
    if (!plainText) return;
    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Tailored_Draft.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    if (!jobDescriptionId) return;
    setIsDownloadingDocx(true);
    setDownloadError("");

    try {
      const response = await apiFetch(`/api/jobs/${jobDescriptionId}/download`);
      if (!response.ok) {
        let errorMsg = "Failed to download";
        try {
          const errData = await response.json();
          if (errData.message) errorMsg = errData.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Tailored_Draft.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download");
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      {/* ── Fit Score Card ── */}
      <div className="p-6 rounded-2xl bg-white border border-ink-navy/5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-fraunces text-lg font-semibold text-ink-navy">Fit Score</h3>
          {matchScore !== null && (
            <span className="text-2xl font-bold text-ink-navy" style={{ fontVariantNumeric: "tabular-nums" }}>
              {matchScore}%
            </span>
          )}
        </div>
        <div className="w-full h-3 rounded-full bg-ink-navy/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: matchScore !== null ? `${matchScore}%` : "0%",
              backgroundColor: "#E8A33D",
            }}
          />
        </div>
        <p className="text-ink-navy/50 text-xs mt-2">
          {matchScore === null
            ? "Score unavailable"
            : matchScore >= 80
            ? "✦ Strong match"
            : matchScore >= 50
            ? "◎ Good match, some gaps"
            : "△ Needs significant tailoring"}
        </p>
      </div>

      {/* ── Missing Keywords ── */}
      <div className="p-6 rounded-2xl bg-white border border-ink-navy/5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <h3 className="font-fraunces text-lg font-semibold text-ink-navy mb-3">Missing Keywords</h3>
        {missingKeywords.length === 0 ? (
          <p className="text-emerald-600 text-sm font-medium">✓ No major gaps found!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((kw) => (
              <span
                key={kw}
                className="px-3 py-1 rounded-full bg-amber/10 text-ink-navy text-xs font-medium border border-amber/20"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tailored Draft ── */}
      <div className="p-6 rounded-2xl bg-white border border-ink-navy/5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-fraunces text-lg font-semibold text-ink-navy">Tailored Draft</h3>
          {plainText && (
            <div className="flex gap-2 relative">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-ink-navy/5 text-ink-navy/60 hover:text-ink-navy transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? <span className="text-emerald-600">Copied!</span> : "Copy"}
              </button>
              <button
                onClick={handleDownloadTxt}
                className="p-1.5 rounded-md hover:bg-ink-navy/5 text-ink-navy/60 hover:text-ink-navy transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Download as .txt"
              >
                <Download className="w-3.5 h-3.5" />
                .txt
              </button>
              {jobDescriptionId && (
                <button
                  onClick={handleDownloadDocx}
                  disabled={isDownloadingDocx}
                  className="p-1.5 rounded-md hover:bg-ink-navy/5 text-ink-navy/60 hover:text-ink-navy transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download as .docx"
                >
                  {isDownloadingDocx ? (
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  .docx
                </button>
              )}
              {downloadError && (
                <span className="absolute -bottom-8 right-0 text-red-500 text-[10px] whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-red-100 z-10">
                  {downloadError}
                </span>
              )}
            </div>
          )}
        </div>
        {tailoredResume ? (
          <div className="mt-3 p-4 rounded-xl bg-ink-navy/[0.02] border border-ink-navy/10 max-h-[400px] overflow-y-auto text-sm text-ink-navy/80 leading-relaxed">
            {renderStructuredResume(tailoredResume)}
          </div>
        ) : (
          <div className="mt-3 p-4 rounded-xl bg-ink-navy/[0.02] border border-dashed border-ink-navy/10 min-h-[80px] flex items-center justify-center">
            <p className="text-ink-navy/30 text-sm text-center">Your optimized resume text will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

/** Pretty-render the structured resume object as React elements */
function renderStructuredResume(r: any): React.ReactNode {
  if (!r || typeof r !== "object") {
    return <p className="whitespace-pre-wrap">{String(r ?? "")}</p>;
  }

  const sections: React.ReactNode[] = [];

  // Header
  if (r.fullName) {
    sections.push(
      <div key="header" className="mb-1">
        <p className="text-ink-navy font-bold text-base">{r.fullName}</p>
        {r.title && <p className="text-ink-navy/60 text-xs font-medium">{r.title}</p>}
      </div>
    );
  }

  // Summary
  if (r.summary) {
    sections.push(
      <div key="summary">
        <SectionHeading>Summary</SectionHeading>
        <p className="text-sm text-ink-navy/70">{r.summary}</p>
      </div>
    );
  }

  // Skills
  if (r.skills && Array.isArray(r.skills) && r.skills.length > 0) {
    sections.push(
      <div key="skills">
        <SectionHeading>Skills</SectionHeading>
        <div className="flex flex-wrap gap-1.5">
          {r.skills.map((s: string, i: number) => (
            <span key={i} className="px-2 py-0.5 text-xs bg-ink-navy/5 rounded text-ink-navy/70 border border-ink-navy/5">
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Experience
  if (r.experience && Array.isArray(r.experience) && r.experience.length > 0) {
    sections.push(
      <div key="experience">
        <SectionHeading>Experience</SectionHeading>
        <div className="space-y-3">
          {r.experience.map((exp: any, i: number) => (
            <div key={i}>
              <p className="text-ink-navy font-semibold text-sm">
                {exp.jobTitle || exp.title}
                {exp.company && <span className="text-ink-navy/50 font-normal"> · {exp.company}</span>}
              </p>
              {exp.dates && <p className="text-[11px] text-ink-navy/40">{exp.dates}</p>}
              {exp.bullets && Array.isArray(exp.bullets) && (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {exp.bullets.map((b: string, j: number) => (
                    <li key={j} className="text-xs text-ink-navy/70">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Education
  if (r.education && Array.isArray(r.education) && r.education.length > 0) {
    sections.push(
      <div key="education">
        <SectionHeading>Education</SectionHeading>
        <div className="space-y-2">
          {r.education.map((edu: any, i: number) => (
            <div key={i}>
              <p className="text-ink-navy font-semibold text-sm">
                {edu.degree || edu.title}
                {edu.institution && <span className="text-ink-navy/50 font-normal"> · {edu.institution}</span>}
              </p>
              {edu.dates && <p className="text-[11px] text-ink-navy/40">{edu.dates}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Projects
  if (r.projects && Array.isArray(r.projects) && r.projects.length > 0) {
    sections.push(
      <div key="projects">
        <SectionHeading>Projects</SectionHeading>
        <div className="space-y-3">
          {r.projects.map((proj: any, i: number) => (
            <div key={i}>
              <p className="text-ink-navy font-semibold text-sm">{proj.name || proj.title}</p>
              {proj.description && <p className="text-xs text-ink-navy/60 mt-0.5">{proj.description}</p>}
              {proj.bullets && Array.isArray(proj.bullets) && (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {proj.bullets.map((b: string, j: number) => (
                    <li key={j} className="text-xs text-ink-navy/70">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Certifications
  if (r.certifications && Array.isArray(r.certifications) && r.certifications.length > 0) {
    sections.push(
      <div key="certs">
        <SectionHeading>Certifications</SectionHeading>
        <ul className="list-disc list-inside space-y-0.5">
          {r.certifications.map((c: string, i: number) => (
            <li key={i} className="text-xs text-ink-navy/70">{c}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (sections.length === 0) {
    return <p className="whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</p>;
  }

  return <div className="space-y-1">{sections}</div>;
}

/** Build a plain-text representation from the structured resume for copy/download */
function buildPlainText(r: any): string {
  if (!r || typeof r !== "object") return String(r ?? "");

  const lines: string[] = [];

  if (r.fullName) lines.push(r.fullName);
  if (r.title) lines.push(r.title);
  if (r.fullName || r.title) lines.push("");

  if (r.summary) {
    lines.push("SUMMARY", r.summary, "");
  }

  if (r.skills?.length) {
    lines.push("SKILLS", r.skills.join(", "), "");
  }

  if (r.experience?.length) {
    lines.push("EXPERIENCE");
    for (const exp of r.experience) {
      const header = [exp.jobTitle || exp.title, exp.company].filter(Boolean).join(" · ");
      if (header) lines.push(header);
      if (exp.dates) lines.push(exp.dates);
      if (exp.bullets?.length) {
        for (const b of exp.bullets) lines.push(`• ${b}`);
      }
      lines.push("");
    }
  }

  if (r.education?.length) {
    lines.push("EDUCATION");
    for (const edu of r.education) {
      const header = [edu.degree || edu.title, edu.institution].filter(Boolean).join(" · ");
      if (header) lines.push(header);
      if (edu.dates) lines.push(edu.dates);
      lines.push("");
    }
  }

  if (r.projects?.length) {
    lines.push("PROJECTS");
    for (const proj of r.projects) {
      if (proj.name || proj.title) lines.push(proj.name || proj.title);
      if (proj.description) lines.push(proj.description);
      if (proj.bullets?.length) {
        for (const b of proj.bullets) lines.push(`• ${b}`);
      }
      lines.push("");
    }
  }

  if (r.certifications?.length) {
    lines.push("CERTIFICATIONS");
    for (const c of r.certifications) lines.push(`• ${c}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}
