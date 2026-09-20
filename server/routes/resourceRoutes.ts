import { Router } from 'express';
import {
  getResources,
  getNearbyResources,
  getResourceById,
  reportResource,
} from '../controllers/resourceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getResources);
router.get('/nearby', authenticateToken, getNearbyResources);
router.get('/:id', authenticateToken, getResourceById);
router.post('/:id/report', authenticateToken, reportResource);

export default router;
