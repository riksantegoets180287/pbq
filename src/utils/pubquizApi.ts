import { PubquizData, Round, ScoresState, Team } from '../types';
import { DEFAULT_PUBQUIZ_DATA } from './pubquizDefaults';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const QUIZ_ID = 'main';

interface SettingsRow {
  id: string;
  title: string;
}

interface TeamRow {
  id: string;
  name: string;
  created_at_ms: number;
}

interface RoundRow {
  id: string;
  name: string;
  round_number: number;
}

interface ScoreRow {
  team_id: string;
  round_id: string;
  points: number | string;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request(method: HttpMethod, path: string, body?: unknown, prefer?: string): Promise<unknown> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Geen verbinding met de database.');
  }

  if (!response.ok) {
    throw new Error(`Opslaan mislukt (fout ${response.status}).`);
  }
  return method === 'GET' ? response.json() : null;
}

async function query<T>(path: string): Promise<T[]> {
  const result = await request('GET', path);
  if (!Array.isArray(result)) {
    throw new Error('Onverwacht antwoord van de database.');
  }
  return result as T[];
}

const eq = (value: string) => `eq.${encodeURIComponent(value)}`;

const toTeamRow = (team: Team) => ({ id: team.id, name: team.name, created_at_ms: team.createdAt });
const toRoundRow = (round: Round) => ({ id: round.id, name: round.name, round_number: round.roundNumber });

function toScoreRows(scores: ScoresState) {
  const rows: { team_id: string; round_id: string; points: number }[] = [];
  Object.entries(scores).forEach(([teamId, roundScores]) => {
    Object.entries(roundScores).forEach(([roundId, points]) => {
      if (points !== null) rows.push({ team_id: teamId, round_id: roundId, points });
    });
  });
  return rows;
}

export async function loadPubquizData(): Promise<PubquizData> {
  const [settings, teams, rounds, scores] = await Promise.all([
    query<SettingsRow>(`pubquiz_settings?id=${eq(QUIZ_ID)}&select=id,title`),
    query<TeamRow>('pubquiz_teams?select=id,name,created_at_ms&order=created_at_ms.asc'),
    query<RoundRow>('pubquiz_rounds?select=id,name,round_number&order=round_number.asc'),
    query<ScoreRow>('pubquiz_scores?select=team_id,round_id,points'),
  ]);

  if (settings.length === 0) {
    await replaceQuizData(DEFAULT_PUBQUIZ_DATA);
    return { ...DEFAULT_PUBQUIZ_DATA, lastSavedAt: Date.now() };
  }

  const scoresState: ScoresState = {};
  scores.forEach((row) => {
    scoresState[row.team_id] = { ...scoresState[row.team_id], [row.round_id]: Number(row.points) };
  });

  return {
    title: settings[0].title,
    teams: teams.map((t) => ({ id: t.id, name: t.name, createdAt: t.created_at_ms })),
    rounds: rounds.map((r) => ({ id: r.id, name: r.name, roundNumber: r.round_number })),
    scores: scoresState,
    lastSavedAt: Date.now(),
  };
}

export async function replaceQuizData(data: PubquizData): Promise<void> {
  await request('DELETE', 'pubquiz_teams?id=not.is.null');
  await request('DELETE', 'pubquiz_rounds?id=not.is.null');
  await request('POST', 'pubquiz_settings?on_conflict=id', [{ id: QUIZ_ID, title: data.title }], 'resolution=merge-duplicates');
  if (data.teams.length > 0) await request('POST', 'pubquiz_teams', data.teams.map(toTeamRow));
  if (data.rounds.length > 0) await request('POST', 'pubquiz_rounds', data.rounds.map(toRoundRow));
  const scoreRows = toScoreRows(data.scores);
  if (scoreRows.length > 0) await request('POST', 'pubquiz_scores', scoreRows);
}

export function saveQuizTitle(title: string) {
  return request('PATCH', `pubquiz_settings?id=${eq(QUIZ_ID)}`, { title, updated_at: new Date().toISOString() });
}

export function insertTeam(team: Team) {
  return request('POST', 'pubquiz_teams', toTeamRow(team));
}

export function renameTeam(teamId: string, name: string) {
  return request('PATCH', `pubquiz_teams?id=${eq(teamId)}`, { name });
}

export function deleteTeam(teamId: string) {
  return request('DELETE', `pubquiz_teams?id=${eq(teamId)}`);
}

export function insertRound(round: Round) {
  return request('POST', 'pubquiz_rounds', toRoundRow(round));
}

export function renameRound(roundId: string, name: string) {
  return request('PATCH', `pubquiz_rounds?id=${eq(roundId)}`, { name });
}

export function deleteRound(roundId: string) {
  return request('DELETE', `pubquiz_rounds?id=${eq(roundId)}`);
}

export function saveScore(teamId: string, roundId: string, points: number | null) {
  if (points === null) {
    return request('DELETE', `pubquiz_scores?team_id=${eq(teamId)}&round_id=${eq(roundId)}`);
  }
  return request(
    'POST',
    'pubquiz_scores?on_conflict=team_id,round_id',
    { team_id: teamId, round_id: roundId, points },
    'resolution=merge-duplicates',
  );
}
