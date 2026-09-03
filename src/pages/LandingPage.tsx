import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Swords, Brain, Users, Trophy, Zap, Shield, Star,
  Play, BookOpen, Target, Clock, Award, Cpu, Dices, Layers, Crosshair, Scale, Workflow,
  FlaskConical, BarChart2, User, Bug, ChevronRight,
} from 'lucide-react';
import { AI_LEVEL_LABELS } from '@/types/game';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  { icon: <Swords size={28} />, title: 'Online Multiplayer', desc: 'Challenge players worldwide in real-time strategic battles.', color: '#c0392b' },
  { icon: <Brain size={28} />, title: 'AI Battle', desc: 'Face 7 unique AI opponents from Random to Monte Carlo.', color: '#2980b9' },
  { icon: <Trophy size={28} />, title: 'Tournaments', desc: 'Compete in elimination, round-robin, and Swiss formats.', color: '#d4af37' },
  { icon: <Zap size={28} />, title: 'Time Controls', desc: 'Bullet (15s, 30s), Blitz (3m, 5m), or Untimed per-move shot clock.', color: '#e67e22' },
  { icon: <Shield size={28} />, title: 'Strategy Builder', desc: 'Craft and inspect AI evaluations with the built-in Debug Panel.', color: '#27ae60' },
  { icon: <Star size={28} />, title: 'Daily Challenges', desc: 'Complete unique puzzles every day and earn rewards.', color: '#8e44ad' },
  { icon: <Users size={28} />, title: 'Team Mode', desc: 'Form teams, battle clans, and climb the team rankings.', color: '#16a085' },
  { icon: <Award size={28} />, title: 'Game Analysis', desc: 'Step-by-step move analyzer, evaluation graphs & match history.', color: '#d35400' },
];

const rules = [
  { icon: '♟️', title: '7×7 Board', desc: '49 cells. Players alternate placing one piece per turn. No movement after placing.' },
  { icon: '🎯', title: 'Fill the Board', desc: 'The game ends when all 49 cells are occupied. Then scores are tallied.' },
  { icon: '📏', title: 'Count Your Lines', desc: 'Only horizontal and vertical continuous lines of 3+ pieces score points.' },
  { icon: '🏆', title: 'Scoring System', desc: '3-in-a-row = 3pts · 4 = 10pts · 5 = 25pts · 6 = 56pts · 7 = 119pts' },
];

