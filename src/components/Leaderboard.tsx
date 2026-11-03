import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Search, 
  Tv, 
  ChevronRight, 
  Layers, 
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { Team, Round, ScoresState } from '../types';
import { computeStandings, getLatestScoredRoundIndex } from '../utils/calculations';
import { ShiftBadge } from './ShiftBadge';

interface LeaderboardProps {
  teams: Team[];
  rounds: Round[];
  scores: ScoresState;
  onOpenBeamer: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  teams,
  rounds,
  scores,
  onOpenBeamer,
}) => {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | 'auto'>('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Compute standings
  const latestScoredIndex = getLatestScoredRoundIndex(rounds, teams, scores);
  const activeRoundIndex = selectedRoundIndex === 'auto'
    ? (latestScoredIndex >= 0 ? latestScoredIndex : rounds.length - 1)
    : selectedRoundIndex;

  const {
    standings,
    evaluatedRound,
    previousRound,
    isFirstRound
  } = computeStandings(
    teams,
    rounds,
    scores,
    activeRoundIndex
  );

  // Filter by search query if user types
  const filteredStandings = standings.filter((item) =>
    item.team.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Check if multiple teams share the same rank
  const rankCounts = standings.reduce((acc, curr) => {
    acc[curr.rank] = (acc[curr.rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">Live Ranglijst</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {evaluatedRound ? (
              <span>
                Stand berekend t/m <strong className="text-slate-200">{evaluatedRound.name}</strong>
                {previousRound ? (
                  <> vergeleken met <strong className="text-slate-300">{previousRound.name}</strong></>
                ) : (
                  <> (eerste ronde: <span className="text-amber-400">nieuwe stand</span>)</>
                )}
              </span>
            ) : (
              'Stand op basis van alle rondes'
            )}
          </p>
        </div>

        {/* Round comparison selector & Beamer CTA */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Round Selector */}
          {rounds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <label htmlFor="round-select" className="text-xs text-slate-300 font-medium">
                Toon stand na:
              </label>
              <select
                id="round-select"
                value={selectedRoundIndex === 'auto' ? 'auto' : selectedRoundIndex}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRoundIndex(val === 'auto' ? 'auto' : parseInt(val, 10));
                }}
                className="bg-slate-900 text-white text-xs font-semibold rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="auto">
                  Laatste ronde ({evaluatedRound?.name || 'Alles'})
                </option>
                {rounds.map((r, idx) => (
                  <option key={r.id} value={idx}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Beamer Mode Button */}
          <button
            onClick={onOpenBeamer}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>Beamerweergave openen</span>
          </button>
        </div>
      </div>

      {/* Filter and View Options */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek team..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 self-end sm:self-auto">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={showBreakdown}
              onChange={(e) => setShowBreakdown(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Toon scores per ronde</span>
          </label>
        </div>
      </div>

      {/* Standings List */}
      {filteredStandings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Geen teams gevonden</h3>
          <p className="text-xs text-slate-400 mt-1">
            {teams.length === 0
              ? 'Voeg eerst teams toe in het Scoreoverzicht.'
              : 'Geen teams komen overeen met je zoekopdracht.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStandings.map((item, index) => {
            const isShared = (rankCounts[item.rank] || 0) > 1;
            const isTop1 = item.rank === 1;
            const isTop2 = item.rank === 2;
            const isTop3 = item.rank === 3;

            // Highlight border and styling for podium
            let rankBadgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
            let cardGlow = 'border-slate-800 hover:border-slate-700 bg-slate-900/90';

            if (isTop1) {
              rankBadgeBg = 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/30';
              cardGlow = 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 shadow-lg shadow-amber-500/5';
            } else if (isTop2) {
              rankBadgeBg = 'bg-slate-300 text-slate-950 border-white font-black shadow-md shadow-slate-300/30';
              cardGlow = 'border-slate-400/30 bg-gradient-to-r from-slate-400/5 via-slate-900 to-slate-900';
            } else if (isTop3) {
              rankBadgeBg = 'bg-amber-700 text-amber-100 border-amber-600 font-black shadow-md shadow-amber-700/30';
              cardGlow = 'border-amber-700/30 bg-gradient-to-r from-amber-700/5 via-slate-900 to-slate-900';
            }

            return (
              <div
                key={item.team.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${cardGlow}`}
              >
                {/* Left side: Rank badge + Team Name + Equal rank label */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center shrink-0 w-12 text-center">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-lg ${rankBadgeBg}`}>
                      {item.rank}
                    </div>
                    {isShared && (
                      <span className="text-[10px] text-amber-400 font-medium tracking-tight mt-0.5">
                        gedeeld
                      </span>
                    )}
                  </div>

                  {/* Team details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-white truncate">
                        {item.team.name}
                      </h3>
                      {isTop1 && (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-bold shrink-0">
                          Koploper 👑
                        </span>
                      )}
                    </div>

                    {/* Breakdown of round scores (if enabled) */}
                    {showBreakdown && rounds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                        {rounds.slice(0, (activeRoundIndex ?? rounds.length - 1) + 1).map((round) => {
                          const score = item.roundScores[round.id];
                          return (
                            <span key={round.id} className="whitespace-nowrap">
                              <span className="text-slate-500">{round.name}:</span>{' '}
                              <span className="font-mono font-semibold text-slate-300">
                                {score !== null && score !== undefined ? score : '-'}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Rank Shift Badge & Total Points */}
                <div className="flex items-center justify-between sm:justify-end gap-5 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  
                  {/* Shift Badge: e.g. "2 plaatsen gestegen", "1 plaats gezakt", "Gelijk gebleven", "Nieuwe stand" */}
                  <div className="shrink-0">
                    <ShiftBadge shift={item.shift} size="md" showDetails={true} />
                  </div>

                  {/* Total Points */}
                  <div className="text-right shrink-0 min-w-[90px]">
                    <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                      {item.totalScore}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      punten
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Info Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400">
        <h4 className="font-bold text-slate-300 mb-2">Toelichting ranglijst en verschuivingen:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span><strong>Gestegen:</strong> Hogere plaats behaald dan na de vorige ronde.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
            <span><strong>Gezakt:</strong> Lagere plaats gekregen na de vorige ronde.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            <span><strong>Gelijk:</strong> Zelfde positie behouden.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span><strong>Gelijke punten:</strong> Zelfde plaats; gesorteerd op teamnaam.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
