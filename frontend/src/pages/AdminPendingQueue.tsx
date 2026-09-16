import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { Internship } from '../types/internship';
import { 
  ReasonActionModal, 
  AdminActionType 
} from '../components/admin/ReasonActionModal';
import { 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  Check, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const AdminPendingQueue: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: AdminActionType;
    title: string;
    itemTitle: string;
    internshipId: string;
  }>({
    isOpen: false,
    actionType: 'APPROVE_INTERNSHIP',
    title: '',
    itemTitle: '',
    internshipId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingInternships(1, 50);
      setInternships(res.data);
      setTotal(res.pagination.total);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch pending moderation queue', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleOpenActionModal = (
    actionType: AdminActionType,
    internship: Internship
  ) => {
    let title = '';
    if (actionType === 'APPROVE_INTERNSHIP') title = 'Approve Internship for Public Discovery';
    if (actionType === 'REJECT_INTERNSHIP') title = 'Reject Internship Posting';
    if (actionType === 'REQUEST_CHANGES_INTERNSHIP') title = 'Request Changes from Partner';

    setModalState({
      isOpen: true,
      actionType,
      title,
      itemTitle: `${internship.title} (${internship.company_name})`,
      internshipId: internship.id,
    });
  };

  const handleConfirmAction = async (reason: string) => {
    setIsSubmitting(true);
    try {
      const { actionType, internshipId } = modalState;
      if (actionType === 'APPROVE_INTERNSHIP') {
        await adminService.approveInternship(internshipId, reason);
        showNotification('Internship approved and published.', 'success');
      } else if (actionType === 'REJECT_INTERNSHIP') {
        await adminService.rejectInternship(internshipId, reason);
        showNotification('Internship rejected.', 'success');
      } else if (actionType === 'REQUEST_CHANGES_INTERNSHIP') {
        await adminService.requestChanges(internshipId, reason);
        showNotification('Revision request transmitted.', 'success');
      }
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchPending();
    } catch (err: any) {
      showNotification(err.message || 'Action failed on database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Pending Internship Approval Queue" roleBadgeText="ADMIN">
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div
            className={`p-3.5 rounded-sm border font-mono text-xs flex items-center justify-between gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-100">
              DISMISS
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-sm flex items-center justify-between flex-wrap gap-4 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                PENDING INSTITUTIONAL VETTING ({total})
              </h2>
            </div>
            <p className="text-slate-400 font-sans text-xs">
              Every internship listed below is waiting for institutional verification before becoming discoverable to students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/companies"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Verify Partner Companies</span>
            </Link>

            <button
              onClick={fetchPending}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-cyan-600 text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Pending Items List */}
        {internships.length === 0 ? (
          <div className="p-16 text-center bg-[#0b0f19] border border-slate-800 rounded-sm space-y-3 font-mono text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100 font-sans">
              Pending Queue is Clear
            </h3>
            <p className="font-sans text-slate-400 max-w-md mx-auto text-xs">
              No submissions are awaiting Directorate approval at this time. All corporate partner postings have been processed.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/internships"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-sm text-slate-200 font-mono text-xs transition-colors"
              >
                <span>Browse All Internship Postings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            {internships.map((item) => {
              const isCompanyVerified = item.company_verification_status === 'VERIFIED';
              return (
                <div
                  key={item.id}
                  className="p-5 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors rounded-sm space-y-4"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/admin/internships/${item.id}`}
                          className="font-bold text-base text-slate-100 hover:text-cyan-300 font-sans transition-colors"
                        >
                          {item.title}
                        </Link>
                        <StatusBadge label={item.status} />
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-xs font-sans">
                        <span className="flex items-center gap-1 font-bold text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{item.company_name}</span>
                        </span>
                        <span>•</span>
                        <StatusBadge
                          label={item.company_verification_status || 'PENDING'}
                          className="text-[10px]"
                        />
                        {item.company_website && (
                          <>
                            <span>•</span>
                            <a
                              href={item.company_website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>{item.company_website}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/internships/${item.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Full Dossier</span>
                      </Link>

                      <button
                        onClick={() => handleOpenActionModal('REQUEST_CHANGES_INTERNSHIP', item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cyan-950/60 border border-cyan-800/80 hover:border-cyan-600 text-cyan-300 text-xs transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleOpenActionModal('REJECT_INTERNSHIP', item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-950/60 border border-rose-800/80 hover:border-rose-600 text-rose-300 text-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleOpenActionModal('APPROVE_INTERNSHIP', item)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVE</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070b13] p-3 rounded-xs border border-slate-800/60 text-[11px]">
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">CATEGORY</span>
                      <span className="text-slate-200 font-semibold">{item.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">LOCATION / MODE</span>
                      <span className="text-slate-200 font-semibold">{item.location} ({item.work_mode})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">STIPEND & DURATION</span>
                      <span className="text-slate-200 font-semibold">{item.stipend} · {item.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">DEADLINE</span>
                      <span className="text-slate-200 font-semibold">
                        {new Date(item.application_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Description preview */}
                  <p className="text-slate-300 font-sans text-xs leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* Verification warning if unverified */}
                  {!isCompanyVerified && (
                    <div className="p-2.5 rounded-xs bg-amber-950/30 border border-amber-800/50 flex items-center justify-between gap-3 text-amber-300 font-sans text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>
                          <strong>Partner Company Not Verified:</strong> This posting cannot be approved until{' '}
                          <strong>{item.company_name}</strong> is verified in the company registry.
                        </span>
                      </div>
                      <Link
                        to={`/admin/companies/${item.company_id}`}
                        className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 border border-amber-700 rounded-xs text-amber-200 font-mono text-[11px] whitespace-nowrap"
                      >
                        Verify Company Profile →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
