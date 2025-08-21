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
    <div className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm ${className}`}>
      {/* Header section - stacks on mobile, inline on larger screens */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
          {title}
        </h3>
        {trend !== undefined && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600" />
            )}
            <span
              className={`text-xs sm:text-sm font-medium ${
                trend >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend >= 0 ? "+" : ""}{trendValue}
            </span>
            {trendLabel && (
              <span className="text-xs sm:text-sm text-slate-500 hidden xs:inline">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Chart container - responsive height */}
      <div className="h-48 sm:h-56 md:h-64">
        {children}
      </div>
    </div>
  );
}