import { api, API_BASE_URL } from './api';
import { Application } from '../types/internship';
import { storage } from '../utils/storage';

export interface ApplyOptions {
  coverLetter?: string;
  additionalInfo?: string;
}

export class ApplicationService {
  /**
   * Submit application for internship with optional cover letter and supplementary info
   */
  public static async apply(
    internshipId: string,
    options?: ApplyOptions
  ): Promise<{ success: boolean; message: string; data: Application }> {
    return api.post<{ success: boolean; message: string; data: Application }>(
      `/internships/${internshipId}/apply`,
      {
        cover_letter: options?.coverLetter,
        additional_info: options?.additionalInfo,
      }
    );
  }

  /**
   * Fetch all applications submitted by current student
   */
  public static async getStudentApplications(): Promise<{ success: boolean; data: Application[] }> {
    return api.get<{ success: boolean; data: Application[] }>('/applications/student');
  }

  /**
   * Fetch detailed information of a specific application
   */
  public static async getApplicationById(
    applicationId: string
  ): Promise<{ success: boolean; data: Application }> {
    return api.get<{ success: boolean; data: Application }>(`/applications/${applicationId}`);
  }

  /**
   * Secure URL for viewing application's historical resume snapshot
   */
  public static getApplicationResumeViewUrl(applicationId: string): string {
    const token = storage.getToken();
    return `${API_BASE_URL}/applications/${applicationId}/resume${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }

  /**
   * Secure URL for downloading application's historical resume snapshot
   */
  public static getApplicationResumeDownloadUrl(applicationId: string): string {
    const token = storage.getToken();
    return `${API_BASE_URL}/applications/${applicationId}/resume?download=true${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  }

  /**
   * Withdraw an application
   */
  public static async withdraw(applicationId: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/applications/${applicationId}/withdraw`);
  }
}

