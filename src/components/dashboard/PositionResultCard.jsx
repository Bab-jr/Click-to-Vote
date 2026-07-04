import React from "react";
import { Crown } from "lucide-react";

export default function PositionResultCard({
  label,
  sublabel,
  winner,
  candidateResults = [],
  eligibleVoters,
  votedForPosition,
  abstained,
  partyName,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{label}</p>
          {sublabel && (
            <p className="text-xs text-gray-500">{sublabel}</p>
          )}
        </div>
        {winner && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold uppercase tracking-wider">
            <Crown className="w-3 h-3" /> Winner
          </span>
        )}
      </div>

      {/* Position stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-gray-50 rounded-lg py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Eligible
          </p>
          <p className="text-base font-bold text-gray-900">{eligibleVoters}</p>
        </div>
        <div className="text-center bg-green-50 rounded-lg py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Voted
          </p>
          <p className="text-base font-bold text-green-700">{votedForPosition}</p>
        </div>
        <div className="text-center bg-amber-50 rounded-lg py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Abstained
          </p>
          <p className="text-base font-bold text-amber-700">{abstained}</p>
        </div>
      </div>

      {/* Candidate rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {candidateResults.map((cr, idx) => {
          const isWinner = idx === 0 && cr.votes > 0 && winner;
          return (
            <div
              key={cr.candidate.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                isWinner
                  ? "bg-brand/5 border border-brand/20"
                  : "bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isWinner && (
                  <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {cr.candidate.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {partyName(cr.candidate.party_id)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-sm font-bold text-gray-900">{cr.votes}</p>
                <p className="text-xs text-gray-500">
                  {cr.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
        {candidateResults.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2 col-span-full">
            No candidates for this position.
          </p>
        )}
      </div>
    </div>
  );
}