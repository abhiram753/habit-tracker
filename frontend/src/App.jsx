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
    baseURL: 'https://habit-tracker-backend-56ek.onrender.com',
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
        frequency: 'daily',
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
      const response = await axios.post('https://habit-tracker-backend.onrender.com/api/auth/login', {
        email,
        password,
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
      <div className="app-shell">
        <div className="card auth-layout">
          <div className="auth-header">
            <h1 className="auth-title">Habit Tracker</h1>
            <p className="auth-subtitle">Build better habits, one day at a time</p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="email"
              placeholder="test@example.com"
              id="email"
              className="input"
            />
            <input
              type="password"
              placeholder="password123"
              id="password"
              className="input"
            />
            <button
              onClick={() => {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                handleLogin(email, password);
              }}
              className="button-primary"
            >
              🚀 Get Started
            </button>
          </div>
        </div>
        <ToastContainer position="top-right" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="card">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">🏆 My Habits</h1>
            <p className="dashboard-subtitle">Stay consistent, stay awesome</p>
          </div>
          <button onClick={logout} className="button-ghost">
            Logout
          </button>
        </div>

        {/* Add New Habit */}
        <div className="new-habit">
          <input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="What habit will you build today? (Exercise, Read...)"
            className="input new-habit-input"
            onKeyPress={(e) => e.key === 'Enter' && createHabit()}
          />
          <button
            onClick={createHabit}
            disabled={loading || !newHabit.trim()}
            className="button-secondary"
          >
            {loading ? '⏳' : '➕ Add Habit'}
          </button>
        </div>

        {/* Habits Grid */}
        {habits.length > 0 ? (
          <div className="habit-grid">
            {habits.map((habit) => (
              <div key={habit.id} className="habit-card">
                <div>
                  <div className="habit-name">{habit.name}</div>
                  <div className="habit-meta">
                    {habit.frequency === 'daily' ? '📅 Daily' : '📋 Weekly'} ·{' '}
                    {habit.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </div>
                <button
                  onClick={() => checkinHabit(habit.id)}
                  className="habit-button"
                >
                  ✅ Mark Done Today
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No habits yet. Add your first habit above ✨
          </div>
        )}
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
}

export default App;
