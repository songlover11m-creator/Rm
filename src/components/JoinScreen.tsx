import React, { useState } from 'react';
import { Shield, Key, User, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface JoinScreenProps {
  onJoin: (username: string, password: string) => void;
  error?: string | null;
}

export default function JoinScreen({ onJoin, error }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setIsSubmitting(true);
      onJoin(username, password);
      // Reset isSubmitting after a short delay to handle potential immediate return
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(20,184,166,0.1)]"
          >
            <Shield className="w-10 h-10 text-teal-500" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight uppercase">CircleChat</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">Join your private friend circle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
               <Lock className="w-24 h-24" />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center uppercase tracking-wider"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Choose Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm font-medium"
                    placeholder="e.g. Alex"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Token (Secret Password)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm font-medium"
                    placeholder="Enter Circle Key"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group"
            >
              <span className="uppercase tracking-[0.2em] font-black italic">Enter the Circle</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono italic">
              End-to-End Secure Connection — Port 3000
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
