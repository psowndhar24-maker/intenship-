import React, { ReactNode } from 'react';
import { TechHeader } from '../components/TechHeader';
import { useAuth } from '../hooks/useAuth';
import { 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Server, 
  HardDrive, 
  Lock,
  Clock, 
  FileText, 
  Sliders,
  Bookmark,
  User,
  Users,
  GraduationCap
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle: string;
  roleBadgeText: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle,
  roleBadgeText,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Role-specific primary navigation items
  const getNavLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'STUDENT':
        return [
          { name: 'Student Overview', path: '/dashboard/student', icon: Briefcase, active: location.pathname === '/dashboard/student' },
          { name: 'My Applications', path: '/dashboard/student/applications', icon: FileText, active: location.pathname === '/dashboard/student/applications' },
          { name: 'Saved Internships', path: '/dashboard/student/saved', icon: Bookmark, active: location.pathname === '/dashboard/student/saved' },
          { name: 'Student Profile', path: '/dashboard/student/profile', icon: User, active: location.pathname === '/dashboard/student/profile' },
        ];
      case 'COMPANY':
        return [
          { name: 'Corporate Portal', path: '/dashboard/company', icon: Building2, active: location.pathname === '/dashboard/company' },
          { name: 'My Postings', path: '/company/internships', icon: Briefcase, active: location.pathname === '/company/internships' },
          { name: 'Applications', path: '/company/applications', icon: Users, active: location.pathname === '/company/applications' },
          { name: 'Company Profile', path: '/company/profile', icon: Building2, active: location.pathname === '/company/profile' },
        ];
      case 'ADMIN':
        return [
          { name: 'Governance Center', path: '/dashboard/admin', icon: ShieldCheck, active: location.pathname === '/dashboard/admin' },
          { name: 'Pending Queue', path: '/admin/internships/pending', icon: Clock, active: location.pathname === '/admin/internships/pending' },
          { name: 'Internship Directory', path: '/admin/internships', icon: Sliders, active: location.pathname.startsWith('/admin/internships') && location.pathname !== '/admin/internships/pending' },
          { name: 'Partner Companies', path: '/admin/companies', icon: Building2, active: location.pathname.startsWith('/admin/companies') },
          { name: 'Student Directory', path: '/admin/students', icon: GraduationCap, active: location.pathname === '/admin/students' },
          { name: 'Applications Queue', path: '/admin/applications', icon: FileText, active: location.pathname === '/admin/applications' },
          { name: 'Audit Trail', path: '/admin/audit-logs', icon: Activity, active: location.pathname === '/admin/audit-logs' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Full-Screen Immersive Modern Campus & Innovation Hub Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/internhub-dashboard-bg.webp"
          alt="Innovation Hub Background"
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.10]"
        />
        {/* Subtle vignette so edges blend smoothly and center architectural campus is prominently visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a11] via-[#070a11]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a11]/75 via-transparent to-[#070a11]/85" />
        <div className="absolute inset-0 bg-[#070a11]/25 backdrop-blur-[0.5px]" />
        {/* Subtle atmospheric accents */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary Tech Header */}
      <div className="relative z-20">
        <TechHeader systemTitle={`DASHBOARD // ${roleBadgeText}`} />
      </div>

      {/* Main Chassis Body */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Left Technical Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          {/* Identity Card */}
          <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                DIRECTORY NODE
              </span>
            </div>
            
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>IDENTITY:</span>
                <span className="text-slate-200 font-semibold">{user?.username}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ROLE:</span>
                <span className="text-cyan-400">{user?.role}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SEC_ID:</span>
                <span className="text-slate-300">{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-3 rounded-xl shadow-lg">
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">
              INTERFACE MODULES
            </div>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono text-xs transition-colors ${
                      item.active
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/80 font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Operational Status Box */}
          <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl shadow-lg space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>SUBSYSTEM READINESS</span>
            </div>
            <div className="space-y-1 text-slate-400 text-[10px]">
              <div className="flex justify-between">
                <span>API ENGINE:</span>
                <span className="text-emerald-400">OPERATIONAL</span>
              </div>
              <div className="flex justify-between">
                <span>POSTGRES CONNECTOR:</span>
                <span className="text-blue-400">INITIALIZED</span>
              </div>
              <div className="flex justify-between">
                <span>AUTH GUARD:</span>
                <span className="text-cyan-400">ENFORCED</span>
              </div>
              <div className="flex justify-between">
                <span>PLATFORM TIER:</span>
                <span className="text-slate-300">COLLEGE DEMO</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header Title Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider mb-1">
                <span>CONTR_NODE</span>
                <span>/</span>
                <span>{user?.role}</span>
                <span>/</span>
                <span className="text-slate-400">{pageTitle}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-sans text-slate-100 tracking-tight">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg font-mono text-[10px] text-slate-300 shadow-sm backdrop-blur-sm">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>ACCESS RESTRICTED: {user?.role} ONLY</span>
              </span>
            </div>
          </div>

          {/* Main Content Children */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>

      {/* Technical Footer Status Bar */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md py-2.5 px-4 font-mono text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM STATUS: ONLINE
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <HardDrive className="w-3 h-3" />
              DATABASE: READY
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Server className="w-3 h-3" />
              API STATUS: READY
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              SESSION: AUTHENTICATED
            </span>
          </div>

          <div className="text-slate-400">
            INTERNHUB v1.0.0-FND // COLLEGE EDITION
          </div>
        </div>
      </footer>
    </div>
  );
};
