import { Router } from 'express';
import {
  getSavingsGoals,
  createSavingsGoal,
  addProgressToGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '../controllers/savingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getSavingsGoals);
router.post('/', authenticateToken, createSavingsGoal);
router.post('/:id/progress', authenticateToken, addProgressToGoal);
router.put('/:id', authenticateToken, updateSavingsGoal);
router.delete('/:id', authenticateToken, deleteSavingsGoal);

export default router;
