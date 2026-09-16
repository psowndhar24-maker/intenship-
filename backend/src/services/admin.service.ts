import { query } from '../db/index.js';
import { 
  AdminDashboardStats, 
  AdminReview, 
  AuditLog, 
  Company, 
  Internship, 
  PaginatedResponse 
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { NotificationService } from './notification.service.js';

export interface AdminInternshipFilters {
  search?: string;
  status?: string;
  category?: string;
  companyId?: string;
  sortBy?: 'created_at' | 'deadline' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminCompanyFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminAuditFilters {
  search?: string;
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

export class AdminService {
  /**
   * Fetch all real-time stats for the Directorate Command Center.
   */
  public static async getDashboardStats(): Promise<AdminDashboardStats> {
    const statsQuery = await query(`
      SELECT 
        COUNT(*) as total_internships,
        COUNT(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 END) as pending_internships,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_internships,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_internships,
        COUNT(CASE WHEN status = 'CHANGES_REQUESTED' THEN 1 END) as changes_requested
      FROM internships
    `);

    const companyStats = await query(`
      SELECT
        COUNT(*) as total_companies,
        COUNT(CASE WHEN verification_status = 'PENDING' THEN 1 END) as pending_companies,
        COUNT(CASE WHEN verification_status = 'VERIFIED' THEN 1 END) as verified_companies,
        COUNT(CASE WHEN verification_status = 'SUSPENDED' THEN 1 END) as suspended_companies
      FROM companies
    `);

    const appStats = await query(`
      SELECT 
        COUNT(*) as total_apps,
        COUNT(CASE WHEN status IN ('SELECTED', 'ACCEPTED') THEN 1 END) as selected_apps
      FROM applications
    `);

    const studentStats = await query(`SELECT COUNT(*) as total_students FROM student_profiles`);

    const recentAuditLogs = await query<AuditLog>(`
      SELECT a.*, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 6
    `);

    const pendingInternshipsList = await query<Internship>(`
      SELECT i.*, c.company_name, c.verification_status as company_verification_status
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE i.status = 'PENDING_APPROVAL'
      ORDER BY i.created_at ASC
      LIMIT 5
    `);

    const intRow = statsQuery.rows[0] || {};
    const cmpRow = companyStats.rows[0] || {};
    const appRow = appStats.rows[0] || {};
    const stdRow = studentStats.rows[0] || {};

    return {
      totalInternships: parseInt(intRow.total_internships || '0', 10),
      pendingInternships: parseInt(intRow.pending_internships || '0', 10),
      approvedInternships: parseInt(intRow.approved_internships || '0', 10),
      rejectedInternships: parseInt(intRow.rejected_internships || '0', 10),
      changesRequested: parseInt(intRow.changes_requested || '0', 10),
      totalCompanies: parseInt(cmpRow.total_companies || '0', 10),
      pendingCompanies: parseInt(cmpRow.pending_companies || '0', 10),
      verifiedCompanies: parseInt(cmpRow.verified_companies || '0', 10),
      suspendedCompanies: parseInt(cmpRow.suspended_companies || '0', 10),
      totalApplications: parseInt(appRow.total_apps || '0', 10),
      totalStudents: parseInt(stdRow.total_students || '0', 10),
      selectedApplications: parseInt(appRow.selected_apps || '0', 10),
      recentAuditLogs: recentAuditLogs.rows,
      pendingInternshipsList: pendingInternshipsList.rows,
    };
  }

  /**
   * Query all internships for administrative review with filters and pagination.
   */
  public static async getInternships(
    options: AdminInternshipFilters
  ): Promise<PaginatedResponse<Internship>> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 15));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.status && options.status !== 'ALL') {
      conditions.push(`i.status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    if (options.category && options.category !== 'ALL') {
      conditions.push(`i.category = $${paramIndex}`);
      params.push(options.category);
      paramIndex++;
    }

    if (options.companyId) {
      conditions.push(`i.company_id = $${paramIndex}`);
      params.push(options.companyId);
      paramIndex++;
    }

    if (options.search && options.search.trim()) {
      const searchPattern = `%${options.search.trim()}%`;
      conditions.push(
        `(i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex} OR i.location ILIKE $${paramIndex})`
      );
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let orderByClause = 'i.created_at DESC';
    const orderDirection = options.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    if (options.sortBy === 'deadline') {
      orderByClause = `i.application_deadline ${orderDirection}`;
    } else if (options.sortBy === 'title') {
      orderByClause = `i.title ${orderDirection}`;
    } else {
      orderByClause = `i.created_at ${orderDirection}`;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const dataQuery = `
      SELECT i.*, c.company_name, c.website as company_website, c.location as company_location, c.verification_status as company_verification_status
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
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get specifically pending internships.
   */
  public static async getPendingInternships(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Internship>> {
    return this.getInternships({
      status: 'PENDING_APPROVAL',
      page,
      limit,
    });
  }

  /**
   * Get single internship details with joined company info and review history.
   */
  public static async getInternshipById(id: string): Promise<Internship | null> {
    const result = await query<Internship>(
      `SELECT i.*, 
              c.company_name, 
              c.description as company_description, 
              c.website as company_website, 
              c.email as company_email,
              c.location as company_location, 
              c.verification_status as company_verification_status
       FROM internships i
       JOIN companies c ON i.company_id = c.id
       WHERE i.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Approve an internship listing.
   * Requirement: Associated company MUST be VERIFIED.
   */
  public static async approveInternship(
    adminUserId: string,
    internshipId: string,
    reason?: string
  ): Promise<Internship> {
    // 1. Fetch current status and company verification
    const existing = await this.getInternshipById(internshipId);
    if (!existing) {
      throw new Error('Internship posting not found.');
    }

    if (existing.company_verification_status !== 'VERIFIED') {
      throw new Error(
        `Cannot approve internship: Partner company "${existing.company_name}" is currently ${existing.company_verification_status}. Company must be VERIFIED prior to approving listings.`
      );
    }

    if (existing.status === 'APPROVED') {
      return existing;
    }

    if (existing.status === 'REJECTED') {
      throw new Error(
        'Cannot directly approve a previously REJECTED listing. Company must resubmit for review.'
      );
    }

    // 2. Perform status transition
    const updateResult = await query<Internship>(
      `UPDATE internships
       SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [internshipId]
    );
    const updated = updateResult.rows[0];

    // 3. Insert review history
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO admin_reviews (id, internship_id, admin_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        reviewId,
        internshipId,
        adminUserId,
        'APPROVED',
        reason || 'Meets institutional placement guidelines and verified by Directorate.'
      ]
    );

    // 4. Record audit log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        adminUserId,
        'INTERNSHIP_APPROVED',
        'INTERNSHIP',
        internshipId,
        JSON.stringify({
          title: existing.title,
          company: existing.company_name,
          reason: reason || 'Approved for student discovery',
        })
      ]
    );

    // 5. Notify company
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO company_notifications (id, company_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        notifId,
        existing.company_id,
        'Internship Approved',
        `Your listing "${existing.title}" was approved by the Directorate and is now live for student applications.`,
        'APPROVAL'
      ]
    );

    try {
      const compUserRes = await query<{ user_id: string }>(
        'SELECT user_id FROM companies WHERE id = $1',
        [existing.company_id]
      );
      if (compUserRes.rows[0]?.user_id) {
        await NotificationService.createNotification({
          userId: compUserRes.rows[0].user_id,
          type: 'INTERNSHIP_APPROVED',
          title: 'Internship Approved',
          message: `Your listing "${existing.title}" was approved by the Directorate and is now live for student applications.`,
          relatedEntityType: 'INTERNSHIP',
          relatedEntityId: internshipId,
        });
      }
    } catch (e) {
      console.warn('Notice: Failed to dispatch company user notification:', e);
    }

    return updated;
  }

  /**
   * Reject an internship listing. Requires a reason.
   */
  public static async rejectInternship(
    adminUserId: string,
    internshipId: string,
    reason: string
  ): Promise<Internship> {
    if (!reason || !reason.trim()) {
      throw new Error('A specific justification/reason is required to reject an internship.');
    }

    const existing = await this.getInternshipById(internshipId);
    if (!existing) {
      throw new Error('Internship posting not found.');
    }

    const updateResult = await query<Internship>(
      `UPDATE internships
       SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [internshipId]
    );
    const updated = updateResult.rows[0];

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO admin_reviews (id, internship_id, admin_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [reviewId, internshipId, adminUserId, 'REJECTED', reason.trim()]
    );

    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        adminUserId,
        'INTERNSHIP_REJECTED',
        'INTERNSHIP',
        internshipId,
        JSON.stringify({ title: existing.title, company: existing.company_name, reason: reason.trim() })
      ]
    );

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO company_notifications (id, company_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        notifId,
        existing.company_id,
        'Internship Rejected',
        `Your listing "${existing.title}" was rejected by the Directorate. Reason: ${reason.trim()}`,
        'REJECTION'
      ]
    );

    try {
      const compUserRes = await query<{ user_id: string }>(
        'SELECT user_id FROM companies WHERE id = $1',
        [existing.company_id]
      );
      if (compUserRes.rows[0]?.user_id) {
        await NotificationService.createNotification({
          userId: compUserRes.rows[0].user_id,
          type: 'INTERNSHIP_REJECTED',
          title: 'Internship Rejected',
          message: `Your listing "${existing.title}" was rejected by the Directorate. Reason: ${reason.trim()}`,
          relatedEntityType: 'INTERNSHIP',
          relatedEntityId: internshipId,
        });
      }
    } catch (e) {
      console.warn('Notice: Failed to dispatch company user notification:', e);
    }

    return updated;
  }

  /**
   * Request changes on an internship. Requires actionable feedback.
   */
  public static async requestChangesInternship(
    adminUserId: string,
    internshipId: string,
    reason: string
  ): Promise<Internship> {
    if (!reason || !reason.trim()) {
      throw new Error('Specific revision instructions/reason are required to request changes.');
    }

    const existing = await this.getInternshipById(internshipId);
    if (!existing) {
      throw new Error('Internship posting not found.');
    }

    const updateResult = await query<Internship>(
      `UPDATE internships
       SET status = 'CHANGES_REQUESTED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [internshipId]
    );
    const updated = updateResult.rows[0];

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO admin_reviews (id, internship_id, admin_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [reviewId, internshipId, adminUserId, 'CHANGES_REQUESTED', reason.trim()]
    );

    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        adminUserId,
        'INTERNSHIP_CHANGES_REQUESTED',
        'INTERNSHIP',
        internshipId,
        JSON.stringify({ title: existing.title, company: existing.company_name, reason: reason.trim() })
      ]
    );

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO company_notifications (id, company_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        notifId,
        existing.company_id,
        'Changes Requested on Internship',
        `The Directorate requested revisions on "${existing.title}": ${reason.trim()}`,
        'CHANGES_REQUESTED'
      ]
    );

    try {
      const compUserRes = await query<{ user_id: string }>(
        'SELECT user_id FROM companies WHERE id = $1',
        [existing.company_id]
      );
      if (compUserRes.rows[0]?.user_id) {
        await NotificationService.createNotification({
          userId: compUserRes.rows[0].user_id,
          type: 'INTERNSHIP_CHANGES_REQUESTED',
          title: 'Changes Requested on Internship',
          message: `The Directorate requested revisions on "${existing.title}": ${reason.trim()}`,
          relatedEntityType: 'INTERNSHIP',
          relatedEntityId: internshipId,
        });
      }
    } catch (e) {
      console.warn('Notice: Failed to dispatch company user notification:', e);
    }

    return updated;
  }

  /**
   * Fetch review history for an internship.
   */
  public static async getInternshipReviews(internshipId: string): Promise<AdminReview[]> {
    const res = await query<AdminReview>(
      `SELECT r.*, u.username as admin_username
       FROM admin_reviews r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.internship_id = $1
       ORDER BY r.created_at DESC`,
      [internshipId]
    );
    return res.rows;
  }

  /**
   * Query corporate partners for moderation directory.
   */
  public static async getCompanies(
    options: AdminCompanyFilters
  ): Promise<PaginatedResponse<Company & { internship_count: number }>> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.status && options.status !== 'ALL') {
      conditions.push(`c.verification_status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    if (options.search && options.search.trim()) {
      const searchPattern = `%${options.search.trim()}%`;
      conditions.push(
        `(c.company_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.location ILIKE $${paramIndex} OR c.website ILIKE $${paramIndex})`
      );
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(`SELECT COUNT(*) as total FROM companies c WHERE ${whereClause}`, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const queryText = `
      SELECT c.*, COUNT(i.id)::int as internship_count
      FROM companies c
      LEFT JOIN internships i ON c.id = i.company_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRes = await query<Company & { internship_count: number }>(queryText, [...params, limit, offset]);

    return {
      success: true,
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Fetch company details along with all their internships.
   */
  public static async getCompanyById(id: string): Promise<(Company & { internships: Internship[] }) | null> {
    const companyRes = await query<Company>(
      `SELECT * FROM companies WHERE id = $1`,
      [id]
    );

    if (companyRes.rows.length === 0) {
      return null;
    }

    const company = companyRes.rows[0];
    const internshipsRes = await query<Internship>(
      `SELECT * FROM internships WHERE company_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    return {
      ...company,
      internships: internshipsRes.rows,
    };
  }

  /**
   * Verify a company.
   */
  public static async verifyCompany(
    adminUserId: string,
    companyId: string,
    reason?: string
  ): Promise<Company> {
    const existing = await query<Company>(`SELECT * FROM companies WHERE id = $1`, [companyId]);
    if (existing.rows.length === 0) {
      throw new Error('Company not found.');
    }

    const updated = await query<Company>(
      `UPDATE companies
       SET verification_status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [companyId]
    );

    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        adminUserId,
        'COMPANY_VERIFIED',
        'COMPANY',
        companyId,
        JSON.stringify({
          company_name: existing.rows[0].company_name,
          reason: reason || 'Enterprise partner credentials verified.',
        })
      ]
    );

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO company_notifications (id, company_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        notifId,
        companyId,
        'Company Profile Verified',
        'Your company account has been verified by the Directorate. Listings can now be approved for student viewing.',
        'VERIFICATION'
      ]
    );

    return updated.rows[0];
  }

  /**
   * Reject a company verification application.
   */
  public static async rejectCompany(
    adminUserId: string,
    companyId: string,
    reason: string
  ): Promise<Company> {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is required.');
    }

    const existing = await query<Company>(`SELECT * FROM companies WHERE id = $1`, [companyId]);
    if (existing.rows.length === 0) {
      throw new Error('Company not found.');
    }

    const updated = await query<Company>(
      `UPDATE companies
       SET verification_status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [companyId]
    );

    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        adminUserId,
        'COMPANY_REJECTED',
        'COMPANY',
        companyId,
        JSON.stringify({
          company_name: existing.rows[0].company_name,
          reason: reason.trim(),
        })
      ]
    );

    return updated.rows[0];
  }

  /**
   * Suspend a previously verified company.
   */
  public static async suspendCompany(
    adminUserId: string,
    companyId: string,
    reason: string
  ): Promise<Company> {
    if (!reason || !reason.trim()) {
      throw new Error('A suspension rationale/reason is required.');
    }

    const existing = await query<Company>(`SELECT * FROM companies WHERE id = $1`, [companyId]);
    if (existing.rows.length === 0) {
      throw new Error('Company not found.');
    }

    const updated = await query<Company>(
      `UPDATE companies
       SET verification_status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [companyId]
    );

    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        adminUserId,
        'COMPANY_SUSPENDED',
        'COMPANY',
        companyId,
        JSON.stringify({
          company_name: existing.rows[0].company_name,
          reason: reason.trim(),
        })
      ]
    );

    return updated.rows[0];
  }

  /**
   * Fetch audit logs with pagination and filters.
   */
  public static async getAuditLogs(
    options: AdminAuditFilters
  ): Promise<PaginatedResponse<AuditLog>> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.action && options.action !== 'ALL') {
      conditions.push(`a.action = $${paramIndex}`);
      params.push(options.action);
      paramIndex++;
    }

    if (options.entityType && options.entityType !== 'ALL') {
      conditions.push(`a.entity_type = $${paramIndex}`);
      params.push(options.entityType);
      paramIndex++;
    }

    if (options.search && options.search.trim()) {
      const searchPattern = `%${options.search.trim()}%`;
      conditions.push(`(a.action ILIKE $${paramIndex} OR a.entity_id ILIKE $${paramIndex} OR a.metadata ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`);
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*) as total 
       FROM audit_logs a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const queryText = `
      SELECT a.*, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRes = await query<AuditLog>(queryText, [...params, limit, offset]);

    return {
      success: true,
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Query all registered students with profile details and application metrics.
   */
  public static async getStudents(filters: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.search?.trim()) {
      conditions.push(`(
        sp.full_name ILIKE $${paramIndex} OR 
        sp.email ILIKE $${paramIndex} OR 
        sp.college ILIKE $${paramIndex} OR 
        sp.skills ILIKE $${paramIndex} OR
        u.username ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    const countSql = `
      SELECT COUNT(*) as total
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const querySql = `
      SELECT 
        sp.*,
        u.username,
        u.created_at as account_created_at,
        (SELECT COUNT(*) FROM applications a WHERE a.student_id = sp.id)::int as application_count,
        (SELECT COUNT(*) FROM applications a WHERE a.student_id = sp.id AND a.status = 'ACCEPTED')::int as accepted_count
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query(querySql, [...params, limit, offset]);

    return {
      success: true,
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Query all institutional internship applications across student and corporate cohorts.
   */
  public static async getApplications(filters: { search?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.search?.trim()) {
      conditions.push(`(
        sp.full_name ILIKE $${paramIndex} OR 
        sp.email ILIKE $${paramIndex} OR 
        i.title ILIKE $${paramIndex} OR 
        c.company_name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    if (filters.status && filters.status !== 'ALL') {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    const countSql = `
      SELECT COUNT(*) as total
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      JOIN student_profiles sp ON a.student_id = sp.id
      WHERE ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const querySql = `
      SELECT 
        a.id,
        a.status,
        a.applied_at,
        a.updated_at,
        a.cover_letter,
        a.additional_info,
        a.resume_id,
        i.id as internship_id,
        i.title as internship_title,
        i.category as internship_category,
        i.work_mode,
        i.stipend,
        c.id as company_id,
        c.company_name,
        sp.id as student_id,
        sp.full_name as student_name,
        sp.email as student_email,
        sp.phone as student_phone,
        sp.college as student_college,
        sp.degree as student_degree,
        sp.department as student_department,
        sp.graduation_year as student_graduation_year,
        sp.cgpa as student_cgpa,
        sp.skills as student_skills,
        sp.projects as student_projects,
        sp.resume_url,
        COALESCE(ad.original_filename, sd.original_filename) as resume_filename,
        COALESCE(ad.file_size, sd.file_size) as resume_file_size,
        COALESCE(ad.mime_type, sd.mime_type) as resume_mime_type
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      JOIN student_profiles sp ON a.student_id = sp.id
      LEFT JOIN application_documents ad ON a.id = ad.application_id AND ad.document_type = 'RESUME'
      LEFT JOIN student_documents sd ON a.student_id = sd.student_id AND sd.document_type = 'RESUME'
      WHERE ${whereClause}
      ORDER BY a.applied_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query(querySql, [...params, limit, offset]);

    const enrichedRows = dataRes.rows.map((row: any) => {
      let parsedProjects = [];
      if (row.student_projects) {
        if (typeof row.student_projects === 'string') {
          try {
            parsedProjects = JSON.parse(row.student_projects);
          } catch {
            parsedProjects = [];
          }
        } else if (Array.isArray(row.student_projects)) {
          parsedProjects = row.student_projects;
        }
      }
      return {
        ...row,
        student_projects: parsedProjects,
      };
    });

    return {
      success: true,
      data: enrichedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
