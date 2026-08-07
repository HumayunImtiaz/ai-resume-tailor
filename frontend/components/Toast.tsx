"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-navy-900 text-white shadow-2xl border border-white/10 animate-slideInRight max-w-md">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSuccess ? 'bg-accent text-white' : 'bg-red-500 text-white'}`}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <p className="text-xs font-semibold text-white/90 flex-1 leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