const aiStrategyDetails = [
  {
    name: 'Random AI',
    icon: <Dices size={24} className="text-gray-500" />,
    badge: 'Beginner',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
    formula: 'Move = PickRandom(EmptyCells)',
    desc: 'Generates all available empty cells on the 7×7 board and selects one at random without any evaluation. Ideal for warm-up games.',
    color: '#95a5a6',
  },
  {
    name: 'Greedy AI',
    icon: <Zap size={24} className="text-emerald-500" />,
    badge: 'Immediate Points',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    formula: 'Score = Max(ImmediateGain)',
    desc: 'Evaluates candidate moves based strictly on immediate point gains (+3, +10, +25, +56, +119). Ignores long-term planning or opponent threats.',
    color: '#27ae60',
  },
  {
    name: 'Defensive AI',
    icon: <Shield size={24} className="text-blue-500" />,
    badge: 'Counter-Blocker',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-300',
    formula: 'Score = 70% OpponentThreatBlock + 30% OwnGain',
    desc: 'Scans for opponent line completions on their next turn. If the opponent can score, it blocks them immediately before advancing its own attack.',
    color: '#2980b9',
  },
  {
    name: 'Aggressive AI',
    icon: <Crosshair size={24} className="text-red-500" />,
    badge: 'Chain Builder',
    badgeColor: 'bg-red-50 text-red-700 border-red-300',
    formula: 'Score = 75% LongChainPotential + 25% Gain',
    desc: 'Heavily weights extending line chains into 5, 6, and 7-in-a-row continuous lines. Prioritizes building massive high-value scoring lines.',
    color: '#e74c3c',
  },
  {
    name: 'Balanced AI',
    icon: <Scale size={24} className="text-purple-500" />,
    badge: 'Harmonious Strategy',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-300',
    formula: '45% Attack + 45% Defense + 10% Center',
    desc: 'Maintains a 45% attack, 45% defense, and 10% center grid control balance. Adapts automatically as the game transitions into endgame.',
    color: '#8e44ad',
  },
  {
    name: 'Minimax AI',
    icon: <Cpu size={24} className="text-orange-500" />,
    badge: 'Alpha-Beta Lookahead',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-300',
    formula: 'Depth 3-5 Tree Search + Alpha-Beta Pruning',
    desc: 'Evaluates lookahead decision trees up to 5 moves deep. Uses Alpha-Beta pruning, candidate move ordering, and node score memoization.',
    color: '#e67e22',
  },
  {
    name: 'Monte Carlo AI',
    icon: <Workflow size={24} className="text-yellow-600" />,
    badge: 'MCTS Simulation',
    badgeColor: 'bg-yellow-50 text-yellow-700 border-yellow-300',
    formula: '50-80 Match Rollouts → Win Probability %',
    desc: 'Runs dozens of complete game simulations for candidate moves, calculates statistical win probabilities, and chooses the move with max win rate.',
    color: '#d4af37',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)' }}>
      {/* ─── NAV ─────────────────────────────────── */}
      <nav className="sticky top-0 z-30 border-b border-[#e8ddd0]/60" style={{ background: 'rgba(253,252,248,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl wood-border flex items-center justify-center">
              <span className="text-white font-bold text-sm">PT</span>
            </div>
            <span className="font-bold text-xl text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Pah Tum
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {['How to Play', 'Features', 'AI Strategies'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                {item}
              </a>
            ))}
            <button onClick={() => navigate('/playground')} className="text-sm font-medium text-[#7d5230] hover:text-[#5a3a1f] transition-colors">
              🧪 Playground
            </button>
            <button onClick={() => navigate('/stats')} className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
              📊 Stats
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/analysis')}
              className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
            >
              📊 Analysis Dashboard
            </button>
            <button
              onClick={() => navigate('/game')}
              className="btn-primary text-sm px-5 py-2.5"
            >
              Play Now
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        <FloatingPieces />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0e6d3] border border-[#d4b896] text-sm font-semibold text-[#7d5230] mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Now Available — Play Locally for Free
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            The Art of{' '}
            <span className="gradient-text">Strategy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-stone-500 max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Pah Tum is a pure strategy board game on a 7×7 grid.
            Place pieces, build lines, and outsmart your opponent.
            No luck. Only skill.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/game')}
              className="btn-primary text-lg px-10 py-4 flex items-center gap-3 justify-center"
            >
              <Play size={20} fill="white" />
              Play Now — It's Free
            </button>
            <button
              onClick={() => navigate('/analysis')}
              className="btn-secondary text-lg px-8 py-4 flex items-center gap-2 justify-center"
            >
              📊 Game Analysis & Records
            </button>
          </motion.div>

          {/* Board preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20"
          >
            <MiniBoard />
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR ───────────────────────────── */}
      <section className="py-10 border-y border-[#e8ddd0]" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '7', label: 'AI Strategies' },
            { value: '4', label: 'Game Modes' },
            { value: '7×7', label: 'Board Size' },
            { value: '119', label: 'Max Line Score' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Playfair Display, serif' }}>
                {stat.value}
              </div>
              <div className="text-sm text-stone-500 font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Everything You Need
            </h2>
            <p className="text-lg text-stone-500 max-w-xl mx-auto">
              A complete platform built for competitive and casual players alike.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="card p-7 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300"
                  style={{ background: `${f.color}15`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROFESSIONAL FEATURE HUB ────────────── */}
      <section className="py-24 px-6" style={{ background: 'rgba(125,82,48,0.04)', borderTop: '1px solid #e8ddd0', borderBottom: '1px solid #e8ddd0' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7d5230]/10 border border-[#d4b896] text-sm font-bold text-[#7d5230] mb-5">
              🎓 Professional Suite
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Your Strategy Research Platform
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              A complete professional suite for AI research, replay analysis, tournament management, player tracking, and performance analytics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <FlaskConical size={26} />, title: 'Strategy Playground', desc: 'Develop, debug & test custom AI strategies in a live interactive environment.', route: '/playground', color: '#7d5230', emoji: '🧪' },
              { icon: <Bug size={26} />, title: 'Strategy Debugger', desc: 'Inspect AI decision trees, candidate moves, and execution traces in real-time.', route: '/debugger', color: '#e67e22', emoji: '🐛' },
              { icon: <Swords size={26} />, title: 'Strategy Comparison', desc: 'Run head-to-head strategy simulations with heatmaps and radar charts.', route: '/comparison', color: '#e74c3c', emoji: '⚔️' },
              { icon: <Play size={26} />, title: 'Match Replay Center', desc: 'Replay any game move-by-move with full board state history and comments.', route: '/replay', color: '#2980b9', emoji: '▶️' },
              { icon: <Trophy size={26} />, title: 'Tournament History', desc: 'Browse all tournaments with match results, brackets, and champion podiums.', route: '/tournaments', color: '#d4af37', emoji: '🏆' },
              { icon: <User size={26} />, title: 'Player Profiles', desc: 'Create profiles, track ratings, achievements, and your favorite strategies.', route: '/profiles', color: '#27ae60', emoji: '👤' },
              { icon: <Award size={26} />, title: 'Achievement System', desc: '20 achievements across wins, strategy, performance, and tournament categories.', route: '/achievements', color: '#8e44ad', emoji: '🏅' },
              { icon: <BarChart2 size={26} />, title: 'Stats Dashboard', desc: 'Full performance analytics with charts, win rates, and streak tracking.', route: '/stats', color: '#16a085', emoji: '📊' },
            ].map((item, i) => (
              <motion.button
                key={item.title}
                onClick={() => navigate(item.route)}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="card p-6 group text-left w-full"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-stone-800 mb-2 flex items-center gap-2">
                  {item.emoji} {item.title}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-3">{item.desc}</p>
                <div className="flex items-center gap-1 text-xs font-bold" style={{ color: item.color }}>
                  Open <ChevronRight size={12} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW TO PLAY ─────────────────────────── */}
      <section id="how-to-play" className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              How to Play
            </h2>
            <p className="text-lg text-stone-500 max-w-xl mx-auto">
              Simple to learn, deep to master. Four rules, infinite strategy.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map((rule, i) => (
              <motion.div
                key={rule.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="card p-8 flex gap-5 items-start"
              >
                <span className="text-4xl shrink-0">{rule.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">{rule.title}</h3>
                  <p className="text-stone-500 leading-relaxed">{rule.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scoring table */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
            className="mt-10 card p-8"
          >
            <h3 className="text-xl font-bold text-stone-800 mb-6 text-center">Scoring Table</h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { len: 3, pts: 3 },
                { len: 4, pts: 10 },
                { len: 5, pts: 25 },
                { len: 6, pts: 56 },
                { len: 7, pts: 119 },
              ].map(({ len, pts }) => (
                <div key={len} className="text-center p-4 rounded-2xl bg-gradient-to-b from-[#f5ede0] to-[#ede0cc] border border-[#d4b896]/50">
                  <div className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Playfair Display, serif' }}>{pts}</div>
                  <div className="text-xs font-semibold text-stone-500 mt-1">{len}-in-a-row</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── AI STRATEGIES & HOW THEY WORK ───────── */}
      <section id="ai-strategies" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-bold text-stone-600 mb-4">
              <Brain size={14} className="text-[#7d5230]" />
              ENGINE ARCHITECTURE
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              7 AI Strategies — How They Work
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              Every AI level uses a distinct evaluation pipeline — from direct point rushing to Alpha-Beta Minimax tree search and Monte Carlo simulation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiStrategyDetails.map((strat, i) => (
              <motion.div
                key={strat.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="card p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${strat.color}15` }}
                    >
                      {strat.icon}
                    </div>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${strat.badgeColor}`}>
                      {strat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-stone-800 mb-2">{strat.name}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed mb-6">{strat.desc}</p>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Decision Formula</div>
                  <div className="text-xs font-mono font-semibold text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 truncate">
                    {strat.formula}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.5)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="card p-14"
          >
            <div className="text-5xl mb-6">♟️</div>
            <h2 className="text-4xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Ready to Challenge the AI?
            </h2>
            <p className="text-stone-500 mb-8 text-lg">
              No account required. Jump in and test your skills against any of the 7 AI strategies.
            </p>
            <button
              onClick={() => navigate('/game')}
              className="btn-primary text-lg px-12 py-4 flex items-center gap-3 mx-auto"
            >
              <Play size={20} fill="white" />
              Start Playing Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────── */}
      <footer className="border-t border-[#e8ddd0] py-10 px-6" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg wood-border flex items-center justify-center">
              <span className="text-white font-bold text-xs">PT</span>
            </div>
            <span className="font-bold text-stone-700" style={{ fontFamily: 'Playfair Display, serif' }}>Pah Tum</span>
          </div>
          <div className="text-sm text-stone-400">
            © 2026 Pah Tum. A premium strategy board game.
          </div>
          <div className="flex gap-6">
            {['Features', 'How to Play', 'AI Strategies'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Decorative floating pieces ──────────────────────────────
function FloatingPieces() {
  const pieces = [
    { x: '8%', y: '15%', color: 1, delay: 0, size: 48 },
    { x: '85%', y: '10%', color: 2, delay: 1, size: 40 },
    { x: '5%', y: '55%', color: 2, delay: 2, size: 32 },
    { x: '90%', y: '55%', color: 1, delay: 1.5, size: 36 },
    { x: '15%', y: '80%', color: 1, delay: 0.5, size: 28 },
    { x: '80%', y: '78%', color: 2, delay: 2.5, size: 44 },
    { x: '50%', y: '5%', color: 1, delay: 1.2, size: 24 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-25"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color === 1
              ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
              : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
          }}
          animate={{ y: [0, -16, 0], rotate: [0, 5, -3, 0] }}
          transition={{ duration: 5 + p.delay, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Mini board preview ───────────────────────────────────────
const DEMO_BOARD = [
  [1,0,2,0,1,0,2],
  [0,1,0,2,0,1,0],
  [2,0,1,1,1,0,2],
  [0,2,0,1,0,2,0],
  [1,0,2,2,2,0,1],
  [0,1,0,2,0,1,0],
  [2,0,1,0,1,0,2],
];

function MiniBoard() {
  return (
    <div className="inline-block mx-auto relative">
      <div
        className="p-4 rounded-3xl shadow-[0_20px_60px_rgba(126,82,48,0.3)]"
        style={{ background: 'linear-gradient(135deg, #a0693a 0%, #c8924a 30%, #b07840 60%, #8a5828 100%)' }}
      >
        <div className="p-3 rounded-2xl" style={{ background: 'linear-gradient(160deg, #b8894a 0%, #d4a460 50%, #a07038 100%)' }}>
          <div className="grid gap-1.5 p-2 rounded-xl" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', background: 'rgba(0,0,0,0.08)' }}>
            {DEMO_BOARD.map((row, ri) =>
              row.map((val, ci) => (
                <motion.div
                  key={`${ri}-${ci}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (ri * 7 + ci) * 0.015, type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(200,146,74,0.6)' }}
                >
                  {val !== 0 && (
                    <div
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                      style={{
                        background: val === 1
                          ? 'radial-gradient(circle at 35% 35%, #e74c3c, #c0392b)'
                          : 'radial-gradient(circle at 35% 35%, #5d6d7e, #2c3e50)',
                        boxShadow: val === 1
                          ? '0 2px 8px rgba(192,57,43,0.5)'
                          : '0 2px 8px rgba(44,62,80,0.5)',
                      }}
                    />
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        LIVE PREVIEW
      </div>
    </div>
  );
}
