import React from "react";
import { FiSearch, FiX } from "react-icons/fi";

const SearchInput = ({ placeholder = "Search...", value, onChange, onClear }) => {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <FiSearch className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;


