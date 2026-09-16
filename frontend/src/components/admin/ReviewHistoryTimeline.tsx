import React from 'react';
import { AdminReview } from '../../types/internship';
import { StatusBadge } from '../StatusBadge';
import { Clock, UserCheck, MessageSquare } from 'lucide-react';

interface ReviewHistoryTimelineProps {
  reviews: AdminReview[];
  isLoading?: boolean;
}

export const ReviewHistoryTimeline: React.FC<ReviewHistoryTimelineProps> = ({
  reviews,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-slate-500 font-mono text-xs">
        Loading review audit records...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-5 text-center bg-[#070b13] border border-slate-800/80 rounded-sm font-mono text-xs text-slate-400">
        No administrative reviews recorded yet. This listing is pending initial review.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono text-xs">
      {reviews.map((rev) => (
        <div
          key={rev.id}
          className="p-3.5 bg-[#070b13] border border-slate-800 rounded-sm space-y-2"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge label={rev.action} />
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin: <strong className="text-slate-200">{rev.admin_username || 'Directorate Officer'}</strong></span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{new Date(rev.created_at).toLocaleString()}</span>
            </div>
          </div>

          {rev.reason && (
            <div className="p-2.5 bg-[#0b0f19] border border-slate-800/80 rounded-xs text-slate-300 font-sans text-xs flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{rev.reason}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
