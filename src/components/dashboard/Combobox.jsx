import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  label,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative">
      {label && (
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </p>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full h-11 px-3 pr-9 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden max-h-60 overflow-y-auto"
            >
              {filtered.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-gray-400">
                  No matches — type to add custom value
                </p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setInputValue(opt);
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