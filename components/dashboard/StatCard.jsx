import React from "react";
import { motion } from "framer-motion";

export default function StatCard({
  label,
  value,
  sublabel,
  accent = "brand",
  delay = 0,
}) {
  const colorMap = {
    brand: "text-brand",
    red: "text-red-500",
    green: "text-green-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="bg-white rounded-xl border border-gray-200 p-5"
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold mt-2 ${colorMap[accent]}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </motion.div>
  );
}