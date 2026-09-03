// ============================================================
// Tournament History Page (#19)
// ============================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Search, Filter, Download, Play, ChevronRight, Calendar,
  Users, Swords, BarChart2, Star, Clock, Award, RefreshCw,
} from 'lucide-react';
import { getAllTournaments, searchTournaments, filterTournaments } from '@/services/tournamentService';
import type { TournamentRecord, TournamentFormat } from '@/types/playground';
import { AI_LEVEL_LABELS, type AILevel } from '@/types/game';
import { PageHeader } from '@/components/ui/PageHeader';

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  'elimination': '⚔️ Elimination',
  'round-robin': '🔄 Round-Robin',
  'swiss': '♟ Swiss',
};

export function TournamentHistoryPage() {
  const [tournaments, setTournaments] = useState(() => getAllTournaments());
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<TournamentFormat | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = searchQuery ? searchTournaments(searchQuery) : [...tournaments];
    result = filterTournaments(result, { format: formatFilter === 'all' ? 'all' : formatFilter });
    return result;
  }, [tournaments, searchQuery, formatFilter]);

  const selected = filtered.find(t => t.id === selectedId) ?? filtered[0];

  const handleExport = (tournament: TournamentRecord) => {
    const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Tournament History"
        subtitle="All completed and ongoing tournaments"
        icon={<Trophy size={14} />}
        backTo="/"
        backLabel="Home"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">

          {/* Left: List */}
          <div className="space-y-3">
            {/* Search & Filter */}
            <div className="card p-3 space-y-2">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search tournaments…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#7d5230]"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'elimination', 'round-robin', 'swiss'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormatFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      formatFilter === f ? 'bg-[#7d5230] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {f === 'all' ? '📋 All' : FORMAT_LABELS[f as TournamentFormat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tournament cards */}
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`card p-4 cursor-pointer transition-all ${
                  selected?.id === t.id ? 'border-[#7d5230] bg-[#7d5230]/5' : 'hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#c8924a] flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 text-sm truncate">{t.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {FORMAT_LABELS[t.format]} · {t.players.length} players
                    </div>
                    {t.champion && (
                      <div className="text-xs font-semibold text-[#d4af37] mt-1">
                        🏆 {t.champion}
                      </div>
                    )}
                    <div className="text-xs text-stone-400">
                      {t.completedAt
                        ? new Date(t.completedAt).toLocaleDateString()
                        : 'In Progress'}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${t.completedAt ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="card p-6 text-center">
                <Trophy size={32} className="mx-auto text-stone-300 mb-2" />
                <p className="text-sm text-stone-400">No tournaments found</p>
              </div>
            )}
          </div>

          {/* Right: Detail */}
          {selected ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {selected.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-stone-500">{FORMAT_LABELS[selected.format]}</span>
                      <span className="text-stone-300">·</span>
                      <span className="text-sm text-stone-500 flex items-center gap-1">
                        <Calendar size={12} /> {selected.completedAt ? new Date(selected.completedAt).toLocaleDateString() : 'In Progress'}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-sm text-stone-500 flex items-center gap-1">
                        <Users size={12} /> {selected.players.length} players
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(selected)}
                    className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2"
                  >
                    <Download size={13} /> Export
                  </button>
                </div>

                {/* Podium */}
                {selected.champion && (
                  <div className="flex items-end justify-center gap-4 mt-4">
                    {/* Runner-up */}
                    <div className="text-center">
                      <div className="w-16 h-12 bg-stone-200 rounded-t-xl flex items-end justify-center pb-2">
                        <span className="text-stone-500 font-black text-lg">2</span>
                      </div>
                      <div className="bg-stone-100 rounded-b-xl px-2 py-2 w-20">
                        <div className="text-xs font-bold text-stone-600 truncate">{selected.runnerUp ?? '—'}</div>
                        <div className="text-xs text-stone-400">Runner-up</div>
                      </div>
                    </div>

                    {/* Champion */}
                    <div className="text-center">
                      <div className="text-2xl mb-1">🏆</div>
                      <div className="w-20 h-20 bg-gradient-to-t from-[#d4af37] to-[#f0d060] rounded-t-xl flex items-end justify-center pb-2">
                        <span className="text-white font-black text-2xl">1</span>
                      </div>
                      <div className="bg-[#d4af37]/20 border border-[#d4af37]/30 rounded-b-xl px-2 py-2 w-24">
                        <div className="text-xs font-bold text-[#7d5230] truncate">{selected.champion}</div>
                        <div className="text-xs text-[#9b7a3c]">Champion</div>
                      </div>
                    </div>

                    {/* 3rd placeholder */}
                    <div className="text-center">
                      <div className="w-14 h-8 bg-stone-100 rounded-t-xl flex items-end justify-center pb-1">
                        <span className="text-stone-400 font-black">3</span>
                      </div>
                      <div className="bg-stone-50 rounded-b-xl px-2 py-2 w-18">
                        <div className="text-xs text-stone-400">—</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Games', value: selected.totalGames, icon: <Swords size={16} /> },
                  { label: 'Avg Duration', value: `${selected.statistics.avgMatchDuration}s`, icon: <Clock size={16} /> },
                  { label: 'Highest Score', value: `${selected.statistics.highestScore}pts`, icon: <Star size={16} /> },
                  { label: 'Total Moves', value: selected.statistics.totalMoves, icon: <BarChart2 size={16} /> },
                ].map(s => (
                  <div key={s.label} className="card p-3 text-center">
                    <div className="flex justify-center text-[#7d5230] mb-1">{s.icon}</div>
                    <div className="text-xl font-black text-stone-800">{s.value}</div>
                    <div className="text-xs text-stone-400">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Players */}
              <div className="card p-4">
                <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                  <Users size={14} className="text-[#7d5230]" /> Players
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selected.players.map((player, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
                      player.name === selected.champion ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-stone-200'
                    }`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-300 to-stone-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {player.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-stone-700 truncate">{player.name}</div>
                        <div className="text-stone-400 capitalize">{player.strategy}</div>
                      </div>
                      {player.name === selected.champion && <Trophy size={12} className="text-[#d4af37] shrink-0 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Match results */}
              <div className="card p-4">
                <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                  <Award size={14} className="text-[#7d5230]" /> Match Results
                </h3>
                <div className="space-y-2">
                  {selected.matches.map(match => (
                    <div key={match.id} className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                      <span className="text-stone-400 font-semibold w-14 shrink-0">Round {match.round}</span>
                      <span className={`flex-1 font-bold text-right ${match.winner === match.playerA ? 'text-stone-800' : 'text-stone-400'}`}>
                        {match.playerA}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-700">{match.scoreA}</span>
                        <span className="text-stone-300 font-bold">-</span>
                        <span className="font-black text-stone-700">{match.scoreB}</span>
                      </div>
                      <span className={`flex-1 font-bold ${match.winner === match.playerB ? 'text-stone-800' : 'text-stone-400'}`}>
                        {match.playerB}
                      </span>
                      {match.winner && (
                        <span className="text-[#d4af37] shrink-0">🏆</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Winner strategy */}
              {selected.winnerStrategy && selected.winnerStrategy !== 'human' && selected.winnerStrategy !== 'custom' && (
                <div className="card p-4 bg-gradient-to-r from-[#7d5230]/5 to-transparent border-[#d4b896]">
                  <div className="text-xs text-stone-500 font-semibold mb-1">Winner Strategy</div>
                  <div className="text-base font-bold text-[#7d5230]">
                    {AI_LEVEL_LABELS[selected.winnerStrategy as AILevel]?.label ?? selected.winnerStrategy}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {AI_LEVEL_LABELS[selected.winnerStrategy as AILevel]?.description}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Trophy size={48} className="mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">Select a tournament to view details</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
