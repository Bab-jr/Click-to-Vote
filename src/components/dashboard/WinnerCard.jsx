import React from "react";
import { Crown, ImageIcon } from "lucide-react";

export default function WinnerCard({
  candidate,
  partyName,
  votes,
  track,
}) {
  if (!candidate) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 text-center bg-gray-50/50">
        <p className="text-xs text-gray-400">No winner</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-yellow-300 rounded-lg p-4 bg-gradient-to-br from-yellow-50/50 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-yellow-500" />
        <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">
          Winner
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {votes} {votes === 1 ? "vote" : "votes"}
        </span>
      </div>
      <div className="flex items-start gap-3">
        {candidate.photo ? (
          <img
            src={candidate.photo}
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
          <p className="text-xs text-gray-500">{partyName}</p>
          <p className="text-xs text-gray-400">
            {candidate.grade}
            {candidate.track ? ` · ${candidate.track}` : ""}
          </p>
        </div>
      </div>
      {candidate.motto && (
        <p className="text-xs text-gray-500 italic mt-2 truncate">
          "{candidate.motto}"
        </p>
      )}
      {candidate.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {candidate.description}
        </p>
      )}
    </div>
  );
}