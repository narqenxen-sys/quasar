import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import { Timer, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function PartyGamePage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialRoom = location.state?.room;

  const [room, setRoom] = useState(initialRoom);
  const [timeLeft, setTimeLeft] = useState(initialRoom?.options.timer || 30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    const username = localStorage.getItem('username');
    socket.emit('join_lobby', { roomId, username });

    const handleTimerUpdate = (time: number) => {
      setTimeLeft(time);
    };

    const handleNextTurn = (data: any) => {
      setRoom((prev: any) => ({
        ...prev,
        currentTurnPlayerIndex: data.currentTurnPlayerIndex,
        currentQuestionIndex: data.currentQuestionIndex,
        players: data.players
      }));
      setSelectedAnswer(null);
      setTimeLeft(data.timer);
    };

    const handleGameEnded = (players: any[]) => {
      const myUsername = localStorage.getItem('username');
      const myPlayer = players.find(p => p.username === myUsername);
      navigate('/scoreboard', { state: { 
        players: players.sort((a, b) => b.score - a.score),
        isParty: true,
        score: myPlayer?.score || 0,
        correct: myPlayer?.score || 0,
        errors: myPlayer?.errors || 0,
        wrong: myPlayer?.errors || 0,
      }});
    };

    const handleRoomUpdate = (updatedRoom: any) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'playing') {
        setTimeLeft(updatedRoom.timer);
      }
    };

    socket.on('timer_update', handleTimerUpdate);
    socket.on('next_turn', handleNextTurn);
    socket.on('game_ended', handleGameEnded);
    socket.on('room_update', handleRoomUpdate);

    return () => {
      socket.off('timer_update', handleTimerUpdate);
      socket.off('next_turn', handleNextTurn);
      socket.off('game_ended', handleGameEnded);
      socket.off('room_update', handleRoomUpdate);
    };
  }, [roomId, navigate]);

  if (!room) return null;

  const currentPlayer = room.players[room.currentTurnPlayerIndex];
  const isMyTurn = currentPlayer.id === socket.id;
  const currentQ = room.questions[room.currentQuestionIndex];
  const progress = ((room.currentQuestionIndex + 1) / room.questions.length) * 100;

  const handleAnswer = (answer: string) => {
    if (!isMyTurn || selectedAnswer !== null) return;
    const isCorrect = answer === currentQ.correctAnswer;
    setSelectedAnswer(answer);
    socket.emit('submit_answer', { roomId, isCorrect });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Timer size={24} />
          </div>
          <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
        </div>
        
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs opacity-50 uppercase tracking-wider">Current Turn</p>
            <p className="font-bold">{isMyTurn ? 'Your Turn!' : currentPlayer.username}</p>
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-white/5 rounded-full mb-12 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={room.currentQuestionIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {isMyTurn ? (
              <>
                <h2 className="text-3xl font-bold mb-12 leading-tight max-w-2xl mx-auto">
                  {currentQ.question}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {currentQ.options.map((option: string) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = option === currentQ.correctAnswer;
                    let bgColor = "bg-white/5 border-white/10 hover:bg-white/10";
                    if (selectedAnswer !== null) {
                      if (isCorrect) bgColor = "bg-green-500/20 border-green-500 text-green-500";
                      else if (isSelected) bgColor = "bg-red-500/20 border-red-500 text-red-500";
                      else bgColor = "bg-white/5 border-white/10 opacity-50";
                    }
                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className={`p-6 rounded-2xl border-2 text-left font-medium transition-all flex justify-between items-center ${bgColor}`}
                      >
                        <span>{option}</span>
                        {selectedAnswer !== null && isCorrect && <CheckCircle2 size={20} />}
                        {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={20} />}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-8 animate-pulse">
                  <User size={48} />
                </div>
                <h2 className="text-3xl font-bold mb-4">It's {currentPlayer.username}'s turn...</h2>
                <p className="opacity-50 text-lg">Wait for them to answer or timeout.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {room.players.map((player: any) => (
          <div 
            key={player.id}
            className={`p-4 rounded-2xl border transition-all ${player.id === currentPlayer.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold truncate text-sm">{player.username}</span>
            </div>
            <div className="flex justify-between text-xs opacity-60">
              <span>Score: {player.score}</span>
              <span>Errors: {player.errors}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
