import React, { useState, useRef } from 'react';
import { StudentDocument } from '../types/internship';
import { StudentService } from '../services/studentService';
import { 
  FileText, 
  UploadCloud, 
  Eye, 
  Download, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  FileCheck,
  ExternalLink
} from 'lucide-react';

interface ResumeUploadCardProps {
  resume: StudentDocument | null;
  onUploadSuccess: (doc: StudentDocument) => void;
  onDeleteSuccess: () => void;
  compact?: boolean;
}

export const ResumeUploadCard: React.FC<ResumeUploadCardProps> = ({
  resume,
  onUploadSuccess,
  onDeleteSuccess,
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const validateAndUpload = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Client-side Size Validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a smaller document.`);
      return;
    }

    // 2. Client-side Extension & MIME Validation
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type (${ext}). Only PDF, DOC, and DOCX documents are accepted.`);
      return;
    }

    setIsUploading(true);
    try {
      const response = await StudentService.uploadResume(file);
      if (response.success && response.data) {
        setSuccessMsg('Resume uploaded and verified successfully.');
        onUploadSuccess(response.data);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(response.message || 'Failed to upload resume document.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while uploading resume.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const response = await StudentService.deleteResume();
      if (response.success) {
        setShowDeleteConfirm(false);
        setSuccessMsg('Resume document deleted successfully.');
        onDeleteSuccess();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(response.message || 'Failed to remove resume document.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = () => {
    const url = StudentService.getResumeViewUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    const url = StudentService.getResumeDownloadUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = resume?.original_filename || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="student-resume-card" className="space-y-3 font-sans">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 rounded bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When Resume is Uploaded */}
      {resume ? (
        <div className="p-4 rounded bg-[#070b14] border border-cyan-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-100 max-w-xs truncate">
                  {resume.original_filename}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] uppercase font-semibold">
                  {resume.original_filename.split('.').pop()?.toUpperCase() || 'DOCUMENT'}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  {formatFileSize(resume.file_size)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Uploaded: {new Date(resume.created_at).toLocaleDateString()} at {new Date(resume.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-view-resume"
              type="button"
              onClick={handleView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/70 text-cyan-200 font-mono text-xs cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              id="btn-download-resume"
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              id="btn-replace-resume"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>{isUploading ? 'Uploading...' : 'Replace'}</span>
            </button>

            <button
              id="btn-delete-resume-prompt"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-950 hover:bg-rose-950 border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-300 font-mono text-xs cursor-pointer transition-colors"
              title="Delete Resume"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Resume Upload Zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/40'
              : 'border-slate-800 hover:border-cyan-800/80 bg-[#070a12]'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              {isUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-300" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-slate-200">
                {isUploading ? 'VERIFYING & UPLOADING RESUME...' : 'UPLOAD RESUME / CV DOCUMENT'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag and drop your file here, or <span className="text-cyan-400 underline">browse files</span>
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
              <span>Accepted: PDF, DOC, DOCX</span>
              <span>•</span>
              <span>Max file size: 5 MB</span>
            </div>
          </div>
        </div>
      )}

      {/* Warning when no resume is uploaded */}
      {!resume && !compact && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[11px]">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Most corporate hiring partners require an official resume document before applications can be considered.</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#090d16] border border-rose-800/80 w-full max-w-sm rounded p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold">
              <Trash2 className="w-4 h-4" />
              <span>DELETE RESUME DOCUMENT</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Are you sure you want to delete your uploaded resume (<strong className="text-white">{resume?.original_filename}</strong>)? Previously submitted applications will retain their historical snapshots.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
              <button
                id="btn-confirm-delete-resume"
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
