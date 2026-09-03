// ============================================================
// Player Profiles Page (#20)
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Plus, Edit3, Trophy, Target, BarChart2, Award,
  Star, TrendingUp, Clock, Save, Trash2, ChevronRight,
} from 'lucide-react';
import {
  getAllProfiles, createProfile, updateProfile, deleteProfile,
  setActiveProfile, getActiveProfile, getLeaderboard,
  AVATAR_OPTIONS, COUNTRY_LIST,
} from '@/services/profileService';
import { getUnlockedAchievements, getAchievementById, ACHIEVEMENTS } from '@/services/achievementService';
import type { PlayerProfile } from '@/types/playground';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressRing } from '@/components/ui/ProgressRing';

export function PlayerProfilesPage() {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatar: '🧑', country: 'us' });
  const [leaderboard, setLeaderboard] = useState<PlayerProfile[]>([]);

  const refreshData = () => {
    const p = getAllProfiles();
    setProfiles(p);
    setLeaderboard(getLeaderboard(10));
    const active = getActiveProfile();
    setActiveId(active?.id ?? null);
  };

  useEffect(() => { refreshData(); }, []);

  const selected = profiles.find(p => p.id === selectedId) ?? profiles[0];
  const unlockedAchievements = getUnlockedAchievements();

  const handleCreate = () => {
    if (!editForm.name.trim()) return;
    const profile = createProfile(editForm.name.trim(), editForm.avatar, editForm.country);
    setActiveProfile(profile.id);
    refreshData();
    setSelectedId(profile.id);
    setIsCreating(false);
    setEditForm({ name: '', avatar: '🧑', country: 'us' });
  };

  const handleUpdate = () => {
    if (!selected || !editForm.name.trim()) return;
    updateProfile(selected.id, { name: editForm.name, avatar: editForm.avatar, country: editForm.country });
    refreshData();
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this profile?')) return;
    deleteProfile(id);
    refreshData();
    setSelectedId(profiles.filter(p => p.id !== id)[0]?.id ?? null);
  };

  const startEdit = () => {
    if (!selected) return;
    setEditForm({ name: selected.name, avatar: selected.avatar, country: selected.country });
    setIsEditing(true);
  };

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Player Profiles"
        subtitle="Track your stats, achievements, and rating"
        icon={<User size={14} />}
        backTo="/"
        backLabel="Home"
        actions={
          <button onClick={() => { setIsCreating(true); setEditForm({ name: '', avatar: '🧑', country: 'us' }); }}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={14} /> New Profile
          </button>
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">

          {/* Left: Profile list */}
          <div className="space-y-3">
            {/* Leaderboard */}
            <div className="card p-4">
              <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#7d5230]" /> Leaderboard
              </h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <span className="font-black text-stone-300 w-4">{i + 1}</span>
                    <span className="text-lg shrink-0">{p.avatar}</span>
                    <span className="font-semibold text-stone-700 flex-1 truncate">{p.name}</span>
                    <span className="font-bold text-[#7d5230]">{p.rating}</span>
                    {i === 0 && <Trophy size={12} className="text-[#d4af37]" />}
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-xs text-stone-400">No profiles yet</p>}
              </div>
            </div>

            {/* Profile list */}
            <h3 className="font-bold text-stone-700 text-sm px-1">Profiles ({profiles.length})</h3>
            {profiles.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`card p-3 cursor-pointer transition-all ${selected?.id === p.id ? 'border-[#7d5230] bg-[#7d5230]/5' : 'hover:border-stone-300'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{p.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-stone-800 truncate">{p.name}</div>
                    <div className="text-xs text-stone-400">Rating: {p.rating} · {p.wins}W/{p.losses}L</div>
                  </div>
                  {activeId === p.id && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold shrink-0">Active</span>
                  )}
                </div>
              </div>
            ))}

            {profiles.length === 0 && (
              <div className="card p-6 text-center">
                <User size={32} className="mx-auto text-stone-300 mb-2" />
                <p className="text-sm text-stone-400">No profiles yet</p>
                <button onClick={() => setIsCreating(true)} className="btn-primary mt-3 text-sm px-4 py-2">
                  Create First Profile
                </button>
              </div>
            )}
          </div>

          {/* Right: Profile detail */}
          {selected && !isCreating ? (
            <div className="space-y-4">
              {/* Profile header */}
              <div className="card p-6">
                <div className="flex items-start gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-4xl shadow-sm">
                      {selected.avatar}
                    </div>
                    {activeId === selected.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-bold text-lg focus:outline-none focus:border-[#7d5230]"
                        />
                        <div className="flex gap-2 flex-wrap">
                          {AVATAR_OPTIONS.map(av => (
                            <button key={av} onClick={() => setEditForm(f => ({ ...f, avatar: av }))}
                              className={`text-xl p-1.5 rounded-lg transition-all ${editForm.avatar === av ? 'bg-[#7d5230]/10 ring-2 ring-[#7d5230]' : 'hover:bg-stone-100'}`}>
                              {av}
                            </button>
                          ))}
                        </div>
                        <select value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#7d5230]">
                          {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={handleUpdate} className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
                            <Save size={13} /> Save
                          </button>
                          <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {selected.name}
                          </h2>
                          <span className="text-base">
                            {COUNTRY_LIST.find(c => c.code === selected.country)?.flag}
                          </span>
                        </div>
                        <div className="text-sm text-stone-500 mt-0.5">
                          {COUNTRY_LIST.find(c => c.code === selected.country)?.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-[#7d5230]/10 text-[#7d5230] px-2 py-0.5 rounded-full font-bold">
                            Rating: {selected.rating}
                          </span>
                          {selected.currentRank && (
                            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                              Rank #{selected.currentRank}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={startEdit} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                            <Edit3 size={12} /> Edit
                          </button>
                          {activeId !== selected.id && (
                            <button onClick={() => { setActiveProfile(selected.id); refreshData(); }}
                              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                              Set Active
                            </button>
                          )}
                          <button onClick={() => handleDelete(selected.id)}
                            className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Rating ring */}
                  <ProgressRing
                    value={Math.min(100, Math.round((selected.rating / 2000) * 100))}
                    size={80}
                    color="#7d5230"
                    label={String(selected.rating)}
                    sublabel="Rating"
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Matches', value: selected.matchesPlayed, icon: <BarChart2 size={16} /> },
                  { label: 'Wins', value: selected.wins, icon: <Trophy size={16} /> },
                  { label: 'Losses', value: selected.losses, icon: <Target size={16} /> },
                  { label: 'Draws', value: selected.draws, icon: <Star size={16} /> },
                  { label: 'Tournament Wins', value: selected.tournamentWins, icon: <Award size={16} /> },
                  { label: 'Avg Score', value: `${selected.avgScore}pts`, icon: <TrendingUp size={16} /> },
                  { label: 'Favorite Strategy', value: selected.favoriteStrategy ?? 'None', icon: <Clock size={16} /> },
                  { label: 'Achievements', value: `${unlockedAchievements.filter(a => a.profileId === selected.id).length}/${ACHIEVEMENTS.length}`, icon: <Star size={16} /> },
                ].map(s => (
                  <div key={s.label} className="card p-3 text-center">
                    <div className="flex justify-center text-stone-400 mb-1">{s.icon}</div>
                    <div className="text-lg font-black text-stone-800">{s.value}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Win rate bar */}
              <div className="card p-4">
                <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                  <BarChart2 size={14} className="text-[#7d5230]" /> Win/Loss/Draw Ratio
                </h4>
                {selected.matchesPlayed > 0 ? (
                  <>
                    <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(selected.wins / selected.matchesPlayed) * 100}%` }} />
                      <div className="h-full bg-stone-300" style={{ width: `${(selected.draws / selected.matchesPlayed) * 100}%` }} />
                      <div className="h-full bg-red-400 flex-1" />
                    </div>
                    <div className="flex justify-between text-xs text-stone-500 mt-2">
                      <span className="text-green-600 font-semibold">{Math.round((selected.wins / selected.matchesPlayed) * 100)}% W</span>
                      <span className="text-stone-400">{Math.round((selected.draws / selected.matchesPlayed) * 100)}% D</span>
                      <span className="text-red-500 font-semibold">{Math.round((selected.losses / selected.matchesPlayed) * 100)}% L</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-stone-400">No games played yet</p>
                )}
              </div>

              {/* Achievements */}
              <div className="card p-4">
                <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                  <Award size={14} className="text-[#7d5230]" /> Recent Achievements
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {ACHIEVEMENTS.slice(0, 10).map(ach => {
                    const isUnlocked = unlockedAchievements.some(u => u.achievementId === ach.id);
                    return (
                      <div
                        key={ach.id}
                        title={`${ach.name}: ${ach.description}`}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 border transition-all ${
                          isUnlocked
                            ? 'bg-[#d4af37]/10 border-[#d4af37]/30'
                            : 'bg-stone-50 border-stone-200 opacity-40 grayscale'
                        }`}
                      >
                        <span className="text-xl">{ach.icon}</span>
                        <span className="text-xs text-stone-600 text-center leading-tight mt-1 font-semibold">{ach.name.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => window.location.href = '/achievements'}
                  className="text-xs text-[#7d5230] font-semibold mt-3 flex items-center gap-1 hover:underline">
                  View all achievements <ChevronRight size={12} />
                </button>
              </div>

              {/* Strategy history */}
              {Object.keys(selected.strategyHistory).length > 0 && (
                <div className="card p-4">
                  <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#7d5230]" /> Strategy History
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selected.strategyHistory)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([strategy, count]) => {
                        const total = Object.values(selected.strategyHistory).reduce((s, n) => s + n, 0);
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={strategy}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-stone-700 capitalize">{strategy}</span>
                              <span className="text-stone-400">{count}x ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#7d5230]" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : isCreating ? (
            <div className="card p-6 max-w-md">
              <h3 className="font-bold text-stone-800 text-lg mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>
                Create New Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your name…"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#7d5230]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-2">Avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_OPTIONS.map(av => (
                      <button key={av} onClick={() => setEditForm(f => ({ ...f, avatar: av }))}
                        className={`text-2xl p-2 rounded-xl transition-all ${editForm.avatar === av ? 'bg-[#7d5230]/10 ring-2 ring-[#7d5230]' : 'hover:bg-stone-100 bg-stone-50'}`}>
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-1">Country</label>
                  <select value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#7d5230]">
                    {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCreate} disabled={!editForm.name.trim()}
                    className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                    Create Profile
                  </button>
                  <button onClick={() => setIsCreating(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <User size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                No Profile Selected
              </h3>
              <button onClick={() => setIsCreating(true)} className="btn-primary mt-2 px-6 py-2.5">
                Create First Profile
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
