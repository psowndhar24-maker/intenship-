import React, { useState, useEffect } from 'react';
import { Internship, StudentProfile, StudentDocument } from '../types/internship';
import { StatusBadge } from './StatusBadge';
import { ResumeUploadCard } from './ResumeUploadCard';
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Send, 
  Bookmark,
  Briefcase,
  GraduationCap,
  Globe,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  FileText
} from 'lucide-react';

interface InternshipModalProps {
  internship: Internship | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  hasApplied?: boolean;
  isApplying?: boolean;
  studentProfile?: StudentProfile | null;
  studentResume?: StudentDocument | null;
  onUploadResumeSuccess?: (doc: StudentDocument) => void;
  onApply: (internship: Internship, options?: { coverLetter?: string; additionalInfo?: string }) => void;
  onToggleSave: (internship: Internship) => void;
  onViewApplication?: () => void;
}

export const InternshipModal: React.FC<InternshipModalProps> = ({
  internship,
  isOpen,
  onClose,
  isSaved = false,
  hasApplied = false,
  isApplying = false,
  studentProfile = null,
  studentResume = null,
  onUploadResumeSuccess,
  onApply,
  onToggleSave,
  onViewApplication,
}) => {
  const [modalStep, setModalStep] = useState<'OVERVIEW' | 'APPLY'>('OVERVIEW');
  const [coverLetter, setCoverLetter] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset internal step when modal opens/closes or internship changes
  useEffect(() => {
    if (isOpen) {
      setModalStep('OVERVIEW');
      setCoverLetter('');
      setAdditionalInfo('');
      setIsConfirmed(false);
    }
  }, [isOpen, internship?.id]);

  if (!isOpen || !internship) return null;

  const isDeadlinePassed = new Date(internship.application_deadline).getTime() <= Date.now();
  const formattedDeadline = new Date(internship.application_deadline).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentResume) {
      return;
    }
    if (!isConfirmed) {
      return;
    }

    onApply(internship, {
      coverLetter: coverLetter.trim() || undefined,
      additionalInfo: additionalInfo.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="internship-details-modal"
        className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-800/60 rounded shadow-2xl p-6 space-y-6 my-8"
      >
        {/* Close Button */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: INTERNSHIP OVERVIEW */}
        {modalStep === 'OVERVIEW' && (
          <>
            {/* Modal Header */}
            <div className="space-y-2 pr-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-semibold uppercase">
                  {internship.category}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {internship.work_mode}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {internship.internship_type}
                </span>
                {internship.is_paid && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 font-medium">
                    PAID STIPEND
                  </span>
                )}
              </div>

              <h2 className="font-mono text-xl font-bold text-slate-100 mt-2">
                {internship.title}
              </h2>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>{internship.company_name}</span>
                  {internship.company_verification_status === 'VERIFIED' && (
                    <StatusBadge label="VERIFIED RECRUITER" variant="green" />
                  )}
                </div>
                {internship.company_website && (
                  <a
                    href={internship.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{internship.location}</span>
                </div>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded bg-[#0c121f] border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">STIPEND</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {internship.stipend}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">DURATION</span>
                <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {internship.duration}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">EXPERIENCE</span>
                <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  {internship.experience_level || 'Entry-level'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">DEADLINE</span>
                <span className={`font-semibold flex items-center gap-1 mt-0.5 ${isDeadlinePassed ? 'text-rose-400' : 'text-slate-200'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDeadline}
                </span>
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-4 text-xs font-sans text-slate-300 max-h-96 overflow-y-auto pr-1 leading-relaxed">
              <div>
                <h4 className="font-mono text-xs font-bold text-slate-200 uppercase mb-1.5 tracking-wider">
                  About The Role &amp; Project Overview
                </h4>
                <p className="whitespace-pre-line bg-[#060910] p-3 rounded border border-slate-900">
                  {internship.description}
                </p>
              </div>

              {internship.responsibilities && (
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-200 uppercase mb-1.5 tracking-wider">
                    Key Responsibilities &amp; Deliverables
                  </h4>
                  <p className="whitespace-pre-line bg-[#060910] p-3 rounded border border-slate-900">
                    {internship.responsibilities}
                  </p>
                </div>
              )}

              {internship.eligibility && (
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-200 uppercase mb-1.5 tracking-wider">
                    Eligibility &amp; Desired Skillset
                  </h4>
                  <p className="whitespace-pre-line bg-[#060910] p-3 rounded border border-slate-900">
                    {internship.eligibility}
                  </p>
                </div>
              )}

              {internship.benefits && (
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-200 uppercase mb-1.5 tracking-wider">
                    Benefits &amp; Learning Opportunities
                  </h4>
                  <p className="whitespace-pre-line bg-[#060910] p-3 rounded border border-slate-900">
                    {internship.benefits}
                  </p>
                </div>
              )}

              {internship.selection_process && (
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-200 uppercase mb-1.5 tracking-wider">
                    Evaluation &amp; Selection Protocol
                  </h4>
                  <p className="whitespace-pre-line bg-[#060910] p-3 rounded border border-slate-900">
                    {internship.selection_process}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => onToggleSave(internship)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded border font-mono text-xs font-semibold cursor-pointer transition-colors ${
                  isSaved
                    ? 'bg-amber-950/70 border-amber-600/70 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-300' : ''}`} />
                <span>{isSaved ? 'BOOKMARKED' : 'BOOKMARK INTERNSHIP'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  CLOSE
                </button>

                {hasApplied ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>APPLIED</span>
                    </div>
                    {onViewApplication && (
                      <button
                        onClick={onViewApplication}
                        className="px-3 py-2 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-700 text-cyan-300 font-mono text-xs cursor-pointer"
                      >
                        View Submission
                      </button>
                    )}
                  </div>
                ) : isDeadlinePassed ? (
                  <div className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-slate-500 font-mono text-xs font-semibold">
                    DEADLINE PASSED
                  </div>
                ) : (
                  <button
                    id="btn-apply-modal"
                    onClick={() => setModalStep('APPLY')}
                    className="flex items-center gap-2 px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-slate-950 font-mono text-xs font-bold cursor-pointer transition-colors shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>APPLY NOW</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* STEP 2: APPLICATION FORM & SUBMISSION FLOW */}
        {modalStep === 'APPLY' && (
          <form onSubmit={handleSubmitApplication} className="space-y-5 font-sans">
            {/* Header with Back button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 pr-10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalStep('OVERVIEW')}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="Back to details"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-mono text-sm font-bold text-slate-100 uppercase">
                    Submit Application
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-sm">
                    {internship.title} • {internship.company_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Profile Summary Snapshot */}
            {studentProfile && (
              <div className="p-3.5 rounded bg-[#070b14] border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase border-b border-slate-800/80 pb-1">
                  <span>Candidate Snapshot</span>
                  <span className="text-cyan-400">Institutional Profile</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CANDIDATE</span>
                    <span className="text-slate-200 font-semibold">{studentProfile.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ACADEMIC INSTITUTION</span>
                    <span className="text-slate-200 truncate block">{studentProfile.college || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROGRAM &amp; CGPA</span>
                    <span className="text-slate-200">
                      {studentProfile.degree || 'Degree'} {studentProfile.cgpa ? `(CGPA: ${studentProfile.cgpa})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">KEY PROFICIENCIES</span>
                    <span className="text-slate-200 truncate block">{studentProfile.skills || 'General'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resume / CV Section */}
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold block">
                Primary Resume Document *
              </label>

              {studentResume ? (
                <div className="p-3.5 rounded bg-[#070b14] border border-cyan-900/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-200 block truncate max-w-xs">
                        {studentResume.original_filename}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Verified document snapshot will be archived with this application
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                    ATTACHED
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded bg-amber-950/50 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>You must upload a verified resume (PDF/DOC/DOCX) before submitting your application.</span>
                  </div>
                  <ResumeUploadCard
                    resume={null}
                    compact={true}
                    onUploadSuccess={(doc) => {
                      if (onUploadResumeSuccess) {
                        onUploadResumeSuccess(doc);
                      }
                    }}
                    onDeleteSuccess={() => {}}
                  />
                </div>
              )}
            </div>

            {/* Optional Cover Letter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
                  Cover Letter / Statement of Purpose
                </label>
                <span className="font-mono text-[10px] text-slate-500">OPTIONAL</span>
              </div>
              <textarea
                rows={4}
                placeholder="Introduce yourself, explain why you are interested in this role at this company, and highlight your most relevant projects or achievements..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs leading-relaxed"
              />
            </div>

            {/* Optional Additional Information */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
                  Additional Notes for Recruiter
                </label>
                <span className="font-mono text-[10px] text-slate-500">OPTIONAL</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Earliest start date, work authorization, preferred weekly hours..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            {/* Accuracy Confirmation Checkbox */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  id="checkbox-confirm-accuracy"
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="leading-snug">
                  I confirm that my candidate profile credentials, academic standing, and attached resume are accurate and true to the best of my knowledge.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalStep('OVERVIEW')}
                className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                Back to Overview
              </button>

              <button
                id="btn-confirm-apply"
                type="submit"
                disabled={isApplying || !studentResume || !isConfirmed}
                className="flex items-center gap-2 px-6 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 border border-cyan-400 text-slate-950 font-mono text-xs font-bold cursor-pointer transition-colors shadow-md disabled:cursor-not-allowed"
              >
                <Send className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
                <span>{isApplying ? 'SUBMITTING APPLICATION...' : 'CONFIRM & SUBMIT APPLICATION'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

