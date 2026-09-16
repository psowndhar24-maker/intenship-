import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { 
  CompanyService, 
  CompanyProfileData, 
  CompanyCandidateApplication 
} from '../services/companyService';
import { Internship, CreateInternshipPayload, CompanyDashboardStats } from '../types/internship';
import { ApplicationDetailModal } from '../components/ApplicationDetailModal';
import { 
  Building2, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  PlusCircle, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Trash2,
  Calendar,
  DollarSign,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  Save,
  Globe,
  MapPin,
  FileText,
  X,
  Search,
  Eye,
  MessageSquare,
  Send,
  UserCheck
} from 'lucide-react';

const INITIAL_FORM_STATE: CreateInternshipPayload = {
  title: '',
  category: 'Software Engineering',
  description: '',
  internship_type: 'Full-time Summer Internship',
  location: 'Bengaluru, Karnataka',
  work_mode: 'Hybrid',
  duration: '6 Months',
  stipend: '₹35,000 / month',
  currency: 'INR',
  is_paid: true,
  experience_level: 'Entry-level',
  education: 'B.Tech / B.E / M.Tech in Computer Science or related engineering discipline',
  eligibility: 'Minimum CGPA of 7.5; proficiency in TypeScript, React, or modern backend architecture.',
  responsibilities: 'Collaborate on production engineering systems, build scalable REST services, and ship verified platform modules.',
  benefits: 'Industry mentorship, certificate of completion, pre-placement interview consideration, and stipend.',
  learning_opportunities: 'Hands-on experience with high-throughput distributed systems and modern cloud development.',
  selection_process: 'Resume Screening -> Technical Assessment -> Engineering Directorate Interview',
  application_deadline: '',
};

