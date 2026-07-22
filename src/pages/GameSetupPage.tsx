import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Brain, Bot, Dumbbell, ArrowLeft, Play, Clock,
} from 'lucide-react';
import type { GameConfig, GameMode, AILevel, TimeControl } from '@/types/game';
import { AI_LEVEL_LABELS, TIME_CONTROLS } from '@/types/game';
import { useGameStore } from '@/store/gameStore';

// ─── Constants ────────────────────────────────────────────────
const MODES: Array<{ id: GameMode; label: string; desc: string; icon: React.ReactNode; color: string }> = [
  { id: 'human-vs-human', label: 'Human vs Human', desc: 'Two players on the same device.', icon: <Users size={22} />, color: '#c0392b' },
  { id: 'human-vs-ai',    label: 'Human vs AI',    desc: 'Challenge one of 7 AI opponents.', icon: <Brain size={22} />, color: '#2980b9' },
  { id: 'ai-vs-ai',       label: 'AI vs AI',       desc: 'Watch two AIs battle it out.', icon: <Bot size={22} />, color: '#8e44ad' },
  { id: 'practice',       label: 'Practice Mode',  desc: 'Undo moves freely. No timer.', icon: <Dumbbell size={22} />, color: '#27ae60' },
];

const AI_LEVELS: AILevel[] = ['random', 'greedy', 'defensive', 'aggressive', 'balanced', 'minimax', 'montecarlo'];
const TIME_OPTIONS = Object.entries(TIME_CONTROLS) as [TimeControl, typeof TIME_CONTROLS[TimeControl]][];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Main Component ───────────────────────────────────────────
export function GameSetupPage() {
  const navigate = useNavigate();
  const initGame = useGameStore(s => s.initGame);

  const [mode, setMode]             = useState<GameMode>('human-vs-ai');
  const [aiLevel1, setAiLevel1]     = useState<AILevel>('balanced');   // Red AI (AI vs AI) or the sole AI (Human vs AI)
  const [aiLevel2, setAiLevel2]     = useState<AILevel>('minimax');    // Dark AI (AI vs AI)
  const [timeControl, setTimeCtrl]  = useState<TimeControl>('untimed');
  const [player1Name, setP1Name]    = useState('Player 1');
  const [player2Name, setP2Name]    = useState('Player 2');

  // Derived visibility flags
  const isHvH  = mode === 'human-vs-human';
  const isHvAI = mode === 'human-vs-ai';
  const isAIvAI = mode === 'ai-vs-ai';
  const isPractice = mode === 'practice';
  const showTimer = !isPractice;

  function handleModeChange(newMode: GameMode) {
    setMode(newMode);
    // Reset names to sensible defaults when mode changes
    if (newMode === 'human-vs-human') {
      setP1Name('Player 1');
      setP2Name('Player 2');
    } else if (newMode === 'human-vs-ai') {
      setP1Name('Player 1');
      setP2Name('AI Opponent');
    } else if (newMode === 'ai-vs-ai') {
      setP1Name('Red AI');
      setP2Name('Dark AI');
    } else {
      setP1Name('Player 1');
      setP2Name('Practice');
    }
  }

  function startGame() {
    const config: GameConfig = {
      mode,
      timeControl,
      // For human-vs-ai: player 2 is the AI, so aiLevel2 should control it
      // For ai-vs-ai: aiLevel1 = Red, aiLevel2 = Dark
      aiLevel1: isAIvAI ? aiLevel1 : aiLevel1,
      aiLevel2: isHvAI ? aiLevel1 : aiLevel2,  // FIX: HvAI uses aiLevel1 for the single AI (player 2)
      player1Name: player1Name.trim() || 'Player 1',
      player2Name: player2Name.trim() || (isHvAI ? 'AI' : 'Player 2'),
    };
    initGame(config);
    navigate('/play');
  }

  // Summary helpers
  function getSummaryP1(): string {
    if (isAIvAI) return AI_LEVEL_LABELS[aiLevel1].label;
    return player1Name || 'Player 1';
  }
  function getSummaryP2(): string {
    if (isHvAI) return `AI · ${AI_LEVEL_LABELS[aiLevel1].label}`;
    if (isAIvAI) return AI_LEVEL_LABELS[aiLevel2].label;
    return player2Name || 'Player 2';
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)' }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-30 border-b border-[#e8ddd0]/60"
        style={{ background: 'rgba(253,252,248,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors font-medium text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="w-px h-5 bg-stone-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg wood-border flex items-center justify-center">
                <span className="text-white font-bold text-xs">PT</span>
              </div>
              <span className="font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                New Game
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/analysis')}
            className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            📊 Analysis Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1
            className="text-4xl font-bold text-stone-800 mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Set Up Your Game
          </h1>
          <p className="text-stone-500">Choose your mode, opponent, and time control.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: options ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. Game Mode */}
            <motion.section custom={0} initial="hidden" animate="visible" variants={fadeUp}>
              <SectionTitle>1 · Game Mode</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {MODES.map(m => (
                  <ModeCard
                    key={m.id}
                    {...m}
                    selected={mode === m.id}
                    onClick={() => handleModeChange(m.id)}
                  />
                ))}
              </div>
            </motion.section>

            {/* 2. Player Names — only for human modes */}
            <AnimatePresence>
              {!isAIvAI && (
                <motion.section
                  key="names"
                  custom={1} initial="hidden" animate="visible" exit={{ opacity: 0, height: 0 }} variants={fadeUp}
                >
                  <SectionTitle>2 · Player Names</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <PlayerNameInput
                      label="Red Player"
                      value={player1Name}
                      onChange={setP1Name}
                      color="red"
                      placeholder="Enter name…"
                    />
                    <PlayerNameInput
                      label={isHvH ? 'Dark Player' : 'Your Name / AI Label'}
                      value={player2Name}
                      onChange={setP2Name}
                      color="dark"
                      placeholder="Enter name…"
                    />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* 3a. AI Strategy (Human vs AI) */}
            <AnimatePresence>
              {isHvAI && (
                <motion.section
                  key="ai-single"
                  custom={2} initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={fadeUp}
                >
                  <SectionTitle>3 · AI Difficulty</SectionTitle>
                  <p className="text-xs text-stone-400 mt-1 mb-3">Choose how challenging the AI opponent should be.</p>
                  <AISelector value={aiLevel1} onChange={setAiLevel1} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* 3b. Dual AI Strategies (AI vs AI) */}
            <AnimatePresence>
              {isAIvAI && (
                <motion.section
                  key="ai-dual"
                  custom={2} initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={fadeUp}
                  className="space-y-5"
                >
                  {/* Red AI */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, #e74c3c, #c0392b)' }} />
                      <SectionTitle>Red AI Strategy</SectionTitle>
                    </div>
                    <AISelector
                      value={aiLevel1}
                      onChange={val => { setAiLevel1(val); }}
                    />
                  </div>

                  <div className="border-t border-[#e8ddd0]" />

                  {/* Dark AI */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, #5d6d7e, #2c3e50)' }} />
                      <SectionTitle>Dark AI Strategy</SectionTitle>
                    </div>
                    <AISelector
                      value={aiLevel2}
                      onChange={val => { setAiLevel2(val); }}
                    />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* 4. Time Control */}
            <AnimatePresence>
              {showTimer && (
                <motion.section
                  key="timer"
                  custom={3} initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={fadeUp}
                >
                  <SectionTitle>{isAIvAI ? '3' : '4'} · Time Control</SectionTitle>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {TIME_OPTIONS.map(([key, tc]) => (
                      <button
                        key={key}
                        onClick={() => setTimeCtrl(key)}
                        className={`
                          p-3 rounded-xl border-2 text-center transition-all duration-200 text-sm
                          ${timeControl === key
                            ? 'border-[#7d5230] bg-[#f0e6d3] text-[#7d5230] font-bold shadow-sm'
                            : 'border-[#e8ddd0] bg-white/70 text-stone-600 hover:border-[#d4b896] hover:bg-[#faf7f0]'
                          }
                        `}
                      >
                        <div className="font-semibold">{tc.label}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{tc.category}</div>
                      </button>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: summary ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="sticky top-24">
              <div className="card p-7">
                <h3
                  className="text-lg font-bold text-stone-800 mb-6"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Game Summary
                </h3>

                <div className="space-y-4 mb-8">
                  <SummaryRow
                    icon={<Users size={14} />}
                    label="Mode"
                    value={MODES.find(m => m.id === mode)?.label ?? ''}
                  />

                  {/* Red piece */}
                  <SummaryRow
                    icon={<div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: 'radial-gradient(circle, #e74c3c, #c0392b)' }} />}
                    label={isAIvAI ? 'Red AI' : 'Red'}
                    value={getSummaryP1()}
                  />

                  {/* Dark piece */}
                  <SummaryRow
                    icon={<div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: 'radial-gradient(circle, #5d6d7e, #2c3e50)' }} />}
                    label={isAIvAI ? 'Dark AI' : isHvAI ? 'AI' : 'Dark'}
                    value={getSummaryP2()}
                  />

                  {showTimer && (
                    <SummaryRow
                      icon={<Clock size={14} />}
                      label="Time"
                      value={TIME_CONTROLS[timeControl].label}
                    />
                  )}
                  {isPractice && (
                    <SummaryRow
                      icon={<span className="text-xs">↩</span>}
                      label="Undo"
                      value="Available"
                    />
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startGame}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
                >
                  <Play size={18} fill="white" />
                  Start Game
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">{children}</h2>
  );
}

function ModeCard({
  id, label, desc, icon, color, selected, onClick,
}: {
  id: GameMode; label: string; desc: string; icon: React.ReactNode;
  color: string; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        text-left p-5 rounded-2xl border-2 transition-all duration-200 w-full
        ${selected
          ? 'border-[#7d5230] bg-[#f0e6d3] shadow-[0_0_0_3px_rgba(125,82,48,0.12)]'
          : 'border-[#e8ddd0] bg-white/70 hover:border-[#d4b896] hover:bg-[#faf7f0]'
        }
      `}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div className="font-bold text-stone-800 text-sm">{label}</div>
      <div className="text-xs text-stone-500 mt-1 leading-relaxed">{desc}</div>
      {selected && (
        <div className="mt-2 text-xs font-bold text-[#7d5230]">✓ Selected</div>
      )}
    </motion.button>
  );
}

function PlayerNameInput({
  label, value, onChange, color, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  color: 'red' | 'dark'; placeholder: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{
            background: color === 'red'
              ? 'radial-gradient(circle, #e74c3c, #c0392b)'
              : 'radial-gradient(circle, #5d6d7e, #2c3e50)',
          }}
        />
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</label>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        className="w-full px-4 py-3 rounded-xl border-2 border-[#e8ddd0] bg-white/70 text-stone-800 font-medium text-sm placeholder:text-stone-300 focus:outline-none focus:border-[#b8926a] transition-colors"
      />
    </div>
  );
}

function AISelector({
  value, onChange,
}: {
  value: AILevel;
  onChange: (v: AILevel) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {AI_LEVELS.map(level => {
        const info = AI_LEVEL_LABELS[level];
        const selected = value === level;
        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            title={info.description}
            className={`
              p-3 rounded-xl border-2 text-center transition-all duration-200 text-sm
              ${selected
                ? 'border-[#7d5230] bg-[#f0e6d3] shadow-sm'
                : 'border-[#e8ddd0] bg-white/70 hover:border-[#d4b896] hover:bg-[#faf7f0]'
              }
            `}
          >
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1.5"
              style={{ background: info.color }}
            />
            <div className={`font-semibold text-xs ${selected ? 'text-[#7d5230]' : 'text-stone-700'}`}>
              {info.label}
            </div>
            {selected && (
              <div className="text-[10px] text-[#7d5230] mt-0.5 font-bold">✓</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-2">
      <div className="flex items-center gap-2 text-stone-500 shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-stone-800 text-right truncate max-w-[140px]">{value}</span>
    </div>
  );
}
