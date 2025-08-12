import React from "react";

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          {trend !== undefined && (
            <div className="mt-1 text-xs text-slate-500">
              <span className={trend >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
              {trendLabel && <span className="ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


