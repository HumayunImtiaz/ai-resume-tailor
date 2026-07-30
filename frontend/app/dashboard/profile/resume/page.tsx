"use client";

import React from "react";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import ResumeUploader from "@/components/ResumeUploader";

export default function ProfileResumePage() {
  const { activeResume, refreshDashboard } = useDashboard();

  return (
    <div className="w-full h-full flex flex-col max-w-[900px] mx-auto py-2 overflow-y-auto overflow-x-hidden">
      <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 mb-6">
        <h1 className="font-fraunces text-3xl font-bold text-ink-navy mb-4">Base Resume</h1>
        <p className="text-ink-navy/60 text-sm mb-8 max-w-2xl">
          Your base resume is used to analyze your core skills and tailor your applications to specific job descriptions. 
          Upload a new version below to replace the current one.
        </p>

        {activeResume ? (
          <div className="bg-white/50 border border-white/80 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm w-full overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600 mt-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-ink-navy uppercase tracking-wide mb-1">Active Resume</h3>
              <p className="font-semibold text-lg text-ink-navy truncate mb-2">{activeResume.originalFilename}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-navy/60">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  Uploaded: {new Date(activeResume.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber/10 border border-amber/20 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-amber mb-3" />
            <h3 className="text-sm font-bold text-ink-navy mb-1">No Resume Uploaded</h3>
            <p className="text-xs text-ink-navy/60 max-w-xs">Upload your primary resume to start tailoring job applications.</p>
          </div>
        )}

        <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 w-full overflow-hidden">
          <ResumeUploader onUploadSuccess={refreshDashboard} />
        </div>
      </div>
    </div>
  );
}
