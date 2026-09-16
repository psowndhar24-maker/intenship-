import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export type AdminActionType =
  | 'APPROVE_INTERNSHIP'
  | 'REJECT_INTERNSHIP'
  | 'REQUEST_CHANGES_INTERNSHIP'
  | 'VERIFY_COMPANY'
  | 'REJECT_COMPANY'
  | 'SUSPEND_COMPANY';

interface ReasonActionModalProps {
  isOpen: boolean;
  actionType: AdminActionType;
  title: string;
  itemTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ReasonActionModal: React.FC<ReasonActionModalProps> = ({
  isOpen,
  actionType,
  title,
  itemTitle,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMandatory =
    actionType === 'REJECT_INTERNSHIP' ||
    actionType === 'REQUEST_CHANGES_INTERNSHIP' ||
    actionType === 'REJECT_COMPANY' ||
    actionType === 'SUSPEND_COMPANY';

  const getActionTheme = () => {
    switch (actionType) {
      case 'APPROVE_INTERNSHIP':
      case 'VERIFY_COMPANY':
        return {
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold',
          border: 'border-emerald-800/60',
          badge: 'APPROVAL ACTION',
          badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
        };
      case 'REQUEST_CHANGES_INTERNSHIP':
        return {
          icon: AlertTriangle,
          iconColor: 'text-cyan-400',
          btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold',
          border: 'border-cyan-800/60',
          badge: 'REVISION REQUEST',
          badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
        };
      case 'REJECT_INTERNSHIP':
      case 'REJECT_COMPANY':
      case 'SUSPEND_COMPANY':
      default:
        return {
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white font-bold',
          border: 'border-rose-800/60',
          badge: 'ADVERSE ACTION',
          badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800/40',
        };
    }
  };

  const theme = getActionTheme();
  const Icon = theme.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMandatory && !reason.trim()) {
      setError('Please provide a mandatory justification/rationale before proceeding.');
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        className={`w-full max-w-lg bg-[#0b0f19] border ${theme.border} rounded-sm p-6 shadow-2xl space-y-5 text-slate-100 font-mono text-xs animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-xs border text-[10px] uppercase font-bold tracking-wider ${theme.badgeColor}`}>
                {theme.badge}
              </span>
            </div>
            <h3 className="text-base font-sans font-bold text-slate-100 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${theme.iconColor}`} />
              <span>{title}</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-sm hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item context */}
        <div className="p-3 bg-[#070b13] border border-slate-800/80 rounded-sm">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            TARGET ENTITY:
          </div>
          <div className="font-semibold text-slate-200 text-sm font-sans truncate">
            {itemTitle}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold uppercase text-[11px] tracking-wider">
              {isMandatory ? 'Mandatory Reason / Institutional Feedback *' : 'Administrative Note / Justification (Optional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              placeholder={
                actionType === 'REJECT_INTERNSHIP'
                  ? 'State specific reasons for listing rejection (e.g. stipend non-compliant, misleading responsibilities, unverified contact)...'
                  : actionType === 'REQUEST_CHANGES_INTERNSHIP'
                  ? 'Detail requested modifications for the partner company to update...'
                  : actionType === 'SUSPEND_COMPANY'
                  ? 'Specify compliance violations or investigation rationale for company suspension...'
                  : 'Enter review remarks or leave blank for default verification standards...'
              }
              className="w-full bg-[#070b13] border border-slate-700 rounded-sm p-3 text-slate-100 text-xs focus:outline-hidden focus:border-cyan-500 font-mono placeholder:text-slate-600"
            />
            {error && (
              <p className="text-rose-400 text-[11px] font-sans flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-sm bg-slate-900 border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500 cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-sm cursor-pointer text-xs flex items-center gap-2 ${theme.btnBg} transition-all disabled:opacity-50`}
            >
              {isSubmitting ? (
                <span>COMMITTING TO DATABASE...</span>
              ) : (
                <span>CONFIRM ACTION</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
