/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, CheckCircle2, Clock, Flame, Github, History, Loader2, SlidersHorizontal, Trophy, X, XCircle } from 'lucide-react';
import { fetchRandomPolitician, getPartyOptions, PARTIES, type DataSourceStatus, type Politician } from './lib/wikidata';

import PoliticianCard from './components/PoliticianCard';
import AnswerOptions from './components/AnswerOptions';
import ScoreBar from './components/ScoreBar';
import ErrorState from './components/ErrorState';

type GameState = 'loading' | 'guessing' | 'revealed' | 'error';
type ModalView = 'current-streak' | 'best-streak' | 'history' | 'settings' | 'reset-confirm' | null;

type CorrectPolitician = {
  id: string;
  name: string;
  partyName: string;
  imageUrl: string;
};

type GuessRecord = CorrectPolitician & {
  guessedParty: string;
  correct: boolean;
  answeredAt: string;
};

const STORAGE_KEYS = {
  score: 'party-rate-score',
  total: 'party-rate-total',
  streak: 'party-rate-streak',
  bestStreak: 'party-rate-best-streak',
  currentStreak: 'party-rate-current-streak-politicians',
  bestStreakPoliticians: 'party-rate-best-streak-politicians',
  guessHistory: 'party-rate-guess-history',
  enabledParties: 'party-rate-enabled-parties',
};

const MIN_ENABLED_PARTIES = 4;

function readStoredNumber(key: string): number {
  return Number(localStorage.getItem(key) || 0);
}

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) as T : fallback;
  } catch {
    return fallback;
  }
}

function politicianToCorrectPolitician(politician: Politician): CorrectPolitician {
  return {
    id: politician.personWikidataId,
    name: politician.name,
    partyName: politician.partyName,
    imageUrl: politician.imageUrl,
  };
}

function readStoredEnabledParties(): string[] {
  const storedParties = readStoredJson<string[]>(STORAGE_KEYS.enabledParties, PARTIES);
  const availablePartySet = new Set(PARTIES);
  const enabledParties = storedParties.filter(partyName => availablePartySet.has(partyName));

  return enabledParties.length >= MIN_ENABLED_PARTIES ? enabledParties : PARTIES;
}

