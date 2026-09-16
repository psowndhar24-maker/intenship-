import { query } from '../db/index.js';
import { Internship, PaginatedResponse } from '../types/index.js';

export interface InternshipFilterOptions {
  search?: string;
  category?: string;
  location?: string;
  workMode?: string;
  internshipType?: string;
  isPaid?: string | boolean;
  experienceLevel?: string;
  sortBy?: 'deadline' | 'latest' | 'stipend';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class InternshipService {
  public static async getPublicInternships(
    options: InternshipFilterOptions
  ): Promise<PaginatedResponse<Internship>> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(options.limit) || 10));
    const offset = (page - 1) * limit;

    // Rule 4: Internship status = APPROVED AND company verification_status = VERIFIED AND application_deadline > NOW()
    const conditions: string[] = [
      `i.status = 'APPROVED'`,
      `c.verification_status = 'VERIFIED'`,
      `i.application_deadline > CURRENT_TIMESTAMP`
    ];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.search && options.search.trim() !== '') {
      const searchPattern = `%${options.search.trim()}%`;
      conditions.push(
        `(i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex} OR i.category ILIKE $${paramIndex})`
      );
      params.push(searchPattern);
      paramIndex++;
    }

    if (options.category && options.category.trim() !== '' && options.category !== 'ALL') {
      conditions.push(`i.category = $${paramIndex}`);
      params.push(options.category.trim());
      paramIndex++;
    }

    if (options.location && options.location.trim() !== '' && options.location !== 'ALL') {
      conditions.push(`i.location ILIKE $${paramIndex}`);
      params.push(`%${options.location.trim()}%`);
      paramIndex++;
    }

    if (options.workMode && options.workMode.trim() !== '' && options.workMode !== 'ALL') {
      conditions.push(`i.work_mode ILIKE $${paramIndex}`);
      params.push(options.workMode.trim());
      paramIndex++;
    }

    if (options.internshipType && options.internshipType.trim() !== '' && options.internshipType !== 'ALL') {
      conditions.push(`i.internship_type ILIKE $${paramIndex}`);
      params.push(options.internshipType.trim());
      paramIndex++;
    }

    if (options.isPaid !== undefined && options.isPaid !== 'ALL' && options.isPaid !== '') {
      const isPaidBool = options.isPaid === true || options.isPaid === 'true';
      conditions.push(`i.is_paid = $${paramIndex}`);
      params.push(isPaidBool);
      paramIndex++;
    }

    if (options.experienceLevel && options.experienceLevel.trim() !== '' && options.experienceLevel !== 'ALL') {
      conditions.push(`i.experience_level ILIKE $${paramIndex}`);
      params.push(options.experienceLevel.trim());
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Sorting logic
    let orderByClause = 'i.created_at DESC';
    const orderDirection = options.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    if (options.sortBy === 'deadline') {
      orderByClause = `i.application_deadline ASC`;
    } else if (options.sortBy === 'latest') {
      orderByClause = `i.created_at ${orderDirection}`;
    } else if (options.sortBy === 'stipend') {
      orderByClause = `i.stipend ${orderDirection}`;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE ${whereClause}
    `;
    const countResult = await query<{ total: string | number }>(countQuery, params);
    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    if (total === 0) {
      return {
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }

    // Data query
    const dataQuery = `
      SELECT 
        i.*,
        c.company_name,
        c.website as company_website,
        c.location as company_location,
        c.verification_status as company_verification_status
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, limit, offset];
    const dataResult = await query<Internship>(dataQuery, dataParams);

    return {
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  public static async getPublicInternshipById(id: string): Promise<Internship> {
    const sql = `
      SELECT 
        i.*,
        c.company_name,
        c.description as company_description,
        c.website as company_website,
        c.location as company_location,
        c.verification_status as company_verification_status
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1
        AND i.status = 'APPROVED'
        AND c.verification_status = 'VERIFIED'
        AND i.application_deadline > CURRENT_TIMESTAMP
    `;

    const result = await query<Internship>(sql, [id]);

    if (result.rows.length === 0) {
      const error: any = new Error('Internship not found or is no longer open for applications.');
      error.status = 404;
      error.code = 'INTERNSHIP_NOT_FOUND';
      throw error;
    }

    return result.rows[0];
  }
}
