"use client";

import React, { useEffect, useState } from "react";
import { FileSearch, Target, Sparkles, CheckCircle2 } from "lucide-react";

const STEPS = [
  { label: "Parsing resume", icon: FileSearch },
  { label: "Matching keywords", icon: Target },
  { label: "Generating tailored draft", icon: Sparkles },
  { label: "Finalizing", icon: CheckCircle2 },
];

interface TailorProgressProps {
  /** The current queue state: "waiting" | "active" | "completed" | "failed" */
  state: string;
}

export default function TailorProgress({ state }: TailorProgressProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Cycle through the visual steps while the job is still processing
  useEffect(() => {
    if (state === "completed" || state === "failed") {
      setActiveStep(STEPS.length); // all done
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= STEPS.length - 1) return 0;
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [state]);

  const isComplete = state === "completed";

  return (
    <div className="w-full">
      {/* Document silhouette with scan line — echoes the login motif */}
      <div className="flex justify-center mb-10">
        <div className="relative w-44 h-56 border-2 border-ink-navy/15 rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col p-5 gap-3 overflow-hidden">
          {/* Skeleton lines */}
          <div className="w-full h-6 bg-ink-navy/5 rounded" />
          <div className="w-3/4 h-2 bg-ink-navy/5 rounded" />
          <div className="w-full h-2 bg-ink-navy/5 rounded" />
          <div className="w-5/6 h-2 bg-ink-navy/5 rounded" />
          <div className="w-2/3 h-2 bg-ink-navy/5 rounded" />
          <div className="w-full h-8 bg-ink-navy/5 rounded mt-auto" />

          {/* Animated scan line */}
          {!isComplete && (
            <div className="absolute left-0 right-0 h-1 bg-amber shadow-[0_0_16px_6px_#E8A33D] motion-safe:animate-scan z-10" />
          )}

          {/* Completed overlay */}
          {isComplete && (
            <div className="absolute inset-0 bg-emerald-50/80 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = isComplete || index < activeStep;
          const isCurrent = !isComplete && index === activeStep;

          return (
            <div
              key={step.label}
              className={`
                flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all duration-500
                ${isCurrent
                  ? "bg-amber/10 border-amber/30 shadow-[0_0_20px_rgb(232,163,61,0.1)]"
                  : isDone
                    ? "bg-emerald-50/60 border-emerald-200/50"
                    : "bg-white border-ink-navy/5"
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500
                  ${isCurrent
                    ? "bg-amber/20"
                    : isDone
                      ? "bg-emerald-100"
                      : "bg-ink-navy/5"
                  }
                `}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                ) : (
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors duration-500 ${isCurrent ? "text-amber" : "text-ink-navy/30"}`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm font-medium transition-colors duration-500 ${
                  isCurrent
                    ? "text-ink-navy"
                    : isDone
                      ? "text-emerald-700"
                      : "text-ink-navy/40"
                }`}
              >
                {step.label}
              </span>

              {/* Pulse dot for the current step */}
              {isCurrent && (
                <span className="ml-auto relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber/60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
