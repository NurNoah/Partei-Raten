/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { History, RotateCcw, SlidersHorizontal, Trophy, Zap } from 'lucide-react';

interface ScoreBarProps {
  score: number;
  total: number;
  streak: number;
  bestStreak: number;
  isCustomPartySelection: boolean;
  selectedPartyCount: number;
  totalPartyCount: number;
  onReset: () => void;
  onShowCurrentStreak: () => void;
  onShowBestStreak: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
}

export default function ScoreBar({
  score,
  total,
  streak,
  bestStreak,
  isCustomPartySelection,
  selectedPartyCount,
  totalPartyCount,
  onReset,
  onShowCurrentStreak,
  onShowBestStreak,
  onShowHistory,
  onShowSettings,
}: ScoreBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-3xl px-4 sm:px-6 py-3 sm:py-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl">
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-bold">Score</span>
            <span className="text-sm font-mono font-bold text-zinc-100">{score}/{total}</span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onShowCurrentStreak}
          className="flex items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors hover:bg-zinc-800"
          title="Politiker dieser Streak anzeigen"
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-bold">Streak</span>
            <span className="text-sm font-mono font-bold text-zinc-100">{streak}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onShowBestStreak}
          className="flex items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors hover:bg-zinc-800"
          title="Politiker der besten Streak anzeigen"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-bold">Best</span>
            <span className="text-sm font-mono font-bold text-zinc-100">{bestStreak}</span>
          </div>
        </button>

        {isCustomPartySelection && (
          <button
            type="button"
            onClick={onShowSettings}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-500/20"
            title="Custom-Parteiauswahl bearbeiten"
          >
            Custom {selectedPartyCount}/{totalPartyCount}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onShowHistory}
          className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all shrink-0"
          title="Guess-History anzeigen"
        >
          <History className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onShowSettings}
          className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all shrink-0"
          title="Parteien einstellen"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onReset}
          className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all shrink-0"
          title="Statistiken zurücksetzen"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
