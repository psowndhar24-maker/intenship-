import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Building2,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  KeyRound
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole: UserRole) => {
    clearError();
    setRole(selectedRole);
    setFieldErrors({});
  };

  const handleQuickFill = (targetRole: UserRole) => {
    clearError();
    setRole(targetRole);
    if (targetRole === 'STUDENT') {
      setUsername('student');
      setPassword('admin@123');
    } else if (targetRole === 'COMPANY') {
      setUsername('company');
      setPassword('admin@123');
    } else if (targetRole === 'ADMIN') {
      setUsername('admin');
      setPassword('admin@123');
    }
    setFieldErrors({});
    setShowDemoModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errs.username = 'Username or campus email is required';
    }
    if (!password) {
      errs.password = 'Password is required';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    try {
      const result = await login({
        username: username.trim(),
        password,
        role,
      });

      if (result.success) {
        if (result.role === 'STUDENT') {
          navigate('/dashboard/student');
        } else if (result.role === 'COMPANY') {
          navigate('/dashboard/company');
        } else if (result.role === 'ADMIN') {
          navigate('/dashboard/admin');
        } else {
          navigate('/');
        }
      }
    } catch {
      // Handled via useAuth error state
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-between relative overflow-x-hidden select-none font-sans">
      {/* 1. Full-Screen Immersive Modern Corporate Architecture Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/internhub-login-bg.webp"
          alt="Modern Corporate Innovation Campus"
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
        />
        {/* Cinematic dark vignette layers: keeps the corporate architectural view clear while providing optimal text contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(6,9,17,0.55)_55%,_rgba(6,9,17,0.92)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060911]/95 via-transparent to-[#060911]/70" />
      </div>

      {/* 2. Top Minimalist Header */}
      <header className="relative z-10 w-full px-6 lg:px-12 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/70 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/60 transition-colors shadow-sm">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-white text-base">INTERNHUB</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 text-xs text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide">Gateway Active</span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoModal(!showDemoModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Demo Logins</span>
          </button>
        </div>
      </header>

      {/* 3. Centered Authentication Panel */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] relative">
          
          {/* Subtle Ambient Glow Behind Card */}
          <div className="absolute -inset-1.5 bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent rounded-3xl blur-xl pointer-events-none" />

          {/* Premium Translucent Dark Surface */}
          <div className="relative bg-[#0a0f1c]/80 backdrop-blur-2xl border border-slate-700/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-6 sm:p-8">
            
            {/* Integrated Branding Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/40 mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                INTERNHUB
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Internship Intelligence &amp; Career Discovery Platform
              </p>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div
                id="auth-error-alert"
                className="mb-5 p-3 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-200 flex items-start gap-2.5 text-xs leading-relaxed"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-rose-300">
                    {error.toLowerCase().includes('connect') || error.toLowerCase().includes('server')
                      ? 'Connection Error: '
                      : 'Sign In Failed: '}
                  </span>
                  {error}
                </div>
              </div>
            )}

            {/* Role Selector Tabs */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Access Level
              </label>
              <div
                role="tablist"
                aria-label="User Access Role"
                className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-role-student"
                  aria-selected={role === 'STUDENT'}
                  onClick={() => handleRoleSelect('STUDENT')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    role === 'STUDENT'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-role-company"
                  aria-selected={role === 'COMPANY'}
                  onClick={() => handleRoleSelect('COMPANY')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    role === 'COMPANY'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Company</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-role-admin"
                  aria-selected={role === 'ADMIN'}
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    role === 'ADMIN'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Username Input Field */}
              <div>
                <label
                  htmlFor="input-username"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Username / ID
                </label>
                <div className={`relative flex items-center bg-slate-950/70 border ${
                  fieldErrors.username
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30'
                    : 'border-slate-800 focus-within:border-cyan-500/70 focus-within:ring-2 focus-within:ring-cyan-500/15'
                } rounded-xl transition-all`}>
                  <div className="pl-3.5 pr-2 text-slate-400 pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="input-username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUsername(val);
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: undefined }));
                      }
                      const lower = val.trim().toLowerCase();
                      if (lower === 'admin' || lower === 'dean.placement@internhub.edu') {
                        setRole('ADMIN');
                      } else if (lower === 'company' || lower === 'talent@nexusdynamics.tech') {
                        setRole('COMPANY');
                      } else if (lower === 'student' || lower === 'student@campus.internhub.edu') {
                        setRole('STUDENT');
                      }
                    }}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="w-full bg-transparent py-2.5 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.username}</p>
                )}
              </div>

              {/* Password Input Field with Visibility Toggle */}
              <div>
                <label
                  htmlFor="input-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className={`relative flex items-center bg-slate-950/70 border ${
                  fieldErrors.password
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30'
                    : 'border-slate-800 focus-within:border-cyan-500/70 focus-within:ring-2 focus-within:ring-cyan-500/15'
                } rounded-xl transition-all`}>
                  <div className="pl-3.5 pr-2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-transparent py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.password}</p>
                )}
              </div>

              {/* Distinctive Primary Sign In Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 active:from-cyan-700 active:to-indigo-700 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/40 hover:shadow-cyan-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper Drawer (discreet & professional) */}
            {showDemoModal && (
              <div className="mt-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="font-semibold text-slate-300">Quick-Fill Demo Access</span>
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(false)}
                    className="text-slate-500 hover:text-slate-300 text-[11px]"
                  >
                    Close &times;
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('STUDENT')}
                    className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-cyan-300 font-medium">Student</div>
                    <div className="text-[10px] text-slate-400">student</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('COMPANY')}
                    className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-emerald-300 font-medium">Company</div>
                    <div className="text-[10px] text-slate-400">company</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ADMIN')}
                    className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-blue-300 font-medium">Admin</div>
                    <div className="text-[10px] text-slate-400">admin</div>
                  </button>
                </div>
              </div>
            )}

            {/* Small Technical System Status Area */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">System Status</div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-medium font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Database</div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-medium font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>READY</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Secure Session</div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-medium font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>ENABLED</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 4. Minimal Bottom Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-400">
        <p>
          &copy; INTERNHUB &bull; Internship Intelligence &amp; Career Discovery Platform
        </p>
      </footer>
    </div>
  );
};
