import React, { useState } from 'react';
import { Trophy, Table2, Tv, Trash2, Sparkles, Check, Users, Layers, CreditCard as Edit2 } from 'lucide-react';

interface NavbarProps {
  title: string;
  onUpdateTitle: (title: string) => void;
  activeTab: 'scores' | 'leaderboard' | 'beamer';
  onSelectTab: (tab: 'scores' | 'leaderboard' | 'beamer') => void;
  teamCount: number;
  roundCount: number;
  lastSavedAt?: number;
  onRequestClearAll: () => void;
  onLoadSampleData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onUpdateTitle,
  activeTab,
  onSelectTab,
  teamCount,
  roundCount,
  lastSavedAt,
  onRequestClearAll,
  onLoadSampleData,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = titleInput.trim();
    if (trimmed) {
      onUpdateTitle(trimmed);
    } else {
      setTitleInput(title);
    }
    setIsEditingTitle(false);
  };

  const formattedSavedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Brand & Quiz Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl shrink-0">
              🍺
            </div>
            <div>
              {isEditingTitle ? (
                <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSubmit}
                    autoFocus
                    className="bg-slate-800 text-white font-bold text-lg px-2.5 py-1 rounded-lg border border-amber-500 focus:outline-none"
                    placeholder="Quiz titel..."
                  />
                  <button
                    type="submit"
                    className="p-1 text-emerald-400 hover:text-emerald-300"
                    title="Opslaan"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 
                    onClick={() => {
                      setTitleInput(title);
                      setIsEditingTitle(true);
                    }}
                    className="text-lg sm:text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Klik om qu явz titel aan te passen"
                  >
                    <span>{title || 'Pubquiz Scorebord'}</span>
                    <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition-all" />
                  </h1>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {teamCount} {teamCount === 1 ? 'team' : 'teams'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  {roundCount} {roundCount === 1 ? 'ronde' : 'rondes'}
                </span>
                {formattedSavedTime && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">
                      Opgeslagen om {formattedSavedTime}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => onSelectTab('scores')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'scores'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>Scoreoverzicht</span>
            </button>

            <button
              onClick={() => onSelectTab('leaderboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Ranglijst</span>
            </button>

            <button
              onClick={() => onSelectTab('beamer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'beamer'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Beamerweergave</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {teamCount === 0 && (
              <button
                onClick={onLoadSampleData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-xl border border-amber-500/20 transition-colors cursor-pointer"
                title="Herstel voorbeeldquiz met teams en scores"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Voorbeeldquiz</span>
              </button>
            )}

            <button
              onClick={onRequestClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
              title="Alle scores en teams wissen"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alles wissen</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
