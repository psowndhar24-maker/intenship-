import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { LogOut, Terminal, Shield, User as UserIcon } from 'lucide-react';

interface TechHeaderProps {
  systemTitle?: string;
  activePath?: string;
}

export const TechHeader: React.FC<TechHeaderProps> = ({ systemTitle = 'SYSTEM CONSOLE' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'STUDENT':
        return 'cyan';
      case 'COMPANY':
        return 'green';
      case 'ADMIN':
        return 'amber';
      default:
        return 'blue';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
                INTERNHUB
              </span>
              <span className="font-mono text-[10px] text-slate-500">//</span>
              <span className="font-mono text-[11px] text-cyan-400 tracking-wider hidden sm:inline-block">
                CAREER DISCOVERY
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 tracking-wider">
              {systemTitle}
            </div>
          </div>
        </div>

        {/* Telemetry Status Pips */}
        <div className="hidden md:flex items-center gap-2">
          <StatusBadge label="API: READY" variant="cyan" pulse />
          <StatusBadge label="DB: READY" variant="blue" />
          <StatusBadge label="AUTH: SECURE" variant="green" />
        </div>

        {/* User Session & Logout */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-mono text-xs font-semibold text-slate-200">
                  {user.displayName}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {user.department || user.companyName || user.email}
                </span>
              </div>

              <StatusBadge
                label={`ROLE: ${user.role}`}
                variant={getRoleVariant(user.role)}
              />

              <NotificationBell />

              <button
                id="btn-logout"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 hover:border-rose-500/60 bg-slate-900/80 hover:bg-rose-950/30 text-slate-300 hover:text-rose-400 font-mono text-xs transition-colors cursor-pointer"
                title="Terminate Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-login"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/50 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-mono text-xs font-medium tracking-wider cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ACCESS PORTAL</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
