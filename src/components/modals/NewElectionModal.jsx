import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { useElection } from "@/components/dashboard/ElectionContext";
import { GRADES } from "@/lib/trackConfig";

export default function NewElectionModal({ open, onClose }) {
  const { refresh } = useElection();
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [enableGradeWindows, setEnableGradeWindows] = useState(false);
  const [gradeWindows, setGradeWindows] = useState({
    "Grade 11": { start: "", end: "" },
    "Grade 12": { start: "", end: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setStartDateTime("");
    setEndDateTime("");
    setEnableGradeWindows(false);
    setGradeWindows({
      "Grade 11": { start: "", end: "" },
      "Grade 12": { start: "", end: "" },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title) {
      setError("Please enter an election title.");
      return;
    }
    setLoading(true);
    try {
      let electionStart = null;
      let electionEnd = null;
      let grade_voting_windows = [];

      if (enableGradeWindows) {
        const windows = GRADES.map((grade) => {
          const w = gradeWindows[grade];
          if (!w.start || !w.end) return null;
          return {
            grade,
            start_date_time: new Date(w.start).toISOString(),
            end_date_time: new Date(w.end).toISOString(),
          };
        }).filter(Boolean);

        if (windows.length === 0) {
          setError("Please provide start and end times for at least one grade.");
          setLoading(false);
          return;
        }
        // Validate each window's end is after start.
        for (const w of windows) {
          if (new Date(w.end_date_time) <= new Date(w.start_date_time)) {
            setError(`${w.grade}: end time must be after start time.`);
            setLoading(false);
            return;
          }
        }
        grade_voting_windows = windows;
        const starts = windows.map((w) => new Date(w.start_date_time).getTime());
        const ends = windows.map((w) => new Date(w.end_date_time).getTime());
        electionStart = new Date(Math.min(...starts)).toISOString();
        electionEnd = new Date(Math.max(...ends)).toISOString();
      } else {
        if (!startDateTime || !endDateTime) {
          setError("Please provide start and end date/time.");
          setLoading(false);
          return;
        }
        electionStart = new Date(startDateTime).toISOString();
        electionEnd = new Date(endDateTime).toISOString();
      }

      const election = await base44.entities.Election.create({
        title,
        status: "preparing",
        start_date_time: electionStart,
        end_date_time: electionEnd,
        grade_voting_windows,
      });
      await logAction(
        "CREATED ELECTION",
        `Created election "${title}"`,
        election.id
      );
      await refresh();
      reset();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create election");
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
      title="New Election"
      subtitle="Create a new election — it starts in Preparing status"
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

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableGradeWindows}
              onChange={(e) => setEnableGradeWindows(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/20"
            />
            <span className="text-sm font-medium text-gray-700">
              Restrict voting times by grade level
            </span>
          </label>
          <p className="text-xs text-gray-400 mt-1 ml-6">
            {enableGradeWindows
              ? "Set a separate start & end date/time for each grade. The overall election window is derived from these."
              : "Set one start & end date/time for the whole election."}
          </p>
        </div>

        {!enableGradeWindows && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
        )}

        {enableGradeWindows && (
          <div className="space-y-4">
            {GRADES.map((grade) => (
              <div key={grade} className="border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {grade}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Start Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={gradeWindows[grade].start}
                      onChange={(e) =>
                        setGradeWindows((prev) => ({
                          ...prev,
                          [grade]: { ...prev[grade], start: e.target.value },
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                      End Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={gradeWindows[grade].end}
                      onChange={(e) =>
                        setGradeWindows((prev) => ({
                          ...prev,
                          [grade]: { ...prev[grade], end: e.target.value },
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              Leave a grade blank to allow it to vote any time during the
              overall window.
            </p>
          </div>
        )}

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
            "Create Election"
          )}
        </motion.button>
      </form>
    </Modal>
  );
}