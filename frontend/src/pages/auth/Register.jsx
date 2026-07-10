import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      // BUG FIX: register then immediately login via AuthContext so user state is set
      // without needing window.location.reload()
      const res = await axios.post(`${API_URL}/auth/register`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (res.data.success) {
        // Store token and set axios header
        localStorage.setItem('aegis_token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        // Now login via context to properly set user state (no reload needed)
        await login(form.email, form.password);
        navigate('/');
      } else {
        setError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };


  const passwordStrength = () => {
    if (!form.password) return null;
    if (form.password.length < 6) return { label: 'Too Short', color: 'text-rose-500' };
    if (form.password.length < 8) return { label: 'Weak', color: 'text-orange-500' };
    if (/[A-Z]/.test(form.password) && /[0-9]/.test(form.password)) return { label: 'Strong', color: 'text-emerald-600' };
    return { label: 'Medium', color: 'text-yellow-500' };
  };

  const strength = passwordStrength();

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm text-left space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl shadow-sm">
            A
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Create Aegis Account</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Set up your hostel management administrator account.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex gap-2.5 text-xs text-rose-600 dark:text-rose-400 items-start">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-650 dark:text-zinc-400">Full Name *</label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="name"
                required
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-slate-650 dark:text-zinc-400">Email Address *</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-650 dark:text-zinc-400">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-650 dark:text-zinc-400">Password *</label>
              {strength && <span className={`text-[10px] font-bold ${strength.color}`}>{strength.label}</span>}
            </div>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 py-2.5 pl-10 pr-10 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="font-bold text-slate-650 dark:text-zinc-400">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                required
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 py-2.5 pl-10 pr-10 text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <CheckCircle2 className="absolute top-1/2 right-8 -translate-y-1/2 text-emerald-500" size={14} />
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="gradient"
              className="w-full py-2.5 font-bold cursor-pointer text-xs"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 text-center">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
