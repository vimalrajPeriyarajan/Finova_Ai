import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/database';

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const transactions = await db.transactions.find((t) => t.userId === userId);
    const budgets = await db.budgets.find((b) => b.userId === userId);
    const goals = await db.savingsGoals.find((g) => g.userId === userId);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') {
        totalIncome += amt;
      } else if (t.type === 'EXPENSE') {
        totalExpense += amt;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      }
    }

    const availableBalance = totalIncome - totalExpense;
    const netSavings = Math.max(0, availableBalance);
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Build category breakdown
    const categoryColors: Record<string, string> = {
      'Food & Dining': '#10B981', // Emerald
      'Groceries': '#059669',
      'Transport & Travel': '#3B82F6', // Blue
      'Shopping': '#8B5CF6', // Purple
      'Bills & Utilities': '#F59E0B', // Amber
      'Entertainment': '#EC4899', // Pink
      'Education': '#06B6D4', // Cyan
      'Health & Medical': '#EF4444', // Red
      'Other': '#6B7280',
    };

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        color: categoryColors[category] || '#6366F1',
      }))
      .sort((a, b) => b.amount - a.amount);

    // Compute active budgets with current monthly spend
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = transactions.filter(
      (t) => t.type === 'EXPENSE' && t.date.startsWith(currentMonth)
    );

    const activeBudgets = budgets.map((b) => {
      const spent = monthlyExpenses
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...b,
        spent,
      };
    });

    // Monthly Spend Trend (last 4 months)
    const monthlySpendTrend: { month: string; income: number; expense: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().slice(0, 7);
      const monthName = d.toLocaleString('en-US', { month: 'short' });

      const mIncome = transactions
        .filter((t) => t.type === 'INCOME' && t.date.startsWith(mStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const mExpense = transactions
        .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(mStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlySpendTrend.push({
        month: monthName,
        income: mIncome,
        expense: mExpense,
      });
    }

    // AI Insight summary
    let spendingAlert = '';
    if (categoryBreakdown.length > 0) {
      const topCat = categoryBreakdown[0];
      if (topCat.percentage >= 35) {
        spendingAlert = `${topCat.category} represents ${topCat.percentage}% of your total spending. Consider setting a category budget limit.`;
      } else {
        spendingAlert = `Your top expenditure is ${topCat.category} (₹${topCat.amount.toLocaleString('en-IN')}). Healthy balance across remaining categories.`;
      }
    } else {
      spendingAlert = 'Log your daily expenses to unlock automated spending insights and budget alerts.';
    }

    return res.status(200).json({
      success: true,
      data: {
        availableBalance,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        monthlySpendTrend,
        categoryBreakdown,
        recentTransactions: transactions.slice(0, 5),
        activeBudgets,
        activeGoals: goals,
        spendingAlert,
      },
    });
  } catch (err: any) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate financial dashboard summary',
    });
  }
};
