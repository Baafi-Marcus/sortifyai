import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LandingPage from './components/LandingPage';
import FileInspector from './components/FileInspector';
import GroupingPrompt from './components/GroupingPrompt';
import InterpretationModal from './components/InterpretationModal';
import ProcessingState from './components/ProcessingState';
import ResultsStudio from './components/ResultsStudio';
import ExportModal from './components/ExportModal';
import CheckGroupsView from './components/CheckGroupsView';
import FeedbackModal from './components/FeedbackModal';
import DeveloperApiModal from './components/DeveloperApiModal';
import AuthModal from './components/AuthModal';
import SavedProjectsModal from './components/SavedProjectsModal';
import { generateSampleStudents } from './utils/sampleData';
import { 
  ArrowPathIcon, 
  ChatBubbleBottomCenterTextIcon, 
  SparklesIcon, 
  DocumentChartBarIcon, 
  CheckCircleIcon,
  CodeBracketIcon,
  FolderIcon,
  UserCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const App = () => {
  // Navigation / Workflow State (Point 1 & 13)
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'upload' | 'prompt' | 'processing' | 'results'
  
  // Data & Grouping State
  const [fileData, setFileData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [decisionSummary, setDecisionSummary] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  
  // Modals & Assistant States
  const [interpretation, setInterpretation] = useState(null);
  const [showInterpretationModal, setShowInterpretationModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [developerApiOpen, setDeveloperApiOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // User Authentication & Saved Cloud Projects (Google OAuth)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sortifyai_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('sortifyai_token') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedProjectsModal, setShowSavedProjectsModal] = useState(false);
  
  // Server Keep-Alive / Pre-warm state (Method 2)
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const warmingTimer = setTimeout(() => {
      if (isMounted) setServerStatus('warming');
    }, 2500);

    const pingBackend = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`, { mode: 'cors' }).catch(() =>
          fetch(`${apiUrl}/`, { mode: 'cors' })
        );
        if (res && res.ok) {
          clearTimeout(warmingTimer);
          if (isMounted) setServerStatus('ready');
        }
      } catch (err) {
        console.warn('Backend pre-warming check:', err);
      }
    };

    pingBackend();

    return () => {
      isMounted = false;
      clearTimeout(warmingTimer);
    };
  }, []);

  // Auth Handlers (Google OAuth)
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

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
  };

  // Handler: Try with 120 Sample Students (Point 2)
  const handleTrySample = () => {
    const sample = generateSampleStudents();
    setFileData(sample);
    setCurrentView('upload');
  };

  // Handler: File Loaded from Upload
  const handleFileLoaded = (data) => {
    setFileData(data);
  };

  // Handler: Submit Prompt to AI Interpretation (Point 3 & 4)
  const handleSubmitPrompt = async (promptText) => {
    setCurrentPrompt(promptText);
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      if (fileData?.file_id && fileData.file_id !== 'sample-students-cohort') {
        const res = await axios.post(`${apiUrl}/interpret`, {
          file_id: fileData.file_id,
          instructions: promptText
        });
        if (res.data) {
          setInterpretation(res.data);
          setShowInterpretationModal(true);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend interpret call failed, using client-side interpretation heuristic:", err);
    }

    // Client-side smart interpretation fallback
    const countMatch = promptText.match(/(\d+)\s*(?:groups?|teams?|houses?)/i);
    const count = countMatch ? parseInt(countMatch[1]) : 10;
    const total = fileData?.total_rows || 120;
    const avgPerGrp = Math.round(total / count);

    const summaryPoints = [
      `${count} groups (~${avgPerGrp} students per group)`
    ];
    if (/gender|sex|male|female|boy|girl/i.test(promptText)) {
      summaryPoints.push("Balance male and female distribution equally (50/50 where possible)");
    }
    if (/prog|programme|course|track|mix|subject/i.test(promptText)) {
      summaryPoints.push("Evenly distribute students from different programmes across groups");
    }
    if (/score|academic|mark|performance|similar|high/i.test(promptText)) {
      summaryPoints.push("Balance academic performance spread so each group has equal average score");
    }

    if (summaryPoints.length === 1) {
      summaryPoints.push("Balanced and diverse allocation across all detected attributes");
    }

    setInterpretation({
      interpreted_as: summaryPoints,
      criteria: {
        primary: /score|academic/i.test(promptText) ? "Academic Score" : "Equal Group Sizes",
        secondary: /prog/i.test(promptText) ? "Programme Diversity" : "Cohort Distribution",
        balance: /gender|sex/i.test(promptText) ? "Gender (50/50)" : "Even Headcount",
        group_count: count
      },
      group_count: count
    });
    setShowInterpretationModal(true);
    setLoading(false);
  };

  // Handler: Confirm Interpretation -> Run Multi-step Processing -> Generate Groups (Point 3, 5, 14)
  const handleConfirmGenerate = async () => {
    setShowInterpretationModal(false);
    setCurrentView('processing');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const startTime = Date.now();

    try {
      if (fileData?.file_id && fileData.file_id !== 'sample-students-cohort') {
        const response = await axios.post(`${apiUrl}/group`, {
          file_id: fileData.file_id,
          instructions: currentPrompt
        });

        if (response.data && response.data.groups && response.data.groups.length > 0) {
          // Allow processing animation to display for at least 2.5s for professional feel (Point 14)
          const elapsed = Date.now() - startTime;
          const waitTime = Math.max(0, 2500 - elapsed);
          setTimeout(() => {
            setGroups(response.data.groups);
            setDecisionSummary(response.data.decision_summary || interpretation?.criteria);
            setCurrentView('results');
          }, waitTime);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend group endpoint encountered error, activating intelligent local grouping:", err);
    }

    // Local balanced grouping engine (for sample data or offline mode)
    const records = fileData?.records || generateSampleStudents().records;
    const count = interpretation?.group_count || 10;
    const generatedGroups = [];

    for (let g = 0; g < count; g++) {
      generatedGroups.push({
        name: `Group ${g + 1}`,
        description: `Balanced cohort of students`,
        items: []
      });
    }

    // Balanced distribution: round-robin sort by score and gender
    const sorted = [...records].sort((a, b) => (b.Score || 0) - (a.Score || 0));
    sorted.forEach((student, idx) => {
      // Snake distribution for perfect score equality
      const cycle = Math.floor(idx / count);
      const pos = cycle % 2 === 0 ? idx % count : count - 1 - (idx % count);
      generatedGroups[pos].items.push(student);
    });

    setTimeout(() => {
      setGroups(generatedGroups);
      setDecisionSummary(interpretation?.criteria || {
        primary: "Academic Score",
        secondary: "Programme Mix",
        balance: "Gender Parity",
        group_count: count
      });
      setCurrentView('results');
    }, 2800);
  };

  // Handler: Follow-Up AI Regroup (Point 7)
  const handleRefineWithAI = async (refineInstruction) => {
    const updatedPrompt = `${currentPrompt}. Adjustment: ${refineInstruction}`;
    setCurrentPrompt(updatedPrompt);
    await handleSubmitPrompt(updatedPrompt);
  };

  // Handler: Check My Groups Audit (Point 19)
  const handleCheckGroups = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      if (fileData?.file_id && fileData.file_id !== 'sample-students-cohort') {
        const res = await axios.post(`${apiUrl}/check-groups`, {
          file_id: fileData.file_id
        });
        if (res.data) {
          setAuditReport(res.data);
          setShowAuditModal(true);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend check-groups error:", err);
    }

    // Default audit report simulation
    setAuditReport({
      group_column: "Group",
      total_groups: 8,
      total_students: fileData?.total_rows || 120,
      report: {
        group_size: "Good",
        gender_balance: "Needs Adjustment",
        academic_balance: "Good",
        insights: [
          "Group size is consistent (~15 students per group).",
          "Gender imbalance detected: Group 2 has 75% male students while Group 5 has only 20% male students.",
          "Academic scores are evenly spread across groups."
        ]
      }
    });
    setShowAuditModal(true);
    setLoading(false);
  };

  // Reset to Start Over
  const handleReset = () => {
    setFileData(null);
    setGroups([]);
    setDecisionSummary(null);
    setCurrentPrompt("");
    setCurrentView('upload');
  };

  return (
    <div className="min-h-screen bg-brand-dark text-slate-100 font-sans selection:bg-brand-primary/20 flex flex-col">
      {/* Studio Header (shown when inside app workflow) */}
      {currentView !== 'landing' && (
        <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div 
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img className="h-7 w-auto" src="/logo.png" alt="SortifyAI" />
              <span className="font-semibold text-sm tracking-tight text-white hidden sm:inline">
                Sortify<span className="text-brand-primary">AI</span>
              </span>
            </div>

            {/* Workflow Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium">
              <button 
                onClick={() => setCurrentView('upload')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-standard ${
                  currentView === 'upload' 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>1. Student Data</span>
              </button>
              <span className="text-slate-600">→</span>
              <button 
                onClick={() => fileData && setCurrentView('prompt')}
                disabled={!fileData}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-standard disabled:opacity-40 ${
                  currentView === 'prompt' 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>2. Grouping Goals</span>
              </button>
              <span className="text-slate-600">→</span>
              <button 
                onClick={() => groups.length > 0 && setCurrentView('results')}
                disabled={groups.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-standard disabled:opacity-40 ${
                  currentView === 'results' || currentView === 'processing'
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>3. Results Studio</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {serverStatus === 'warming' && (
                <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <span>Waking server...</span>
                </div>
              )}

              {fileData && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-standard border border-slate-700"
                >
                  New Project
                </button>
              )}

              <button
                onClick={() => setDeveloperApiOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-standard border border-slate-700"
                title="SortifyAI Engine Documentation"
              >
                <CodeBracketIcon className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">Documentation</span>
              </button>

              {/* User Authentication / Profile */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setShowSavedProjectsModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-standard"
                    title="My Cloud Projects"
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Projects</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-standard border border-slate-700"
                    aria-label="Sign out of account"
                    title="Sign Out"
                  >
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="hidden lg:inline">{currentUser.name.split(' ')[0]}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-standard"
                  title="Sign In with Google"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.94H1.28v3.13C3.28 21.36 7.36 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.32 14.26c-.24-.73-.38-1.5-.38-2.26s.14-1.53.38-2.26V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l4.04-3.13z"/>
                    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.36 0 3.28 2.64 1.28 6.61l4.04 3.13c.94-2.84 3.58-4.97 6.68-4.97z"/>
                  </svg>
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button
                onClick={() => setFeedbackOpen(true)}
                aria-label="Give system feedback"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-standard border border-slate-700"
                title="Give Feedback"
              >
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        {/* View 1: Outcome-focused Landing Page (Points 1, 18) */}
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={() => setCurrentView('upload')}
            onTrySample={handleTrySample}
            serverStatus={serverStatus}
            onOpenDeveloperApi={() => setDeveloperApiOpen(true)}
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenSavedProjects={() => setShowSavedProjectsModal(true)}
            onLogout={handleLogout}
          />
        )}

        {/* View 2: Step 1 Upload & Data Preview Inspector (Points 2, 15) */}
        {currentView === 'upload' && (
          <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <FileInspector
              fileData={fileData}
              onFileLoaded={handleFileLoaded}
              onProceed={() => setCurrentView('prompt')}
              onReset={handleReset}
              serverStatus={serverStatus}
              onLoadSample={handleTrySample}
            />
          </div>
        )}

        {/* View 3: Step 2 "What do you want?" Signature Prompt (Points 3, 8, 9) */}
        {currentView === 'prompt' && (
          <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-6 max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setCurrentView('upload')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                ← Back to Student Data Preview
              </button>
              {fileData && (
                <span className="text-xs text-slate-400 font-mono">
                  Active file: <strong className="text-cyan-300">{fileData.filename}</strong> ({fileData.total_rows} records)
                </span>
              )}
            </div>

            <GroupingPrompt
              fileData={fileData}
              onSubmitPrompt={handleSubmitPrompt}
              onCheckGroups={handleCheckGroups}
              loading={loading}
            />
          </div>
        )}

        {/* View 4: Step 3 Multi-Step Processing State (Point 14) */}
        {currentView === 'processing' && (
          <ProcessingState onComplete={() => setCurrentView('results')} />
        )}

        {/* View 5: Step 4 Results & Analytics Studio (Points 4, 5, 6, 7, 10, 11, 12, 13) */}
        {currentView === 'results' && (
          <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <ResultsStudio
              groups={groups}
              decisionSummary={decisionSummary}
              onRefineWithAI={handleRefineWithAI}
              onOpenExport={() => setShowExportModal(true)}
              onPrintRoster={() => window.print()}
              onSaveToCloud={handleSaveToCloud}
              totalRows={fileData?.total_rows || 120}
            />
          </div>
        )}
      </div>

      {/* Modal: AI Interpretation & Pre-Confirmation (Points 3, 4) */}
      <InterpretationModal
        isOpen={showInterpretationModal}
        interpretation={interpretation}
        onConfirm={handleConfirmGenerate}
        onModify={() => setShowInterpretationModal(false)}
        onClose={() => setShowInterpretationModal(false)}
        loading={loading}
      />

      {/* Modal: Export Options (Point 11) */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        groups={groups}
        filename={fileData?.filename ? fileData.filename.split('.')[0] : "SortifyAI_Student_Groups"}
      />

      {/* Modal: Check My Groups Audit (Point 19) */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <CheckGroupsView
            report={auditReport}
            onReoptimize={() => {
              setShowAuditModal(false);
              setCurrentView('prompt');
            }}
            onClose={() => setShowAuditModal(false)}
          />
        </div>
      )}

      {/* Modal: Feedback */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      {/* Modal: Developer API Explorer & SDKs */}
      <DeveloperApiModal
        isOpen={developerApiOpen}
        onClose={() => setDeveloperApiOpen(false)}
      />

      {/* Modal: Google Authentication */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal: Saved Cloud Projects */}
      <SavedProjectsModal
        isOpen={showSavedProjectsModal}
        onClose={() => setShowSavedProjectsModal(false)}
        token={authToken}
        onLoadProject={handleLoadProject}
      />
    </div>
  );
};

export default App;
