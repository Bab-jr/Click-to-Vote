import React from "react";
import { motion } from "framer-motion";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand/90",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50",
};

export default function ActionButton({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
}