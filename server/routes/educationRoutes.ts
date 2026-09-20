import { Router } from 'express';
import { getArticles } from '../controllers/educationController';

const router = Router();

router.get('/articles', getArticles);

export default router;
