import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { 
  FolderGit2, 
  Search, 
  Calendar, 
  User, 
  FileArchive, 
  Clock, 
  Files, 
  ChevronRight, 
  FolderOpen
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all repositories from API
  const fetchRepositories = async () => {
    try {
      const response = await api.get('/api/repositories');
      setRepositories(response.data);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError('Could not retrieve repository feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  // When a new repository is created via the sidebar, append it
  const handleRepoCreated = (newRepo) => {
    setRepositories([newRepo, ...repositories]);
  };

  // Perform search (client side for instant response, matching name/description/owner)
  const filteredRepos = repositories.filter((repo) => {
    const query = searchQuery.toLowerCase();
    const ownerName = repo.owner?.username || '';
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.description.toLowerCase().includes(query) ||
      ownerName.toLowerCase().includes(query)
    );
  });

  // Recent uploads calculation (all files from all repos, sorted by date)
  const recentUploads = repositories
    .reduce((acc, repo) => {
      repo.files.forEach((file) => {
        acc.push({
          ...file,
          repoId: repo._id,
          repoName: repo.name,
          owner: repo.owner?.username || 'unknown'
        });
      });
      return acc;
    }, [])
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 5); // top 5 files

  // Helper to format file size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* Sidebar Section */}
      <Sidebar 
        repositories={repositories} 
        onRepoCreated={handleRepoCreated} 
        currentUser={user} 
      />

      {/* Main Feed Section */}
      <div className="flex-1 space-y-6">
        
        {/* Recent Uploaded Files Widget */}
        {recentUploads.length > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#f0f6fc] flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-[#8b949e]" />
              <span>Recent Uploads</span>
            </h3>
            <div className="space-y-2">
              {recentUploads.map((file, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between text-xs border-b border-[#21262d] pb-2 last:border-0 last:pb-0 text-[#c9d1d9]"
                >
                  <div className="flex items-center space-x-2 truncate pr-4">
                    <FolderOpen className="h-3.5 w-3.5 text-[#8b949e] flex-shrink-0" />
                    <span className="font-medium truncate" title={file.path}>{file.filename}</span>
                    <span className="text-[10px] text-[#8b949e]">in</span>
                    <Link 
                      to={`/repositories/${file.repoId}`} 
                      className="text-[#58a6ff] hover:underline font-semibold truncate"
                    >
                      {file.repoName}
                    </Link>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 text-[#8b949e]">
                    <span>{formatBytes(file.size)}</span>
                    <span>by {file.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Repositories Header & Search */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#f0f6fc] flex items-center space-x-2">
                <span>Explore Repositories</span>
                <span className="text-xs font-normal text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d] ml-2">
                  {repositories.length} total
                </span>
              </h2>
              <p className="text-xs text-[#8b949e] mt-1">Browse and download folders/files shared by everyone on the platform.</p>
            </div>
            
            {/* Global Search Bar */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-[#8b949e]" />
              </span>
              <input
                type="text"
                placeholder="Search all repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-9.5 pr-3 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
              />
            </div>
          </div>

          {/* Repositories List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2f81f7]"></div>
              <span className="text-xs text-[#8b949e]">Fetching repository feed...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#f85149]/15 border border-[#f85149]/30 rounded text-center text-sm text-[#f85149]">
              {error}
            </div>
          ) : filteredRepos.length > 0 ? (
            <div className="space-y-4">
              {filteredRepos.map((repo) => {
                const totalBytes = repo.files.reduce((sum, file) => sum + file.size, 0);
                return (
                  <div 
                    key={repo._id} 
                    className="border border-[#30363d] bg-[#0d1117] hover:border-[#8b949e] rounded-lg p-4 transition-all flex flex-col md:flex-row justify-between gap-4 group"
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center space-x-2">
                        <FolderGit2 className="h-5 w-5 text-[#2f81f7] flex-shrink-0" />
                        <Link 
                          to={`/repositories/${repo._id}`} 
                          className="text-lg font-bold text-[#58a6ff] hover:underline"
                        >
                          {repo.name}
                        </Link>
                      </div>
                      
                      {repo.description ? (
                        <p className="text-sm text-[#8b949e] line-clamp-2">{repo.description}</p>
                      ) : (
                        <p className="text-xs text-[#30363d] italic">No description provided</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8b949e] pt-1">
                        <span className="flex items-center space-x-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{repo.owner?.username}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(repo.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Files className="h-3.5 w-3.5" />
                          <span>{repo.files.length} files ({formatBytes(totalBytes)})</span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Download/View Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                      {repo.files.length > 0 && (
                        <a
                          href={`/api/repositories/${repo._id}/download-zip`}
                          className="flex items-center space-x-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                          title="Download repository as ZIP"
                          onClick={(e) => {
                            // Don't trigger browser route navigation
                            e.stopPropagation();
                          }}
                        >
                          <FileArchive className="h-3.5 w-3.5 text-[#8b949e]" />
                          <span>Download ZIP</span>
                        </a>
                      )}
                      <Link
                        to={`/repositories/${repo._id}`}
                        className="flex items-center space-x-1 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                      >
                        <span>Browse</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#30363d] rounded-lg">
              <FolderGit2 className="h-10 w-10 text-[#30363d] mx-auto mb-2" />
              <p className="text-sm text-[#8b949e]">No repositories match your search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
