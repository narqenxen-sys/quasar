import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Home, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ScoreboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stats = location.state;

  if (!stats) return <div>No stats available</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full text-center"
      >
        <div className="inline-flex p-6 rounded-full bg-yellow-500/10 text-yellow-500 mb-8">
          <Trophy size={64} />
        </div>
        <h1 className="text-5xl font-bold mb-2">Game Over!</h1>
        <p className="text-xl opacity-60 mb-12">Great effort, {localStorage.getItem('username')}!</p>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <StatCard 
            label="Correct" 
            value={stats.correct} 
            icon={<CheckCircle className="text-green-500" />} 
          />
          <StatCard 
            label="Wrong" 
            value={stats.wrong} 
            icon={<XCircle className="text-red-500" />} 
          />
          <StatCard 
            label="Errors" 
            value={stats.errors} 
            icon={<AlertCircle className="text-orange-500" />} 
          />
          <StatCard 
            label="Total Score" 
            value={stats.score} 
            icon={<Trophy className="text-yellow-500" />} 
          />
        </div>

        {stats.isParty && stats.players && (
          <div className="w-full mb-12">
            <h2 className="text-2xl font-bold mb-6 text-left flex items-center gap-2">
              <Trophy size={24} className="text-yellow-500" />
              Leaderboard
            </h2>
            <div className="space-y-3">
              {stats.players.slice(0, 3).map((player: any, index: number) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    index === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : 
                    index === 1 ? 'bg-slate-400/10 border-slate-400/50' : 
                    'bg-orange-400/10 border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold opacity-50">#{index + 1}</span>
                    <span className="font-bold">{player.username}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-50 uppercase tracking-wider">Score</p>
                    <p className="font-bold">{player.score}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 w-full">
          {!stats.isParty && (
            <button
              onClick={() => navigate(-2)}
              className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={20} />
              Play Again
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Home size={20} />
            Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center">
      <div className="mb-2">{icon}</div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-50 uppercase tracking-wider">{label}</p>
    </div>
  );
}
