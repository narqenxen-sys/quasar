import { motion } from 'framer-motion';
import { Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import * as Icons from 'lucide-react';

export function HomePage() {
  const username = localStorage.getItem('username');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Quasar</h1>
          <p className="opacity-60">Welcome back, {username}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/settings" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
            <Settings size={24} />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((cat, idx) => {
          const IconComponent = (Icons as any)[cat.icon];
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                to={`/mode/${cat.id}`}
                className="group block p-6 rounded-3xl bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform">
                  {IconComponent && <IconComponent size={24} />}
                </div>
                <h3 className="text-xl font-bold mb-1">{cat.name}</h3>
                <p className="text-sm opacity-50">Click to play</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
