import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [loading, setLoading] = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
  });

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const fetchHabits = async () => {
    try {
      const response = await api.get('/habits');
      setHabits(response.data);
    } catch (error) {
      toast.error('Failed to load habits');
    }
  };

  const createHabit = async () => {
    if (!newHabit.trim()) return;
    setLoading(true);
    try {
      await api.post('/habits', { 
        name: newHabit, 
        category: 'other', 
        frequency: 'daily' 
      });
      setNewHabit('');
      fetchHabits();
      toast.success('🎉 New habit added!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const checkinHabit = async (habitId) => {
    try {
      await api.post(`/habits/${habitId}/checkins`);
      toast.success('✅ Great job! Check-in recorded!');
      fetchHabits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    }
  };

  useEffect(() => {
    if (token) {
      fetchHabits();
    }
  }, [token]);

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email,
        password
      });
      const newToken = response.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      toast.success('Welcome back! 👋');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setHabits([]);
    toast.info('Logged out successfully');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-600">
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4 border border-white/30">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📱</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Habit Tracker
            </h1>
            <p className="text-white/80 text-lg">Build better habits, one day at a time</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="test@example.com"
              id="email"
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
            <input
              type="password"
              placeholder="password123"
              id="password"
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
            <button 
              onClick={() => {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                handleLogin(email, password);
              }}
              className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              🚀 Get Started
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              🏆 My Habits
            </h1>
            <p className="text-gray-600 text-lg">Stay consistent, stay awesome</p>
          </div>
          <button 
            onClick={logout}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>

        {/* Add New Habit */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 mb-12">
          <div className="flex gap-4 items-end">
            <input
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="What habit will you build today? (Exercise, Read...)"
              className="flex-1 p-5 border-2 border-gray-200 rounded-2xl text-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-lg"
              onKeyPress={(e) => e.key === 'Enter' && createHabit()}
            />
            <button 
              onClick={createHabit}
              disabled={loading || !newHabit.trim()}
              className="px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
            >
              {loading ? '⏳' : '➕'} Add Habit
            </button>
          </div>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <div key={habit.id} className="group">
              <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl font-bold shadow-lg">
                      {habit.category === 'health' ? '💪' : 
                       habit.category === 'learning' ? '📚' : '⭐'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{habit.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        {habit.frequency === 'daily' ? '📅 Daily' : '📋 Weekly'} • 
                        {habit.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => checkinHabit(habit.id)}
                  className="w-full p-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg flex items-center justify-center gap-3 group-hover:scale-105"
                >
                  ✅ Mark Done Today
                </button>
              </div>
            </div>
          ))}
        </div>

        {habits.length === 0 && (
          <div className="text-center py-24">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-600 mb-4">No habits yet!</h2>
            <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
              Start building better habits by adding your first one above ✨
            </p>
          </div>
        )}
      </div>
      <ToastContainer 
        position="top-right"
        theme="colored"
        toastClassName="!bg-gradient-to-r !from-emerald-500 !to-teal-600 !border-0"
      />
    </div>
  );
}

export default App;
