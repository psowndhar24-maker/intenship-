import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { authenticateJwt, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

// Authentication required for all application routes
router.use(authenticateJwt);

// Student-specific actions
router.get('/student', authorizeRole(['STUDENT']), ApplicationController.getStudentApplications);
router.post('/:id/withdraw', authorizeRole(['STUDENT']), ApplicationController.withdraw);

// Multi-role authorized endpoints (Student applicant, Posting Company, and Admin)
router.get('/:id', authorizeRole(['STUDENT', 'COMPANY', 'ADMIN']), ApplicationController.getApplicationDetails);
router.get('/:id/resume', authorizeRole(['STUDENT', 'COMPANY', 'ADMIN']), ApplicationController.getApplicationResume);

export default router;

