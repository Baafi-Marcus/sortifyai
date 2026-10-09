import React from 'react';
import { motion } from 'framer-motion';
import { GlassGeometryBackground } from './ui/GlassGeometryBackground';
import { 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  Scale, 
  RefreshCw, 
  Printer,
  FolderOpen,
  UserCircle,
  GraduationCap,
  Building2,
  Home,
  CalendarDays,
  Ticket,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '../utils/cn';

const FeatureCard = ({ icon: Icon, title, description, className }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/60 shadow-xl overflow-hidden relative group", className)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

const UseCaseCard = ({ title, tag, icon: Icon, desc }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="p-6 rounded-2xl bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 flex flex-col justify-between hover:bg-slate-900/50 transition-colors"
  >
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 uppercase tracking-wider">
          {tag}
        </span>
      </div>
      <h4 className="font-semibold text-white text-base">
        {title}
      </h4>
      <p className="text-sm text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  </motion.div>
);

const LandingPage = ({ 
  onGetStarted, 
  serverStatus, 
  currentUser,
  onOpenAuth,
  onOpenSavedProjects,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden">
      {/* 3D Background */}
      <GlassGeometryBackground />

      {/* Dark Contrast Overlay for readability */}
      <div className="fixed inset-0 bg-slate-950/30 pointer-events-none z-[1]" />

      {/* Ambient Gradient Glow (Moved to relative so it sits properly) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none z-[1]" />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img className="h-8 w-auto" src="/logo.png" alt="SortifyAI" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline-block tracking-wider uppercase">
                Education Edition
              </span>
            </div>

            <div className="flex items-center gap-4">
              {serverStatus === 'warming' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Waking server...</span>
                </div>
              )}
              {serverStatus === 'ready' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  <span>System ready</span>
                </div>
              )}

              {currentUser ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={onOpenSavedProjects}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs sm:text-sm font-medium hover:bg-cyan-500/20 transition-all"
                  >
                    <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Projects</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm transition-all border border-slate-700/50"
                    title="Sign Out"
                  >
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-2 ring-slate-700" />
                    ) : (
                      <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    )}
                    <span className="hidden sm:inline font-medium">{currentUser.name.split(' ')[0]}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-slate-700/80 bg-slate-800/50 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all backdrop-blur-sm"
                >
                  <UserCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button 
                onClick={onGetStarted} 
                className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
              >
                Upload Roster
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-4xl mx-auto pt-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium backdrop-blur-md"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Algorithmic Cohort Balancing Engine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
          >
            Balanced student groups <br/> from any roster, instantly.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base lg:text-lg text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
          >
            Upload an Excel, CSV, or PDF roster. Define target group count, gender balance, and academic performance constraints. Generate verified balanced cohorts in under 2 seconds.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 group"
            >
              <span>{currentUser ? "Upload Roster (New Project)" : "Get Started Free"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-base rounded-xl transition-all border border-slate-700/50 backdrop-blur-md"
              >
                Login to Account
              </button>
            ) : (
              <button
                onClick={onOpenSavedProjects}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-base rounded-xl transition-all border border-slate-700/50 backdrop-blur-md flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Open Saved Projects</span>
              </button>
            )}
          </motion.div>

          {/* Benchmark Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="pt-10 max-w-2xl mx-auto"
          >
            <div className="p-3 sm:p-4 rounded-xl bg-slate-900/50 backdrop-blur-md border border-slate-800/80 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-slate-400 shadow-2xl">
              <span className="font-semibold text-slate-200">System Benchmark:</span>
              <span className="flex items-center gap-1 sm:gap-2"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500"/> 500 records</span>
              <span className="text-slate-600">→</span>
              <span className="text-cyan-400 font-mono">10 cohorts in 1.4s</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-emerald-500/20">
                99.8% balance parity
              </span>
            </div>
          </motion.div>
        </div>

        {/* Feature Bento Grid */}
        <div className="mt-24 sm:mt-32">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Engineered for Precision</h2>
            <p className="text-sm sm:text-base text-slate-400">Advanced features to handle complex cohort configurations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Scale}
              title="Attribute Parity"
              description="Calculates uniform distribution across binary attributes (such as gender) and continuous numeric scales (such as academic exam scores) flawlessly."
              className="md:col-span-2 md:row-span-2 p-8"
            />
            <FeatureCard 
              icon={RefreshCw}
              title="Manual Reassignment"
              description="Reassign individual students between groups with real-time recalculation of cohort averages and variance deltas."
            />
            <FeatureCard 
              icon={Printer}
              title="Export Anywhere"
              description="Generate structured Excel workbooks, CSV files, or formatted print-ready PDF rosters."
            />
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-24 sm:mt-32 space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Built for Every Domain
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed px-4">
              SortifyAI provides a constraint-based allocation engine configured to distribute participants and resources across educational and institutional operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <UseCaseCard
              title="Student & Cohort Grouping"
              tag="Production"
              icon={GraduationCap}
              desc="Balanced study pods, mixed-ability classes, lab benches, and project teams."
            />
            <UseCaseCard
              title="Exam Seating Allocation"
              tag="Supported"
              icon={Building2}
              desc="Interleave programmes across halls to prevent adjacent peers while enforcing room limits."
            />
            <UseCaseCard
              title="House & Dormitory"
              tag="Supported"
              icon={Home}
              desc="Distribute students into houses with equal headcount, gender parity, and athletic scores."
            />
            <UseCaseCard
              title="Project & Team Formation"
              tag="Supported"
              icon={Users}
              desc="Group complementary skill tracks (frontend, backend, design) into uniform pods."
            />
            <UseCaseCard
              title="Staff Scheduling"
              tag="Supported"
              icon={CalendarDays}
              desc="Distribute weekend shifts, invigilation duties, and supervisory sessions seamlessly."
            />
            <UseCaseCard
              title="Workshop Seating"
              tag="Supported"
              icon={Ticket}
              desc="Organize networking tables to maximize organization diversity and peer distribution."
            />
          </div>
        </div>

        {/* Security Notice & CTA */}
        <div className="mt-24 sm:mt-32 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 shadow-lg mb-10 sm:mb-12">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm text-slate-300">
              <strong className="text-white">Private and Secure:</strong> Student records are processed in isolated sessions and never used to train public models.
            </span>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-cyan-900/20 to-slate-900/50 border border-cyan-500/20 backdrop-blur-lg relative overflow-hidden mx-2 sm:mx-0">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-5 sm:mb-6 relative z-10">Ready to balance your next cohort?</h2>
            <button
              onClick={onGetStarted}
              className="relative z-10 px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-950 font-bold text-sm sm:text-base rounded-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 mx-auto w-full sm:w-auto"
            >
              <span>Launch App Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-slate-800/60 text-center">
          <p className="text-sm text-slate-500 flex flex-wrap justify-center items-center gap-4">
            <span>SortifyAI &copy; {new Date().getFullYear()}</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Lead Engineer: <a href="https://personal-portfolio-three-woad-31.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Baafi O. Marcus</a></span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a href="/privacy.html" className="hover:text-slate-300 transition-colors">Privacy</a>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a href="/terms.html" className="hover:text-slate-300 transition-colors">Terms</a>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
