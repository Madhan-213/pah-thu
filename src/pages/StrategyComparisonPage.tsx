// ============================================================
// Strategy Comparison Page (#14)
// ============================================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Download, Trophy, Clock, Target, TrendingUp, TrendingDown,
  Swords, Shield, Zap, Activity, ChevronRight, RefreshCw,
} from 'lucide-react';
import { AI_LEVEL_LABELS, type AILevel } from '@/types/game';
import type { ComparisonResult } from '@/types/playground';
import { runStrategyComparison } from '@/engine/ai/comparisonEngine';
import { RadarChart } from '@/components/ui/RadarChart';
import { HeatMap } from '@/components/ui/HeatMap';
import { LineChart } from '@/components/ui/LineChart';
import { BarChart } from '@/components/ui/BarChart';
import { PageHeader } from '@/components/ui/PageHeader';

const AI_LEVELS = Object.entries(AI_LEVEL_LABELS) as Array<[AILevel, { label: string; description: string; color: string }]>;

const GAME_COUNT_OPTIONS = [5, 10, 20];

export function StrategyComparisonPage() {
  const [strategyA, setStrategyA] = useState<AILevel>('balanced');
  const [strategyB, setStrategyB] = useState<AILevel>('minimax');
  const [numGames, setNumGames] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'heatmap' | 'graph' | 'radar'>('overview');

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    const comparison = await runStrategyComparison(
      strategyA,
      strategyB,
      numGames,
      (done, total) => setProgress(Math.round((done / total) * 100))
    );

    setResult(comparison);
    setIsRunning(false);
    setProgress(100);
  }, [strategyA, strategyB, numGames]);

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pah-tum-comparison-${result.strategyAName}-vs-${result.strategyBName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bg = 'linear-gradient(160deg, #fdfcf8 0%, #faf7f0 40%, #f5ede0 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      <PageHeader
        title="Strategy Comparison"
        subtitle="Head-to-head AI performance analysis"
        icon={<Swords size={14} />}
        backTo="/"
        backLabel="Home"
        actions={
          result && (
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
              <Download size={14} /> Export
            </button>
          )
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Config card */}
        <div className="card p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_auto] gap-4 items-end">
            {/* Strategy A */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                Strategy A
              </label>
              <select
                value={strategyA}
                onChange={e => setStrategyA(e.target.value as AILevel)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 focus:outline-none focus:border-[#7d5230] bg-white"
              >
                {AI_LEVELS.map(([level, info]) => (
                  <option key={level} value={level}>{info.label}</option>
                ))}
              </select>
              <p className="text-xs text-stone-400 mt-1">{AI_LEVEL_LABELS[strategyA]?.description}</p>
            </div>

            {/* VS divider */}
            <div className="flex items-center justify-center">
              <div className="text-lg font-black text-stone-300 px-2">VS</div>
            </div>

            {/* Strategy B */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                Strategy B
              </label>
              <select
                value={strategyB}
                onChange={e => setStrategyB(e.target.value as AILevel)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 focus:outline-none focus:border-[#7d5230] bg-white"
              >
                {AI_LEVELS.map(([level, info]) => (
                  <option key={level} value={level}>{info.label}</option>
                ))}
              </select>
              <p className="text-xs text-stone-400 mt-1">{AI_LEVEL_LABELS[strategyB]?.description}</p>
            </div>

            {/* Game count */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Games</label>
              <div className="flex gap-1.5">
                {GAME_COUNT_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setNumGames(n)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      numGames === n
                        ? 'bg-[#7d5230] text-white border-[#7d5230]'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={isRunning || strategyA === strategyB}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 whitespace-nowrap"
            >
              {isRunning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <RefreshCw size={15} />
                </motion.div>
              ) : <Play size={15} fill="white" />}
              {isRunning ? `${progress}%` : 'Run'}
            </button>
          </div>

          {/* Progress */}
          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex justify-between text-xs text-stone-400 mb-1">
                  <span>Simulating games…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7d5230, #c8924a)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {strategyA === strategyB && (
            <p className="text-xs text-amber-600 mt-2 font-semibold">⚠ Select two different strategies to compare</p>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Win Rate summary */}
              <div className="card p-5">
                <h3 className="font-bold text-stone-800 text-base mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <Trophy size={16} className="text-[#d4af37]" /> Match Results ({result.gamesPlayed} games)
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: result.strategyAName, wins: result.winsA, rate: result.winRateA, color: '#e74c3c' },
                    { label: 'Draws', wins: result.draws, rate: Math.round((result.draws / result.gamesPlayed) * 100), color: '#95a5a6' },
                    { label: result.strategyBName, wins: result.winsB, rate: result.winRateB, color: '#2980b9' },
                  ].map(item => (
                    <div key={item.label} className="text-center bg-stone-50 rounded-xl p-4 border border-stone-200">
                      <div className="text-3xl font-black" style={{ color: item.color }}>{item.wins}</div>
                      <div className="text-xs font-semibold text-stone-500 mt-1">{item.label}</div>
                      <div className="text-sm font-bold text-stone-700 mt-0.5">{item.rate}%</div>
                    </div>
                  ))}
                </div>

                {/* Win rate bar */}
                <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${result.winRateA}%` }} />
                  <div className="h-full bg-stone-300 transition-all" style={{ width: `${Math.round((result.draws / result.gamesPlayed) * 100)}%` }} />
                  <div className="h-full bg-blue-500 flex-1" />
                </div>
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span className="text-red-600 font-semibold">{result.strategyAName}</span>
                  <span className="text-blue-600 font-semibold">{result.strategyBName}</span>
                </div>
              </div>

              {/* Section tabs */}
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { id: 'overview', label: 'Overview Stats' },
                    { id: 'heatmap', label: 'Heat Maps' },
                    { id: 'graph', label: 'Performance Graph' },
                    { id: 'radar', label: 'Radar Chart' },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      activeSection === tab.id
                        ? 'bg-[#7d5230] text-white border-[#7d5230]'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {activeSection === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Stats table */}
                  <div className="card p-5">
                    <h4 className="font-bold text-stone-700 text-sm mb-4">Performance Stats</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Win Rate', valueA: `${result.winRateA}%`, valueB: `${result.winRateB}%`, icon: <Trophy size={13} /> },
                        { label: 'Avg Score', valueA: `${result.avgScoreA}pts`, valueB: `${result.avgScoreB}pts`, icon: <Target size={13} /> },
                        { label: 'Avg Think Time', valueA: `${result.avgThinkingMsA}ms`, valueB: `${result.avgThinkingMsB}ms`, icon: <Clock size={13} /> },
                        { label: 'Opening Win Rate', valueA: `${result.openingWinRateA}%`, valueB: `${result.openingWinRateB}%`, icon: <Zap size={13} /> },
                        { label: 'Endgame Win Rate', valueA: `${result.endgameWinRateA}%`, valueB: `${result.endgameWinRateB}%`, icon: <TrendingUp size={13} /> },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <div className="text-stone-400 shrink-0">{row.icon}</div>
                          <span className="text-xs text-stone-500 flex-1">{row.label}</span>
                          <span className="text-xs font-bold text-red-600 w-16 text-right">{row.valueA}</span>
                          <span className="text-xs font-bold text-blue-600 w-16 text-right">{row.valueB}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="space-y-3">
                    <div className="card p-4">
                      <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                        <TrendingUp size={13} className="text-green-600" />
                        <span className="text-red-600">{result.strategyAName}</span> Strengths
                      </h4>
                      {result.strengthsA.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-stone-600 mb-1">
                          <ChevronRight size={12} className="text-green-500 mt-0.5 shrink-0" /> {s}
                        </div>
                      ))}
                      <div className="mt-2">
                        <h5 className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><TrendingDown size={11} className="text-red-500" /> Weaknesses</h5>
                        {result.weaknessesA.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-stone-500 mb-1">
                            <ChevronRight size={12} className="text-red-400 mt-0.5 shrink-0" /> {w}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card p-4">
                      <h4 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                        <TrendingUp size={13} className="text-green-600" />
                        <span className="text-blue-600">{result.strategyBName}</span> Strengths
                      </h4>
                      {result.strengthsB.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-stone-600 mb-1">
                          <ChevronRight size={12} className="text-green-500 mt-0.5 shrink-0" /> {s}
                        </div>
                      ))}
                      <div className="mt-2">
                        <h5 className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><TrendingDown size={11} className="text-red-500" /> Weaknesses</h5>
                        {result.weaknessesB.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-stone-500 mb-1">
                            <ChevronRight size={12} className="text-red-400 mt-0.5 shrink-0" /> {w}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="card p-4 bg-[#7d5230]/5 border-[#d4b896]">
                      <h4 className="font-bold text-[#7d5230] text-sm mb-2 flex items-center gap-2">
                        <Trophy size={13} /> Recommendation
                      </h4>
                      <p className="text-sm text-stone-700 leading-relaxed">{result.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Heat Maps */}
              {activeSection === 'heatmap' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { map: result.heatMapA, color: '#e74c3c', label: result.strategyAName },
                    { map: result.heatMapB, color: '#2980b9', label: result.strategyBName },
                  ].map(({ map, color, label }) => (
                    <div key={label} className="card p-5">
                      <h4 className="font-bold text-stone-700 text-sm mb-3" style={{ color }}>
                        {label} — Move Preference Map
                      </h4>
                      <div className="flex justify-center">
                        <HeatMap cells={map.cells} color={color} size={224} showLabels />
                      </div>
                      <p className="text-xs text-stone-400 text-center mt-3">
                        Darker cells = more frequently chosen
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Performance Graph */}
              {activeSection === 'graph' && (
                <div className="card p-5">
                  <h4 className="font-bold text-stone-700 text-sm mb-4">Score History per Game</h4>
                  <div className="flex justify-center">
                    <LineChart
                      dataA={result.scoreHistoryA}
                      dataB={result.scoreHistoryB}
                      labelA={result.strategyAName}
                      labelB={result.strategyBName}
                      colorA="#e74c3c"
                      colorB="#2980b9"
                      width={520}
                      height={200}
                      xLabels={result.scoreHistoryA.map((_, i) => `G${i + 1}`)}
                      showArea
                    />
                  </div>
                </div>
              )}

              {/* Radar Chart */}
              {activeSection === 'radar' && (
                <div className="card p-5 flex flex-col items-center">
                  <h4 className="font-bold text-stone-700 text-sm mb-4">Performance Radar</h4>
                  <RadarChart
                    labels={result.radarData.labels}
                    valuesA={result.radarData.valuesA}
                    valuesB={result.radarData.valuesB}
                    labelA={result.radarData.labelA}
                    labelB={result.radarData.labelB}
                    colorA="#e74c3c"
                    colorB="#2980b9"
                    size={300}
                  />
                  <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-md">
                    {result.radarData.labels.map((label, i) => (
                      <div key={label} className="text-xs flex items-center gap-2">
                        <span className="text-stone-500 flex-1">{label}</span>
                        <span className="text-red-600 font-bold">{result.radarData.valuesA[i]}</span>
                        <span className="text-stone-300">/</span>
                        <span className="text-blue-600 font-bold">{result.radarData.valuesB[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !isRunning && (
          <div className="card p-12 text-center">
            <Swords size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-600 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Strategy Comparison Arena
            </h3>
            <p className="text-sm text-stone-400 max-w-sm mx-auto">
              Choose two different strategies, set the number of simulation games, and run a full head-to-head analysis.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
