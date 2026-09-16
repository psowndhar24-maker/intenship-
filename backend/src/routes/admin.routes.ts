import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateJwt, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

// Strict RBAC: All administrative endpoints mandate authenticated ADMIN role (403 Forbidden for non-admins)
router.use(authenticateJwt);
router.use(authorizeRole(['ADMIN']));

// 1. Dashboard summary stats
router.get('/dashboard', AdminController.getDashboard);

// 2. Internship moderation queries
router.get('/internships/pending', AdminController.getPendingInternships);
router.get('/internships', AdminController.getInternships);
router.get('/internships/:id', AdminController.getInternshipById);
router.get('/internships/:id/reviews', AdminController.getInternshipReviews);

// 3. Internship moderation actions
router.post('/internships/:id/approve', AdminController.approveInternship);
router.post('/internships/:id/reject', AdminController.rejectInternship);
router.post('/internships/:id/request-changes', AdminController.requestChanges);

// Backward-compatibility PUT status endpoint
router.put('/internships/:id/status', AdminController.updateInternshipStatus);

// 4. Company directory & moderation
router.get('/companies', AdminController.getCompanies);
router.get('/companies/:id', AdminController.getCompanyById);
router.post('/companies/:id/verify', AdminController.verifyCompany);
router.post('/companies/:id/reject', AdminController.rejectCompany);
router.post('/companies/:id/suspend', AdminController.suspendCompany);

// 5. Governance Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

// 6. Student & Application Governance
router.get('/students', AdminController.getStudents);
router.get('/applications', AdminController.getApplications);
router.get('/applications/:id/resume', AdminController.getApplicationResume);

// 7. Safe Configuration Diagnostics (ADMIN only, booleans only)
router.get('/config-status', AdminController.getConfigStatus);

// 8. External Internship Governance & Sync (Admin only)
router.get('/external-internships/status', AdminController.getExternalStatus);
router.post('/external-internships/sync', AdminController.syncExternalInternships);

export default router;
