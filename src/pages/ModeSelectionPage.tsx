import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Users, Timer, HelpCircle, AlertTriangle } from 'lucide-react';
import { CATEGORIES } from '../constants';
import socket from '../socket';

export function ModeSelectionPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === categoryId);
  const [mode, setMode] = useState<'solo' | 'party'>('solo');

  // Solo Options
  const [soloOptions, setSoloOptions] = useState({
    timer: 30,
    numQuestions: 20,
    maxErrors: 3
  });

  // Party Options
  const [partyOptions, setPartyOptions] = useState({
    numPlayers: 4,
    numQuestions: 20,
    timer: 30
  });

  const handleStartSolo = () => {
    navigate(`/game/solo/${categoryId}`, { state: { options: soloOptions } });
  };

  const handleCreateParty = () => {
    const username = localStorage.getItem('username');
    socket.emit('create_room', { 
      category: categoryId, 
      options: partyOptions,
      username 
    });
    socket.on('room_created', (roomId) => {
      navigate(`/lobby/${roomId}`);
    });
  };

  if (!category) return <div>Category not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-12">
        <Link to="/" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <p className="opacity-50">Choose your game mode</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Solo Mode */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${mode === 'solo' ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10'}`}
          onClick={() => setMode('solo')}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-bold">Solo Mode</h2>
          </div>
          
          <div className="space-y-6">
            <OptionSlider
              label="Timer (seconds)"
              icon={<Timer size={18} />}
              value={soloOptions.timer}
              min={10} max={60}
              onChange={(v) => setSoloOptions(s => ({ ...s, timer: v }))}
            />
            <OptionSlider
              label="Questions"
              icon={<HelpCircle size={18} />}
              value={soloOptions.numQuestions}
              min={10} max={100}
              onChange={(v) => setSoloOptions(s => ({ ...s, numQuestions: v }))}
            />
            <OptionSlider
              label="Max Errors"
              icon={<AlertTriangle size={18} />}
              value={soloOptions.maxErrors}
              min={1} max={10}
              onChange={(v) => setSoloOptions(s => ({ ...s, maxErrors: v }))}
            />
            {mode === 'solo' && (
              <button
                onClick={handleStartSolo}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                Start Solo Game
              </button>
            )}
          </div>
        </motion.div>

        {/* Party Mode */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${mode === 'party' ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-white/10'}`}
          onClick={() => setMode('party')}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-500">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-bold">Party Mode</h2>
          </div>

          <div className="space-y-6">
            <OptionSlider
              label="Max Players"
              icon={<Users size={18} />}
              value={partyOptions.numPlayers}
              min={2} max={10}
              onChange={(v) => setPartyOptions(s => ({ ...s, numPlayers: v }))}
            />
            <OptionSlider
              label="Questions"
              icon={<HelpCircle size={18} />}
              value={partyOptions.numQuestions}
              min={10} max={100}
              onChange={(v) => setPartyOptions(s => ({ ...s, numQuestions: v }))}
            />
            <OptionSlider
              label="Timer (seconds)"
              icon={<Timer size={18} />}
              value={partyOptions.timer}
              min={10} max={60}
              onChange={(v) => setPartyOptions(s => ({ ...s, timer: v }))}
            />
            {mode === 'party' && (
              <button
                onClick={handleCreateParty}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 font-bold text-lg shadow-lg shadow-purple-500/20 transition-all"
              >
                Create Party Lobby
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function OptionSlider({ label, icon, value, min, max, onChange }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center opacity-70">
        <div className="flex items-center gap-2 text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-bold text-blue-500">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}
