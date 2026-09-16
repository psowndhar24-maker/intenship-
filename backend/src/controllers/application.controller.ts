import fs from 'fs';
import { Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service.js';
import { DocumentService } from '../services/document.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class ApplicationController {
  public static getStudentApplications = async (
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

      const applications = await ApplicationService.getStudentApplications(userId);
      res.status(200).json({
        success: true,
        data: applications
      });
    } catch (err) {
      next(err);
    }
  };

  public static getApplicationDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId || !userRole) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const application = await ApplicationService.getApplicationById(id, userId, userRole);
      res.status(200).json({
        success: true,
        data: application,
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
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId || !userRole) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // 1. Verify access authorization
      await ApplicationService.getApplicationById(id, userId, userRole);

      // 2. Fetch application resume snapshot
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

  public static withdraw = async (
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

      const result = await ApplicationService.withdrawApplication(userId, id);
      res.status(200).json({
        success: true,
        message: 'Application successfully withdrawn.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}

