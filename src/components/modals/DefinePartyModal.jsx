import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";

export default function DefinePartyModal({
  open,
  onClose,
  onSuccess,
  electionId,
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.Party.create({
        name,
        election_id: electionId,
      });
      await logAction(
        "DEFINED PARTY",
        `Defined party "${name}"`,
        electionId
      );
      setName("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to define party");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Define Party"
      subtitle="Add a new party for this election"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Party Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alpha Party"
            required
            autoFocus
            className="w-full h-11 px-3 mt-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
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
              <Loader2 className="w-4 h-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create Party"
          )}
        </motion.button>
      </form>
    </Modal>
  );
}