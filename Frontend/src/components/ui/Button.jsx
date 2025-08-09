import clsx from 'clsx';

export default function Button({
  children,
  variant = 'primary',
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    red: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  };
  return (
    <button
      className={clsx(base, 'px-4 py-2.5', variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}