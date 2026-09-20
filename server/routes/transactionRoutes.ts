import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createTransaction);
router.get('/', authenticateToken, getTransactions);
router.get('/:id', authenticateToken, getTransactionById);
router.put('/:id', authenticateToken, updateTransaction);
router.delete('/:id', authenticateToken, deleteTransaction);

export default router;
