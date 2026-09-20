import { Router } from 'express';
import { chatWithAi, parseVoice } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/chat', authenticateToken, chatWithAi);
router.post('/parse-voice', authenticateToken, parseVoice);

export default router;
