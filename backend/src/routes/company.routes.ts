import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { authenticateJwt, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

// All company routes require authenticated COMPANY role
router.use(authenticateJwt);
router.use(authorizeRole(['COMPANY']));

router.get('/profile', CompanyController.getProfile);
router.put('/profile', CompanyController.updateProfile);
router.get('/stats', CompanyController.getCompanyStats);

router.get('/applications', CompanyController.getCompanyApplications);
router.get('/applications/:id/resume', CompanyController.getApplicationResume);
router.patch('/applications/:id/status', CompanyController.updateApplicationStatus);

router.get('/internships', CompanyController.getInternships);
router.post('/internships', CompanyController.createInternship);
router.get('/internships/:id', CompanyController.getInternshipById);
router.put('/internships/:id', CompanyController.updateInternship);
router.delete('/internships/:id', CompanyController.deleteInternship);

export default router;
