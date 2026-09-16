import { api } from './api';
import {
  Internship,
  PaginatedInternshipsResponse,
  InternshipFilters,
  SavedInternshipItem,
} from '../types/internship';

export class InternshipService {
  /**
   * Fetch publicly available and approved internships
   */
  public static async getPublicInternships(
    filters: InternshipFilters = {}
  ): Promise<PaginatedInternshipsResponse> {
    return api.get<PaginatedInternshipsResponse>('/internships', {
      params: {
        search: filters.search,
        category: filters.category,
        location: filters.location,
        workMode: filters.workMode,
        internshipType: filters.internshipType,
        isPaid: filters.isPaid,
        experienceLevel: filters.experienceLevel,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page || 1,
        limit: filters.limit || 10,
      },
    });
  }

  /**
   * Fetch single public internship details
   */
  public static async getInternshipById(id: string): Promise<{ success: boolean; data: Internship }> {
    return api.get<{ success: boolean; data: Internship }>(`/internships/${id}`);
  }

  /**
   * Save / Bookmark an internship
   */
  public static async saveInternship(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/internships/${id}/save`);
  }

  /**
   * Unsave / Remove bookmark for an internship
   */
  public static async unsaveInternship(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/internships/${id}/save`);
  }

  /**
   * Fetch all saved internships for authenticated student
   */
  public static async getSavedInternships(): Promise<{ success: boolean; data: SavedInternshipItem[] }> {
    return api.get<{ success: boolean; data: SavedInternshipItem[] }>('/internships/saved');
  }
}
