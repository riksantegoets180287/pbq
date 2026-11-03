/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PubquizData, Team, Round } from './types';
import { 
  loadPubquizData, 
  savePubquizData, 
  clearPubquizData, 
  DEFAULT_PUBQUIZ_DATA, 
  EMPTY_PUBQUIZ_DATA 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { ScoreTable } from './components/ScoreTable';
import { Leaderboard } from './components/Leaderboard';
import { BeamerView } from './components/BeamerView';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  const [quizData, setQuizData] = useState<PubquizData>(() => loadPubquizData());
  const [activeTab, setActiveTab] = useState<'scores' | 'leaderboard' | 'beamer'>('scores');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // Automatically sync to localStorage on quizData changes
  useEffect(() => {
    savePubquizData(quizData);
  }, [quizData]);

  // Title update
  const handleUpdateTitle = (title: string) => {
    setQuizData((prev) => ({
      ...prev,
      title,
    }));
  };

  // Add team
  const handleAddTeam = (name: string) => {
    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      createdAt: Date.now(),
    };

    setQuizData((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
      scores: {
        ...prev.scores,
        [newTeam.id]: {},
      },
    }));
  };

  // Rename team
  const handleRenameTeam = (teamId: string, newName: string) => {
    setQuizData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, name: newName } : t)),
    }));
  };

  // Delete team request
  const handleDeleteTeam = (team: Team) => {
    setConfirmModal({
      isOpen: true,
      title: 'Team verwijderen',
      message: `Weet je zeker dat je het team "${team.name}" wilt verwijderen? Alle ingevoerde scores van dit team worden ook verwijderd.`,
      confirmLabel: 'Team verwijderen',
      onConfirm: () => {
        setQuizData((prev) => {
          const nextScores = { ...prev.scores };
          delete nextScores[team.id];
          return {
            ...prev,
            teams: prev.teams.filter((t) => t.id !== team.id),
            scores: nextScores,
          };
        });
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Add round
  const handleAddRound = (customName?: string) => {
    setQuizData((prev) => {
      const nextRoundNumber = prev.rounds.length + 1;
      const newRound: Round = {
        id: `round-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: customName || `Ronde ${nextRoundNumber}`,
        roundNumber: nextRoundNumber,
      };

      return {
        ...prev,
        rounds: [...prev.rounds, newRound],
      };
    });
  };

  // Rename round
  const handleRenameRound = (roundId: string, newName: string) => {
    setQuizData((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => (r.id === roundId ? { ...r, name: newName } : r)),
    }));
  };

  // Delete round request
  const handleDeleteRound = (round: Round) => {
    setConfirmModal({
      isOpen: true,
      title: 'Ronde verwijderen',
      message: `Weet je zeker dat je "${round.name}" wilt verwijderen? Alle punten behaald in deze ronde gaan verloren.`,
      confirmLabel: 'Ronde verwijderen',
      onConfirm: () => {
        setQuizData((prev) => {
          const nextScores = { ...prev.scores };
          // Remove scores for this round from all teams
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
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Update a single score
  const handleUpdateScore = (teamId: string, roundId: string, value: number | null) => {
    setQuizData((prev) => {
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
    setHasUnsavedChanges(true);
  };

  // Save scores manually
  const handleSaveScores = () => {
    savePubquizData(quizData);
    setQuizData((prev) => ({
      ...prev,
      lastSavedAt: Date.now(),
    }));
    setHasUnsavedChanges(false);
  };

  // Clear all data request
  const handleRequestClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Alle scores en teams wissen?',
      message: 'Weet je zeker dat je alle teams, rondes en ingevoerde scores wilt wissen? Dit kan niet ongedaan worden gemaakt.',
      confirmLabel: 'Ja, alles wissen',
      onConfirm: () => {
        clearPubquizData();
        setQuizData({
          ...EMPTY_PUBQUIZ_DATA,
          lastSavedAt: Date.now(),
        });
        setHasUnsavedChanges(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Load sample data
  const handleLoadSampleData = () => {
    setQuizData({
      ...DEFAULT_PUBQUIZ_DATA,
      lastSavedAt: Date.now(),
    });
    setHasUnsavedChanges(false);
  };

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
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveScores={handleSaveScores}
        onRequestClearAll={handleRequestClearAll}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scores' && (
          <ScoreTable
            teams={quizData.teams}
            rounds={quizData.rounds}
            scores={quizData.scores}
            hasUnsavedChanges={hasUnsavedChanges}
            onUpdateScore={handleUpdateScore}
            onSaveScores={handleSaveScores}
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
