// ============================================================
// Stats Dashboard Page (#22)
// ============================================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, TrendingDown, Clock, Target, Trophy,
  Swords, Activity, Zap, Filter, Calendar,
} from 'lucide-react';
import { getGameHistory, type RecordedGame } from '@/services/gameHistoryService';
import { getAllProfiles } from '@/services/profileService';
import type { AILevel } from '@/types/game';
import { AI_LEVEL_LABELS } from '@/types/game';
import { LineChart } from '@/components/ui/LineChart';
import { BarChart } from '@/components/ui/BarChart';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { PageHeader } from '@/components/ui/PageHeader';

type Period = '7d' | '30d' | 'all';

function filterByPeriod(games: RecordedGame[], period: Period): RecordedGame[] {
  if (period === 'all') return games;
  const now = Date.now();
  const ms = period === '7d' ? 7 * 86400_000 : 30 * 86400_000;
  return games.filter(g => g.timestamp >= now - ms);
}

export function StatsDashboardPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const allGames = getGameHistory();
  const games = useMemo(() => filterByPeriod(allGames, period), [allGames, period]);

  const stats = useMemo(() => {
    if (games.length === 0) return null;

    const total = games.length;
    const wins = games.filter(g => g.result.winner === 1).length;
    const losses = games.filter(g => g.result.winner === 2).length;
    const draws = games.filter(g => g.result.winner === 'draw').length;
    const winRate = Math.round((wins / total) * 100);

    const avgDuration = Math.round(games.reduce((s, g) => s + (g.durationSeconds ?? 0), 0) / total);
    const avgMoves = Math.round(games.reduce((s, g) => s + g.totalMoves, 0) / total);
    const avgScore = Math.round(games.reduce((s, g) => s + (g.result.scores[0]?.total ?? 0), 0) / total);
    const highestScore = Math.max(...games.map(g => g.result.scores[0]?.total ?? 0));

    // Strategy usage
    const strategyMap: Record<string, { wins: number; total: number }> = {};
    games.forEach(g => {
      const strat = g.config.aiLevel2 ?? 'human';
      if (!strategyMap[strat]) strategyMap[strat] = { wins: 0, total: 0 };
      strategyMap[strat].total++;
      if (g.result.winner === 1) strategyMap[strat].wins++;
    });

    // Score over time (last 20 games)
    const recent = [...games].slice(0, 20).reverse();
    const scoreHistory = recent.map(g => g.result.scores[0]?.total ?? 0);
    const gameDates = recent.map(g => g.date.slice(5)); // MM-DD

    // Win streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    for (const g of games) {
      if (g.result.winner === 1) {
        tempStreak++;
        currentStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (currentStreak > 0) currentStreak = 0;
        tempStreak = 0;
      }
    }

    return { total, wins, losses, draws, winRate, avgDuration, avgMoves, avgScore, highestScore, strategyMap, scoreHistory, gameDates, currentStreak, longestStreak };
  }, [games]);

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Stats Dashboard"
        subtitle="Comprehensive performance analytics"
        icon={<BarChart2 size={14} />}
        backTo="/"
        backLabel="Home"
        actions={
          <div className="flex gap-1.5">
            {(['7d', '30d', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  period === p ? 'bg-[#7d5230] text-white border-[#7d5230]' : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                {p === 'all' ? 'All Time' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 space-y-5">

        {!stats ? (
          <div className="card p-12 text-center">
            <BarChart2 size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              No Game Data Yet
            </h3>
            <p className="text-sm text-stone-400">Play some games to see your performance analytics here.</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Games', value: stats.total, icon: <BarChart2 size={20} />, color: '#7d5230' },
                { label: 'Win Rate', value: `${stats.winRate}%`, icon: <Trophy size={20} />, color: '#27ae60', progress: stats.winRate },
                { label: 'Avg Score', value: `${stats.avgScore}pts`, icon: <Target size={20} />, color: '#2980b9' },
                { label: 'Best Score', value: `${stats.highestScore}pts`, icon: <Zap size={20} />, color: '#d4af37' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-stone-400 font-semibold">{s.label}</div>
                      <div className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50" style={{ color: s.color }}>{s.icon}</div>
                  </div>
                  {s.progress !== undefined && (
                    <div className="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: s.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* W/L/D breakdown + Streaks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Win/Loss/Draw rings */}
              <div className="card p-5">
                <h3 className="font-bold text-stone-700 text-sm mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-[#7d5230]" /> Win/Loss/Draw
                </h3>
                <div className="flex items-center justify-around flex-wrap gap-4">
                  <div className="text-center">
                    <ProgressRing value={stats.winRate} size={88} color="#27ae60" label={`${stats.wins}`} sublabel="Wins" />
                    <div className="text-xs text-green-600 font-bold mt-1">{stats.winRate}%</div>
                  </div>
                  <div className="text-center">
                    <ProgressRing
                      value={Math.round((stats.draws / stats.total) * 100)}
                      size={88} color="#95a5a6"
                      label={`${stats.draws}`} sublabel="Draws"
                    />
                  </div>
                  <div className="text-center">
                    <ProgressRing
                      value={Math.round((stats.losses / stats.total) * 100)}
                      size={88} color="#e74c3c"
                      label={`${stats.losses}`} sublabel="Losses"
                    />
                  </div>
                </div>
              </div>

              {/* Streaks + Averages */}
              <div className="card p-5">
                <h3 className="font-bold text-stone-700 text-sm mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" /> Performance Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Avg Duration', value: `${stats.avgDuration}s`, icon: <Clock size={14} className="text-stone-400" /> },
                    { label: 'Avg Moves', value: stats.avgMoves, icon: <Target size={14} className="text-stone-400" /> },
                    { label: 'Current Streak', value: `${stats.currentStreak}W`, icon: <TrendingUp size={14} className="text-green-500" />, color: '#27ae60' },
                    { label: 'Best Streak', value: `${stats.longestStreak}W`, icon: <Zap size={14} className="text-amber-500" />, color: '#d4af37' },
                  ].map(m => (
                    <div key={m.label} className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                      <div className="flex items-center gap-1 text-stone-400 mb-1 text-xs">{m.icon} {m.label}</div>
                      <div className="text-xl font-black" style={{ color: m.color ?? '#3e2510' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score over time graph */}
            <div className="card p-5">
              <h3 className="font-bold text-stone-700 text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#7d5230]" /> Score Trend (Last {Math.min(20, games.length)} Games)
              </h3>
              <div className="flex justify-center">
                <LineChart
                  dataA={stats.scoreHistory}
                  labelA="Score"
                  colorA="#7d5230"
                  width={580}
                  height={180}
                  xLabels={stats.gameDates}
                  showArea
                />
              </div>
            </div>

            {/* Strategy performance */}
            {Object.keys(stats.strategyMap).length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-stone-700 text-sm mb-4 flex items-center gap-2">
                  <Swords size={14} className="text-[#7d5230]" /> Win Rate vs Opponents
                </h3>
                <BarChart
                  data={Object.entries(stats.strategyMap).map(([strat, data]) => ({
                    label: AI_LEVEL_LABELS[strat as AILevel]?.label ?? strat,
                    valueA: Math.round((data.wins / data.total) * 100),
                  }))}
                  labelA="Win Rate (%)"
                  colorA="#7d5230"
                  width={580}
                  height={200}
                />
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(stats.strategyMap).map(([strat, data]) => {
                    const wr = Math.round((data.wins / data.total) * 100);
                    return (
                      <div key={strat} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: wr >= 60 ? '#27ae60' : wr >= 40 ? '#e67e22' : '#e74c3c' }}
                        />
                        <span className="text-stone-600 flex-1 truncate capitalize">
                          {AI_LEVEL_LABELS[strat as AILevel]?.label ?? strat}
                        </span>
                        <span className="font-bold" style={{ color: wr >= 60 ? '#27ae60' : wr >= 40 ? '#e67e22' : '#e74c3c' }}>
                          {wr}%
                        </span>
                        <span className="text-stone-400">({data.total}g)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
