import React from 'react';
import { 
  ArrowRightIcon, 
  SparklesIcon, 
  DocumentChartBarIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  ScaleIcon, 
  ArrowPathIcon, 
  PrinterIcon,
  CheckCircleIcon,
  FolderIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const LandingPage = ({ 
  onGetStarted, 
  onTrySample, 
  serverStatus, 
  onOpenDeveloperApi,
  currentUser,
  onOpenAuth,
  onOpenSavedProjects,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-primary/30">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img className="h-8 w-auto" src="/logo.png" alt="SortifyAI" />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Education Edition
              </span>
            </div>

            <div className="flex items-center gap-3">
              {serverStatus === 'warming' && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Waking server (~30s)...</span>
                </div>
              )}
              {serverStatus === 'ready' && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Server ready</span>
                </div>
              )}

              <button
                onClick={onOpenDeveloperApi}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>Developers & API</span>
              </button>

              {/* Google Sign-in / User Profile */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenSavedProjects}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 transition-colors"
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span>My Projects</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors border border-white/5"
                    title="Sign Out"
                  >
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.94H1.28v3.13C3.28 21.36 7.36 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.32 14.26c-.24-.73-.38-1.5-.38-2.26s.14-1.53.38-2.26V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l4.04-3.13z"/>
                    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.36 0 3.28 2.64 1.28 6.61l4.04 3.13c.94-2.84 3.58-4.97 6.68-4.97z"/>
                  </svg>
                  <span>Sign In</span>
                </button>
              )}

              <button 
                onClick={onGetStarted} 
                className="px-4 py-2 text-sm font-semibold text-brand-dark bg-brand-primary rounded-lg hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20 hover:scale-105"
              >
                Upload Student Data
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Background glow effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-12 left-1/4 w-96 h-96 bg-brand-primary/15 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
          <div className="absolute top-24 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full filter blur-3xl opacity-60"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
        </div>

        <div className="text-center space-y-8 relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-sm font-medium">
            <SparklesIcon className="w-4 h-4 animate-spin text-brand-primary" style={{ animationDuration: '6s' }} />
            <span>AI-Powered Student Allocation & Balanced Grouping</span>
          </div>

          {/* Outcome-focused Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Turn messy student data into <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-cyan-300 to-brand-accent">
              balanced groups.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload your spreadsheet, describe how you want your students grouped, and let SortifyAI do the work.
          </p>

          {/* Dominant Call-to-Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <button
              onClick={onGetStarted}
              className="group relative w-full sm:w-auto px-8 py-4 bg-brand-primary text-brand-dark font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:bg-brand-accent hover:scale-105"
            >
              <span>Upload your student data</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onTrySample}
              className="w-full sm:w-auto px-6 py-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all text-sm font-medium text-slate-200 flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-4 h-4 text-brand-primary" />
              <span>Try with 500 Sample Students</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            “Describe how you want them grouped. SortifyAI handles the rest.”
          </p>

          {/* Visual Concrete Example Card */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium text-slate-300">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                500 students
              </span>
              <span className="text-slate-500">→</span>
              <span className="font-bold text-cyan-300">10 groups</span>
              <span className="text-slate-500">→</span>
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                balanced by gender, score & programme
              </span>
            </div>
          </div>
        </div>

        {/* 4-Step Core Workflow Bar */}
        <div className="mt-20 max-w-4xl mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div className="text-center text-xs uppercase tracking-wider text-slate-400 font-bold mb-6">
            The 4-Step Grouping Workflow
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { step: "1. Upload", desc: ".xlsx, .csv, .pdf supported with data preview", icon: DocumentChartBarIcon },
              { step: "2. Describe", desc: "Natural prompt: '10 groups, balanced gender & score'", icon: SparklesIcon },
              { step: "3. Generate", desc: "Instant group distribution with inline analytics", icon: ScaleIcon },
              { step: "4. Review & Export", desc: "Drag-and-drop tuning + print-ready rosters", icon: PrinterIcon }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-brand-secondary/10 border border-white/5 flex flex-col items-center">
                <item.icon className="w-6 h-6 text-brand-primary mb-2" />
                <div className="font-bold text-white text-sm">{item.step}</div>
                <div className="text-xs text-slate-400 mt-1 leading-snug">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Value Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-brand-secondary/15 border border-white/5 hover:border-brand-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
              <ScaleIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Equality</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Eliminate teacher bias and hours of manual spreadsheet shuffling. Groups are automatically balanced by gender, academic abilities, and subject tracks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-secondary/15 border border-white/5 hover:border-brand-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
              <ArrowPathIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Interactive Fine-Tuning</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drag and drop students between groups with instant recalculation of group averages and gender balance, or use follow-up AI prompts to re-optimize.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-secondary/15 border border-white/5 hover:border-brand-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
              <PrinterIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">School-Ready Exports</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Download clean Excel/CSV spreadsheets or generate ready-to-print rosters formatted specifically for school notice boards and teachers.
            </p>
          </div>
        </div>

        {/* Point 20: AI-Powered Allocation & Grouping Vision */}
        <div className="mt-28 space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-wider font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full">
              The Bigger Vision (Point 20)
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              One Allocation Engine. Endless Domains.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              SortifyAI is not just an Excel tool—it is a constraint-based AI allocation platform engineered to distribute people, tasks, and spaces fairly across any organization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Student & Cohort Grouping",
                tag: "Live Today",
                icon: "🎓",
                desc: "Balanced study pods, mixed-ability classes, lab benches, and project teams."
              },
              {
                title: "Exam Seating & Hall Allocation",
                tag: "Universal Engine",
                icon: "🪑",
                desc: "Interleave classes and streams across halls to eliminate cheating while respecting room capacities."
              },
              {
                title: "House & Dormitory Room Allocation",
                tag: "Universal Engine",
                icon: "🏠",
                desc: "Assign students to sports houses (Aggrey, Fraser, etc.) or dorm rooms with equal athletic and gender balance."
              },
              {
                title: "Project & Hackathon Teams",
                tag: "Universal Engine",
                icon: "👥",
                desc: "Pair complementary skills (frontend, backend, design, business) into high-performing teams."
              },
              {
                title: "Staff Scheduling & Duty Rosters",
                tag: "Universal Engine",
                icon: "💼",
                desc: "Fairly distribute weekend shifts, prep supervision, and invigilation duties without fatigue."
              },
              {
                title: "Workshop & Event Seating",
                tag: "Universal Engine",
                icon: "🎟️",
                desc: "Optimize networking dinner tables to maximize cross-industry diversity and attendee connections."
              }
            ].map((uc, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl bg-brand-secondary/10 border border-white/5 hover:border-brand-primary/30 hover:bg-brand-secondary/20 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{uc.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 group-hover:text-cyan-300 transition-colors">
                      {uc.tag}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                    {uc.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {uc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Trust Assurance */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-400">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Private & Secure:</strong> Student records are processed in isolated sessions and are never used to train public AI models.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-slate-500">
            SortifyAI • Intelligent Allocation & Optimization Platform • Developed by{' '}
            <a 
              href="https://personal-portfolio-three-woad-31.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-primary font-semibold hover:underline"
            >
              BAAFI O. MARCUS
            </a>
            {' '}•{' '}
            <button 
              onClick={onOpenDeveloperApi}
              className="text-slate-400 hover:text-cyan-300 underline font-medium"
            >
              API Docs & SDKs
            </button>
            {' '}•{' '}
            <a 
              href="/privacy.html"
              className="text-slate-400 hover:text-cyan-300 underline font-medium"
            >
              Privacy Policy
            </a>
            {' '}•{' '}
            <a 
              href="/terms.html"
              className="text-slate-400 hover:text-cyan-300 underline font-medium"
            >
              Terms of Service
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
