import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronUp, Cpu, Gauge, Zap } from 'lucide-react';
import { getLastAIDebugInfo } from '@/engine/strategies';

export function AIDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const info = getLastAIDebugInfo();

  if (!info) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      {/* Debug Header Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-stone-900 text-stone-200 border border-stone-800 shadow-lg text-xs font-mono font-semibold transition-all hover:bg-stone-800"
      >
        <div className="flex items-center gap-2">
          <Bug size={15} className="text-yellow-400" />
          <span>AI DEBUG ENGINE</span>
          <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 text-[10px]">
            {info.strategyName}
          </span>
          <span className="text-stone-400 hidden sm:inline">
            Chosen: <strong className="text-white">{info.chosenMove.label}</strong> (Score: {info.evaluationScore})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-stone-400 text-[10px] hidden md:inline">
            {info.thinkingTimeMs}ms • {info.nodesSearched} nodes
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-stone-950 text-stone-300 rounded-b-2xl border-x border-b border-stone-800 p-5 mt-1 text-xs font-mono shadow-2xl space-y-4"
          >
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">Strategy</div>
                <div className="text-sm font-bold text-yellow-400 mt-0.5">{info.strategyName}</div>
              </div>

              <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">Selected Move</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{info.chosenMove.label}</div>
              </div>

              <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">Thinking Time</div>
                <div className="text-sm font-bold text-blue-400 mt-0.5">{info.thinkingTimeMs} ms</div>
              </div>

              <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">Nodes / Phase</div>
                <div className="text-sm font-bold text-purple-400 mt-0.5 capitalize">
                  {info.nodesSearched > 0 ? `${info.nodesSearched} nodes` : info.gamePhase}
                </div>
              </div>
            </div>

            {/* Selection Rationale */}
            <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800/80 text-stone-300">
              <span className="text-yellow-400 font-bold">Reason: </span>
              <span>{info.reason}</span>
            </div>

            {/* Candidate Moves Table */}
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                Top Candidate Moves Evaluation
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 text-[10px] text-stone-500 uppercase">
                      <th className="py-2 px-2">Rank</th>
                      <th className="py-2 px-2">Cell</th>
                      <th className="py-2 px-2 text-right">Eval Score</th>
                      <th className="py-2 px-2 text-right">Gain</th>
                      <th className="py-2 px-2 text-right">Block</th>
                      <th className="py-2 px-2 text-right">Chain</th>
                      <th className="py-2 px-2 pl-4">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.topCandidates.map((cand, idx) => {
                      const isChosen = cand.row === info.chosenMove.row && cand.col === info.chosenMove.col;
                      const cellLabel = `${String.fromCharCode(65 + cand.col)}${7 - cand.row}`;
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-stone-900 transition-colors ${
                            isChosen ? 'bg-yellow-500/10 text-yellow-300 font-bold' : 'hover:bg-stone-900/40 text-stone-400'
                          }`}
                        >
                          <td className="py-1.5 px-2">#{idx + 1}</td>
                          <td className="py-1.5 px-2 font-bold">{cellLabel}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{cand.score}</td>
                          <td className="py-1.5 px-2 text-right text-emerald-400">+{cand.immediateGain}</td>
                          <td className="py-1.5 px-2 text-right text-red-400">+{cand.threatBlock}</td>
                          <td className="py-1.5 px-2 text-right text-blue-400">+{cand.chainPotential}</td>
                          <td className="py-1.5 px-2 pl-4 text-stone-400 text-[11px] truncate max-w-[200px]">
                            {cand.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
