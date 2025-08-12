import React from "react";

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-slate-600">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;


