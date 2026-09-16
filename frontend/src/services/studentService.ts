import { api, API_BASE_URL } from './api';
import { StudentProfile, StudentStats, StudentDocument } from '../types/internship';
import { storage } from '../utils/storage';

export class StudentService {
  public static async getProfile(): Promise<{ success: boolean; data: StudentProfile }> {
    return api.get<{ success: boolean; data: StudentProfile }>('/students/profile');
  }

  public static async updateProfile(
    profile: Partial<StudentProfile>
  ): Promise<{ success: boolean; message: string; data: StudentProfile }> {
    return api.put<{ success: boolean; message: string; data: StudentProfile }>('/students/profile', profile);
  }

  public static async getStats(): Promise<{ success: boolean; data: StudentStats }> {
    return api.get<{ success: boolean; data: StudentStats }>('/students/stats');
  }

  public static async getResume(): Promise<{ success: boolean; data: StudentDocument | null }> {
    return api.get<{ success: boolean; data: StudentDocument | null }>('/students/resume');
  }

  public static async uploadResume(file: File): Promise<{ success: boolean; message: string; data: StudentDocument }> {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post<{ success: boolean; message: string; data: StudentDocument }>('/students/resume', formData);
  }

  public static async deleteResume(): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>('/students/resume');
  }

  public static getResumeViewUrl(): string {
    const token = storage.getToken();
    return `${API_BASE_URL}/students/resume/view${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }

  public static getResumeDownloadUrl(): string {
    const token = storage.getToken();
    return `${API_BASE_URL}/students/resume/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }
}

