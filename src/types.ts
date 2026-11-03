export interface Team {
  id: string;
  name: string;
  createdAt: number;
}

export interface Round {
  id: string;
  name: string;
  roundNumber: number;
}

// scores[teamId][roundId] = number | null
export type ScoresState = Record<string, Record<string, number | null>>;

export type ShiftType = 'rise' | 'fall' | 'equal' | 'new';

export interface ShiftInfo {
  type: ShiftType;
  places: number;
  label: string; // e.g. "2 plaatsen gestegen", "1 plaats gezakt", "Gelijk gebleven", "Nieuwe stand"
  shortLabel: string; // e.g. "+2", "-1", "0", "Nieuw"
}

export interface TeamStanding {
  team: Team;
  rank: number; // 1-based, shared rank for ties
  totalScore: number;
  roundScores: Record<string, number | null>;
  previousRank: number | null;
  shift: ShiftInfo;
}

export interface PubquizData {
  title: string;
  teams: Team[];
  rounds: Round[];
  scores: ScoresState;
  lastSavedAt?: number;
}
