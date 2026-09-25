import React from 'react';
import { 
  ArrowRightIcon, 
  DocumentChartBarIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  ScaleIcon, 
  ArrowPathIcon, 
  PrinterIcon,
  FolderIcon,
  UserCircleIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  CalendarDaysIcon,
  TicketIcon,
  AdjustmentsHorizontalIcon
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
    <div className="min-h-screen bg-brand-dark text-slate-100 font-sans selection:bg-brand-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/95 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img className="h-8 w-auto" src="/logo.png" alt="SortifyAI" />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Education Edition
              </span>
            </div>

            <div className="flex items-center gap-3">
              {serverStatus === 'warming' && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <span>Waking server (~30s)...</span>
                </div>
              )}
              {serverStatus === 'ready' && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Server ready</span>
                </div>
              )}

              <button
                onClick={onOpenDeveloperApi}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-standard"
              >
                <span>Documentation</span>
              </button>

              {/* User Authentication / Profile */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenSavedProjects}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-standard"
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span>Projects</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-standard border border-slate-700"
                    aria-label="Sign out of account"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-standard"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
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
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-brand-primary rounded hover:bg-brand-accent transition-standard hover-subtle"
              >
                Upload Roster
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Metadata Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-700 bg-slate-800/80 text-slate-300 text-xs font-medium">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-brand-primary" />
            <span>Algorithmic Cohort Balancing Engine</span>
          </div>

          {/* Heading (Strict 24px token, 600 weight, 1.2 line height) */}
          <h1 className="text-2xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
            Balanced student groups from any roster
          </h1>

          {/* Subtitle (14px token, 400 weight, 1.5 line height) */}
          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload an Excel, CSV, or PDF roster. Define target group count, gender balance, and academic performance constraints. Generate verified balanced cohorts in under 2 seconds.
          </p>

          {/* Functional Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-sm rounded transition-standard hover-subtle flex items-center justify-center gap-2"
            >
              <span>Upload Student Roster</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onTrySample}
              className="w-full sm:w-auto px-6 py-3 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-standard hover-subtle flex items-center justify-center gap-2"
            >
              <span>Load Sample Data (500 Records)</span>
            </button>
          </div>

          {/* Concrete Technical Metrics Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="p-3.5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs font-medium text-slate-300">
              <span className="font-semibold text-white">Benchmark:</span>
              <span>500 records</span>
              <span className="text-slate-600">→</span>
              <span className="text-cyan-400 font-mono">10 cohorts in 1.4s</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                99.8% balance parity
              </span>
            </div>
          </div>
        </div>

        {/* 4-Step Core Workflow Bar */}
        <div className="mt-16 max-w-4xl mx-auto p-6 rounded-md bg-slate-900/80 border border-slate-800">
          <div className="text-center text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
            Standard 4-Step Allocation Workflow
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            {[
              { step: "1. Upload", desc: "Ingest .xlsx, .csv, or .pdf files with schema validation", icon: DocumentChartBarIcon },
              { step: "2. Configure", desc: "Specify group count, gender balance, and track criteria", icon: AdjustmentsHorizontalIcon },
              { step: "3. Distribute", desc: "Deterministic multi-attribute balancing with variance metrics", icon: ScaleIcon },
              { step: "4. Export", desc: "Download structured spreadsheets or print-ready rosters", icon: PrinterIcon }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded bg-slate-800/50 border border-slate-800 flex flex-col items-center">
                <item.icon className="w-5 h-5 text-brand-primary mb-2" />
                <div className="font-semibold text-white text-sm">{item.step}</div>
                <div className="text-xs text-slate-400 mt-1 leading-normal">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Capabilities */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-md bg-slate-900/60 border border-slate-800 hover-subtle">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary mb-4">
              <ScaleIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">Attribute Parity</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Calculates uniform distribution across binary attributes (such as gender) and continuous numeric scales (such as academic exam scores).
            </p>
          </div>

          <div className="p-6 rounded-md bg-slate-900/60 border border-slate-800 hover-subtle">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary mb-4">
              <ArrowPathIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">Manual Reassignment</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Reassign individual students between groups with real-time recalculation of cohort averages, gender counts, and variance deltas.
            </p>
          </div>

          <div className="p-6 rounded-md bg-slate-900/60 border border-slate-800 hover-subtle">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary mb-4">
              <PrinterIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">Standard Export Formats</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Generate structured Excel workbooks, CSV files, or formatted print-ready PDF rosters suited for physical classroom distribution.
            </p>
          </div>
        </div>

        {/* Multi-Domain Allocation Scenarios */}
        <div className="mt-20 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">
              Universal Allocation Engine
            </span>
            <h2 className="text-xl font-semibold text-white">
              Domain Allocation Scenarios
            </h2>
            <p className="text-slate-400 text-xs leading-normal">
              SortifyAI provides a constraint-based allocation engine configured to distribute participants and resources across educational and institutional operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Student & Cohort Grouping",
                tag: "Production",
                icon: AcademicCapIcon,
                desc: "Balanced study pods, mixed-ability classes, lab benches, and project teams."
              },
              {
                title: "Exam Seating & Hall Allocation",
                tag: "Supported",
                icon: BuildingOffice2Icon,
                desc: "Interleave programmes across halls to prevent adjacent peers while enforcing room limits."
              },
              {
                title: "House & Dormitory Allocation",
                tag: "Supported",
                icon: HomeModernIcon,
                desc: "Distribute students into houses with equal headcount, gender parity, and athletic score balance."
              },
              {
                title: "Project & Team Formation",
                tag: "Supported",
                icon: UserGroupIcon,
                desc: "Group complementary skill tracks (frontend, backend, design, operations) into uniform pods."
              },
              {
                title: "Staff Scheduling & Duty Rosters",
                tag: "Supported",
                icon: CalendarDaysIcon,
                desc: "Distribute weekend shifts, invigilation duties, and supervisory sessions without scheduling fatigue."
              },
              {
                title: "Workshop & Event Seating",
                tag: "Supported",
                icon: TicketIcon,
                desc: "Organize networking tables to maximize organization diversity and peer distribution."
              }
            ].map((uc, i) => (
              <div 
                key={i} 
                className="p-5 rounded-md bg-slate-900/60 border border-slate-800 hover-subtle flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <uc.icon className="w-5 h-5 text-brand-primary" />
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {uc.tag}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">
                    {uc.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    {uc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Privacy & Security Notice */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Private and Secure:</strong> Student records are processed in isolated memory sessions and are never used to train public models.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 space-x-2">
            <span>SortifyAI • Educational Allocation Platform</span>
            <span>•</span>
            <span>Lead Engineer:</span>
            <a 
              href="https://personal-portfolio-three-woad-31.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-primary hover:underline font-medium"
            >
              Baafi O. Marcus
            </a>
            <span>•</span>
            <button 
              onClick={onOpenDeveloperApi}
              className="text-slate-300 hover:text-white underline font-medium"
            >
              Documentation
            </button>
            <span>•</span>
            <a 
              href="/privacy.html"
              className="text-slate-300 hover:text-white underline font-medium"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms.html"
              className="text-slate-300 hover:text-white underline font-medium"
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
