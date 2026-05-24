import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, LogOut, Shield, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50 px-4 py-3 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center space-x-2 text-[#f0f6fc] hover:text-[#58a6ff] transition-colors group">
          <FolderGit2 className="h-6 w-6 text-[#2f81f7] group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg tracking-tight">GitShare</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] border border-[#30363d] px-1.5 py-0.5 rounded ml-2">Beta</span>
        </Link>

        {/* Right Side: Navigation & Actions */}
        <div className="flex items-center space-x-4">
          {/* Admin link */}
          {user?.isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center space-x-1 text-[#e6edf3] bg-[#238636] hover:bg-[#2ea043] px-3 py-1.5 rounded-md text-sm font-semibold transition-all hover:scale-102 shadow-sm"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          )}

          {/* User Profile Tag */}
          <div className="flex items-center space-x-2 bg-[#21262d] border border-[#30363d] px-3 py-1.5 rounded-md text-sm text-[#c9d1d9]">
            <User className="h-4 w-4 text-[#8b949e]" />
            <span className="font-medium max-w-[120px] truncate">{user?.username}</span>
          </div>

          {/* Log Out Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-[#21262d] hover:bg-[#f85149] hover:text-white border border-[#30363d] hover:border-transparent px-3 py-1.5 rounded-md text-sm text-[#c9d1d9] transition-all cursor-pointer font-medium"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
