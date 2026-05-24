import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, KeyRound, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center animate-fade-in">
        <FolderGit2 className="h-10 w-10 text-[#2f81f7] mb-2 animate-bounce" />
        <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Sign in to GitShare</h1>
      </div>

      {/* Main Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-sm p-6 shadow-2xl animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#f85149]/15 border border-[#f85149]/30 rounded text-xs text-[#f85149] text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1 uppercase">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="h-4 w-4 text-[#8b949e]" />
              </span>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded py-2 pl-9 pr-3 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1 uppercase">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <KeyRound className="h-4 w-4 text-[#8b949e]" />
              </span>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded py-2 pl-9 pr-3 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-semibold text-sm py-2 rounded transition-all cursor-pointer shadow-md"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-sm border border-[#30363d] bg-[#161b22] px-4 py-3 rounded-md w-full max-w-sm">
        <span className="text-[#8b949e]">New to GitShare? </span>
        <Link to="/register" className="text-[#58a6ff] hover:underline font-medium">
          Create an account
        </Link>
      </div>
      
      {/* Demo Credentials Alert */}
      <div className="mt-4 p-3 bg-[#388bfd]/10 border border-[#388bfd]/30 rounded text-xs text-[#58a6ff] max-w-sm text-center">
        <p className="font-semibold mb-1">Demo Accounts Ready:</p>
        <p>User: <span className="underline font-mono">gitshare_user</span> / Pass: <span className="underline font-mono">user123</span></p>
        <p>Admin: <span className="underline font-mono">admin</span> / Pass: <span className="underline font-mono">admin123</span></p>
      </div>
    </div>
  );
}
