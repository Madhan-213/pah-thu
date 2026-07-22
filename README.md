# ♟️ Pah Tum — Professional Modern Web Game

![Pah Tum Banner](public/favicon.svg)

> **A AAA-quality, rule-compliant browser implementation of the ancient board game Pah Tum.** Built with React 19, Vite, TypeScript, TailwindCSS v4, Framer Motion, Zustand, and Vitest.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Official Game Rules & Scoring](#-official-game-rules--scoring)
- [Key Features](#-key-features)
- [AI Strategy Architectures](#-ai-strategy-architectures)
- [Game Analysis & Replay Dashboard](#-game-analysis--replay-dashboard)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started & Installation](#-getting-started--installation)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [License & Credits](#-license--credits)

---

## 📖 Overview

**Pah Tum** is an ancient board game played on a **7×7 grid** (49 cells total). Two players alternate turns placing one piece at a time onto any empty cell. Unlike traditional games like Chess or Checkers, **pieces do not move once placed**.

The game continues until all 49 cells are filled. Points are awarded based on contiguous **horizontal** and **vertical** lines of 3 or more pieces of the same color. The player with the highest total score at board completion wins!

This repository provides a complete, production-ready web implementation featuring **7 AI difficulty levels**, **AI vs AI live matches**, **in-game pause/restart controls**, **live mapped line highlights**, **time controls**, and an **interactive match analysis dashboard**.

---

## 📏 Official Game Rules & Scoring

### 1. Board & Setup
- Grid size: **7 rows × 7 columns** (49 cells total).
- Red Player (Player 1) moves first, followed by Dark Player (Player 2).

### 2. Piece Placement
- Players take turns placing one piece in any unoccupied cell `(row, col)`.
- Pieces **cannot be moved, captured, or removed** after placement.

### 3. Continuous Line Scoring
- Only continuous **horizontal** and **vertical** lines of **3 or more pieces** score points.
- **Diagonal lines do NOT score points.**
- Opponent pieces interrupt lines.

### 4. Official Point Table

| Line Length | Points Awarded |
| :---: | :---: |
| **3-in-a-row** | **3 pts** |
| **4-in-a-row** | **10 pts** |
| **5-in-a-row** | **25 pts** |
| **6-in-a-row** | **56 pts** |
| **7-in-a-row** | **119 pts** |

*Note: Shorter lines of 1 or 2 pieces score 0 points.*

---

## ✨ Key Features

### 🎮 4 Diverse Game Modes
1. **Human vs Human (Local)**: Play head-to-head on the same device.
2. **Human vs AI**: Challenge any of the 7 built-in AI strategies.
3. **AI vs AI (Spectator Battle)**: Watch two AI strategies compete live in real time.
4. **Practice Mode**: Test strategies freely with unlimited move undos and no timer pressure.

### 🧠 7 Intelligent AI Algorithms
Choose from 7 distinct AI opponents ranging from beginner to advanced:
- **Random**: Places pieces randomly across available cells.
- **Greedy**: Prioritizes immediate line completion and point maximization.
- **Defensive**: Actively blocks high-scoring opponent lines.
- **Aggressive**: Focuses aggressively on building long 5, 6, or 7-in-a-row lines.
- **Balanced**: Harmonious blend of offensive scoring and opponent blocking.
- **Minimax**: Lookahead minimax evaluation tree.
- **Monte Carlo**: Simulation-driven decision engine.

### ⚡ Dynamic Time Controls & AI Speed
- **Time Controls**: Bullet (15s, 30s, 1m), Blitz (3m, 5m), Rapid (15m, 30m), and Untimed.
- **AI Speed Selection**: Toggle AI execution speed in spectator mode (`⚡ Ultra 40ms`, `🚀 Fast 150ms`, `▶ Normal 450ms`).
- **Emergency Time Saver**: AI automatically accelerates move speed when remaining clock time drops below 25 seconds to prevent accidental timeouts.

### ✨ Live Mapped Line Highlights & Visual Feedback
- **Glowing Line Rings**: Pieces that form valid 3+, 4+, 5+, 6+, or 7-in-a-row lines glow dynamically on the board (Golden glow for Red, Neon Cyan glow for Dark).
- **Floating Points Badges**: Interactive score badges (`+3`, `+10`, `+25`, `+56`, `+119`) float at the center of mapped lines.
- **Clean Wooden Aesthetics**: Real-time rendering with rich wood textures, subtle glassmorphism, smooth Framer Motion animations, and confetti victory celebrations.

### ⏸️ Complete In-Game Controls
- **Pause & Resume**: Freeze game timers and AI thinking anytime.
- **Restart Match**: Confirm restart to re-play the current match with identical settings.
- **Resign / Forfeit**: Forfeit option for competitive matches.
- **Undo**: Single-click move undo in Practice Mode.

---

## 📊 Game Analysis & Replay Dashboard

Access the `/analysis` route anytime from the home page or top navigation:

1. **Dashboard & Analytics Tab**:
   - Aggregate statistics: Total Played, Average Score, Win Rate %, Most Played AI Level.
   - Visual win/loss ratio distributions.
2. **Match History Log Tab**:
   - Filterable list of all recorded local matches.
   - Search by player name or game mode.
   - Delete individual match records or clear storage.
3. **Interactive Step-by-Step Board Replay**:
   - Replay any completed game move by move (0 to 49).
   - **Playback Controls**: ⏮ Start, ◀ Previous, ▶️ Auto-Play/Pause, ▶ Next, ⏭ End.
   - **Playback Speed**: 1x, 2x, 4x.
   - **Interactive Seek Bar**: Drag slider to jump to any point in the game.
   - **Interactive Move Log**: Click any move in the history list to view board state at that moment.

---

## 🛠 Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with [Immer](https://immerjs.github.io/immer/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing Framework**: [Vitest](https://vitest.dev/) + `@testing-library/react` (198/198 tests passing, 99.28% coverage)

---

## 📁 Project Structure

```
PAH THU/
├── public/
│   └── favicon.svg             # App SVG favicon
├── src/
│   ├── components/
│   │   └── ui/                 # Reusable atomic UI components (Button, Card, Badge, Modal)
│   ├── engine/
│   │   ├── scoring.ts          # Core Pah Tum scoring engine & line detection
│   │   └── strategies.ts       # 7 AI strategy implementations
│   ├── features/
│   │   └── game/
│   │       └── components/     # Game UI components (Board, Timer, ScoreCard, MoveHistory, VictoryModal)
│   ├── pages/
│   │   ├── LandingPage.tsx     # Hero landing page
│   │   ├── GameSetupPage.tsx   # Mode, AI level, and timer configuration
│   │   ├── GamePage.tsx        # Main game screen
│   │   └── AnalysisPage.tsx    # Dashboard & step-by-step game analyzer
│   ├── services/
│   │   └── gameHistoryService.ts # LocalStorage history persistence & statistics
│   ├── store/
│   │   └── gameStore.ts        # Zustand global state store with auto-save
│   ├── test/
│   │   ├── setup.ts            # Vitest DOM test setup
│   │   ├── scoring.test.ts     # Engine unit tests (47 tests)
│   │   ├── gameStore.test.ts   # Store unit tests (48 tests)
│   │   ├── strategies.test.ts  # AI strategies unit tests (82 tests)
│   │   ├── gameIntegration.test.ts # End-to-end integration tests (14 tests)
│   │   └── gameHistoryService.test.ts # History service tests (7 tests)
│   ├── types/
│   │   └── game.ts             # TypeScript definitions & constants
│   ├── App.tsx                 # Main application routes
│   └── main.tsx                # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts              # Vite & Vitest configuration
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- `npm` v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/pah-thu.git
cd pah-thu
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🧪 Testing & Quality Assurance

The codebase includes an extensive test suite covering every rule, AI strategy, store action, and history service operation.

### Run All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Test Suite Summary
```
 ✓ src/test/scoring.test.ts (47 tests)
 ✓ src/test/gameHistoryService.test.ts (7 tests)
 ✓ src/test/gameStore.test.ts (48 tests)
 ✓ src/test/gameIntegration.test.ts (14 tests)
 ✓ src/test/strategies.test.ts (82 tests)

 Test Files  5 passed (5)
      Tests  198 passed (198)
   Coverage  99.28%
```

---

## 📜 License & Credits

Designed & Engineered for Pah Tum enthusiasts. Released under the **MIT License**.
