import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { 
  FolderGit2, 
  ArrowLeft, 
  Trash2, 
  FileArchive, 
  Folder, 
  File, 
  FileCode, 
  FileImage, 
  FileText, 
  Download, 
  ChevronRight, 
  UploadCloud, 
  CheckCircle2, 
  X,
  FileSpreadsheet,
  CornerDownRight
} from 'lucide-react';

export default function RepoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation Path State (e.g. [] represents root, ["src"] is "root/src", etc.)
  const [currentPathArr, setCurrentPathArr] = useState([]);
  
  // File Preview States
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // File Upload States
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadType, setUploadType] = useState('files'); // 'files' or 'folder'

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const currentPathString = currentPathArr.join('/');

  const fetchRepo = async () => {
    try {
      const response = await api.get(`/api/repositories/${id}`);
      setRepo(response.data);
    } catch (err) {
      console.error('Error fetching repo:', err);
      setError(err.response?.data?.message || 'Could not fetch repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepo();
  }, [id]);

  // Clean preview and navigate when changing paths
  const handlePathClick = (index) => {
    setPreviewFile(null);
    if (index === -1) {
      setCurrentPathArr([]);
    } else {
      setCurrentPathArr(currentPathArr.slice(0, index + 1));
    }
  };

  const handleFolderClick = (folderName) => {
    setPreviewFile(null);
    setCurrentPathArr([...currentPathArr, folderName]);
  };

  const handleBackFolderClick = () => {
    setPreviewFile(null);
    setCurrentPathArr(currentPathArr.slice(0, -1));
  };

  // Helper to parse directory contents
  const getFolderContents = () => {
    if (!repo) return { folders: [], files: [] };
    
    const folders = new Set();
    const files = [];

    repo.files.forEach((file) => {
      const filePath = file.path;
      
      if (currentPathString === '') {
        // Root path
        const parts = filePath.split('/');
        if (parts.length === 1) {
          files.push(file);
        } else {
          folders.add(parts[0]);
        }
      } else {
        // Subfolders: check if file path starts with "currentPathString/"
        if (filePath.startsWith(currentPathString + '/')) {
          const relativePath = filePath.substring(currentPathString.length + 1);
          const parts = relativePath.split('/');
          if (parts.length === 1) {
            files.push(file);
          } else {
            folders.add(parts[0]);
          }
        }
      }
    });

    return {
      folders: Array.from(folders).sort(),
      files: files.sort((a, b) => a.filename.localeCompare(b.filename))
    };
  };

  const { folders, files } = getFolderContents();

  // File type icons mapping
  const getFileIcon = (filename, mimetype) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) || mimetype?.startsWith('image/')) {
      return <FileImage className="h-4 w-4 text-[#e3b341] flex-shrink-0" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'go', 'sh', 'rb', 'c', 'cpp'].includes(ext)) {
      return <FileCode className="h-4 w-4 text-[#58a6ff] flex-shrink-0" />;
    }
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive className="h-4 w-4 text-[#a371f7] flex-shrink-0" />;
    }
    if (['txt', 'md', 'rtf'].includes(ext)) {
      return <FileText className="h-4 w-4 text-[#8b949e] flex-shrink-0" />;
    }
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4 text-[#34d399] flex-shrink-0" />;
    }
    return <File className="h-4 w-4 text-[#8b949e] flex-shrink-0" />;
  };

  // Preview File Handler
  const handleFileClick = async (file) => {
    setPreviewFile(file);
    const ext = file.filename.split('.').pop().toLowerCase();
    const isText = ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'go', 'sh', 'rb', 'c', 'cpp', 'csv', 'yaml', 'yml'].includes(ext);

    if (isText) {
      setPreviewLoading(true);
      setPreviewContent('');
      try {
        const response = await api.get(`/api/repositories/${id}/files/${file._id}/download`, {
          responseType: 'text'
        });
        setPreviewContent(response.data);
      } catch (err) {
        console.error('Preview fetch error:', err);
        setPreviewContent('Could not load text file preview.');
      } finally {
        setPreviewLoading(false);
      }
    } else {
      setPreviewContent('');
    }
  };

  // Drag and Drop File Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArr = Array.from(e.dataTransfer.files);
      setUploadFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const filesArr = Array.from(e.target.files);
      setUploadFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleRemoveUploadFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle actual uploads to server
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    const formData = new FormData();
    uploadFiles.forEach((file) => {
      formData.append('files', file);
      
      // Compute relative directory path for upload
      let relPath = file.name;
      
      // If folder upload was triggered and webkitRelativePath is available
      if (file.webkitRelativePath) {
        relPath = file.webkitRelativePath;
      } else if (currentPathString !== '') {
        // If files are loaded into a subfolder, prepend currentPathString
        relPath = `${currentPathString}/${file.name}`;
      }
      formData.append('paths', relPath);
    });

    try {
      const response = await api.post(`/api/repositories/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setRepo(response.data);
      setUploadFiles([]);
    } catch (err) {
      console.error('File upload submission error:', err);
      setUploadError(err.response?.data?.message || 'Error uploading files.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete repository
  const handleDeleteRepo = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete the repository "${repo.name}"? This deletes all files permanently.`)) {
      return;
    }

    try {
      await api.delete(`/api/repositories/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting repository:', err);
      alert(err.response?.data?.message || 'Failed to delete repository.');
    }
  };

  // Delete single file
  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file permanently?')) return;

    try {
      const response = await api.delete(`/api/repositories/${id}/files/${fileId}`);
      setRepo(response.data.repository);
      if (previewFile?._id === fileId) {
        setPreviewFile(null);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      alert(err.response?.data?.message || 'Failed to delete file.');
    }
  };

  // Formats bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOwnerOrAdmin = repo && (repo.owner?._id === user?.id || repo.owner === user?.id || user?.isAdmin);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="text-sm text-[#8b949e]">Loading repository contents...</span>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="p-4 bg-[#f85149]/15 border border-[#f85149]/30 rounded text-center text-[#f85149] mb-4">
          {error || 'Repository not found.'}
        </div>
        <Link to="/" className="flex items-center justify-center space-x-1 text-[#58a6ff] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header breadcrumbs & actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#30363d] pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm text-[#8b949e]">
            <Link to="/" className="hover:text-[#58a6ff] flex items-center space-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Feed</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <FolderGit2 className="h-6 w-6 text-[#2f81f7]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#f0f6fc] flex items-center flex-wrap">
              <span className="text-[#8b949e] font-normal">{repo.owner?.username}</span>
              <span className="text-[#30363d] px-1">/</span>
              <span>{repo.name}</span>
            </h1>
          </div>
          
          {repo.description && (
            <p className="text-sm text-[#8b949e] max-w-2xl">{repo.description}</p>
          )}
        </div>

        {/* Global actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {repo.files.length > 0 && (
            <a
              href={`/api/repositories/${repo._id}/download-zip`}
              className="flex items-center space-x-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#30363d] px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              title="Download entire repo as ZIP"
            >
              <FileArchive className="h-4 w-4 text-[#8b949e]" />
              <span>Download ZIP</span>
            </a>
          )}
          
          {isOwnerOrAdmin && (
            <button
              onClick={handleDeleteRepo}
              className="flex items-center space-x-1.5 bg-[#21262d] hover:bg-[#f85149] hover:text-white border border-[#30363d] hover:border-transparent px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer text-[#f85149]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Repository</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2 cols wide): Path navigation & File list / Previewer */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* File Explorer box */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-sm">
            
            {/* Breadcrumb Path Bar */}
            <div className="bg-[#21262d] px-4 py-3 border-b border-[#30363d] flex items-center space-x-2 text-sm text-[#c9d1d9] overflow-x-auto">
              <button 
                onClick={() => handlePathClick(-1)}
                className="font-semibold text-[#58a6ff] hover:underline"
              >
                {repo.name}
              </button>
              
              {currentPathArr.map((folder, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="h-3 w-3 text-[#8b949e] flex-shrink-0" />
                  <button
                    onClick={() => handlePathClick(index)}
                    className="hover:underline text-[#58a6ff] font-medium"
                  >
                    {folder}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Explorer Item Rows */}
            <div className="divide-y divide-[#30363d]">
              {/* Parent Directory link ("..") */}
              {currentPathArr.length > 0 && (
                <div 
                  onClick={handleBackFolderClick}
                  className="flex items-center px-4 py-2.5 text-sm text-[#58a6ff] hover:bg-[#21262d] cursor-pointer transition-all font-medium select-none"
                >
                  <Folder className="h-4 w-4 text-[#8b949e] mr-2 flex-shrink-0" />
                  <span>..</span>
                </div>
              )}

              {/* Folder list */}
              {folders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => handleFolderClick(folder)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-[#e6edf3] hover:bg-[#21262d] cursor-pointer transition-all group"
                >
                  <div className="flex items-center truncate">
                    <Folder className="h-4 w-4 text-[#8b949e] group-hover:text-[#58a6ff] mr-2 flex-shrink-0" />
                    <span className="font-semibold truncate">{folder}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}

              {/* File list */}
              {files.map((file) => (
                <div
                  key={file._id}
                  onClick={() => handleFileClick(file)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all group ${
                    previewFile?._id === file._id ? 'bg-[#1f2937]' : 'hover:bg-[#21262d]'
                  }`}
                >
                  <div className="flex items-center truncate pr-4">
                    {getFileIcon(file.filename, file.mimetype)}
                    <span className="ml-2 font-medium truncate text-[#e6edf3]">{file.filename}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 flex-shrink-0 text-xs text-[#8b949e]">
                    <span>{formatBytes(file.size)}</span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/api/repositories/${repo._id}/files/${file._id}/download`}
                        className="p-1 hover:text-[#58a6ff] hover:bg-[#30363d] rounded transition-all"
                        title="Download file"
                        onClick={(e) => e.stopPropagation()} // Prevent preview trigger
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={(e) => handleDeleteFile(file._id, e)}
                          className="p-1 hover:text-[#f85149] hover:bg-[#30363d] rounded transition-all cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty directory note */}
              {folders.length === 0 && files.length === 0 && (
                <div className="text-center py-12 text-[#8b949e]">
                  <Folder className="h-10 w-10 text-[#30363d] mx-auto mb-2" />
                  <p className="text-sm">This directory is empty.</p>
                  {isOwnerOrAdmin && <p className="text-xs mt-1">Drag files/folders or use the upload panel on the right.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Built-in File Previewer */}
          {previewFile && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-sm animate-fade-in">
              <div className="bg-[#21262d] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  {getFileIcon(previewFile.filename, previewFile.mimetype)}
                  <span className="font-semibold text-[#e6edf3]">{previewFile.filename}</span>
                  <span className="text-xs text-[#8b949e]">({formatBytes(previewFile.size)})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`/api/repositories/${repo._id}/files/${previewFile._id}/download`}
                    className="flex items-center space-x-1 bg-[#30363d] hover:bg-[#8b949e] text-xs text-[#c9d1d9] px-2.5 py-1 rounded transition-all"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="text-[#8b949e] hover:text-[#f0f6fc] font-bold p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Preview Display */}
              <div className="p-4 bg-[#0d1117] overflow-auto max-h-[500px]">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : previewContent ? (
                  <pre className="text-xs font-mono text-[#e6edf3] whitespace-pre-wrap leading-relaxed">
                    {previewContent}
                  </pre>
                ) : (
                  // If it's an image
                  previewFile.filename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || previewFile.mimetype?.startsWith('image/') ? (
                    <div className="flex justify-center p-4">
                      <img
                        src={`/api/repositories/${repo._id}/files/${previewFile._id}/download`}
                        alt={previewFile.filename}
                        className="max-h-[400px] object-contain rounded border border-[#30363d]"
                      />
                    </div>
                  ) : (
                    // Binary files placeholder
                    <div className="text-center py-12 text-[#8b949e]">
                      <File className="h-12 w-12 text-[#30363d] mx-auto mb-2" />
                      <p className="text-sm font-semibold">No Preview Available</p>
                      <p className="text-xs mt-1">Binary file type: {previewFile.mimetype || 'Unknown'}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (1 col wide): Upload Files & folder widgets */}
        <div className="space-y-4">
          
          {/* Uploader Box */}
          {isOwnerOrAdmin ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-[#f0f6fc] text-sm flex items-center space-x-2">
                  <UploadCloud className="h-4 w-4 text-[#2f81f7]" />
                  <span>Upload Files / Folders</span>
                </h3>
                <p className="text-[11px] text-[#8b949e] mt-1">
                  Upload contents into the current path: <span className="font-mono text-[#c9d1d9] bg-[#21262d] px-1 rounded">{currentPathString || 'root'}</span>
                </p>
              </div>

              {/* Upload Type Selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0d1117] rounded-md border border-[#30363d]">
                <button
                  type="button"
                  onClick={() => { setUploadType('files'); setUploadFiles([]); }}
                  className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                    uploadType === 'files' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                  }`}
                >
                  Files Upload
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadType('folder'); setUploadFiles([]); }}
                  className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                    uploadType === 'folder' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                  }`}
                >
                  Folder Upload
                </button>
              </div>

              {/* Drag/Click target area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  if (uploadType === 'files') fileInputRef.current.click();
                  else folderInputRef.current.click();
                }}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-[#2f81f7] bg-[#2f81f7]/5' 
                    : 'border-[#30363d] hover:border-[#8b949e] bg-[#0d1117]'
                }`}
              >
                <UploadCloud className="h-8 w-8 text-[#8b949e] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#c9d1d9]">
                  {uploadType === 'files' ? 'Click or drag files here to upload' : 'Click to select a directory to upload'}
                </p>
                <p className="text-[10px] text-[#8b949e] mt-1">Supports up to 50MB per file</p>
                
                {/* Hidden input references */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                
                {/* Folder Upload Input with specific webkit directory configs */}
                <input
                  type="file"
                  ref={folderInputRef}
                  onChange={handleFileSelect}
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                />
              </div>

              {/* File Upload Queue List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8b949e]">
                    <span>Queue: {uploadFiles.length} files selected</span>
                    <button 
                      onClick={() => setUploadFiles([])} 
                      className="text-[#f85149] hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 bg-[#0d1117] border border-[#30363d] rounded p-2">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-[#c9d1d9] py-1 border-b border-[#21262d] last:border-0 last:py-0">
                        <span className="truncate pr-4 max-w-[180px]" title={file.webkitRelativePath || file.name}>
                          {file.webkitRelativePath || file.name}
                        </span>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <span className="text-[10px] text-[#8b949e]">{formatBytes(file.size)}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveUploadFile(idx)} 
                            className="text-[#f85149] hover:text-white p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Indicator */}
                  {isUploading && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-[#8b949e]">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#30363d] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#2f81f7] h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {uploadError && (
                    <div className="p-2.5 bg-[#f85149]/10 border border-[#f85149]/20 rounded text-[11px] text-[#f85149]">
                      {uploadError}
                    </div>
                  )}

                  <button
                    onClick={handleUploadSubmit}
                    disabled={isUploading}
                    className="w-full bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-semibold text-xs py-2 rounded transition-all cursor-pointer"
                  >
                    {isUploading ? 'Uploading files...' : 'Commit changes'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Read only panel for non-owners
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-sm text-center text-xs text-[#8b949e]">
              <p>You have read-only access to this repository.</p>
              <p className="mt-1">Only the owner can upload files or modify contents.</p>
            </div>
          )}

          {/* Repository Info Widget */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-semibold text-[#f0f6fc] text-sm">About Repository</h3>
            
            <div className="space-y-2 text-[#c9d1d9]">
              <div className="flex justify-between border-b border-[#21262d] pb-1.5">
                <span className="text-[#8b949e]">Owner</span>
                <span className="font-semibold">{repo.owner?.username}</span>
              </div>
              <div className="flex justify-between border-b border-[#21262d] pb-1.5">
                <span className="text-[#8b949e]">Total Size</span>
                <span>{formatBytes(repo.files.reduce((sum, f) => sum + f.size, 0))}</span>
              </div>
              <div className="flex justify-between border-b border-[#21262d] pb-1.5">
                <span className="text-[#8b949e]">Files Count</span>
                <span>{repo.files.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Created Date</span>
                <span>{new Date(repo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
