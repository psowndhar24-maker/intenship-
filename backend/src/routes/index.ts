import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import internshipRoutes from './internship.routes.js';
import companyRoutes from './company.routes.js';
import studentRoutes from './student.routes.js';
import applicationRoutes from './application.routes.js';
import adminRoutes from './admin.routes.js';
import externalInternshipRoutes from './externalInternship.routes.js';
import notificationRoutes from './notification.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/internships', internshipRoutes);
apiRouter.use('/company', companyRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/student', studentRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/external-internships', externalInternshipRoutes);

export default apiRouter;
