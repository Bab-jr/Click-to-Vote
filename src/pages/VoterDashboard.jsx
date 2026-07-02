import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/lib/localStore";
import StatusPill from "@/components/dashboard/StatusPill";
import Modal from "@/components/dashboard/Modal";
import { format } from "date-fns";
import { Vote, Clock, CheckCircle2, ChevronRight } from "lucide-react";

function getTimeRemaining(election) {
  if (!election.end_date_time) return "—";
  const now = new Date();
  const start = election.start_date_time ? new Date(election.start_date_time) : null;
  const end = new Date(election.end_date_time);

  if (election.status === "finished" || now > end) return "Ended";
  if (start && now < start) {
    const diff = start - now;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `Starts in ${days}d ${hours}h`;
    return `Starts in ${hours}h`;
  }
  const diff = end - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function VoterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [showVotedPopup, setShowVotedPopup] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const voterRecords = await base44.entities.Voter.filter({
          email: user.email,
        });
        const electionIds = voterRecords.map((v) => v.election_id);
        const elections = await base44.entities.Election.list();
        const assigned = electionIds
          .map((eid) => {
            const election = elections.find((e) => e.id === eid);
            if (!election) return null;
            const voterRecord = voterRecords.find((v) => v.election_id === eid);
            return { election, hasVoted: voterRecord?.has_voted };
          })
          .filter(Boolean);
        setAssignments(assigned);

        const allVoted =
          assigned.length > 0 && assigned.every((a) => a.hasVoted);
        if (allVoted) setShowVotedPopup(true);
      } catch {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const canVote = (assignment) =>
    assignment.election.status === "ongoing" && !assignment.hasVoted;

  if (user?.type === "voter" && (!user.track || !user.section)) {
    return <Navigate to="/confirm-info" replace />;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(" ")[0] || "Voter"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Your assigned elections are listed below. Click an active election to
          cast your vote.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-16 text-center"
        >
          <Vote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            You have no assigned elections yet. Please check back later.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment, idx) => (
            <motion.div
              key={assignment.election.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <button
                onClick={() =>
                  canVote(assignment)
                    ? navigate(`/vote/${assignment.election.id}`)
                    : null
                }
                disabled={!canVote(assignment)}
                className={`w-full text-left bg-white rounded-xl border overflow-hidden transition-all ${
                  canVote(assignment)
                    ? "border-gray-200 hover:border-brand/40 hover:shadow-md cursor-pointer"
                    : "border-gray-200 cursor-default"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <StatusPill status={assignment.election.status} />
                    {assignment.hasVoted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Voted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        Not Voted
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {assignment.election.title}
                  </h3>
                  {assignment.election.school_year && (
                    <p className="text-xs text-gray-500 mb-3">
                      School Year {assignment.election.school_year}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{getTimeRemaining(assignment.election)}</span>
                  </div>
                  {canVote(assignment) && (
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand">
                      Click to Vote
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={showVotedPopup}
        onClose={() => setShowVotedPopup(false)}
        title="Vote Submitted"
        maxWidth="max-w-md"
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            You've already voted!
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Thank you for participating. Your vote has been recorded. Please
            wait for the election results to be published.
          </p>
          <button
            onClick={() => setShowVotedPopup(false)}
            className="mt-6 w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}