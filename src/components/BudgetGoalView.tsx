import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  PieChart,
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  X,
  AlertCircle,
  PiggyBank,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { Budget, SavingsGoal } from '../types/finance';
import { useLanguage } from '../context/LanguageContext';

const BUDGET_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport & Travel',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Education',
  'Health & Medical',
  'Other',
];

export const BudgetGoalView: React.FC = () => {
  const { t } = useLanguage();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Budget Modal
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [budgetForm, setBudgetForm] = useState({
    category: 'Food & Dining',
    monthlyLimit: '',
    alertThreshold: 80,
  });

  // Goal Modal
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: 'Technology',
  });

  // Deposit Modal
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, gRes] = await Promise.all([
        api.budgets.getAll(),
        api.savings.getAll(),
      ]);
      if (bRes.success && bRes.data) setBudgets(bRes.data);
      if (gRes.success && gRes.data) setGoals(gRes.data);
    } catch (err) {
      console.error('Failed to load budgets & goals', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetForm.monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      setFormError('Please enter a valid monthly limit');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.budgets.create({
        category: budgetForm.category,
        monthlyLimit: limit,
        alertThreshold: budgetForm.alertThreshold,
      });
      if (res.success) {
        setShowBudgetModal(false);
        fetchData();
      } else {
        setFormError(res.message || 'Failed to set budget');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category budget?')) return;
    try {
      await api.budgets.delete(id);
      fetchData();
    } catch (err) {
      console.error('Delete budget error', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalForm.targetAmount);
    const initial = parseFloat(goalForm.currentAmount) || 0;
    if (isNaN(target) || target <= 0) {
      setFormError('Target amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.savings.create({
        title: goalForm.title.trim(),
        targetAmount: target,
        currentAmount: initial,
        targetDate: goalForm.targetDate,
        category: goalForm.category,
      });
      if (res.success) {
        setShowGoalModal(false);
        fetchData();
      } else {
        setFormError(res.message || 'Failed to create goal');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const dep = parseFloat(depositAmount);
    if (isNaN(dep) || dep <= 0) {
      setFormError('Enter a valid deposit amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.savings.addProgress(depositGoal.id, dep);
      if (res.success) {
        const newTotal = depositGoal.currentAmount + dep;
        if (newTotal >= depositGoal.targetAmount) {
          // Trigger celebration confetti
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
        }
        setDepositGoal(null);
        setDepositAmount('');
        fetchData();
      }
    } catch (err) {
      console.error('Deposit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.savings.delete(id);
      fetchData();
    } catch (err) {
      console.error('Delete goal error', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Budgets & Financial Targets
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enforce discipline with spending guardrails & track dedicated savings milestones.
        </p>
      </div>

      {/* SECTION 1: Category Budgets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Monthly Spending Limits</h2>
          </div>
          <button
            onClick={() => {
              setBudgetForm({
                category: 'Food & Dining',
                monthlyLimit: '',
                alertThreshold: 80,
              });
              setShowBudgetModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            id="new-budget-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Category Limit</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No category limits set yet.</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Setting limits on Food, Shopping, or Travel helps automatically detect overspending before month-end.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const percent = Math.min(100, Math.round(((b.spent || 0) / b.monthlyLimit) * 100));
              const isOver = (b.spent || 0) > b.monthlyLimit;
              const isNear = percent >= (b.alertThreshold || 80);

              return (
                <div
                  key={b.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{b.category}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Limit: ₹{b.monthlyLimit.toLocaleString('en-IN')}/mo
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {isOver ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Over Limit</span>
                          </span>
                        ) : isNear ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{percent}% Used</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {percent}%
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded"
                          title="Delete budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Spent: ₹{(b.spent || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 font-medium">
                          Remaining: ₹{Math.max(0, b.monthlyLimit - (b.spent || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Alert threshold: {b.alertThreshold || 80}%</span>
                    <span>Month: {b.month}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Savings Goals Tracker */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Savings Milestones & Aspirations</h2>
          </div>
          <button
            onClick={() => {
              setGoalForm({
                title: '',
                targetAmount: '',
                currentAmount: '0',
                targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: 'Technology',
              });
              setShowGoalModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            id="new-goal-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Milestone</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <PiggyBank className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No savings targets created yet.</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Track targets for an emergency fund, new laptop, professional exam, or family trip.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              const isDone = g.currentAmount >= g.targetAmount;

              return (
                <div
                  key={g.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-900">{g.title}</span>
                          {isDone && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Achieved!</span>
                            </span>
                          )}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {g.category}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{g.currentAmount.toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-normal text-slate-400">
                            / ₹{g.targetAmount.toLocaleString('en-IN')}
                          </span>
                        </span>
                        <span className="font-extrabold text-indigo-600 text-sm">{percent}%</span>
                      </div>

                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Target: {new Date(g.targetDate).toLocaleDateString()}</span>
                        <span className="font-medium text-slate-700">
                          Remaining: ₹{Math.max(0, g.targetAmount - g.currentAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {isDone ? 'Target reached! Funds unlocked.' : 'Keep funding your target!'}
                    </span>
                    <button
                      onClick={() => {
                        setDepositGoal(g);
                        setDepositAmount('');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                      id={`deposit-goal-${g.id}-btn`}
                    >
                      + Deposit Funds
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Set Monthly Budget</h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs">{formError}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  id="budget-category-input"
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Limit (₹) *
                </label>
                <input
                  type="number"
                  value={budgetForm.monthlyLimit}
                  onChange={(e) => setBudgetForm({ ...budgetForm, monthlyLimit: e.target.value })}
                  placeholder="e.g. 5000"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  id="budget-limit-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alert Trigger Threshold: {budgetForm.alertThreshold}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={budgetForm.alertThreshold}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, alertThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-600"
                />
                <span className="text-[10px] text-slate-400">
                  Sends an instant notification when spending exceeds this % of limit.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  id="save-budget-btn"
                >
                  {isSubmitting ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Savings Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">New Savings Target</h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs">{formError}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Goal Title *</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g. Emergency Fund, Laptop"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  id="goal-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  placeholder="e.g. 50000"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  id="goal-target-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Deposit (₹)</label>
                <input
                  type="number"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  id="save-goal-btn"
                >
                  {isSubmitting ? 'Creating Goal...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Savings Progress</h3>
                <p className="text-[11px] text-slate-500">{depositGoal.title}</p>
              </div>
              <button onClick={() => setDepositGoal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Amount (₹) *</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  id="deposit-amount-input"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                Current: ₹{depositGoal.currentAmount.toLocaleString('en-IN')} / Target: ₹
                {depositGoal.targetAmount.toLocaleString('en-IN')}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  id="confirm-deposit-btn"
                >
                  {isSubmitting ? 'Recording Deposit...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
