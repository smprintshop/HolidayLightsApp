
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    onLogin(email);
  };

  const baseInputClasses = "w-full px-4 py-3 rounded-xl border bg-white text-black placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm border-slate-200";

  return (
    <div className="flex flex-col items-center p-6 text-center pt-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 festive-font text-red-600">Join the Spectacular</h1>
        <p className="text-sm text-slate-500 mb-8">Sign in with your email to cast votes and share your display with the Bluff Park community.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <input
              type="email"
              placeholder="Email Address"
              required
              className={baseInputClasses}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          
          {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Sign In</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
        
        <p className="text-[10px] text-slate-400 mt-6 px-4">
          By signing in, you agree to spread holiday cheer and only vote for displays you've actually seen in person!
        </p>
      </div>
    </div>
  );
};

export default Login;
