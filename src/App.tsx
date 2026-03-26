import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { EntryPage } from './pages/EntryPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ModeSelectionPage } from './pages/ModeSelectionPage';
import { SoloGamePage } from './pages/SoloGamePage';
import { PartyLobbyPage } from './pages/PartyLobbyPage';
import { PartyGamePage } from './pages/PartyGamePage';
import { WorkshopPage } from './pages/WorkshopPage';
import { ScoreboardPage } from './pages/ScoreboardPage';
import { useState, useEffect } from 'react';

export default function App() {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

  useEffect(() => {
    const handleStorage = () => setUsername(localStorage.getItem('username'));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <Routes>
            {!username ? (
              <Route path="*" element={<EntryPage onComplete={(name) => {
                localStorage.setItem('username', name);
                setUsername(name);
              }} />} />
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/mode/:categoryId" element={<ModeSelectionPage />} />
                <Route path="/game/solo/:categoryId" element={<SoloGamePage />} />
                <Route path="/lobby/:roomId" element={<PartyLobbyPage />} />
                <Route path="/game/party/:roomId" element={<PartyGamePage />} />
                <Route path="/scoreboard" element={<ScoreboardPage />} />
                <Route path="/workshop" element={<WorkshopPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
