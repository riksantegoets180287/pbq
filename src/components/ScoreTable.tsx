import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  Edit3, 
  Users, 
  Layers, 
  HelpCircle,
  Hash,
  Award
} from 'lucide-react';
import { Team, Round, ScoresState } from '../types';
import { getTeamTotalScore } from '../utils/calculations';

interface ScoreTableProps {
  teams: Team[];
  rounds: Round[];
  scores: ScoresState;
  hasUnsavedChanges: boolean;
  onUpdateScore: (teamId: string, roundId: string, value: number | null) => void;
  onSaveScores: () => void;
  onAddTeam: (name: string) => void;
  onRenameTeam: (teamId: string, newName: string) => void;
  onDeleteTeam: (team: Team) => void;
  onAddRound: (name?: string) => void;
  onRenameRound: (roundId: string, newName: string) => void;
  onDeleteRound: (round: Round) => void;
}

export const ScoreTable: React.FC<ScoreTableProps> = ({
  teams,
  rounds,
  scores,
  hasUnsavedChanges,
  onUpdateScore,
  onSaveScores,
  onAddTeam,
  onRenameTeam,
  onDeleteTeam,
  onAddRound,
  onRenameRound,
  onDeleteRound,
}) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [editingRoundName, setEditingRoundName] = useState('');

  const [isAddingRoundModalOpen, setIsAddingRoundModalOpen] = useState(false);
  const [newRoundTitle, setNewRoundTitle] = useState('');

  const [showSaveToast, setShowSaveToast] = useState(false);

  const newTeamInputRef = useRef<HTMLInputElement>(null);

  // Handle rapid team creation
  const handleAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    onAddTeam(trimmed);
    setNewTeamName('');
    newTeamInputRef.current?.focus();
  };

  // Handle team renaming
  const handleStartRenameTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  const handleSaveRenameTeam = (teamId: string) => {
    const trimmed = editingTeamName.trim();
    if (trimmed) {
      onRenameTeam(teamId, trimmed);
    }
    setEditingTeamId(null);
  };

  // Handle round renaming
  const handleStartRenameRound = (round: Round) => {
    setEditingRoundId(round.id);
    setEditingRoundName(round.name);
  };

  const handleSaveRenameRound = (roundId: string) => {
    const trimmed = editingRoundName.trim();
    if (trimmed) {
      onRenameRound(roundId, trimmed);
    }
    setEditingRoundId(null);
  };

  // Handle new round creation
  const handleConfirmAddRound = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRound(newRoundTitle.trim() || undefined);
    setNewRoundTitle('');
    setIsAddingRoundModalOpen(false);
  };

  const handleSaveClick = () => {
    onSaveScores();
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 2500);
  };

  // Keyboard navigation helper for score inputs (ArrowUp, ArrowDown, Enter)
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    teamIndex: number,
    roundIndex: number
  ) => {
    let targetTeamIndex = teamIndex;
    let targetRoundIndex = roundIndex;

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetTeamIndex = teamIndex + 1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      targetTeamIndex = teamIndex - 1;
    } else if (e.key === 'ArrowRight' && (e.currentTarget.selectionStart === e.currentTarget.value.length || e.currentTarget.value === '')) {
      targetRoundIndex = roundIndex + 1;
    } else if (e.key === 'ArrowLeft' && (e.currentTarget.selectionStart === 0 || e.currentTarget.value === '')) {
      targetRoundIndex = roundIndex - 1;
    } else {
      return;
    }

    if (
      targetTeamIndex >= 0 &&
      targetTeamIndex < teams.length &&
      targetRoundIndex >= 0 &&
      targetRoundIndex < rounds.length
    ) {
      const nextInputId = `score-input-${teams[targetTeamIndex].id}-${rounds[targetRoundIndex].id}`;
      const elem = document.getElementById(nextInputId) as HTMLInputElement | null;
      if (elem) {
        elem.focus();
        elem.select();
      }
    }
  };

  // Calculate highest and average score per round for quizmaster summary
  const roundStats = rounds.map((round) => {
    const values: number[] = [];
    teams.forEach((team) => {
      const score = scores[team.id]?.[round.id];
      if (typeof score === 'number' && !isNaN(score)) {
        values.push(score);
      }
    });

    if (values.length === 0) {
      return { filled: 0, max: null, avg: null };
    }

    const max = Math.max(...values);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    return { filled: values.length, max, avg };
  });

  return (
    <div className="space-y-6">
      
      {/* Action Toolbar above Table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Quick Add Team Input */}
        <form onSubmit={handleAddTeamSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={newTeamInputRef}
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nieuwe teamnaam..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!newTeamName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-semibold text-sm rounded-xl transition-all cursor-pointer shrink-0 shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Team toevoegen</span>
          </button>
        </form>

        {/* Round actions & Save Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setNewRoundTitle(`Ronde ${rounds.length + 1}`);
              setIsAddingRoundModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Ronde toevoegen</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            className={`flex items-center gap-2 px-5 py-2 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg ${
              hasUnsavedChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
            }`}
          >
            {showSaveToast ? (
              <>
                <Check className="w-4 h-4" />
                <span>Opgeslagen!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{hasUnsavedChanges ? 'Punten opslaan' : 'Punten opslaan'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Score Matrix Table */}
      {teams.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Nog geen teams toegevoegd</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
            Voeg hierboven je eerste team toe om te beginnen met het bijhouden van de pubquiz scores.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              
              {/* Table Header: Teams and Rounds as columns */}
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  
                  {/* Team Column Header */}
                  <th className="py-3.5 px-4 sticky left-0 z-20 bg-slate-950/95 w-56 sm:w-64 min-w-[200px] border-r border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">Teamnaam ({teams.length})</span>
                    </div>
                  </th>

                  {/* Dynamic Round Columns */}
                  {rounds.map((round, rIndex) => (
                    <th 
                      key={round.id} 
                      className="py-3.5 px-3 min-w-[110px] max-w-[140px] text-center border-r border-slate-800/60 group relative"
                    >
                      {editingRoundId === round.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="text"
                            value={editingRoundName}
                            onChange={(e) => setEditingRoundName(e.target.value)}
                            onBlur={() => handleSaveRenameRound(round.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRenameRound(round.id);
                              if (e.key === 'Escape') setEditingRoundId(null);
                            }}
                            autoFocus
                            className="w-full bg-slate-800 text-xs px-1.5 py-1 rounded border border-amber-500 text-white text-center focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span 
                            onClick={() => handleStartRenameRound(round)}
                            className="font-bold text-slate-200 hover:text-amber-400 transition-colors cursor-pointer truncate max-w-[100px]"
                            title={`Klik om '${round.name}' te wijzigen`}
                          >
                            {round.name}
                          </span>
                          
                          {/* Round header actions hover */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              onClick={() => handleStartRenameRound(round)}
                              className="p-1 hover:text-amber-400 text-slate-400"
                              title="Rondenaam wijzigen"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            {rounds.length > 1 && (
                              <button
                                onClick={() => onDeleteRound(round)}
                                className="p-1 hover:text-rose-400 text-slate-400"
                                title="Ronde verwijderen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </th>
                  ))}

                  {/* Total Column Header */}
                  <th className="py-3.5 px-4 min-w-[90px] text-center bg-amber-500/10 text-amber-300 font-extrabold border-l border-r border-amber-500/20">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Totaal</span>
                    </div>
                  </th>

                  {/* Actions Column Header */}
                  <th className="py-3.5 px-3 w-16 text-center text-slate-500">
                    Acties
                  </th>
                </tr>
              </thead>

              {/* Table Body: Teams as rows */}
              <tbody className="divide-y divide-slate-800 text-sm">
                {teams.map((team, tIndex) => {
                  const totalScore = getTeamTotalScore(team.id, rounds, scores);

                  return (
                    <tr 
                      key={team.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Team Name Cell (Sticky on left for horizontal scroll) */}
                      <td className="py-3 px-4 sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-850 border-r border-slate-800/80">
                        {editingTeamId === team.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              onBlur={() => handleSaveRenameTeam(team.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRenameTeam(team.id);
                                if (e.key === 'Escape') setEditingTeamId(null);
                              }}
                              autoFocus
                              className="w-full bg-slate-800 text-sm px-2 py-1 rounded-lg border border-amber-500 text-white font-medium focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveRenameTeam(team.id)}
                              className="text-emerald-400 hover:text-emerald-300 p-1"
                              title="Opslaan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span 
                              onClick={() => handleStartRenameTeam(team)}
                              className="font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer truncate max-w-[160px] sm:max-w-[200px]"
                              title={`Klik om teamnaam te wijzigen`}
                            >
                              {team.name}
                            </span>
                            <button
                              onClick={() => handleStartRenameTeam(team)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-400 transition-opacity"
                              title="Teamnaam wijzigen"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Score Input per Round */}
                      {rounds.map((round, rIndex) => {
                        const currentScore = scores[team.id]?.[round.id];
                        const displayValue = currentScore === null || currentScore === undefined ? '' : currentScore;

                        return (
                          <td 
                            key={round.id}
                            className="py-2 px-2 text-center border-r border-slate-800/60"
                          >
                            <input
                              id={`score-input-${team.id}-${round.id}`}
                              type="number"
                              step="0.5"
                              min="0"
                              max="999"
                              value={displayValue}
                              placeholder="-"
                              onChange={(e) => {
                                const valStr = e.target.value.trim();
                                if (valStr === '') {
                                  onUpdateScore(team.id, round.id, null);
                                } else {
                                  const num = parseFloat(valStr);
                                  onUpdateScore(team.id, round.id, isNaN(num) ? null : num);
                                }
                              }}
                              onKeyDown={(e) => handleInputKeyDown(e, tIndex, rIndex)}
                              className={`w-full max-w-[80px] mx-auto text-center font-mono font-bold text-sm py-1.5 px-1 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                currentScore !== null && currentScore !== undefined
                                  ? 'bg-slate-800/90 text-amber-300 border-slate-700'
                                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Total Points per Team */}
                      <td className="py-3 px-3 text-center bg-amber-500/5 border-l border-r border-amber-500/15">
                        <span className="font-mono font-extrabold text-base text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-lg">
                          {totalScore}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteTeam(team)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title={`Team '${team.name}' verwijderen`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer: Statistics Summary (gemiddelde & hoogste score per ronde) */}
              <tfoot>
                <tr className="bg-slate-950/70 text-xs text-slate-400 border-t-2 border-slate-800">
                  <td className="py-3 px-4 font-semibold text-slate-400 sticky left-0 z-10 bg-slate-950/90 border-r border-slate-800/80">
                    Ronde statistieken
                  </td>

                  {rounds.map((round, idx) => {
                    const stats = roundStats[idx];
                    return (
                      <td key={round.id} className="py-2.5 px-2 text-center border-r border-slate-800/60">
                        {stats.filled > 0 ? (
                          <div className="text-[11px] space-y-0.5">
                            <div className="text-emerald-400 font-medium" title="Hoogste score deze ronde">
                              Max: <span className="font-bold">{stats.max}</span>
                            </div>
                            <div className="text-slate-400" title="Gemiddelde score deze ronde">
                              Gem: {stats.avg}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-3 px-3 text-center bg-amber-500/10 text-amber-300 font-bold border-l border-r border-amber-500/20">
                    -
                  </td>
                  <td className="py-3 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Helper hint for fast quizmaster entry */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Sneltoetsen:</strong> Gebruik <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Enter</kbd> of <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">↓ Pijltje omlaag</kbd> om direct door te springen naar het volgende team. Halve punten (bv. 8.5) zijn toegestaan.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
          >
            Alle scores direct opslaan
          </button>
        </div>
      </div>

      {/* Add Round Modal */}
      {isAddingRoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Nieuwe ronde toevoegen</span>
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Geef de ronde een herkenbare naam of nummer (bijv. "Ronde {rounds.length + 1}: Sport" of "Muziekronde").
            </p>
            <form onSubmit={handleConfirmAddRound}>
              <input
                type="text"
                value={newRoundTitle}
                onChange={(e) => setNewRoundTitle(e.target.value)}
                placeholder={`Ronde ${rounds.length + 1}`}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white mb-5 focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingRoundModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md shadow-amber-500/20"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
