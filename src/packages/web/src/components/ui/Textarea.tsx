// =============================================
// PLANAC ERP - Textarea Component
// =============================================

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 border rounded-lg text-sm
          transition-colors resize-none
          ${error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-200 focus:border-red-500 focus:ring-red-500/20"
          }
          focus:outline-none focus:ring-2
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

export default Textarea;

