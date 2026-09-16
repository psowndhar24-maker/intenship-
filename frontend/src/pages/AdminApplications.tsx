import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  Briefcase
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  status: string;
  applied_at: string;
  updated_at: string;
  internship_id: string;
  internship_title: string;
  internship_category: string;
  work_mode: string;
  stipend: string;
  company_id: string;
  company_name: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_college?: string;
  student_degree?: string;
  resume_url?: string;
}

const STATUS_FILTERS = [
  { label: 'ALL STATUSES', value: 'ALL' },
  { label: 'APPLIED', value: 'APPLIED' },
  { label: 'UNDER REVIEW', value: 'UNDER_REVIEW' },
  { label: 'SHORTLISTED', value: 'SHORTLISTED' },
  { label: 'ACCEPTED', value: 'ACCEPTED' },
  { label: 'REJECTED', value: 'REJECTED' },
  { label: 'WITHDRAWN', value: 'WITHDRAWN' },
];

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminService.getApplications({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setApplications(res.data || []);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to query applications from database.');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'green';
      case 'SHORTLISTED':
        return 'cyan';
      case 'UNDER_REVIEW':
        return 'blue';
      case 'REJECTED':
      case 'WITHDRAWN':
        return 'red';
      default:
        return 'amber';
    }
  };

  return (
    <DashboardLayout pageTitle="Institutional Application Monitor" roleBadgeText="ADMIN">
      <div className="space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-sm border bg-rose-950/80 border-rose-700/60 text-rose-200 font-mono text-xs">
            {errorMessage}
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="bg-[#0b0f19]/90 border border-slate-800 p-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search candidate, role, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-sm pl-9 pr-3 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </form>

            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setStatusFilter(f.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-sm font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === f.value
                      ? 'bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="font-mono text-xs text-slate-400">
              TOTAL APPLICATIONS: <span className="text-cyan-400 font-bold">{total}</span>
            </span>

            <button
              id="btn-refresh-applications"
              onClick={() => fetchApplications()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-sm font-mono text-xs text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate Information</th>
                  <th className="py-3 px-4">Internship Posting</th>
                  <th className="py-3 px-4">Company Partner</th>
                  <th className="py-3 px-4">Work Mode & Stipend</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Applied At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Querying placement applications queue...</span>
                      </div>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-mono text-xs text-slate-500">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div>NO APPLICATIONS FOUND</div>
                      <div className="text-slate-600 text-[11px] mt-1">No candidate records match current criteria</div>
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 text-sm">{app.student_name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{app.student_email}</div>
                        <div className="text-slate-400 text-[11px]">{app.student_college || 'Unspecified College'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{app.internship_title}</div>
                        <div className="font-mono text-[11px] text-cyan-400">{app.internship_category}</div>
                        <div className="font-mono text-[10px] text-slate-500">REF: {app.internship_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.company_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div>{app.work_mode}</div>
                        <div className="text-emerald-400">{app.stipend}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge
                          label={app.status.replace('_', ' ')}
                          variant={getStatusBadgeVariant(app.status)}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                        <div>{new Date(app.applied_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">{new Date(app.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
              <div>
                PAGE {page} OF {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  id="btn-prev-page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded disabled:opacity-40"
                >
                  PREV
                </button>
                <button
                  id="btn-next-page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded disabled:opacity-40"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
