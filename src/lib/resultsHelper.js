import { base44 } from "@/api/base44Client";

export const POSITION_LABELS = {
  governor: "Governor",
  vice_governor: "Vice Governor",
  secretary: "Secretary",
  treasurer: "Treasurer",
  auditor: "Auditor",
  pio: "P.I.O",
  po: "P.O",
  board_member: "Board Member",
};

export const REGULAR_POSITIONS = [
  "governor",
  "vice_governor",
  "secretary",
  "treasurer",
  "auditor",
  "pio",
  "po",
];

export const TRACKS = [
  "Sports, Wellness and Health",
  "Creative Arts and Design Technologies",
  "Hospitality and Tourism",
  "ICT Support and Computer Programming",
  "ICT",
  "H.E",
  "ASSH",
  "B.E",
  "BioMed",
  "Engineering",
];

export async function computeElectionResults(electionId) {
  try {
    const voters = await base44.entities.Voter.filter({
        election_id: electionId,
      });
      console.log("voters", voters);

      const candidates = await base44.entities.Candidate.filter({
        election_id: electionId,
      });
      console.log("candidates", candidates);

      const votes = await base44.entities.Vote.filter({
        election_id: electionId,
      });
      console.log("votes", votes);

      const parties = await base44.entities.Party.filter({
        election_id: electionId,
      });
      console.log("parties", parties);

      const voteCounts = {};
      votes.forEach((w) => {
      let candidateIds = w.candidate_ids || [];

      // MySQL stores arrays as JSON strings
      if (typeof candidateIds === "string") {
        try {
          candidateIds = JSON.parse(candidateIds);
        } catch {
          candidateIds = [];
        }
      }

      if (!Array.isArray(candidateIds)) {
        candidateIds = [];
      }

      candidateIds.forEach((cid) => {
        voteCounts[cid] = (voteCounts[cid] || 0) + 1;
      });
    });
  } catch (err) {
    console.error("Election results error:", err);
    console.error(err.stack);
    setResults(null);
  }

  const partyName = (partyId) =>
    parties.find((p) => p.id === partyId)?.name || "Independent";

  const regularWinners = REGULAR_POSITIONS.map((pos) => {
    const posCandidates = candidates.filter((c) => c.position === pos);
    let maxVotes = 0;
    let winner = null;
    posCandidates.forEach((c) => {
      const count = voteCounts[c.id] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        winner = c;
      }
    });
    return {
      position: pos,
      label: POSITION_LABELS[pos],
      winner,
      votes: maxVotes,
      candidates: posCandidates,
    };
  });

  const boardWinners = TRACKS.map((track) => {
    const trackCandidates = candidates.filter(
      (c) => c.position === "board_member" && c.track === track
    );
    let maxVotes = 0;
    let winner = null;
    trackCandidates.forEach((c) => {
      const count = voteCounts[c.id] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        winner = c;
      }
    });
    return { track, winner, votes: maxVotes, candidates: trackCandidates };
  }).filter((b) => b.candidates.length > 0);

  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.has_voted).length;

  const byTrack = {};
  const byGrade = {};
  const bySection = {};
  const byTrackSection = {};
  voters.forEach((v) => {
    const t = v.track || "Unknown";
    const g = v.grade || "Unknown";
    const s = v.section || "Unknown";
    if (!byTrack[t]) byTrack[t] = { total: 0, voted: 0 };
    if (!byGrade[g]) byGrade[g] = { total: 0, voted: 0 };
    if (!bySection[s]) bySection[s] = { total: 0, voted: 0 };
    byTrack[t].total++;
    byGrade[g].total++;
    bySection[s].total++;
    const tsKey = `${t}|${s}`;
    if (!byTrackSection[tsKey])
      byTrackSection[tsKey] = { track: t, section: s, total: 0, voted: 0 };
    byTrackSection[tsKey].total++;
    if (v.has_voted) {
      byTrack[t].voted++;
      byGrade[g].voted++;
      bySection[s].voted++;
      byTrackSection[tsKey].voted++;
    }
  });

  return {
    voters,
    candidates,
    votes,
    parties,
    voteCounts,
    regularWinners,
    boardWinners,
    stats: {
      totalVoters,
      votedCount,
      notVotedCount: totalVoters - votedCount,
      byTrack,
      byGrade,
      bySection,
      byTrackSection,
    },
    partyName,
  };
}

export function downloadResults(election, results) {
  let text = "";
  text += "ELECTION RESULTS\n";
  text += "================\n\n";
  text += `Title: ${election.title}\n`;
  text += `Status: ${election.status}\n`;
  text += `School Year: ${election.school_year || "N/A"}\n`;
  if (election.end_date_time) {
    text += `End Date: ${new Date(election.end_date_time).toLocaleString()}\n`;
  }
  text += "\n";

  text += "VOTER STATISTICS\n";
  text += "----------------\n";
  text += `Total Voters: ${results.stats.totalVoters}\n`;
  text += `Voted: ${results.stats.votedCount}\n`;
  text += `Not Voted: ${results.stats.notVotedCount}\n\n`;

  text += "BY TRACK\n";
  text += "--------\n";
  Object.entries(results.stats.byTrack).forEach(([track, data]) => {
    text += `${track}: ${data.voted}/${data.total} voted\n`;
  });
  text += "\n";

  text += "BY GRADE\n";
  text += "--------\n";
  Object.entries(results.stats.byGrade).forEach(([grade, data]) => {
    text += `${grade}: ${data.voted}/${data.total} voted\n`;
  });
  text += "\n";

  text += "BY SECTION\n";
  text += "----------\n";
  Object.entries(results.stats.bySection).forEach(([section, data]) => {
    text += `${section}: ${data.voted}/${data.total} voted\n`;
  });
  text += "\n";

  text += "BY TRACK & SECTION\n";
  text += "------------------\n";
  const trackGroups = {};
  Object.entries(results.stats.byTrackSection).forEach(([key, data]) => {
    if (!trackGroups[data.track]) trackGroups[data.track] = [];
    trackGroups[data.track].push(data);
  });
  Object.entries(trackGroups).forEach(([track, sections]) => {
    text += `${track}:\n`;
    sections.forEach((s) => {
      text += `  Section ${s.section}: ${s.voted}/${s.total} voted\n`;
    });
  });
  text += "\n";

  text += "WINNING CANDIDATES\n";
  text += "------------------\n";
  results.regularWinners.forEach((w) => {
    if (w.winner) {
      text += `${w.label}: ${w.winner.name} (${results.partyName(
        w.winner.party_id
      )}) - ${w.votes} votes\n`;
    } else {
      text += `${w.label}: No winner\n`;
    }
  });
  results.boardWinners.forEach((b) => {
    if (b.winner) {
      text += `Board Member - ${b.track}: ${b.winner.name} (${results.partyName(
        b.winner.party_id
      )}) - ${b.votes} votes\n`;
    }
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${election.title.replace(/[^a-zA-Z0-9]/g, "_")}_results.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
