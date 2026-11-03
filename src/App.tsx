/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PubquizData, Team, Round } from './types';
import { DEFAULT_PUBQUIZ_DATA, EMPTY_PUBQUIZ_DATA } from './utils/pubquizDefaults';
import {
  loadPubquizData,
  replaceQuizData,
  saveQuizTitle,
  insertTeam,
  renameTeam,
  deleteTeam,
  insertRound,
  renameRound,
  deleteRound,
  saveScore,
} from './utils/pubquizApi';
import { Navbar } from './components/Navbar';
import { ScoreTable } from './components/ScoreTable';
import { Leaderboard } from './components/Leaderboard';
import { BeamerView } from './components/BeamerView';
import { ConfirmModal } from './components/ConfirmModal';

const SCORE_SAVE_DELAY_MS = 400;

export default function App() {
  const [quizData, setQuizData] = useState<PubquizData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'leaderboard' | 'beamer'>('scores');
  const scoreSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    let active = true;
    loadPubquizData()
      .then((data) => {
        if (active) setQuizData(data);
      })
      .catch((err: Error) => {
        if (active) setLoadError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = (action: () => Promise<unknown>) => {
    action()
      .then(() => {
        setSaveError(null);
        setQuizData((prev) => (prev ? { ...prev, lastSavedAt: Date.now() } : prev));
      })
      .catch((err: Error) => setSaveError(err.message));
  };

  const updateQuiz = (updater: (prev: PubquizData) => PubquizData) => {
    setQuizData((prev) => (prev ? updater(prev) : prev));
  };

  const handleUpdateTitle = (title: string) => {
    updateQuiz((prev) => ({ ...prev, title }));
    persist(() => saveQuizTitle(title));
  };

  const handleAddTeam = (name: string) => {
    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      createdAt: Date.now(),
    };

    updateQuiz((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
      scores: {
        ...prev.scores,
        [newTeam.id]: {},
      },
    }));
    persist(() => insertTeam(newTeam));
  };

  const handleRenameTeam = (teamId: string, newName: string) => {
    updateQuiz((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, name: newName } : t)),
    }));
    persist(() => renameTeam(teamId, newName));
  };

  const handleDeleteTeam = (team: Team) => {
    setConfirmModal({
      isOpen: true,
      title: 'Team verwijderen',
      message: `Weet je zeker dat je het team "${team.name}" wilt verwijderen? Alle ingevoerde scores van dit team worden ook verwijderd.`,
      confirmLabel: 'Team verwijderen',
      onConfirm: () => {
        updateQuiz((prev) => {
          const nextScores = { ...prev.scores };
          delete nextScores[team.id];
          return {
            ...prev,
            teams: prev.teams.filter((t) => t.id !== team.id),
            scores: nextScores,
          };
        });
        persist(() => deleteTeam(team.id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddRound = (customName?: string) => {
    if (!quizData) return;
    const nextRoundNumber = quizData.rounds.length + 1;
    const newRound: Round = {
      id: `round-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: customName || `Ronde ${nextRoundNumber}`,
      roundNumber: nextRoundNumber,
    };

    updateQuiz((prev) => ({
      ...prev,
      rounds: [...prev.rounds, newRound],
    }));
    persist(() => insertRound(newRound));
  };

  const handleRenameRound = (roundId: string, newName: string) => {
    updateQuiz((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => (r.id === roundId ? { ...r, name: newName } : r)),
    }));
    persist(() => renameRound(roundId, newName));
  };

  const handleDeleteRound = (round: Round) => {
    setConfirmModal({
      isOpen: true,
      title: 'Ronde verwijderen',
      message: `Weet je zeker dat je "${round.name}" wilt verwijderen? Alle punten behaald in deze ronde gaan verloren.`,
      confirmLabel: 'Ronde verwijderen',
      onConfirm: () => {
        updateQuiz((prev) => {
          const nextScores = { ...prev.scores };
          Object.keys(nextScores).forEach((teamId) => {
            const teamScores = { ...nextScores[teamId] };
            delete teamScores[round.id];
            nextScores[teamId] = teamScores;
          });

          return {
            ...prev,
            rounds: prev.rounds.filter((r) => r.id !== round.id),
            scores: nextScores,
          };
        });
        persist(() => deleteRound(round.id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleUpdateScore = (teamId: string, roundId: string, value: number | null) => {
    updateQuiz((prev) => {
      const teamScores = prev.scores[teamId] ? { ...prev.scores[teamId] } : {};
      if (value === null) {
        delete teamScores[roundId];
      } else {
        teamScores[roundId] = value;
      }

      return {
        ...prev,
        scores: {
          ...prev.scores,
          [teamId]: teamScores,
        },
      };
    });

    const timerKey = `${teamId}|${roundId}`;
    const pendingTimer = scoreSaveTimers.current.get(timerKey);
    if (pendingTimer) clearTimeout(pendingTimer);
    scoreSaveTimers.current.set(
      timerKey,
      setTimeout(() => {
        scoreSaveTimers.current.delete(timerKey);
        persist(() => saveScore(teamId, roundId, value));
      }, SCORE_SAVE_DELAY_MS),
    );
  };

  const handleRequestClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Alle scores en teams wissen?',
      message: 'Weet je zeker dat je alle teams, rondes en ingevoerde scores wilt wissen? Dit kan niet ongedaan worden gemaakt.',
      confirmLabel: 'Ja, alles wissen',
      onConfirm: () => {
        setQuizData({ ...EMPTY_PUBQUIZ_DATA, lastSavedAt: Date.now() });
        persist(() => replaceQuizData(EMPTY_PUBQUIZ_DATA));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleLoadSampleData = () => {
    setQuizData({ ...DEFAULT_PUBQUIZ_DATA, lastSavedAt: Date.now() });
    persist(() => replaceQuizData(DEFAULT_PUBQUIZ_DATA));
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        {loadError ? (
          <div className="max-w-md text-center space-y-2">
            <p className="font-semibold text-rose-300">De pubquiz kon niet worden geladen.</p>
            <p className="text-sm text-slate-400">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pubquiz wordt geladen...</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        title={quizData.title}
        onUpdateTitle={handleUpdateTitle}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        teamCount={quizData.teams.length}
        roundCount={quizData.rounds.length}
        lastSavedAt={quizData.lastSavedAt}
        onRequestClearAll={handleRequestClearAll}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {saveError && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm px-4 py-3 rounded-xl">
            <span>Let op: wijziging is niet opgeslagen. {saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-rose-300 hover:text-white font-semibold cursor-pointer"
            >
              Sluiten
            </button>
          </div>
        )}

        {activeTab === 'scores' && (
          <ScoreTable
            teams={quizData.teams}
            rounds={quizData.rounds}
            scores={quizData.scores}
            onUpdateScore={handleUpdateScore}
            onAddTeam={handleAddTeam}
            onRenameTeam={handleRenameTeam}
            onDeleteTeam={handleDeleteTeam}
            onAddRound={handleAddRound}
            onRenameRound={handleRenameRound}
            onDeleteRound={handleDeleteRound}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            teams={quizData.teams}
            rounds={quizData.rounds}
            scores={quizData.scores}
            onOpenBeamer={() => setActiveTab('beamer')}
          />
        )}
      </main>

      {/* Dedicated Beamer / Screen View */}
      {activeTab === 'beamer' && (
        <BeamerView
          title={quizData.title}
          teams={quizData.teams}
          rounds={quizData.rounds}
          scores={quizData.scores}
          onClose={() => setActiveTab('leaderboard')}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
