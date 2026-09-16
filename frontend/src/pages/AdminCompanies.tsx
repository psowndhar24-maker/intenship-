import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Ban, 
  ExternalLink, 
  Mail, 
  MapPin, 
  Eye, 
  Check, 
  XCircle,
  Briefcase
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'PENDING', value: 'PENDING' },
  { label: 'VERIFIED', value: 'VERIFIED' },
  { label: 'REJECTED', value: 'REJECTED' },
  { label: 'SUSPENDED', value: 'SUSPENDED' },
];

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: AdminActionType;
    title: string;
    itemTitle: string;
    companyId: string;
  }>({
    isOpen: false,
    actionType: 'VERIFY_COMPANY',
    title: '',
    itemTitle: '',
    companyId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getCompanies({
        search,
        status: statusFilter,
        page,
        limit: 20,
      });
      setCompanies(res.data);
      setTotal(res.pagination.total);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch companies registry', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenAction = (actionType: AdminActionType, company: CompanyItem) => {
    let title = '';
    if (actionType === 'VERIFY_COMPANY') title = 'Verify Corporate Partner Credentials';
    if (actionType === 'REJECT_COMPANY') title = 'Reject Corporate Partner Registration';
    if (actionType === 'SUSPEND_COMPANY') title = 'Suspend Corporate Partner Access';

    setModalState({
      isOpen: true,
      actionType,
      title,
      itemTitle: company.company_name,
      companyId: company.id,
    });
  };

  const handleConfirmAction = async (reason: string) => {
    setIsSubmitting(true);
    try {
      const { actionType, companyId } = modalState;
      if (actionType === 'VERIFY_COMPANY') {
        await adminService.verifyCompany(companyId, reason);
        showNotification('Company verified successfully.', 'success');
      } else if (actionType === 'REJECT_COMPANY') {
        await adminService.rejectCompany(companyId, reason);
        showNotification('Company rejected.', 'success');
      } else if (actionType === 'SUSPEND_COMPANY') {
        await adminService.suspendCompany(companyId, reason);
        showNotification('Company suspended.', 'success');
      }
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchCompanies();
    } catch (err: any) {
      showNotification(err.message || 'Action failed on database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Corporate Partner Registry & Verification" roleBadgeText="ADMIN">
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

        {/* Filter bar */}
        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search companies by name, email, or headquarters location..."
                className="w-full bg-[#070b13] border border-slate-700 rounded-sm pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <button
              onClick={fetchCompanies}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 rounded-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mr-1">
              STATUS FILTER:
            </span>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setStatusFilter(s.value);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-[11px] ${
                  statusFilter === s.value
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Total stats info */}
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>SHOWING {companies.length} OF {total} PARTNER COMPANIES</span>
        </div>

        {/* Company Cards Grid */}
        {companies.length === 0 ? (
          <div className="p-12 text-center bg-[#0b0f19] border border-slate-800 rounded-sm space-y-2 font-mono text-xs">
            <Building2 className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-slate-200">No Companies Found</p>
            <p className="text-slate-400 font-sans text-xs">No corporate entities match the current query filter.</p>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {companies.map((c) => (
              <div
                key={c.id}
                className="p-5 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors rounded-sm space-y-3"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        to={`/admin/companies/${c.id}`}
                        className="font-bold text-base text-slate-100 hover:text-cyan-300 font-sans transition-colors"
                      >
                        {c.company_name}
                      </Link>
                      <StatusBadge label={c.verification_status} />
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-900 border border-slate-700 text-slate-300 text-[11px]">
                        <Briefcase className="w-3 h-3 text-cyan-400" />
                        <span>{c.internship_count ?? 0} listings</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-xs font-sans flex-wrap">
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{c.location}</span>
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{c.email}</span>
                        </span>
                      )}
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <span>{c.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span>Registered: {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/admin/companies/${c.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Company Profile</span>
                    </Link>

                    {c.verification_status !== 'VERIFIED' && (
                      <button
                        onClick={() => handleOpenAction('VERIFY_COMPANY', c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>VERIFY</span>
                      </button>
                    )}

                    {c.verification_status !== 'REJECTED' && (
                      <button
                        onClick={() => handleOpenAction('REJECT_COMPANY', c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 text-xs cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {c.verification_status !== 'SUSPENDED' && (
                      <button
                        onClick={() => handleOpenAction('SUSPEND_COMPANY', c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-rose-950/60 border border-rose-800/80 hover:border-rose-600 text-rose-300 text-xs cursor-pointer transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </button>
                    )}
                  </div>
                </div>

                {c.description && (
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>
            ))}
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
