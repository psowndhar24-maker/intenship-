import { Router, Request, Response, NextFunction } from 'express';
import { StudentController } from '../controllers/student.controller.js';
import { authenticateJwt, authorizeRole } from '../middleware/auth.middleware.js';
import { resumeUploadMiddleware } from '../services/document.service.js';

const router = Router();

// All student routes require authenticated STUDENT role
router.use(authenticateJwt);
router.use(authorizeRole(['STUDENT']));

// Multer upload wrapper for clear JSON error responses
const handleResumeUpload = (req: Request, res: Response, next: NextFunction) => {
  resumeUploadMiddleware.single('resume')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: 'File size exceeds maximum limit of 5MB. Please upload a smaller document.',
        });
        return;
      }
      res.status(err.status || 400).json({
        success: false,
        error: err.message || 'File upload failed. Only PDF, DOC, and DOCX files up to 5MB are permitted.',
      });
      return;
    }
    next();
  });
};

router.get('/profile', StudentController.getProfile);
router.put('/profile', StudentController.updateProfile);
router.get('/stats', StudentController.getStats);

// Student Resume Endpoints
router.get('/resume', StudentController.getResume);
router.post('/resume', handleResumeUpload, StudentController.uploadResume);
router.put('/resume', handleResumeUpload, StudentController.uploadResume);
router.get('/resume/view', StudentController.viewResume);
router.get('/resume/download', StudentController.downloadResume);
router.delete('/resume', StudentController.deleteResume);

export default router;

