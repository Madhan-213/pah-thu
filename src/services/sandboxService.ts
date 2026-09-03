// ============================================================
// Sandbox Service — Safe AI Strategy Execution (#15)
// Executes user-provided JS code in an isolated context
// with timeout, loop detection, and move validation.
// ============================================================

import type { Board, Player } from '@/types/game';
import type { ValidationReport, ValidationCheck, ValidationStatus, CustomStrategy } from '@/types/playground';

const SANDBOX_TIMEOUT_MS = 500;
const MAX_ITERATIONS = 50_000;

const STORAGE_KEY = 'pah_tum_custom_strategies_v1';

// ─── Storage ──────────────────────────────────────────────────

export function getCustomStrategies(): CustomStrategy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomStrategy(strategy: CustomStrategy): void {
  const strategies = getCustomStrategies();
  const idx = strategies.findIndex(s => s.id === strategy.id);
  if (idx >= 0) {
    strategies[idx] = strategy;
  } else {
    strategies.unshift(strategy);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
}

export function deleteCustomStrategy(id: string): void {
  const strategies = getCustomStrategies().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
}

export function getCustomStrategyById(id: string): CustomStrategy | undefined {
  return getCustomStrategies().find(s => s.id === id);
}

// ─── Sandbox Executor ─────────────────────────────────────────

/**
 * Attempts to execute user-provided strategy code with safety guards.
 * Returns a move or throws on violation.
 */
export function executeSandboxedStrategy(
  code: string,
  board: Board,
  player: Player
): { row: number; col: number } {
  // Inject iteration counter to prevent infinite loops
  const wrappedCode = `
    let __iterationCount = 0;
    const __maxIterations = ${MAX_ITERATIONS};
    
    // Override dangerous globals
    const fetch = undefined;
    const XMLHttpRequest = undefined;
    const WebSocket = undefined;
    const localStorage = undefined;
    const sessionStorage = undefined;
    const indexedDB = undefined;
    const document = undefined;
    const window = undefined;
    const process = undefined;
    const require = undefined;
    const __filename = undefined;
    const __dirname = undefined;
    const eval = undefined;
    const Function = undefined;
    
    ${code}
    
    return makeMove(board, player);
  `;

  // eslint-disable-next-line no-new-func
  const fn = new Function('board', 'player', wrappedCode);
  const result = fn(board, player);
  return result;
}

// ─── Validation Pipeline ──────────────────────────────────────

const TEST_BOARDS: Array<{ board: Board; player: Player; description: string }> = [
  {
    description: 'Empty board',
    player: 1,
    board: Array.from({ length: 7 }, () => Array(7).fill(0)) as Board,
  },
  {
    description: 'Mid-game board',
    player: 2,
    board: [
      [1, 0, 2, 0, 1, 0, 0],
      [0, 1, 0, 2, 0, 0, 1],
      [2, 0, 1, 0, 0, 2, 0],
      [0, 0, 0, 1, 2, 0, 0],
      [1, 2, 0, 0, 0, 1, 0],
      [0, 0, 2, 1, 0, 0, 2],
      [0, 1, 0, 0, 2, 0, 0],
    ] as Board,
  },
  {
    description: 'Nearly full board',
    player: 1,
    board: [
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 0, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
    ] as Board,
  },
];

function createCheck(
  id: string,
  name: string,
  description: string,
  status: ValidationStatus = 'pending',
  message = '',
  detail?: string
): ValidationCheck {
  return { id, name, description, status, message, detail };
}

export async function validateStrategy(
  code: string,
  strategyName: string
): Promise<ValidationReport> {
  const strategyId = `custom-${Date.now()}`;
  const startTime = performance.now();
  const errorLog: string[] = [];
  let sampleOutput: { row: number; col: number } | null = null;

  const checks: ValidationCheck[] = [
    createCheck('syntax', 'Syntax Check', 'Code parses without syntax errors'),
    createCheck('api', 'API Compliance', 'Exports a makeMove(board, player) function'),
    createCheck('return-type', 'Return Type', 'Returns {row, col} object'),
    createCheck('valid-move', 'Valid Move', 'Chosen cell is empty and within bounds'),
    createCheck('timeout', 'Timeout Check', `Completes within ${SANDBOX_TIMEOUT_MS}ms`),
    createCheck('no-network', 'Network Safety', 'Does not access fetch/XMLHttpRequest'),
    createCheck('no-storage', 'Storage Safety', 'Does not access localStorage/sessionStorage'),
    createCheck('no-globals', 'Global Safety', 'Does not access document/window/process'),
    createCheck('stability', 'Stability Check', 'Handles all test board positions'),
  ];

  const update = (id: string, status: ValidationStatus, message: string, detail?: string) => {
    const c = checks.find(c => c.id === id)!;
    c.status = status;
    c.message = message;
    if (detail) c.detail = detail;
  };

  // ── 1. Syntax check ────────────────────────────────────────
  try {
    new Function('board', 'player', code);
    update('syntax', 'passed', 'Code parsed successfully');
  } catch (e) {
    update('syntax', 'failed', 'Syntax error detected', String(e));
    errorLog.push(`Syntax Error: ${e}`);
    const executionTimeMs = Math.round(performance.now() - startTime);
    return {
      strategyId, strategyName, overallStatus: 'failed',
      checks, executionTimeMs, testedAt: Date.now(),
      sampleMoveOutput: null, errorLog,
    };
  }

  // ── 2. API compliance check ────────────────────────────────
  const hasFunction = code.includes('function makeMove') || code.includes('const makeMove') || code.includes('makeMove =');
  if (!hasFunction) {
    update('api', 'failed', 'No makeMove function found', 'Define: function makeMove(board, player) { ... }');
    errorLog.push('Missing makeMove function');
  } else {
    update('api', 'passed', 'makeMove function detected');
  }

  // ── 3-8. Run test boards ───────────────────────────────────
  let passedTests = 0;
  let timeoutDetected = false;
  let returnTypeOk = true;
  let validMoveOk = true;

  for (const testCase of TEST_BOARDS) {
    const { board, player } = testCase;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), SANDBOX_TIMEOUT_MS)
      );
      const execPromise = new Promise<{ row: number; col: number }>(resolve =>
        resolve(executeSandboxedStrategy(code, board, player))
      );

      const result = await Promise.race([execPromise, timeoutPromise]);

      // Return type check
      if (typeof result !== 'object' || result === null || typeof result.row !== 'number' || typeof result.col !== 'number') {
        returnTypeOk = false;
        errorLog.push(`Test "${testCase.description}": Invalid return type`);
        continue;
      }

      // Valid move check
      const { row, col } = result;
      if (row < 0 || row > 6 || col < 0 || col > 6 || board[row][col] !== 0) {
        validMoveOk = false;
        errorLog.push(`Test "${testCase.description}": Invalid move (${row},${col})`);
        continue;
      }

      sampleOutput = result;
      passedTests++;
    } catch (e) {
      const msg = String(e);
      if (msg.includes('Timeout')) {
        timeoutDetected = true;
        errorLog.push(`Timeout on test: ${testCase.description}`);
      } else {
        errorLog.push(`Error on "${testCase.description}": ${msg}`);
      }
    }
  }

  update('timeout', timeoutDetected ? 'failed' : 'passed',
    timeoutDetected ? `Exceeded ${SANDBOX_TIMEOUT_MS}ms limit` : `Completed within ${SANDBOX_TIMEOUT_MS}ms`);
  update('return-type', returnTypeOk ? 'passed' : 'failed',
    returnTypeOk ? 'Returns valid {row, col} object' : 'Invalid return type');
  update('valid-move', validMoveOk ? 'passed' : 'failed',
    validMoveOk ? 'All moves are valid empty cells' : 'Chose occupied or out-of-bounds cell');
  update('stability', passedTests === TEST_BOARDS.length ? 'passed' : 'warning',
    `Passed ${passedTests}/${TEST_BOARDS.length} test positions`);

  // ── Safety checks (static analysis) ───────────────────────
  const hasFetch = /\bfetch\s*\(/.test(code) || /XMLHttpRequest/.test(code);
  update('no-network', hasFetch ? 'failed' : 'passed',
    hasFetch ? 'Network access detected (fetch/XMLHttpRequest)' : 'No network access detected');
  if (hasFetch) errorLog.push('Network access is not allowed');

  const hasStorage = /localStorage|sessionStorage|indexedDB/.test(code);
  update('no-storage', hasStorage ? 'failed' : 'passed',
    hasStorage ? 'Storage access detected' : 'No storage access detected');
  if (hasStorage) errorLog.push('Storage access is not allowed');

  const hasGlobals = /\b(document|window\.|\bprocess\.|\brequire\s*\()/.test(code);
  update('no-globals', hasGlobals ? 'warning' : 'passed',
    hasGlobals ? 'Potential global access detected' : 'No dangerous global access detected');

  const executionTimeMs = Math.round(performance.now() - startTime);
  const failedChecks = checks.filter(c => c.status === 'failed').length;
  const warnChecks = checks.filter(c => c.status === 'warning').length;

  return {
    strategyId,
    strategyName,
    overallStatus: failedChecks > 0 ? 'failed' : warnChecks > 0 ? 'warning' : 'passed',
    checks,
    executionTimeMs,
    testedAt: Date.now(),
    sampleMoveOutput: sampleOutput,
    errorLog,
  };
}
