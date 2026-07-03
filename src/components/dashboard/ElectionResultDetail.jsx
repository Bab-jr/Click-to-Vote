import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { computeElectionResults, downloadResults } from "@/lib/resultsHelper";
import WinnerCard from "@/components/dashboard/WinnerCard";
import StatCard from "@/components/dashboard/StatCard";
import { Loader2, Download, Users, CheckCircle2, XCircle } from "lucide-react";

export default function ElectionResultDetail({ election }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await computeElectionResults(election.id);
        setResults(data);
      } catch (err) {
        console.error("Election results error:", err);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [election.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Failed to load results.
      </div>
    );
  }

  const { stats, regularWinners, boardWinners, partyName } = results;

  const breakdownEntries = (obj) => Object.entries(obj).sort();

  return (
    <div className="space-y-6">
      {/* Download button */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadResults(election, results)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Results
        </button>
      </div>

      {/* Voter Statistics */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">
          Voter Statistics
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total Voters"
            value={stats.totalVoters}
            delay={0}
          />
          <StatCard
            label="Voted"
            value={stats.votedCount}
            accent="green"
            delay={0.05}
          />
          <StatCard
            label="Not Voted"
            value={stats.notVotedCount}
            accent="red"
            delay={0.1}
          />
        </div>
      </div>

      {/* Breakdown: Track & Section / Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            By Track & Section
          </p>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {Object.keys(stats.byTrackSection || {}).length === 0 ? (
              <p className="text-xs text-gray-400">No data</p>
            ) : (
              Object.entries(
                Object.entries(stats.byTrackSection).reduce((acc, [, data]) => {
                  if (!acc[data.track]) acc[data.track] = [];
                  acc[data.track].push(data);
                  return acc;
                }, {})
              ).map(([track, sections]) => (
                <div key={track} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900">{track}</span>
                    <span className="text-xs font-medium text-gray-500">
                      {sections.reduce((sum, s) => sum + s.voted, 0)}/
                      {sections.reduce((sum, s) => sum + s.total, 0)} voted
                    </span>
                  </div>
                  <div className="pl-3 space-y-1">
                    {sections
                      .sort((a, b) => a.section.localeCompare(b.section))
                      .map((s) => (
                        <div
                          key={s.section}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-500">Section {s.section}</span>
                          <span className="font-medium text-gray-700">
                            {s.voted}/{s.total}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            By Grade
          </p>
          <div className="space-y-2">
            {breakdownEntries(stats.byGrade).map(([key, data]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{key}</span>
                <span className="font-medium text-gray-900">
                  {data.voted}/{data.total}
                </span>
              </div>
            ))}
            {breakdownEntries(stats.byGrade).length === 0 && (
              <p className="text-xs text-gray-400">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Winning Candidates */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">
          Winning Candidates
        </h4>
        <div className="space-y-4">
          {regularWinners.map((w) => (
            <div key={w.position}>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                {w.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <WinnerCard
                  candidate={w.winner}
                  partyName={w.winner ? partyName(w.winner.party_id) : ""}
                  votes={w.votes}
                />
              </div>
            </div>
          ))}
          {boardWinners.map((b) => (
            <div key={`board_${b.track}`}>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Board Member — {b.track} Track
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <WinnerCard
                  candidate={b.winner}
                  partyName={b.winner ? partyName(b.winner.party_id) : ""}
                  votes={b.votes}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}