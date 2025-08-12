import React from "react";
import clsx from "clsx";

export default function IconButton({
  children,
  label,
  variant = "ghost",
  className,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const variants = {
    ghost: "hover:bg-slate-100",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    danger: "text-rose-600 hover:bg-rose-50",
    neutral: "text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      aria-label={label}
      className={clsx(base, variants[variant], "h-9 w-9", className)}
      {...props}
    >
      {children}
    </button>
  );
}


