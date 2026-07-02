import React from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, ImageIcon, Pencil } from "lucide-react";
import { getFileUrl } from "@/lib/fileUtils";

export default function CandidateCard({
  candidate,
  partyName,
  onAssign,
  onRemove,
  onEdit,
  showTrack = false,
}) {
  if (!candidate) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          {partyName}
        </p>
        <button
          onClick={onAssign}
          className="w-full py-3 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Assign Candidate
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {candidate.photo ? (
          <img
            src={getFileUrl(candidate.photo)}
            alt={candidate.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-brand/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {candidate.name}
          </p>
          <p className="text-xs text-gray-400">
            {candidate.grade}
            {showTrack && candidate.track ? ` · ${candidate.track}` : ""}
          </p>
          {candidate.motto && (
            <p className="text-xs text-gray-500 italic mt-1 truncate">
              "{candidate.motto}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit && onEdit(candidate)}
            className="p-1 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
            title="Edit candidate"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(candidate)}
            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove candidate"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {candidate.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {candidate.description}
        </p>
      )}
    </div>
  );
}