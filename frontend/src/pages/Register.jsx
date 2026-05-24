import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, KeyRound, User } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center animate-fade-in">
        <FolderGit2 className="h-10 w-10 text-[#2f81f7] mb-2 animate-pulse" />
        <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Create your GitShare account</h1>
      </div>

      {/* Main Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-sm p-6 shadow-2xl animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#f85149]/15 border border-[#f85149]/30 rounded text-xs text-[#f85149] text-center animate-shake">
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
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded py-2 pl-9 pr-3 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-[#8b949e] mt-1">
              Letters, numbers, underscores and hyphens.
            </p>
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
                placeholder="Choose password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded py-2 pl-9 pr-3 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1 uppercase">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <KeyRound className="h-4 w-4 text-[#8b949e]" />
              </span>
              <input
                type="password"
                placeholder="Retype password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Sign up'}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-sm border border-[#30363d] bg-[#161b22] px-4 py-3 rounded-md w-full max-w-sm">
        <span className="text-[#8b949e]">Already have an account? </span>
        <Link to="/login" className="text-[#58a6ff] hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
