import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionView } from './components/TransactionView';
import { BudgetGoalView } from './components/BudgetGoalView';
import { ResourceMapView } from './components/ResourceMapView';
import { DocumentVaultView } from './components/DocumentVaultView';
import { EducationAiView } from './components/EducationAiView';
import { AdminPortalView } from './components/AdminPortalView';
import { AuthModal } from './components/AuthModal';
import {
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
} from 'lucide-react';
import { api } from './services/apiClient';

const EXPENSE_CATEGORIES = [
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

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance & Projects',
  'Allowance & Pocket Money',
  'Scholarship / Grant',
  'Investment Return',
  'Other',
];

const MainAppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Quick transaction modal invoked from Dashboard
  const [quickTxModal, setQuickTxModal] = useState<{
    isOpen: boolean;
    type: 'INCOME' | 'EXPENSE';
  }>({
    isOpen: false,
    type: 'EXPENSE',
  });
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('Food & Dining');
  const [quickDesc, setQuickDesc] = useState<string>('');
  const [quickMode, setQuickMode] = useState<string>('UPI');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const handleOpenQuickTx = (defaultType?: 'INCOME' | 'EXPENSE') => {
    const type = defaultType || 'EXPENSE';
    setQuickTxModal({ isOpen: true, type });
    setQuickCategory(type === 'INCOME' ? 'Salary' : 'Food & Dining');
    setQuickAmount('');
    setQuickDesc('');
    setQuickError(null);
  };

  const handleSaveQuickTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0) {
      setQuickError('Please enter an amount greater than 0');
      return;
    }

    setIsSubmittingQuick(true);
    setQuickError(null);
    try {
      const res = await api.transactions.create({
        amount: amt,
        type: quickTxModal.type,
        category: quickCategory,
        description: quickDesc.trim() || undefined,
        paymentMode: quickMode as any,
        date: new Date().toISOString(),
      });

      if (res.success) {
        setQuickTxModal({ isOpen: false, type: 'EXPENSE' });
        // Force refresh by switching briefly or triggering active tab
        setActiveTab((prev) => prev);
      } else {
        setQuickError(res.message || 'Failed to save transaction');
      }
    } catch (err: any) {
      setQuickError(err?.message || 'Server error');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white antialiased">
      {/* Top Header */}
      <Header
        onOpenAuth={() => setShowAuthModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Navigation Bars (Sub-header on desktop / bottom bar on mobile) */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenAddTransaction={handleOpenQuickTx}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'transactions' && <TransactionView />}
        {activeTab === 'budgets' && <BudgetGoalView />}
        {activeTab === 'resources' && <ResourceMapView />}
        {activeTab === 'vault' && <DocumentVaultView />}
        {activeTab === 'education' && <EducationAiView />}
        {activeTab === 'admin' && <AdminPortalView />}
      </main>

      {/* Footer & Compliance Disclaimer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 tracking-tight">FINOVA</span>
              <span>— {t('app_tagline')}</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <span>RBI Bank Directory</span>
              <span>•</span>
              <span>SEBI Advisory Registers</span>
              <span>•</span>
              <span>BIS Jeweller Records</span>
              <span>•</span>
              <span>IBBI Valuers</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed space-y-1">
            <div className="font-semibold text-slate-700 flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Regulatory & Educational Disclaimer</span>
            </div>
            <p>
              FINOVA is an educational technology and personal financial record-keeping platform.
              Information provided through AI mentors and educational modules is for financial
              literacy purposes only and does not constitute personalized investment advice or
              solicitation. Always consult a SEBI-registered Investment Adviser before making market
              investments.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Quick Add Transaction Modal */}
      {quickTxModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Record {quickTxModal.type === 'INCOME' ? 'Income' : 'Expense'}
              </h3>
              <button
                onClick={() => setQuickTxModal({ ...quickTxModal, isOpen: false })}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickTx} className="p-5 space-y-3.5">
              {quickError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{quickError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder="e.g. 350"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  id="quick-amount-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  id="quick-category-input"
                >
                  {(quickTxModal.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="e.g. Metro card recharge, coffee"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  id="quick-desc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={quickMode}
                  onChange={(e) => setQuickMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  id="quick-mode-input"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank NetBanking</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingQuick}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                    quickTxModal.type === 'INCOME'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                  id="quick-save-btn"
                >
                  {isSubmittingQuick ? 'Recording...' : 'Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
