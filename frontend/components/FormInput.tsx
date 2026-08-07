"use client";

import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, error, icon, type = "text", className = "", ...props }: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";
  const actualType = isPasswordType ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col mb-5">
      <label className="mb-2 text-sm font-semibold text-navy-900 tracking-tight">{label}</label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-navy-400 pointer-events-none transition-colors">
            {icon}
          </div>
        )}
        <input
          type={actualType}
          className={`w-full h-12 rounded-xl bg-white border text-navy-900 text-sm font-medium placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm ${
            icon ? 'pl-11' : 'pl-4'
          } ${isPasswordType ? 'pr-11' : 'pr-4'} ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-navy-200 hover:border-navy-300'
          } ${className}`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-navy-400 hover:text-navy-700 transition-colors p-1 rounded-md"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <span className="mt-1.5 text-xs text-red-500 font-semibold">{error}</span>}
    </div>
  );
}
