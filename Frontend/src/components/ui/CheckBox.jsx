export default function CheckBox({ className, ...props }) {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ${className}`}
      {...props}
    />
  );
}