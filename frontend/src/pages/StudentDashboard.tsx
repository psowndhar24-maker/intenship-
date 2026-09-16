import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { InternshipCard } from '../components/InternshipCard';
import { InternshipModal } from '../components/InternshipModal';
import { StudentProfileForm } from '../components/StudentProfileForm';
import { ApplicationDetailModal } from '../components/ApplicationDetailModal';
import { useAuth } from '../hooks/useAuth';
import { InternshipService } from '../services/internshipService';
import { ApplicationService } from '../services/applicationService';
import { StudentService } from '../services/studentService';
import { 
  Internship, 
  StudentStats, 
  Application, 
  SavedInternshipItem, 
  InternshipFilters,
  StudentProfile
} from '../types/internship';
import { 
  Briefcase, 
  Search, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  FileText, 
  RotateCcw,
  SlidersHorizontal,
  User,
  GraduationCap,
  Save,
  Mail,
  Phone,
  FileCode,
  ExternalLink,
  X,
  FileCheck,
  Eye,
  Calendar
} from 'lucide-react';

interface StudentDashboardProps {
  initialTab?: 'EXPLORE' | 'APPLICATIONS' | 'SAVED' | 'PROFILE';
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ initialTab = 'EXPLORE' }) => {
  const { user } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'APPLICATIONS' | 'SAVED' | 'PROFILE'>(initialTab);

  // Real Database Statistics
  const [stats, setStats] = useState<StudentStats>({
    totalApplications: 0,
    savedInternships: 0,
    pendingApplications: 0,
    selectedApplications: 0,
  });

  // Data states
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedItems, setSavedItems] = useState<SavedInternshipItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [appFilterStatus, setAppFilterStatus] = useState<string>('ALL');

  // Search & Filter State
  const [filters, setFilters] = useState<InternshipFilters>({
    search: '',
    category: 'ALL',
    location: '',
    workMode: 'ALL',
    isPaid: 'ALL',
    experienceLevel: 'ALL',
    sortBy: 'latest',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Application Detail Modal State
  const [selectedAppIdForDetail, setSelectedAppIdForDetail] = useState<string | null>(null);
  const [isAppDetailModalOpen, setIsAppDetailModalOpen] = useState(false);

  // Custom Withdraw Modal State
  const [withdrawModal, setWithdrawModal] = useState<{
    isOpen: boolean;
    applicationId: string;
    title: string;
  }>({
    isOpen: false,
    applicationId: '',
    title: '',
  });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Student Profile State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch real database counts and student records
  const loadStudentRecords = useCallback(async () => {
    try {
      const [statsRes, appsRes, savedRes] = await Promise.all([
        StudentService.getStats(),
        ApplicationService.getStudentApplications(),
        InternshipService.getSavedInternships(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (appsRes.success) {
        setApplications(appsRes.data);
        setAppliedIds(new Set(appsRes.data.map((a) => a.internship_id)));
      }
      if (savedRes.success) {
        setSavedItems(savedRes.data);
        setSavedIds(new Set(savedRes.data.map((s) => s.id)));
      }
    } catch {
      // Gracefully silent in background
    }
  }, []);

  // Fetch student profile
  const fetchStudentProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await StudentService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Fetch internships from real database engine
  const fetchInternships = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await InternshipService.getPublicInternships(filters);
      if (response.success) {
        setInternships(response.data || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to communicate with internship database engine.');
      setInternships([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStudentRecords();
    fetchStudentProfile();
  }, [loadStudentRecords, fetchStudentProfile]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  // Real Apply Handler
  const handleApply = async (
    internship: Internship,
    options?: { coverLetter?: string; additionalInfo?: string }
  ) => {
    setActionInProgressId(internship.id);
    try {
      const res = await ApplicationService.apply(internship.id, options);
      showNotification(res.message || 'Application submitted successfully!', 'success');
      setAppliedIds((prev) => new Set([...prev, internship.id]));
      await loadStudentRecords();
      setIsModalOpen(false);
    } catch (err: any) {
      showNotification(err.message || 'Failed to submit application', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Real Bookmark Save/Unsave Handler
  const handleToggleSave = async (internship: Internship) => {
    const isCurrentlySaved = savedIds.has(internship.id);
    setActionInProgressId(internship.id);

    try {
      if (isCurrentlySaved) {
        await InternshipService.unsaveInternship(internship.id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(internship.id);
          return next;
        });
        showNotification('Removed internship from bookmarks.', 'success');
      } else {
        await InternshipService.saveInternship(internship.id);
        setSavedIds((prev) => new Set([...prev, internship.id]));
        showNotification('Internship saved to your bookmarks!', 'success');
      }
      await loadStudentRecords();
    } catch (err: any) {
      showNotification(err.message || 'Error updating bookmark status', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Confirm Withdraw Application
  const handleConfirmWithdraw = async () => {
    if (!withdrawModal.applicationId) return;
    setIsWithdrawing(true);
    try {
      await ApplicationService.withdraw(withdrawModal.applicationId);
      showNotification('Application withdrawn successfully.', 'success');
      setWithdrawModal({ isOpen: false, applicationId: '', title: '' });
      await loadStudentRecords();
    } catch (err: any) {
      showNotification(err.message || 'Failed to withdraw application', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'ALL',
      location: '',
      workMode: 'ALL',
      isPaid: 'ALL',
      experienceLevel: 'ALL',
      sortBy: 'latest',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.category && filters.category !== 'ALL') ||
      filters.location ||
      (filters.workMode && filters.workMode !== 'ALL') ||
      (filters.isPaid && filters.isPaid !== 'ALL') ||
      (filters.experienceLevel && filters.experienceLevel !== 'ALL')
  );

  return (
    <DashboardLayout pageTitle="Student Intelligence Portal" roleBadgeText="STUDENT">
      <div className="space-y-6">
        {/* Real Notification Banner */}
        {notification && (
          <div
            id="student-notification-banner"
            className={`p-3.5 rounded-sm border font-mono text-xs flex items-center justify-between gap-3 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-100 cursor-pointer text-xs"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Visual Student Innovation Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-r from-[#0c1322]/90 via-[#0a1120]/80 to-[#080d18]/90 backdrop-blur-md shadow-xl p-5 sm:p-6">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 sm:opacity-35 pointer-events-none overflow-hidden hidden sm:block">
            <img
              src="/images/internhub-dashboard-bg.webp"
              alt="Campus Hub View"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1322] via-[#0c1322]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-[11px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>COLLEGE PLACEMENT &amp; CAREER PORTAL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {user?.displayName || 'Alex Mercer'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Explore verified corporate internships, track application review statuses in real-time, and manage your placement profile across industry partners.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap font-mono text-[11px] text-slate-400">
              <span className="text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                <span>B.Tech Computer Science &amp; Engineering</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Candidate</span>
              </span>
            </div>
          </div>
        </div>

        {/* Real Database Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="TOTAL APPLICATIONS"
            value={stats.totalApplications}
            subtext="Submissions logged in database"
            status={stats.totalApplications > 0 ? 'ACTIVE' : 'IDLE'}
            indicatorColor="cyan"
            icon={<Briefcase className="w-4 h-4 text-cyan-400" />}
          />
          <MetricCard
            label="SAVED INTERNSHIPS"
            value={stats.savedInternships}
            subtext="Personal bookmarked opportunities"
            status={stats.savedInternships > 0 ? 'SAVED' : 'NONE'}
            indicatorColor="blue"
            icon={<Bookmark className="w-4 h-4 text-blue-400" />}
          />
          <MetricCard
            label="PENDING INTAKES"
            value={stats.pendingApplications}
            subtext="Applications awaiting review"
            status="IN REVIEW"
            indicatorColor="amber"
            icon={<Clock className="w-4 h-4 text-amber-400" />}
          />
          <MetricCard
            label="ACCEPTED / SELECTED"
            value={stats.selectedApplications}
            subtext="Confirmed placement offers"
            status={stats.selectedApplications > 0 ? 'OFFER' : 'STANDBY'}
            indicatorColor="green"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
          <button
            id="tab-explore"
            onClick={() => setActiveTab('EXPLORE')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'EXPLORE'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-cyan-400 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>EXPLORE INTERNSHIPS</span>
          </button>
          <button
            id="tab-applications"
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'APPLICATIONS'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-cyan-400 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MY APPLICATIONS ({applications.length})</span>
          </button>
          <button
            id="tab-saved"
            onClick={() => setActiveTab('SAVED')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'SAVED'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-cyan-400 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>SAVED BOOKMARKS ({savedItems.length})</span>
          </button>
          <button
            id="tab-profile"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-cyan-400 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>CANDIDATE PROFILE</span>
          </button>
        </div>

        {/* TAB 1: EXPLORE INTERNSHIPS */}
        {activeTab === 'EXPLORE' && (
          <div className="space-y-6">
            {/* Search & Filter Controls Panel */}
            <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Keyword */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search by role title, technologies, category, or corporate name..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded bg-[#060911] border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-xs text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Location Filter */}
                <div className="w-full md:w-48">
                  <input
                    id="location-input"
                    type="text"
                    placeholder="Location (e.g. Bengaluru, Remote)"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-xs text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Sort Option */}
                <div className="w-full md:w-48">
                  <select
                    id="sort-select"
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-xs text-slate-200 cursor-pointer"
                  >
                    <option value="latest">Sort: Latest Added</option>
                    <option value="deadline">Sort: Earliest Deadline</option>
                    <option value="stipend">Sort: Highest Stipend</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    id="btn-reset-filters"
                    onClick={resetFilters}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Secondary Filter Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase">CATEGORY</label>
                  <select
                    id="filter-category"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-[#060911] border border-slate-700 text-slate-300 cursor-pointer focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science & ML">Data Science &amp; ML</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Product & Design">Product &amp; Design</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase">WORK MODE</label>
                  <select
                    id="filter-work-mode"
                    value={filters.workMode}
                    onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-[#060911] border border-slate-700 text-slate-300 cursor-pointer focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ALL">All Modes</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase">COMPENSATION</label>
                  <select
                    id="filter-is-paid"
                    value={filters.isPaid as string}
                    onChange={(e) => setFilters({ ...filters, isPaid: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-[#060911] border border-slate-700 text-slate-300 cursor-pointer focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ALL">All Compensation</option>
                    <option value="true">Paid Stipend Only</option>
                    <option value="false">Unpaid / Academic Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase">EXPERIENCE</label>
                  <select
                    id="filter-experience"
                    value={filters.experienceLevel}
                    onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-[#060911] border border-slate-700 text-slate-300 cursor-pointer focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ALL">All Levels</option>
                    <option value="Entry-level">Entry-level</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Pre-final Year">Pre-final Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  AVAILABLE OPENINGS: <strong className="text-slate-100">{internships.length}</strong>
                </span>
              </div>
              <button
                onClick={fetchInternships}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Catalog</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded font-mono text-xs">
                {errorMessage}
              </div>
            )}

            {/* Internship List / Loading State */}
            {isLoading ? (
              <div className="p-12 text-center bg-[#0b0f19] border border-slate-800 rounded-sm font-mono text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-3" />
                Querying placement database records...
              </div>
            ) : internships.length === 0 ? (
              <div className="p-12 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-3">
                <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="font-mono text-sm font-bold text-slate-200">No Openings Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
                  No active directorate-approved internships match your current filter criteria. Try expanding search parameters or resetting filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs rounded hover:bg-slate-800 cursor-pointer"
                  >
                    Clear Active Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {internships.map((internship) => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    isSaved={savedIds.has(internship.id)}
                    hasApplied={appliedIds.has(internship.id)}
                    isApplying={actionInProgressId === internship.id}
                    isSaving={actionInProgressId === internship.id}
                    onApply={handleApply}
                    onToggleSave={handleToggleSave}
                    onViewDetails={(item) => {
                      setSelectedInternship(item);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS */}
        {activeTab === 'APPLICATIONS' && (() => {
          const filteredApps = applications.filter((app) => {
            if (appFilterStatus === 'ALL') return true;
            if (appFilterStatus === 'CONCLUDED') return app.status === 'WITHDRAWN' || app.status === 'REJECTED';
            return app.status === appFilterStatus;
          });

          const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
          const selectedCount = applications.filter((a) => a.status === 'SELECTED' || a.status === 'ACCEPTED').length;

          const getStatusVariant = (status: string) => {
            switch (status) {
              case 'ACCEPTED':
              case 'SELECTED':
                return 'green';
              case 'INTERVIEW':
                return 'purple';
              case 'SHORTLISTED':
                return 'emerald';
              case 'UNDER_REVIEW':
                return 'amber';
              case 'WITHDRAWN':
              case 'REJECTED':
                return 'slate';
              default:
                return 'cyan';
            }
          };

          return (
            <div className="space-y-4">
              {/* Interview & Selection Highlight Banners */}
              {interviewCount > 0 && (
                <div className="p-4 rounded bg-indigo-950/40 border border-indigo-700/60 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5 text-indigo-300">
                    <Calendar className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>
                      <strong>INTERVIEW INTAKE:</strong> You have {interviewCount} active interview stage invitation(s). Open details for schedules and recruiter instructions.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppFilterStatus('INTERVIEW')}
                    className="px-2.5 py-1 rounded bg-indigo-900/80 border border-indigo-600 text-indigo-200 text-[11px] hover:bg-indigo-800 cursor-pointer shrink-0"
                  >
                    View Interviews
                  </button>
                </div>
              )}

              {selectedCount > 0 && (
                <div className="p-4 rounded bg-emerald-950/40 border border-emerald-700/60 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>OFFER CONFIRMATION:</strong> Congratulations! You have received {selectedCount} placement offer(s).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppFilterStatus('SELECTED')}
                    className="px-2.5 py-1 rounded bg-emerald-900/80 border border-emerald-600 text-emerald-200 text-[11px] hover:bg-emerald-800 cursor-pointer shrink-0"
                  >
                    View Offers
                  </button>
                </div>
              )}

              {/* Status Filter Bar & Refresh */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                  {[
                    { key: 'ALL', label: 'All Submissions', count: applications.length },
                    { key: 'APPLIED', label: 'Applied', count: applications.filter((a) => a.status === 'APPLIED').length },
                    { key: 'UNDER_REVIEW', label: 'In Review', count: applications.filter((a) => a.status === 'UNDER_REVIEW').length },
                    { key: 'SHORTLISTED', label: 'Shortlisted', count: applications.filter((a) => a.status === 'SHORTLISTED').length },
                    { key: 'INTERVIEW', label: 'Interview', count: interviewCount },
                    { key: 'SELECTED', label: 'Selected', count: selectedCount },
                    { key: 'CONCLUDED', label: 'Withdrawn / Concluded', count: applications.filter((a) => a.status === 'WITHDRAWN' || a.status === 'REJECTED').length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAppFilterStatus(tab.key)}
                      className={`px-2.5 py-1 rounded cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        appFilterStatus === tab.key
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-[#090d16] text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={loadStudentRecords}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Status</span>
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="p-12 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-3">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="font-mono text-sm font-bold text-slate-200">No Applications Submitted</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
                    You have not submitted an application yet. Explore available verified internship listings and apply to begin campus selection.
                  </p>
                  <button
                    onClick={() => setActiveTab('EXPLORE')}
                    className="px-4 py-2 bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs rounded hover:bg-cyan-900 cursor-pointer"
                  >
                    Browse Available Openings
                  </button>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="p-8 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-2">
                  <p className="font-mono text-xs text-slate-300 font-bold">No Applications in this category</p>
                  <p className="text-xs text-slate-500 font-sans">
                    No applications currently match the &quot;{appFilterStatus}&quot; status filter.
                  </p>
                  <button
                    onClick={() => setAppFilterStatus('ALL')}
                    className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs hover:bg-slate-800 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      id={`application-item-${app.id}`}
                      className="p-4 rounded-xl bg-[#0b101b]/80 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-mono text-sm font-bold text-slate-100">
                            {app.internship_title || 'Internship Listing'}
                          </h4>
                          <StatusBadge
                            label={app.status.replace('_', ' ')}
                            variant={getStatusVariant(app.status)}
                          />
                          {app.resume_filename && (
                            <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/80 text-cyan-300">
                              <FileCheck className="w-3 h-3 text-cyan-400" />
                              <span>Resume Snapshot: {app.resume_filename}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs text-slate-400 flex-wrap">
                          <span className="text-slate-200 font-semibold">{app.company_name}</span>
                          <span>•</span>
                          <span>{app.location || 'Location not specified'}</span>
                          {app.work_mode && (
                            <>
                              <span>•</span>
                              <span>{app.work_mode}</span>
                            </>
                          )}
                          {app.stipend && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400">{app.stipend}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedAppIdForDetail(app.id);
                            setIsAppDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-800/80 hover:border-cyan-600 text-cyan-300 font-mono text-xs cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Timeline &amp; Details</span>
                        </button>

                        {app.status !== 'WITHDRAWN' && app.status !== 'REJECTED' && app.status !== 'SELECTED' && app.status !== 'ACCEPTED' && (
                          <button
                            onClick={() => setWithdrawModal({
                              isOpen: true,
                              applicationId: app.id,
                              title: app.internship_title || 'Internship Application',
                            })}
                            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 font-mono text-xs cursor-pointer transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: SAVED BOOKMARKS */}
        {activeTab === 'SAVED' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono text-xs text-slate-400">
              <span>SAVED BOOKMARKS IN DATABASE: <strong className="text-slate-100">{savedItems.length}</strong></span>
              <button
                onClick={loadStudentRecords}
                className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {savedItems.length === 0 ? (
              <div className="p-12 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-2">
                <Bookmark className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="font-mono text-sm text-slate-200 font-bold">No Bookmarked Internships</p>
                <p className="text-xs text-slate-400">
                  Bookmark opportunities while browsing to track them here for subsequent application.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedItems.map((internship) => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    isSaved={true}
                    hasApplied={appliedIds.has(internship.id)}
                    isApplying={actionInProgressId === internship.id}
                    isSaving={actionInProgressId === internship.id}
                    onApply={handleApply}
                    onToggleSave={handleToggleSave}
                    onViewDetails={(item) => {
                      setSelectedInternship(item);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STUDENT PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-xl shadow-lg space-y-6 max-w-4xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Candidate Academic &amp; Technical Profile
                </h2>
                <p className="text-xs text-slate-400">
                  Manage your candidate profile, academic credentials, skills, portfolio projects, and resume submitted alongside internship applications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge label="ACTIVE CANDIDATE" variant="green" />
              </div>
            </div>

            {isLoadingProfile ? (
              <div className="py-12 text-center font-mono text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                Loading candidate credentials &amp; documents...
              </div>
            ) : profile ? (
              <StudentProfileForm
                initialProfile={profile}
                onProfileUpdated={(updated) => {
                  setProfile(updated);
                  showNotification('Profile and credentials updated successfully.', 'success');
                }}
              />
            ) : (
              <div className="text-center py-8 font-mono text-xs text-slate-400">
                No profile record found. Please refresh.
              </div>
            )}
          </div>
        )}

        {/* Details Modal */}
        <InternshipModal
          internship={selectedInternship}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isSaved={selectedInternship ? savedIds.has(selectedInternship.id) : false}
          hasApplied={selectedInternship ? appliedIds.has(selectedInternship.id) : false}
          isApplying={Boolean(selectedInternship && actionInProgressId === selectedInternship.id)}
          onApply={handleApply}
          onToggleSave={handleToggleSave}
          studentProfile={profile}
          studentResume={profile?.resume_document || null}
          onUploadResumeSuccess={(doc) => {
            if (profile) {
              setProfile({ ...profile, resume_document: doc });
            }
          }}
          onViewApplication={() => {
            if (selectedInternship) {
              const matchedApp = applications.find((a) => a.internship_id === selectedInternship.id);
              if (matchedApp) {
                setIsModalOpen(false);
                setSelectedAppIdForDetail(matchedApp.id);
                setIsAppDetailModalOpen(true);
              }
            }
          }}
        />

        {/* Application Details & Document Snapshot Modal */}
        <ApplicationDetailModal
          applicationId={selectedAppIdForDetail}
          isOpen={isAppDetailModalOpen}
          onClose={() => {
            setIsAppDetailModalOpen(false);
            setSelectedAppIdForDetail(null);
          }}
          onWithdrawRequest={(appId, title) => {
            setWithdrawModal({
              isOpen: true,
              applicationId: appId,
              title: title,
            });
          }}
        />

        {/* CUSTOM IN-UI WITHDRAW CONFIRMATION MODAL */}
        {withdrawModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-[#090d16] border border-rose-800/80 w-full max-w-md rounded-sm p-5 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold">
                <AlertCircle className="w-5 h-5" />
                <span>CONFIRM WITHDRAWAL</span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Are you sure you want to withdraw your application for <strong className="text-white">{withdrawModal.title}</strong>? Once withdrawn, your application status will transition to WITHDRAWN.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setWithdrawModal({ isOpen: false, applicationId: '', title: '' })}
                  className="px-3.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  id="btn-confirm-withdraw"
                  onClick={handleConfirmWithdraw}
                  disabled={isWithdrawing}
                  className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isWithdrawing ? 'WITHDRAWING...' : 'CONFIRM WITHDRAW'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
