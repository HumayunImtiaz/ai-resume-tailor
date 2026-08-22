"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  FileText,
  AlertTriangle,
  Lightbulb,
  Target,
  ShieldCheck,
  TrendingUp,
  ArrowUp,
  Zap,
  Plus,
  MoreVertical,
  Trash2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useDashboard } from "@/lib/DashboardContext";

export interface TailoredResultProps {
  matchScore: number | null;
  matchedSkills?: string[];
  missingSkills?: any[];
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
  jobDescriptionId: string | null;
}

const pt = (n: number) => `calc(${n} * 100cqi / 612)`;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: pt(11),
      fontWeight: "bold",
      color: "#000",
      marginTop: pt(10),
      marginBottom: pt(5),
    }}>
      {children}
    </div>
  );
}

export default function TailoredResult({
  matchScore,
  matchedSkills = [],
  missingSkills = [],
  atsAnalysis,
  tailoredResume,
  jobDescriptionId,
  versionId, // We might need this for deletion
}: TailoredResultProps & { versionId?: string }) {
  const router = useRouter();
  const { removeVersion } = useDashboard();
  
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  
  // Deletion logic
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const plainText = tailoredResume ? buildPlainText(tailoredResume) : "";

  const initialScore = atsAnalysis?.initialMatchScore ?? null;
  const improvement = atsAnalysis?.scoreImprovement ?? (initialScore !== null && matchScore !== null ? matchScore - initialScore : null);

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
      const response = await apiFetch(`/api/jobs/${jobDescriptionId}/download`, { method: "POST" });
      const json = await response.json();
      if (!json.success) throw new Error(json.message || "Failed to download");
      const byteCharacters = atob(json.data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([byteArray], { type: json.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = json.filename || "Tailored_Resume.docx";
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
      const response = await apiFetch(`/api/jobs/${jobDescriptionId}/download-pdf`, { method: "POST" });
      const json = await response.json();
      if (!json.success) throw new Error(json.message || "Failed to download");
      const byteCharacters = atob(json.data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([byteArray], { type: json.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = json.filename || "Tailored_Resume.pdf";
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

  const handleDelete = async () => {
    if (!versionId) return;
    setIsDeleting(true);
    setDownloadError("");

    try {
      const res = await apiFetch(`/api/jobs/versions/${versionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        removeVersion(versionId);
        setShowDeleteModal(false);
        router.push("/dashboard");
      } else {
        const json = await res.json();
        setDownloadError(json.message || "Failed to delete version.");
      }
    } catch (err: any) {
      setDownloadError(err.message || "Failed to delete version.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[900px] space-y-8 md:space-y-10 mx-auto">

      {/* ── Before vs After ATS Score Comparison ── */}
      {initialScore !== null && matchScore !== null && (
        <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="font-fraunces text-xl font-bold text-heading">ATS Score Comparison</h3>
          </div>

          {/* Score Cards Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Before */}
            <div className="flex flex-col items-center p-5 rounded-2xl bg-navy-50 border border-navy-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-2">Before</span>
              <span className="text-4xl font-bold text-navy-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                {initialScore}%
              </span>
              <span className="text-[10px] text-navy-400 font-medium mt-1">Original Resume</span>
            </div>

            {/* Improvement */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-accent/5 border border-accent/20">
              <ArrowUp className="w-6 h-6 text-accent mb-1" />
              <span className="text-3xl font-bold text-accent" style={{ fontVariantNumeric: "tabular-nums" }}>
                +{improvement ?? 0}%
              </span>
              <span className="text-[10px] text-accent font-semibold mt-1">Improvement</span>
            </div>

            {/* After */}
            <div className="flex flex-col items-center p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">After</span>
              <span className="text-4xl font-bold text-emerald-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                {matchScore}%
              </span>
              <span className="text-[10px] text-emerald-500 font-medium mt-1">Optimized Resume</span>
            </div>
          </div>

          {/* Progress Bar Comparison */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-navy-500 mb-1">
                <span>Original</span>
                <span>{initialScore}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-navy-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-navy-400 transition-all duration-700"
                  style={{ width: `${initialScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 mb-1">
                <span>Optimized</span>
                <span>{matchScore}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Newly Added Skills & Keywords ── */}
      {atsAnalysis && ((atsAnalysis.addedSkills && atsAnalysis.addedSkills.length > 0) || (atsAnalysis.addedKeywords && atsAnalysis.addedKeywords.length > 0)) && (
        <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <h3 className="font-fraunces text-xl font-bold text-heading mb-1 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Skills & Keywords Integrated
          </h3>
          <p className="text-body text-xs mb-5">
            These missing skills and keywords were naturally incorporated into your tailored resume.
          </p>

          {atsAnalysis.addedSkills && atsAnalysis.addedSkills.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2.5 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Newly Added Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsAnalysis.addedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-semibold border border-accent/20"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {atsAnalysis.addedKeywords && atsAnalysis.addedKeywords.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2.5 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Newly Added Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsAnalysis.addedKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {atsAnalysis.improvedSections && atsAnalysis.improvedSections.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-500 mb-2.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Improved Sections
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsAnalysis.improvedSections.map((section, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Fit Score Card (fallback if no initialScore) ── */}
      {(initialScore === null) && (
        <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-heading/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-fraunces text-xl font-bold text-heading">Fit Score Analysis</h3>
              <p className="text-body text-xs mt-0.5">
                Resume keyword & requirement coverage for target position
              </p>
            </div>
            {matchScore !== null && (
              <span className="text-3xl font-bold text-heading tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
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
      )}

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
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-sm"
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
                className="flex flex-col md:flex-row items-start gap-2 md:gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/15"
              >
                <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/15 text-heading text-xs font-bold border border-primary/25 mt-0.5 max-w-full break-words">
                  {typeof item === 'string' ? item : item.skill}
                </span>
                {typeof item !== 'string' && item.reason && (
                  <span className="text-xs text-body leading-relaxed pt-1 md:pt-1.5">{item.reason}</span>
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
              Tailored Resume Preview
            </h3>
            <p className="text-body text-xs mt-0.5">
              WYSIWYG preview — matches the exported PDF layout exactly
            </p>
          </div>

          {plainText && (
            <div className="flex items-center gap-2 self-start sm:self-auto relative flex-wrap">

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

              {/* Delete Menu */}
              {versionId && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-2 rounded-xl border border-heading/15 bg-white text-heading hover:bg-heading/5 transition-all text-xs font-bold shadow-sm"
                    title="More Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 top-12 w-48 bg-white border border-navy-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fadeIn">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Tailored Version
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {downloadError && (
                <span className="absolute -bottom-8 right-0 text-error text-[10px] whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-error/20 z-10">
                  {downloadError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── WYSIWYG Document Paper Sheet ── */}
        {tailoredResume ? (
          <div className="bg-heading/5 rounded-2xl p-4 sm:p-8 overflow-hidden w-full flex justify-center">
            <div style={{ containerType: "inline-size", width: "100%", maxWidth: "816px" }}>
              <div
                className="bg-white border text-left border-[#d0d0d0] shadow-[0_12px_40px_rgba(0,0,0,0.08)] mx-auto overflow-hidden shrink-0"
                style={{
                  width: "100%",
                  aspectRatio: "8.5 / 11",
                  padding: pt(36),
                  boxSizing: "border-box",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  color: "#000",
                  lineHeight: 1.2
                }}
              >
                {renderWysiwygResume(tailoredResume)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-heading/[0.02] border border-dashed border-heading/15 min-h-[140px] flex items-center justify-center">
            <p className="text-body text-sm text-center">Your optimized resume draft will appear here</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Version Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-navy-100 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-navy-900 mb-2 font-fraunces">Delete Tailored Version?</h3>
            <p className="text-navy-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this tailored version? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-navy-200 text-navy-700 text-sm font-semibold hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Delete Version"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function renderWysiwygResume(r: any): React.ReactNode {
  if (!r || typeof r !== "object") {
    return <p style={{ whiteSpace: "pre-wrap", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "9.5px" }}>{String(r ?? "")}</p>;
  }

  const sections: React.ReactNode[] = [];

  const fullName = r.fullName || r.name;
  const title = r.title || r.professionalTitle;
  const contact = r.contactLine;

  /* ── Header: Centered Name, Title, Contact with separators ── */
  if (fullName || title || contact) {
    const contactParts: { text: string; url?: string }[] = [];
    if (typeof contact === "string") {
      contactParts.push({ text: contact });
    } else if (contact) {
      if (contact.email) contactParts.push({ text: contact.email, url: `mailto:${contact.email}` });
      if (contact.phone) contactParts.push({ text: contact.phone });
      if (contact.location) contactParts.push({ text: contact.location });
      if (Array.isArray(contact.links)) {
        for (const link of contact.links) {
          const label = link.label || link.url;
          if (label) contactParts.push({ text: label, url: link.url });
        }
      }
    }

    sections.push(
      <div key="header" style={{ textAlign: "center", marginBottom: pt(5) }}>
        {fullName && (
          <div style={{ fontSize: pt(22), fontWeight: "bold", color: "#000", marginBottom: pt(2) }}>
            {fullName}
          </div>
        )}
        {title && (
          <div style={{ fontSize: pt(11), color: "#555", marginBottom: pt(5) }}>
            {title}
          </div>
        )}
        {contactParts.length > 0 && (
          <div style={{ fontSize: pt(9), color: "#000", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: pt(6), marginBottom: pt(10) }}>
            {contactParts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: "#000" }}>  |  </span>}
                {part.url ? (
                  <a href={part.url} style={{ color: "#0563C1", textDecoration: "none" }}>{part.text}</a>
                ) : (
                  <span>{part.text}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {/* Horizontal divider matching PDF */}
        <div style={{ borderBottom: `${pt(1)} solid #000`, marginBottom: pt(10) }} />
      </div>
    );
  }

  /* ── Summary ── */
  if (r.summary) {
    sections.push(
      <div key="summary" style={{ marginBottom: pt(10) }}>
        <SectionHeading>PROFESSIONAL SUMMARY</SectionHeading>
        <p style={{ fontSize: pt(9.5), color: "#000", margin: 0, textAlign: "justify" }}>{r.summary}</p>
      </div>
    );
  }

  /* ── Skills (inline format: Category: Skill1, Skill2, Skill3) ── */
  if (r.skillCategories && Array.isArray(r.skillCategories) && r.skillCategories.length > 0) {
    sections.push(
      <div key="skills" style={{ marginBottom: pt(8) }}>
        <SectionHeading>SKILLS & CORE COMPETENCIES</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: pt(2) }}>
          {r.skillCategories.map((cat: any, i: number) => (
            <div key={i} style={{ fontSize: pt(9.5), color: "#000" }}>
              <span style={{ fontWeight: "bold" }}>{cat.category}: </span>
              <span>{cat.skills?.join(", ")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Experience ── */
  if (r.experience && Array.isArray(r.experience) && r.experience.length > 0) {
    sections.push(
      <div key="experience" style={{ marginBottom: pt(10) }}>
        <SectionHeading>PROFESSIONAL EXPERIENCE</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: pt(10) }}>
          {r.experience.map((exp: any, i: number) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: pt(9.5), fontWeight: "bold", color: "#000" }}>
                  {exp.role || exp.jobTitle || exp.title} - {exp.company}
                </span>
                {exp.dates && (
                  <span style={{ fontSize: pt(9.5), fontWeight: "bold", color: "#000" }}>
                    {exp.dates}
                  </span>
                )}
              </div>
              {exp.location && (
                <div style={{ fontSize: pt(9.5), fontStyle: "italic", color: "#000", marginTop: pt(2) }}>
                  {exp.location}
                </div>
              )}
              {exp.bullets && Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                <div style={{ marginTop: pt(2), display: "flex", flexDirection: "column", gap: pt(2) }}>
                  {exp.bullets.map((b: string, j: number) => (
                    <div key={j} style={{ fontSize: pt(9.5), color: "#000", display: "flex", alignItems: "flex-start" }}>
                      <span style={{ width: pt(15), flexShrink: 0, paddingLeft: pt(10) }}>•</span>
                      <span style={{ flex: 1, textAlign: "justify" }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Education ── */
  if (r.education && Array.isArray(r.education) && r.education.length > 0) {
    sections.push(
      <div key="education" style={{ marginBottom: pt(4) }}>
        <SectionHeading>EDUCATION</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: pt(6) }}>
          {r.education.map((edu: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: pt(9.5), fontWeight: "bold", color: "#000" }}>
                {edu.degree || edu.title} - {edu.school}
              </span>
              {edu.dates && (
                <span style={{ fontSize: pt(9.5), fontWeight: "bold", color: "#000" }}>
                  {edu.dates}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Projects ── */
  if (r.projects && Array.isArray(r.projects) && r.projects.length > 0) {
    sections.push(
      <div key="projects" style={{ marginBottom: pt(8) }}>
        <SectionHeading>PROJECTS</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: pt(8) }}>
          {r.projects.map((proj: any, i: number) => (
            <div key={i}>
              <div style={{ fontSize: pt(9.5), fontWeight: "bold", color: "#000", marginBottom: pt(3) }}>
                {proj.url ? (
                  <a href={proj.url} style={{ color: "#0563C1", textDecoration: "none" }}>{proj.name || proj.title}</a>
                ) : (
                  proj.name || proj.title
                )}
              </div>
              {proj.bullets && Array.isArray(proj.bullets) && proj.bullets.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: pt(2) }}>
                  {proj.bullets.map((b: string, j: number) => (
                    <div key={j} style={{ fontSize: pt(9.5), color: "#000", display: "flex", alignItems: "flex-start" }}>
                      <span style={{ width: pt(15), flexShrink: 0, paddingLeft: pt(10) }}>•</span>
                      <span style={{ flex: 1, textAlign: "justify" }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Certifications ── */
  if (r.certifications && Array.isArray(r.certifications) && r.certifications.length > 0) {
    sections.push(
      <div key="certs" style={{ marginBottom: pt(8) }}>
        <SectionHeading>CERTIFICATIONS</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: pt(2) }}>
          {r.certifications.map((c: string, i: number) => (
            <div key={i} style={{ fontSize: pt(9.5), color: "#000", display: "flex", alignItems: "flex-start" }}>
              <span style={{ width: pt(15), flexShrink: 0, paddingLeft: pt(10) }}>•</span>
              <span style={{ flex: 1, textAlign: "justify" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return <p style={{ whiteSpace: "pre-wrap", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "9.5px" }}>{JSON.stringify(r, null, 2)}</p>;
  }

  return <div>{sections}</div>;
}

/* ═══════════════════════════════════════════════
   Plain-text builder (for copy / .txt download)
   ═══════════════════════════════════════════════ */

function buildPlainText(r: any): string {
  if (!r || typeof r !== "object") return String(r ?? "");

  const lines: string[] = [];

  const fullName = r.fullName || r.name;
  const title = r.title || r.professionalTitle;

  if (fullName) lines.push(fullName);
  if (title) lines.push(title);

  if (r.contactLine) {
    const contactParts: string[] = [];
    if (typeof r.contactLine === "string") {
      contactParts.push(r.contactLine);
    } else {
      if (r.contactLine.email) contactParts.push(r.contactLine.email);
      if (r.contactLine.phone) contactParts.push(r.contactLine.phone);
      if (r.contactLine.location) contactParts.push(r.contactLine.location);
      if (Array.isArray(r.contactLine.links)) {
        for (const link of r.contactLine.links) {
          const label = link.label || link.url;
          if (label) contactParts.push(`${label}${link.url && link.url !== label ? ` (${link.url})` : ''}`);
        }
      }
    }
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
        lines.push(`${cat.category}: ${cat.skills.join(", ")}`);
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
      if (proj.name || proj.title) {
        lines.push(proj.url ? `${proj.name || proj.title} - ${proj.url}` : (proj.name || proj.title));
      }
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
