import { Router, Request, Response } from 'express';
import { ExternalInternshipService } from '../services/external/index.js';

const router = Router();

/**
 * GET /api/external-internships/status
 * Public / authenticated status check for external internship integration.
 * Returns safe status: 'CONFIGURED' | 'NOT CONFIGURED' | 'UNAVAILABLE'
 * Never exposes API keys, tokens, or credentials.
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await ExternalInternshipService.getStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: {
        status: 'UNAVAILABLE',
        providerName: 'ExternalProvider',
        lastSyncTime: null,
        syncEnabled: false,
        syncIntervalMinutes: 360,
      },
    });
  }
});

export default router;
