import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.success) {
        navigate('/');
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('manager@aegis.com');
    setPassword('manager123');
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm text-left space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl shadow-sm">
            A
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Welcome to Aegis Portal</h2>
          <p className="text-xs text-slate-550 dark:text-zinc-400">Sign in to manage your hostel operations.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex gap-2.5 text-xs text-rose-600 dark:text-rose-400 items-start">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-650 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="manager@aegis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-650 dark:text-zinc-400">Security Password</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-955 py-2.5 pl-10 pr-10 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="gradient"
              className="w-full py-2.5 font-bold cursor-pointer text-xs"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </Button>
          </div>
        </form>

        <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col items-center gap-2">
          <button
            onClick={handleDemoFill}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Load Demo Credentials
          </button>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Create New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
