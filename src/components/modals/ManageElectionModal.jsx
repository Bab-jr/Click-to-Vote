import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";

function toDateTimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function ManageElectionModal({
  open,
  onClose,
  onSuccess,
  election,
}) {
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [extendedEndDateTime, setExtendedEndDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (election && open) {
      setTitle(election.title || "");
      setStartDateTime(toDateTimeLocal(election.start_date_time));
      setEndDateTime(toDateTimeLocal(election.end_date_time));
      setExtendedEndDateTime(toDateTimeLocal(election.extended_end_date_time));
      setError("");
    }
  }, [election, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const updates = { title };
      if (startDateTime)
        updates.start_date_time = new Date(startDateTime).toISOString();
      if (endDateTime)
        updates.end_date_time = new Date(endDateTime).toISOString();
      if (extendedEndDateTime)
        updates.extended_end_date_time = new Date(
          extendedEndDateTime
        ).toISOString();
      else updates.extended_end_date_time = null;
      await base44.entities.Election.update(election.id, updates);
      await logAction(
        "ELECTION_UPDATED",
        `Updated election "${title}"`,
        election.id
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update election");
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
      title="Manage Election"
      subtitle="Edit election details"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Election Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter election title"
            required
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Start Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            required
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            End Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            required
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Extended End Date &amp; Time (optional)
          </label>
          <input
            type="datetime-local"
            value={extendedEndDateTime}
            onChange={(e) => setExtendedEndDateTime(e.target.value)}
            className={`${inputClass} mt-1.5`}
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