import fs from 'fs';
import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { DocumentService } from '../services/document.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { query } from '../db/index.js';
import { getSafeConfigStatus } from '../config/env.js';
import { ExternalInternshipService } from '../services/external/index.js';
import { logger } from '../utils/logger.js';

export class AdminController {
  /**
   * GET /api/admin/dashboard
   */
  public static getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await AdminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/internships
   */
  public static getInternships = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { search, status, category, companyId, sortBy, sortOrder, page, limit } = req.query;

      const result = await AdminService.getInternships({
        search: search as string,
        status: status as string,
        category: category as string,
        companyId: companyId as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/internships/pending
   */
  public static getPendingInternships = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getPendingInternships(
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 20
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/internships/:id
   */
  public static getInternshipById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const internship = await AdminService.getInternshipById(id);

      if (!internship) {
        res.status(404).json({
          success: false,
          error: 'Internship posting not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: internship,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/admin/internships/:id/approve
   */
  public static approveInternship = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.sub;

      const approved = await AdminService.approveInternship(adminId, id, reason);

      res.status(200).json({
        success: true,
        message: 'Internship approved and published for student discovery.',
        data: approved,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to approve internship',
      });
    }
  };

  /**
   * POST /api/admin/internships/:id/reject
   */
  public static rejectInternship = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.sub;

      if (!reason || !reason.trim()) {
        res.status(400).json({
          success: false,
          error: 'A rejection reason is required.',
        });
        return;
      }

      const rejected = await AdminService.rejectInternship(adminId, id, reason);

      res.status(200).json({
        success: true,
        message: 'Internship rejected.',
        data: rejected,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to reject internship',
      });
    }
  };

  /**
   * POST /api/admin/internships/:id/request-changes
   */
  public static requestChanges = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, feedback } = req.body || {};
      const adminId = req.user!.sub;
      const note = reason || feedback;

      if (!note || !note.trim()) {
        res.status(400).json({
          success: false,
          error: 'Revision details and feedback are required.',
        });
        return;
      }

      const updated = await AdminService.requestChangesInternship(adminId, id, note);

      res.status(200).json({
        success: true,
        message: 'Revisions requested from partner company.',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to request revisions',
      });
    }
  };

  /**
   * GET /api/admin/internships/:id/reviews
   */
  public static getInternshipReviews = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const reviews = await AdminService.getInternshipReviews(id);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/companies
   */
  public static getCompanies = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { search, status, page, limit } = req.query;

      const result = await AdminService.getCompanies({
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/companies/:id
   */
  public static getCompanyById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const company = await AdminService.getCompanyById(id);

      if (!company) {
        res.status(404).json({
          success: false,
          error: 'Company profile not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/admin/companies/:id/verify
   */
  public static verifyCompany = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.sub;

      const verified = await AdminService.verifyCompany(adminId, id, reason);

      res.status(200).json({
        success: true,
        message: `Company ${verified.company_name} verified successfully.`,
        data: verified,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to verify company',
      });
    }
  };

  /**
   * POST /api/admin/companies/:id/reject
   */
  public static rejectCompany = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.sub;

      if (!reason || !reason.trim()) {
        res.status(400).json({
          success: false,
          error: 'A rejection reason is required.',
        });
        return;
      }

      const rejected = await AdminService.rejectCompany(adminId, id, reason);

      res.status(200).json({
        success: true,
        message: `Company ${rejected.company_name} rejected.`,
        data: rejected,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to reject company',
      });
    }
  };

  /**
   * POST /api/admin/companies/:id/suspend
   */
  public static suspendCompany = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.sub;

      if (!reason || !reason.trim()) {
        res.status(400).json({
          success: false,
          error: 'A suspension reason is required.',
        });
        return;
      }

      const suspended = await AdminService.suspendCompany(adminId, id, reason);

      res.status(200).json({
        success: true,
        message: `Company ${suspended.company_name} suspended.`,
        data: suspended,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to suspend company',
      });
    }
  };

  /**
   * GET /api/admin/audit-logs
   */
  public static getAuditLogs = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { search, action, entityType, page, limit } = req.query;

      const result = await AdminService.getAuditLogs({
        search: search as string,
        action: action as string,
        entityType: entityType as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Backward-compatibility PUT /api/admin/internships/:id/status
   */
  public static updateInternshipStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminId = req.user!.sub;

      if (status === 'APPROVED') {
        const approved = await AdminService.approveInternship(adminId, id, reason);
        res.status(200).json({
          success: true,
          message: 'Internship status transitioned to APPROVED',
          data: approved,
        });
        return;
      }

      if (status === 'REJECTED') {
        const rejected = await AdminService.rejectInternship(adminId, id, reason || 'Administrative rejection');
        res.status(200).json({
          success: true,
          message: 'Internship status transitioned to REJECTED',
          data: rejected,
        });
        return;
      }

      if (status === 'CHANGES_REQUESTED') {
        const updated = await AdminService.requestChangesInternship(adminId, id, reason || 'Revisions requested');
        res.status(200).json({
          success: true,
          message: 'Internship status transitioned to CHANGES_REQUESTED',
          data: updated,
        });
        return;
      }

      const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'CLOSED', 'EXPIRED'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of [${validStatuses.join(', ')}]`,
        });
        return;
      }

      const result = await query(
        `UPDATE internships 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Internship not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Internship status transitioned to ${status}`,
        data: result.rows[0],
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Status transition failed',
      });
    }
  };

  /**
   * GET /api/admin/config-status
   * Safe server diagnostics returning boolean flags only without leaking secret credentials.
   */
  public static getConfigStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const status = getSafeConfigStatus();
      res.status(200).json({
        success: true,
        data: {
          databaseConfigured: status.databaseConfigured,
          databaseMode: status.databaseMode,
          jwtConfigured: status.jwtConfigured,
          externalApiConfigured: status.externalApiConfigured,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/admin/external-internships/sync
   * Triggers administrator-governed synchronization of external internships.
   * Enforces moderation workflow: all imported postings enter PENDING_APPROVAL.
   */
  public static syncExternalInternships = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = req.user?.sub || req.user?.username || 'admin';
      const result = await ExternalInternshipService.syncInternships(adminId);
      res.status(200).json({
        success: true,
        message: 'Sync completed',
        data: result,
      });
    } catch (err: any) {
      logger.error('Admin syncExternalInternships error:', err instanceof Error ? err.message : 'Unknown error');
      res.status(err.statusCode || 503).json({
        success: false,
        message: err.message || 'External internship service is currently unavailable.',
      });
    }
  };

  /**
   * GET /api/admin/external-internships/status
   * Safe status check for admin interface.
   */
  public static getExternalStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const status = await ExternalInternshipService.getStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/students
   * Query all registered students with profile details and placement stats
   */
  public static getStudents = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { search, page, limit } = req.query;
      const result = await AdminService.getStudents({
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/applications
   * Query all student internship applications
   */
  public static getApplications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { search, status, page, limit } = req.query;
      const result = await AdminService.getApplications({
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/admin/applications/:id/resume
   * Securely stream candidate application resume snapshot for administrative review
   */
  public static getApplicationResume = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { doc, absolutePath } = await DocumentService.getApplicationResumeFile(id);

      const isDownload = req.query.download === 'true';
      const disposition = isDownload ? 'attachment' : 'inline';

      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(doc.original_filename)}"`
      );
      res.setHeader('Content-Length', doc.file_size);

      const stream = fs.createReadStream(absolutePath);
      stream.on('error', (err) => next(err));
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };
}
