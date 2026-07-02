import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCheck, Plus, Trash2, User, Loader2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusPill from "@/components/dashboard/StatusPill";
import ActionButton from "@/components/dashboard/ActionButton";
import CandidateCard from "@/components/dashboard/CandidateCard";
import DefinePartyModal from "@/components/modals/DefinePartyModal";
import AddCandidateModal from "@/components/modals/AddCandidateModal";
import EditCandidateModal from "@/components/modals/EditCandidateModal";
import { useElection } from "@/components/dashboard/ElectionContext";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { GRADES, TRACKS_BY_GRADE } from "@/lib/trackConfig";

const REGULAR_POSITIONS = [
  { value: "governor", label: "Governor" },
  { value: "vice_governor", label: "Vice Governor" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "auditor", label: "Auditor" },
  { value: "pio", label: "P.I.O" },
  { value: "po", label: "P.O" },
];

const BOARD_MEMBER_POSITION = {
  value: "board_member",
  label: "Board Member",
};

export default function CandidateManagement() {
  const { selectedElection } = useElection();
  const [parties, setParties] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDefineParty, setShowDefineParty] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const [modalParty, setModalParty] = useState(null);
  const [modalTrack, setModalTrack] = useState(null);
  const [modalGrade, setModalGrade] = useState(null);
  const [trigger, setTrigger] = useState(0);

  const loadData = async () => {
    if (!selectedElection) {
      setParties([]);
      setCandidates([]);
      setVoters([]);
      setLoading(false);
      return;
    }
    try {
      const [partiesData, candidatesData, votersData] = await Promise.all([
        base44.entities.Party.filter({
          election_id: selectedElection.id,
        }),
        base44.entities.Candidate.filter({
          election_id: selectedElection.id,
        }),
        base44.entities.Voter.filter({
          election_id: selectedElection.id,
        }),
      ]);
      setParties(partiesData);
      setCandidates(candidatesData);
      setVoters(votersData);
    } catch {
      setParties([]);
      setCandidates([]);
      setVoters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedElection?.id, trigger]);

  const handleRemoveCandidate = async (candidate) => {
    await base44.entities.Candidate.delete(candidate.id);
    await logAction(
      "CANDIDATE_REMOVED",
      `Removed candidate ${candidate.name} (${candidate.position})`,
      selectedElection?.id
    );
    setTrigger((t) => t + 1);
  };

  const handleRemoveParty = async (party) => {
    await base44.entities.Party.delete(party.id);
    await logAction(
      "PARTY_REMOVED",
      `Removed party "${party.name}"`,
      selectedElection?.id
    );
    setTrigger((t) => t + 1);
  };

  const openAddCandidate = (position, party, track = null, grade = null) => {
    setModalPosition(position);
    setModalParty(party);
    setModalTrack(track);
    setModalGrade(grade);
    setShowAddCandidate(true);
  };

  if (!selectedElection) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Please select an active election to manage candidates.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={UserCheck}
        title="Candidate Management"
        subtitle={`Managing ${selectedElection.title}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={selectedElection.status} />
            <ActionButton icon={Plus} onClick={() => setShowDefineParty(true)}>
              Define Party
            </ActionButton>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : parties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-12 text-center"
        >
          <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No parties defined. Click "Define Party" to get started.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Parties list */}
          <div className="flex flex-wrap items-center gap-2">
            {parties.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/5 text-brand text-sm font-medium"
              >
                {p.name}
                <button
                  onClick={() => handleRemoveParty(p)}
                  className="text-brand/50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Regular positions */}
          {REGULAR_POSITIONS.map((position, idx) => (
            <motion.div
              key={position.value}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                {position.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {parties.map((party) => {
                  const candidate = candidates.find(
                    (c) =>
                      c.position === position.value &&
                      c.party_id === party.id
                  );
                  return (
                    <CandidateCard
                      key={party.id}
                      candidate={candidate}
                      partyName={party.name}
                      onAssign={() => openAddCandidate(position, party)}
                      onRemove={handleRemoveCandidate}
                      onEdit={(c) => setEditingCandidate(c)}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Board Member — organized by track */}
          <motion.div
            key="board_member"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: REGULAR_POSITIONS.length * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <h3 className="text-sm font-bold text-gray-900">Board Member</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">
              Board members represent their track. Only voters of the same
              track can vote for their respective board member.
            </p>
            <div className="space-y-3">
              {GRADES.map((grade) =>
                (TRACKS_BY_GRADE[grade] || []).map((track) => (
                  <div
                    key={`${grade}-${track}`}
                    className="border border-gray-100 rounded-lg p-4 bg-gray-50/50"
                  >
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                      {grade} · {track}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {parties.map((party) => {
                        const candidate = candidates.find(
                          (c) =>
                            c.position === "board_member" &&
                            c.party_id === party.id &&
                            c.grade === grade &&
                            c.track === track
                        );
                        return (
                          <CandidateCard
                            key={party.id}
                            candidate={candidate}
                            partyName={party.name}
                            onAssign={() =>
                              openAddCandidate(
                                BOARD_MEMBER_POSITION,
                                party,
                                track,
                                grade
                              )
                            }
                            onRemove={handleRemoveCandidate}
                            onEdit={(c) => setEditingCandidate(c)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      <DefinePartyModal
        open={showDefineParty}
        onClose={() => setShowDefineParty(false)}
        onSuccess={() => setTrigger((t) => t + 1)}
        electionId={selectedElection.id}
      />
      {modalPosition && modalParty && (
        <AddCandidateModal
          open={showAddCandidate}
          onClose={() => setShowAddCandidate(false)}
          onSuccess={() => setTrigger((t) => t + 1)}
          electionId={selectedElection.id}
          position={modalPosition.label}
          positionValue={modalPosition.value}
          partyId={modalParty.id}
          partyName={modalParty.name}
          lockedTrack={modalTrack}
          lockedGrade={modalGrade}
          voters={voters}
        />
      )}
      <EditCandidateModal
        open={!!editingCandidate}
        onClose={() => setEditingCandidate(null)}
        onSuccess={() => setTrigger((t) => t + 1)}
        candidate={editingCandidate}
      />
    </div>
  );
}