export default function App() {
  const [politician, setPolitician] = useState<Politician | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [modalView, setModalView] = useState<ModalView>(null);
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus>({
    message: 'Datenquelle wird geprüft...',
    source: 'loading',
  });
  
  // Stats
  const [score, setScore] = useState(() => readStoredNumber(STORAGE_KEYS.score));
  const [total, setTotal] = useState(() => readStoredNumber(STORAGE_KEYS.total));
  const [streak, setStreak] = useState(() => readStoredNumber(STORAGE_KEYS.streak));
  const [bestStreak, setBestStreak] = useState(() => readStoredNumber(STORAGE_KEYS.bestStreak));
  const [currentStreakPoliticians, setCurrentStreakPoliticians] = useState<CorrectPolitician[]>(() =>
    readStoredJson<CorrectPolitician[]>(STORAGE_KEYS.currentStreak, [])
  );
  const [bestStreakPoliticians, setBestStreakPoliticians] = useState<CorrectPolitician[]>(() =>
    readStoredJson<CorrectPolitician[]>(STORAGE_KEYS.bestStreakPoliticians, [])
  );
  const [guessHistory, setGuessHistory] = useState<GuessRecord[]>(() =>
    readStoredJson<GuessRecord[]>(STORAGE_KEYS.guessHistory, [])
  );
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>(() =>
    readStoredJson<GuessRecord[]>(STORAGE_KEYS.guessHistory, [])
      .map(guess => guess.id)
      .slice(0, 20)
  );
  const [enabledParties, setEnabledParties] = useState<string[]>(readStoredEnabledParties);
  const isCustomPartySelection = enabledParties.length !== PARTIES.length;

  const loadQuestion = useCallback(async () => {
    setGameState('loading');
    setSelectedAnswer(null);
    setOptions([]);
    setPolitician(null);
    try {
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });
      const data = await fetchRandomPolitician(recentQuestionIds, enabledParties);
      setPolitician(data);
      
      // Generate options
      const wrongParties = getPartyOptions(data.partyName, enabledParties);
      const shuffledWrong = [...wrongParties].sort(() => 0.5 - Math.random()).slice(0, 3);
      const allOptions = [...shuffledWrong, data.partyName].sort(() => 0.5 - Math.random());
      
      setOptions(allOptions);
      setGameState('guessing');
      setRecentQuestionIds(prev => [data.personWikidataId, ...prev].slice(0, 20));
    } catch (err) {
      setGameState('error');
    }
  }, [enabledParties, recentQuestionIds]);

  useEffect(() => {
    loadQuestion();
  }, []); // Initial load

  useEffect(() => {
    const handleDataSourceStatus = (event: Event) => {
      const detail = (event as CustomEvent<DataSourceStatus>).detail;
      setDataSourceStatus(detail);
    };

    window.addEventListener('party-rate-data-source', handleDataSourceStatus);

    return () => {
      window.removeEventListener('party-rate-data-source', handleDataSourceStatus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.score, score.toString());
    localStorage.setItem(STORAGE_KEYS.total, total.toString());
    localStorage.setItem(STORAGE_KEYS.streak, streak.toString());
    localStorage.setItem(STORAGE_KEYS.bestStreak, bestStreak.toString());
  }, [score, total, streak, bestStreak]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentStreak, JSON.stringify(currentStreakPoliticians));
  }, [currentStreakPoliticians]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bestStreakPoliticians, JSON.stringify(bestStreakPoliticians));
  }, [bestStreakPoliticians]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.guessHistory, JSON.stringify(guessHistory));
  }, [guessHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.enabledParties, JSON.stringify(enabledParties));
  }, [enabledParties]);

  const handleToggleParty = (partyName: string) => {
    setEnabledParties(prev => {
      if (prev.includes(partyName)) {
        if (prev.length <= MIN_ENABLED_PARTIES) return prev;

        return prev.filter(enabledPartyName => enabledPartyName !== partyName);
      }

      return PARTIES.filter(availablePartyName => (
        availablePartyName === partyName || prev.includes(availablePartyName)
      ));
    });
  };

  const handleEnableAllParties = () => {
    setEnabledParties(PARTIES);
  };

  const handleSelect = (answer: string) => {
    if (gameState !== 'guessing' || !politician) return;
    
    setSelectedAnswer(answer);
    setGameState('revealed');
    setTotal(t => t + 1);

    const correct = answer === politician.partyName;
    const correctPolitician = politicianToCorrectPolitician(politician);
    const guessRecord: GuessRecord = {
      ...correctPolitician,
      guessedParty: answer,
      correct,
      answeredAt: new Date().toISOString(),
    };
    setGuessHistory(prev => [guessRecord, ...prev].slice(0, 100));

    if (correct) {
      setScore(s => s + 1);
      setCurrentStreakPoliticians(prev => {
        const nextStreakPoliticians = [...prev, correctPolitician];
        setStreak(nextStreakPoliticians.length);
        setBestStreak(currentBest => {
          if (nextStreakPoliticians.length > currentBest) {
            setBestStreakPoliticians(nextStreakPoliticians);
            return nextStreakPoliticians.length;
          }

          return currentBest;
        });

        return nextStreakPoliticians;
      });
    } else {
      setStreak(0);
      setCurrentStreakPoliticians([]);
    }
  };

  const handleReset = () => {
    setScore(0);
    setTotal(0);
    setStreak(0);
    setBestStreak(0);
    setCurrentStreakPoliticians([]);
    setBestStreakPoliticians([]);
    setGuessHistory([]);
    for (const [storageName, key] of Object.entries(STORAGE_KEYS)) {
      if (storageName !== 'enabledParties') {
        localStorage.removeItem(key);
      }
    }
    setModalView(null);
  };

  const renderPoliticianList = (items: CorrectPolitician[]) => (
    <div className="max-h-[min(26rem,60vh)] overflow-y-auto pr-1">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm font-medium text-zinc-500">
          Noch keine richtig geratenen Politiker gespeichert.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <a
              key={`${item.id}-${index}`}
              href={`https://www.wikidata.org/wiki/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-lg object-cover bg-zinc-800"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-100">{item.name}</p>
                <p className="truncate text-xs font-semibold text-zinc-500">{item.partyName}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryList = () => (
    <div className="max-h-[min(28rem,62vh)] overflow-y-auto pr-1">
      {guessHistory.length === 0 ? (
        <p className="py-8 text-center text-sm font-medium text-zinc-500">
          Noch keine vorherigen Guesses gespeichert.
        </p>
      ) : (
        <div className="space-y-2">
          {guessHistory.map((guess, index) => (
            <a
              key={`${guess.id}-${guess.answeredAt}-${index}`}
              href={`https://www.wikidata.org/wiki/${guess.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <img
                src={guess.imageUrl}
                alt={guess.name}
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-lg object-cover bg-zinc-800"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-100">{guess.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Guess: <span className="font-semibold text-zinc-300">{guess.guessedParty}</span>
                    </p>
                    {!guess.correct && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Richtig: <span className="font-semibold text-emerald-400">{guess.partyName}</span>
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full p-1 ${guess.correct ? 'bg-emerald-500 text-emerald-950' : 'bg-red-500 text-red-950'}`}>
                    {guess.correct ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  <Clock className="h-3 w-3" />
                  {new Date(guess.answeredAt).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-100">
            {enabledParties.length} von {PARTIES.length} Parteien aktiv
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Mindestens {MIN_ENABLED_PARTIES} Parteien müssen aktiv bleiben.
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnableAllParties}
          disabled={!isCustomPartySelection}
          className="cursor-pointer rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-default disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600"
        >
          Alle aktivieren
        </button>
      </div>

      <div className="grid max-h-[min(30rem,62vh)] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {PARTIES.map(partyName => {
          const enabled = enabledParties.includes(partyName);
          const locked = enabled && enabledParties.length <= MIN_ENABLED_PARTIES;

          return (
            <button
              key={partyName}
              type="button"
              onClick={() => handleToggleParty(partyName)}
              disabled={locked}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                enabled
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-zinc-100 hover:border-emerald-400 hover:bg-emerald-500/20'
                  : 'border-zinc-800 bg-zinc-900/70 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900'
              } ${locked ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
              title={locked ? `Mindestens ${MIN_ENABLED_PARTIES} Parteien müssen aktiv bleiben` : undefined}
            >
              <span className="min-w-0 text-sm font-bold leading-tight">{partyName}</span>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                enabled ? 'border-emerald-400 bg-emerald-400 text-emerald-950' : 'border-zinc-700 bg-zinc-950'
              }`}>
                {enabled && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const modalTitle = {
    'current-streak': 'Aktuelle Streak',
    'best-streak': 'Beste Streak',
    history: 'Guess-History',
    settings: 'Parteien einstellen',
    'reset-confirm': 'Statistiken resetten?',
  }[modalView || 'history'];
  const isQuestionLoading = gameState === 'loading' || !politician;

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-emerald-500/30 font-sans">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col items-center min-h-screen">
        
        {/* Header */}
        <header className="w-full flex flex-col items-center gap-2 mb-4 sm:mb-8 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-3 px-4 py-1 bg-zinc-900 border border-zinc-800 rounded-full mb-2"
          >
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              dataSourceStatus.source === 'fallback'
                ? 'bg-red-500'
                : dataSourceStatus.source === 'loading'
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
            }`} />
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-400">Deutsche Parteien</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                dataSourceStatus.source === 'fallback'
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : dataSourceStatus.source === 'loading'
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              }`}
              title={dataSourceStatus.message}
            >
              {dataSourceStatus.source === 'fallback'
                ? 'Fallback'
                : dataSourceStatus.source === 'cache'
                  ? `Cache ${dataSourceStatus.count ?? ''}`
                  : dataSourceStatus.source === 'live'
                    ? `Live ${dataSourceStatus.count ?? ''}`
                    : 'Lädt'}
            </span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            Partei Raten
          </h1>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 w-full flex flex-col items-center gap-4 sm:gap-8">
          <ScoreBar
            score={score}
            total={total}
            streak={streak}
            bestStreak={bestStreak}
            isCustomPartySelection={isCustomPartySelection}
            selectedPartyCount={enabledParties.length}
            totalPartyCount={PARTIES.length}
            onReset={() => setModalView('reset-confirm')}
            onShowCurrentStreak={() => setModalView('current-streak')}
            onShowBestStreak={() => setModalView('best-streak')}
            onShowHistory={() => setModalView('history')}
            onShowSettings={() => setModalView('settings')}
          />

          <div className="w-full max-w-5xl flex flex-col items-center min-h-[44rem] sm:min-h-[46rem] lg:min-h-[38rem] [overflow-anchor:none]">
            <AnimatePresence initial={false}>
              {gameState === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ErrorState 
                    message="Die Verbindung zu Wikidata konnte nicht hergestellt werden oder es wurden keine Daten gefunden." 
                    onRetry={loadQuestion} 
                  />
                </motion.div>
              )}

              {gameState !== 'error' && (
                <motion.div
                  key="content"
                  initial={false}
                  animate={{ opacity: 1 }}
                  className="w-full min-h-[44rem] sm:min-h-[46rem] lg:min-h-[38rem] grid grid-cols-1 lg:grid-cols-[minmax(18rem,28rem)_minmax(22rem,1fr)] items-start justify-center gap-5 sm:gap-8 lg:gap-10"
                >
                  {politician ? (
                    <PoliticianCard 
                      politician={politician} 
                      revealed={gameState === 'revealed'} 
                    />
                  ) : (
                    <div className="relative w-full max-w-[min(22rem,calc(100vw-2rem))] sm:max-w-sm md:max-w-md mx-auto">
                      <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
                        <div className="loading-shimmer aspect-[4/5] sm:aspect-[3/4] relative overflow-hidden bg-[radial-gradient(circle_at_center,#27272a_0%,#18181b_45%,#09090b_100%)] flex items-center justify-center text-zinc-500">
                          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-700/70 bg-black/25 px-6 py-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
                            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/60">
                              <span className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping" />
                              <Loader2 className="relative w-9 h-9 text-emerald-300 animate-spin" />
                            </span>
                            <span className="text-xs uppercase tracking-[0.24em] font-black text-zinc-400 animate-pulse">Bild wird geladen</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="w-full max-w-2xl mx-auto lg:mx-0 flex flex-col items-center gap-3 sm:gap-5 lg:sticky lg:top-6">
                    <div className="h-10 sm:h-12 flex items-center justify-center text-center">
                      <h3 className="text-base sm:text-xl font-medium text-zinc-400">
                        {isQuestionLoading ? 'Lade nächste Person...' : 'Von welcher Partei ist diese Person?'}
                      </h3>
                    </div>

                    {isQuestionLoading ? (
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl">
                        {[0, 1, 2, 3].map(index => (
                          <div
                            key={index}
                            className="loading-shimmer relative min-h-14 sm:min-h-16 rounded-xl sm:rounded-2xl border-2 border-zinc-800 bg-zinc-900/70"
                          />
                        ))}
                      </div>
                    ) : (
                      <AnswerOptions 
                        options={options}
                        correctAnswer={politician.partyName}
                        selectedAnswer={selectedAnswer}
                        onSelect={handleSelect}
                      />
                    )}

                    <div className="h-16 sm:h-20 flex items-center justify-center">
                      <motion.button
                        initial={false}
                        animate={{
                          opacity: gameState === 'revealed' ? 1 : 0,
                          y: gameState === 'revealed' ? 0 : 8,
                          pointerEvents: gameState === 'revealed' ? 'auto' : 'none',
                        }}
                        onClick={loadQuestion}
                        className="group flex min-w-56 cursor-pointer items-center justify-center gap-3 px-7 py-4 bg-zinc-100 text-zinc-950 font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-zinc-950/20"
                        tabIndex={gameState === 'revealed' ? 0 : -1}
                        aria-hidden={gameState !== 'revealed'}
                      >
                        Nächste Person
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 sm:mt-16 lg:mt-20 py-6 sm:py-8 border-t border-zinc-900 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/NurNoah/Partei-Raten"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
              <span>Partei Raten von</span>
              <a
                href="https://noah-weissenbach.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300 underline decoration-emerald-400/50 underline-offset-4 transition-colors hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-200"
              >
                Noah Weißenbach IT-Dienstleistungen
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Daten von</span>
            <span className="text-zinc-400 px-2 py-0.5 border border-zinc-800 rounded">Abgeordnetenwatch</span>
            <span>&</span>
            <span className="text-zinc-400 px-2 py-0.5 border border-zinc-800 rounded">Wikidata/Commons</span>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {modalView && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalView(null)}
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
              onClick={event => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stats-modal-title"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-xl bg-zinc-900 p-2 text-zinc-300">
                    {modalView === 'history' && <History className="h-5 w-5" />}
                    {modalView === 'current-streak' && <Flame className="h-5 w-5 text-orange-400" />}
                    {modalView === 'best-streak' && <Trophy className="h-5 w-5 text-yellow-400" />}
                    {modalView === 'settings' && <SlidersHorizontal className="h-5 w-5 text-emerald-400" />}
                    {modalView === 'reset-confirm' && <XCircle className="h-5 w-5 text-red-400" />}
                  </span>
                  <h2 id="stats-modal-title" className="truncate text-xl font-black tracking-tight text-zinc-100">
                    {modalTitle}
                  </h2>
                </div>
                <button
                  onClick={() => setModalView(null)}
                  className="cursor-pointer rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                  title="Schließen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalView === 'current-streak' && renderPoliticianList(currentStreakPoliticians)}
              {modalView === 'best-streak' && renderPoliticianList(bestStreakPoliticians)}
              {modalView === 'history' && renderHistoryList()}
              {modalView === 'settings' && renderSettings()}
              {modalView === 'reset-confirm' && (
                <div className="space-y-5">
                  <p className="text-sm leading-6 text-zinc-400">
                    Score, Streak, Best-Streak und deine Guess-History werden aus diesem Browser gelöscht.
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setModalView(null)}
                      className="cursor-pointer rounded-xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleReset}
                      className="cursor-pointer rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-red-950 transition-colors hover:bg-red-400"
                    >
                      Zurücksetzen
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
