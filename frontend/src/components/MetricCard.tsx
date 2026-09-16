import React, { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  status?: string;
  indicatorColor?: 'cyan' | 'green' | 'blue' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  status,
  indicatorColor = 'cyan',
}) => {
  const accentBorder = {
    cyan: 'border-t-cyan-500/60',
    green: 'border-t-emerald-500/60',
    blue: 'border-t-blue-500/60',
    slate: 'border-t-slate-600',
  };

  return (
    <div
      className={`bg-[#0c1220]/80 border border-slate-800/80 border-t-2 ${accentBorder[indicatorColor]} p-4 relative overflow-hidden backdrop-blur-md rounded-xl shadow-md transition-all hover:border-slate-700`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="font-mono text-2xl font-bold tracking-tight text-slate-100">{value}</div>
        {status && (
          <span className="font-mono text-[10px] text-emerald-400 uppercase bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-800/40">
            {status}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-2 text-xs text-slate-400 font-sans tracking-wide">
          {subtext}
        </div>
      )}
    </div>
  );
};
