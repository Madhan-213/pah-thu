import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Swords, Brain, Users, Trophy, Zap, Shield, Star, ChevronRight,
  Play, BookOpen, Target, Clock, Award
} from 'lucide-react';

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
  { icon: <Zap size={28} />, title: 'Time Controls', desc: 'Bullet, Blitz, Rapid, or Untimed — you choose the pace.', color: '#e67e22' },
  { icon: <Shield size={28} />, title: 'Strategy Builder', desc: 'Craft and upload your own AI strategy module.', color: '#27ae60' },
  { icon: <Star size={28} />, title: 'Daily Challenges', desc: 'Complete unique puzzles every day and earn rewards.', color: '#8e44ad' },
  { icon: <Users size={28} />, title: 'Team Mode', desc: 'Form teams, battle clans, and climb the team rankings.', color: '#16a085' },
  { icon: <Award size={28} />, title: 'Achievements', desc: 'Unlock badges and titles as you master the game.', color: '#d35400' },
];

const rules = [
  { icon: '♟️', title: '7×7 Board', desc: '49 cells. Players alternate placing one piece per turn. No movement after placing.' },
  { icon: '🎯', title: 'Fill the Board', desc: 'The game ends when all 49 cells are occupied. Then scores are tallied.' },
  { icon: '📏', title: 'Count Your Lines', desc: 'Only horizontal and vertical continuous lines of 3+ pieces score points.' },
  { icon: '🏆', title: 'Scoring System', desc: '3-in-a-row = 3pts · 4 = 10pts · 5 = 25pts · 6 = 56pts · 7 = 119pts' },
];

const testimonials = [
  { name: 'Arjun M.', country: '🇮🇳', rating: '⭐⭐⭐⭐⭐', text: 'Pah Tum is incredibly deep. The AI opponent on Minimax mode is no joke — took me weeks to beat it!' },
  { name: 'Sophie L.', country: '🇫🇷', rating: '⭐⭐⭐⭐⭐', text: 'The most beautiful board game interface I\'ve ever played. Every animation is satisfying.' },
  { name: 'Kenji T.', country: '🇯🇵', rating: '⭐⭐⭐⭐⭐', text: 'I love that the strategy goes all the way up to Monte Carlo. Pure skill, no luck.' },
];

const faqs = [
  { q: 'Is Pah Tum free to play?', a: 'Yes! All core game modes are completely free. Play offline against AI or local two-player with no account needed.' },
  { q: 'Can I play without an account?', a: 'Absolutely. Local games (Human vs Human, vs AI, AI vs AI) all work without signing in.' },
  { q: 'What are the AI difficulty levels?', a: 'We offer 7 levels: Random, Greedy, Defensive, Aggressive, Balanced, Minimax, and Monte Carlo. Each has a distinct playstyle.' },
  { q: 'What time controls are available?', a: 'Bullet (30s, 1min), Blitz (3min, 5min), Rapid (10min, 15min, 30min), and Untimed.' },
  { q: 'Can I play on mobile?', a: 'Yes, the game is fully responsive and works on phones, tablets, and desktops.' },
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

          <div className="hidden md:flex items-center gap-8">
            {['How to Play', 'Features', 'FAQ'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                {item}
              </a>
            ))}
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
        {/* Floating decorative pieces */}
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
            { value: '8', label: 'Game Modes' },
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

      {/* ─── TESTIMONIALS ────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              What Players Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="card p-8"
              >
                <div className="text-lg mb-4">{t.rating}</div>
                <p className="text-stone-600 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full wood-border flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-800 text-sm">{t.name}</div>
                    <div className="text-sm">{t.country}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────── */}
      <section id="faq" className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.5)' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-stone-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Frequently Asked
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="card p-7"
              >
                <div className="flex items-start gap-4">
                  <ChevronRight size={18} className="text-[#7d5230] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-stone-800 mb-2">{faq.q}</h3>
                    <p className="text-stone-500 leading-relaxed text-sm">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────── */}
      <section className="py-24 px-6">
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
              Ready to Play?
            </h2>
            <p className="text-stone-500 mb-8 text-lg">
              No account required. Jump in and start your first game in seconds.
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
            {['Features', 'How to Play', 'FAQ'].map(link => (
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
