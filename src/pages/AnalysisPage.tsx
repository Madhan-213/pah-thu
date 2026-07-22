import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Trophy, BarChart3, History, Search, Trash2, Brain, Swords, Clock,
  Gauge, Sparkles, Filter, RefreshCw, Award, Activity, LayoutDashboard
} from 'lucide-react';

import { getGameHistory, deleteGame, clearHistory, calculateStats, type RecordedGame } from '@/services/gameHistoryService';
import { Board } from '@/features/game/components/Board';
import { ScoreCard } from '@/features/game/components/ScoreCard';
import { AI_LEVEL_LABELS, type Board as BoardType, type Move, type Player } from '@/types/game';
import { createEmptyBoard, calculatePlayerScore } from '@/engine/scoring';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function AnalysisPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analyzer'>('dashboard');
  const [games, setGames] = useState<RecordedGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Filters for History
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Interactive Replay State for Analyzer
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x (800ms), 2x (400ms), 4x (200ms)
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load games from service
  const refreshGames = () => {
    const loaded = getGameHistory();
    setGames(loaded);
    if (loaded.length > 0 && !selectedGameId) {
      setSelectedGameId(loaded[0].id);
    }
  };

  useEffect(() => {
    refreshGames();
    const gameParam = searchParams.get('game');
    if (gameParam) {
      setSelectedGameId(gameParam);
      setActiveTab('analyzer');
    }
  }, [searchParams]);

  const selectedGame = useMemo(() => {
    return games.find(g => g.id === selectedGameId) || games[0];
  }, [games, selectedGameId]);

  const stats = useMemo(() => calculateStats(games), [games]);

  // ─── Replay Board Computation ─────────────────────────────────
  const replayData = useMemo(() => {
    if (!selectedGame) return { board: createEmptyBoard(), lastMove: null, p1Score: { player: 1 as Player, total: 0, lines: [], breakdown: {} }, p2Score: { player: 2 as Player, total: 0, lines: [], breakdown: {} } };

    const board: BoardType = createEmptyBoard();
    const slicedMoves = selectedGame.moves.slice(0, currentStep);

    slicedMoves.forEach(m => {
      board[m.row][m.col] = m.player;
    });

    const lastMove = slicedMoves.length > 0 ? slicedMoves[slicedMoves.length - 1] : null;
    const p1Score = calculatePlayerScore(board, 1);
    const p2Score = calculatePlayerScore(board, 2);

    return { board, lastMove, p1Score, p2Score, totalMoves: selectedGame.moves.length };
  }, [selectedGame, currentStep]);

  // Auto-play loop for Analyzer
  useEffect(() => {
    if (isPlaying && selectedGame) {
      const intervalMs = Math.max(150, 900 / playbackSpeed);
      playbackRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= selectedGame.moves.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playbackRef.current) clearInterval(playbackRef.current);
    }
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [isPlaying, playbackSpeed, selectedGame]);

  // Filtered games list
  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchesSearch = searchQuery === '' ||
        g.config.player1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.config.player2Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.config.mode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMode = modeFilter === 'all' || g.config.mode === modeFilter;
      return matchesSearch && matchesMode;
    });
  }, [games, searchQuery, modeFilter]);

  const handleDeleteGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGame(id);
    refreshGames();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all recorded match history?')) {
      clearHistory();
      refreshGames();
    }
  };

  const startAnalysis = (gameId: string) => {
    setSelectedGameId(gameId);
    setCurrentStep(0);
    setIsPlaying(false);
    setActiveTab('analyzer');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)' }}
    >
      {/* ─── HEADER ───────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 border-b border-[#e8ddd0]/60"
        style={{ background: 'rgba(253,252,248,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Home
            </button>
            <div className="w-px h-4 bg-stone-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg wood-border flex items-center justify-center">
                <span className="text-white font-bold text-xs">PT</span>
              </div>
              <span className="font-bold text-stone-800 text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
                Game Analysis & Records
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#f0e6d3] p-1 rounded-2xl border border-[#d4b896]/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#7d5230] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-200/50'
              }`}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#7d5230] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-200/50'
              }`}
            >
              <History size={14} />
              Match History ({games.length})
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analyzer'
                  ? 'bg-[#7d5230] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-200/50'
              }`}
            >
              <BarChart3 size={14} />
              Board Replay & Eval
            </button>
          </div>

          {/* Action to setup game */}
          <button
            onClick={() => navigate('/game')}
            className="btn-primary text-xs px-4 py-2"
          >
            + Play Match
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ════════════ TAB 1: DASHBOARD ════════════ */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Trophy size={20} className="text-yellow-600" />}
                  label="Total Matches"
                  value={stats.totalGames.toString()}
                  subtext={`${stats.totalMoves} total moves recorded`}
                />
                <StatCard
                  icon={<Activity size={20} className="text-blue-600" />}
                  label="Average Game Score"
                  value={`${stats.avgScore} pts`}
                  subtext={`Highest score: ${stats.highestScore} pts`}
                />
                <StatCard
                  icon={<Brain size={20} className="text-purple-600" />}
                  label="Most Used AI Level"
                  value={stats.mostUsedAI ? AI_LEVEL_LABELS[stats.mostUsedAI as keyof typeof AI_LEVEL_LABELS]?.label ?? stats.mostUsedAI : 'Balanced'}
                  subtext="AI opponent preference"
                />
                <StatCard
                  icon={<Swords size={20} className="text-red-600" />}
                  label="Favorite Game Mode"
                  value={stats.favoriteMode.toUpperCase()}
                  subtext="Based on played history"
                />
              </div>

              {/* Match Distribution & Quick Replay */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Win/Loss Summary Card */}
                <div className="card p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Win / Loss Ratio
                    </h3>
                    <p className="text-xs text-stone-400 mb-6">Outcome distribution across played games</p>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                          <span>Red Player Wins</span>
                          <span>{stats.player1Wins} ({stats.totalGames > 0 ? Math.round((stats.player1Wins / stats.totalGames) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${stats.totalGames > 0 ? (stats.player1Wins / stats.totalGames) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                          <span>Dark Player Wins</span>
                          <span>{stats.player2Wins} ({stats.totalGames > 0 ? Math.round((stats.player2Wins / stats.totalGames) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-700 rounded-full transition-all"
                            style={{ width: `${stats.totalGames > 0 ? (stats.player2Wins / stats.totalGames) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                          <span>Draws</span>
                          <span>{stats.draws} ({stats.totalGames > 0 ? Math.round((stats.draws / stats.totalGames) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all"
                            style={{ width: `${stats.totalGames > 0 ? (stats.draws / stats.totalGames) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>Scoring rule: 3=3, 4=10, 5=25, 6=56, 7=119</span>
                  </div>
                </div>

                {/* Recent Played Games List */}
                <div className="lg:col-span-2 card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Recent Recorded Matches
                      </h3>
                      <p className="text-xs text-stone-400">Select any match to launch step-by-step analysis</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-bold text-[#7d5230] hover:underline"
                    >
                      View All ({games.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {games.slice(0, 4).map(game => (
                      <MatchCardRow
                        key={game.id}
                        game={game}
                        onAnalyze={() => startAnalysis(game.id)}
                      />
                    ))}
                    {games.length === 0 && (
                      <div className="text-center py-10 text-stone-400 text-sm">
                        No games recorded yet. Play a game to see analysis records here!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════ TAB 2: MATCH HISTORY ════════════ */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Search & Filter Bar */}
              <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by player or mode..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm bg-white/70 focus:outline-none focus:border-[#7d5230]"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                    {['all', 'human-vs-ai', 'ai-vs-ai', 'human-vs-human'].map(m => (
                      <button
                        key={m}
                        onClick={() => setModeFilter(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          modeFilter === m
                            ? 'bg-white text-stone-800 shadow-sm'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {m.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleClearAll}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    Clear History
                  </button>
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGames.map(game => (
                  <MatchCard
                    key={game.id}
                    game={game}
                    onAnalyze={() => startAnalysis(game.id)}
                    onDelete={e => handleDeleteGame(game.id, e)}
                  />
                ))}
              </div>

              {filteredGames.length === 0 && (
                <div className="card p-12 text-center text-stone-400">
                  <History size={36} className="mx-auto mb-3 text-stone-300" />
                  <p className="font-semibold text-stone-600">No matching recorded games found</p>
                  <p className="text-xs mt-1">Try resetting your search filter or play a new game.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════ TAB 3: BOARD REPLAY & EVAL ANALYZER ════════════ */}
          {activeTab === 'analyzer' && selectedGame && (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Match Header Info */}
              <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
                    <span className="font-bold text-stone-800">{selectedGame.config.player1Name}</span>
                    <span className="text-xs text-stone-400">vs</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-700" />
                    <span className="font-bold text-stone-800">{selectedGame.config.player2Name}</span>
                  </div>
                  <span className="text-xs font-semibold bg-[#f0e6d3] text-[#7d5230] px-2.5 py-1 rounded-full border border-[#d4b896]">
                    {selectedGame.config.mode.replace(/-/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span>Played on {selectedGame.date}</span>
                  <span>•</span>
                  <span>{selectedGame.totalMoves} moves</span>
                  <span>•</span>
                  <span className="font-bold text-[#7d5230]">
                    Result: {selectedGame.result.winner === 'draw' ? 'Draw' : `Player ${selectedGame.result.winner} Won`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* Center Replay Board */}
                <div className="xl:col-span-2 card p-6 flex flex-col items-center gap-6">

                  {/* Step Banner */}
                  <div className="flex items-center justify-between w-full max-w-lg">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Move {currentStep} of {selectedGame.moves.length}
                    </div>
                    {replayData.lastMove && (
                      <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
                        Last Move: Cell {String.fromCharCode(65 + replayData.lastMove.col)}{7 - replayData.lastMove.row} by Player {replayData.lastMove.player}
                      </div>
                    )}
                  </div>

                  {/* 7x7 Board Replay */}
                  <Board
                    board={replayData.board}
                    currentPlayer={replayData.lastMove?.player === 1 ? 2 : 1}
                    onCellClick={() => {}}
                    winningLines={[]}
                    lastMove={replayData.lastMove}
                    disabled={true}
                    isAIThinking={false}
                  />

                  {/* Interactive Seek Slider */}
                  <div className="w-full max-w-lg space-y-2">
                    <input
                      type="range"
                      min={0}
                      max={selectedGame.moves.length}
                      value={currentStep}
                      onChange={e => {
                        setIsPlaying(false);
                        setCurrentStep(Number(e.target.value));
                      }}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#7d5230]"
                    />
                    <div className="flex justify-between text-xs text-stone-400 font-mono">
                      <span>Start (0)</span>
                      <span>Move {currentStep}</span>
                      <span>End ({selectedGame.moves.length})</span>
                    </div>
                  </div>

                  {/* Replay Playback Controls */}
                  <div className="flex items-center gap-3 bg-stone-100 p-2 rounded-2xl border border-stone-200">
                    <button
                      onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
                      title="Jump to Start"
                      className="p-2.5 rounded-xl hover:bg-white text-stone-700 transition-colors"
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={() => { setIsPlaying(false); setCurrentStep(prev => Math.max(0, prev - 1)); }}
                      title="Previous Move"
                      className="p-2.5 rounded-xl hover:bg-white text-stone-700 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      onClick={() => setIsPlaying(prev => !prev)}
                      className="btn-primary p-3.5 rounded-xl text-white flex items-center gap-1.5"
                    >
                      {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
                    </button>

                    <button
                      onClick={() => { setIsPlaying(false); setCurrentStep(prev => Math.min(selectedGame.moves.length, prev + 1)); }}
                      title="Next Move"
                      className="p-2.5 rounded-xl hover:bg-white text-stone-700 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => { setIsPlaying(false); setCurrentStep(selectedGame.moves.length); }}
                      title="Jump to End"
                      className="p-2.5 rounded-xl hover:bg-white text-stone-700 transition-colors"
                    >
                      <SkipForward size={16} />
                    </button>

                    <div className="w-px h-6 bg-stone-300 mx-1" />

                    {/* Speed Selector */}
                    {[1, 2, 4].map(s => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          playbackSpeed === s
                            ? 'bg-[#7d5230] text-white shadow-sm'
                            : 'text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Panel — Score Graph & Step-by-Step Log */}
                <div className="space-y-4">

                  {/* Current Step Score Card */}
                  <div className="grid grid-cols-2 gap-3">
                    <ScoreCard
                      score={replayData.p1Score}
                      name={selectedGame.config.player1Name}
                      isActive={replayData.lastMove?.player === 1}
                      isWinner={selectedGame.result.winner === 1}
                    />
                    <ScoreCard
                      score={replayData.p2Score}
                      name={selectedGame.config.player2Name}
                      isActive={replayData.lastMove?.player === 2}
                      isWinner={selectedGame.result.winner === 2}
                    />
                  </div>

                  {/* Move History Log for Replay */}
                  <div className="card p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                      Interactive Move Log
                    </h4>
                    <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                      {selectedGame.moves.map((m, idx) => {
                        const stepNum = idx + 1;
                        const isCurrent = stepNum === currentStep;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setIsPlaying(false);
                              setCurrentStep(stepNum);
                            }}
                            className={`flex items-center gap-2 text-xs p-2 rounded-xl cursor-pointer transition-all ${
                              isCurrent
                                ? 'bg-[#f0e6d3] border border-[#d4b896] text-[#7d5230] font-bold shadow-sm'
                                : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span className="w-6 text-stone-400 font-mono">{stepNum}.</span>
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{
                                background: m.player === 1
                                  ? 'radial-gradient(circle, #e74c3c, #c0392b)'
                                  : 'radial-gradient(circle, #5d6d7e, #2c3e50)',
                              }}
                            />
                            <span className="font-mono font-semibold">
                              Cell {String.fromCharCode(65 + m.col)}{7 - m.row}
                            </span>
                            <span className="text-stone-400 ml-auto">
                              Player {m.player}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext: string }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200/80 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-stone-800 mt-1 capitalize">{value}</div>
        <div className="text-[11px] text-stone-400 mt-1">{subtext}</div>
      </div>
    </div>
  );
}

function MatchCardRow({ game, onAnalyze }: { game: RecordedGame; onAnalyze: () => void }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-stone-100 hover:border-[#d4b896] transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#f0e6d3] flex items-center justify-center font-bold text-xs text-[#7d5230]">
          {game.result.winner === 'draw' ? '=' : `W${game.result.winner}`}
        </div>
        <div>
          <div className="text-sm font-bold text-stone-800">
            {game.config.player1Name} vs {game.config.player2Name}
          </div>
          <div className="text-xs text-stone-400">
            {game.config.mode.replace(/-/g, ' ')} • {game.date}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-mono font-bold text-stone-700">
            {game.result.scores[0]?.total ?? 0} - {game.result.scores[1]?.total ?? 0}
          </div>
          <div className="text-[10px] text-stone-400">{game.totalMoves} moves</div>
        </div>
        <button
          onClick={onAnalyze}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Analyze
        </button>
      </div>
    </div>
  );
}

function MatchCard({ game, onAnalyze, onDelete }: { game: RecordedGame; onAnalyze: () => void; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <div className="card p-5 flex flex-col justify-between hover:shadow-lg transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f0e6d3] text-[#7d5230] border border-[#d4b896]">
            {game.config.mode.replace(/-/g, ' ')}
          </span>
          <button onClick={onDelete} className="text-stone-300 hover:text-red-500 transition-colors p-1">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm font-bold text-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>{game.config.player1Name}</span>
            </div>
            <span className="font-mono text-base">{game.result.scores[0]?.total ?? 0} pts</span>
          </div>

          <div className="flex items-center justify-between text-sm font-bold text-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700" />
              <span>{game.config.player2Name}</span>
            </div>
            <span className="font-mono text-base">{game.result.scores[1]?.total ?? 0} pts</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
        <div className="text-xs text-stone-400">
          <div>{game.date}</div>
          <div>{game.totalMoves} moves</div>
        </div>
        <button onClick={onAnalyze} className="btn-primary text-xs px-4 py-2">
          🔍 Analyze
        </button>
      </div>
    </div>
  );
}
