import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { AdminDashboardStats, Internship } from '../types/internship';
import { 
  ReasonActionModal, 
  AdminActionType 
} from '../components/admin/ReasonActionModal';
import {
  externalInternshipService,
  ExternalStatusResponse,
  SyncStatsResult
} from '../services/externalInternshipService';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check,
  XCircle,
  Eye,
  Globe,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal action state
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
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // External Internship API Integration State
  const [externalStatus, setExternalStatus] = useState<ExternalStatusResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStatsResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchExternalStatus = useCallback(async () => {
    try {
      const data = await externalInternshipService.getStatus();
      setExternalStatus(data);
    } catch {
      setExternalStatus({
        status: 'UNAVAILABLE',
        providerName: 'ExternalProvider',
        lastSyncTime: null,
        syncEnabled: false,
        syncIntervalMinutes: 360,
      });
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch administrative governance statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchExternalStatus();
  }, [fetchDashboardData, fetchExternalStatus]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncCompleted(false);
    setSyncError(null);
    try {
      const res = await externalInternshipService.triggerAdminSync();
      setSyncResult(res);
      setSyncCompleted(true);
      showNotification('External internship synchronization completed', 'success');
      await fetchDashboardData();
      await fetchExternalStatus();
    } catch (err: any) {
      const errorMsg = err.message || 'External internship service is currently unavailable.';
      setSyncError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenActionModal = (
    actionType: AdminActionType,
    internship: Internship
  ) => {
    let title = '';
    switch (actionType) {
      case 'APPROVE_INTERNSHIP':
        title = 'Approve Internship for Public Discovery';
        break;
      case 'REJECT_INTERNSHIP':
        title = 'Reject Internship Posting';
        break;
      case 'REQUEST_CHANGES_INTERNSHIP':
        title = 'Request Revisions from Partner Company';
        break;
    }

    setModalState({
      isOpen: true,
      actionType,
      title,
      itemTitle: `${internship.title} — ${internship.company_name}`,
      internshipId: internship.id,
    });
  };

  const handleConfirmAction = async (reason: string) => {
    setIsSubmittingAction(true);
    try {
      const { actionType, internshipId } = modalState;
      if (actionType === 'APPROVE_INTERNSHIP') {
        await adminService.approveInternship(internshipId, reason);
        showNotification('Internship successfully approved and published for students.', 'success');
      } else if (actionType === 'REJECT_INTERNSHIP') {
        await adminService.rejectInternship(internshipId, reason);
        showNotification('Internship rejected.', 'success');
      } else if (actionType === 'REQUEST_CHANGES_INTERNSHIP') {
        await adminService.requestChanges(internshipId, reason);
        showNotification('Revisions requested from partner company.', 'success');
      }
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchDashboardData();
    } catch (err: any) {
      showNotification(err.message || 'Action failed to execute on database.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Placement Directorate Governance Center" roleBadgeText="ADMIN">
      <div className="space-y-6">
        {/* Notification Banner */}
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

        {/* Quick Navigation Action Strip */}
        <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-slate-200 font-bold uppercase tracking-wider block">
                DIRECTORATE COMMAND MATRIX
              </span>
              <span className="text-slate-400 text-[11px] font-sans">
                PostgreSQL Engine &amp; Placement Quality Control Enforced
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/admin/internships/pending"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-950/60 border border-amber-700/60 hover:border-amber-500 text-amber-300 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue ({stats?.pendingInternships ?? 0})</span>
            </Link>

            <Link
              to="/admin/internships"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>All Postings ({stats?.totalInternships ?? 0})</span>
            </Link>

            <Link
              to="/admin/companies"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Companies ({stats?.totalCompanies ?? 0})</span>
            </Link>

            <Link
              to="/admin/audit-logs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </Link>

            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-cyan-600 text-slate-300 cursor-pointer transition-colors"
              title="Refresh database metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Visual Directorate Governance Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-r from-[#0c1422]/90 via-[#0a111e]/80 to-[#070d18]/90 backdrop-blur-md shadow-xl p-5 sm:p-6">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 sm:opacity-35 pointer-events-none overflow-hidden hidden sm:block">
            <img
              src="/images/internhub-dashboard-bg.webp"
              alt="Placement Directorate Hub"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1422] via-[#0c1422]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[11px] font-mono text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>CENTRAL CAREER &amp; PLACEMENT DIRECTORATE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Institutional Governance &amp; Moderation Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Enforce university standards, review corporate postings, audit application workflows, and monitor campus-wide internship placement metrics.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap font-mono text-[11px] text-slate-400">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Placement Quality Assurance Enforced</span>
              </span>
              <span>•</span>
              <span className="text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{stats?.pendingInternships ?? 0} Listings Pending Approval</span>
              </span>
            </div>
          </div>
        </div>

        {/* Real Database Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="PENDING MODERATION"
            value={stats?.pendingInternships ?? 0}
            subtext="Postings awaiting directorate review"
            status={stats && stats.pendingInternships > 0 ? 'ATTENTION' : 'CLEAR'}
            indicatorColor="amber"
            icon={<Clock className="w-4 h-4 text-amber-400" />}
          />

          <MetricCard
            label="ACTIVE PUBLIC POSTINGS"
            value={stats?.approvedInternships ?? 0}
            subtext="Approved & live for student applications"
            status="PUBLISHED"
            indicatorColor="green"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />

          <MetricCard
            label="CHANGES REQUESTED"
            value={stats?.changesRequested ?? 0}
            subtext="Awaiting partner updates"
            status="REVISION"
            indicatorColor="cyan"
            icon={<AlertTriangle className="w-4 h-4 text-cyan-400" />}
          />

          <MetricCard
            label="REJECTED POSTINGS"
            value={stats?.rejectedInternships ?? 0}
            subtext="Non-compliant listings blocked"
            status="BLOCKED"
            indicatorColor="slate"
            icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
          />

          <MetricCard
            label="CORPORATE PARTNERS"
            value={stats?.totalCompanies ?? 0}
            subtext={`${stats?.verifiedCompanies ?? 0} Verified · ${stats?.pendingCompanies ?? 0} Pending`}
            status="REGISTRY"
            indicatorColor="blue"
            icon={<Building2 className="w-4 h-4 text-blue-400" />}
          />

          <MetricCard
            label="PENDING COMPANIES"
            value={stats?.pendingCompanies ?? 0}
            subtext="MoU / verification unconfirmed"
            status={stats && stats.pendingCompanies > 0 ? 'PENDING' : 'VERIFIED'}
            indicatorColor={stats && stats.pendingCompanies > 0 ? 'amber' : 'green'}
            icon={<Building2 className="w-4 h-4 text-amber-400" />}
          />

          <MetricCard
            label="STUDENT APPLICATIONS"
            value={stats?.totalApplications ?? 0}
            subtext="Campus application records"
            status="MONITORED"
            indicatorColor="slate"
            icon={<Briefcase className="w-4 h-4 text-cyan-400" />}
          />

          <MetricCard
            label="DATABASE SYSTEM"
            value="ONLINE"
            subtext="PostgreSQL RBAC & Audit Active"
            status="READY"
            indicatorColor="green"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          />
        </div>

        {/* External Internship API & Safe Data Sync Management Console */}
        <div id="external-api-console" className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl shadow-lg space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                  EXTERNAL INTERNSHIP API &amp; SAFE DATA SYNC
                </h2>
              </div>
              <p className="text-slate-400 font-sans text-xs mt-0.5">
                Supplementary provider pipeline. Institutional moderation strictly preserved: all imported listings stage into PENDING_APPROVAL.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-[#070b13] border border-slate-800 px-3 py-1.5 rounded-sm">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">STATUS:</span>
                <span
                  id="external-api-status-badge"
                  className={`font-bold flex items-center gap-1.5 ${
                    externalStatus?.status === 'CONFIGURED'
                      ? 'text-emerald-400'
                      : externalStatus?.status === 'UNAVAILABLE'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      externalStatus?.status === 'CONFIGURED'
                        ? 'bg-emerald-400 animate-pulse'
                        : externalStatus?.status === 'UNAVAILABLE'
                        ? 'bg-rose-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  {externalStatus?.status ? `STATUS: ${externalStatus.status}` : 'STATUS: CHECKING...'}
                </span>
              </div>

              <button
                id="sync-external-internships-btn"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-bold text-xs transition-colors cursor-pointer ${
                  isSyncing
                    ? 'bg-cyan-950/80 border border-cyan-700 text-cyan-300 cursor-wait'
                    : syncCompleted
                    ? 'bg-emerald-900/80 border border-emerald-600 text-emerald-200 hover:bg-emerald-800'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-sm'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Syncing...' : syncCompleted ? 'Sync completed' : 'SYNC EXTERNAL INTERNSHIPS'}
                </span>
              </button>
            </div>
          </div>

          {/* Technical Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070b13] p-3 rounded-sm border border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Active Provider</span>
              <span className="text-slate-300 font-bold">{externalStatus?.providerName || 'ConfiguredExternalProvider'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Last Synchronized</span>
              <span className="text-slate-300">
                {externalStatus?.lastSyncTime ? new Date(externalStatus.lastSyncTime).toLocaleString() : 'Never synced'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Scheduled Auto-Sync</span>
              <span className={externalStatus?.syncEnabled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {externalStatus?.syncEnabled ? `ENABLED (${externalStatus.syncIntervalMinutes}m)` : 'DISABLED (manual control)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Moderation Policy</span>
              <span className="text-cyan-400 font-mono">Enforced (PENDING_APPROVAL)</span>
            </div>
          </div>

          {/* Real Sync Summary Output */}
          {syncResult && (
            <div id="sync-summary-card" className="bg-[#070b13] border border-cyan-900/60 p-4 rounded-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-cyan-300 text-xs pb-2 border-b border-slate-800/80">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Sync completed successfully ({new Date(syncResult.timestamp).toLocaleTimeString()})
                </span>
                <span className="text-slate-400 text-[11px] font-sans italic">{syncResult.message}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
                <div className="p-2.5 rounded-xs bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase tracking-wider">Fetched</div>
                  <div className="text-lg font-bold text-slate-100">{syncResult.fetched}</div>
                </div>
                <div className="p-2.5 rounded-xs bg-emerald-950/40 border border-emerald-800/60">
                  <div className="text-emerald-400 text-[10px] uppercase tracking-wider">Imported</div>
                  <div className="text-lg font-bold text-emerald-300">{syncResult.imported}</div>
                </div>
                <div className="p-2.5 rounded-xs bg-cyan-950/40 border border-cyan-800/60">
                  <div className="text-cyan-400 text-[10px] uppercase tracking-wider">Updated</div>
                  <div className="text-lg font-bold text-cyan-300">{syncResult.updated}</div>
                </div>
                <div className="p-2.5 rounded-xs bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase tracking-wider">Skipped</div>
                  <div className="text-lg font-bold text-slate-300">{syncResult.skipped}</div>
                </div>
                <div className="p-2.5 rounded-xs bg-rose-950/40 border border-rose-800/60">
                  <div className="text-rose-400 text-[10px] uppercase tracking-wider">Failed</div>
                  <div className="text-lg font-bold text-rose-300">{syncResult.failed}</div>
                </div>
              </div>
            </div>
          )}

          {syncError && (
            <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-sm text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}
        </div>

        {/* Priority Pending Moderation Queue */}
        <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl shadow-lg space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                  Priority Moderation Queue (PENDING_APPROVAL)
                </h2>
              </div>
              <p className="text-slate-400 font-sans text-xs mt-0.5">
                Submissions awaiting institutional vetting before appearing in Student Discovery.
              </p>
            </div>

            <Link
              to="/admin/internships/pending"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-xs"
            >
              <span>View Full Pending Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!stats?.pendingInternshipsList || stats.pendingInternshipsList.length === 0 ? (
            <div className="p-8 text-center bg-[#070b13] border border-slate-800/80 rounded-sm text-slate-400 space-y-2">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500" />
              <p className="font-bold text-slate-200">No Postings Awaiting Review</p>
              <p className="font-sans text-xs">All submitted company listings have been audited.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.pendingInternshipsList.map((item) => {
                const isCompanyVerified = item.company_verification_status === 'VERIFIED';
                return (
                  <div
                    key={item.id}
                    id={`pending-row-${item.id}`}
                    className="p-4 rounded-sm bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/admin/internships/${item.id}`}
                          className="font-bold text-slate-100 hover:text-cyan-300 transition-colors text-sm font-sans truncate"
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
                        <span>Work Mode: <strong className="text-slate-300">{item.work_mode}</strong></span>
                        <span>•</span>
                        <span>Stipend: <strong className="text-slate-300">{item.stipend}</strong></span>
                        <span>•</span>
                        <span>
                          Deadline: {new Date(item.application_deadline).toLocaleDateString()}
                        </span>
                      </div>

                      {!isCompanyVerified && (
                        <div className="text-amber-400 text-[11px] font-sans flex items-center gap-1.5 mt-1 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-xs">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Company verification required before approval. (Current: {item.company_verification_status || 'PENDING'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Link
                        to={`/admin/internships/${item.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>

                      <button
                        onClick={() => handleOpenActionModal('REQUEST_CHANGES_INTERNSHIP', item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-cyan-950/60 border border-cyan-800/80 hover:border-cyan-600 text-cyan-300 text-xs transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Changes</span>
                      </button>

                      <button
                        onClick={() => handleOpenActionModal('REJECT_INTERNSHIP', item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-rose-950/60 border border-rose-800/80 hover:border-rose-600 text-rose-300 text-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleOpenActionModal('APPROVE_INTERNSHIP', item)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVE</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Audit Log Feed */}
        <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl shadow-lg space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Directorate Governance Audit Stream
              </h2>
              <p className="text-slate-400 font-sans text-xs mt-0.5">
                Cryptographically tracked administrative review and verification events.
              </p>
            </div>

            <Link
              to="/admin/audit-logs"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-xs"
            >
              <span>Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!stats?.recentAuditLogs || stats.recentAuditLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-[#070b13] border border-slate-800/80 rounded-sm">
              No audit records generated yet.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentAuditLogs.map((log) => {
                let parsedMeta: any = {};
                try {
                  parsedMeta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                } catch {
                  parsedMeta = { raw: log.metadata };
                }

                return (
                  <div
                    key={log.id}
                    className="p-3 bg-[#070b13] border border-slate-800/80 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-400 rounded-xs text-[10px] uppercase font-bold">
                        {log.action}
                      </span>
                      <span className="text-slate-300 font-sans text-xs">
                        Entity: <strong className="text-slate-100 font-mono">{log.entity_id}</strong>
                      </span>
                      {parsedMeta?.reason && (
                        <span className="text-slate-400 text-[11px] font-sans italic">
                          "{parsedMeta.reason}"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>By: <strong className="text-slate-400">{log.username || 'admin'}</strong></span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
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
        isSubmitting={isSubmittingAction}
      />
    </DashboardLayout>
  );
};
