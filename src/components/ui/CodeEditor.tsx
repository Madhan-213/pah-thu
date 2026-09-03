// ============================================================
// CodeEditor — Styled textarea for custom strategy code input
// ============================================================

import { useState, useRef } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

const TEMPLATE = `// Custom Pah Tum Strategy
// The function receives:
//   board: number[][] (7x7 grid, 0=empty, 1=player1, 2=player2)
//   player: 1 | 2 (current player)
// Must return: { row: number, col: number }

function makeMove(board, player) {
  const emptyCells = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (board[r][c] === 0) emptyCells.push({ row: r, col: c });
    }
  }
  
  // TODO: Add your strategy logic here
  // Example: pick the first empty cell
  return emptyCells[0];
}`;

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  error?: string;
}

export function CodeEditor({
  value,
  onChange,
  height = 320,
  disabled = false,
  error,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTemplate = () => {
    onChange(TEMPLATE);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div style={{ position: 'relative', fontFamily: 'monospace' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        background: '#2c2c2c',
        borderRadius: '10px 10px 0 0',
        borderBottom: '1px solid #444',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca41' }} />
        </div>
        <span style={{ fontSize: 10, color: '#888', fontFamily: 'Inter, sans-serif' }}>strategy.js</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleTemplate}
            disabled={disabled}
            title="Load template"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888', padding: '2px 4px', borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 3, fontSize: 10,
            }}
          >
            <RefreshCw size={10} /> Template
          </button>
          <button
            onClick={handleCopy}
            title="Copy code"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? '#28ca41' : '#888', padding: '2px 4px', borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 3, fontSize: 10,
            }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Line numbers + textarea */}
      <div style={{ display: 'flex', background: '#1e1e1e', borderRadius: '0 0 10px 10px', border: error ? '2px solid #e74c3c' : '2px solid #333' }}>
        {/* Line numbers */}
        <div style={{
          padding: '12px 8px', background: '#252526', borderRight: '1px solid #333',
          color: '#555', fontSize: 12, lineHeight: '18px', userSelect: 'none',
          minWidth: 36, textAlign: 'right', borderRadius: '0 0 0 8px',
        }}>
          {value.split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleTab}
          disabled={disabled}
          spellCheck={false}
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            color: '#d4d4d4',
            fontSize: 12,
            lineHeight: '18px',
            fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
            border: 'none',
            outline: 'none',
            resize: 'none',
            height,
            tabSize: 2,
            borderRadius: '0 0 8px 0',
          }}
        />
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          marginTop: 6, padding: '6px 10px',
          background: 'rgba(231, 76, 60, 0.1)',
          border: '1px solid rgba(231, 76, 60, 0.3)',
          borderRadius: 8, fontSize: 11,
          color: '#e74c3c', fontFamily: 'Inter, sans-serif',
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

export { TEMPLATE as CODE_TEMPLATE };
