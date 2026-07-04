import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useElection } from "@/components/dashboard/ElectionContext";
import { useUserRole } from "@/hooks/useUserRole";
import StatusPill from "@/components/dashboard/StatusPill";
import ActionButton from "@/components/dashboard/ActionButton";
import StatCard from "@/components/dashboard/StatCard";
import NewElectionModal from "@/components/modals/NewElectionModal";
import ManageElectionModal from "@/components/modals/ManageElectionModal";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import Dropdown from "@/components/dashboard/Dropdown";
import { TRACKS, GRADES } from "@/lib/trackConfig";
import { Vote, Plus, Square, Settings } from "lucide-react";

export default function ElectionDashboard() {
  const { elections, selectedElection, refresh } = useElection();
  const { effectiveRole } = useUserRole();
  const [showNewElection, setShowNewElection] = useState(false);
  const [manageElection, setManageElection] = useState(null);
  const [stats, setStats] = useState({ voters: 0, candidates: 0, votes: 0 });
  const [chartData, setChartData] = useState({ grades: [], tracks: [], sections: [] });
  const [sectionTrack, setSectionTrack] = useState(TRACKS[0]);
  const [trigger, setTrigger] = useState(0);

  const canSeeControlCenter =
    effectiveRole === "admin" || effectiveRole === "adviser";
  const canCreateElection = effectiveRole === "admin";

  useEffect(() => {
    if (!selectedElection) {
      setStats({ voters: 0, candidates: 0, votes: 0 });
      setChartData({ grades: [], tracks: [], sections: [] });
      return;
    }
    const loadStats = async () => {
      try {
        const [voters, candidates] = await Promise.all([
          base44.entities.Voter.filter({
            election_id: selectedElection.id,
          }),
          base44.entities.Candidate.filter({
            election_id: selectedElection.id,
          }),
        ]);
        setStats({
          voters: voters.length,
          candidates: candidates.length,
          votes: voters.filter((v) => v.has_voted).length,
        });
        const gradeMap = {};
        const trackMap = {};
        const sectionMap = {};
        voters.forEach((v) => {
          const g = GRADES.includes(v.grade) ? v.grade : "Unknown";
          if (!gradeMap[g]) gradeMap[g] = { voted: 0, notVoted: 0 };
          if (v.has_voted) gradeMap[g].voted++;
          else gradeMap[g].notVoted++;
          const t = v.track || "Unknown";
          if (!trackMap[t]) trackMap[t] = { voted: 0, notVoted: 0 };
          if (v.has_voted) trackMap[t].voted++;
          else trackMap[t].notVoted++;
          const s = v.section || "Unknown";
          const key = `${t}|${s}`;
          if (!sectionMap[key])
            sectionMap[key] = { track: t, section: s, voted: 0, notVoted: 0 };
          if (v.has_voted) sectionMap[key].voted++;
          else sectionMap[key].notVoted++;
        });
        setChartData({
          grades: Object.entries(gradeMap).map(([name, d]) => ({
            name,
            voted: d.voted,
            notVoted: d.notVoted,
          })),
          tracks: Object.entries(trackMap).map(([name, d]) => ({
            name,
            voted: d.voted,
            notVoted: d.notVoted,
          })),
          sections: Object.values(sectionMap),
        });
      } catch {
        // no data yet
      }
    };
    loadStats();
  }, [selectedElection?.id, trigger]);

  const handleEnd = async (el) => {
    await base44.entities.Election.update(el.id, { status: "finished" });
    await logAction("ELECTION_ENDED", `Ended election "${el.title}"`, el.id);
    refresh();
    setTrigger((t) => t + 1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Election Dashboard</h2>
        <p className="text-sm text-gray-500">
          Active Election: {selectedElection?.title || "None"}
        </p>
      </div>

      {/* Election Control Center — Admins & Advisers only */}
      {canSeeControlCenter && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-gray-900">
                Election Control Center
              </h3>
            </div>
            {canCreateElection && (
              <ActionButton icon={Plus} onClick={() => setShowNewElection(true)}>
                New Election
              </ActionButton>
            )}
          </div>
          {elections.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              {canCreateElection
                ? 'No elections yet. Click "New Election" to create one.'
                : "No elections available."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Election Title",
                      "Status",
                      "End Time",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {elections.map((el) => (
                    <tr
                      key={el.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                        {el.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={el.status} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {el.end_date_time
                          ? format(new Date(el.end_date_time), "MMM d, HH:mm")
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {el.status === "ongoing" && (
                            <ActionButton
                              variant="danger"
                              icon={Square}
                              className="px-3 py-1.5 text-xs"
                              onClick={() => handleEnd(el)}
                            >
                              End
                            </ActionButton>
                          )}
                          <ActionButton
                            variant="outline"
                            icon={Settings}
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setManageElection(el)}
                          >
                            Manage
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Voters"
          value={stats.voters}
          sublabel="Assigned Students"
          delay={0.05}
        />
        <StatCard
          label="Total Candidates"
          value={stats.candidates}
          sublabel="Validated Contestants"
          delay={0.1}
        />
        <StatCard
          label="Total Votes Cast"
          value={stats.votes}
          sublabel="Verified Ballots"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Voted vs Not Voted per Grade
          </h3>
          {chartData.grades.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              No voter data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.grades}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Legend />
                <Bar dataKey="voted" name="Voted" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="notVoted" name="Not Voted" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Voted vs Not Voted per Track
          </h3>
          {chartData.tracks.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              No voter data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.tracks}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Legend />
                <Bar dataKey="voted" name="Voted" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="notVoted" name="Not Voted" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Section chart with track selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-bold text-gray-900">
            Voted vs Not Voted per Section
          </h3>
          <div className="w-32 sm:w-40 flex-shrink-0">
            <Dropdown
              value={sectionTrack}
              onChange={setSectionTrack}
              options={TRACKS}
              placeholder="Select Track"
            />
          </div>
        </div>
        {chartData.sections.filter((s) => s.track === sectionTrack).length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
            No section data for {sectionTrack} track
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData.sections
                .filter((s) => s.track === sectionTrack)
                .map((s) => ({ name: `Sec ${s.section}`, voted: s.voted, notVoted: s.notVoted }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Legend />
              <Bar dataKey="voted" name="Voted" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="notVoted" name="Not Voted" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <NewElectionModal
        open={showNewElection}
        onClose={() => setShowNewElection(false)}
      />
      <ManageElectionModal
        open={!!manageElection}
        election={manageElection}
        onClose={() => setManageElection(null)}
        onSuccess={() => {
          refresh();
          setTrigger((t) => t + 1);
        }}
      />
    </div>
  );
}