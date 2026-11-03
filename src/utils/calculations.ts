import { Team, Round, ScoresState, TeamStanding, ShiftInfo } from '../types';

/**
 * Calculates total score for a team across specified rounds.
 */
export function getTeamTotalScore(
  teamId: string,
  rounds: Round[],
  scores: ScoresState
): number {
  let total = 0;
  for (const round of rounds) {
    const val = scores[teamId]?.[round.id];
    if (typeof val === 'number' && !isNaN(val)) {
      total += val;
    }
  }
  // Round to max 2 decimals to prevent floating point inaccuracies like 8.199999999999999
  return Math.round(total * 100) / 100;
}

/**
 * Finds the index of the latest round that contains at least one entered score.
 * Returns -1 if no scores are entered yet.
 */
export function getLatestScoredRoundIndex(
  rounds: Round[],
  teams: Team[],
  scores: ScoresState
): number {
  for (let i = rounds.length - 1; i >= 0; i--) {
    const roundId = rounds[i].id;
    const hasAnyScore = teams.some((t) => {
      const s = scores[t.id]?.[roundId];
      return typeof s === 'number' && !isNaN(s);
    });
    if (hasAnyScore) {
      return i;
    }
  }
  return -1;
}

/**
 * Computes rank map: { [teamId]: rankNumber }
 * Teams with identical scores receive the exact same rank.
 * Sorted teams are ordered by score DESC, then name ASC.
 */
export function computeRanks(
  teams: Team[],
  roundsToInclude: Round[],
  scores: ScoresState
): { sortedTeams: { team: Team; score: number }[]; rankMap: Record<string, number> } {
  const scored = teams.map((team) => ({
    team,
    score: getTeamTotalScore(team.id, roundsToInclude, scores),
  }));

  // Sort primarily by score DESC, secondarily by team name ASC (Dutch alphabetical)
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.team.name.localeCompare(b.team.name, 'nl', { sensitivity: 'base' });
  });

  const rankMap: Record<string, number> = {};
  let currentRank = 1;

  for (let i = 0; i < scored.length; i++) {
    if (i === 0) {
      rankMap[scored[i].team.id] = 1;
      currentRank = 1;
    } else {
      if (scored[i].score === scored[i - 1].score) {
        // Equal points get the same rank
        rankMap[scored[i].team.id] = rankMap[scored[i - 1].team.id];
      } else {
        // Standard competition ranking (1, 2, 2, 4)
        currentRank = i + 1;
        rankMap[scored[i].team.id] = currentRank;
      }
    }
  }

  return { sortedTeams: scored, rankMap };
}

/**
 * Generates human readable Dutch shift label and type.
 */
export function computeShiftInfo(
  currentRank: number,
  previousRank: number | null,
  isFirstRoundOrNoPrevious: boolean
): ShiftInfo {
  if (isFirstRoundOrNoPrevious || previousRank === null) {
    return {
      type: 'new',
      places: 0,
      label: 'Nieuwe stand',
      shortLabel: 'Nieuw',
    };
  }

  // A lower rank number is better (e.g. rank 1 is better than rank 3)
  const diff = previousRank - currentRank;

  if (diff > 0) {
    const text = diff === 1 ? '1 plaats gestegen' : `${diff} plaatsen gestegen`;
    return {
      type: 'rise',
      places: diff,
      label: text,
      shortLabel: `+${diff}`,
    };
  }

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const text = absDiff === 1 ? '1 plaats gezakt' : `${absDiff} plaatsen gezakt`;
    return {
      type: 'fall',
      places: absDiff,
      label: text,
      shortLabel: `-${absDiff}`,
    };
  }

  return {
    type: 'equal',
    places: 0,
    label: 'Gelijk gebleven',
    shortLabel: '=',
  };
}

/**
 * Computes the full standings list including total points, round breakdown,
 * rank, and rank shifts compared to the previous round.
 *
 * @param targetRoundIndex Optional index of the round up to which to compute the standing.
 *                         If undefined, defaults to latest scored round or all rounds.
 */
export function computeStandings(
  teams: Team[],
  rounds: Round[],
  scores: ScoresState,
  targetRoundIndex?: number
): {
  standings: TeamStanding[];
  evaluatedRoundIndex: number;
  evaluatedRound: Round | null;
  previousRound: Round | null;
  isFirstRound: boolean;
} {
  if (teams.length === 0 || rounds.length === 0) {
    return {
      standings: [],
      evaluatedRoundIndex: -1,
      evaluatedRound: null,
      previousRound: null,
      isFirstRound: true,
    };
  }

  // Determine which round is the current evaluation point
  let evalIndex: number;
  if (typeof targetRoundIndex === 'number' && targetRoundIndex >= 0 && targetRoundIndex < rounds.length) {
    evalIndex = targetRoundIndex;
  } else {
    const latest = getLatestScoredRoundIndex(rounds, teams, scores);
    evalIndex = latest >= 0 ? latest : rounds.length - 1;
  }

  const roundsUpToCurrent = rounds.slice(0, evalIndex + 1);
  const { sortedTeams, rankMap: currentRankMap } = computeRanks(teams, roundsUpToCurrent, scores);

  const isFirstRound = evalIndex === 0;
  let previousRankMap: Record<string, number> | null = null;

  if (!isFirstRound) {
    const roundsUpToPrevious = rounds.slice(0, evalIndex);
    const { rankMap } = computeRanks(teams, roundsUpToPrevious, scores);
    previousRankMap = rankMap;
  }

  const standings: TeamStanding[] = sortedTeams.map(({ team, score }) => {
    const rank = currentRankMap[team.id] ?? 1;
    const prevRank = previousRankMap ? previousRankMap[team.id] ?? null : null;
    const shift = computeShiftInfo(rank, prevRank, isFirstRound);

    const roundScores: Record<string, number | null> = {};
    for (const r of rounds) {
      roundScores[r.id] = scores[team.id]?.[r.id] ?? null;
    }

    return {
      team,
      rank,
      totalScore: score,
      roundScores,
      previousRank: prevRank,
      shift,
    };
  });

  return {
    standings,
    evaluatedRoundIndex: evalIndex,
    evaluatedRound: rounds[evalIndex] ?? null,
    previousRound: !isFirstRound ? rounds[evalIndex - 1] ?? null : null,
    isFirstRound,
  };
}
