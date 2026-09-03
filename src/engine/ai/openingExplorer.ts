// ============================================================
// Opening Explorer Engine (#17)
// ============================================================

import type { Move } from '@/types/game';
import type { OpeningEntry, OpeningStats, OpeningTreeNode } from '@/types/playground';
import type { RecordedGame } from '@/services/gameHistoryService';

function getMoveLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + col)}${7 - row}`;
}

function getOpeningKey(moves: Move[], depth = 8): string {
  return moves.slice(0, depth).map(m => getMoveLabel(m.row, m.col)).join('-');
}

function nameOpening(moves: Move[]): string {
  if (moves.length === 0) return 'Unknown';
  const first = moves[0];
  // Center opening
  if (first.row === 3 && first.col === 3) return 'Center Control';
  // Corner openings
  if ((first.row === 0 || first.row === 6) && (first.col === 0 || first.col === 6)) return 'Corner Attack';
  // Edge openings
  if (first.row === 0 || first.row === 6) return 'Horizontal Edge';
  if (first.col === 0 || first.col === 6) return 'Vertical Edge';
  // Inner ring
  if (first.row >= 2 && first.row <= 4 && first.col >= 2 && first.col <= 4) return 'Inner Ring';
  return 'Flank Opening';
}

export function analyzeOpenings(games: RecordedGame[]): OpeningStats {
  if (games.length === 0) {
    return {
      topOpenings: [],
      bestOpening: null,
      worstOpening: null,
      openingTree: null,
      recommendedOpenings: [],
    };
  }

  // Group games by opening (first 6 moves)
  const openingMap = new Map<string, {
    moves: Move[];
    wins: number;
    total: number;
    totalScore: number;
  }>();

  for (const game of games) {
    if (game.moves.length < 4) continue;
    const key = getOpeningKey(game.moves, 6);
    const existing = openingMap.get(key);
    const winner1 = game.result.winner === 1;
    const score = game.result.scores[0]?.total ?? 0;

    if (existing) {
      existing.total++;
      if (winner1) existing.wins++;
      existing.totalScore += score;
    } else {
      openingMap.set(key, {
        moves: game.moves.slice(0, 6),
        wins: winner1 ? 1 : 0,
        total: 1,
        totalScore: score,
      });
    }
  }

  const entries: OpeningEntry[] = Array.from(openingMap.entries()).map(([key, data]) => ({
    id: key,
    name: nameOpening(data.moves),
    moves: data.moves.map(m => ({ row: m.row, col: m.col, label: getMoveLabel(m.row, m.col) })),
    frequency: data.total,
    winRate: Math.round((data.wins / data.total) * 100),
    avgScore: Math.round(data.totalScore / data.total),
  }));

  const sorted = [...entries].sort((a, b) => b.frequency - a.frequency);
  const byWinRate = [...entries].sort((a, b) => b.winRate - a.winRate);

  const topOpenings = sorted.slice(0, 8);
  const bestOpening = byWinRate[0] ?? null;
  const worstOpening = byWinRate[byWinRate.length - 1] ?? null;
  const recommendedOpenings = byWinRate.slice(0, 3);

  // Build opening tree (depth 4)
  const openingTree = buildOpeningTree(games, 4);

  return { topOpenings, bestOpening, worstOpening, openingTree, recommendedOpenings };
}

function buildOpeningTree(games: RecordedGame[], depth: number): OpeningTreeNode | null {
  if (games.length === 0 || depth === 0) return null;

  function buildNode(moveIndex: number, filteredGames: RecordedGame[]): OpeningTreeNode | null {
    if (moveIndex >= depth || filteredGames.length === 0) return null;

    // Count moves at this position
    const moveCounts = new Map<string, { games: RecordedGame[]; wins: number }>();
    for (const game of filteredGames) {
      if (game.moves.length <= moveIndex) continue;
      const m = game.moves[moveIndex];
      const key = `${m.row}-${m.col}`;
      const existing = moveCounts.get(key);
      if (existing) {
        existing.games.push(game);
        if (game.result.winner === m.player) existing.wins++;
      } else {
        moveCounts.set(key, {
          games: [game],
          wins: game.result.winner === m.player ? 1 : 0,
        });
      }
    }

    // Take top 3 most common moves
    const top = Array.from(moveCounts.entries())
      .sort((a, b) => b[1].games.length - a[1].games.length)
      .slice(0, 3);

    if (top.length === 0) return null;

    // Return the first as root node for the tree
    const [firstKey, firstData] = top[0];
    const [row, col] = firstKey.split('-').map(Number);
    const children = top.slice(1).map(([key, data]) => {
      const [r, c] = key.split('-').map(Number);
      return {
        move: { row: r, col: c, label: getMoveLabel(r, c) },
        frequency: data.games.length,
        winRate: Math.round((data.wins / data.games.length) * 100),
        children: moveIndex + 1 < depth ? [buildNode(moveIndex + 1, data.games)].filter(Boolean) as OpeningTreeNode[] : [],
      };
    });

    const childNode = buildNode(moveIndex + 1, firstData.games);

    return {
      move: { row, col, label: getMoveLabel(row, col) },
      frequency: firstData.games.length,
      winRate: Math.round((firstData.wins / firstData.games.length) * 100),
      children: childNode ? [childNode, ...children] : children,
    };
  }

  return buildNode(0, games);
}
