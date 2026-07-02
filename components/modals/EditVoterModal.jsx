import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import Combobox from "@/components/dashboard/Combobox";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { CLUSTERS, GRADES, getTracksForGrade } from "@/lib/trackConfig";

export default function EditVoterModal({ open, onClose, onSuccess, voter }) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cluster, setCluster] = useState("");
  const [grade, setGrade] = useState("");
  const [track, setTrack] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && voter) {
      setUserId(voter.user_id || "");
      setName(voter.name || "");
      setEmail(voter.email || "");
      setCluster(voter.cluster || "");
      setGrade(voter.grade || "");
      setTrack(voter.track || "");
      setSection(voter.section || "");
      setError("");
    }
  }, [open, voter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.Voter.update(voter.id, {
        user_id: userId,
        name,
        email,
        cluster,
        grade,
        track,
        section,
      });
      await logAction(
        "EDITED VOTER",
        `Edited voter "${name}" (${userId})`,
        voter.election_id
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update voter");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Voter"
      subtitle={voter ? voter.name : ""}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              Section
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </motion.button>
      </form>
    </Modal>
  );
}