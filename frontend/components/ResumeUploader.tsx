"use client";

import React, { useCallback, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

interface ResumeUploaderProps {
  onUploadSuccess: () => void;
}

export default function ResumeUploader({ onUploadSuccess }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Only PDF and DOCX files are accepted.";
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setFeedback({ type: "error", message: error });
        return;
      }

      setIsUploading(true);
      setFeedback(null);

      try {
        const formData = new FormData();
        formData.append("resume", file);

        const res = await apiFetch("/api/resumes/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        setFeedback({ type: "success", message: json.message || "Resume uploaded successfully!" });
        onUploadSuccess();
        
        // Hide success message after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Upload failed. Please try again." });
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onUploadSuccess]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
      {/* Background glow when dragging */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 rounded-[28px] blur-2xl transition-all duration-300 pointer-events-none" />
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative z-10 w-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center cursor-pointer 
          rounded-[28px] transition-all duration-300 h-full
          ${isDragging
            ? "border-[2px] border-primary bg-primary/5 shadow-inner scale-[0.98]"
            : "border-[2px] border-dashed border-gray-200 hover:border-primary/50 hover:bg-gray-50/50 bg-white"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
             <div className="relative w-16 h-16 mb-4">
                 <div className="absolute inset-x-1 inset-y-1 rounded-full border border-primary/30 bg-primary/10 animate-pulse" />
                 <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />
             </div>
             <p className="font-semibold text-lg text-heading tracking-tight">Processing Document</p>
             <p className="text-sm text-gray-500 mt-1">Applying AI extraction...</p>
          </div>
        ) : (
          <>
            <div className={`p-4 rounded-[20px] mb-6 transition-colors shadow-xl ${isDragging ? "bg-primary text-white shadow-primary/30" : "bg-white text-gray-400 border border-gray-100 shadow-black/5"}`}>
               <UploadCloud className="w-8 h-8" />
            </div>
            <p className="font-semibold text-lg text-heading mb-2">
              Browse Files <span className="font-normal text-gray-400">or drop here</span>
            </p>
            <p className="text-sm text-gray-500 max-w-xs px-4 bg-gray-50 py-1.5 rounded-full border border-gray-100">
              PDF, DOCX up to 5MB
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload resume"
      />

      {/* Modern Floating Feedback Alert */}
      <div className={`
        absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold shadow-xl transition-all duration-500 z-50 backdrop-blur-xl border
        ${feedback ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}
        ${feedback?.type === "success" 
            ? "bg-white/90 border-success-200 text-success shadow-[0_10px_40px_rgba(16,185,129,0.15)]" 
            : "bg-white/90 border-error-200 text-error shadow-[0_10px_40px_rgba(239,68,68,0.15)]"}
      `}>
        {feedback?.type === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
        <span>{feedback?.message}</span>
      </div>
    </div>
  );
}
