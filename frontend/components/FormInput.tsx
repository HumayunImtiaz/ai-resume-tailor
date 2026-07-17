import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className = "", ...props }: FormInputProps) {
  return (
    <div className="flex flex-col mb-5">
      <label className="mb-2 text-sm font-medium text-ink-navy/80">{label}</label>
      <input
        className={`w-full h-12 px-4 rounded-lg bg-transparent border text-ink-navy placeholder:text-ink-navy/30 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent transition-all ${
          error ? 'border-red-400 focus:ring-red-400' : 'border-ink-navy/20'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1.5 text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}
