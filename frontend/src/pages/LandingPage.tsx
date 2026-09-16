import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { AuthService } from '../services/auth.service';
import { HealthStatusResponse } from '../types/api';
import { 
  Terminal, 
  Shield, 
  ArrowRight, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  HardDrive, 
  Server,
  Lock,
  Cpu
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);

  useEffect(() => {
    AuthService.checkHealth()
      .then((res) => setHealth(res))
      .catch(() => {});
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'STUDENT':
        return '/dashboard/student';
      case 'COMPANY':
        return '/dashboard/company';
      case 'ADMIN':
        return '/dashboard/admin';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Graphic Asset */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/internhub-bg.svg')` }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#070a11]/80 via-[#070a11]/70 to-[#070a11] z-0" />

      {/* Primary Header */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-base font-bold tracking-wider text-slate-100 uppercase">
              INTERNHUB
            </span>
            <span className="hidden sm:inline-block font-mono text-xs text-slate-400 ml-2">
              // CAREER INTELLIGENCE &amp; DISCOVERY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <StatusBadge label="SYSTEM: ONLINE" variant="green" pulse />
            <StatusBadge label="PG: INITIALIZED" variant="blue" />
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate(getDashboardPath())}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-950/70 border border-cyan-500/60 text-cyan-300 font-mono text-xs font-semibold hover:bg-cyan-900/60 transition-colors cursor-pointer"
            >
              <span>RETURN TO CONSOLE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold tracking-wider transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ACCESS PORTAL</span>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 py-12 md:py-16 flex-1 flex flex-col justify-center">
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-slate-900 border border-slate-700/80 font-mono text-xs text-cyan-400 tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>COLLEGE INTERNSHIP INTELLIGENCE ARCHITECTURE // FOUNDATION TIER</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100 font-sans leading-tight">
            High-Performance Career Discovery &amp; Placement Operations
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-sans">
            A unified, role-governed platform connecting undergraduate talent, accredited industry partners, and collegiate placement directorates with institutional security and precision.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              <span>LAUNCH ACCESS GATEWAY</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b0f19] border border-slate-700 hover:border-slate-500 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-sm transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>INSPECT /api/health</span>
            </a>
          </div>
        </div>

        {/* 3 Role Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {/* Student Node */}
          <div className="bg-[#0b0f19]/90 border border-slate-800 p-5 rounded-sm relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded bg-cyan-950/50 border border-cyan-800/60 text-cyan-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <StatusBadge label="STUDENT" variant="cyan" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Undergraduate Talent
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Explore accredited campus listings, submit verified applications, and monitor candidacy queues.
            </p>
            <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div>USER: <span className="text-slate-200">student</span></div>
              <div>PASS: <span className="text-slate-200">admin@123</span></div>
              <div>ROUTE: <span className="text-cyan-400">/dashboard/student</span></div>
            </div>
          </div>

          {/* Company Node */}
          <div className="bg-[#0b0f19]/90 border border-slate-800 p-5 rounded-sm relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded bg-emerald-950/50 border border-emerald-800/60 text-emerald-400">
                <Building2 className="w-5 h-5" />
              </div>
              <StatusBadge label="COMPANY" variant="green" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Corporate Partner
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Post verified technical roles, review pre-qualified candidates, and coordinate with campus recruiters.
            </p>
            <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div>USER: <span className="text-slate-200">company</span></div>
              <div>PASS: <span className="text-slate-200">admin@123</span></div>
              <div>ROUTE: <span className="text-emerald-400">/dashboard/company</span></div>
            </div>
          </div>

          {/* Admin Node */}
          <div className="bg-[#0b0f19]/90 border border-slate-800 p-5 rounded-sm relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded bg-amber-950/50 border border-amber-800/60 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <StatusBadge label="ADMIN" variant="amber" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Placement Directorate
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Campus placement governance, database telemetry monitoring, policy compliance, and audit logging.
            </p>
            <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div>USER: <span className="text-slate-200">admin</span></div>
              <div>PASS: <span className="text-slate-200">admin@123</span></div>
              <div>ROUTE: <span className="text-amber-400">/dashboard/admin</span></div>
            </div>
          </div>
        </div>

        {/* Architecture Spec Bar */}
        <div className="mt-8 bg-slate-900/60 border border-slate-800 p-3 rounded-sm flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>DATABASE ARCHITECTURE: POSTGRESQL MODULE LOADED</span>
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPRESS API HEALTH: {health?.status === 'ok' ? 'ONLINE (STATUS 200)' : 'INITIALIZING'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>AUTH: RBAC WITH JWT TOKENS</span>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#090d16]/95 py-2.5 px-6 font-mono text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-emerald-400">SYSTEM STATUS: ONLINE</span>
          <span className="text-slate-600">|</span>
          <span className="text-blue-400">DATABASE: READY</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">API STATUS: READY</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">SESSION: ANONYMOUS</span>
        </div>
        <div>
          <span>PORT: 3000 // 0.0.0.0</span>
        </div>
      </footer>
    </div>
  );
};
