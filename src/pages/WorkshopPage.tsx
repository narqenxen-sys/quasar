import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../constants';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Lock, Plus, Trash2, Edit2, X, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WorkshopPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (import.meta.env.VITE_ADMIN_PASSWORD || 'admin123')) {
      setIsLoggedIn(true);
    } else {
      alert('Wrong password');
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchQuestions();
    }
  }, [selectedCategory]);

  const fetchQuestions = async () => {
    const q = query(collection(db, 'questions'), where('category', '==', selectedCategory));
    const snapshot = await getDocs(q);
    setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.correctAnswer) return alert('Select correct answer');

    const data = {
      ...formData,
      category: selectedCategory
    };

    if (editingId) {
      await updateDoc(doc(db, 'questions', editingId), data);
    } else {
      await addDoc(collection(db, 'questions'), data);
    }

    setFormData({ question: '', options: ['', '', '', ''], correctAnswer: '' });
    setIsAdding(false);
    setEditingId(null);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this question?')) {
      await deleteDoc(doc(db, 'questions', id));
      fetchQuestions();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
          <Lock size={48} className="mx-auto mb-6 text-blue-500" />
          <h1 className="text-3xl font-bold mb-8">Workshop Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500"
            />
            <button type="submit" className="w-full py-3 bg-blue-600 rounded-xl font-bold">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold">Workshop Dashboard</h1>
        </div>
        {selectedCategory && (
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ question: '', options: ['', '', '', ''], correctAnswer: '' });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl font-bold"
          >
            <Plus size={20} /> Add Question
          </button>
        )}
      </header>

      {!selectedCategory ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500 transition-all text-left"
            >
              <h3 className="font-bold">{cat.name}</h3>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedCategory(null)} className="text-blue-500 flex items-center gap-2 mb-4">
            <ArrowLeft size={16} /> Back to Categories
          </button>
          
          <div className="grid gap-4">
            {questions.map(q => (
              <div key={q.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold mb-2">{q.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt: string) => (
                      <span key={opt} className={`text-sm px-3 py-1 rounded-lg ${opt === q.correctAnswer ? 'bg-green-500/20 text-green-500' : 'bg-white/5 opacity-50'}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => {
                      setEditingId(q.id);
                      setFormData({ question: q.question, options: [...q.options], correctAnswer: q.correctAnswer });
                      setIsAdding(true);
                    }}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-500"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-2 rounded-lg bg-red-500/20 text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 rounded-full hover:bg-white/10"><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm opacity-60 mb-2">Question Text</label>
                <textarea
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 min-h-[100px]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.options.map((opt, idx) => (
                  <div key={idx}>
                    <label className="block text-xs opacity-50 mb-1">Option {String.fromCharCode(65 + idx)}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...formData.options];
                          newOpts[idx] = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                        className={`p-2 rounded-lg border transition-all ${formData.correctAnswer === opt ? 'bg-green-500 border-green-500' : 'bg-white/5 border-white/10'}`}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-bold text-lg">Save Question</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
