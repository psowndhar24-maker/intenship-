import { Router, Response } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthService } from '../services/auth.service.js';

const router = Router();

router.post('/login', AuthController.login);

router.get('/me', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const user = AuthService.getAccountByUsername(req.user.username);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found in registry' });
    return;
  }

  res.status(200).json({
    success: true,
    user
  });
});

export default router;
