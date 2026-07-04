import { base44 } from "@/lib/localStore";
import { GRADES, TRACKS_BY_GRADE } from "@/lib/trackConfig";

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

// Only known grade levels pass through; anything else stored in the grade
// field (e.g. an email from a misaligned CSV import) becomes "Unknown" so
// it never pollutes the by-grade breakdowns or bar charts.
function normalizeGrade(raw) {
  const g = (raw || "").toString().trim();
  return GRADES.includes(g) ? g : "Unknown";
}

export async function computeElectionResults(electionId) {
  try {
    const [voters, candidates, votes, parties] = await Promise.all([
      base44.entities.Voter.filter({ election_id: electionId }),
      base44.entities.Candidate.filter({ election_id: electionId }),
      base44.entities.Vote.filter({ election_id: electionId }),
      base44.entities.Party.filter({ election_id: electionId }),
    ]);
  
    const totalVoters = voters.length;
    const votedCount = voters.filter((v) => v.has_voted).length;
  
    const voteCounts = {};

    const candidateMap = Object.fromEntries(
      candidates.map((c) => [c.id, c])
    );

    const positionVoters = {};

    const posKey = (c) =>
      c.position === "board_member"
        ? `board_member|${c.grade}|${c.track}`
        : c.position;

    votes.forEach((v) => {
      let candidateIds = v.candidate_ids;

      if (typeof candidateIds === "string") {
        try {
          candidateIds = JSON.parse(candidateIds);
        } catch {
          candidateIds = [];
        }
      }

      if (!Array.isArray(candidateIds)) {
        candidateIds = candidateIds ? [candidateIds] : [];
      }

      candidateIds.forEach((cid) => {
        voteCounts[cid] = (voteCounts[cid] || 0) + 1;

        const c = candidateMap[cid];
        if (!c) return;

        const key = posKey(c);

        if (!positionVoters[key]) {
          positionVoters[key] = new Set();
        }

        positionVoters[key].add(v.voter_id);
      });
    });
    
    const partyName = (partyId) =>
      parties.find((p) => p.id === partyId)?.name || "Independent";
  
    const buildCandidateResults = (posCandidates, eligibleVoters) =>
      posCandidates
        .map((c) => ({
          candidate: c,
          votes: voteCounts[c.id] || 0,
          percentage:
            eligibleVoters > 0
              ? ((voteCounts[c.id] || 0) / eligibleVoters) * 100
              : 0,
        }))
        .sort((a, b) => b.votes - a.votes);
  
    const regularWinners = REGULAR_POSITIONS.map((pos) => {
      const posCandidates = candidates.filter((c) => c.position === pos);
      const eligibleVoters = totalVoters;
      const votedForPosition = positionVoters[pos]?.size || 0;
      const candidateResults = buildCandidateResults(
        posCandidates,
        eligibleVoters
      );
      const top = candidateResults[0];
      const winner = top && top.votes > 0 ? top.candidate : null;
      return {
        position: pos,
        label: POSITION_LABELS[pos],
        winner,
        votes: top ? top.votes : 0,
        candidates: posCandidates,
        candidateResults,
        eligibleVoters,
        votedForPosition,
        abstained: eligibleVoters - votedForPosition,
      };
    });
  
    const boardWinners = GRADES.flatMap((grade) =>
      (TRACKS_BY_GRADE[grade] || []).map((track) => {
        const slotCandidates = candidates.filter(
          (c) =>
            c.position === "board_member" &&
            c.track === track &&
            c.grade === grade
        );
        const eligibleVoters = voters.filter(
          (v) => v.track === track && v.grade === grade
        ).length;
        const votedForPosition =
          positionVoters[`board_member|${grade}|${track}`]?.size || 0;
        const candidateResults = buildCandidateResults(
          slotCandidates,
          eligibleVoters
        );
        const top = candidateResults[0];
        const winner = top && top.votes > 0 ? top.candidate : null;
        return {
          track,
          grade,
          winner,
          votes: top ? top.votes : 0,
          candidates: slotCandidates,
          candidateResults,
          eligibleVoters,
          votedForPosition,
          abstained: eligibleVoters - votedForPosition,
        };
      })
    ).filter((b) => b.candidates.length > 0);
  
    const byTrack = {};
    const byGrade = {};
    const bySection = {};
    const byTrackSection = {};
    voters.forEach((v) => {
      const t = v.track || "Unknown";
      const g = normalizeGrade(v.grade);
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

  } catch (error) {
    console.error("Error computing election results:", error);
    throw error;
  }
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
  Object.entries(results.stats.byTrackSection).forEach(([, data]) => {
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

  text += "POSITION-BY-POSITION RESULTS\n";
  text += "------------------------------\n\n";

  const writePosition = (label, data) => {
    text += `${label}\n`;
    text += `${"-".repeat(label.length)}\n`;
    text += `Eligible Voters: ${data.eligibleVoters}\n`;
    text += `Voted for this position: ${data.votedForPosition}\n`;
    text += `Abstained: ${data.abstained}\n\n`;
    if (data.winner) {
      text += `Winner: ${data.winner.name} (${results.partyName(
        data.winner.party_id
      )}) — ${data.votes} votes\n\n`;
    } else {
      text += `Winner: None\n\n`;
    }
    if (data.candidateResults.length === 0) {
      text += "No candidates.\n\n";
    } else {
      data.candidateResults.forEach((cr, idx) => {
        const mark = idx === 0 && cr.votes > 0 && data.winner ? "★ " : "  ";
        text += `${mark}${cr.candidate.name} (${results.partyName(
          cr.candidate.party_id
        )}): ${cr.votes} votes (${cr.percentage.toFixed(1)}%)\n`;
      });
      text += "\n";
    }
    text += "\n";
  };

  results.regularWinners.forEach((w) => {
    writePosition(w.label, w);
  });
  results.boardWinners.forEach((b) => {
    writePosition(`Board Member — ${b.grade} ${b.track}`, b);
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${election.title.replace(/[^a-zA-Z0-9]/g, "_")}_results.txt`;
  a.click();
  URL.revokeObjectURL(url);
}