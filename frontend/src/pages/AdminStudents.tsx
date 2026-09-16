import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService } from '../services/adminService';
import { 
  GraduationCap, 
  Search, 
  RefreshCw, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  FileText,
  ExternalLink
} from 'lucide-react';

interface StudentItem {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  college?: string;
  degree?: string;
  graduation_year?: number;
  skills?: string;
  resume_url?: string;
  application_count: number;
  accepted_count: number;
  account_created_at: string;
}

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminService.getStudents({
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setStudents(res.data || []);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to query student directory from placement database.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  return (
    <DashboardLayout pageTitle="Student Directory & Placements" roleBadgeText="ADMIN">
      <div className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-sm border bg-rose-950/80 border-rose-700/60 text-rose-200 font-mono text-xs">
            {errorMessage}
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="bg-[#0b0f19]/90 border border-slate-800 p-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by student name, college, email, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-sm pl-9 pr-3 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="font-mono text-xs text-slate-400">
              TOTAL RECORDS: <span className="text-cyan-400 font-bold">{total}</span>
            </span>

            <button
              id="btn-refresh-students"
              onClick={() => fetchStudents()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-sm font-mono text-xs text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student Identity</th>
                  <th className="py-3 px-4">Academic Background</th>
                  <th className="py-3 px-4">Contact & Skills</th>
                  <th className="py-3 px-4 text-center">Applications</th>
                  <th className="py-3 px-4 text-center">Offers</th>
                  <th className="py-3 px-4 text-right">Portfolio / Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Querying candidate roster from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-mono text-xs text-slate-500">
                      <GraduationCap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div>NO STUDENT CANDIDATES FOUND</div>
                      <div className="text-slate-600 text-[11px] mt-1">Try adjusting search parameters</div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 text-sm">{student.full_name || 'Anonymous Student'}</div>
                        <div className="font-mono text-[11px] text-cyan-400">@{student.username}</div>
                        <div className="font-mono text-[10px] text-slate-500">ID: {student.id}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-medium text-slate-200">{student.college || 'College Unspecified'}</div>
                        <div className="text-slate-400 text-[11px]">
                          {student.degree || 'Degree Program'} {student.graduation_year ? `• Class of ${student.graduation_year}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                        {student.skills && (
                          <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                            {student.skills}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs font-semibold">
                          {student.application_count}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                          student.accepted_count > 0 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                            : 'bg-slate-900 text-slate-500'
                        }`}>
                          {student.accepted_count}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {student.resume_url ? (
                          <a
                            href={student.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 rounded font-mono text-[10px] hover:bg-cyan-900/60 transition-colors"
                          >
                            <span>RESUME</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-600">NOT SUBMITTED</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
              <div>
                PAGE {page} OF {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  id="btn-prev-page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded disabled:opacity-40"
                >
                  PREV
                </button>
                <button
                  id="btn-next-page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded disabled:opacity-40"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
