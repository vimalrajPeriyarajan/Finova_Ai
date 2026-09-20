import { Router } from 'express';
import {
  getAdminStats,
  createResource,
  updateResource,
  updateVerificationStatus,
  archiveResource,
  getReports,
  resolveReport,
  createArticle,
  updateArticle,
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// All admin routes require valid authentication AND ADMIN role
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/stats', getAdminStats);
router.post('/resources', createResource);
router.put('/resources/:id', updateResource);
router.put('/resources/:id/verification', updateVerificationStatus);
router.put('/resources/:id/archive', archiveResource);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.post('/articles', createArticle);
router.put('/articles/:id', updateArticle);

export default router;
