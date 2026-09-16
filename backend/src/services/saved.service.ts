import { query } from '../db/index.js';
import { StudentService } from './student.service.js';
import { SavedInternship } from '../types/index.js';

export class SavedService {
  public static async saveInternship(userId: string, internshipId: string): Promise<SavedInternship> {
    const studentProfile = await StudentService.getProfile(userId);

    // Verify internship exists
    const internshipResult = await query(
      'SELECT id, title FROM internships WHERE id = $1',
      [internshipId]
    );

    if (internshipResult.rows.length === 0) {
      const error: any = new Error('Internship not found.');
      error.status = 404;
      error.code = 'INTERNSHIP_NOT_FOUND';
      throw error;
    }

    // Check duplicate save
    const existing = await query(
      'SELECT id FROM saved_internships WHERE student_id = $1 AND internship_id = $2',
      [studentProfile.id, internshipId]
    );

    if (existing.rows.length > 0) {
      const error: any = new Error('Duplicate save: This internship is already in your saved bookmarks.');
      error.status = 409;
      error.code = 'DUPLICATE_SAVE';
      throw error;
    }

    const id = `save_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const insertSql = `
      INSERT INTO saved_internships (id, student_id, internship_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await query<SavedInternship>(insertSql, [id, studentProfile.id, internshipId]);
    return result.rows[0];
  }

  public static async unsaveInternship(userId: string, internshipId: string): Promise<boolean> {
    const studentProfile = await StudentService.getProfile(userId);

    const deleteSql = `
      DELETE FROM saved_internships
      WHERE student_id = $1 AND internship_id = $2
    `;

    const result = await query(deleteSql, [studentProfile.id, internshipId]);
    return (result.rowCount ?? 0) > 0;
  }

  public static async getSavedInternships(userId: string): Promise<any[]> {
    const studentProfile = await StudentService.getProfile(userId);

    const sql = `
      SELECT 
        s.id as bookmark_id,
        s.created_at as bookmarked_at,
        i.*,
        c.company_name,
        c.location as company_location
      FROM saved_internships s
      JOIN internships i ON s.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      WHERE s.student_id = $1
      ORDER BY s.created_at DESC
    `;

    const result = await query(sql, [studentProfile.id]);
    return result.rows;
  }
}
