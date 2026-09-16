import React, { useState, useEffect } from 'react';
import { Application, ApplicationStatusHistory, ProjectItem } from '../types/internship';
import { StatusBadge } from './StatusBadge';
import { ApplicationService } from '../services/applicationService';
import { 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  FileText, 
  Eye, 
  Download, 
  AlertCircle, 
  Clock, 
  GraduationCap, 
  Briefcase,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  UserCheck,
  Globe,
  Mail,
  Phone
} from 'lucide-react';

interface ApplicationDetailModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onWithdrawRequest?: (appId: string, title: string) => void;
}

const LIFECYCLE_STEPS = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'SELECTED', label: 'Selected' },
];

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  applicationId,
  isOpen,
  onClose,
  onWithdrawRequest,
}) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && applicationId) {
      setIsLoading(true);
      setErrorMsg(null);
      ApplicationService.getApplicationById(applicationId)
        .then((res) => {
          if (res.success) {
            setApplication(res.data);
          } else {
            setErrorMsg('Unable to retrieve application details.');
          }
        })
        .catch((err: any) => {
          setErrorMsg(err.message || 'Failed to load application details.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setApplication(null);
    }
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes || bytes <= 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleViewResume = () => {
    if (!applicationId) return;
    const url = ApplicationService.getApplicationResumeViewUrl(applicationId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadResume = () => {
    if (!applicationId) return;
    const url = ApplicationService.getApplicationResumeDownloadUrl(applicationId);
    const link = document.createElement('a');
    link.href = url;
    link.download = application?.resume_filename || 'application_resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isWithdrawable =
    application &&
    application.status !== 'WITHDRAWN' &&
    application.status !== 'REJECTED' &&
    application.status !== 'SELECTED' &&
    application.status !== 'ACCEPTED';

  // Calculate timeline active step index
  const getActiveStepIndex = (status: string): number => {
    switch (status) {
      case 'APPLIED':
        return 0;
      case 'UNDER_REVIEW':
        return 1;
      case 'SHORTLISTED':
        return 2;
      case 'INTERVIEW':
        return 3;
      case 'SELECTED':
      case 'ACCEPTED':
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIdx = application ? getActiveStepIndex(application.status) : -1;
  const isSpecialStatus = application?.status === 'REJECTED' || application?.status === 'WITHDRAWN';

  const getStatusBadgeVariant = (status: string) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div 
        id="application-detail-modal"
        className="relative w-full max-w-3xl bg-[#090d16] border border-cyan-800/80 rounded p-6 space-y-6 my-8 font-sans max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {isLoading ? (
          <div className="py-16 text-center font-mono text-xs text-slate-400 space-y-2">
            <Clock className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p>Loading verified application archival record...</p>
          </div>
        ) : errorMsg || !application ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <p className="text-sm font-mono text-slate-200 font-bold">Application Record Unavailable</p>
            <p className="text-xs text-slate-400">{errorMsg || 'Application could not be found.'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Modal Header */}
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge
                  label={application.status.replace('_', ' ')}
                  variant={getStatusBadgeVariant(application.status)}
                />
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                  ID: {application.id}
                </span>
                {application.internship_category && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 uppercase">
                    {application.internship_category}
                  </span>
                )}
                {application.work_mode && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {application.work_mode}
                  </span>
                )}
              </div>

              <h2 className="font-mono text-lg font-bold text-slate-100">
                {application.internship_title || 'Internship Application'}
              </h2>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  {application.company_name}
                </span>
                {application.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {application.location}
                  </span>
                )}
                {application.stipend && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    {application.stipend}
                  </span>
                )}
              </div>
            </div>

            {/* APPLICATION TIMELINE STEP PROGRESSION */}
            <div className="p-4 rounded bg-[#070b14] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 text-xs font-mono text-slate-300">
                <span className="font-bold uppercase tracking-wider text-slate-200">
                  Application Lifecycle Pipeline
                </span>
                <span className="text-[11px] text-slate-400">
                  Current Status: <strong className="text-cyan-300">{application.status.replace('_', ' ')}</strong>
                </span>
              </div>

              {!isSpecialStatus ? (
                <div className="relative pt-2 pb-1">
                  <div className="grid grid-cols-5 gap-1 text-center font-mono">
                    {LIFECYCLE_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.key} className="space-y-1.5 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              isCurrent
                                ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {isCompleted && !isCurrent ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span
                            className={`text-[10px] uppercase tracking-wider block ${
                              isCurrent
                                ? 'text-cyan-300 font-bold'
                                : isCompleted
                                ? 'text-slate-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Progress track bar */}
                  <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${Math.max(10, ((currentStepIdx + 1) / LIFECYCLE_STEPS.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="text-xs font-mono">
                    <p className="font-bold text-slate-200">
                      Application Concluded ({application.status})
                    </p>
                    <p className="text-slate-400 text-[11px] font-sans">
                      {application.status === 'WITHDRAWN'
                        ? 'This application was withdrawn by the student candidate.'
                        : 'This application review has been concluded by the recruiter.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* INTERVIEW STAGE HIGHLIGHT BOX */}
            {application.status === 'INTERVIEW' && (
              <div className="p-4 rounded bg-indigo-950/40 border border-indigo-700/60 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Calendar className="w-4 h-4" />
                  <span>CANDIDATE INTERVIEW STAGE ACTIVE</span>
                </div>
                <p className="text-slate-300 text-xs font-sans leading-relaxed">
                  The recruiter has shortlisted your profile for direct assessment. Please check your notifications, verified college email, or the notes below for meeting schedules and instructions.
                </p>
              </div>
            )}

            {/* SELECTED / OFFER HIGHLIGHT BOX */}
            {(application.status === 'SELECTED' || application.status === 'ACCEPTED') && (
              <div className="p-4 rounded bg-emerald-950/40 border border-emerald-600/60 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PLACEMENT OFFER EXTENDED</span>
                </div>
                <p className="text-slate-200 text-xs font-sans leading-relaxed">
                  Congratulations! You have been selected for this position at {application.company_name}. Please coordinate with the campus Directorate and the corporate mentor for onboarding.
                </p>
              </div>
            )}

            {/* STATUS HISTORY & AUDIT TRAIL */}
            <div className="p-4 rounded bg-[#070b14] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-cyan-400">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                  Status History &amp; Recruiter Audit Log
                </span>
              </div>

              <div className="space-y-3">
                {application.status_history && application.status_history.length > 0 ? (
                  application.status_history.map((hist, index) => (
                    <div
                      key={hist.id || index}
                      className="p-3 rounded bg-[#090d16] border border-slate-800/80 font-mono text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="font-bold text-slate-100">
                            {hist.new_status.replace('_', ' ')}
                          </span>
                          {hist.old_status && (
                            <span className="text-[10px] text-slate-500">
                              (from {hist.old_status.replace('_', ' ')})
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500">
                          {new Date(hist.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Updated by:</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                          {hist.changed_by_name || hist.changed_by_role}
                        </span>
                        <span>({hist.changed_by_role})</span>
                      </div>

                      {hist.note && (
                        <div className="pt-1.5 text-xs text-cyan-200/90 font-sans italic bg-cyan-950/20 p-2 rounded border border-cyan-900/40">
                          &quot;{hist.note}&quot;
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    No status history recorded yet. Initial submission recorded on {new Date(application.applied_at).toLocaleString()}.
                  </div>
                )}
              </div>
            </div>

            {/* ATTACHED RESUME DOCUMENT SNAPSHOT */}
            <div className="p-4 rounded bg-[#070b14] border border-cyan-900/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400">
                  <FileCheck className="w-4 h-4" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                    Application Resume Snapshot
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  IMMUTABLE SNAPSHOT
                </span>
              </div>

              {application.resume_filename ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs font-bold text-slate-200">
                      {application.resume_filename}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">
                      Size: {formatFileSize(application.resume_file_size)} • Type: {application.resume_mime_type || 'application/pdf'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleViewResume}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/70 text-cyan-200 font-mono text-xs cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadResume}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  No resume file snapshot was attached during application submission.
                </div>
              )}
            </div>

            {/* CANDIDATE ACADEMIC & PROFILE SNAPSHOT (FOR COMPANIES / AUDIT) */}
            {application.student_name && (
              <div className="p-4 rounded bg-[#070b14] border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200 font-bold uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>Applicant Profile Overview</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Candidate Name</span>
                    <span className="font-bold text-slate-100">{application.student_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Institution / College</span>
                    <span>{application.student_college || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Program &amp; Department</span>
                    <span>{application.student_degree} ({application.student_department || 'General'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Graduation / CGPA</span>
                    <span>Class of {application.student_graduation_year || 'N/A'} • CGPA: {application.student_cgpa || 'N/A'}</span>
                  </div>
                </div>

                {application.student_skills && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase mb-1">Key Verified Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {application.student_skills.split(',').map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px]">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMITTED COVER LETTER */}
            {application.cover_letter ? (
              <div className="space-y-1.5">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Submitted Cover Letter
                </h4>
                <div className="p-3.5 rounded bg-[#060911] border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                  {application.cover_letter}
                </div>
              </div>
            ) : null}

            {/* ADDITIONAL RECRUITER NOTES */}
            {application.additional_info ? (
              <div className="space-y-1.5">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Additional Information for Recruiter
                </h4>
                <div className="p-3.5 rounded bg-[#060911] border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                  {application.additional_info}
                </div>
              </div>
            ) : null}

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {isWithdrawable && onWithdrawRequest ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onWithdrawRequest(application.id, application.internship_title || 'Internship Application');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 font-mono text-xs cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Withdraw Application</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
