import React from "react";
import { LucideIcon } from "lucide-react";

export default function FormField({
  label,
  children,
  icon: Icon,
  required = false,
  error,
  className = "",
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <div className={Icon ? "pl-10" : ""}>
          {children}
        </div>
      </div>
      {error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}
    </div>
  );
}
