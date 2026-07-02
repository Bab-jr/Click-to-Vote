import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Upload, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";
import ActionButton from "@/components/dashboard/ActionButton";
import Dropdown from "@/components/dashboard/Dropdown";
import AddVoterModal from "@/components/modals/AddVoterModal";
import ImportVotersModal from "@/components/modals/ImportVotersModal";
import EditVoterModal from "@/components/modals/EditVoterModal";
import { useElection } from "@/components/dashboard/ElectionContext";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { TRACKS as ALL_TRACKS } from "@/lib/trackConfig";

const TRACKS = ["All Tracks", ...ALL_TRACKS];
const GRADES = ["All Grades", "Grade 11", "Grade 12"];

export default function VoterManagement() {
  const { selectedElection } = useElection();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState("All Tracks");
  const [grade, setGrade] = useState("All Grades");
  const [search, setSearch] = useState("");
  const [showAddVoter, setShowAddVoter] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingVoter, setEditingVoter] = useState(null);
  const [trigger, setTrigger] = useState(0);

  const loadData = async () => {
    if (!selectedElection) {
      setVoters([]);
      setLoading(false);
      return;
    }
    try {
      const data = await base44.entities.Voter.filter({
        election_id: selectedElection.id,
      });
      setVoters(data);
    } catch {
      setVoters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedElection?.id, trigger]);

  const handleDelete = async (voter) => {
    await base44.entities.Voter.delete(voter.id);
    await logAction(
      "VOTER_REMOVED",
      `Removed voter ${voter.name} (${voter.user_id})`,
      selectedElection?.id
    );
    setTrigger((t) => t + 1);
  };

  const handleReset = async (voter) => {
    if (
      !window.confirm(
        `Reset ${voter.name}'s password? They will need to request a new OTP and set a new password on next login.`
      )
    )
      return;
    await base44.entities.Voter.update(voter.id, {
      password: "",
      password_changed: false,
    });
    await logAction(
      "VOTER_PASSWORD_RESET",
      `Reset password for voter ${voter.name} (${voter.user_id})`,
      selectedElection?.id
    );
    setTrigger((t) => t + 1);
  };

  const filtered = voters.filter((v) => {
    if (track !== "All Tracks" && v.track !== track) return false;
    if (grade !== "All Grades" && v.grade !== grade) return false;
    if (search && !v.email?.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const votedCount = voters.filter((v) => v.has_voted).length;

  if (!selectedElection) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Please select an active election to manage voters.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title="Voters List"
        subtitle={`Managing voters for ${selectedElection.title}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Voters" value={voters.length} delay={0.05} />
        <StatCard label="Voters Who Voted" value={votedCount} delay={0.1} />
        <StatCard
          label="Voters Who Haven't Voted"
          value={voters.length - votedCount}
          accent="red"
          delay={0.15}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Voter Records</h3>
          <div className="flex items-center gap-2">
            <ActionButton icon={Plus} onClick={() => setShowAddVoter(true)}>
              Add Voter
            </ActionButton>
            <ActionButton
              variant="outline"
              icon={Upload}
              onClick={() => setShowImport(true)}
            >
              Import CSV
            </ActionButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Search
            </p>
            <input
              type="text"
              placeholder="Search by email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
            />
          </div>
          <Dropdown
            label="Track"
            value={track}
            onChange={setTrack}
            options={TRACKS}
            placeholder="All Tracks"
          />
          <Dropdown
            label="Grade"
            value={grade}
            onChange={setGrade}
            options={GRADES}
            placeholder="All Grades"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No voters found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "User ID",
                    "Name",
                    "Email",
                    "Track",
                    "Grade",
                    "Section",
                    "Status",
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
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-gray-600 font-mono">
                      {v.user_id}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {v.name}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {v.email}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {v.track}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {v.grade}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {v.section}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        status={v.has_voted ? "voted" : "pending"}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingVoter(v)}
                          title="Edit voter"
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleReset(v)}
                          title="Reset password"
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(v)}
                          title="Remove voter"
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AddVoterModal
        open={showAddVoter}
        onClose={() => setShowAddVoter(false)}
        onSuccess={() => setTrigger((t) => t + 1)}
        electionId={selectedElection.id}
      />
      <ImportVotersModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => setTrigger((t) => t + 1)}
        electionId={selectedElection.id}
      />
      <EditVoterModal
        open={!!editingVoter}
        onClose={() => setEditingVoter(null)}
        onSuccess={() => setTrigger((t) => t + 1)}
        voter={editingVoter}
      />
    </div>
  );
}