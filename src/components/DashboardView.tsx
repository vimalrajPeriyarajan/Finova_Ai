import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Receipt,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/apiClient';
import { DashboardSummary } from '../types/finance';

interface DashboardViewProps {
  onOpenAddTransaction: (defaultType?: 'INCOME' | 'EXPENSE') => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  setActiveTab,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.dashboard.getSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      } else {
        setError(res.message || 'Failed to load financial data');
      }
    } catch (err: any) {
      setError('Unable to connect to financial server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading your financial dashboard...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Connection Notice</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not load summary'}</p>
        <button
          onClick={fetchSummary}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    availableBalance,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    monthlySpendTrend,
    categoryBreakdown,
    recentTransactions,
    activeBudgets,
    activeGoals,
    spendingAlert,
  } = summary;

  // Max value for monthly cashflow chart scaling
  const maxTrendVal = Math.max(
    ...monthlySpendTrend.flatMap((m) => [m.income, m.expense]),
    1000
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('dashboard_greeting')}, {user?.name.split(' ')[0] || 'Friend'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ledger overview, automated budgeting & spending intelligence.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenAddTransaction('EXPENSE')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
            id="dash-add-expense-btn"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => onOpenAddTransaction('INCOME')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-colors"
            id="dash-add-income-btn"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* AI Spending Insight Alert Banner */}
      {spendingAlert && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/40 rounded-2xl border border-emerald-200/80 flex items-start space-x-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Finova AI Money Coach
              </span>
              <button
                onClick={() => setActiveTab('education')}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-0.5"
              >
                <span>Ask Advice</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{spendingAlert}</p>
          </div>
        </div>
      )}

      {/* Balance & Cashflow Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-3 -mr-3 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('dashboard_available_balance')}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight mt-2 text-white">
            ₹{availableBalance.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/60 pt-2.5">
            <span>Savings Rate</span>
            <span className="text-emerald-400 font-bold">{savingsRate}%</span>
          </div>
        </div>

        {/* Total Monthly Income */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{t('dashboard_total_income')}</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            ₹{totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 text-[11px] text-emerald-600 font-medium flex items-center space-x-1 border-t border-slate-100 pt-2.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Earnings verified</span>
          </div>
        </div>

        {/* Total Monthly Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{t('dashboard_total_expense')}</span>
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Categories</span>
            <span className="font-semibold text-slate-700">{categoryBreakdown.length} active</span>
          </div>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{t('dashboard_net_savings')}</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            ₹{netSavings.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Buffer Cushion</span>
            <span className="font-semibold text-indigo-600">
              {totalExpense > 0 ? (availableBalance / (totalExpense / 30)).toFixed(0) : '30+'} days
            </span>
          </div>
        </div>
      </div>

      {/* Cashflow Trend & Spending Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cashflow Visualizer (2 Cols) */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cashflow & Savings Trend</h3>
              <p className="text-[11px] text-slate-500">Comparing monthly inflows vs outflows</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                <span className="text-slate-600">Income</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-400"></span>
                <span className="text-slate-600">Expense</span>
              </div>
            </div>
          </div>

          {/* Responsive SVG / CSS Bar Visualization */}
          <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-slate-100">
            {monthlySpendTrend.map((m, idx) => {
              const incHeight = Math.max(8, (m.income / maxTrendVal) * 150);
              const expHeight = Math.max(8, (m.expense / maxTrendVal) * 150);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex items-end justify-center space-x-1.5 h-40">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incHeight}px` }}
                      className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group/bar"
                    >
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                        ₹{m.income.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-1/2 max-w-[28px] bg-rose-400 hover:bg-rose-500 rounded-t-md transition-all relative group/bar"
                    >
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                        ₹{m.expense.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Current Net Flow: ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}</span>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <span>View full ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Breakdown (1 Col) */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Spending by Category</h3>
              <span className="text-[11px] font-semibold text-slate-400">This Month</span>
            </div>

            <div className="space-y-3 mt-4">
              {categoryBreakdown.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No expense records found.
                </div>
              ) : (
                categoryBreakdown.slice(0, 5).map((cat, idx) => (
                  <div key={`${cat.category}-${idx}`} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className="truncate pr-2">{cat.category}</span>
                      <span className="font-bold text-slate-900">
                        ₹{cat.amount.toLocaleString('en-IN')}{' '}
                        <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Total Spent: ₹{totalExpense.toLocaleString('en-IN')}</span>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage Budgets
            </button>
          </div>
        </div>
      </div>

      {/* Active Budgets & Savings Goals Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Budgets Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Category Budgets</h3>
              <p className="text-[11px] text-slate-500">Monthly limits with 80% proactive threshold alerts</p>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {activeBudgets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active budgets configured for this month.
              </div>
            ) : (
              activeBudgets.slice(0, 3).map((b) => {
                const percent = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
                const isNearLimit = percent >= 80;
                const isOver = b.spent > b.monthlyLimit;

                return (
                  <div key={b.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{b.category}</span>
                        {isOver ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            Exceeded
                          </span>
                        ) : isNearLimit ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            Alert {percent}%
                          </span>
                        ) : null}
                      </div>
                      <span className="text-slate-600">
                        ₹{b.spent.toLocaleString('en-IN')} / ₹{b.monthlyLimit.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Savings Goals Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Savings Milestones</h3>
              <p className="text-[11px] text-slate-500">Dedicated targets for gadgets, emergency funds & assets</p>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>Manage Goals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {activeGoals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active savings goals. Create one to kickstart compounding!
              </div>
            ) : (
              activeGoals.slice(0, 2).map((g) => {
                const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return (
                  <div key={g.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{g.title}</span>
                      <span className="font-semibold text-emerald-700">
                        ₹{g.currentAmount.toLocaleString('en-IN')} of ₹{g.targetAmount.toLocaleString('en-IN')} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Target: {new Date(g.targetDate).toLocaleDateString()}</span>
                      <span className="text-slate-600 font-medium">
                        Remaining: ₹{Math.max(0, g.targetAmount - g.currentAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Ledger Transactions Table */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-[11px] text-slate-500">Live verified transactions from your ledger</p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>Full History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions recorded yet. Tap "Add Expense" or "Add Income" above.
            </div>
          ) : (
            recentTransactions.map((t) => (
              <div
                key={t.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors rounded-lg px-2"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      t.type === 'INCOME'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {t.type === 'INCOME' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{t.description || t.category}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{t.category}</span>
                      <span>•</span>
                      <span>{t.paymentMode}</span>
                      <span>•</span>
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`text-sm font-extrabold tracking-tight ${
                    t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
