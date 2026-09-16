import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService } from '../services/adminService';
import { AuditLog } from '../types/internship';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  UserCheck, 
  Tag
} from 'lucide-react';

const ACTION_FILTERS = [
  'ALL',
  'APPROVE_INTERNSHIP',
  'REJECT_INTERNSHIP',
  'REQUEST_CHANGES_INTERNSHIP',
  'VERIFY_COMPANY',
  'REJECT_COMPANY',
  'SUSPEND_COMPANY',
];

const ENTITY_FILTERS = [
  'ALL',
  'INTERNSHIP',
  'COMPANY',
  'USER',
];

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        search,
        action: actionFilter,
        entityType: entityFilter,
        page,
        limit: 20,
      });

      setLogs(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, entityFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <DashboardLayout pageTitle="Governance Audit Trail & Compliance" roleBadgeText="ADMIN">
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search audit trail by entity ID, admin username, or reason..."
                className="w-full bg-[#070b13] border border-slate-700 rounded-sm pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#070b13] border border-slate-700 rounded-sm px-3 py-2 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 w-full sm:w-auto"
            >
              {ACTION_FILTERS.map((a) => (
                <option key={a} value={a}>
                  Action: {a}
                </option>
              ))}
            </select>

            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#070b13] border border-slate-700 rounded-sm px-3 py-2 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 w-full sm:w-auto"
            >
              {ENTITY_FILTERS.map((e) => (
                <option key={e} value={e}>
                  Entity: {e}
                </option>
              ))}
            </select>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-2 bg-[#070b13] border border-slate-700 hover:border-cyan-500 rounded-sm text-slate-300 cursor-pointer"
              title="Refresh audit stream"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audit Stats */}
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>SHOWING {logs.length} OF {total} AUDIT EVENTS RECORDED</span>
          <span>PAGE {page} OF {totalPages}</span>
        </div>

        {/* Logs Table */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-sm overflow-hidden font-mono text-xs">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No audit records match the selected criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {logs.map((log) => {
                let meta: any = null;
                try {
                  meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                } catch {
                  meta = log.metadata;
                }

                const isActionApproval = log.action.includes('APPROVE') || log.action.includes('VERIFY');
                const isActionRejection = log.action.includes('REJECT') || log.action.includes('SUSPEND');

                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-slate-900/30 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-xs border text-[11px] font-bold tracking-wider ${
                            isActionApproval
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                              : isActionRejection
                              ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                              : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
                          }`}
                        >
                          {log.action}
                        </span>

                        <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <Tag className="w-3 h-3 text-slate-500" />
                          <span>{log.entity_type}</span>
                        </span>

                        <span className="text-slate-200 text-xs">
                          Entity ID: <code className="text-cyan-300">{log.entity_id}</code>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          <strong className="text-slate-300">{log.username || 'Admin Officer'}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </span>
                      </div>
                    </div>

                    {meta && (
                      <div className="p-2.5 bg-[#070b13] border border-slate-800/60 rounded-xs text-slate-300 font-sans text-xs">
                        {meta.reason && (
                          <div className="mb-1">
                            <span className="font-mono text-slate-500 text-[10px] uppercase block">
                              RATIONALE / FEEDBACK:
                            </span>
                            <span className="text-slate-200">{meta.reason}</span>
                          </div>
                        )}
                        {meta.previous_status && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            Transition: {meta.previous_status} → {meta.new_status}
                          </div>
                        )}
                        {!meta.reason && !meta.previous_status && (
                          <pre className="text-[11px] text-slate-400 font-mono overflow-x-auto">
                            {JSON.stringify(meta, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 font-mono text-xs">
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
    </DashboardLayout>
  );
};
