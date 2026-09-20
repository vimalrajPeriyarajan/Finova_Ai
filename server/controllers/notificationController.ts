import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const list = await db.notifications.find((n) => n.userId === userId);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = list.filter((n) => !n.isRead).length;

    return res.status(200).json({
      success: true,
      data: list,
      unreadCount,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notif = await db.notifications.findById(id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Ownership check
    if (notif.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await db.notifications.updateById(id, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const userNotifs = await db.notifications.find((n) => n.userId === userId && !n.isRead);
    for (const n of userNotifs) {
      await db.notifications.updateById(n.id, { isRead: true });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications' });
  }
};
