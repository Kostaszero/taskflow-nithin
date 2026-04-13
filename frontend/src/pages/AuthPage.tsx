import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { auth } from '../utils/api';
import { useAuthContext } from '../hooks/useAuth';

type FormMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<FormMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  const { isLoading: authLoading, token, login } = useAuthContext();
  const navigate = useNavigate();

  if (authLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (token) return <Navigate to="/projects" />;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (mode === 'login') {
        response = await auth.login(formData.email, formData.password);
      } else {
        response = await auth.register(formData.name, formData.email, formData.password);
      }

      const { token, user } = response.data;
      login(user, token);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-slate-900">
          TaskFlow
        </h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 p-3 bg-blue-50 text-sm text-slate-700 rounded">
            <p className="font-medium mb-2">Demo credentials:</p>
            <p>Email: test@example.com</p>
            <p>Password: password123</p>
          </div>
        )}
      </div>
    </div>
  );
};
