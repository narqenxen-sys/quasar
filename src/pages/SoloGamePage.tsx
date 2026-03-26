import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Timer, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function SoloGamePage() {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const options = location.state?.options || { timer: 30, numQuestions: 20, maxErrors: 3 };

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(options.timer);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const q = query(collection(db, 'questions'), where('category', '==', categoryId));
      const snapshot = await getDocs(q);
      const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Shuffle and limit
      const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, options.numQuestions);
      setQuestions(shuffled);
      setLoading(false);
    };
    fetchQuestions();
  }, [categoryId, options.numQuestions]);

  useEffect(() => {
    if (loading || questions.length === 0 || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null); // Timeout
          return options.timer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions, currentIndex, selectedAnswer]);

  const handleAnswer = (answer: string | null) => {
    if (selectedAnswer !== null) return;

    const currentQ = questions[currentIndex];
    const correct = answer === currentQ.correctAnswer;
    
    setSelectedAnswer(answer || 'TIMEOUT');
    setIsCorrect(correct);

    setTimeout(() => {
      if (correct) {
        setScore(s => s + 1);
      } else {
        setErrors(e => e + 1);
      }

      const nextIndex = currentIndex + 1;
      const nextErrors = correct ? errors : errors + 1;

      if (nextIndex >= questions.length || nextErrors >= options.maxErrors) {
        navigate('/scoreboard', { 
          state: { 
            score: correct ? score + 1 : score, 
            total: questions.length,
            errors: nextErrors,
            correct: correct ? score + 1 : score,
            wrong: nextIndex - (correct ? score + 1 : score)
          } 
        });
      } else {
        setCurrentIndex(nextIndex);
        setTimeLeft(options.timer);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }, 1000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">No questions found for this category.</h2>
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 rounded-xl font-bold">Go Home</button>
    </div>
  );

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Timer size={24} />
          </div>
          <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs opacity-50 uppercase tracking-wider">Score</p>
            <p className="text-xl font-bold text-green-500">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-50 uppercase tracking-wider">Errors</p>
            <p className="text-xl font-bold text-red-500">{errors}/{options.maxErrors}</p>
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

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1"
        >
          <h2 className="text-3xl font-bold mb-12 leading-tight">
            {currentQ.question}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {currentQ.options.map((option: string) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQ.correctAnswer;
              
              let bgColor = "bg-white/5 border-white/10 hover:bg-white/10";
              if (selectedAnswer !== null) {
                if (isCorrectOption) bgColor = "bg-green-500/20 border-green-500 text-green-500";
                else if (isSelected) bgColor = "bg-red-500/20 border-red-500 text-red-500";
                else bgColor = "bg-white/5 border-white/10 opacity-50";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-6 rounded-2xl border-2 text-left font-medium transition-all flex justify-between items-center ${bgColor}`}
                >
                  <span>{option}</span>
                  {selectedAnswer !== null && isCorrectOption && <CheckCircle2 size={20} />}
                  {selectedAnswer !== null && isSelected && !isCorrectOption && <XCircle size={20} />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
