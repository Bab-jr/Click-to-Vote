import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Trash2, Pencil, RotateCcw, Loader2, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import ActionButton from "@/components/dashboard/ActionButton";
import Dropdown from "@/components/dashboard/Dropdown";
import AssignOfficerModal from "@/components/modals/AssignOfficerModal";
import EditOfficerModal from "@/components/modals/EditOfficerModal";
import { useElection } from "@/components/dashboard/ElectionContext";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { CLUSTERS, GRADES, TRACKS } from "@/lib/trackConfig";

const ROLE_OPTIONS = ["All Roles", "Admin", "Adviser", "Officer"];
const CLUSTER_OPTIONS = ["All Clusters", ...CLUSTERS];
const GRADE_OPTIONS = ["All Grades", ...GRADES];
const TRACK_OPTIONS = ["All Tracks", ...TRACKS];

export default function OfficerManagement() {
  const { selectedElection } = useElection();
  const [officers, setOfficers] = useState([]);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [trackFilter, setTrackFilter] = useState("All Tracks");
  const [clusterFilter, setClusterFilter] = useState("All Clusters");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [trigger, setTrigger] = useState(0);

  const loadData = async () => {
    if (!selectedElection) {
      setOfficers([]);
      setVoters([]);
      setLoading(false);
      return;
    }
    try {
      const [officersData, votersData] = await Promise.all([
        base44.entities.Officer.filter({
          election_id: selectedElection.id,
        }),
        base44.entities.Voter.filter({
          election_id: selectedElection.id,
        }),
      ]);
      setOfficers(officersData);
      setVoters(votersData);
    } catch {
      setOfficers([]);
      setVoters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedElection?.id, trigger]);

  const handleDelete = async (officer) => {
    await base44.entities.Officer.delete(officer.id);
    await logAction(
      "OFFICER_REMOVED",
      `Removed officer ${officer.name} (${officer.role})`,
      selectedElection?.id
    );
    setTrigger((t) => t + 1);
  };

  const handleReset = async (officer) => {
    if (
      !window.confirm(
        `Reset ${officer.name}'s password? They will need to request a new OTP and set a new password on next login.`
      )
    )
      return;
    await base44.entities.Officer.update(officer.id, {
      password: "",
      password_changed: false,
    });
    await logAction(
      "OFFICER_PASSWORD_RESET",
      `Reset password for officer ${officer.name} (${officer.role})`,
      selectedElection?.id
    );
    setTrigger((t) => t + 1);
  };

  const filtered = officers.filter((o) => {
    if (roleFilter !== "All Roles" && o.role !== roleFilter.toLowerCase())
      return false;
    if (clusterFilter !== "All Clusters" && o.cluster !== clusterFilter)
      return false;
    if (gradeFilter !== "All Grades" && o.grade !== gradeFilter) return false;
    if (trackFilter !== "All Tracks" && o.track !== trackFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.name?.toLowerCase().includes(q) &&
        !o.email?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  if (!selectedElection) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Please select an active election to manage officers.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={ShieldCheck}
        title="Officer Management"
        subtitle={`Personnel for ${selectedElection.title}`}
        actions={
          <ActionButton onClick={() => setShowAssign(true)}>
            Assign to Election
          </ActionButton>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-5 py-4 border-b border-gray-100">
              <div className="relative">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Search
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  />
                </div>
              </div>
              <Dropdown
                label="Role"
                value={roleFilter}
                onChange={setRoleFilter}
                options={ROLE_OPTIONS}
                placeholder="All Roles"
              />
              <Dropdown
                label="Cluster"
                value={clusterFilter}
                onChange={setClusterFilter}
                options={CLUSTER_OPTIONS}
                placeholder="All Clusters"
              />
              <Dropdown
                label="Grade"
                value={gradeFilter}
                onChange={setGradeFilter}
                options={GRADE_OPTIONS}
                placeholder="All Grades"
              />
              <Dropdown
                label="Track"
                value={trackFilter}
                onChange={setTrackFilter}
                options={TRACK_OPTIONS}
                placeholder="All Tracks"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-400">
                {officers.length === 0
                  ? 'No officers assigned yet. Click "Assign to Election" to add one.'
                  : "No officers match your search."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[
                        "Name",
                        "Email",
                        "Role",
                        "Cluster / Grade / Track / Section",
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
                    {filtered.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">
                            {o.name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {o.user_id}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {o.email}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              o.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : o.role === "adviser"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-brand/10 text-brand"
                            }`}
                          >
                            {o.role?.charAt(0).toUpperCase() + o.role?.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {o.cluster || "—"} / {o.grade || "—"} /{" "}
                          {o.track || "—"} / {o.section || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingOfficer(o)}
                              title="Edit officer"
                              className="p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReset(o)}
                              title="Reset password"
                              className="p-1.5 rounded-md text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(o)}
                              title="Remove officer"
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
          </>
        )}
      </motion.div>

      <AssignOfficerModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        onSuccess={() => setTrigger((t) => t + 1)}
        electionId={selectedElection.id}
        voters={voters}
      />
      <EditOfficerModal
        open={!!editingOfficer}
        onClose={() => setEditingOfficer(null)}
        onSuccess={() => setTrigger((t) => t + 1)}
        officer={editingOfficer}
      />
    </div>
  );
}