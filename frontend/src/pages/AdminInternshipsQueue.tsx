import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { Internship } from '../types/internship';
import { 
  ReasonActionModal, 
  AdminActionType 
} from '../components/admin/ReasonActionModal';
import { 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  Eye, 
  Check, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  ArrowUpDown, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Software Engineering',
  'Data Science & AI',
  'Embedded Systems',
  'Robotics & Automation',
  'Web Development',
  'Cloud Architecture',
  'Cybersecurity',
  'Product Design'
];

const STATUS_FILTERS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'PENDING APPROVAL', value: 'PENDING_APPROVAL' },
  { label: 'APPROVED', value: 'APPROVED' },
  { label: 'CHANGES REQUESTED', value: 'CHANGES_REQUESTED' },
  { label: 'REJECTED', value: 'REJECTED' },
];

export const AdminInternshipsQueue: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'created_at' | 'deadline' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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

  const fetchInternships = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getInternships({
        search,
        status: selectedStatus,
        category: selectedCategory,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });

      setInternships(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      showNotification(err.message || 'Failed to query internship directory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus, selectedCategory, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleOpenActionModal = (
    actionType: AdminActionType,
    internship: Internship
  ) => {
    let title = '';
    if (actionType === 'APPROVE_INTERNSHIP') title = 'Approve Internship Posting';
    if (actionType === 'REJECT_INTERNSHIP') title = 'Reject Internship Posting';
    if (actionType === 'REQUEST_CHANGES_INTERNSHIP') title = 'Request Revisions from Partner Company';

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
        showNotification('Internship approved and published for students.', 'success');
      } else if (actionType === 'REJECT_INTERNSHIP') {
        await adminService.rejectInternship(internshipId, reason);
        showNotification('Internship rejected.', 'success');
      } else if (actionType === 'REQUEST_CHANGES_INTERNSHIP') {
        await adminService.requestChanges(internshipId, reason);
        showNotification('Revisions requested from partner company.', 'success');
      }
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchInternships();
    } catch (err: any) {
      showNotification(err.message || 'Action failed on database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Internship Moderation Directory" roleBadgeText="ADMIN">
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

        {/* Filter Bar */}
        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search listings by title, company, or keywords..."
                className="w-full bg-[#070b13] border border-slate-700 rounded-sm pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="bg-[#070b13] border border-slate-700 rounded-sm px-3 py-2 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#070b13] border border-slate-700 rounded-sm px-3 py-2 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                <option value="created_at">Sort: Submission Date</option>
                <option value="deadline">Sort: Application Deadline</option>
                <option value="title">Sort: Title</option>
              </select>

              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2 bg-[#070b13] border border-slate-700 hover:border-slate-500 rounded-sm text-slate-300"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <button
                onClick={fetchInternships}
                disabled={isLoading}
                className="p-2 bg-[#070b13] border border-slate-700 hover:border-cyan-500 rounded-sm text-slate-300"
                title="Refresh results"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mr-1">
              STATUS FILTER:
            </span>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setSelectedStatus(s.value);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-[11px] ${
                  selectedStatus === s.value
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>
            SHOWING {internships.length} OF {total} TOTAL POSTINGS
          </span>
          <span>PAGE {page} OF {totalPages}</span>
        </div>

        {/* List of Internships */}
        {internships.length === 0 ? (
          <div className="p-12 text-center bg-[#0b0f19] border border-slate-800 rounded-sm space-y-3 font-mono text-xs">
            <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-slate-200">No Postings Match Filter Parameters</p>
            <p className="font-sans text-slate-400 text-xs">
              Try resetting your search query or selecting a different status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {internships.map((item) => {
              const isCompanyVerified = item.company_verification_status === 'VERIFIED';
              return (
                <div
                  key={item.id}
                  className="p-4 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors rounded-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/internships/${item.id}`}
                        className="text-slate-100 hover:text-cyan-300 font-bold text-sm font-sans transition-colors"
                      >
                        {item.title}
                      </Link>
                      <StatusBadge label={item.status} />
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{item.company_name}</span>
                      </span>
                      <StatusBadge
                        label={item.company_verification_status || 'PENDING'}
                        className="text-[10px]"
                      />
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] flex-wrap">
                      <span>Category: <strong className="text-slate-300">{item.category}</strong></span>
                      <span>•</span>
                      <span>Location: <strong className="text-slate-300">{item.location} ({item.work_mode})</strong></span>
                      <span>•</span>
                      <span>Duration: <strong className="text-slate-300">{item.duration}</strong></span>
                      <span>•</span>
                      <span>Stipend: <strong className="text-slate-300">{item.stipend}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {new Date(item.application_deadline).toLocaleDateString()}</span>
                      </span>
                    </div>

                    {!isCompanyVerified && (
                      <div className="text-amber-400 text-[11px] font-sans flex items-center gap-1.5 bg-amber-950/20 border border-amber-900/40 px-2 py-0.5 rounded-xs w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Company verification status is {item.company_verification_status || 'PENDING'}. Must be verified to approve.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                      to={`/admin/internships/${item.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </Link>

                    {item.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleOpenActionModal('APPROVE_INTERNSHIP', item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {item.status !== 'CHANGES_REQUESTED' && (
                      <button
                        onClick={() => handleOpenActionModal('REQUEST_CHANGES_INTERNSHIP', item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-cyan-950/60 border border-cyan-800/80 hover:border-cyan-600 text-cyan-300 text-xs transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Changes</span>
                      </button>
                    )}

                    {item.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleOpenActionModal('REJECT_INTERNSHIP', item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 text-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 font-mono text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-700 disabled:opacity-40 rounded-sm text-slate-300 hover:text-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>

            <span className="text-slate-400">
              PAGE {page} OF {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-700 disabled:opacity-40 rounded-sm text-slate-300 hover:text-slate-100 cursor-pointer"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
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
