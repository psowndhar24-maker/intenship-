import fs from 'fs';
import { Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service.js';
import { ApplicationService } from '../services/application.service.js';
import { DocumentService } from '../services/document.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class StudentController {
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

      const profile = await StudentService.getProfile(userId);
      res.status(200).json({
        success: true,
        data: profile
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

      const updated = await StudentService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Student profile updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  public static getStats = async (
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

      const stats = await ApplicationService.getStudentStats(userId);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  };

  public static getResume = async (
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

      const resume = await DocumentService.getStudentResume(userId);
      res.status(200).json({
        success: true,
        data: resume,
      });
    } catch (err) {
      next(err);
    }
  };

  public static uploadResume = async (
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

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No resume file uploaded. Please upload a PDF, DOC, or DOCX file up to 5MB.',
        });
        return;
      }

      const doc = await DocumentService.saveStudentResume(userId, req.file);
      res.status(200).json({
        success: true,
        message: 'Resume uploaded and encrypted to student profile successfully.',
        data: {
          id: doc.id,
          original_filename: doc.original_filename,
          mime_type: doc.mime_type,
          file_size: doc.file_size,
          created_at: doc.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public static viewResume = async (
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

      const { doc, absolutePath } = await DocumentService.getStudentResumeFile(userId);

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

  public static downloadResume = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    req.query.download = 'true';
    return StudentController.viewResume(req, res, next);
  };

  public static deleteResume = async (
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

      await DocumentService.deleteStudentResume(userId);
      res.status(200).json({
        success: true,
        message: 'Resume removed from student profile successfully.',
      });
    } catch (err) {
      next(err);
    }
  };
}

