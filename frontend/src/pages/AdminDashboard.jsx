import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  FolderGit2, 
  Database, 
  Files, 
  Trash2, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      setError('');
      const [statsRes, usersRes, reposRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/repositories') // Use standard API list for repos list
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRepositories(reposRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err.response?.data?.message || 'Could not load admin dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteRepo = async (repoId, repoName) => {
    if (!window.confirm(`MODERATOR ALERT: Are you absolutely sure you want to FORCE-DELETE the repository "${repoName}"? This will delete all its files permanently.`)) {
      return;
    }

    try {
      await api.delete(`/api/repositories/${repoId}`);
      // Refresh list
      fetchAdminData();
    } catch (err) {
      console.error('Error force deleting repository:', err);
      alert(err.response?.data?.message || 'Failed to force delete repository.');
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2f81f7]"></div>
        <span className="text-sm text-[#8b949e]">Loading admin controls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Title */}
      <div className="border-b border-[#30363d] pb-4 flex items-center space-x-2">
        <Shield className="h-6 w-6 text-[#238636]" />
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">Admin Dashboard</h1>
          <p className="text-xs text-[#8b949e] mt-0.5">Moderator tools and platform storage utilization analytics.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#f85149]/15 border border-[#f85149]/30 rounded flex items-center space-x-2 text-[#f85149]">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Grid Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-[#8b949e] uppercase font-semibold">Total Users</p>
              <h3 className="text-2xl font-bold text-[#f0f6fc] mt-1">{stats.totalUsers}</h3>
            </div>
            <Users className="h-8 w-8 text-[#8b949e] opacity-30" />
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-[#8b949e] uppercase font-semibold">Repositories</p>
              <h3 className="text-2xl font-bold text-[#f0f6fc] mt-1">{stats.totalRepos}</h3>
            </div>
            <FolderGit2 className="h-8 w-8 text-[#8b949e] opacity-30" />
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-[#8b949e] uppercase font-semibold">Files Uploaded</p>
              <h3 className="text-2xl font-bold text-[#f0f6fc] mt-1">{stats.totalFiles}</h3>
            </div>
            <Files className="h-8 w-8 text-[#8b949e] opacity-30" />
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-[#8b949e] uppercase font-semibold">Server Storage</p>
              <h3 className="text-2xl font-bold text-[#f0f6fc] mt-1">{formatBytes(stats.totalStorageBytes)}</h3>
            </div>
            <Database className="h-8 w-8 text-[#8b949e] opacity-30" />
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Side: Users List */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-[#f0f6fc] flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-[#8b949e]" />
            <span>Registered Users ({users.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="pb-2 font-semibold">Username</th>
                  <th className="pb-2 font-semibold text-center">Repos</th>
                  <th className="pb-2 font-semibold text-center">Files</th>
                  <th className="pb-2 font-semibold text-right">Disk Space</th>
                  <th className="pb-2 font-semibold text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d] text-[#c9d1d9]">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[#21262d]/40">
                    <td className="py-2.5 font-medium flex flex-col">
                      <span>{usr.username}</span>
                      <span className="text-[9px] text-[#8b949e]">Joined {new Date(usr.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-2.5 text-center font-mono">{usr.repoCount}</td>
                    <td className="py-2.5 text-center font-mono">{usr.fileCount}</td>
                    <td className="py-2.5 text-right font-mono">{formatBytes(usr.totalBytes)}</td>
                    <td className="py-2.5 text-right">
                      {usr.isAdmin ? (
                        <span className="bg-[#238636]/15 border border-[#238636]/30 text-[#2ea043] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-[#30363d] text-[#8b949e] px-1.5 py-0.5 rounded text-[10px] font-medium">
                          User
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Repositories List with moderation controls */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-[#f0f6fc] flex items-center space-x-2 text-sm">
            <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
            <span>Shared Repositories ({repositories.length})</span>
          </h3>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {repositories.length > 0 ? (
              repositories.map((repo) => {
                const size = repo.files.reduce((sum, f) => sum + f.size, 0);
                return (
                  <div 
                    key={repo._id} 
                    className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md hover:border-[#8b949e] transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center space-x-1.5">
                        <Link 
                          to={`/repositories/${repo._id}`} 
                          className="font-bold text-xs text-[#58a6ff] hover:underline flex items-center space-x-1"
                        >
                          <span>{repo.name}</span>
                          <ExternalLink className="h-3 w-3 text-[#8b949e] inline" />
                        </Link>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] text-[#8b949e]">
                        <span>by {repo.owner?.username}</span>
                        <span>•</span>
                        <span>{repo.files.length} files</span>
                        <span>•</span>
                        <span>{formatBytes(size)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRepo(repo._id, repo.name)}
                      className="p-2 hover:bg-[#f85149]/10 rounded border border-transparent hover:border-[#f85149]/30 text-[#f85149] hover:scale-105 transition-all cursor-pointer"
                      title="Force delete repository"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#8b949e] py-6 text-center border border-dashed border-[#30363d] rounded-md">
                No repositories exist on the platform.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
