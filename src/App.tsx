import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { GameSetupPage } from './pages/GameSetupPage';
import { GamePage } from './pages/GamePage';
import { AnalysisPage } from './pages/AnalysisPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/game" element={<GameSetupPage />} />
      <Route path="/play" element={<GamePage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
    </Routes>
  );
}
