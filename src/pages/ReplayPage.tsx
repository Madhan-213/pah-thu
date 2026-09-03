// ============================================================
// Match Replay Center Page (#18)
// ============================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Download, Share2, Search, Trash2, Trophy, Clock, BarChart2,
  MessageSquare, Star, Zap, FastForward,
} from 'lucide-react';
import { getGameHistory, deleteGame, type RecordedGame } from '@/services/gameHistoryService';
import { Board } from '@/features/game/components/Board';
import { calculatePlayerScore, createEmptyBoard, findLines } from '@/engine/scoring';
import type { Board as BoardType, Player, Move } from '@/types/game';
import { AI_LEVEL_LABELS } from '@/types/game';
import { PageHeader } from '@/components/ui/PageHeader';

const SPEED_OPTIONS = [
  { label: '0.5x', ms: 1600 },
  { label: '1x', ms: 800 },
  { label: '2x', ms: 400 },
  { label: '4x', ms: 200 },
];

export function ReplayPage() {
  const [games, setGames] = useState<RecordedGame[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [comments, setComments] = useState<Record<number, string>>({});
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [highlightMode, setHighlightMode] = useState<'scoring' | 'winning' | 'none'>('scoring');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loaded = getGameHistory();
    setGames(loaded);
    if (loaded.length > 0 && !selectedId) setSelectedId(loaded[0].id);
  }, []);

  const selectedGame = useMemo(() => games.find(g => g.id === selectedId) ?? games[0], [games, selectedId]);

  const filteredGames = useMemo(() => {
    if (!searchQuery) return games;
    const q = searchQuery.toLowerCase();
    return games.filter(g =>
      g.config.player1Name.toLowerCase().includes(q) ||
      g.config.player2Name.toLowerCase().includes(q) ||
      g.date.toLowerCase().includes(q) ||
      g.config.mode.includes(q)
    );
  }, [games, searchQuery]);

  const replayData = useMemo(() => {
    if (!selectedGame) return null;
    const board: BoardType = createEmptyBoard();
    selectedGame.moves.slice(0, currentStep).forEach(m => { board[m.row][m.col] = m.player; });
    const lastMove = currentStep > 0 ? selectedGame.moves[currentStep - 1] : null;
    const p1Score = calculatePlayerScore(board, 1);
    const p2Score = calculatePlayerScore(board, 2);
    const winningLines = currentStep === selectedGame.moves.length ? (selectedGame.result.winningLines ?? []) : [];
    const scoringLines = highlightMode === 'scoring' ? [...p1Score.lines, ...p2Score.lines] : [];
    return { board, lastMove, p1Score, p2Score, winningLines, scoringLines };
  }, [selectedGame, currentStep, highlightMode]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || !selectedGame) return;
    intervalRef.current = setInterval(() => {
      setCurrentStep(s => {
        if (s >= selectedGame.moves.length) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, SPEED_OPTIONS[speedIdx].ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speedIdx, selectedGame]);

  const selectGame = (id: string) => {
    setSelectedId(id);
    setCurrentStep(0);
    setIsPlaying(false);
    setComments({});
  };

  const handleDelete = (id: string) => {
    deleteGame(id);
    const updated = getGameHistory();
    setGames(updated);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id ?? null);
      setCurrentStep(0);
    }
  };

  const handleExport = () => {
    if (!selectedGame) return;
    const data = JSON.stringify({ ...selectedGame, replayComments: comments }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replay-${selectedGame.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/analysis?game=${selectedId}`;
    navigator.clipboard.writeText(url);
    alert('Replay link copied to clipboard!');
  };

  const saveComment = (step: number) => {
    if (commentDraft.trim()) {
      setComments(c => ({ ...c, [step]: commentDraft.trim() }));
    } else {
      setComments(c => { const next = { ...c }; delete next[step]; return next; });
    }
    setEditingComment(null);
    setCommentDraft('');
  };

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Match Replay Center"
        subtitle="Review, analyze, and share every completed game"
        icon={<Play size={14} />}
        backTo="/"
        backLabel="Home"
        actions={
          selectedGame && (
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2">
                <Share2 size={13} /> Share
              </button>
              <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2">
                <Download size={13} /> Export
              </button>
            </div>
          )
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">

          {/* Left: Game list */}
          <div className="card p-4 space-y-3 xl:max-h-[80vh] xl:overflow-y-auto">
            <div className="sticky top-0 bg-white pb-2 z-10">
              <h3 className="font-bold text-stone-700 text-sm mb-2 flex items-center gap-2">
                <BarChart2 size={14} className="text-[#7d5230]" /> Saved Replays ({games.length})
              </h3>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search games…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#7d5230]"
                />
              </div>
            </div>

            {filteredGames.map(game => (
              <div
                key={game.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedId === game.id ? 'border-[#7d5230] bg-[#7d5230]/5' : 'border-stone-200 hover:border-stone-300'
                }`}
                onClick={() => selectGame(game.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-stone-700 truncate">
                      {game.config.player1Name} vs {game.config.player2Name}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">{game.date}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold" style={{ color: game.result.winner === 1 ? '#c0392b' : game.result.winner === 2 ? '#2c3e50' : '#95a5a6' }}>
                        {game.result.winner === 'draw' ? '⊜ Draw' : `🏆 ${game.result.winner === 1 ? game.config.player1Name : game.config.player2Name}`}
                      </span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs text-stone-400">{game.totalMoves} moves</span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(game.id); }}
                    className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filteredGames.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-sm">No games found</div>
            )}
          </div>

          {/* Right: Replay view */}
          {selectedGame && replayData ? (
            <div className="space-y-4">
              {/* Game info */}
              <div className="card p-4 flex items-center gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-stone-400 font-semibold">Game</div>
                  <div className="text-sm font-bold text-stone-800">
                    {selectedGame.config.player1Name} vs {selectedGame.config.player2Name}
                  </div>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <div className="text-xs text-stone-400">Mode</div>
                  <div className="text-sm font-semibold text-stone-600">{selectedGame.config.mode.replace(/-/g, ' ')}</div>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <div className="text-xs text-stone-400">Winner</div>
                  <div className="text-sm font-bold" style={{ color: selectedGame.result.winner === 1 ? '#c0392b' : selectedGame.result.winner === 2 ? '#2c3e50' : '#95a5a6' }}>
                    {selectedGame.result.winner === 'draw' ? 'Draw' : selectedGame.result.winner === 1 ? selectedGame.config.player1Name : selectedGame.config.player2Name}
                  </div>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <div className="text-xs text-stone-400">Duration</div>
                  <div className="text-sm font-semibold text-stone-600 flex items-center gap-1">
                    <Clock size={12} /> {selectedGame.durationSeconds}s
                  </div>
                </div>

                {/* Highlight mode */}
                <div className="ml-auto flex gap-1.5">
                  {(
                    [{ id: 'scoring', label: '📏 Lines' }, { id: 'winning', label: '🏆 Winner' }, { id: 'none', label: 'None' }] as const
                  ).map(h => (
                    <button
                      key={h.id}
                      onClick={() => setHighlightMode(h.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        highlightMode === h.id ? 'bg-[#7d5230] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score display */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { player: 1 as Player, name: selectedGame.config.player1Name, score: replayData.p1Score, color: '#c0392b' },
                  { player: 2 as Player, name: selectedGame.config.player2Name, score: replayData.p2Score, color: '#2c3e50' },
                ].map(p => (
                  <div key={p.player} className="card p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: p.color }}>
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-500 truncate">{p.name}</div>
                      <div className="text-lg font-black text-stone-800">{p.score.total}pts</div>
                    </div>
                    {selectedGame.result.winner === p.player && (
                      <Trophy size={16} className="text-yellow-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Board */}
              <div className="flex flex-col items-center gap-4">
                <Board
                  board={replayData.board}
                  currentPlayer={currentStep % 2 === 0 ? 1 : 2}
                  onCellClick={() => {}}
                  winningLines={replayData.winningLines}
                  lastMove={replayData.lastMove}
                  disabled
                  isAIThinking={false}
                />

                {/* Timeline slider */}
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Move {currentStep}</span>
                    <span>of {selectedGame.moves.length}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selectedGame.moves.length}
                    value={currentStep}
                    onChange={e => { setCurrentStep(Number(e.target.value)); setIsPlaying(false); }}
                    className="w-full accent-[#7d5230]"
                  />
                </div>

                {/* Playback controls */}
                <div className="flex items-center gap-2 bg-white/90 border border-[#e8ddd0] px-4 py-2.5 rounded-2xl shadow-sm">
                  <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors" title="First move">
                    <SkipBack size={15} />
                  </button>
                  <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors" title="Previous">
                    <ChevronLeft size={15} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(p => !p)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#7d5230] text-white text-sm font-semibold"
                  >
                    {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>

                  <button onClick={() => setCurrentStep(s => Math.min(selectedGame.moves.length, s + 1))} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors" title="Next">
                    <ChevronRight size={15} />
                  </button>
                  <button onClick={() => { setCurrentStep(selectedGame.moves.length); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors" title="Last move">
                    <SkipForward size={15} />
                  </button>

                  {/* Speed */}
                  <div className="ml-2 flex gap-1">
                    {SPEED_OPTIONS.map((s, i) => (
                      <button
                        key={s.label}
                        onClick={() => setSpeedIdx(i)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                          speedIdx === i ? 'bg-[#7d5230] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Move list with comments */}
              <div className="card p-4">
                <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#7d5230]" /> Move Log & Comments
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {selectedGame.moves.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        currentStep === idx + 1 ? 'bg-[#7d5230]/10 border border-[#d4b896]' : 'hover:bg-stone-50'
                      }`}
                      onClick={() => { setCurrentStep(idx + 1); setIsPlaying(false); }}
                    >
                      <span className="text-xs text-stone-300 w-5 text-right shrink-0 mt-0.5">{idx + 1}.</span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                        style={{ background: m.player === 1 ? '#c0392b' : '#2c3e50' }}
                      />
                      <span className="text-xs font-mono font-bold text-stone-700">
                        {String.fromCharCode(65 + m.col)}{7 - m.row}
                      </span>
                      <span className="text-xs text-stone-400 ml-1">{m.player === 1 ? selectedGame.config.player1Name : selectedGame.config.player2Name}</span>

                      {/* Comment */}
                      {comments[idx + 1] && (
                        <span className="text-xs text-[#7d5230] bg-[#7d5230]/10 px-2 py-0.5 rounded-full ml-1 truncate max-w-32">
                          💬 {comments[idx + 1]}
                        </span>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingComment(idx + 1);
                          setCommentDraft(comments[idx + 1] ?? '');
                        }}
                        className="ml-auto p-1 rounded text-stone-300 hover:text-[#7d5230] transition-colors shrink-0"
                      >
                        <MessageSquare size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Comment input */}
                <AnimatePresence>
                  {editingComment !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex gap-2"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={commentDraft}
                        onChange={e => setCommentDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveComment(editingComment); if (e.key === 'Escape') setEditingComment(null); }}
                        placeholder={`Comment for move ${editingComment}…`}
                        className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#7d5230]"
                      />
                      <button onClick={() => saveComment(editingComment!)} className="btn-primary text-xs px-3 py-1.5">Save</button>
                      <button onClick={() => setEditingComment(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center flex flex-col items-center justify-center">
              <Play size={48} className="text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                No Games Found
              </h3>
              <p className="text-sm text-stone-400">Play some games to build your replay collection</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
