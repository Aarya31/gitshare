import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Plus, Search, BookOpen } from 'lucide-react';
import { api } from '../context/AuthContext';

export default function Sidebar({ repositories, onRepoCreated, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter repositories that belong to the current user
  const userRepos = repositories.filter(
    (repo) => repo.owner?._id === currentUser?.id || repo.owner === currentUser?.id
  );

  const filteredRepos = userRepos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!repoName) {
      setError('Repository name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/repositories', {
        name: repoName,
        description
      });
      onRepoCreated(response.data);
      setRepoName('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create repository.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-[#0d1117] lg:border-r border-[#30363d] lg:pr-6 pb-6 lg:pb-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#f0f6fc] flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-[#8b949e]" />
          <span>My Repositories</span>
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1 bg-[#238636] hover:bg-[#2ea043] text-white px-2 py-1 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          <span>New</span>
        </button>
      </div>

      {/* Repo Search */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          <Search className="h-4 w-4 text-[#8b949e]" />
        </span>
        <input
          type="text"
          placeholder="Find a repository..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-9 pr-3 text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
        />
      </div>

      {/* Repos List */}
      <div className="space-y-1 overflow-y-auto max-h-[400px] lg:max-h-[calc(100vh-220px)] pr-1">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <Link
              key={repo._id}
              to={`/repositories/${repo._id}`}
              className="flex items-center space-x-2 px-2 py-2 rounded-md hover:bg-[#21262d] text-sm text-[#c9d1d9] hover:text-[#58a6ff] transition-all group"
            >
              <FolderGit2 className="h-4 w-4 text-[#8b949e] group-hover:text-[#58a6ff] flex-shrink-0" />
              <span className="truncate font-medium">{repo.name}</span>
            </Link>
          ))
        ) : (
          <p className="text-xs text-[#8b949e] py-3 text-center border border-dashed border-[#30363d] rounded-md">
            No repositories found.
          </p>
        )}
      </div>

      {/* Create Repo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
              <h3 className="font-semibold text-lg text-[#f0f6fc]">Create a new repository</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8b949e] hover:text-[#f0f6fc] text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRepo} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-[#f85149]/15 border border-[#f85149]/30 rounded text-xs text-[#f85149]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1 uppercase">
                  Repository Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. my-awesome-project"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7]"
                  maxLength={100}
                  required
                />
                <p className="text-[10px] text-[#8b949e] mt-1">
                  Only letters, numbers, hyphens (-) and underscores (_) allowed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1 uppercase">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Tell us what this repository is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7] h-20 resize-none"
                  maxLength={300}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#30363d] text-xs text-[#c9d1d9] hover:bg-[#21262d] rounded cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-xs font-semibold text-white rounded cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Create repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
