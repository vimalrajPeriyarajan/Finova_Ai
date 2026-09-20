export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transport & Travel'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Education'
  | 'Health & Medical'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance & Projects'
  | 'Investments'
  | 'Allowance & Pocket Money'
  | 'Other';

export type TransactionCategory = ExpenseCategory | IncomeCategory | (string & {});

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
  paymentMode: PaymentMode;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  month: string; // YYYY-MM
  alertThreshold: number; // e.g. 80
  alertSent: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  availableBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  monthlySpendTrend: {
    month: string;
    income: number;
    expense: number;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  recentTransactions: Transaction[];
  activeBudgets: Budget[];
  activeGoals: SavingsGoal[];
  spendingAlert?: string;
}

export interface VoiceParsedTransaction {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string;
  paymentMode: PaymentMode;
  confidence?: number;
}
