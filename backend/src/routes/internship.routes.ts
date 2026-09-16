import { Router } from 'express';
import { InternshipController } from '../controllers/internship.controller.js';
import { authenticateJwt, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public internship listing
router.get('/', InternshipController.getPublicInternships);

// Student saved internships list (Defined BEFORE /:id to prevent route shadowing)
router.get('/saved', authenticateJwt, authorizeRole(['STUDENT']), InternshipController.getSaved);

// Public single internship details
router.get('/:id', InternshipController.getPublicInternshipById);

// Student application submission
router.post('/:id/apply', authenticateJwt, authorizeRole(['STUDENT']), InternshipController.apply);

// Student bookmark saving
router.post('/:id/save', authenticateJwt, authorizeRole(['STUDENT']), InternshipController.save);

// Student bookmark removal
router.delete('/:id/save', authenticateJwt, authorizeRole(['STUDENT']), InternshipController.unsave);

export default router;
