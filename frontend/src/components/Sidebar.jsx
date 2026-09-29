import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  UserCircleIcon,
  FolderIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({
  activeFileId,
  onSelectFile,
  onNewChat,
  currentUser,
  onOpenAuth,
  onOpenSavedProjects,
  onLogout,
  onOpenFeedback,
  isOpen,
  onToggle,
  refreshTrigger
}) => {
  const [filesList, setFilesList] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Load list of files / recent chats
  const fetchRecentFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await axios.get(`${apiUrl}/files`);
      if (res.data?.files) {
        setFilesList(res.data.files);
      }
    } catch (err) {
      console.warn("Could not load recent files list:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchRecentFiles();
  }, [activeFileId, refreshTrigger]);

  // Handle delete a chat session / file
  const handleDeleteFile = async (e, fileId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat session and its data?")) return;

    try {
      await axios.delete(`${apiUrl}/files/${fileId}`);
      setFilesList(prev => prev.filter(f => f.file_id !== fileId));
      if (activeFileId === fileId) {
        onNewChat();
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
      // Fallback local remove
      setFilesList(prev => prev.filter(f => f.file_id !== fileId));
      if (activeFileId === fileId) onNewChat();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 bg-slate-950 flex flex-col transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
          isOpen 
            ? 'translate-x-0 w-64 sm:w-72 border-r border-slate-800/80 opacity-100' 
            : '-translate-x-full md:translate-x-0 w-64 sm:w-72 md:w-0 md:border-r-0 md:opacity-0'
        }`}
      >
        {/* Top Brand Bar */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <div 
            onClick={onNewChat}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img className="h-7 w-auto" src="/logo.png" alt="SortifyAI" />
            <span className="font-semibold text-sm tracking-tight text-white">
              Sortify<span className="text-brand-primary">AI</span>
            </span>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Action: + New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onToggle();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs transition-standard hover-subtle group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
              Upload
            </span>
          </button>
        </div>

        {/* Recent Chats Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          <div className="px-2 py-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Chats</span>
            <button
              onClick={fetchRecentFiles}
              className="text-[10px] text-slate-500 hover:text-slate-300 hover:underline"
              title="Refresh files"
            >
              Refresh
            </button>
          </div>

          {!currentUser ? (
            <div className="px-3 py-6 text-center text-slate-500 text-xs bg-slate-900/50 rounded-lg border border-slate-800/80 mt-2">
              <UserCircleIcon className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 font-medium mb-1.5">Sign in to save chats</p>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                Your chats are not saved unless you are logged in.
              </p>
              <button 
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-standard border border-slate-700"
              >
                Sign In Now
              </button>
            </div>
          ) : filesList.length > 0 ? (
            filesList.map((file) => {
              const isActive = activeFileId === file.file_id;
              const formattedDate = file.upload_date 
                ? new Date(file.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';

              return (
                <div
                  key={file.file_id}
                  onClick={() => {
                    onSelectFile(file);
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-standard text-xs ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <ChatBubbleLeftIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                    <div className="truncate">
                      <div className="truncate text-xs">{file.filename || "Roster Chat"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {file.total_rows ? `${file.total_rows} rows` : 'Loaded'} {formattedDate ? `• ${formattedDate}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Delete Action on Hover */}
                  <button
                    onClick={(e) => handleDeleteFile(e, file.file_id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700/80 text-slate-400 hover:text-rose-400 transition-opacity"
                    title="Delete chat session"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-6 text-center text-slate-500 text-xs">
              <DocumentTextIcon className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>No recent chats yet.</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Upload a roster to begin!</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 text-xs">
          {/* User Account / Profile */}
          {currentUser ? (
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <div className="text-white font-medium truncate text-xs">@{currentUser.username || currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onOpenSavedProjects}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-standard"
                  title="Saved Projects"
                >
                  <FolderIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-standard"
                  title="Sign Out"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-standard"
            >
              <UserCircleIcon className="w-4 h-4 text-cyan-400" />
              <span>Sign In / Create Account</span>
            </button>
          )}

          {/* Feedback */}
          <button
            onClick={onOpenFeedback}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-standard text-xs"
          >
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            <span>Give Feedback</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
