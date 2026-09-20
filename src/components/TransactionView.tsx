import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  CreditCard,
  Tag,
  Download,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { Transaction } from '../types/finance';
import { useLanguage } from '../context/LanguageContext';

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

const PAYMENT_MODES = ['UPI', 'CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'];

export const TransactionView: React.FC = () => {
  const { t } = useLanguage();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Voice Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isParsingVoice, setIsParsingVoice] = useState<boolean>(false);
  const [parsedDraft, setParsedDraft] = useState<any | null>(null);
  const recognitionRef = useRef<any>(null);

  // Manual Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    category: 'Food & Dining',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI' as 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.transactions.getAll({
        type: typeFilter,
        category: categoryFilter,
        search: searchQuery,
      });
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, searchQuery]);

  // Setup Web Speech API for Voice Expense Logging
  const startVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type manually.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English / accent support

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceTranscript('');
        setParsedDraft(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleParseVoice = async () => {
    if (!voiceTranscript.trim()) return;
    setIsParsingVoice(true);
    try {
      const res = await api.ai.parseVoice(voiceTranscript);
      if (res.success && res.data) {
        setParsedDraft(res.data);
      }
    } catch (err) {
      console.error('Error parsing voice expense', err);
    } finally {
      setIsParsingVoice(false);
    }
  };

  const handleConfirmVoiceDraft = async () => {
    if (!parsedDraft) return;
    setIsSubmitting(true);
    try {
      const res = await api.transactions.create(parsedDraft);
      if (res.success) {
        setParsedDraft(null);
        setVoiceTranscript('');
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to save parsed transaction', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingTransaction) {
        const res = await api.transactions.update(editingTransaction.id, {
          ...formData,
          amount: amt,
        });
        if (res.success) {
          setShowAddModal(false);
          setEditingTransaction(null);
          fetchTransactions();
        } else {
          setFormError(res.message || 'Failed to update transaction');
        }
      } else {
        const res = await api.transactions.create({
          ...formData,
          amount: amt,
        });
        if (res.success) {
          setShowAddModal(false);
          fetchTransactions();
        } else {
          setFormError(res.message || 'Failed to record transaction');
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await api.transactions.delete(id);
      if (res.success) {
        fetchTransactions();
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      amount: String(t.amount),
      type: t.type,
      category: t.category,
      description: t.description || '',
      date: t.date.split('T')[0],
      paymentMode: t.paymentMode || 'UPI',
    });
    setShowAddModal(true);
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Mode', 'Description'];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.amount,
      t.paymentMode,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finova_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Ledger & Voice Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log expenses with voice recognition, parse with AI, or enter manually.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Download CSV Ledger"
            id="export-csv-btn"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setFormData({
                amount: '',
                type: 'EXPENSE',
                category: 'Food & Dining',
                description: '',
                date: new Date().toISOString().split('T')[0],
                paymentMode: 'UPI',
              });
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-colors"
            id="add-transaction-manual-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Voice Expense Tracking Module */}
      <div className="p-5 bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                AI Voice Logger
              </span>
              <span className="text-xs text-slate-300">Speak naturally in Indian English or Hindi</span>
            </div>
            <h3 className="text-base font-bold text-white">
              "Paid 250 rupees for lunch with UPI"
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Tap the microphone to speak your expense. FINOVA's server-side AI extracts the amount, category, and payment mode into a verified draft.
            </p>
          </div>

          {/* Voice Mic Button */}
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button
                onClick={startVoiceRecording}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                id="start-voice-mic-btn"
              >
                <Mic className="w-4 h-4" />
                <span>Tap to Speak</span>
              </button>
            ) : (
              <button
                onClick={stopVoiceRecording}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-transform active:scale-95 animate-pulse shadow-md shadow-rose-500/30"
                id="stop-voice-mic-btn"
              >
                <MicOff className="w-4 h-4" />
                <span>Listening... Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Transcript / Parse Action */}
        {voiceTranscript && (
          <div className="mt-4 pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-emerald-200">
              <span className="font-semibold text-white">Heard: </span>
              "{voiceTranscript}"
            </div>

            {!parsedDraft && (
              <button
                onClick={handleParseVoice}
                disabled={isParsingVoice}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-900 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors self-start sm:self-auto disabled:opacity-50"
                id="parse-voice-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isParsingVoice ? 'Parsing with AI...' : 'Parse with AI'}</span>
              </button>
            )}
          </div>
        )}

        {/* Structured Confirmation Card (Strict Verification Workflow) */}
        {parsedDraft && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-emerald-500/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extracted Transaction (Pending Confirmation)</span>
              </span>
              <button
                onClick={() => setParsedDraft(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Amount</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ₹{parsedDraft.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Category</span>
                <span className="font-semibold text-white">{parsedDraft.category}</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Payment Mode</span>
                <span className="font-semibold text-white">{parsedDraft.paymentMode}</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Type</span>
                <span
                  className={`font-semibold ${
                    parsedDraft.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {parsedDraft.type}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Description: {parsedDraft.description}
              </span>
              <button
                onClick={handleConfirmVoiceDraft}
                disabled={isSubmitting}
                className="flex items-center space-x-1 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black shadow-xs transition-colors"
                id="confirm-voice-draft-btn"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Record to Ledger</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description or category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            id="search-transactions-input"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            id="filter-type-select"
          >
            <option value="ALL">All Flows</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="INCOME">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[150px] truncate"
            id="filter-category-select"
          >
            <option value="ALL">All Categories</option>
            {(typeFilter === 'EXPENSE'
              ? EXPENSE_CATEGORIES
              : typeFilter === 'INCOME'
              ? INCOME_CATEGORIES
              : Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]))
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Recorded Transactions ({transactions.length})
          </span>
          <span className="text-[11px] text-slate-400">Owner-verified cryptographic IDs</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                      t.type === 'INCOME'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {t.type === 'INCOME' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {t.description || t.category}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                        {t.category}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{t.paymentMode}</span>
                      <span>•</span>
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div
                    className={`text-base font-extrabold tracking-tight ${
                      t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTransaction ? 'Edit Transaction' : 'Record New Transaction'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    formData.type === 'EXPENSE'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    formData.type === 'INCOME'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 500"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  id="tx-amount-input"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="tx-category-input"
                >
                  {(formData.type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Chai, metro ticket, salary bonus"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  id="tx-description-input"
                />
              </div>

              {/* Payment Mode & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="tx-payment-mode-input"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="tx-date-input"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/20 transition-colors disabled:opacity-50"
                  id="save-tx-submit-btn"
                >
                  {isSubmitting ? 'Saving to ledger...' : editingTransaction ? 'Save Changes' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
