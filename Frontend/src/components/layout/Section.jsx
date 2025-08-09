import { motion } from 'framer-motion';

export default function Section({ title, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-12"
    >
      <h2 className="text-2xl font-semibold text-slate-800 mb-8 pb-2 border-b border-slate-200">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}