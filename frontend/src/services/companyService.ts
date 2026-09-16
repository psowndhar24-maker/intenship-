import { api } from './api';
import { Internship, CreateInternshipPayload, CompanyDashboardStats } from '../types/internship';

export interface CompanyProfileData {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  website?: string;
  email?: string;
  location?: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCandidateApplication {
  application_id: string;
  status: string;
  applied_at: string;
  updated_at: string;
  internship_id: string;
  internship_title: string;
  internship_category: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduation_year?: number;
  cgpa?: number;
  career_objective?: string;
  about_me?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills?: string;
  projects?: any[];
  resume_url?: string;
  resume_filename?: string;
  resume_file_size?: number;
  resume_mime_type?: string;
  cover_letter?: string;
  additional_info?: string;
}

export class CompanyService {
  public static async getMyInternships(): Promise<{ success: boolean; data: (Internship & { application_count: number })[] }> {
    return api.get<{ success: boolean; data: (Internship & { application_count: number })[] }>('/company/internships');
  }

  public static async createInternship(
    payload: CreateInternshipPayload
  ): Promise<{ success: boolean; message: string; data: Internship }> {
    return api.post<{ success: boolean; message: string; data: Internship }>('/company/internships', payload);
  }

  public static async updateInternship(
    id: string,
    payload: Partial<CreateInternshipPayload> & { status?: 'DRAFT' | 'PENDING_APPROVAL' | 'CLOSED' }
  ): Promise<{ success: boolean; message: string; data: Internship }> {
    return api.put<{ success: boolean; message: string; data: Internship }>(`/company/internships/${id}`, payload);
  }

  public static async deleteInternship(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/company/internships/${id}`);
  }

  public static async getProfile(): Promise<{ success: boolean; data: CompanyProfileData }> {
    return api.get<{ success: boolean; data: CompanyProfileData }>('/company/profile');
  }

  public static async updateProfile(
    payload: Partial<Pick<CompanyProfileData, 'company_name' | 'description' | 'website' | 'email' | 'location'>>
  ): Promise<{ success: boolean; message: string; data: CompanyProfileData }> {
    return api.put<{ success: boolean; message: string; data: CompanyProfileData }>('/company/profile', payload);
  }

  public static async getApplications(): Promise<{ success: boolean; data: CompanyCandidateApplication[] }> {
    return api.get<{ success: boolean; data: CompanyCandidateApplication[] }>('/company/applications');
  }

  public static async updateApplicationStatus(
    applicationId: string,
    status: string,
    note?: string
  ): Promise<{ success: boolean; message: string; data: any }> {
    return api.patch<{ success: boolean; message: string; data: any }>(
      `/company/applications/${applicationId}/status`,
      { status, note }
    );
  }

  public static async getStats(): Promise<{ success: boolean; data: CompanyDashboardStats }> {
    return api.get<{ success: boolean; data: CompanyDashboardStats }>('/company/stats');
  }
}
