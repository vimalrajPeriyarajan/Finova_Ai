import { Router } from 'express';
import {
  getDocuments,
  uploadDocument,
  getDocumentById,
  deleteDocument,
} from '../controllers/documentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getDocuments);
router.post('/', authenticateToken, uploadDocument);
router.get('/:id', authenticateToken, getDocumentById);
router.delete('/:id', authenticateToken, deleteDocument);

export default router;
