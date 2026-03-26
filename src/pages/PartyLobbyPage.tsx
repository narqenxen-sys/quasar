import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../constants';
import socket from '../socket';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Crown, User, Share2, Play, CheckCircle2, XCircle } from 'lucide-react';

export function PartyLobbyPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    socket.emit('join_lobby', { roomId, username });

    const handleRoomUpdate = (updatedRoom: any) => {
      setRoom(updatedRoom);
    };

    const handleGameStarted = (gameRoom: any) => {
      navigate(`/game/party/${roomId}`, { state: { room: gameRoom } });
    };

    const handleError = (msg: string) => {
      setError(msg);
    };

    socket.on('room_update', handleRoomUpdate);
    socket.on('game_started', handleGameStarted);
    socket.on('error', handleError);

    return () => {
      socket.off('room_update', handleRoomUpdate);
      socket.off('game_started', handleGameStarted);
      socket.off('error', handleError);
    };
  }, [roomId, username, navigate]);

  const toggleReady = () => {
    socket.emit('toggle_ready', { roomId });
  };

  const startGame = async () => {
    if (!room) return;
    
    // Fetch questions
    const q = query(collection(db, 'questions'), where('category', '==', room.category));
    const snapshot = await getDocs(q);
    const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, room.options.numQuestions);
    
    socket.emit('start_game', { roomId, questions: shuffled });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/lobby/${roomId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-500">{error}</h2>
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 rounded-xl font-bold">Go Home</button>
    </div>
  );

  if (!room) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const isHost = room.hostId === socket.id;
  const otherPlayers = room.players.filter((p: any) => p.id !== room.hostId);
  const allOtherReady = otherPlayers.length > 0 && otherPlayers.every((p: any) => p.ready);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Party Lobby</h1>
          <p className="opacity-60">Room ID: <span className="font-mono font-bold text-blue-500">{roomId}</span></p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <Share2 size={20} />
          Share Link
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold opacity-70 mb-4">Players ({room.players.length}/{room.options.numPlayers})</h2>
          {room.players.map((player: any) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <User size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{player.username}</span>
                    {room.hostId === player.id && <Crown size={16} className="text-yellow-500" />}
                  </div>
                  <p className="text-sm opacity-50">{player.id === socket.id ? 'You' : 'Player'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {room.hostId === player.id ? (
                  <span className="text-sm font-bold text-yellow-500 opacity-80">Host</span>
                ) : player.ready ? (
                  <span className="flex items-center gap-1 text-green-500 font-bold text-sm">
                    <CheckCircle2 size={16} /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 font-bold text-sm">
                    <XCircle size={16} /> Not Ready
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[2rem] bg-blue-600/10 border border-blue-500/30">
            <h3 className="text-xl font-bold mb-6">Game Settings</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between opacity-70">
                <span>Category</span>
                <span className="font-bold text-blue-500 uppercase">{room.category}</span>
              </div>
              <div className="flex justify-between opacity-70">
                <span>Questions</span>
                <span className="font-bold">{room.options.numQuestions}</span>
              </div>
              <div className="flex justify-between opacity-70">
                <span>Timer</span>
                <span className="font-bold">{room.options.timer}s</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {!isHost && (
              <button
                onClick={toggleReady}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${room.players.find((p: any) => p.id === socket.id)?.ready ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                {room.players.find((p: any) => p.id === socket.id)?.ready ? 'Unready' : 'I am Ready!'}
              </button>
            )}
            
            {isHost && (
              <button
                onClick={startGame}
                disabled={!allOtherReady}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2 transition-all"
              >
                <Play size={20} />
                Start Game
              </button>
            )}
            {!isHost && !allOtherReady && (
              <p className="text-center text-sm opacity-50 italic">Waiting for all players to be ready...</p>
            )}
            {isHost && !allOtherReady && (
              <p className="text-center text-sm opacity-50 italic">Waiting for other players to be ready...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
