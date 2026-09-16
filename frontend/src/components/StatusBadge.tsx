import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'cyan' | 'green' | 'blue' | 'amber' | 'slate' | 'red' | 'purple' | 'emerald';
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant,
  pulse = false,
  className = '',
}) => {
  // Auto-resolve color variant if not explicitly provided
  const resolvedVariant: 'cyan' | 'green' | 'blue' | 'amber' | 'slate' | 'red' | 'purple' | 'emerald' = variant || (() => {
    switch (label.toUpperCase()) {
      case 'APPROVED':
      case 'VERIFIED':
      case 'ACTIVE':
      case 'SELECTED':
      case 'ACCEPTED':
        return 'green';
      case 'INTERVIEW':
        return 'purple';
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'UNDER_REVIEW':
        return 'amber';
      case 'CHANGES_REQUESTED':
        return 'cyan';
      case 'SHORTLISTED':
        return 'emerald';
      case 'REJECTED':
      case 'SUSPENDED':
      case 'WITHDRAWN':
        return 'red';
      case 'CLOSED':
      case 'EXPIRED':
      case 'DRAFT':
      default:
        return 'slate';
    }
  })();

  const variantStyles = {
    cyan: 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60',
    emerald: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60',
    green: 'bg-green-950/40 text-green-400 border-green-800/60',
    blue: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
    amber: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
    purple: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60',
    red: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
    slate: 'bg-slate-900/60 text-slate-400 border-slate-700/60',
  };

  const pipStyles = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    green: 'bg-green-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    purple: 'bg-indigo-400',
    red: 'bg-rose-400',
    slate: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border font-mono text-[11px] font-medium tracking-wider uppercase ${variantStyles[resolvedVariant]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${pipStyles[resolvedVariant]} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{label.replace(/_/g, ' ')}</span>
    </span>
  );
};
