import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { Internship, AdminReview } from '../types/internship';
import { 
  ReasonActionModal, 
  AdminActionType 
} from '../components/admin/ReasonActionModal';
import { ReviewHistoryTimeline } from '../components/admin/ReviewHistoryTimeline';
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Check, 
  ArrowLeft, 
  ExternalLink, 
  Mail, 
  Briefcase, 
  Layers, 
  FileCheck, 
  BookOpen, 
  ShieldCheck, 
  History
} from 'lucide-react';

export const AdminInternshipReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [internship, setInternship] = useState<Internship | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: AdminActionType;
    title: string;
    itemTitle: string;
  }>({
    isOpen: false,
    actionType: 'APPROVE_INTERNSHIP',
    title: '',
    itemTitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchDossier = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await adminService.getInternshipById(id);
      setInternship(data);

      setIsLoadingReviews(true);
      const revs = await adminService.getInternshipReviews(id);
      setReviews(revs);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load internship dossier', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  const handleOpenActionModal = (actionType: AdminActionType) => {
    if (!internship) return;
    let title = '';
    if (actionType === 'APPROVE_INTERNSHIP') title = 'Approve Internship for Student Applications';
    if (actionType === 'REJECT_INTERNSHIP') title = 'Reject Internship Posting';
    if (actionType === 'REQUEST_CHANGES_INTERNSHIP') title = 'Request Revisions from Partner Company';

    setModalState({
      isOpen: true,
      actionType,
      title,
      itemTitle: `${internship.title} — ${internship.company_name}`,
    });
  };

  const handleConfirmAction = async (reason: string) => {
    if (!id || !internship) return;
    setIsSubmitting(true);
    try {
      const { actionType } = modalState;
      if (actionType === 'APPROVE_INTERNSHIP') {
        await adminService.approveInternship(id, reason);
        showNotification('Internship successfully approved and published for students.', 'success');
      } else if (actionType === 'REJECT_INTERNSHIP') {
        await adminService.rejectInternship(id, reason);
        showNotification('Internship rejected.', 'success');
      } else if (actionType === 'REQUEST_CHANGES_INTERNSHIP') {
        await adminService.requestChanges(id, reason);
        showNotification('Revisions requested from partner company.', 'success');
      }
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchDossier();
    } catch (err: any) {
      showNotification(err.message || 'Moderation action failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCompanyQuick = async () => {
    if (!internship?.company_id) return;
    try {
      await adminService.verifyCompany(internship.company_id, 'Verified directly via internship moderation view.');
      showNotification(`Company ${internship.company_name} verified successfully.`, 'success');
      await fetchDossier();
    } catch (err: any) {
      showNotification(err.message || 'Failed to verify company', 'error');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Reviewing Internship Dossier" roleBadgeText="ADMIN">
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading institutional dossier...
        </div>
      </DashboardLayout>
    );
  }

  if (!internship) {
    return (
      <DashboardLayout pageTitle="Internship Dossier Not Found" roleBadgeText="ADMIN">
        <div className="p-12 text-center bg-[#0b0f19] border border-slate-800 rounded-sm space-y-3 font-mono text-xs">
          <p className="font-bold text-rose-400 text-sm">Internship Record Not Found</p>
          <p className="text-slate-400 font-sans">The requested posting does not exist in the database or was deleted.</p>
          <button
            onClick={() => navigate('/admin/internships')}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-sm text-slate-200"
          >
            ← Back to Moderation Queue
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isCompanyVerified = internship.company_verification_status === 'VERIFIED';

  return (
    <DashboardLayout pageTitle={`Review: ${internship.title}`} roleBadgeText="ADMIN">
      <div className="space-y-6">
        {/* Back navigation & Notification */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            to="/admin/internships"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-mono text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Moderation Directory</span>
          </Link>

          <span className="font-mono text-xs text-slate-500">
            RECORD_ID: <strong className="text-slate-300">{internship.id}</strong>
          </span>
        </div>

        {notification && (
          <div
            className={`p-3.5 rounded-sm border font-mono text-xs flex items-center justify-between gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-100">
              DISMISS
            </button>
          </div>
        )}

        {/* Primary Moderation Action Chassis */}
        <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-sans text-slate-100">{internship.title}</h1>
                <StatusBadge label={internship.status} />
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-sans text-xs flex-wrap">
                <span className="text-slate-200 font-semibold">{internship.company_name}</span>
                <span>•</span>
                <span className="text-cyan-400">{internship.category}</span>
                <span>•</span>
                <span>Submitted: {new Date(internship.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Updated: {new Date(internship.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Moderation Controls */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => handleOpenActionModal('REQUEST_CHANGES_INTERNSHIP')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-cyan-950/60 border border-cyan-800/80 hover:border-cyan-600 text-cyan-300 font-bold text-xs cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>REQUEST REVISIONS</span>
              </button>

              <button
                onClick={() => handleOpenActionModal('REJECT_INTERNSHIP')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-rose-950/60 border border-rose-800/80 hover:border-rose-600 text-rose-300 font-bold text-xs cursor-pointer transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>REJECT</span>
              </button>

              <button
                onClick={() => handleOpenActionModal('APPROVE_INTERNSHIP')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>APPROVE FOR STUDENTS</span>
              </button>
            </div>
          </div>

          {/* Company Verification Banner */}
          <div
            className={`p-3.5 rounded-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isCompanyVerified
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isCompanyVerified ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider block text-xs">
                  PARTNER INSTITUTION STATUS: {internship.company_verification_status || 'PENDING'}
                </span>
                <span className="text-slate-300 text-[11px] font-sans">
                  {isCompanyVerified
                    ? 'Corporate partner MoU and credentials have been verified by institutional placement officers.'
                    : 'Company is UNVERIFIED. Directorate rules forbid approving internships until company is verified.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/admin/companies/${internship.company_id}`}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 rounded-sm text-xs transition-colors"
              >
                View Company Profile
              </Link>
              {!isCompanyVerified && (
                <button
                  onClick={handleVerifyCompanyQuick}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-sm text-xs cursor-pointer transition-colors"
                >
                  Verify Company Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Specification Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dossier (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Specifications */}
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                1. Structural Specifications &amp; Compensation
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                  <span className="text-slate-500 uppercase text-[10px] block">INTERNSHIP TYPE</span>
                  <span className="text-slate-100 font-semibold text-xs font-sans mt-0.5 block">
                    {internship.internship_type}
                  </span>
                </div>

                <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                  <span className="text-slate-500 uppercase text-[10px] block">WORK MODE</span>
                  <span className="text-slate-100 font-semibold text-xs font-sans mt-0.5 block">
                    {internship.work_mode}
                  </span>
                </div>

                <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                  <span className="text-slate-500 uppercase text-[10px] block">LOCATION</span>
                  <span className="text-slate-100 font-semibold text-xs font-sans mt-0.5 block">
                    {internship.location}
                  </span>
                </div>

                <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                  <span className="text-slate-500 uppercase text-[10px] block">DURATION</span>
                  <span className="text-slate-100 font-semibold text-xs font-sans mt-0.5 block">
                    {internship.duration}
                  </span>
                </div>

                <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                  <span className="text-slate-500 uppercase text-[10px] block">STIPEND</span>
                  <span className="text-emerald-400 font-bold text-xs font-sans mt-0.5 block">
                    {internship.stipend} {internship.is_paid ? '(Paid)' : '(Unpaid)'}
                  </span>
                </div>

                <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                  <span className="text-slate-500 uppercase text-[10px] block">APPLICATION DEADLINE</span>
                  <span className="text-amber-300 font-bold text-xs font-sans mt-0.5 block">
                    {new Date(internship.application_deadline).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description & Responsibilities */}
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                2. Role Scope &amp; Responsibilities
              </h3>

              <div className="space-y-4 font-sans text-xs">
                <div>
                  <h4 className="font-mono text-[11px] uppercase text-cyan-400 font-bold mb-1">
                    ROLE OVERVIEW &amp; DESCRIPTION
                  </h4>
                  <div className="p-3.5 bg-[#070b13] border border-slate-800/80 rounded-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {internship.description}
                  </div>
                </div>

                {internship.responsibilities && (
                  <div>
                    <h4 className="font-mono text-[11px] uppercase text-cyan-400 font-bold mb-1">
                      KEY RESPONSIBILITIES
                    </h4>
                    <div className="p-3.5 bg-[#070b13] border border-slate-800/80 rounded-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {internship.responsibilities}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Academic & Skill Requirements */}
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                3. Candidate Qualifications &amp; Selection
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                {internship.education && (
                  <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                    <span className="font-mono text-[10px] uppercase text-slate-500 block mb-1">
                      TARGET EDUCATION
                    </span>
                    <span className="text-slate-200 font-semibold">{internship.education}</span>
                  </div>
                )}

                {internship.experience_level && (
                  <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                    <span className="font-mono text-[10px] uppercase text-slate-500 block mb-1">
                      EXPERIENCE LEVEL
                    </span>
                    <span className="text-slate-200 font-semibold">{internship.experience_level}</span>
                  </div>
                )}

                {internship.eligibility && (
                  <div className="sm:col-span-2 p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                    <span className="font-mono text-[10px] uppercase text-slate-500 block mb-1">
                      ELIGIBILITY CRITERIA
                    </span>
                    <span className="text-slate-200 leading-relaxed block">{internship.eligibility}</span>
                  </div>
                )}

                {internship.selection_process && (
                  <div className="sm:col-span-2 p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                    <span className="font-mono text-[10px] uppercase text-slate-500 block mb-1">
                      SELECTION WORKFLOW
                    </span>
                    <span className="text-slate-200 leading-relaxed block">{internship.selection_process}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits & Learning Opportunities */}
            {(internship.benefits || internship.learning_opportunities) && (
              <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                  4. Benefits &amp; Mentorship
                </h3>

                <div className="space-y-3 font-sans text-xs">
                  {internship.learning_opportunities && (
                    <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                      <span className="font-mono text-[10px] uppercase text-cyan-400 block mb-1">
                        LEARNING CURRICULUM &amp; MENTORSHIP
                      </span>
                      <p className="text-slate-200 leading-relaxed">{internship.learning_opportunities}</p>
                    </div>
                  )}

                  {internship.benefits && (
                    <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-xs">
                      <span className="font-mono text-[10px] uppercase text-cyan-400 block mb-1">
                        PERKS &amp; INSTITUTIONAL BENEFITS
                      </span>
                      <p className="text-slate-200 leading-relaxed">{internship.benefits}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Company Node + Review History (1 col) */}
          <div className="space-y-6">
            {/* Corporate Profile Card */}
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-200 uppercase tracking-wider">
                  Partner Profile
                </h3>
              </div>

              <div className="space-y-2">
                <div className="font-sans font-bold text-base text-slate-100">
                  {internship.company_name}
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge label={internship.company_verification_status || 'PENDING'} />
                </div>

                {internship.company_description && (
                  <p className="text-slate-300 font-sans text-xs leading-relaxed pt-1">
                    {internship.company_description}
                  </p>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  {internship.company_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{internship.company_location}</span>
                    </div>
                  )}
                  {internship.company_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{internship.company_email}</span>
                    </div>
                  )}
                  {internship.company_website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <a
                        href={internship.company_website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline truncate"
                      >
                        {internship.company_website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review History Audit Trail */}
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-200 uppercase tracking-wider">
                  Review History ({reviews.length})
                </h3>
              </div>

              <ReviewHistoryTimeline reviews={reviews} isLoading={isLoadingReviews} />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Reason Modal */}
      <ReasonActionModal
        isOpen={modalState.isOpen}
        actionType={modalState.actionType}
        title={modalState.title}
        itemTitle={modalState.itemTitle}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
};
