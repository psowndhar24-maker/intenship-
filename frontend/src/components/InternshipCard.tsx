import React from 'react';
import { Internship } from '../types/internship';
import { StatusBadge } from './StatusBadge';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Bookmark, 
  Send, 
  Clock, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface InternshipCardProps {
  internship: Internship;
  isSaved?: boolean;
  hasApplied?: boolean;
  isApplying?: boolean;
  isSaving?: boolean;
  onApply: (internship: Internship) => void;
  onToggleSave: (internship: Internship) => void;
  onViewDetails: (internship: Internship) => void;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  isSaved = false,
  hasApplied = false,
  isApplying = false,
  isSaving = false,
  onApply,
  onToggleSave,
  onViewDetails,
}) => {
  const isDeadlinePassed = new Date(internship.application_deadline).getTime() <= Date.now();

  const formattedDeadline = new Date(internship.application_deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      id={`internship-card-${internship.id}`}
      className="bg-[#0b101b]/85 backdrop-blur-md border border-slate-800/80 hover:border-cyan-500/50 transition-all rounded-xl p-5 flex flex-col justify-between group shadow-md hover:shadow-cyan-950/30"
    >
      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/40 text-cyan-300 font-semibold uppercase">
                {internship.category}
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {internship.work_mode}
              </span>
              {internship.is_paid && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-medium">
                  PAID
                </span>
              )}
            </div>
            <h3 className="font-mono text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mt-1">
              {internship.title}
            </h3>
          </div>

          {/* Bookmark Action */}
          <button
            id={`btn-save-${internship.id}`}
            onClick={() => onToggleSave(internship)}
            disabled={isSaving}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark internship'}
            className={`p-2 rounded border transition-colors cursor-pointer shrink-0 ${
              isSaved
                ? 'bg-amber-950/60 border-amber-600/60 text-amber-400'
                : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Company & Location Metadata */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-200 font-medium">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{internship.company_name}</span>
            {internship.company_verification_status === 'VERIFIED' && (
              <StatusBadge label="VERIFIED" variant="green" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{internship.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{internship.duration}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
          {internship.description}
        </p>

        {/* Compensation & Deadline Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">STIPEND</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {internship.stipend}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">DEADLINE</span>
            <span className={`flex items-center gap-1 ${isDeadlinePassed ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
              <Calendar className="w-3 h-3" />
              {formattedDeadline}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-3">
        <button
          id={`btn-details-${internship.id}`}
          onClick={() => onViewDetails(internship)}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>View Scope</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        <div>
          {hasApplied ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>APPLIED</span>
            </div>
          ) : isDeadlinePassed ? (
            <div className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-500 font-mono text-xs">
              DEADLINE PASSED
            </div>
          ) : (
            <button
              id={`btn-apply-${internship.id}`}
              onClick={() => onApply(internship)}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 border border-cyan-400/40 text-slate-950 font-mono text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:cursor-not-allowed"
            >
              <Send className={`w-3 h-3 ${isApplying ? 'animate-spin' : ''}`} />
              <span>{isApplying ? 'SUBMITTING...' : 'APPLY NOW'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
