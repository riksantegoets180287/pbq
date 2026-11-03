import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Maximize, 
  Minimize, 
  X, 
  Sparkles, 
  Crown, 
  Layers,
  Award
} from 'lucide-react';
import { fireConfetti } from '../utils/confetti';
import { Team, Round, ScoresState } from '../types';
import { computeStandings, getLatestScoredRoundIndex } from '../utils/calculations';
import { ShiftBadge } from './ShiftBadge';

interface BeamerViewProps {
  title: string;
  teams: Team[];
  rounds: Round[];
  scores: ScoresState;
  onClose: () => void;
}

export const BeamerView: React.FC<BeamerViewProps> = ({
  title,
  teams,
  rounds,
  scores,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | 'auto'>('auto');

  // Compute standings
  const latestScoredIndex = getLatestScoredRoundIndex(rounds, teams, scores);
  const activeRoundIndex = selectedRoundIndex === 'auto'
    ? (latestScoredIndex >= 0 ? latestScoredIndex : rounds.length - 1)
    : selectedRoundIndex;

  const {
    standings,
    evaluatedRound,
    previousRound,
  } = computeStandings(
    teams,
    rounds,
    scores,
    activeRoundIndex
  );

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Confetti burst for celebrating
  const handleTriggerConfetti = () => {
    fireConfetti();
  };

  // Check shared ranks
  const rankCounts = standings.reduce((acc, curr) => {
    acc[curr.rank] = (acc[curr.rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Top 3 teams for podium if at least 2 teams exist
  const firstRank = standings.filter(s => s.rank === 1);
  const secondRank = standings.filter(s => s.rank === 2);
  const thirdRank = standings.filter(s => s.rank === 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-y-auto flex flex-col">
      
      {/* Top Header Bar for Beamer */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        
        {/* Left: Title & Round info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
            🍺
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {title || 'Pubquiz'}
            </h1>
            <div className="text-xs sm:text-sm text-slate-400 font-medium">
              {evaluatedRound ? (
                <span>
                  Stand na <strong className="text-amber-400">{evaluatedRound.name}</strong>
                  {previousRound && (
                    <span> (t.o.v. {previousRound.name})</span>
                  )}
                </span>
              ) : (
                'Totale Stand'
              )}
            </div>
          </div>
        </div>

        {/* Right: Round selector, Confetti, Fullscreen & Exit */}
        <div className="flex items-center gap-3">
          
          {rounds.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedRoundIndex === 'auto' ? 'auto' : selectedRoundIndex}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRoundIndex(val === 'auto' ? 'auto' : parseInt(val, 10));
                }}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="auto" className="bg-slate-900">
                  Laatste ronde ({evaluatedRound?.name})
                </option>
                {rounds.map((r, idx) => (
                  <option key={r.id} value={idx} className="bg-slate-900">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleTriggerConfetti}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm"
            title="Feestelijke confetti!"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Confetti!</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            title={isFullscreen ? 'Volledig scherm verlaten' : 'Volledig scherm tonen'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Sluiten</span>
          </button>
        </div>
      </header>

      {/* Main Beamer Screen Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col justify-start">
        
        {standings.length === 0 ? (
          <div className="text-center py-24">
            <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-300">Nog geen pubquiz scores beschikbaar</h2>
            <p className="text-slate-500 mt-2">Voer eerst teams en punten in.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Podium highlight for Top 3 (if we have at least 3 teams) */}
            {standings.length >= 3 && firstRank.length === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                
                {/* 2nd Place */}
                {standings[1] && (
                  <div className="order-2 md:order-1 bg-slate-900/80 border border-slate-400/30 rounded-3xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md mb-2">
                      2
                    </div>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Tweede plaats</span>
                    <h3 className="text-lg font-black text-white truncate max-w-full px-2">
                      {standings[1].team.name}
                    </h3>
                    <div className="font-mono text-3xl font-black text-slate-200 mt-2">
                      {standings[1].totalScore} <span className="text-sm font-sans font-normal text-slate-400">pt</span>
                    </div>
                    <div className="mt-3">
                      <ShiftBadge shift={standings[1].shift} size="sm" />
                    </div>
                  </div>
                )}

                {/* 1st Place (Center and elevated) */}
                {standings[0] && (
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative shadow-2xl shadow-amber-500/10 md:-translate-y-2">
                    <Crown className="w-8 h-8 text-amber-400 mb-1 animate-bounce" />
                    <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-400/40 mb-2">
                      1
                    </div>
                    <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-1">
                      Koploper 👑
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white truncate max-w-full px-2">
                      {standings[0].team.name}
                    </h3>
                    <div className="font-mono text-4xl sm:text-5xl font-black text-amber-400 mt-2">
                      {standings[0].totalScore} <span className="text-base font-sans font-normal text-amber-200/70">pt</span>
                    </div>
                    <div className="mt-3">
                      <ShiftBadge shift={standings[0].shift} size="md" />
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {standings[2] && (
                  <div className="order-3 bg-slate-900/80 border border-amber-700/40 rounded-3xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-amber-700 text-amber-100 font-black text-2xl flex items-center justify-center shadow-md mb-2">
                      3
                    </div>
                    <span className="text-xs uppercase font-bold text-amber-500/80 tracking-wider mb-1">Derde plaats</span>
                    <h3 className="text-lg font-black text-white truncate max-w-full px-2">
                      {standings[2].team.name}
                    </h3>
                    <div className="font-mono text-3xl font-black text-amber-300 mt-2">
                      {standings[2].totalScore} <span className="text-sm font-sans font-normal text-slate-400">pt</span>
                    </div>
                    <div className="mt-3">
                      <ShiftBadge shift={standings[2].shift} size="sm" />
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Complete Large Table for Audience View */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                <span>Plaats & Team</span>
                <div className="flex items-center gap-8">
                  <span>Verschuiving</span>
                  <span className="w-24 text-right">Punten</span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {standings.map((item) => {
                  const isShared = (rankCounts[item.rank] || 0) > 1;
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;

                  let rankColor = 'bg-slate-800 text-slate-200 border-slate-700';
                  if (isGold) rankColor = 'bg-amber-400 text-slate-950 border-amber-300 font-black';
                  else if (isSilver) rankColor = 'bg-slate-200 text-slate-950 border-white font-black';
                  else if (isBronze) rankColor = 'bg-amber-700 text-amber-100 border-amber-600 font-black';

                  return (
                    <div
                      key={item.team.id}
                      className={`flex items-center justify-between px-5 sm:px-6 py-4 transition-colors ${
                        isGold ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Left: Rank & Team Name */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex flex-col items-center shrink-0 w-11">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xl ${rankColor}`}>
                            {item.rank}
                          </div>
                          {isShared && (
                            <span className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">
                              Gedeeld
                            </span>
                          )}
                        </div>

                        <span className="font-extrabold text-lg sm:text-2xl text-white truncate">
                          {item.team.name}
                        </span>
                      </div>

                      {/* Right: Shift badge & Score */}
                      <div className="flex items-center gap-6 sm:gap-10 shrink-0">
                        <ShiftBadge shift={item.shift} size="lg" showDetails={true} />

                        <div className="w-24 text-right">
                          <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400">
                            {item.totalScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer hint */}
      <footer className="py-3 text-center text-xs text-slate-400 bg-slate-950 border-t border-slate-800/60">
        Druk op <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Esc</kbd> of klik op Sluiten om terug te gaan naar het scoreoverzicht.
      </footer>
    </div>
  );
};
