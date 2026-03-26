import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const handleSave = () => {
    localStorage.setItem('username', username);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-12">
        <Link to="/" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

      <div className="space-y-8">
        <section className="p-6 rounded-3xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <User className="text-blue-500" />
            <h2 className="text-xl font-bold">Profile</h2>
          </div>
          <div className="space-y-4">
            <label className="block text-sm opacity-60">Username</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none transition-all"
              />
              <button
                onClick={handleSave}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-3xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {theme === 'light' ? <Sun className="text-yellow-500" /> : <Moon className="text-blue-400" />}
              <div>
                <h2 className="text-xl font-bold">Appearance</h2>
                <p className="text-sm opacity-50">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-14 h-8 rounded-full bg-white/10 p-1 relative transition-all"
            >
              <motion.div
                animate={{ x: theme === 'light' ? 0 : 24 }}
                className="w-6 h-6 rounded-full bg-blue-600 shadow-lg"
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
