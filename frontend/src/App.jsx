import React, { useState } from 'react';
import { FolderIcon, Squares2X2Icon, ShieldCheckIcon, ArrowRightIcon, PlusIcon, ChatBubbleLeftIcon, UserCircleIcon, Cog6ToothIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import GroupDisplay from './components/GroupDisplay';
import FeedbackModal from './components/FeedbackModal';

const App = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [fileId, setFileId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [dataSummary, setDataSummary] = useState(null);
  const [totalRows, setTotalRows] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);

  const handleUploadSuccess = (data) => {
    setFileId(data.file_id);
    setDataSummary(data.summary);
    setTotalRows(data.total_rows);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleMessage = (message) => {
    if (message.type === 'processing_complete') {
      setDataSummary(`File analyzed successfully. ${message.totalRows} rows found.`);
      setTotalRows(message.totalRows);
    }
  };

  // Auto-open canvas and trigger feedback when groups are created
  React.useEffect(() => {
    if (groups.length > 0) {
      // Open canvas on desktop
      if (window.innerWidth >= 768) {
        setCanvasOpen(true);
      }

      // Trigger feedback if first time (once per user)
      const hasRequestedFeedback = localStorage.getItem('sortify_feedback_requested');
      if (!hasRequestedFeedback) {
        // Small delay to let user see results first
        setTimeout(() => {
          setFeedbackOpen(true);
          localStorage.setItem('sortify_feedback_requested', 'true');
        }, 3000);
      }
    }
  }, [groups]);

  if (showLanding) {
    return (
      <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-primary/30">
        <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <img className="h-8 w-auto" src="/logo.png" alt="SortifyAI" />
              </div>
              <div>
                <button onClick={handleGetStarted} className="px-4 py-2 text-sm font-medium text-brand-dark bg-brand-primary rounded-lg hover:bg-brand-accent transition-colors">Get Started</button>
              </div>
            </div>
          </div>
        </nav>

        <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
          {/* Background Effects */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-brand-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-brand-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
          </div>

          <div className="text-center space-y-8 relative z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-sm font-medium mb-4 opacity-0-init animate-fadeIn">
              <span className="flex h-2 w-2 rounded-full bg-brand-primary mr-2 animate-pulse"></span>
              AI-Powered File Organization
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 opacity-0-init animate-fadeInUp delay-200">
              Organize your chaos with <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-[length:200%_auto] animate-gradient">
                Intelligent Grouping
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0-init animate-fadeInUp delay-400">
              Stop wasting time searching for files. Our advanced AI analyzes, categorizes, and groups your data automatically, turning disorder into structured insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0-init animate-scaleIn delay-600">
              <button
                onClick={handleGetStarted}
                className="group relative w-full sm:w-auto px-8 py-4 bg-brand-primary text-brand-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/50 hover:shadow-2xl hover:scale-110 overflow-hidden animate-glow"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-brand-accent to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative flex items-center gap-2">
                  Start Sorting Now
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left relative z-10">
            {[
              { title: "Smart Classification", desc: "Automatically identifies and tags files based on content, not just filenames.", icon: FolderIcon },
              { title: "Visual Clusters", desc: "View your data in intuitive clusters to spot patterns and outliers instantly.", icon: Squares2X2Icon },
              { title: "Secure Processing", desc: "Enterprise-grade encryption ensures your sensitive data remains private.", icon: ShieldCheckIcon }
            ].map((feature, i) => (
              <div key={i} className={`p-8 rounded-2xl bg-brand-secondary/20 border border-white/5 hover:border-brand-primary/50 transition-all hover:bg-brand-secondary/30 hover:shadow-xl hover:shadow-brand-primary/10 hover:-translate-y-2 group opacity-0-init animate-fadeInUp delay-${(i + 7) * 100}`}>
                <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all group-hover:bg-brand-primary/20">
                  <feature.icon className="w-6 h-6 text-brand-primary group-hover:text-brand-accent transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-primary transition-colors">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-24 pt-8 border-t border-white/10 text-center opacity-0-init animate-fadeIn delay-800 relative z-10">
            <p className="text-sm text-slate-400">
              Developed by <span className="text-brand-primary font-semibold hover:text-brand-accent transition-colors cursor-default">BAAFI O. MARCUS</span>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-primary/30 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-brand-secondary/20 backdrop-blur-xl border border-white/10 rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-brand-secondary/10 border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-40
        md:translate-x-0 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-white/10">
          <img className="h-8 w-auto" src="/logo.png" alt="SortifyAI" />
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              setFileId(null);
              setGroups([]);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-md border border-white/20 hover:bg-brand-secondary/30 transition-colors text-white text-sm text-left"
          >
            <PlusIcon className="w-4 h-4" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="text-xs font-medium text-slate-500 mb-2 px-2">Recent</div>
          {fileId && (
            <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md bg-brand-secondary/30 text-slate-300 text-sm text-left truncate">
              <ChatBubbleLeftIcon className="w-4 h-4 shrink-0" />
              Current Session
            </button>
          )}
        </div>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => {
              setFeedbackOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2 py-3 rounded-md hover:bg-brand-secondary/30 transition-colors text-white text-sm text-left"
          >
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            Give Feedback
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-3 rounded-md hover:bg-brand-secondary/30 transition-colors text-white text-sm text-left">
            <UserCircleIcon className="w-5 h-5" />
            Profile
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-3 rounded-md hover:bg-brand-secondary/30 transition-colors text-white text-sm text-left">
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex h-screen overflow-hidden bg-brand-dark relative">
        {/* Chat Area - Centered */}
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${canvasOpen && groups.length > 0 ? 'md:mr-[400px]' : ''}`}>
          {/* Mobile Canvas Toggle Button */}
          {groups.length > 0 && (
            <button
              onClick={() => setCanvasOpen(!canvasOpen)}
              className="md:hidden fixed bottom-6 right-6 z-30 p-4 bg-brand-primary text-brand-dark rounded-full shadow-2xl"
            >
              <Squares2X2Icon className="w-6 h-6" />
            </button>
          )}

          <div className="flex-1 overflow-hidden relative">
            {!fileId ? (
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            ) : (
              <ChatInterface
                fileId={fileId}
                onGroupData={setGroups}
                onMessage={handleMessage}
                totalRows={totalRows}
              />
            )}
          </div>
        </div>

        {/* Canvas Panel (Group Display) - Right Side */}
        {groups.length > 0 && (
          <div className={`
            fixed md:absolute right-0 top-0 bottom-0 
            w-full md:w-[400px] 
            border-l border-white/10 bg-brand-dark shadow-2xl 
            flex flex-col transition-transform duration-300 z-20
            ${canvasOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-brand-secondary/10">
              <h3 className="font-semibold text-white">Canvas</h3>
              <button
                onClick={() => {
                  setCanvasOpen(false);
                  if (window.innerWidth < 768) {
                    // On mobile, also clear groups when closing
                    // setGroups([]);
                  }
                }}
                className="text-slate-400 hover:text-white"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <GroupDisplay groups={groups} dataSummary={dataSummary} />
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
};

export default App;
