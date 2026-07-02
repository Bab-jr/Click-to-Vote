import React from "react";

const VARIANTS = {
  preparing: "bg-yellow-100 text-yellow-700",
  ongoing: "bg-green-100 text-green-700",
  finished: "bg-gray-100 text-gray-600",
  completed: "bg-gray-100 text-gray-600",
  voted: "bg-green-100 text-green-700",
  pending: "bg-gray-100 text-gray-600",
};

export default function StatusPill({ status, label }) {
  const key = (status || "").toLowerCase();
  const variant = VARIANTS[key] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variant}`}
    >
      {label || status}
    </span>
  );
}