import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const requireRole = (role: 'ADMIN') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated user',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Administrator privileges required',
      });
    }

    next();
  };
};
