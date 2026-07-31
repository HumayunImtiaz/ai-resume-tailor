import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className = "", ...props }: FormInputProps) {
  return (
    <div className="flex flex-col mb-5">
      <label className="mb-2 text-sm font-medium text-body">{label}</label>
      <input
        className={`w-full h-12 px-4 rounded-lg bg-transparent border text-heading placeholder:text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
          error ? 'border-error-400 focus:ring-error-400' : 'border-heading/20'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1.5 text-xs text-error font-medium">{error}</span>}
    </div>
  );
}
