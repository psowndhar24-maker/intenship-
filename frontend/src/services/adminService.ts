import { api } from './api';
import { 
  AdminDashboardStats, 
  AdminReview, 
  AuditLog, 
  CompanyItem, 
  Internship, 
  PaginatedInternshipsResponse 
} from '../types/internship';

export interface AdminInternshipQuery {
  search?: string;
  status?: string;
  category?: string;
  companyId?: string;
  sortBy?: 'created_at' | 'deadline' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminCompanyQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminAuditQuery {
  search?: string;
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCompaniesResponse {
  success: boolean;
  data: CompanyItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedAuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminService = {
  /**
   * Fetch Directorate Command Center overview stats and pending items
   */
  async getDashboard(): Promise<AdminDashboardStats> {
    const res = await api.get<{ success: boolean; data: AdminDashboardStats }>('/admin/dashboard');
    return res.data;
  },

  /**
   * Fetch paginated internships for administrative review
   */
  async getInternships(params?: AdminInternshipQuery): Promise<PaginatedInternshipsResponse> {
    return await api.get<PaginatedInternshipsResponse>('/admin/internships', { params: params as any });
  },

  /**
   * Fetch pending approval queue
   */
  async getPendingInternships(page = 1, limit = 20): Promise<PaginatedInternshipsResponse> {
    return await api.get<PaginatedInternshipsResponse>('/admin/internships/pending', { params: { page, limit } });
  },

  /**
   * Fetch single internship details with company node
   */
  async getInternshipById(id: string): Promise<Internship> {
    const res = await api.get<{ success: boolean; data: Internship }>(`/admin/internships/${id}`);
    return res.data;
  },

  /**
   * Approve an internship for public student discovery
   */
  async approveInternship(id: string, reason?: string): Promise<Internship> {
    const res = await api.post<{ success: boolean; message: string; data: Internship }>(
      `/admin/internships/${id}/approve`,
      { reason }
    );
    return res.data;
  },

  /**
   * Reject an internship with mandatory justification
   */
  async rejectInternship(id: string, reason: string): Promise<Internship> {
    const res = await api.post<{ success: boolean; message: string; data: Internship }>(
      `/admin/internships/${id}/reject`,
      { reason }
    );
    return res.data;
  },

  /**
   * Request changes with mandatory feedback
   */
  async requestChanges(id: string, reason: string): Promise<Internship> {
    const res = await api.post<{ success: boolean; message: string; data: Internship }>(
      `/admin/internships/${id}/request-changes`,
      { reason }
    );
    return res.data;
  },

  /**
   * Fetch review history for an internship
   */
  async getInternshipReviews(id: string): Promise<AdminReview[]> {
    const res = await api.get<{ success: boolean; data: AdminReview[] }>(
      `/admin/internships/${id}/reviews`
    );
    return res.data;
  },

  /**
   * Fetch corporate partners directory
   */
  async getCompanies(params?: AdminCompanyQuery): Promise<PaginatedCompaniesResponse> {
    return await api.get<PaginatedCompaniesResponse>('/admin/companies', { params: params as any });
  },

  /**
   * Fetch company details with all their listings
   */
  async getCompanyById(id: string): Promise<CompanyItem> {
    const res = await api.get<{ success: boolean; data: CompanyItem }>(`/admin/companies/${id}`);
    return res.data;
  },

  /**
   * Verify a company
   */
  async verifyCompany(id: string, reason?: string): Promise<CompanyItem> {
    const res = await api.post<{ success: boolean; message: string; data: CompanyItem }>(
      `/admin/companies/${id}/verify`,
      { reason }
    );
    return res.data;
  },

  /**
   * Reject a company
   */
  async rejectCompany(id: string, reason: string): Promise<CompanyItem> {
    const res = await api.post<{ success: boolean; message: string; data: CompanyItem }>(
      `/admin/companies/${id}/reject`,
      { reason }
    );
    return res.data;
  },

  /**
   * Suspend a company
   */
  async suspendCompany(id: string, reason: string): Promise<CompanyItem> {
    const res = await api.post<{ success: boolean; message: string; data: CompanyItem }>(
      `/admin/companies/${id}/suspend`,
      { reason }
    );
    return res.data;
  },

  /**
   * Query governance audit logs
   */
  async getAuditLogs(params?: AdminAuditQuery): Promise<PaginatedAuditLogsResponse> {
    return await api.get<PaginatedAuditLogsResponse>('/admin/audit-logs', { params: params as any });
  },

  /**
   * Query registered students with academic metrics and placement history
   */
  async getStudents(params?: { search?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return await api.get('/admin/students', { params });
  },

  /**
   * Query all institutional placement applications
   */
  async getApplications(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return await api.get('/admin/applications', { params });
  },
};
