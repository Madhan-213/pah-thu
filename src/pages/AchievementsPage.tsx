// ============================================================
// Achievement System Page (#21)
// ============================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Star, Lock, CheckCircle, Search, Filter,
  Trophy, TrendingUp, Target, Zap, ChevronRight, Swords,
} from 'lucide-react';
import {
  ACHIEVEMENTS, getUnlockedAchievements, getUnlockedCount, getTotalCount,
} from '@/services/achievementService';
import type { AchievementDefinition } from '@/types/playground';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressRing } from '@/components/ui/ProgressRing';

const BADGE_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: 'from-[#cd7f32]/20 to-[#a05a2c]/10', border: 'border-[#cd7f32]/40', text: 'text-[#a05a2c]', glow: 'rgba(205,127,50,0.3)' },
  silver: { bg: 'from-[#aaa]/20 to-[#888]/10', border: 'border-[#aaa]/40', text: 'text-[#888]', glow: 'rgba(170,170,170,0.3)' },
  gold: { bg: 'from-[#d4af37]/20 to-[#b8960c]/10', border: 'border-[#d4af37]/40', text: 'text-[#9b7a0a]', glow: 'rgba(212,175,55,0.3)' },
  diamond: { bg: 'from-[#a8d8f0]/20 to-[#5aacdb]/10', border: 'border-[#5aacdb]/40', text: 'text-[#2980b9]', glow: 'rgba(90,172,219,0.3)' },
  blue: { bg: 'from-[#3498db]/20 to-[#2980b9]/10', border: 'border-[#3498db]/40', text: 'text-[#2980b9]', glow: 'rgba(52,152,219,0.3)' },
  red: { bg: 'from-[#e74c3c]/20 to-[#c0392b]/10', border: 'border-[#e74c3c]/40', text: 'text-[#c0392b]', glow: 'rgba(231,76,60,0.3)' },
  purple: { bg: 'from-[#9b59b6]/20 to-[#8e44ad]/10', border: 'border-[#9b59b6]/40', text: 'text-[#8e44ad]', glow: 'rgba(155,89,182,0.3)' },
};

type CategoryFilter = 'all' | AchievementDefinition['category'];

const CATEGORY_ICONS: Record<CategoryFilter, React.ReactNode> = {
  all: <Award size={14} />,
  wins: <Trophy size={14} />,
  tournament: <Star size={14} />,
  performance: <Zap size={14} />,
  strategy: <Target size={14} />,
};

export function AchievementsPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAch, setSelectedAch] = useState<AchievementDefinition | null>(null);

  const unlockedMap = useMemo(() => {
    const map = new Map<string, number>();
    getUnlockedAchievements().forEach(a => map.set(a.achievementId, a.unlockedAt));
    return map;
  }, []);

  const filtered = useMemo(() => {
    return ACHIEVEMENTS.filter(a => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (showUnlockedOnly && !unlockedMap.has(a.id)) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [categoryFilter, showUnlockedOnly, searchQuery, unlockedMap]);

  const unlockedCount = getUnlockedCount();
  const totalCount = getTotalCount();
  const pct = Math.round((unlockedCount / totalCount) * 100);

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Achievement System"
        subtitle={`${unlockedCount} of ${totalCount} unlocked`}
        icon={<Award size={14} />}
        backTo="/"
        backLabel="Home"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Progress header */}
        <div className="card p-6 flex items-center gap-6 flex-wrap">
          <ProgressRing
            value={pct}
            size={100}
            strokeWidth={9}
            color="#d4af37"
            label={`${pct}%`}
            sublabel="Complete"
          />
          <div>
            <h2 className="text-2xl font-black text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Achievement Progress
            </h2>
            <p className="text-stone-500 text-sm mt-0.5">{unlockedCount} of {totalCount} achievements unlocked</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {['bronze', 'silver', 'gold', 'diamond', 'blue', 'red', 'purple'].map(badge => {
                const total = ACHIEVEMENTS.filter(a => a.badge === badge).length;
                const unlocked = ACHIEVEMENTS.filter(a => a.badge === badge && unlockedMap.has(a.id)).length;
                const style = BADGE_STYLES[badge];
                return (
                  <div key={badge} className={`px-3 py-1.5 rounded-full border bg-gradient-to-r ${style.bg} ${style.border}`}>
                    <span className={`text-xs font-bold capitalize ${style.text}`}>{badge}: {unlocked}/{total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone */}
          {pct >= 25 && pct < 50 && (
            <div className="ml-auto text-center">
              <div className="text-3xl">🥈</div>
              <div className="text-xs text-stone-500 mt-1 font-semibold">Silver Achiever</div>
            </div>
          )}
          {pct >= 50 && pct < 100 && (
            <div className="ml-auto text-center">
              <div className="text-3xl">🥇</div>
              <div className="text-xs text-stone-500 mt-1 font-semibold">Gold Achiever</div>
            </div>
          )}
          {pct === 100 && (
            <div className="ml-auto text-center">
              <div className="text-3xl">💎</div>
              <div className="text-xs text-stone-500 mt-1 font-semibold">Diamond Master!</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category filter */}
          <div className="flex gap-1.5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'wins', label: 'Wins' },
                { id: 'tournament', label: 'Tournament' },
                { id: 'performance', label: 'Performance' },
                { id: 'strategy', label: 'Strategy' },
              ] as const
            ).map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === cat.id ? 'bg-[#7d5230] text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {CATEGORY_ICONS[cat.id]} {cat.label}
              </button>
            ))}
          </div>

          {/* Unlocked only toggle */}
          <button
            onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              showUnlockedOnly ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-stone-200 text-stone-600'
            }`}
          >
            <CheckCircle size={12} /> Unlocked Only
          </button>

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search achievements…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#7d5230] w-48"
            />
          </div>
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence>
            {filtered.map(ach => {
              const isUnlocked = unlockedMap.has(ach.id);
              const unlockedAt = unlockedMap.get(ach.id);
              const style = BADGE_STYLES[ach.badge ?? 'bronze'];

              return (
                <motion.div
                  key={ach.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedAch(selectedAch?.id === ach.id ? null : ach)}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                    isUnlocked
                      ? `bg-gradient-to-br ${style.bg} border ${style.border}`
                      : 'opacity-60 grayscale border-stone-200'
                  } ${selectedAch?.id === ach.id ? 'ring-2 ring-[#7d5230]' : ''}`}
                  style={isUnlocked ? { boxShadow: `0 0 12px ${style.glow}` } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      isUnlocked ? 'bg-white/60 shadow-sm' : 'bg-stone-100'
                    }`}>
                      {isUnlocked ? ach.icon : <Lock size={20} className="text-stone-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${isUnlocked ? style.text : 'text-stone-500'}`}>{ach.name}</div>
                      <div className="text-xs text-stone-500 leading-tight mt-0.5">{ach.description}</div>
                      {isUnlocked && unlockedAt && (
                        <div className="text-xs text-stone-400 mt-1">
                          {new Date(unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                      {/* Progress bar if available */}
                      {ach.progressMax && !isUnlocked && (
                        <div className="mt-1.5 h-1 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-400 rounded-full" style={{ width: '20%' }} />
                        </div>
                      )}
                    </div>
                    {isUnlocked && (
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* Category badge */}
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs capitalize text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{ach.category}</span>
                    <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full ${style.text} bg-white/50`}>
                      {ach.badge}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Award size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500">No achievements match your filter</p>
          </div>
        )}
      </main>
    </div>
  );
}
