import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { GameSetupPage } from './pages/GameSetupPage';
import { GamePage } from './pages/GamePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { StrategyPlaygroundPage } from './pages/StrategyPlaygroundPage';
import { StrategyDebuggerPage } from './pages/StrategyDebuggerPage';
import { StrategyComparisonPage } from './pages/StrategyComparisonPage';
import { ReplayPage } from './pages/ReplayPage';
import { TournamentHistoryPage } from './pages/TournamentHistoryPage';
import { PlayerProfilesPage } from './pages/PlayerProfilesPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { StatsDashboardPage } from './pages/StatsDashboardPage';

export default function App() {
  return (
    <Routes>
      {/* ─── Core Game ─────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/game" element={<GameSetupPage />} />
      <Route path="/play" element={<GamePage />} />
      <Route path="/analysis" element={<AnalysisPage />} />

      {/* ─── New Feature Pages ─────────────────────────── */}
      <Route path="/playground" element={<StrategyPlaygroundPage />} />
      <Route path="/debugger" element={<StrategyDebuggerPage />} />
      <Route path="/comparison" element={<StrategyComparisonPage />} />
      <Route path="/replay" element={<ReplayPage />} />
      <Route path="/tournaments" element={<TournamentHistoryPage />} />
      <Route path="/profiles" element={<PlayerProfilesPage />} />
      <Route path="/achievements" element={<AchievementsPage />} />
      <Route path="/stats" element={<StatsDashboardPage />} />
    </Routes>
  );
}
