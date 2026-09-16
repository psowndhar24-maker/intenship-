import fs from 'fs';
import { Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service.js';
import { ApplicationService } from '../services/application.service.js';
import { DocumentService } from '../services/document.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class CompanyController {
  public static getInternships = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const internships = await CompanyService.getCompanyInternships(userId);
      res.status(200).json({
        success: true,
        data: internships
      });
    } catch (err) {
      next(err);
    }
  };

  public static createInternship = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const internship = await CompanyService.createInternship(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Internship posting initialized with status PENDING_APPROVAL.',
        data: internship
      });
    } catch (err) {
      next(err);
    }
  };

  public static getInternshipById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const internship = await CompanyService.getCompanyInternshipById(userId, id);
      res.status(200).json({
        success: true,
        data: internship
      });
    } catch (err) {
      next(err);
    }
  };

  public static updateInternship = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const updated = await CompanyService.updateInternship(userId, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Internship updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  public static deleteInternship = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      await CompanyService.deleteInternship(userId, id);
      res.status(200).json({
        success: true,
        message: 'Internship deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  };

  public static getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const profile = await CompanyService.getProfile(userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  public static updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const profile = await CompanyService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Company profile updated successfully.',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  public static getCompanyApplications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const applications = await CompanyService.getCompanyApplications(userId);
      res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  };

  public static updateApplicationStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;
      const { status, note } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const updated = await CompanyService.updateApplicationStatus(userId, id, status, note);
      res.status(200).json({
        success: true,
        message: `Application status updated to ${status}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  public static getCompanyStats = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const stats = await CompanyService.getCompanyStats(userId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  public static getApplicationResume = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Verify that this application belongs to one of company's internships
      await ApplicationService.getApplicationById(id, userId, 'COMPANY');

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
