import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function Auth({ type }: { type: 'login' | 'register' }) {
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    identifier: '', // for login
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { identifier: formData.identifier, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed');
      }

      login(data.data);
      
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00D4FF] mb-6 shadow-[0_0_30px_rgba(108,92,231,0.3)]">
            <Gamepad2 className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Enter your credentials to continue' : 'Join the premier competitive platform'}
          </p>
        </div>

        <div className="bg-[#0F1624] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Accent glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#6C5CE7]/20 rounded-full blur-3xl"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-[#070B14] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
                    placeholder="Faker_99"
                  />
                </div>
              </div>
            )}
            
            {isLogin ? (
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Email or Username</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <UserIcon className="h-5 w-5 text-gray-500" />
                   </div>
                   <input
                     type="text"
                     name="identifier"
                     value={formData.identifier}
                     onChange={handleChange}
                     required
                     className="block w-full pl-11 pr-4 py-3 bg-[#070B14] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
                     placeholder="player@vexora.gg or Faker_99"
                   />
                 </div>
               </div>
            ) : (
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Mail className="h-5 w-5 text-gray-500" />
                   </div>
                   <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     required
                     className="block w-full pl-11 pr-4 py-3 bg-[#070B14] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
                     placeholder="player@vexora.gg"
                   />
                 </div>
               </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">Password</label>
                {isLogin && <Link to="#" className="text-sm text-[#00D4FF] hover:text-white transition-colors">Forgot?</Link>}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-[#070B14] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Confirm Password</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-gray-500" />
                   </div>
                   <input
                     type="password"
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     required
                     className="block w-full pl-11 pr-4 py-3 bg-[#070B14] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
                     placeholder="••••••••"
                   />
                 </div>
               </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#6C5CE7] hover:bg-[#5a4cd1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6C5CE7] focus:ring-offset-[#0F1624] uppercase tracking-wider transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          
          <div className="mt-8 text-center relative z-10">
            <p className="text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link to={isLogin ? '/register' : '/login'} className="font-bold text-white hover:text-[#00D4FF] transition-colors">
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
