"use client";

import React from "react";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import CoverLetterUploader from "@/components/CoverLetterUploader";

export default function ProfileCoverLetterPage() {
  const { activeCoverLetter, refreshDashboard } = useDashboard();

  return (
    <div className="w-full h-full flex flex-col max-w-[900px] mx-auto py-2 overflow-y-auto overflow-x-hidden">
      <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12 mb-6">
        <h1 className="font-fraunces text-3xl font-bold text-heading mb-4">Base Cover Letter</h1>
        <p className="text-body text-sm mb-8 max-w-2xl">
          Your base cover letter is used as a template to understand your writing style and background. 
          It helps us generate highly personalized cover letters for each job.
        </p>

        {activeCoverLetter ? (
          <div className="bg-white/50 border border-white/80 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm w-full overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600 mt-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-heading uppercase tracking-wide mb-1">Active Cover Letter</h3>
              <p className="font-semibold text-lg text-heading truncate mb-2">{activeCoverLetter.originalFilename}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-body">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  Uploaded: {new Date(activeCoverLetter.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-sm font-bold text-heading mb-1">No Cover Letter Uploaded</h3>
            <p className="text-xs text-body max-w-xs">Upload your base cover letter to improve generated results.</p>
          </div>
        )}

        <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 w-full overflow-hidden">
          <CoverLetterUploader onUploadSuccess={refreshDashboard} />
        </div>
      </div>
    </div>
  );
}
