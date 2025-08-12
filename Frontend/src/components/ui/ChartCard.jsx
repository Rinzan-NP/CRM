import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ChartCard({
  title,
  children,
  trend,
  trendValue,
  trendLabel,
  className = "",
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {trend !== undefined && (
          <div className="flex items-center gap-2">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600" />
            )}
            <span
              className={`text-sm font-medium ${
                trend >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend >= 0 ? "+" : ""}{trendValue}
            </span>
            {trendLabel && (
              <span className="text-sm text-slate-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
}
