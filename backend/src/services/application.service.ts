import { query } from '../db/index.js';
import { StudentService } from './student.service.js';
import { DocumentService } from './document.service.js';
import { NotificationService } from './notification.service.js';
import { Application, ApplicationStatusHistory } from '../types/index.js';

export interface StudentDashboardStats {
  totalApplications: number;
  underReview: number;
  shortlisted: number;
  interview: number;
  selected: number;
  savedInternships: number;
  pendingApplications: number;
  selectedApplications: number;
}

export interface ApplyOptions {
  coverLetter?: string;
  additionalInfo?: string;
}

export class ApplicationService {
  /**
   * Submit an application for an internship.
   * Creates application record, resume document snapshot, initial status history, and in-app notifications.
   */
  public static async applyForInternship(
    userId: string,
    internshipId: string,
    options?: ApplyOptions
  ): Promise<Application> {
    const studentProfile = await StudentService.getProfile(userId);

    // Verify internship status
    const internshipRes = await query<{
      id: string;
      title: string;
      company_id: string;
      company_name: string;
      status: string;
      application_deadline: string;
    }>(
      `SELECT i.id, i.title, i.company_id, i.status, i.application_deadline, c.company_name
       FROM internships i
       JOIN companies c ON i.company_id = c.id
       WHERE i.id = $1`,
      [internshipId]
    );

    if (internshipRes.rows.length === 0) {
      const error: any = new Error('Internship opportunity not found.');
      error.status = 404;
      error.code = 'INTERNSHIP_NOT_FOUND';
      throw error;
    }

    const internship = internshipRes.rows[0];

    if (internship.status !== 'APPROVED') {
      const error: any = new Error('Cannot apply: This internship listing is not open for student applications.');
      error.status = 400;
      error.code = 'INTERNSHIP_NOT_ACTIVE';
      throw error;
    }

    // Check deadline
    const deadline = new Date(internship.application_deadline);
    if (deadline.getTime() <= Date.now()) {
      const error: any = new Error('Cannot apply: The application deadline for this internship has already passed.');
      error.status = 400;
      error.code = 'DEADLINE_PASSED';
      throw error;
    }

    // Check duplicate application
    const existingApp = await query(
      'SELECT id, status FROM applications WHERE student_id = $1 AND internship_id = $2',
      [studentProfile.id, internshipId]
    );

    if (existingApp.rows.length > 0) {
      const error: any = new Error('Duplicate application: You have already submitted an application for this internship.');
      error.status = 409;
      error.code = 'DUPLICATE_APPLICATION';
      throw error;
    }

    // Insert new application
    const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const insertSql = `
      INSERT INTO applications (id, student_id, internship_id, status, cover_letter, additional_info)
      VALUES ($1, $2, $3, 'APPLIED', $4, $5)
      RETURNING *
    `;

    const result = await query<Application>(insertSql, [
      appId,
      studentProfile.id,
      internshipId,
      options?.coverLetter?.trim() || null,
      options?.additionalInfo?.trim() || null,
    ]);

    // 1. Create an immutable snapshot of student's active resume for this application
    try {
      await DocumentService.createApplicationResumeSnapshot(studentProfile.id, appId);
    } catch (err) {
      console.warn('Notice: Resume snapshot capture error:', err);
    }

    // 2. Insert initial entry into application_status_history
    const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO application_status_history (
        id, application_id, old_status, new_status, changed_by, changed_by_role, note, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [
        histId,
        appId,
        null,
        'APPLIED',
        userId,
        'STUDENT',
        'Application submitted successfully with verified profile credentials.',
      ]
    );

    // 3. Dispatch in-app notification to the Student
    try {
      await NotificationService.createNotification({
        userId,
        type: 'APPLICATION_SUBMITTED',
        title: 'Application Submitted',
        message: `Your application for "${internship.title}" at ${internship.company_name} was successfully submitted. Ref: ${appId}.`,
        relatedEntityType: 'APPLICATION',
        relatedEntityId: appId,
      });
    } catch (notifErr) {
      console.warn('Notice: Failed to create student notification:', notifErr);
    }

    // 4. Dispatch in-app notification to the Company
    try {
      const compUserRes = await query<{ user_id: string }>(
        'SELECT user_id FROM companies WHERE id = $1',
        [internship.company_id]
      );
      if (compUserRes.rows[0]?.user_id) {
        await NotificationService.createNotification({
          userId: compUserRes.rows[0].user_id,
          type: 'NEW_APPLICATION_RECEIVED',
          title: 'New Candidate Application',
          message: `${studentProfile.full_name || 'A candidate'} submitted an application for "${internship.title}". Ref: ${appId}.`,
          relatedEntityType: 'APPLICATION',
          relatedEntityId: appId,
        });
      }
    } catch (compNotifErr) {
      console.warn('Notice: Failed to create company notification:', compNotifErr);
    }

    // 5. Record institutional audit log
    try {
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auditId,
          userId,
          'APPLICATION_SUBMITTED',
          'APPLICATION',
          appId,
          JSON.stringify({
            student_id: studentProfile.id,
            internship_id: internshipId,
            student_name: studentProfile.full_name,
            internship_title: internship.title,
          }),
        ]
      );
    } catch (auditErr) {
      console.warn('Notice: Failed to insert audit log:', auditErr);
    }

    return result.rows[0];
  }

  /**
   * Fetch all applications submitted by a student.
   */
  public static async getStudentApplications(userId: string): Promise<Application[]> {
    const studentProfile = await StudentService.getProfile(userId);

    const sql = `
      SELECT 
        a.id,
        a.student_id,
        a.internship_id,
        a.status,
        a.applied_at,
        a.updated_at,
        a.cover_letter,
        a.additional_info,
        a.resume_id,
        i.title as internship_title,
        i.category as internship_category,
        i.location,
        i.work_mode,
        i.stipend,
        i.application_deadline,
        c.company_name,
        COALESCE(ad.original_filename, sd.original_filename) as resume_filename,
        COALESCE(ad.file_size, sd.file_size) as resume_file_size,
        COALESCE(ad.mime_type, sd.mime_type) as resume_mime_type,
        (
          SELECT note 
          FROM application_status_history 
          WHERE application_id = a.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as latest_status_note
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      LEFT JOIN application_documents ad ON a.id = ad.application_id AND ad.document_type = 'RESUME'
      LEFT JOIN student_documents sd ON a.student_id = sd.student_id AND sd.document_type = 'RESUME'
      WHERE a.student_id = $1
      ORDER BY a.applied_at DESC
    `;

    const result = await query<Application>(sql, [studentProfile.id]);
    return result.rows;
  }

  /**
   * Fetch complete application details with status history and verification snapshot.
   * Enforces strict role-based access control and ownership verification.
   */
  public static async getApplicationById(
    applicationId: string,
    userId: string,
    userRole: string
  ): Promise<Application> {
    const sql = `
      SELECT 
        a.id,
        a.student_id,
        a.internship_id,
        a.status,
        a.applied_at,
        a.updated_at,
        a.cover_letter,
        a.additional_info,
        a.resume_id,
        i.title as internship_title,
        i.category as internship_category,
        i.location,
        i.work_mode,
        i.stipend,
        i.application_deadline,
        i.company_id,
        c.company_name,
        c.website as company_website,
        c.location as company_location,
        sp.id as student_profile_id,
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
        COALESCE(ad.original_filename, sd.original_filename) as resume_filename,
        COALESCE(ad.file_size, sd.file_size) as resume_file_size,
        COALESCE(ad.mime_type, sd.mime_type) as resume_mime_type
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      JOIN student_profiles sp ON a.student_id = sp.id
      LEFT JOIN application_documents ad ON a.id = ad.application_id AND ad.document_type = 'RESUME'
      LEFT JOIN student_documents sd ON a.student_id = sd.student_id AND sd.document_type = 'RESUME'
      WHERE a.id = $1
      LIMIT 1
    `;

    const result = await query<any>(sql, [applicationId]);
    if (result.rows.length === 0) {
      const error: any = new Error('Application record not found.');
      error.status = 404;
      error.code = 'APPLICATION_NOT_FOUND';
      throw error;
    }

    const app = result.rows[0];

    // Authorization verification
    if (userRole === 'STUDENT') {
      const studentProfile = await StudentService.getProfile(userId);
      if (app.student_id !== studentProfile.id) {
        const error: any = new Error('Access denied: You are not authorized to view this application.');
        error.status = 403;
        error.code = 'ACCESS_DENIED';
        throw error;
      }
    } else if (userRole === 'COMPANY') {
      const compRes = await query('SELECT id FROM companies WHERE user_id = $1', [userId]);
      if (compRes.rows.length === 0 || compRes.rows[0].id !== app.company_id) {
        const error: any = new Error('Access denied: This application is for another company.');
        error.status = 403;
        error.code = 'ACCESS_DENIED';
        throw error;
      }
    } else if (userRole !== 'ADMIN') {
      const error: any = new Error('Access denied: Unauthorized role.');
      error.status = 403;
      error.code = 'ACCESS_DENIED';
      throw error;
    }

    // Parse projects
    let parsedProjects = [];
    if (app.projects) {
      if (typeof app.projects === 'string') {
        try {
          parsedProjects = JSON.parse(app.projects);
        } catch {
          parsedProjects = [];
        }
      } else if (Array.isArray(app.projects)) {
        parsedProjects = app.projects;
      }
    }
    app.projects = parsedProjects;

    // Fetch official status history audit trail
    const historySql = `
      SELECT 
        h.id,
        h.application_id,
        h.old_status,
        h.new_status,
        h.changed_by,
        h.changed_by_role,
        h.note,
        h.created_at,
        COALESCE(u.display_name, u.username, h.changed_by_role) as changed_by_name
      FROM application_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.application_id = $1
      ORDER BY h.created_at ASC
    `;
    const historyRes = await query<ApplicationStatusHistory>(historySql, [applicationId]);
    let history = historyRes.rows;

    // If no history exists (e.g., legacy or pre-seeded row), generate canonical history
    if (history.length === 0) {
      history = [
        {
          id: `hist_init_${app.id}`,
          application_id: app.id,
          old_status: null,
          new_status: 'APPLIED',
          changed_by: null,
          changed_by_role: 'STUDENT',
          note: 'Application submitted successfully.',
          created_at: app.applied_at,
          changed_by_name: app.student_name || 'Candidate',
        },
      ];
      if (app.status !== 'APPLIED') {
        history.push({
          id: `hist_curr_${app.id}`,
          application_id: app.id,
          old_status: 'APPLIED',
          new_status: app.status,
          changed_by: null,
          changed_by_role: app.status === 'WITHDRAWN' ? 'STUDENT' : 'COMPANY',
          note: app.status === 'WITHDRAWN' ? 'Application withdrawn by applicant.' : 'Status updated by corporate reviewer.',
          created_at: app.updated_at || app.applied_at,
          changed_by_name: app.status === 'WITHDRAWN' ? (app.student_name || 'Candidate') : (app.company_name || 'Recruiter'),
        });
      }
    }

    app.status_history = history;
    return app;
  }

  /**
   * Withdraw an application initiated by the student.
   * Validates eligibility, records status change history, notifies parties, and logs audit record.
   */
  public static async withdrawApplication(userId: string, applicationId: string): Promise<Application> {
    const studentProfile = await StudentService.getProfile(userId);

    const existingApp = await query<any>(
      `SELECT a.*, i.title as internship_title, i.company_id, c.company_name
       FROM applications a
       JOIN internships i ON a.internship_id = i.id
       JOIN companies c ON i.company_id = c.id
       WHERE a.id = $1 AND a.student_id = $2`,
      [applicationId, studentProfile.id]
    );

    if (existingApp.rows.length === 0) {
      const error: any = new Error('Application not found or not authorized to withdraw.');
      error.status = 404;
      error.code = 'APPLICATION_NOT_FOUND';
      throw error;
    }

    const app = existingApp.rows[0];
    if (app.status === 'WITHDRAWN') {
      const error: any = new Error('Application has already been withdrawn.');
      error.status = 400;
      error.code = 'ALREADY_WITHDRAWN';
      throw error;
    }

    if (['SELECTED', 'ACCEPTED'].includes(app.status)) {
      const error: any = new Error('Cannot withdraw an application that has already been selected or accepted.');
      error.status = 400;
      error.code = 'CANNOT_WITHDRAW_SELECTED';
      throw error;
    }

    if (app.status === 'REJECTED') {
      const error: any = new Error('Cannot withdraw an application that has already been concluded as rejected.');
      error.status = 400;
      error.code = 'CANNOT_WITHDRAW_REJECTED';
      throw error;
    }

    const updateSql = `
      UPDATE applications
      SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND student_id = $2
      RETURNING *
    `;

    const result = await query<Application>(updateSql, [applicationId, studentProfile.id]);
    const updatedApp = result.rows[0];

    // Record in status history
    const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO application_status_history (
        id, application_id, old_status, new_status, changed_by, changed_by_role, note, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [
        histId,
        applicationId,
        app.status,
        'WITHDRAWN',
        userId,
        'STUDENT',
        'Application formally withdrawn by applicant.',
      ]
    );

    // Notify student
    try {
      await NotificationService.createNotification({
        userId,
        type: 'APPLICATION_WITHDRAWN',
        title: 'Application Withdrawn',
        message: `You have successfully withdrawn your application for "${app.internship_title || 'the position'}".`,
        relatedEntityType: 'APPLICATION',
        relatedEntityId: applicationId,
      });
    } catch (e) {
      console.warn('Notice: Student withdrawal notification failed:', e);
    }

    // Notify company
    try {
      const compRes = await query<{ user_id: string }>(
        'SELECT user_id FROM companies WHERE id = $1',
        [app.company_id]
      );
      if (compRes.rows[0]?.user_id) {
        await NotificationService.createNotification({
          userId: compRes.rows[0].user_id,
          type: 'APPLICATION_WITHDRAWN',
          title: 'Candidate Withdrew Application',
          message: `${studentProfile.full_name || 'A candidate'} withdrew their application for "${app.internship_title || 'Internship'}". Ref: ${applicationId}.`,
          relatedEntityType: 'APPLICATION',
          relatedEntityId: applicationId,
        });
      }
    } catch (e) {
      console.warn('Notice: Company withdrawal notification failed:', e);
    }

    // Audit log
    try {
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auditId,
          userId,
          'APPLICATION_WITHDRAWN',
          'APPLICATION',
          applicationId,
          JSON.stringify({
            student_id: studentProfile.id,
            previous_status: app.status,
            internship_id: app.internship_id,
          }),
        ]
      );
    } catch (e) {
      console.warn('Notice: Audit log failed:', e);
    }

    return updatedApp;
  }

  /**
   * Fetch statistical breakdown for student dashboard.
   */
  public static async getStudentStats(userId: string): Promise<StudentDashboardStats> {
    const studentProfile = await StudentService.getProfile(userId);

    const appsResult = await query<{
      total: string;
      under_review: string;
      shortlisted: string;
      interview: string;
      selected: string;
      pending: string;
    }>(
      `SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END)::int as under_review,
        COUNT(CASE WHEN status = 'SHORTLISTED' THEN 1 END)::int as shortlisted,
        COUNT(CASE WHEN status = 'INTERVIEW' THEN 1 END)::int as interview,
        COUNT(CASE WHEN status IN ('SELECTED', 'ACCEPTED') THEN 1 END)::int as selected,
        COUNT(CASE WHEN status IN ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW') THEN 1 END)::int as pending
       FROM applications
       WHERE student_id = $1`,
      [studentProfile.id]
    );

    const savedResult = await query<{ saved: string }>(
      `SELECT COUNT(*)::int as saved FROM saved_internships WHERE student_id = $1`,
      [studentProfile.id]
    );

    const row = appsResult.rows[0] || {
      total: '0',
      under_review: '0',
      shortlisted: '0',
      interview: '0',
      selected: '0',
      pending: '0',
    };
    const savedRow = savedResult.rows[0] || { saved: '0' };

    return {
      totalApplications: Number(row.total || 0),
      underReview: Number(row.under_review || 0),
      shortlisted: Number(row.shortlisted || 0),
      interview: Number(row.interview || 0),
      selected: Number(row.selected || 0),
      savedInternships: Number(savedRow.saved || 0),
      pendingApplications: Number(row.pending || 0),
      selectedApplications: Number(row.selected || 0),
    };
  }
}
