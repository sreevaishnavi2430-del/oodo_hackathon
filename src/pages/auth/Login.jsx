import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('manager@stocksense.io');
  const [password, setPassword] = useState('demo1234');
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 4) newErrors.password = "Password must be at least 4 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    login(email, password);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xl shadow-lg mb-3">
            SS
          </div>
          <h2 className="text-xl font-bold tracking-tight">Welcome to StockSense</h2>
          <p className="text-xs text-slate-300 mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI-Driven Real-Time Inventory Management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                  errors.email ? 'border-rose-400 bg-rose-50/20 focus:ring-1 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">OTP Reset</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                  errors.password ? 'border-rose-400 bg-rose-50/20 focus:ring-1 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>
            {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 text-center text-[11px] text-slate-500 border border-slate-200/60">
            💡 <strong>Hackathon Demo Credentials:</strong> Any email/password will authenticate and launch the interactive demo.
          </div>
        </form>
      </div>
    </div>
  );
};
