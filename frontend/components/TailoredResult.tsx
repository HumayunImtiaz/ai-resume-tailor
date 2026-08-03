"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check, Download, FileText, AlertTriangle, Lightbulb, Target, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface TailoredResultProps {
  /** Match score 0–100 */
  matchScore: number | null;
  /** Skills from the JD found in the resume/cover letter */
  matchedSkills?: string[];
  /** Skills missing, each with a reason */
  missingSkills?: { skill: string; reason: string }[];
  /** ATS analysis with strengths, gaps, recommendations */
  atsAnalysis?: {
    strengths?: string[];
    gaps?: string[];
    recommendations?: string[];
  } | null;
  /** The structuerror/parsed tailored resume object */
  tailoredResume: any;
  /** Job description ID — used for the .docx download endpoint */
  jobDescriptionId: string | null;
}

/** Renders a section heading in the resume paper preview */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-widest text-body border-b border-heading/15 pb-1.5 mb-3 mt-6 first:mt-0">
      {children}
    </h4>
  );
}

/**
 * Shaerror result component used by both the live tailoring flow and
 * the saved tailored-version detail page.
 */
export default function TailoredResult({
  matchScore,
  matchedSkills = [],
  missingSkills = [],
  atsAnalysis,
  tailoredResume,
  jobDescriptionId,
}: TailoredResultProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Build a plain-text representation from the structuerror resume
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
    a.download = "Tailored_Resume.txt";
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
      a.download = "Tailored_Resume.docx";
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

  const handleDownloadPdf = async () => {
    if (!jobDescriptionId) return;
    setIsDownloadingPdf(true);
    setDownloadError("");

    try {
      const response = await apiFetch(`/api/jobs/${jobDescriptionId}/download-pdf`);
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
      a.download = "Tailored_Resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-[900px] space-y-8 md:space-y-10 mx-auto">
      {/* ── Fit Score Card ── */}
      <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-fraunces text-xl font-bold text-heading">Fit Score Analysis</h3>
            <p className="text-body text-xs mt-0.5">
              Resume keyword & requirement coverage for target position
            </p>
          </div>
          {matchScore !== null && (
            <span
              className="text-3xl font-bold text-heading tracking-tight"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {matchScore}%
            </span>
          )}
        </div>
        <div className="w-full h-3.5 rounded-full bg-heading/5 overflow-hidden p-0.5 border border-heading/5">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: matchScore !== null ? `${matchScore}%` : "0%",
              backgroundColor: matchScore && matchScore >= 75 ? "#10B981" : matchScore && matchScore >= 50 ? "#E8A33D" : "#EF4444",
            }}
          />
        </div>
        <p className="text-body text-xs mt-3 font-semibold">
          {matchScore === null
            ? "Score unavailable"
            : matchScore >= 80
            ? "✦ Strong match — resume is highly aligned with job requirements."
            : matchScore >= 50
            ? "◎ Good match — essential keywords incorporated with minor gaps."
            : "△ Needs significant tailoring — key missing qualifications noted below."}
        </p>
      </div>

      {/* ── Matched Skills Card ── */}
      {matchedSkills.length > 0 && (
        <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <h3 className="font-fraunces text-xl font-bold text-heading mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            Matched Skills
          </h3>
          <p className="text-body text-xs mb-4">
            Skills from the job description found in your resume or cover letter
          </p>
          <div className="flex flex-wrap gap-2.5">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="px-3.5 py-1.5 rounded-xl bg-success-50 text-success-700 text-xs font-semibold border border-success-200 shadow-sm"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Missing Skills Card ── */}
      <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <h3 className="font-fraunces text-xl font-bold text-heading mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          Missing Skills &amp; Keywords
        </h3>
        <p className="text-body text-xs mb-4">
          Important terms from the job description not present in your professional profile
        </p>
        {missingSkills.length === 0 ? (
          <p className="text-success text-sm font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-success" />
            No major gap keywords found — excellent coverage!
          </p>
        ) : (
          <div className="space-y-2.5">
            {missingSkills.map((item, idx) => (
              <div
                key={typeof item === 'string' ? item : item.skill || idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/15"
              >
                <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-heading text-xs font-bold border border-primary/25 shrink-0 mt-0.5">
                  {typeof item === 'string' ? item : item.skill}
                </span>
                {typeof item !== 'string' && item.reason && (
                  <span className="text-xs text-body leading-relaxed">
                    {item.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ATS Analysis Card ── */}
      {atsAnalysis && (atsAnalysis.strengths?.length || atsAnalysis.gaps?.length || atsAnalysis.recommendations?.length) ? (
        <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <h3 className="font-fraunces text-xl font-bold text-heading mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            ATS Analysis
          </h3>
          <p className="text-body text-xs mb-5">
            Detailed analysis of your resume against ATS requirements
          </p>

          <div className="space-y-5">
            {/* Strengths */}
            {atsAnalysis.strengths && atsAnalysis.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-success mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Strengths
                </h4>
                <ul className="space-y-1.5">
                  {atsAnalysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-body flex items-start gap-2">
                      <span className="text-success mt-0.5 shrink-0">●</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {atsAnalysis.gaps && atsAnalysis.gaps.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Gaps
                </h4>
                <ul className="space-y-1.5">
                  {atsAnalysis.gaps.map((g: string, i: number) => (
                    <li key={i} className="text-sm text-body flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">●</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {atsAnalysis.recommendations && atsAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-500 mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Recommendations
                </h4>
                <ul className="space-y-1.5">
                  {atsAnalysis.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-body flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5 shrink-0">●</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Tailored Resume Preview Section ── */}
      <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-heading/10">
          <div>
            <h3 className="font-fraunces text-xl font-bold text-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Tailored Resume Draft
            </h3>
            <p className="text-body text-xs mt-0.5">
              ATS-optimized physical page preview
            </p>
          </div>

          {plainText && (
            <div className="flex items-center gap-2 self-start sm:self-auto relative">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl border border-heading/15 bg-white text-heading hover:bg-heading hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? <span className="text-success">Copied!</span> : "Copy"}
              </button>
              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 rounded-xl border border-heading/15 bg-white text-heading hover:bg-heading hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                title="Download as .txt"
              >
                <Download className="w-3.5 h-3.5" />
                .txt
              </button>
              {jobDescriptionId && (
                <>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="px-4 py-2 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors font-bold text-base flex items-center justify-center gap-2"
                    title="Download as formatted .pdf"
                  >
                    {isDownloadingPdf ? (
                      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Export PDF
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    disabled={isDownloadingDocx}
                    className="px-4 py-2 rounded-xl bg-primary text-card hover:bg-primary-hover transition-colors font-bold text-base flex items-center justify-center gap-2"
                    title="Download as formatted .docx"
                  >
                    {isDownloadingDocx ? (
                      <div className="w-3.5 h-3.5 border-2 border-heading border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Export DOCX
                  </button>
                </>
              )}
              {downloadError && (
                <span className="absolute -bottom-8 right-0 text-error text-[10px] whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-error/20 z-10">
                  {downloadError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Document "Paper" Sheet Card ── */}
        {tailoredResume ? (
          <div className="bg-white border border-heading/15 rounded-[6px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-8 sm:p-12 md:p-14 max-w-[680px] mx-auto text-heading font-sans leading-relaxed">
            <div className="max-h-[650px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-heading/20">
              {renderStructuerrorResume(tailoredResume)}
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-heading/[0.02] border border-dashed border-heading/15 min-h-[140px] flex items-center justify-center">
            <p className="text-body text-sm text-center">Your optimized resume draft will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

/** Pretty-render structuerror resume object into a professional paper document layout */
function renderStructuerrorResume(r: any): React.ReactNode {
  if (!r || typeof r !== "object") {
    return <p className="whitespace-pre-wrap font-sans text-sm">{String(r ?? "")}</p>;
  }

  const sections: React.ReactNode[] = [];

  // Header & Contact Info
  const fullName = r.fullName || r.name;
  const title = r.title || r.professionalTitle;
  const contact = r.contactLine;

  if (fullName || title || contact) {
    const contactItems: string[] = [];
    if (contact?.email) contactItems.push(contact.email);
    if (contact?.phone) contactItems.push(contact.phone);
    if (contact?.location) contactItems.push(contact.location);
    if (Array.isArray(contact?.links)) {
      for (const link of contact.links) {
        if (link.label) contactItems.push(link.url ? `${link.label}: ${link.url}` : link.label);
      }
    }

    sections.push(
      <div key="header" className="text-center sm:text-left mb-6">
        {fullName && (
          <h1 className="font-fraunces text-2xl sm:text-[26px] font-bold text-heading tracking-tight leading-tight mb-1">
            {fullName}
          </h1>
        )}
        {title && (
          <p className="text-sm font-semibold text-body mb-2">
            {title}
          </p>
        )}
        {contactItems.length > 0 && (
          <p className="text-xs text-body flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 mt-1.5 font-medium">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-body">•</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </p>
        )}
        {/* Thin horizontal divider matching docx layout */}
        <div className="border-b border-heading/15 mt-4" />
      </div>
    );
  }

  // Summary
  if (r.summary) {
    sections.push(
      <div key="summary">
        <SectionHeading>Professional Summary</SectionHeading>
        <p className="text-xs sm:text-sm text-body leading-relaxed">{r.summary}</p>
      </div>
    );
  }

  // Skills
  if (r.skillCategories && Array.isArray(r.skillCategories) && r.skillCategories.length > 0) {
    sections.push(
      <div key="skills">
        <SectionHeading>Skills & Core Competencies</SectionHeading>
        <div className="space-y-4">
          {r.skillCategories.map((cat: any, i: number) => (
            <div key={i}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-body/70 mb-1.5">
                {cat.category}
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.skills?.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-semibold bg-heading/5 text-body rounded-md border border-heading/10"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Experience
  if (r.experience && Array.isArray(r.experience) && r.experience.length > 0) {
    sections.push(
      <div key="experience">
        <SectionHeading>Professional Experience</SectionHeading>
        <div className="space-y-5">
          {r.experience.map((exp: any, i: number) => (
            <div key={i}>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                <div>
                  <span className="font-bold text-sm text-heading">
                    {exp.role || exp.jobTitle || exp.title}
                  </span>
                  {exp.company && (
                    <span className="text-body font-medium text-xs sm:text-sm">
                      {" "}— {exp.company}
                    </span>
                  )}
                </div>
                {exp.dates && (
                  <span className="text-xs font-semibold text-body whitespace-nowrap">
                    {exp.dates}
                  </span>
                )}
              </div>
              {exp.location && (
                <p className="text-[11px] text-body font-medium mb-1">{exp.location}</p>
              )}
              {exp.bullets && Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  {exp.bullets.map((b: string, j: number) => (
                    <li key={j} className="text-xs sm:text-sm text-body leading-relaxed">
                      {b}
                    </li>
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
        <div className="space-y-3">
          {r.education.map((edu: any, i: number) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <span className="font-bold text-sm text-heading">
                  {edu.degree || edu.title}
                </span>
                {edu.school && (
                  <span className="text-body font-medium text-xs sm:text-sm">
                    {" "}— {edu.school}
                  </span>
                )}
              </div>
              {edu.dates && (
                <span className="text-xs font-semibold text-body whitespace-nowrap">
                  {edu.dates}
                </span>
              )}
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
        <div className="space-y-4">
          {r.projects.map((proj: any, i: number) => (
            <div key={i}>
              <p className="font-bold text-sm text-heading">{proj.name || proj.title}</p>
              {proj.description && (
                <p className="text-xs text-body mt-0.5">{proj.description}</p>
              )}
              {proj.bullets && Array.isArray(proj.bullets) && proj.bullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5 mt-1.5">
                  {proj.bullets.map((b: string, j: number) => (
                    <li key={j} className="text-xs sm:text-sm text-body leading-relaxed">
                      {b}
                    </li>
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
        <ul className="list-disc pl-5 space-y-1">
          {r.certifications.map((c: string, i: number) => (
            <li key={i} className="text-xs sm:text-sm text-body font-medium">
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (sections.length === 0) {
    return <p className="whitespace-pre-wrap font-sans text-sm">{JSON.stringify(r, null, 2)}</p>;
  }

  return <div className="space-y-3">{sections}</div>;
}

/** Build a plain-text representation from the structuerror resume for copy/download */
function buildPlainText(r: any): string {
  if (!r || typeof r !== "object") return String(r ?? "");

  const lines: string[] = [];

  const fullName = r.fullName || r.name;
  const title = r.title || r.professionalTitle;

  if (fullName) lines.push(fullName);
  if (title) lines.push(title);

  if (r.contactLine) {
    const contactParts: string[] = [];
    if (r.contactLine.email) contactParts.push(r.contactLine.email);
    if (r.contactLine.phone) contactParts.push(r.contactLine.phone);
    if (r.contactLine.location) contactParts.push(r.contactLine.location);
    if (contactParts.length) lines.push(contactParts.join(" | "));
  }

  if (fullName || title) lines.push("");

  if (r.summary) {
    lines.push("PROFESSIONAL SUMMARY", r.summary, "");
  }

  if (r.skillCategories?.length) {
    lines.push("SKILLS & CORE COMPETENCIES");
    for (const cat of r.skillCategories) {
      if (cat.category && cat.skills) {
        lines.push(`${cat.category}: ${cat.skills.join(', ')}`);
      }
    }
    lines.push("");
  }

  if (r.experience?.length) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const exp of r.experience) {
      const header = [exp.role || exp.jobTitle || exp.title, exp.company].filter(Boolean).join(" — ");
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
      const header = [edu.degree || edu.title, edu.school || edu.institution].filter(Boolean).join(" — ");
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
