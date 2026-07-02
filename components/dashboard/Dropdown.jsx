import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  label,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {label && (
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm hover:border-gray-300 transition-colors"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden max-h-60 overflow-y-auto"
            >
              {options.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-gray-400">No options</p>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-sm text-left hover:bg-brand/5 transition-colors ${
                      value === opt
                        ? "bg-brand/5 text-brand font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}