import { query } from '../db/index.js';
import { Company, Internship } from '../types/index.js';
import { NotificationService } from './notification.service.js';

export interface CompanyDashboardStats {
  totalInternships: number;
  pendingApproval: number;
  approvedInternships: number;
  totalApplications: number;
  underReview: number;
  shortlisted: number;
  interview: number;
  selected: number;
}

export interface CreateInternshipInput {
  title: string;
  category: string;
  description: string;
  internship_type: string;
  location: string;
  work_mode: string;
  duration: string;
  stipend: string;
  currency?: string;
  is_paid?: boolean;
  experience_level?: string;
  education?: string;
  eligibility?: string;
  responsibilities?: string;
  benefits?: string;
  learning_opportunities?: string;
  selection_process?: string;
  application_deadline: string;
}

export interface UpdateInternshipInput extends Partial<CreateInternshipInput> {
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'CLOSED';
}

export class CompanyService {
  public static async getCompanyByUserId(userId: string): Promise<Company> {
    const result = await query<Company>(
      'SELECT * FROM companies WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Company entity profile not found for this user account.');
      error.status = 404;
      error.code = 'COMPANY_NOT_FOUND';
      throw error;
    }

    return result.rows[0];
  }

  public static async getCompanyInternships(userId: string): Promise<any[]> {
    const company = await this.getCompanyByUserId(userId);

    const sql = `
      SELECT 
        i.*,
        c.company_name,
        c.verification_status as company_verification_status,
        COUNT(a.id)::int as application_count,
        (
          SELECT r.reason 
          FROM admin_reviews r 
          WHERE r.internship_id = i.id 
          ORDER BY r.created_at DESC 
          LIMIT 1
        ) as latest_review_reason,
        (
          SELECT r.action 
          FROM admin_reviews r 
          WHERE r.internship_id = i.id 
          ORDER BY r.created_at DESC 
          LIMIT 1
        ) as latest_review_action
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      LEFT JOIN applications a ON i.id = a.internship_id
      WHERE i.company_id = $1
      GROUP BY i.id, c.id
      ORDER BY i.created_at DESC
    `;

    const result = await query(sql, [company.id]);
    return result.rows;
  }

  public static async getCompanyInternshipById(userId: string, internshipId: string): Promise<Internship> {
    const company = await this.getCompanyByUserId(userId);

    const sql = `
      SELECT 
        i.*,
        c.company_name,
        c.verification_status as company_verification_status
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1 AND i.company_id = $2
    `;

    const result = await query<Internship>(sql, [internshipId, company.id]);

    if (result.rows.length === 0) {
      const error: any = new Error('Internship not found or access denied (not owned by your company).');
      error.status = 404;
      error.code = 'INTERNSHIP_NOT_FOUND';
      throw error;
    }

    return result.rows[0];
  }

  public static async createInternship(userId: string, input: CreateInternshipInput): Promise<Internship> {
    const company = await this.getCompanyByUserId(userId);

    // Validation
    const requiredFields: (keyof CreateInternshipInput)[] = [
      'title',
      'category',
      'description',
      'internship_type',
      'location',
      'work_mode',
      'duration',
      'stipend',
      'application_deadline'
    ];

    for (const field of requiredFields) {
      if (!input[field] || String(input[field]).trim() === '') {
        const error: any = new Error(`Field '${field}' is required to create an internship.`);
        error.status = 400;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
    }

    const deadlineDate = new Date(input.application_deadline);
    if (isNaN(deadlineDate.getTime())) {
      const error: any = new Error('Invalid application deadline format. Expected valid ISO timestamp.');
      error.status = 400;
      error.code = 'INVALID_DEADLINE';
      throw error;
    }

    if (deadlineDate <= new Date()) {
      const error: any = new Error('Application deadline must be a future date and time.');
      error.status = 400;
      error.code = 'PAST_DEADLINE';
      throw error;
    }

    const id = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Rule: New internships default to PENDING_APPROVAL. Do not allow companies to directly set APPROVED.
    const status = 'PENDING_APPROVAL';

    const insertSql = `
      INSERT INTO internships (
        id, company_id, title, category, description, internship_type,
        location, work_mode, duration, stipend, currency, is_paid,
        experience_level, education, eligibility, responsibilities,
        benefits, learning_opportunities, selection_process,
        application_deadline, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19,
        $20, $21
      ) RETURNING *
    `;

    const values = [
      id,
      company.id,
      input.title.trim(),
      input.category.trim(),
      input.description.trim(),
      input.internship_type.trim(),
      input.location.trim(),
      input.work_mode.trim(),
      input.duration.trim(),
      input.stipend.trim(),
      input.currency || 'INR',
      input.is_paid !== undefined ? Boolean(input.is_paid) : true,
      input.experience_level?.trim() || 'Entry-level',
      input.education?.trim() || 'Pursuing Undergraduate / Graduate Degree',
      input.eligibility?.trim() || null,
      input.responsibilities?.trim() || null,
      input.benefits?.trim() || null,
      input.learning_opportunities?.trim() || null,
      input.selection_process?.trim() || 'Resume Screening -> Technical Assessment -> Final Interview',
      deadlineDate.toISOString(),
      status
    ];

    const result = await query<Internship>(insertSql, values);
    return {
      ...result.rows[0],
      company_name: company.company_name,
      company_verification_status: company.verification_status
    };
  }

  public static async updateInternship(
    userId: string,
    internshipId: string,
    input: UpdateInternshipInput
  ): Promise<Internship> {
    const existing = await this.getCompanyInternshipById(userId, internshipId);

    // Rule 7: Do not allow companies to directly set APPROVED through the normal company API.
    if (input.status === ('APPROVED' as any)) {
      const error: any = new Error('Permission denied: Companies cannot directly set internship status to APPROVED.');
      error.status = 403;
      error.code = 'STATUS_RESTRICTED';
      throw error;
    }

    if (input.application_deadline) {
      const deadlineDate = new Date(input.application_deadline);
      if (isNaN(deadlineDate.getTime())) {
        const error: any = new Error('Invalid application deadline date format.');
        error.status = 400;
        error.code = 'INVALID_DEADLINE';
        throw error;
      }
    }

    const updateSql = `
      UPDATE internships SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        description = COALESCE($3, description),
        internship_type = COALESCE($4, internship_type),
        location = COALESCE($5, location),
        work_mode = COALESCE($6, work_mode),
        duration = COALESCE($7, duration),
        stipend = COALESCE($8, stipend),
        is_paid = COALESCE($9, is_paid),
        experience_level = COALESCE($10, experience_level),
        education = COALESCE($11, education),
        eligibility = COALESCE($12, eligibility),
        responsibilities = COALESCE($13, responsibilities),
        benefits = COALESCE($14, benefits),
        learning_opportunities = COALESCE($15, learning_opportunities),
        selection_process = COALESCE($16, selection_process),
        application_deadline = COALESCE($17, application_deadline),
        status = CASE 
          WHEN $18::text IS NOT NULL THEN $18::varchar(32)
          ELSE status 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19 AND company_id = $20
      RETURNING *
    `;

    const values = [
      input.title?.trim() || null,
      input.category?.trim() || null,
      input.description?.trim() || null,
      input.internship_type?.trim() || null,
      input.location?.trim() || null,
      input.work_mode?.trim() || null,
      input.duration?.trim() || null,
      input.stipend?.trim() || null,
      input.is_paid !== undefined ? Boolean(input.is_paid) : null,
      input.experience_level?.trim() || null,
      input.education?.trim() || null,
      input.eligibility?.trim() || null,
      input.responsibilities?.trim() || null,
      input.benefits?.trim() || null,
      input.learning_opportunities?.trim() || null,
      input.selection_process?.trim() || null,
      input.application_deadline ? new Date(input.application_deadline).toISOString() : null,
      input.status || null,
      internshipId,
      existing.company_id
    ];

    const result = await query<Internship>(updateSql, values);
    return result.rows[0];
  }

  public static async deleteInternship(userId: string, internshipId: string): Promise<boolean> {
    const existing = await this.getCompanyInternshipById(userId, internshipId);
    await query('DELETE FROM internships WHERE id = $1 AND company_id = $2', [internshipId, existing.company_id]);
    return true;
  }

  public static async getProfile(userId: string): Promise<Company> {
    return await this.getCompanyByUserId(userId);
  }

  public static async updateProfile(
    userId: string,
    input: Partial<{
      company_name: string;
      description: string;
      website: string;
      email: string;
      location: string;
    }>
  ): Promise<Company> {
    const existing = await this.getCompanyByUserId(userId);

    const updateSql = `
      UPDATE companies SET
        company_name = COALESCE($1, company_name),
        description = COALESCE($2, description),
        website = COALESCE($3, website),
        email = COALESCE($4, email),
        location = COALESCE($5, location),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const values = [
      input.company_name?.trim() || null,
      input.description !== undefined ? input.description?.trim() : null,
      input.website !== undefined ? input.website?.trim() : null,
      input.email !== undefined ? input.email?.trim() : null,
      input.location !== undefined ? input.location?.trim() : null,
      existing.id
    ];

    const result = await query<Company>(updateSql, values);
    return result.rows[0];
  }

  public static async getCompanyApplications(userId: string): Promise<any[]> {
    const company = await this.getCompanyByUserId(userId);

    const sql = `
      SELECT 
        a.id as application_id,
        a.status,
        a.applied_at,
        a.updated_at,
        a.cover_letter,
        a.additional_info,
        a.resume_id,
        i.id as internship_id,
        i.title as internship_title,
        i.category as internship_category,
        sp.id as student_id,
        sp.full_name as student_name,
        sp.email as student_email,
        sp.phone as student_phone,
        sp.dob,
        sp.address,
        sp.city,
        sp.state,
        sp.country,
        sp.college,
        sp.degree,
        sp.department,
        sp.graduation_year,
        sp.cgpa,
        sp.career_objective,
        sp.about_me,
        sp.linkedin_url,
        sp.github_url,
        sp.portfolio_url,
        sp.skills,
        sp.projects,
        sp.resume_url,
        COALESCE(ad.original_filename, sd.original_filename) as resume_filename,
        COALESCE(ad.file_size, sd.file_size) as resume_file_size,
        COALESCE(ad.mime_type, sd.mime_type) as resume_mime_type
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN student_profiles sp ON a.student_id = sp.id
      LEFT JOIN application_documents ad ON a.id = ad.application_id AND ad.document_type = 'RESUME'
      LEFT JOIN student_documents sd ON a.student_id = sd.student_id AND sd.document_type = 'RESUME'
      WHERE i.company_id = $1
      ORDER BY a.applied_at DESC
    `;

    const result = await query(sql, [company.id]);
    return result.rows.map((row: any) => {
      let parsedProjects = [];
      if (row.projects) {
        if (typeof row.projects === 'string') {
          try {
            parsedProjects = JSON.parse(row.projects);
          } catch {
            parsedProjects = [];
          }
        } else if (Array.isArray(row.projects)) {
          parsedProjects = row.projects;
        }
      }
      return {
        ...row,
        projects: parsedProjects,
      };
    });
  }

  public static async updateApplicationStatus(
    userId: string,
    applicationId: string,
    status: string,
    note?: string
  ): Promise<any> {
    const company = await this.getCompanyByUserId(userId);

    // Verify application belongs to an internship owned by this company
    const verifySql = `
      SELECT 
        a.id, 
        a.status as current_status,
        a.internship_id, 
        a.student_id,
        i.company_id,
        i.title as internship_title,
        sp.user_id as student_user_id,
        sp.full_name as student_name
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN student_profiles sp ON a.student_id = sp.id
      WHERE a.id = $1 AND i.company_id = $2
      LIMIT 1
    `;
    const verifyRes = await query<any>(verifySql, [applicationId, company.id]);
    if (verifyRes.rows.length === 0) {
      const error: any = new Error('Application record not found or does not belong to your company postings.');
      error.status = 404;
      error.code = 'APPLICATION_NOT_FOUND';
      throw error;
    }

    const app = verifyRes.rows[0];

    // Standardize status: map ACCEPTED to SELECTED if passed or accept valid targets
    let targetStatus = status.trim().toUpperCase();
    if (targetStatus === 'ACCEPTED') {
      targetStatus = 'SELECTED';
    }

    const validStatuses = ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    if (!validStatuses.includes(targetStatus)) {
      const error: any = new Error(
        `Invalid status '${status}'. Permitted statuses: UNDER_REVIEW, SHORTLISTED, INTERVIEW, SELECTED, REJECTED`
      );
      error.status = 400;
      error.code = 'INVALID_STATUS';
      throw error;
    }

    if (app.current_status === targetStatus) {
      return app;
    }

    const updateSql = `
      UPDATE applications
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const updateRes = await query(updateSql, [targetStatus, applicationId]);
    const updated = updateRes.rows[0];

    // 1. Insert official entry into application_status_history
    const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO application_status_history (
        id, application_id, old_status, new_status, changed_by, changed_by_role, note, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [
        histId,
        applicationId,
        app.current_status,
        targetStatus,
        userId,
        'COMPANY',
        note?.trim() || null,
      ]
    );

    // 2. Prepare contextual in-app notification for the applicant
    let notifTitle = 'Application Status Updated';
    let notifMessage = `Your application for "${app.internship_title}" has been updated to ${targetStatus.replace('_', ' ')}.`;

    switch (targetStatus) {
      case 'UNDER_REVIEW':
        notifTitle = 'Application Under Review';
        notifMessage = `Your application for "${app.internship_title}" is now under review by ${company.company_name}.`;
        break;
      case 'SHORTLISTED':
        notifTitle = 'Application Shortlisted!';
        notifMessage = `Congratulations! You have been shortlisted for "${app.internship_title}" at ${company.company_name}.`;
        break;
      case 'INTERVIEW':
        notifTitle = 'Interview Stage';
        notifMessage = `Your application for "${app.internship_title}" at ${company.company_name} has moved to the interview stage.`;
        break;
      case 'SELECTED':
        notifTitle = 'Application Selected / Offer';
        notifMessage = `Congratulations! You have been selected for the "${app.internship_title}" position by ${company.company_name}!`;
        break;
      case 'REJECTED':
        notifTitle = 'Application Decision';
        notifMessage = `Thank you for your interest in "${app.internship_title}". Your application has been reviewed and concluded.`;
        break;
    }

    if (note && note.trim()) {
      notifMessage += ` Recruiter note: "${note.trim()}"`;
    }

    try {
      await NotificationService.createNotification({
        userId: app.student_user_id,
        type: `APPLICATION_${targetStatus}`,
        title: notifTitle,
        message: notifMessage,
        relatedEntityType: 'APPLICATION',
        relatedEntityId: applicationId,
      });
    } catch (notifErr) {
      console.warn('Notice: Failed to create applicant status notification:', notifErr);
    }

    // 3. Record institutional audit log
    try {
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auditId,
          userId,
          'APPLICATION_STATUS_CHANGED',
          'APPLICATION',
          applicationId,
          JSON.stringify({
            old_status: app.current_status,
            new_status: targetStatus,
            note: note?.trim() || null,
            student_id: app.student_id,
            internship_title: app.internship_title,
          }),
        ]
      );
    } catch (auditErr) {
      console.warn('Notice: Failed to record audit log:', auditErr);
    }

    return updated;
  }

  /**
   * Fetch company dashboard real metrics
   */
  public static async getCompanyStats(userId: string): Promise<CompanyDashboardStats> {
    const company = await this.getCompanyByUserId(userId);

    // Internships breakdown
    const intRes = await query<{
      total: string;
      pending: string;
      approved: string;
    }>(
      `SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 END)::int as pending,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)::int as approved
       FROM internships
       WHERE company_id = $1`,
      [company.id]
    );

    // Applications breakdown
    const appsRes = await query<{
      total: string;
      under_review: string;
      shortlisted: string;
      interview: string;
      selected: string;
    }>(
      `SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN a.status = 'UNDER_REVIEW' THEN 1 END)::int as under_review,
        COUNT(CASE WHEN a.status = 'SHORTLISTED' THEN 1 END)::int as shortlisted,
        COUNT(CASE WHEN a.status = 'INTERVIEW' THEN 1 END)::int as interview,
        COUNT(CASE WHEN a.status IN ('SELECTED', 'ACCEPTED') THEN 1 END)::int as selected
       FROM applications a
       JOIN internships i ON a.internship_id = i.id
       WHERE i.company_id = $1`,
      [company.id]
    );

    const intRow = intRes.rows[0] || { total: '0', pending: '0', approved: '0' };
    const appRow = appsRes.rows[0] || {
      total: '0',
      under_review: '0',
      shortlisted: '0',
      interview: '0',
      selected: '0',
    };

    return {
      totalInternships: Number(intRow.total || 0),
      pendingApproval: Number(intRow.pending || 0),
      approvedInternships: Number(intRow.approved || 0),
      totalApplications: Number(appRow.total || 0),
      underReview: Number(appRow.under_review || 0),
      shortlisted: Number(appRow.shortlisted || 0),
      interview: Number(appRow.interview || 0),
      selected: Number(appRow.selected || 0),
    };
  }
}
