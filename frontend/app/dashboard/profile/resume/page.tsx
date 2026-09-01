"use client";

import React, { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { apiFetch } from "@/lib/api";
import ResumeUploader from "@/components/ResumeUploader";

export default function ProfileResumePage() {
  const { activeResume, refreshDashboard } = useDashboard();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!activeResume) { setPreviewHtml(null); return; }

    // Always fetch preview HTML from server (works for both PDF and DOCX)
    setPreviewLoading(true);
    apiFetch(`/api/resumes/${activeResume.id}/preview`)
      .then(r => r.json())
      .then(json => setPreviewHtml(json.data?.html ?? null))
      .catch(() => setPreviewHtml(null))
      .finally(() => setPreviewLoading(false));
  }, [activeResume?.id]);

  return (
    <div className="w-full flex flex-col max-w-[900px] mx-auto py-2">
      <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 mb-6">
        <h1 className="font-fraunces text-3xl font-bold text-heading mb-2">Base Resume</h1>
        <p className="text-body text-sm mb-6 max-w-2xl">
          Your base resume is used to analyze your core skills and tailor your applications to specific job descriptions.
        </p>

        {/* ── Upload Section at Top ── */}
        <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 w-full overflow-hidden mb-8">
          <ResumeUploader onUploadSuccess={refreshDashboard} />
        </div>

        {/* ── Active Resume Info & Preview ── */}
        {activeResume ? (
          <>
            <div className="bg-white/50 border border-white/80 rounded-2xl p-6 mb-6 flex items-start gap-4 shadow-sm w-full overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-success/10 border border-success-200 flex items-center justify-center shrink-0 text-success mt-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-heading uppercase tracking-wide mb-1">Active Resume</h3>
                <p className="font-semibold text-lg text-heading truncate mb-2">{activeResume.originalFilename}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-body">
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    Uploaded: {new Date(activeResume.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Preview — works for both PDF and DOCX */}
            <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-auto" style={{ minHeight: '400px' }}>
              {previewLoading ? (
                <div className="flex items-center justify-center h-48 text-body text-sm gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading preview...
                </div>
              ) : previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : activeResume.fileUrl && activeResume.originalFilename.toLowerCase().endsWith('.pdf') ? (
                /* Fallback: PDF direct iframe if HTML preview unavailable */
                <iframe
                  src={activeResume.fileUrl}
                  className="w-full border-0"
                  style={{ height: '85vh', minHeight: '800px' }}
                  title="Resume Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-body text-sm gap-2">
                  <FileText className="w-8 h-8 text-gray-300" />
                  Preview not available.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-sm font-bold text-heading mb-1">No Resume Uploaded</h3>
            <p className="text-xs text-body max-w-xs">Upload your primary resume above to start tailoring job applications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
