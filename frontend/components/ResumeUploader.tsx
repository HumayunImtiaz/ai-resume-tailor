"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
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
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Upload failed. Please try again." });
      } finally {
        setIsUploading(false);
        // Reset the file input so the same file can be re-selected
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
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative w-full rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200 group
          ${isDragging
            ? "border-amber bg-amber/10 scale-[1.01]"
            : "border-ink-navy/20 hover:border-amber/60 hover:bg-amber/5"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center py-12 px-6">
          {isUploading ? (
            <>
              <svg
                className="animate-spin h-10 w-10 text-amber mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#14213D" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-ink-navy/70 font-medium">Uploading your resume…</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-ink-navy/5 flex items-center justify-center mb-4 group-hover:bg-amber/10 transition-colors">
                <Upload className="w-6 h-6 text-ink-navy/50 group-hover:text-amber transition-colors" />
              </div>
              <p className="text-ink-navy font-medium mb-1">
                Drag and drop your resume, or{" "}
                <span className="text-amber underline underline-offset-2">click to browse</span>
              </p>
              <p className="text-ink-navy/50 text-sm">PDF or DOCX, up to 5 MB</p>
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
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`mt-4 p-4 rounded-lg text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-100 text-red-600"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
