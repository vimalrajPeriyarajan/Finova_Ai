import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { amount, type, category, description, date, paymentMode } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive amount',
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    const txType = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const mode = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'].includes(paymentMode)
      ? paymentMode
      : 'UPI';

    const transaction = await db.transactions.insert({
      userId,
      amount: parsedAmount,
      type: txType,
      category: category.trim(),
      description: description ? description.trim() : (txType === 'INCOME' ? 'Income' : 'Expense'),
      date: txDate,
      paymentMode: mode,
    });

    // Check budget threshold alerts if this was an expense
    if (txType === 'EXPENSE') {
      const monthPrefix = txDate.slice(0, 7);
      const budget = await db.budgets.findOne(
        (b) => b.userId === userId && b.category === category.trim() && b.month === monthPrefix
      );

      if (budget) {
        const monthlyTransactions = await db.transactions.find(
          (t) =>
            t.userId === userId &&
            t.type === 'EXPENSE' &&
            t.category === category.trim() &&
            t.date.startsWith(monthPrefix)
        );

        const totalSpent = monthlyTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
        const percentUsed = (totalSpent / budget.monthlyLimit) * 100;

        if (percentUsed >= (budget.alertThreshold || 80) && !budget.alertSent) {
          await db.notifications.insert({
            userId,
            type: 'BUDGET_ALERT',
            title: `${budget.category} Budget Alert`,
            message: `Your ${budget.category} budget is ${Math.round(percentUsed)}% consumed (₹${totalSpent.toLocaleString('en-IN')} of ₹${budget.monthlyLimit.toLocaleString('en-IN')}).`,
            isRead: false,
            relatedEntityId: budget.id,
          });

          await db.budgets.updateById(budget.id, { alertSent: true });
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Transaction saved successfully',
      data: transaction,
    });
  } catch (err: any) {
    console.error('Create transaction error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to record transaction',
    });
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { type, category, startDate, endDate, search, limit, page } = req.query;

    const list = await db.transactions.find((t) => {
      if (t.userId !== userId) return false;
      if (type && type !== 'ALL' && t.type !== type) return false;
      if (category && category !== 'ALL' && t.category !== category) return false;
      if (startDate && new Date(t.date) < new Date(String(startDate))) return false;
      if (endDate && new Date(t.date) > new Date(String(endDate))) return false;
      if (search) {
        const s = String(search).toLowerCase();
        const descMatch = t.description?.toLowerCase().includes(s);
        const catMatch = t.category?.toLowerCase().includes(s);
        if (!descMatch && !catMatch) return false;
      }
      return true;
    });

    // Sort by date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pageNum = Math.max(1, parseInt(String(page) || '1', 10));
    const pageLimit = Math.max(1, Math.min(100, parseInt(String(limit) || '50', 10)));
    const total = list.length;
    const startIndex = (pageNum - 1) * pageLimit;
    const paginated = list.slice(startIndex, startIndex + pageLimit);

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      limit: pageLimit,
    });
  } catch (err: any) {
    console.error('Get transactions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transactions' });
  }
};

export const getTransactionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const item = await db.transactions.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Ownership Verification
    if (item.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Record access denied' });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
  }
};

export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { amount, type, category, description, date, paymentMode } = req.body;

    const existing = await db.transactions.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Strict Ownership check
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this record' });
    }

    const updates: any = {};
    if (amount !== undefined) {
      const pAmt = Number(amount);
      if (isNaN(pAmt) || pAmt <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
      }
      updates.amount = pAmt;
    }
    if (type) updates.type = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    if (category) updates.category = category.trim();
    if (description !== undefined) updates.description = description.trim();
    if (date) updates.date = new Date(date).toISOString();
    if (paymentMode) updates.paymentMode = paymentMode;

    const updated = await db.transactions.updateById(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: updated,
    });
  } catch (err: any) {
    console.error('Update transaction error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const existing = await db.transactions.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Ownership Verification
    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this record' });
    }

    await db.transactions.deleteById(id);

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (err: any) {
    console.error('Delete transaction error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
};
