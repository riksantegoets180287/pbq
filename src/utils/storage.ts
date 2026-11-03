import { PubquizData, Team, Round, ScoresState } from '../types';

const STORAGE_KEY = 'pubquiz_scores_v1';

export const DEFAULT_PUBQUIZ_DATA: PubquizData = {
  title: 'Grote Vrijdagmiddag Pubquiz',
  teams: [
    { id: 'team-1', name: 'Quiz ’t Maar', createdAt: 1 },
    { id: 'team-2', name: 'De Slimste Mensen', createdAt: 2 },
    { id: 'team-3', name: 'Triviant Tijgers', createdAt: 3 },
    { id: 'team-4', name: 'De Bierbrouwers', createdAt: 4 },
    { id: 'team-5', name: 'Veni Vidi Vici', createdAt: 5 },
    { id: 'team-6', name: 'Hoger Beroep', createdAt: 6 },
  ],
  rounds: [
    { id: 'round-1', name: 'Ronde 1: Algemene Kennis', roundNumber: 1 },
    { id: 'round-2', name: 'Ronde 2: Plaatjes & Logo’s', roundNumber: 2 },
    { id: 'round-3', name: 'Ronde 3: Muziekfragmenten', roundNumber: 3 },
    { id: 'round-4', name: 'Ronde 4: Film & Televisie', roundNumber: 4 },
  ],
  scores: {
    'team-1': { 'round-1': 8.5, 'round-2': 9, 'round-3': 7.5, 'round-4': null },
    'team-2': { 'round-1': 9, 'round-2': 8, 'round-3': 9, 'round-4': null },
    'team-3': { 'round-1': 7, 'round-2': 8.5, 'round-3': 8.5, 'round-4': null },
    'team-4': { 'round-1': 6.5, 'round-2': 7, 'round-3': 8, 'round-4': null },
    'team-5': { 'round-1': 8, 'round-2': 6.5, 'round-3': 8, 'round-4': null },
    'team-6': { 'round-1': 7.5, 'round-2': 7.5, 'round-3': 7, 'round-4': null },
  },
  lastSavedAt: Date.now(),
};

export const EMPTY_PUBQUIZ_DATA: PubquizData = {
  title: 'Nieuwe Pubquiz',
  teams: [],
  rounds: [
    { id: 'round-1', name: 'Ronde 1', roundNumber: 1 },
    { id: 'round-2', name: 'Ronde 2', roundNumber: 2 },
    { id: 'round-3', name: 'Ronde 3', roundNumber: 3 },
  ],
  scores: {},
  lastSavedAt: Date.now(),
};

export function loadPubquizData(): PubquizData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PUBQUIZ_DATA;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.teams) && Array.isArray(parsed.rounds)) {
      return {
        title: parsed.title || 'Mijn Pubquiz',
        teams: parsed.teams,
        rounds: parsed.rounds,
        scores: parsed.scores || {},
        lastSavedAt: parsed.lastSavedAt || Date.now(),
      };
    }
    return DEFAULT_PUBQUIZ_DATA;
  } catch (err) {
    console.error('Error loading pubquiz data from localStorage', err);
    return DEFAULT_PUBQUIZ_DATA;
  }
}

export function savePubquizData(data: PubquizData): void {
  try {
    const toSave: PubquizData = {
      ...data,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Error saving pubquiz data to localStorage', err);
  }
}

export function clearPubquizData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing pubquiz data', err);
  }
}