interface CompanyDashboardProps {
  initialTab?: 'POSTINGS' | 'APPLICATIONS' | 'PROFILE';
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ initialTab = 'POSTINGS' }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'POSTINGS' | 'APPLICATIONS' | 'PROFILE'>(initialTab);

  // Internships
  const [internships, setInternships] = useState<(Internship & { application_count: number })[]>([]);
  const [formData, setFormData] = useState<CreateInternshipPayload>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Edit Internship Modal State
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CreateInternshipPayload>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Candidate Applications State
  const [candidateApps, setCandidateApps] = useState<CompanyCandidateApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Real Database Company Stats
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);

  // Status Change Modal State
  const [statusChangeModal, setStatusChangeModal] = useState<{
    isOpen: boolean;
    applicationId: string;
    studentName: string;
    internshipTitle: string;
    currentStatus: string;
    newStatus: string;
    note: string;
  }>({
    isOpen: false,
    applicationId: '',
    studentName: '',
    internshipTitle: '',
    currentStatus: '',
    newStatus: '',
    note: '',
  });
  const [isSubmittingStatusChange, setIsSubmittingStatusChange] = useState(false);

  // Candidate App Filters
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // Application Detail Modal State
  const [selectedAppIdForDetail, setSelectedAppIdForDetail] = useState<string | null>(null);
  const [isAppDetailModalOpen, setIsAppDetailModalOpen] = useState(false);

  // Company Profile State
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    description: '',
    website: '',
    email: '',
    location: '',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Synchronize tab if initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Set default deadline to 30 days in future
  useEffect(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    futureDate.setHours(18, 0, 0, 0);
    const isoString = futureDate.toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, application_deadline: isoString }));
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchMyInternships = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await CompanyService.getMyInternships();
      if (res.success) {
        setInternships(res.data || []);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load corporate postings from database.', 'error');
      setInternships([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCandidateApplications = useCallback(async () => {
    setIsLoadingApps(true);
    try {
      const res = await CompanyService.getApplications();
      if (res.success) {
        setCandidateApps(res.data || []);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load candidate applications.', 'error');
      setCandidateApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await CompanyService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setProfileForm({
          company_name: res.data.company_name || '',
          description: res.data.description || '',
          website: res.data.website || '',
          email: res.data.email || '',
          location: res.data.location || '',
        });
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load company profile.', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await CompanyService.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    fetchMyInternships();
    fetchCandidateApplications();
    fetchProfile();
    fetchStats();
  }, [fetchMyInternships, fetchCandidateApplications, fetchProfile, fetchStats]);

  // Handle New Internship Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.title.trim()) {
      showNotification('Title is required.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.description.trim()) {
      showNotification('Description is required.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.application_deadline) {
      showNotification('Application deadline is required.', 'error');
      setIsSubmitting(false);
      return;
    }

    const deadlineTimestamp = new Date(formData.application_deadline).getTime();
    if (isNaN(deadlineTimestamp) || deadlineTimestamp <= Date.now()) {
      showNotification('Application deadline must be a future date and time.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await CompanyService.createInternship(formData);
      showNotification(res.message || 'Internship posting initialized with status PENDING_APPROVAL.', 'success');
      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
      }));
      setShowForm(false);
      await fetchMyInternships();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create internship posting.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (internship: Internship) => {
    setEditingInternship(internship);
    setEditFormData({
      title: internship.title,
      category: internship.category,
      description: internship.description,
      internship_type: internship.internship_type,
      location: internship.location,
      work_mode: internship.work_mode,
      duration: internship.duration,
      stipend: internship.stipend,
      experience_level: internship.experience_level,
      eligibility: internship.eligibility,
      responsibilities: internship.responsibilities,
      benefits: internship.benefits,
      learning_opportunities: internship.learning_opportunities,
      selection_process: internship.selection_process,
      application_deadline: internship.application_deadline ? new Date(internship.application_deadline).toISOString().slice(0, 16) : '',
    });
  };

  // Submit Internship Update
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInternship) return;
    setIsUpdating(true);

    try {
      const res = await CompanyService.updateInternship(editingInternship.id, editFormData);
      showNotification(res.message || 'Internship updated successfully.', 'success');
      setEditingInternship(null);
      await fetchMyInternships();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update internship.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await CompanyService.deleteInternship(deleteModal.id);
      showNotification('Internship posting removed from database.', 'success');
      setDeleteModal({ isOpen: false, id: '', title: '' });
      await fetchMyInternships();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete internship.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Initiate Candidate Application Status Change Modal
  const handleInitiateStatusChange = (app: CompanyCandidateApplication, newStatus: string) => {
    if (app.status === newStatus) return;
    setStatusChangeModal({
      isOpen: true,
      applicationId: app.application_id,
      studentName: app.student_name,
      internshipTitle: app.internship_title,
      currentStatus: app.status,
      newStatus,
      note: '',
    });
  };

  // Confirm and Execute Application Status Change with Note
  const handleConfirmStatusChange = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!statusChangeModal.applicationId || !statusChangeModal.newStatus) return;

    setIsSubmittingStatusChange(true);
    try {
      const res = await CompanyService.updateApplicationStatus(
        statusChangeModal.applicationId,
        statusChangeModal.newStatus,
        statusChangeModal.note.trim() ? statusChangeModal.note.trim() : undefined
      );
      showNotification(res.message || `Application status updated to ${statusChangeModal.newStatus}.`, 'success');
      setStatusChangeModal({
        isOpen: false,
        applicationId: '',
        studentName: '',
        internshipTitle: '',
        currentStatus: '',
        newStatus: '',
        note: '',
      });
      await fetchCandidateApplications();
      await fetchMyInternships();
      await fetchStats();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update application status.', 'error');
    } finally {
      setIsSubmittingStatusChange(false);
    }
  };

  // Save Company Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.company_name.trim()) {
      showNotification('Company name is required.', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await CompanyService.updateProfile(profileForm);
      showNotification(res.message || 'Company profile updated successfully.', 'success');
      if (res.data) setProfile(res.data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to update company profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Derived real stats from database or fallback to loaded lists
  const totalPostings = stats?.total_postings ?? internships.length;
  const activeIntakes = stats?.active_postings ?? internships.filter((i) => i.status === 'APPROVED').length;
  const pendingReview = stats?.pending_postings ?? internships.filter((i) => i.status === 'PENDING_APPROVAL').length;
  const totalApplicants = stats?.total_applications ?? candidateApps.length;
  const candidateInterviews = stats?.interview_applications ?? candidateApps.filter((a) => a.status === 'INTERVIEW').length;
  const candidateOffers = stats?.selected_applications ?? candidateApps.filter((a) => a.status === 'SELECTED' || a.status === 'ACCEPTED').length;

  return (
    <DashboardLayout pageTitle="Corporate Partner Portal" roleBadgeText="COMPANY">
      <div className="space-y-6">
        {/* Notification Banner */}
        {notification && (
          <div
            id="company-notification-banner"
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

        {/* Visual Corporate Innovation Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-r from-[#0c1524]/90 via-[#0a1220]/80 to-[#070e1a]/90 backdrop-blur-md shadow-xl p-5 sm:p-6">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 sm:opacity-35 pointer-events-none overflow-hidden hidden sm:block">
            <img
              src="/images/internhub-dashboard-bg.webp"
              alt="Campus Innovation Hub"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1524] via-[#0c1524]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[11px] font-mono text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>INDUSTRY PARTNER RECRUITMENT PORTAL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {user?.displayName || 'Nexus Dynamics Recruiter'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Post verified internship opportunities, evaluate applicant dossiers, and coordinate placement interviews with top university candidates.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap font-mono text-[11px] text-slate-400">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{profile?.company_name || 'Nexus Dynamics Labs'}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Employer</span>
              </span>
            </div>
          </div>
        </div>

        {/* Real Statistics Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="POSTED LISTINGS"
            value={totalPostings}
            subtext="Internships created in database"
            status={totalPostings > 0 ? 'ACTIVE' : 'STANDBY'}
            indicatorColor="emerald"
            icon={<Briefcase className="w-4 h-4 text-emerald-400" />}
          />
          <MetricCard
            label="PUBLIC INTAKES"
            value={activeIntakes}
            subtext="Directorate-approved opportunities"
            status={activeIntakes > 0 ? 'LIVE' : 'NONE'}
            indicatorColor="green"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
          <MetricCard
            label="CANDIDATE APPLICATIONS"
            value={totalApplicants}
            subtext="Total student submissions received"
            status={totalApplicants > 0 ? 'ACTIVE' : 'IDLE'}
            indicatorColor="cyan"
            icon={<Users className="w-4 h-4 text-cyan-400" />}
          />
          <MetricCard
            label="INTERVIEWS & OFFERS"
            value={`${candidateInterviews} / ${candidateOffers}`}
            subtext="Active pipeline / selected offers"
            status={candidateOffers > 0 ? 'ACTIVE' : 'PIPELINE'}
            indicatorColor="purple"
            icon={<GraduationCap className="w-4 h-4 text-indigo-400" />}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
          <button
            id="tab-postings"
            onClick={() => setActiveTab('POSTINGS')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'POSTINGS'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-emerald-400 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>MY POSTINGS ({internships.length})</span>
          </button>
          <button
            id="tab-applications"
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'APPLICATIONS'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-emerald-400 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>CANDIDATE APPLICATIONS ({candidateApps.length})</span>
          </button>
          <button
            id="tab-profile"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-slate-900/90 backdrop-blur-md border-b-2 border-emerald-400 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>COMPANY PROFILE</span>
          </button>
        </div>

        {/* TAB 1: CORPORATE POSTINGS */}
        {activeTab === 'POSTINGS' && (
          <div className="space-y-6">
            {/* Action Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Recruitment Listings Management
                </h2>
                <p className="text-xs text-slate-400">
                  Create and manage corporate placement postings. All new postings require college placement directorate approval.
                </p>
              </div>

              <button
                id="btn-toggle-create-form"
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-slate-950 font-mono text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showForm ? 'CLOSE FORM' : 'CREATE INTERNSHIP'}</span>
              </button>
            </div>

            {/* Internship Creation Form */}
            {showForm && (
              <form
                id="create-internship-form"
                onSubmit={handleSubmit}
                className="bg-[#090d16] border border-emerald-800/60 p-6 rounded-sm space-y-4 font-mono text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                    New Corporate Internship Specification
                  </span>
                  <StatusBadge label="STATUS: PENDING_APPROVAL" variant="amber" />
                </div>

                {/* Title & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      ROLE TITLE *
                    </label>
                    <input
                      id="form-title"
                      type="text"
                      required
                      placeholder="e.g. Distributed Systems Engineering Intern"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      CATEGORY *
                    </label>
                    <select
                      id="form-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Data Science & ML">Data Science &amp; ML</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                      <option value="Product & Design">Product &amp; Design</option>
                    </select>
                  </div>
                </div>

                {/* Type, Work Mode, Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      INTERNSHIP TYPE *
                    </label>
                    <input
                      id="form-type"
                      type="text"
                      required
                      value={formData.internship_type}
                      onChange={(e) => setFormData({ ...formData, internship_type: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      WORK MODE *
                    </label>
                    <select
                      id="form-work-mode"
                      value={formData.work_mode}
                      onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      LOCATION *
                    </label>
                    <input
                      id="form-location"
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Duration, Stipend, Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      DURATION *
                    </label>
                    <input
                      id="form-duration"
                      type="text"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      MONTHLY STIPEND *
                    </label>
                    <input
                      id="form-stipend"
                      type="text"
                      required
                      value={formData.stipend}
                      onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      APPLICATION DEADLINE *
                    </label>
                    <input
                      id="form-deadline"
                      type="datetime-local"
                      required
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                    PROJECT DESCRIPTION &amp; ROLE OVERVIEW *
                  </label>
                  <textarea
                    id="form-description"
                    rows={3}
                    required
                    placeholder="Describe project responsibilities, expected impact, and engineering tech stack..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                {/* Eligibility & Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      ELIGIBILITY &amp; PREREQUISITES
                    </label>
                    <textarea
                      id="form-eligibility"
                      rows={2}
                      value={formData.eligibility || ''}
                      onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      SELECTION &amp; INTERVIEW PROCESS
                    </label>
                    <textarea
                      id="form-selection-process"
                      rows={2}
                      value={formData.selection_process || ''}
                      onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none font-sans"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    id="btn-submit-internship"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 border border-emerald-400 text-slate-950 font-bold cursor-pointer transition-colors shadow-sm disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>{isSubmitting ? 'SAVING SPECIFICATION...' : 'POST FOR DIRECTORATE APPROVAL'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Real Postings List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono text-xs text-slate-400">
                <span>YOUR POSTINGS IN DATABASE: <strong className="text-slate-100">{internships.length}</strong></span>
                <button
                  onClick={fetchMyInternships}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 hover:text-emerald-300 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Postings</span>
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center bg-[#0b0f19] border border-slate-800 rounded-sm font-mono text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto mb-2" />
                  Loading corporate listings...
                </div>
              ) : internships.length === 0 ? (
                <div 
                  id="empty-company-postings"
                  className="p-12 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-3"
                >
                  <div className="p-3 bg-slate-900/80 rounded-full w-fit mx-auto border border-slate-800 text-slate-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-mono text-sm font-bold text-slate-200">
                      No internships posted yet.
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Create your first corporate listing using the &quot;CREATE INTERNSHIP&quot; button above.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {internships.map((internship) => (
                    <div
                      key={internship.id}
                      id={`company-internship-${internship.id}`}
                      className="bg-[#0b101b]/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                            {internship.category}
                          </span>
                          <StatusBadge label={internship.status} />
                        </div>
                        <h3 className="font-mono text-sm font-bold text-slate-100">
                          {internship.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            {internship.stipend}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                            <Users className="w-3 h-3" />
                            {internship.application_count} Applicants
                          </span>
                        </div>

                        {/* Directorate Review Feedback */}
                        {internship.latest_review_reason && (
                          <div
                            className={`p-2.5 rounded-xs border text-xs font-sans mt-2 space-y-0.5 ${
                              internship.status === 'CHANGES_REQUESTED'
                                ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
                                : internship.status === 'REJECTED'
                                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="font-mono text-[10px] uppercase font-bold tracking-wider block text-slate-400">
                              DIRECTORATE MODERATION NOTE:
                            </span>
                            <p className="leading-relaxed">{internship.latest_review_reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-edit-${internship.id}`}
                          onClick={() => handleOpenEdit(internship)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 font-mono text-xs cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          id={`btn-delete-${internship.id}`}
                          onClick={() => setDeleteModal({ isOpen: true, id: internship.id, title: internship.title })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 font-mono text-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE APPLICATIONS */}
        {activeTab === 'APPLICATIONS' && (() => {
          const filteredCandidateApps = candidateApps.filter((app) => {
            const matchesSearch = !appSearch.trim() || [
              app.student_name,
              app.student_email,
              app.college || '',
              app.degree || '',
              app.internship_title,
              app.skills || '',
            ].some((field) => field.toLowerCase().includes(appSearch.toLowerCase().trim()));

            if (!matchesSearch) return false;

            if (appStatusFilter === 'ALL') return true;
            if (appStatusFilter === 'SELECTED') return app.status === 'SELECTED' || app.status === 'ACCEPTED';
            return app.status === appStatusFilter;
          });

          return (
            <div className="space-y-4">
              {/* Header & Refresh */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800 font-mono text-xs text-slate-400">
                <span>RECEIVED CANDIDATE APPLICATIONS: <strong className="text-slate-100">{candidateApps.length}</strong></span>
                <button
                  onClick={async () => {
                    await fetchCandidateApplications();
                    await fetchStats();
                  }}
                  disabled={isLoadingApps}
                  className="flex items-center gap-1.5 hover:text-emerald-300 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingApps ? 'animate-spin' : ''}`} />
                  <span>Refresh Applications</span>
                </button>
              </div>

              {/* Search and Status Filters */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search candidate by name, degree, college, or role..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded bg-[#060911] border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {appSearch && (
                    <button
                      type="button"
                      onClick={() => setAppSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                  {[
                    { key: 'ALL', label: 'All', count: candidateApps.length },
                    { key: 'APPLIED', label: 'Applied', count: candidateApps.filter((a) => a.status === 'APPLIED').length },
                    { key: 'UNDER_REVIEW', label: 'Review', count: candidateApps.filter((a) => a.status === 'UNDER_REVIEW').length },
                    { key: 'SHORTLISTED', label: 'Shortlist', count: candidateApps.filter((a) => a.status === 'SHORTLISTED').length },
                    { key: 'INTERVIEW', label: 'Interview', count: candidateApps.filter((a) => a.status === 'INTERVIEW').length },
                    { key: 'SELECTED', label: 'Offers', count: candidateApps.filter((a) => a.status === 'SELECTED' || a.status === 'ACCEPTED').length },
                    { key: 'REJECTED', label: 'Rejected', count: candidateApps.filter((a) => a.status === 'REJECTED').length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAppStatusFilter(tab.key)}
                      className={`px-2 py-1 rounded cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 text-[11px] ${
                        appStatusFilter === tab.key
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-[#090d16] text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[10px] px-1 rounded-full bg-slate-800 text-slate-300">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingApps ? (
                <div className="p-8 text-center bg-[#0b0f19] border border-slate-800 rounded-sm font-mono text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto mb-2" />
                  Querying applicant roster...
                </div>
              ) : candidateApps.length === 0 ? (
                <div 
                  id="empty-company-applications"
                  className="p-12 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-3"
                >
                  <div className="p-3 bg-slate-900/80 rounded-full w-fit mx-auto border border-slate-800 text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-mono text-sm font-bold text-slate-200">
                      No candidate applications yet.
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      When students apply to your approved listings, their verified profiles and credentials will appear here for review.
                    </p>
                  </div>
                </div>
              ) : filteredCandidateApps.length === 0 ? (
                <div className="p-8 text-center bg-[#0b0f19] border border-slate-800/80 rounded-sm space-y-2">
                  <p className="font-mono text-xs text-slate-300 font-bold">No matching candidate applications</p>
                  <p className="text-xs text-slate-500 font-sans">
                    No applications match the current search or status filter criteria.
                  </p>
                  <button
                    onClick={() => {
                      setAppSearch('');
                      setAppStatusFilter('ALL');
                    }}
                    className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs hover:bg-slate-800 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCandidateApps.map((app) => (
                    <div
                      key={app.application_id}
                      id={`candidate-app-${app.application_id}`}
                      className="bg-[#0b101b]/80 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 p-5 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors shadow-md"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-100 text-sm">{app.student_name}</span>
                          <StatusBadge label={app.status.replace('_', ' ')} />
                          <span className="font-mono text-[10px] text-slate-400">
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="font-mono text-xs text-emerald-400">
                          Posting: <span className="text-slate-200 font-semibold">{app.internship_title}</span> ({app.internship_category})
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-slate-300">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{app.student_email}</span>
                            {app.student_phone && (
                              <>
                                <span className="text-slate-600">|</span>
                                <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{app.student_phone}</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{app.college || 'College Unspecified'}</span>
                            {app.degree && <span className="text-slate-500">• {app.degree}</span>}
                            {app.graduation_year && <span className="text-slate-500">({app.graduation_year})</span>}
                          </div>
                        </div>

                        {app.skills && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            <span className="text-slate-500">Skills:</span> {app.skills}
                          </div>
                        )}
                      </div>

                      {/* Actions & Status Dropdown */}
                      <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
                        {/* Detail Modal Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppIdForDetail(app.application_id);
                            setIsAppDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-cyan-300 font-mono text-xs cursor-pointer transition-colors"
                          title="View Full Profile & Snapshot"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>Timeline &amp; Profile</span>
                        </button>

                        {/* Resume Direct Links */}
                        {app.resume_filename ? (
                          <a
                            href={`/api/applications/${app.application_id}/resume?token=${localStorage.getItem('token') || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-cyan-950 border border-cyan-800 hover:border-cyan-500 text-cyan-300 font-mono text-xs transition-colors"
                            title={`Download Attached Resume Snapshot: ${app.resume_filename}`}
                          >
                            <FileText className="w-3 h-3 text-cyan-400" />
                            <span>Resume</span>
                          </a>
                        ) : app.resume_url ? (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-cyan-300 font-mono text-xs transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </a>
                        ) : null}

                        {/* Status Select triggering note modal */}
                        <select
                          id={`select-status-${app.application_id}`}
                          value={app.status}
                          disabled={isSubmittingStatusChange || app.status === 'WITHDRAWN'}
                          onChange={(e) => handleInitiateStatusChange(app, e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-[#070b14] border border-slate-700 text-slate-200 font-mono text-xs cursor-pointer focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW">Interview Stage</option>
                          <option value="SELECTED">Selected / Offer</option>
                          <option value="REJECTED">Rejected</option>
                          {app.status === 'WITHDRAWN' && <option value="WITHDRAWN">Withdrawn</option>}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: COMPANY PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-xl shadow-lg space-y-6 max-w-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Corporate Identity &amp; Verification Profile
                </h2>
                <p className="text-xs text-slate-400">
                  Update your organizational data displayed on college placement brochures and public listings.
                </p>
              </div>

              {profile?.verification_status && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">STATUS:</span>
                  <StatusBadge label={profile.verification_status} />
                </div>
              )}
            </div>

            {isLoadingProfile ? (
              <div className="py-8 text-center font-mono text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                Loading organization profile...
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                    COMPANY / ORGANIZATION NAME *
                  </label>
                  <input
                    id="profile-company-name"
                    type="text"
                    required
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                    ORGANIZATIONAL MISSION &amp; OVERVIEW
                  </label>
                  <textarea
                    id="profile-description"
                    rows={3}
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      OFFICIAL WEBSITE
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        id="profile-website"
                        type="url"
                        placeholder="https://company.example.com"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                      CAMPUS RECRUITER CONTACT EMAIL
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        id="profile-email"
                        type="email"
                        placeholder="recruiter@company.example.com"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 uppercase text-[10px]">
                    HEADQUARTERS / PRIMARY OFFICE LOCATION
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      id="profile-location"
                      type="text"
                      placeholder="e.g. Bengaluru, Karnataka, India"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-save-company-profile"
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 border border-emerald-400 text-slate-950 font-bold cursor-pointer transition-colors shadow-sm disabled:cursor-not-allowed"
                  >
                    <Save className={`w-4 h-4 ${isSavingProfile ? 'animate-spin' : ''}`} />
                    <span>{isSavingProfile ? 'SAVING PROFILE...' : 'SAVE COMPANY PROFILE'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* EDIT INTERNSHIP MODAL */}
        {editingInternship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-[#090d16] border border-slate-700 w-full max-w-2xl rounded-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-mono text-sm font-bold text-slate-100">
                  EDIT INTERNSHIP // {editingInternship.id}
                </h3>
                <button
                  onClick={() => setEditingInternship(null)}
                  className="text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 uppercase text-[10px]">ROLE TITLE</label>
                  <input
                    type="text"
                    required
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">CATEGORY</label>
                    <select
                      value={editFormData.category || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-200 cursor-pointer"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Data Science & ML">Data Science &amp; ML</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                      <option value="Product & Design">Product &amp; Design</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">WORK MODE</label>
                    <select
                      value={editFormData.work_mode || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, work_mode: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-200 cursor-pointer"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">STIPEND</label>
                    <input
                      type="text"
                      value={editFormData.stipend || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, stipend: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 uppercase text-[10px]">LOCATION</label>
                    <input
                      type="text"
                      value={editFormData.location || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 uppercase text-[10px]">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingInternship(null)}
                    className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-slate-300"
                  >
                    CANCEL
                  </button>
                  <button
                    id="btn-save-edit-internship"
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold disabled:opacity-50"
                  >
                    {isUpdating ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOM IN-UI DELETE CONFIRMATION MODAL */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-[#090d16] border border-rose-800/80 w-full max-w-md rounded-sm p-5 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold">
                <Trash2 className="w-5 h-5" />
                <span>CONFIRM DELETION</span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Are you sure you want to delete the posting for <strong className="text-white">{deleteModal.title}</strong>? All linked student candidacy records for this posting will be purged.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
                  className="px-3.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  id="btn-confirm-delete"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold disabled:opacity-50"
                >
                  {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RECRUITER STATUS CHANGE CONFIRMATION & NOTE MODAL */}
        {statusChangeModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-[#090d16] border border-slate-700 w-full max-w-lg rounded-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
                <div className="flex items-center gap-2 text-slate-100 text-sm font-bold">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>UPDATE CANDIDATE STATUS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusChangeModal((prev) => ({ ...prev, isOpen: false }))}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="p-3 bg-[#060911] border border-slate-800 rounded space-y-1">
                  <div>Candidate: <strong className="text-white">{statusChangeModal.studentName}</strong></div>
                  <div>Opportunity: <span className="text-emerald-300">{statusChangeModal.internshipTitle}</span></div>
                  <div className="flex items-center gap-2 pt-1">
                    <span>Transition:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[11px]">
                      {statusChangeModal.currentStatus}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-[11px]">
                      {statusChangeModal.newStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block text-[10px] uppercase">
                    Recruiter Note / Student Notification Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      statusChangeModal.newStatus === 'INTERVIEW'
                        ? 'e.g., Interview round scheduled for Friday, 11:00 AM via video call. Instructions shared.'
                        : statusChangeModal.newStatus === 'SELECTED'
                        ? 'e.g., Congratulations! You have been selected for the internship position.'
                        : statusChangeModal.newStatus === 'SHORTLISTED'
                        ? 'e.g., Application shortlisted for review by technical team.'
                        : 'Add optional feedback or instructions for the candidate...'
                    }
                    value={statusChangeModal.note}
                    onChange={(e) => setStatusChangeModal((prev) => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-sans text-xs leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500 font-sans">
                    This note will be recorded in the permanent application audit trail and sent directly to the student as an in-app notification.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setStatusChangeModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmStatusChange()}
                  disabled={isSubmittingStatusChange}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingStatusChange ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>UPDATING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>CONFIRM &amp; NOTIFY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATE APPLICATION DETAIL & AUDIT TIMELINE MODAL */}
        {isAppDetailModalOpen && selectedAppIdForDetail && (
          <ApplicationDetailModal
            applicationId={selectedAppIdForDetail}
            isOpen={isAppDetailModalOpen}
            onClose={() => {
              setIsAppDetailModalOpen(false);
              setSelectedAppIdForDetail(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
