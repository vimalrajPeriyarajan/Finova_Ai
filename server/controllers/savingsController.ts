import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getSavingsGoals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const goals = await db.savingsGoals.find((g) => g.userId === userId);
    goals.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    const data = goals.map((g) => ({
      ...g,
      percentage: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)),
      remainingAmount: Math.max(0, g.targetAmount - g.currentAmount),
    }));

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch savings goals' });
  }
};

export const createSavingsGoal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { title, targetAmount, currentAmount, targetDate, category } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const target = Number(targetAmount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ success: false, message: 'Target amount must be greater than 0' });
    }

    const current = Number(currentAmount) || 0;
    const isCompleted = current >= target;

    const newGoal = await db.savingsGoals.insert({
      userId,
      title: title.trim(),
      targetAmount: target,
      currentAmount: Math.max(0, current),
      targetDate: targetDate ? new Date(targetDate).toISOString() : new Date().toISOString(),
      category: category || 'General',
      isCompleted,
    });

    return res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: newGoal,
    });
  } catch (err: any) {
    console.error('Create savings goal error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create savings goal' });
  }
};

export const addProgressToGoal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { amount } = req.body;

    const deposit = Number(amount);
    if (isNaN(deposit) || deposit <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount must be greater than 0' });
    }

    const existing = await db.savingsGoals.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Ownership check
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this goal' });
    }

    const newCurrent = existing.currentAmount + deposit;
    const isCompleted = newCurrent >= existing.targetAmount;

    const updated = await db.savingsGoals.updateById(id, {
      currentAmount: newCurrent,
      isCompleted,
    });

    // If completed, trigger congratulations notification
    if (isCompleted && !existing.isCompleted) {
      await db.notifications.insert({
        userId,
        type: 'SAVINGS_REMINDER',
        title: '🎉 Goal Achieved!',
        message: `Congratulations! You have reached your savings target of ₹${existing.targetAmount.toLocaleString('en-IN')} for "${existing.title}".`,
        isRead: false,
        relatedEntityId: existing.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Savings progress updated',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update goal progress' });
  }
};

export const updateSavingsGoal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, targetAmount, targetDate, category } = req.body;

    const existing = await db.savingsGoals.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Ownership check
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this goal' });
    }

    const updates: any = {};
    if (title) updates.title = title.trim();
    if (targetAmount !== undefined) {
      const t = Number(targetAmount);
      if (isNaN(t) || t <= 0) {
        return res.status(400).json({ success: false, message: 'Target amount must be positive' });
      }
      updates.targetAmount = t;
      updates.isCompleted = existing.currentAmount >= t;
    }
    if (targetDate) updates.targetDate = new Date(targetDate).toISOString();
    if (category) updates.category = category;

    const updated = await db.savingsGoals.updateById(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
};

export const deleteSavingsGoal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const existing = await db.savingsGoals.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Ownership check
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this goal' });
    }

    await db.savingsGoals.deleteById(id);

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
};
