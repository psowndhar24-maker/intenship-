import { Request, Response, NextFunction } from 'express';
import { InternshipService } from '../services/internship.service.js';
import { ApplicationService } from '../services/application.service.js';
import { SavedService } from '../services/saved.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class InternshipController {
  public static getPublicInternships = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        search,
        category,
        location,
        workMode,
        work_mode,
        internshipType,
        internship_type,
        isPaid,
        is_paid,
        paid,
        experienceLevel,
        experience_level,
        sortBy,
        sortOrder,
        page,
        limit
      } = req.query;

      const result = await InternshipService.getPublicInternships({
        search: (search as string) || undefined,
        category: (category as string) || undefined,
        location: (location as string) || undefined,
        workMode: (workMode as string) || (work_mode as string) || undefined,
        internshipType: (internshipType as string) || (internship_type as string) || undefined,
        isPaid: (isPaid ?? is_paid ?? paid) as string | boolean | undefined,
        experienceLevel: (experienceLevel as string) || (experience_level as string) || undefined,
        sortBy: (sortBy as 'deadline' | 'latest' | 'stipend') || undefined,
        sortOrder: (sortOrder as 'asc' | 'desc') || undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
      });

      // Always return 200 even if empty
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public static getPublicInternshipById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const internship = await InternshipService.getPublicInternshipById(id);
      res.status(200).json({
        success: true,
        data: internship
      });
    } catch (err) {
      next(err);
    }
  };

  public static apply = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { cover_letter, coverLetter, additional_info, additionalInfo } = req.body || {};

      const application = await ApplicationService.applyForInternship(userId, id, {
        coverLetter: cover_letter || coverLetter,
        additionalInfo: additional_info || additionalInfo,
      });

      res.status(201).json({
        success: true,
        message: 'Internship application successfully submitted.',
        data: application
      });
    } catch (err) {
      next(err);
    }
  };

  public static save = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const bookmark = await SavedService.saveInternship(userId, id);
      res.status(201).json({
        success: true,
        message: 'Internship successfully added to saved bookmarks.',
        data: bookmark
      });
    } catch (err) {
      next(err);
    }
  };

  public static unsave = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      await SavedService.unsaveInternship(userId, id);
      res.status(200).json({
        success: true,
        message: 'Internship removed from saved bookmarks.'
      });
    } catch (err) {
      next(err);
    }
  };

  public static getSaved = async (
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

      const bookmarks = await SavedService.getSavedInternships(userId);
      res.status(200).json({
        success: true,
        data: bookmarks
      });
    } catch (err) {
      next(err);
    }
  };
}
