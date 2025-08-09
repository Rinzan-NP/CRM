export default function Card({ children, className }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}