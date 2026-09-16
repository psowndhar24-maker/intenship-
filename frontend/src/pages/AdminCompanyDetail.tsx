import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { CompanyItem } from '../types/internship';
import { 
  ReasonActionModal, 
  AdminActionType 
} from '../components/admin/ReasonActionModal';
import { 
  Building2, 
  MapPin, 
  Mail, 
  ExternalLink, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft, 
  Check, 
  XCircle, 
  Ban, 
  Eye, 
  Briefcase
} from 'lucide-react';

export const AdminCompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [company, setCompany] = useState<CompanyItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: AdminActionType;
    title: string;
    itemTitle: string;
  }>({
    isOpen: false,
    actionType: 'VERIFY_COMPANY',
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

  const fetchCompany = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await adminService.getCompanyById(id);
      setCompany(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch company profile', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleOpenAction = (actionType: AdminActionType) => {
    if (!company) return;
    let title = '';
    if (actionType === 'VERIFY_COMPANY') title = 'Verify Corporate Partner Credentials';
    if (actionType === 'REJECT_COMPANY') title = 'Reject Corporate Partner Registration';
    if (actionType === 'SUSPEND_COMPANY') title = 'Suspend Corporate Partner Access';

    setModalState({
      isOpen: true,
      actionType,
      title,
      itemTitle: company.company_name,
    });
  };

  const handleConfirmAction = async (reason: string) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const { actionType } = modalState;
      if (actionType === 'VERIFY_COMPANY') {
        await adminService.verifyCompany(id, reason);
        showNotification('Company verified successfully.', 'success');
      } else if (actionType === 'REJECT_COMPANY') {
        await adminService.rejectCompany(id, reason);
        showNotification('Company rejected.', 'success');
      } else if (actionType === 'SUSPEND_COMPANY') {
        await adminService.suspendCompany(id, reason);
        showNotification('Company suspended.', 'success');
      }
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchCompany();
    } catch (err: any) {
      showNotification(err.message || 'Action failed on database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Loading Partner Profile" roleBadgeText="ADMIN">
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading company records...
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout pageTitle="Company Not Found" roleBadgeText="ADMIN">
        <div className="p-12 text-center bg-[#0b0f19] border border-slate-800 rounded-sm font-mono text-xs text-rose-400">
          Company record not found in registry.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={`Partner: ${company.company_name}`} roleBadgeText="ADMIN">
      <div className="space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/companies"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-mono text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Corporate Registry</span>
          </Link>

          <span className="font-mono text-xs text-slate-500">
            COMPANY_ID: <strong className="text-slate-300">{company.id}</strong>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-100">
              DISMISS
            </button>
          </div>
        )}

        {/* Company Overview Header Card */}
        <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Building2 className="w-6 h-6 text-cyan-400" />
                <h1 className="text-xl font-bold font-sans text-slate-100">{company.company_name}</h1>
                <StatusBadge label={company.verification_status} />
              </div>

              <div className="flex items-center gap-3 text-slate-400 font-sans text-xs flex-wrap">
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{company.location}</span>
                  </span>
                )}
                {company.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{company.email}</span>
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <span>{company.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Moderation Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {company.verification_status !== 'VERIFIED' && (
                <button
                  onClick={() => handleOpenAction('VERIFY_COMPANY')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>VERIFY PARTNER</span>
                </button>
              )}

              {company.verification_status !== 'REJECTED' && (
                <button
                  onClick={() => handleOpenAction('REJECT_COMPANY')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 text-xs cursor-pointer transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              )}

              {company.verification_status !== 'SUSPENDED' && (
                <button
                  onClick={() => handleOpenAction('SUSPEND_COMPANY')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-rose-950/60 border border-rose-800/80 hover:border-rose-600 text-rose-300 text-xs cursor-pointer transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="p-4 bg-[#070b13] border border-slate-800/80 rounded-xs text-slate-200 font-sans text-xs leading-relaxed">
              {company.description}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 text-[11px] pt-1">
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">TOTAL INTERNSHIPS</span>
              <span className="text-slate-200 font-bold font-sans text-sm">
                {company.internships?.length ?? 0}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">REGISTERED AT</span>
              <span className="text-slate-200 font-sans">
                {new Date(company.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">LAST UPDATED</span>
              <span className="text-slate-200 font-sans">
                {new Date(company.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Company's Internship Postings List */}
        <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Internship Postings by {company.company_name} ({company.internships?.length ?? 0})
              </h2>
            </div>
          </div>

          {!company.internships || company.internships.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-[#070b13] border border-slate-800/80 rounded-sm">
              This partner company has not submitted any internship listings yet.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {company.internships.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/internships/${item.id}`}
                        className="font-bold text-slate-100 hover:text-cyan-300 font-sans text-sm transition-colors"
                      >
                        {item.title}
                      </Link>
                      <StatusBadge label={item.status} />
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] flex-wrap">
                      <span>Category: <strong className="text-slate-300">{item.category}</strong></span>
                      <span>•</span>
                      <span>Stipend: <strong className="text-slate-300">{item.stipend}</strong></span>
                      <span>•</span>
                      <span>Deadline: {new Date(item.application_deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    to={`/admin/internships/${item.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-sm text-slate-200 text-xs transition-colors shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Dossier</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
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
