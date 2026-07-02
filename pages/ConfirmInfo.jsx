import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Vote, GraduationCap, Layers, Loader2, CheckCircle2 } from "lucide-react";
import { getTracksForGrade } from "@/lib/trackConfig";

export default function ConfirmInfo() {
  const { user, updateVoterInfo } = useAuth();
  const navigate = useNavigate();

  const [track, setTrack] = useState(user?.track || "");
  const [section, setSection] = useState(user?.section || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only voters confirm their track & section.
  if (!user || user.type !== "voter") {
    return <Navigate to="/" replace />;
  }
  // Already confirmed — nothing to do.
  if (user.track && user.section) {
    return <Navigate to="/vote" replace />;
  }

  const tracks = getTracksForGrade(user.grade);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!track) {
      setError("Please select your track.");
      return;
    }
    if (!section.trim()) {
      setError("Please enter your section.");
      return;
    }
    setLoading(true);
    try {
      await updateVoterInfo(user.id, { track, section: section.trim() });
      window.location.href = "/vote";
    } catch (err) {
      setError(err.message || "Failed to save your information.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300";

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Confirm Your Information
                </h1>
                <p className="text-blue-200 text-sm">
                  Select your track and section to continue
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Cluster
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.cluster || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Grade
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.grade || "—"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Track</label>
                {tracks.length > 0 ? (
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select your track
                    </option>
                    {tracks.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    placeholder="Enter your track"
                    required
                    className={inputClass}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Enter your section"
                  required
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Continue to Voting
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}