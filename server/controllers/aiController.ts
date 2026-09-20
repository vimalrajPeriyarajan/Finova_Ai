import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';
import { generateFinancialAdvice, parseVoiceTransaction, UserFinancialContext } from '../services/geminiService';

export const chatWithAi = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { prompt, language } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // Build real financial context for the user
    const transactions = await db.transactions.find((t) => t.userId === userId);
    const budgets = await db.budgets.find((b) => b.userId === userId);
    const goals = await db.savingsGoals.find((g) => g.userId === userId);

    let totalIncome = 0;
    let totalExpense = 0;
    const catTotals: Record<string, number> = {};

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = transactions.filter(
      (t) => t.type === 'EXPENSE' && t.date.startsWith(currentMonth)
    );

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') totalIncome += amt;
      else if (t.type === 'EXPENSE') {
        totalExpense += amt;
        catTotals[t.category] = (catTotals[t.category] || 0) + amt;
      }
    }

    const topCategories = Object.entries(catTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const activeBudgets = budgets.map((b) => {
      const spent = monthlyExpenses
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { category: b.category, limit: b.monthlyLimit, spent };
    });

    const savingsGoalsList = goals.map((g) => ({
      title: g.title,
      target: g.targetAmount,
      current: g.currentAmount,
    }));

    const userContext: UserFinancialContext = {
      availableBalance: totalIncome - totalExpense,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      topCategories,
      activeBudgets,
      savingsGoals: savingsGoalsList,
      recentTransactions: transactions.slice(0, 8).map((t) => ({
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
      })),
    };

    const reply = await generateFinancialAdvice(prompt.trim(), userContext, language || 'en');

    return res.status(200).json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to communicate with AI Assistant at this time',
    });
  }
};

export const parseVoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ success: false, message: 'Voice transcript required' });
    }

    const draft = await parseVoiceTransaction(transcript.trim());

    return res.status(200).json({
      success: true,
      message: 'Parsed voice transaction draft (not saved yet)',
      data: draft,
    });
  } catch (err: any) {
    console.error('Parse voice error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process voice expense',
    });
  }
};
