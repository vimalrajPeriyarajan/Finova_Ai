import { Request, Response } from 'express';
import { db } from '../config/database';

export const getArticles = async (req: Request, res: Response) => {
  try {
    const { category, language, search } = req.query;

    const articles = await db.financialArticles.find((a) => {
      if (!a.isPublished) return false;
      if (category && category !== 'ALL' && a.category !== category) return false;
      if (language && a.language !== language) return false;
      if (search) {
        const s = String(search).toLowerCase();
        const titleMatch = a.title.toLowerCase().includes(s);
        const explMatch = a.shortExplanation.toLowerCase().includes(s);
        if (!titleMatch && !explMatch) return false;
      }
      return true;
    });

    return res.status(200).json({ success: true, data: articles });
  } catch (err: any) {
    console.error('Get articles error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch financial articles' });
  }
};
