import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import Modal from "@/components/dashboard/Modal";
import { POSITION_LABELS, REGULAR_POSITIONS, TRACKS } from "@/lib/resultsHelper";
import {
  ArrowLeft,
  Clock,
  Mail,
  User,
  GraduationCap,
  Layers,
  Check,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function formatTimeLeft(endDateTime) {
  const diff = new Date(endDateTime) - new Date();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatTimeOfDay(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, "0")} ${period}`;
}

function SelectableCandidateCard({
  candidate,
  partyName,
  selected,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
        selected
          ? "border-brand bg-brand/5"
          : "border-gray-200 hover:border-brand/40 hover:bg-brand/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {candidate.photo ? (
          <img
            src={candidate.photo}
            alt={candidate.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-brand/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {candidate.name}
          </p>
          <p className="text-xs text-gray-500">{partyName}</p>
          <p className="text-xs text-gray-400">
            {candidate.grade}
            {candidate.track ? ` · ${candidate.track}` : ""}
          </p>
          {candidate.motto && (
            <p className="text-xs text-gray-500 italic mt-1 truncate">
              "{candidate.motto}"
            </p>
          )}
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selected ? "border-brand bg-brand" : "border-gray-300"
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
      {candidate.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {candidate.description}
        </p>
      )}
    </button>
  );
}

export default function VotingScreen() {
  const { electionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [voterRecord, setVoterRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.email || !electionId) {
        setLoading(false);
        return;
      }
      try {
        const [electionData, candidatesData, partiesData, voterRecords] =
          await Promise.all([
            base44.entities.Election.get(electionId),
            base44.entities.Candidate.filter({ election_id: electionId }),
            base44.entities.Party.filter({ election_id: electionId }),
            base44.entities.Voter.filter({
              email: user.email,
              election_id: electionId,
            }),
          ]);
        setElection(electionData);
        setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
        setParties(Array.isArray(partiesData) ? partiesData : []);
        setVoterRecord(voterRecords[0] || null);
      } catch (err) {
        setElection(null);
        setLoadError(err?.message || "Could not load this election.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email, electionId]);

  if (user?.type !== "voter") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!election || !voterRecord) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            {loadError
              ? `Could not load this election: ${loadError}`
              : "You are not assigned to this election."}
          </p>
          <button
            onClick={() => navigate("/vote")}
            className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Back to Elections
          </button>
        </div>
      </div>
    );
  }

  if (voterRecord.has_voted) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            You have already voted in this election.
          </p>
          <button
            onClick={() => navigate("/vote")}
            className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Back to Elections
          </button>
        </div>
      </div>
    );
  }

  if (election.status !== "ongoing") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            This election is currently {election.status}. Voting is not
            available at this time.
          </p>
          <button
            onClick={() => navigate("/vote")}
            className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Back to Elections
          </button>
        </div>
      </div>
    );
  }

  let gradeWindows = [];

  if (Array.isArray(election.grade_voting_windows)) {
    gradeWindows = election.grade_voting_windows;
  } else if (typeof election.grade_voting_windows === "string") {
    try {
      gradeWindows = JSON.parse(election.grade_voting_windows);
    } catch {
      gradeWindows = [];
    }
  }

  const gradeWindow = gradeWindows.find(
    (w) => w.grade === voterRecord.grade
  );

  if (gradeWindow && gradeWindow.start_date_time && gradeWindow.end_date_time) {
    const startMs = new Date(gradeWindow.start_date_time).getTime();
    const endMs = new Date(gradeWindow.end_date_time).getTime();
    if (now < startMs || now > endMs) {
      return (
        <div className="p-6 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Voting for {voterRecord.grade} opens{" "}
              <span className="font-medium text-gray-900">
                {new Date(gradeWindow.start_date_time).toLocaleString()}
              </span>{" "}
              and closes{" "}
              <span className="font-medium text-gray-900">
                {new Date(gradeWindow.end_date_time).toLocaleString()}
              </span>
              .
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Please come back during your scheduled voting window.
            </p>
            <button
              onClick={() => navigate("/vote")}
              className="mt-4 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              Back to Elections
            </button>
          </div>
        </div>
      );
    }
  }

  const partyName = (partyId) =>
    parties.find((p) => p.id === partyId)?.name || "Independent";

  const toggleSelect = (position, candidateId) => {
    setSelected((prev) => ({
      ...prev,
      [position]: prev[position] === candidateId ? null : candidateId,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const candidate_ids = Object.values(selected).filter(Boolean);
      await base44.entities.Vote.create({
        voter_id: voterRecord.id,
        election_id: electionId,
        candidate_ids,
      });
      await base44.entities.Voter.update(voterRecord.id, { has_voted: true });
      await logAction(
        "VOTE_CAST",
        `Voter ${user.name} cast their ballot`,
        electionId
      );
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      setSubmitError(
        err?.message || "Failed to submit your vote. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const positionsToShow = REGULAR_POSITIONS.filter((pos) =>
    candidates.some((c) => c.position === pos)
  );
  const voterTrack = voterRecord.track;
  const voterGrade = voterRecord.grade;
  const boardCandidates = candidates.filter(
    (c) =>
      c.position === "board_member" &&
      c.track === voterTrack &&
      c.grade === voterGrade
  );
  const showBoardMembers = boardCandidates.length > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/vote")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Elections
      </button>

      {/* Voter Info Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{election.title}</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
            <Clock className="w-4 h-4" />
            {formatTimeLeft(election.end_date_time)}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Name
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Email
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Track
              </p>
              <p className="text-sm font-medium text-gray-900">
                {voterRecord.track || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Grade
              </p>
              <p className="text-sm font-medium text-gray-900">
                {voterRecord.grade || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Section
              </p>
              <p className="text-sm font-medium text-gray-900">
                {voterRecord.section || "—"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Candidates */}
      <div className="space-y-6">
        {positionsToShow.map((pos, idx) => {
          const posCandidates = candidates.filter((c) => c.position === pos);
          return (
            <motion.div
              key={pos}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                {POSITION_LABELS[pos]}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {posCandidates.map((c) => (
                  <SelectableCandidateCard
                    key={c.id}
                    candidate={c}
                    partyName={partyName(c.party_id)}
                    selected={selected[pos] === c.id}
                    onSelect={() => toggleSelect(pos, c.id)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}

        {showBoardMembers && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: positionsToShow.length * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <h3 className="text-sm font-bold text-gray-900">
              Board Member — {voterTrack} Track
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">
              Only candidates from your track are shown.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boardCandidates.map((c) => (
                <SelectableCandidateCard
                  key={c.id}
                  candidate={c}
                  partyName={partyName(c.party_id)}
                  selected={selected["board_member"] === c.id}
                  onSelect={() => toggleSelect("board_member", c.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {positionsToShow.length === 0 && !showBoardMembers && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">
              No candidates have been added to this election yet.
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      {positionsToShow.length > 0 || showBoardMembers ? (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowConfirm(true)}
            className="px-6 py-3 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 transition-colors"
          >
            Submit Vote
          </button>
        </div>
      ) : null}

      {/* Confirmation Modal */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Your Vote"
        subtitle="This action cannot be undone"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to submit your ballot. Please review your selections:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
            {REGULAR_POSITIONS.map((pos) =>
              selected[pos] ? (
                <div
                  key={pos}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-500">{POSITION_LABELS[pos]}</span>
                  <span className="font-medium text-gray-900">
                    {candidates.find((c) => c.id === selected[pos])?.name}
                  </span>
                </div>
              ) : null
            )}
            {selected["board_member"] && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Board Member</span>
                <span className="font-medium text-gray-900">
                  {
                    candidates.find((c) => c.id === selected["board_member"])
                      ?.name
                  }
                </span>
              </div>
            )}
            {Object.values(selected).every((v) => !v) && (
              <p className="text-sm text-gray-400 text-center">
                No selections made — you will abstain from all positions.
              </p>
            )}
          </div>
          {submitError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {submitError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={submitting}
              className="flex-1 h-11 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Confirm & Submit"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={showSuccess}
        onClose={() => navigate("/vote")}
        maxWidth="max-w-md"
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Vote Submitted!
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Thank you for voting, {user?.name?.split(" ")[0] || "Voter"}. Your
            ballot has been recorded successfully.
          </p>
          <button
            onClick={() => navigate("/vote")}
            className="mt-6 w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 transition-colors"
          >
            Back to Elections
          </button>
        </div>
      </Modal>
    </div>
  );
}