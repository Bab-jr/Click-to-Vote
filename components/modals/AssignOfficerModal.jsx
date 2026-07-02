import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import SearchableSelect from "@/components/dashboard/SearchableSelect";
import Combobox from "@/components/dashboard/Combobox";
import Dropdown from "@/components/dashboard/Dropdown";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { useAuth } from "@/lib/AuthContext";
import { CLUSTERS, GRADES, getTracksForGrade } from "@/lib/trackConfig";

const ALL_ROLES = ["Admin", "Adviser", "Officer"];

export default function AssignOfficerModal({
  open,
  onClose,
  onSuccess,
  electionId,
  voters,
}) {
  const [selectedVoterName, setSelectedVoterName] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [cluster, setCluster] = useState("");
  const [track, setTrack] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [role, setRole] = useState("Officer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const isAdviser = user?.role === "adviser";
  const availableRoles = isAdviser ? ["Adviser", "Officer"] : ALL_ROLES;

  const voterOptions = voters.map((v) => ({
    value: v.id,
    label: `${v.name} (${v.user_id})`,
    data: v,
  }));

  const handleVoterSelect = (option) => {
    const v = option.data;
    setSelectedVoterName(v.name);
    setName(v.name);
    setUserId(v.user_id || "");
    setEmail(v.email || "");
    setCluster(v.cluster || "");
    setTrack(v.track || "");
    setGrade(v.grade || "");
    setSection(v.section || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.Officer.create({
        user_id: userId,
        name,
        email,
        password: "",
        password_changed: false,
        cluster,
        track,
        grade,
        section,
        role: role.toLowerCase(),
        election_id: electionId,
      });
      await logAction(
        "ASSIGNED OFFICER",
        `Assigned ${name} as ${role}`,
        electionId
      );
      setSelectedVoterName("");
      setName("");
      setUserId("");
      setEmail("");
      setCluster("");
      setTrack("");
      setGrade("");
      setSection("");
      setRole("Officer");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign officer");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all";

  const labelClass =
    "text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign to Election"
      subtitle="Select a voter or enter officer details manually"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        <SearchableSelect
          label="Select a Voter (optional)"
          options={voterOptions}
          value={selectedVoterName}
          onChange={handleVoterSelect}
          placeholder="Type to search voters…"
        />
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Student / Personnel ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="XX-XXXX"
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@school.edu"
              required
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Combobox
              label="Cluster"
              value={cluster}
              onChange={setCluster}
              options={CLUSTERS}
              placeholder="Select"
            />
            <Combobox
              label="Grade"
              value={grade}
              onChange={(val) => {
                setGrade(val);
                setTrack("");
              }}
              options={GRADES}
              placeholder="Select"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Combobox
              label="Track"
              value={track}
              onChange={setTrack}
              options={getTracksForGrade(grade)}
              placeholder={grade ? "Select" : "Select grade first"}
            />
            <div>
              <label className={labelClass}>Section</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section"
                className={inputClass}
              />
            </div>
          </div>
          <Dropdown
            label="Role"
            value={role}
            onChange={setRole}
            options={availableRoles}
            placeholder="Select role"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Assigning…
            </>
          ) : (
            "Assign to Election"
          )}
        </motion.button>
      </form>
    </Modal>
  );
}