import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getBudgets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const budgets = await db.budgets.find((b) => b.userId === userId);

    const monthlyExpenses = await db.transactions.find(
      (t) => t.userId === userId && t.type === 'EXPENSE' && t.date.startsWith(currentMonth)
    );

    const data = budgets.map((b) => {
      const spent = monthlyExpenses
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...b,
        spent,
        remaining: Math.max(0, b.monthlyLimit - spent),
        percentUsed: Math.min(100, Math.round((spent / b.monthlyLimit) * 100)),
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Get budgets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
  }
};

export const createBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { category, monthlyLimit, month, alertThreshold } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const limit = Number(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ success: false, message: 'Budget limit must be greater than 0' });
    }

    const currentMonth = month || new Date().toISOString().slice(0, 7);

    // Check if budget already exists for category and month
    const existing = await db.budgets.findOne(
      (b) => b.userId === userId && b.category === category.trim() && b.month === currentMonth
    );

    if (existing) {
      const updated = await db.budgets.updateById(existing.id, {
        monthlyLimit: limit,
        alertThreshold: alertThreshold || 80,
      });
      return res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: updated,
      });
    }

    const newBudget = await db.budgets.insert({
      userId,
      category: category.trim(),
      monthlyLimit: limit,
      month: currentMonth,
      alertThreshold: alertThreshold || 80,
      alertSent: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: newBudget,
    });
  } catch (err: any) {
    console.error('Create budget error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create budget' });
  }
};

export const updateBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { monthlyLimit, alertThreshold } = req.body;

    const existing = await db.budgets.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Ownership check
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this budget' });
    }

    const updates: any = {};
    if (monthlyLimit !== undefined) {
      const limit = Number(monthlyLimit);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ success: false, message: 'Budget limit must be positive' });
      }
      updates.monthlyLimit = limit;
    }
    if (alertThreshold !== undefined) {
      updates.alertThreshold = alertThreshold;
    }

    const updated = await db.budgets.updateById(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update budget' });
  }
};

export const deleteBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const existing = await db.budgets.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Ownership check
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this budget' });
    }

    await db.budgets.deleteById(id);

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete budget' });
  }
};
