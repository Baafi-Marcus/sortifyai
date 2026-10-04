import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import FileInspector from './components/FileInspector';
import ResultsStudio from './components/ResultsStudio';
import ExportModal from './components/ExportModal';
import TablePreviewModal from './components/TablePreviewModal';
import FeedbackModal from './components/FeedbackModal';
import AuthModal from './components/AuthModal';
import SavedProjectsModal from './components/SavedProjectsModal';
import AdminPage from './components/AdminPage';
import LandingPage from './components/LandingPage';
import { 
  SparklesIcon, 
  Bars3Icon, 
  ChatBubbleLeftRightIcon, 
  ArrowTopRightOnSquareIcon,
  TableCellsIcon,
  FolderIcon,
  UserCircleIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

const App = () => {
  // Navigation View: 'landing' | 'chat' | 'results' | 'upload' | 'admin'
  const [currentView, setCurrentView] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  // Active File & Grouping State
  const [fileData, setFileData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [reportTitle, setReportTitle] = useState('SortifyAI Groups');
  const [decisionSummary, setDecisionSummary] = useState(null);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedProjectsModal, setShowSavedProjectsModal] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sortifyai_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('sortifyai_token') || '');

  // Backend Keep-Alive / Pre-warm
  const [serverStatus, setServerStatus] = useState('checking');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Handle SPA 404 Routing for invalid paths
  useEffect(() => {
    const path = window.location.pathname;
    // Allow root and any valid html pages in the public directory (like privacy.html, 404.html)
    if (path !== '/' && !path.endsWith('.html')) {
      window.location.href = '/404.html';
    }
  }, []);

  // Restore active file session on refresh
  useEffect(() => {
    const savedFileStr = localStorage.getItem('sortifyai_active_file');
    if (savedFileStr && window.location.hash !== '#admin') {
      try {
        const savedFile = JSON.parse(savedFileStr);
        if (savedFile && savedFile.file_id) {
          handleSelectFileFromSidebar(savedFile);
        }
      } catch (err) {
        console.warn("Failed to parse saved active file", err);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const pingBackend = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`, { mode: 'cors' }).catch(() =>
          fetch(`${apiUrl}/`, { mode: 'cors' })
        );
        if (res && res.ok && isMounted) {
          setServerStatus('ready');
        }
      } catch (err) {
        console.warn('Backend pre-warming check:', err);
      }
    };
    pingBackend();
    return () => { isMounted = false; };
  }, [apiUrl]);

  // Private Admin Portal access via #admin
  useEffect(() => {
    const checkAdminHash = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else if (currentView === 'admin') {
        setCurrentView(fileData ? 'chat' : 'upload');
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    return () => window.removeEventListener('hashchange', checkAdminHash);
  }, [fileData, currentView]);

  // Auth Handlers
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('sortifyai_user', JSON.stringify(user));
    localStorage.setItem('sortifyai_token', token);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('sortifyai_user');
    localStorage.removeItem('sortifyai_token');
  };

  // Handler: When user clicks a chat/file from Sidebar
  const handleSelectFileFromSidebar = async (fileSummary) => {
    localStorage.setItem('sortifyai_active_file', JSON.stringify(fileSummary));
    try {
      const res = await axios.get(`${apiUrl}/files/${fileSummary.file_id}/preview`);
      if (res.data) {
        setFileData({
          file_id: fileSummary.file_id,
          filename: res.data.filename || fileSummary.filename,
          total_rows: res.data.total_rows || fileSummary.total_rows,
          columns: res.data.columns || [],
          preview: res.data.preview || [],
          issues: res.data.issues || []
        });

        // Fetch any existing groups for this file
        try {
          const grpRes = await axios.get(`${apiUrl}/groupings/${fileSummary.file_id}`);
          if (grpRes.data?.groupings && grpRes.data.groupings.length > 0) {
            const latest = grpRes.data.groupings[0];
            setGroups(latest.groups || []);
            if (latest.report_title) setReportTitle(latest.report_title);
            setDecisionSummary({
              primary: "Previous AI Grouping",
              secondary: `${latest.groups?.length || 0} Cohorts`,
              group_count: latest.groups?.length || 0
            });
            setCurrentView('results');
          } else {
            setGroups([]);
            setDecisionSummary(null);
            setCurrentView('chat');
          }
        } catch {
          setGroups([]);
          setCurrentView('chat');
        }
      }
    } catch (err) {
      console.warn("Could not load preview, using basic file metadata:", err);
      setFileData({
        file_id: fileSummary.file_id,
        filename: fileSummary.filename,
        total_rows: fileSummary.total_rows,
        columns: [],
        preview: [],
        issues: []
      });
      setCurrentView('chat');
    }
  };

  // Handler: + New Chat
  const handleNewChat = () => {
    setFileData(null);
    setGroups([]);
    setDecisionSummary(null);
    localStorage.removeItem('sortifyai_active_file');
    setCurrentView('upload');
  };

  // Handler: File uploaded via dropzone
  const handleFileLoaded = (data) => {
    setFileData(data);
    setGroups([]);
    setDecisionSummary(null);
    setSidebarRefresh((prev) => prev + 1);
    localStorage.setItem('sortifyai_active_file', JSON.stringify({ file_id: data.file_id, filename: data.filename, total_rows: data.total_rows }));
    setCurrentView('chat');
  };

  // Handler: Groups updated during chat
  const handleGroupsUpdated = (newGroups, promptText, title) => {
    setGroups(newGroups);
    if (title) setReportTitle(title);

    setDecisionSummary({
      primary: "Chat AI Instruction",
      secondary: `${newGroups.length} Balanced Cohorts`,
      group_count: newGroups.length
    });
  };

  // Handler: Follow-Up AI Regroup from ResultsStudio
  const handleRefineWithAI = async (refineInstruction) => {
    if (!fileData?.file_id) return;
    try {
      const res = await axios.post(`${apiUrl}/chat`, {
        file_id: fileData.file_id,
        message: `Regroup adjusting: ${refineInstruction}`
      });
      if (res.data?.groups) {
        setGroups(res.data.groups);
        if (res.data.report_title) setReportTitle(res.data.report_title);
      }
    } catch (err) {
      console.error("Refine with AI failed:", err);
    }
  };

  // Handler: Auto-save manual edits to the backend
  const handleAutoSave = async (updatedGroups) => {
    if (!fileData?.file_id) return;
    try {
      await axios.put(`${apiUrl}/groupings/${fileData.file_id}/latest`, {
        groups: updatedGroups
      });
      // Also update local groups state so it stays in sync
      setGroups(updatedGroups);
    } catch (err) {
      console.error("Auto-save manual edits failed:", err);
    }
  };

  // Handler: Save to Cloud
  const handleSaveToCloud = async (currentGroups) => {
    if (!currentUser || !authToken) {
      setShowAuthModal(true);
      return;
    }

    const defaultTitle = fileData?.filename 
      ? `${fileData.filename.split('.')[0]} Cohort Allocation` 
      : `Student Groups (${new Date().toLocaleDateString()})`;
    const projectTitle = window.prompt("Enter a title for this saved project in your Neon Cloud:", defaultTitle);
    if (!projectTitle) return;

    try {
      const res = await axios.post(`${apiUrl}/projects/save`, {
        title: projectTitle,
        filename: fileData?.filename || 'manual_entry',
        total_students: fileData?.total_rows || currentGroups.reduce((a, b) => a + (b.items?.length || 0), 0),
        groups_count: currentGroups.length,
        groups_data: currentGroups
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      alert(res.data?.message || 'Project saved successfully to your Neon PostgreSQL cloud database!');
    } catch (err) {
      console.error('Save to cloud failed:', err);
      alert('Could not save project to cloud.');
    }
  };

  // Handler: Load Saved Project
  const handleLoadProject = (project) => {
    setGroups(project.groups || []);
    setFileData({
      filename: project.filename || project.title,
      total_rows: project.total_students,
      columns: []
    });
    setDecisionSummary({
      primary: "Restored from Neon Cloud Database",
      secondary: `${project.groups_count} cohorts`,
      totalGroups: project.groups_count
    });
    setCurrentView('results');
    setShowSavedProjectsModal(false);
  };

  // If in dedicated Admin portal
  if (currentView === 'admin') {
    return (
      <AdminPage onBack={() => {
        window.location.hash = '';
        setCurrentView(fileData ? 'chat' : 'upload');
      }} />
    );
  }

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage 
          onGetStarted={() => {
            setFileData(null);
            setCurrentView('upload');
          }}
          serverStatus={serverStatus}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenSavedProjects={() => setShowSavedProjectsModal(true)}
          onLogout={handleLogout}
        />
      ) : (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
          {/* 1. Left Sidebar (Saved Chats & Sessions) */}
          <Sidebar
            activeFileId={fileData?.file_id}
            onSelectFile={handleSelectFileFromSidebar}
            onNewChat={handleNewChat}
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenSavedProjects={() => setShowSavedProjectsModal(true)}
            onLogout={handleLogout}
            onOpenFeedback={() => setFeedbackOpen(true)}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
            refreshTrigger={sidebarRefresh}
          />

          {/* 2. Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950">
            {/* If file is active and view is 'chat': Render Chatbot Interface */}
            {fileData && currentView === 'chat' && (
              <ChatInterface
                file={fileData}
                onViewResults={() => setCurrentView('results')}
                onExportGroups={() => setShowExportModal(true)}
                onGroupsUpdated={handleGroupsUpdated}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                sidebarOpen={sidebarOpen}
                onInspectFile={() => setShowInspectModal(true)}
              />
            )}

            {/* If file is active and view is 'results': Render Results Studio */}
            {fileData && currentView === 'results' && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Top Bar for Results Studio */}
                <header className="h-14 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur sticky top-0 z-30 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSidebarOpen((prev) => !prev)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ${sidebarOpen ? 'md:hidden' : ''}`}
                    >
                      <Bars3Icon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentView('chat')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-standard"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-cyan-400" />
                      <span>← Back to Chat</span>
                    </button>
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      {fileData.filename} ({groups.length} groups)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-standard shadow-sm"
                    >
                      Export Groups
                    </button>
                  </div>
                </header>

                <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                  <ResultsStudio
                    reportTitle={reportTitle}
                    groups={groups}
                    decisionSummary={decisionSummary}
                    onRefineWithAI={handleRefineWithAI}
                    onOpenExport={() => setShowExportModal(true)}
                    onPrintRoster={() => window.print()}
                    onSaveToCloud={handleSaveToCloud}
                    onAutoSave={handleAutoSave}
                    totalRows={fileData.total_rows || 120}
                  />
                </div>
              </div>
            )}

            {/* If no file is loaded (or user clicked + New Chat): Welcoming Chatbot Onboarding & Dropzone */}
            {(!fileData || currentView === 'upload') && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Top Bar for Empty State */}
                <header className="h-14 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur sticky top-0 z-30 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSidebarOpen((prev) => !prev)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ${sidebarOpen ? 'md:hidden' : ''}`}
                    >
                      <Bars3Icon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentView('landing')}
                      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-standard"
                    >
                      <span>← Home</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="SortifyAI" className="h-6 w-auto" />
                    <span className="font-semibold text-xs tracking-tight text-white">
                      Sortify<span className="text-cyan-400">AI</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser ? (
                      <span className="text-xs text-slate-400 font-medium">
                        Hello, <strong className="text-white">@{currentUser.username}</strong>
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-standard border border-slate-700"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </header>

                {/* Welcoming Content */}
                <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                  <div className="max-w-2xl w-full space-y-8 text-center animate-fadeIn">
                    {/* Hero Title */}
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/10">
                        <SparklesIcon className="w-7 h-7" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        What would you like to analyze or group today?
                      </h1>
                      <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                        Upload your class register, score sheet, or team roster. Once uploaded, you can ask questions about the data and group records using plain conversational English.
                      </p>
                    </div>

                    {/* Upload Inspector */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-left">
                      <FileInspector
                        fileData={fileData}
                        onFileLoaded={handleFileLoaded}
                        onProceed={() => setCurrentView('chat')}
                        onReset={handleNewChat}
                        serverStatus={serverStatus}
                      />
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                        <div className="text-xs font-semibold text-cyan-300">💬 Ask Anything</div>
                        <div className="text-[11px] text-slate-400">
                          "What is the average score?", "How many students passed?", "Show all females".
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                        <div className="text-xs font-semibold text-cyan-300">👥 Smart Grouping</div>
                        <div className="text-[11px] text-slate-400">
                          "Divide into 4 balanced cohorts with equal gender and score distribution".
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                        <div className="text-xs font-semibold text-cyan-300">💾 Saved in Sidebar</div>
                        <div className="text-[11px] text-slate-400">
                          All your chats and files are securely preserved in the sidebar for easy access anytime.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Preview Modal (Data Inspector in Chat) */}
      <TablePreviewModal
        isOpen={showInspectModal}
        onClose={() => setShowInspectModal(false)}
        fileData={fileData}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        groups={groups}
        filename={fileData?.filename ? fileData.filename.split('.')[0] : "SortifyAI_Cohorts"}
        reportTitle={reportTitle}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      {/* Auth Modal (Username + Strong Password + Email) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Saved Cloud Projects Modal */}
      <SavedProjectsModal
        isOpen={showSavedProjectsModal}
        onClose={() => setShowSavedProjectsModal(false)}
        token={authToken}
        onLoadProject={handleLoadProject}
      />
    </>
  );
};

export default App;
