export type EducationCategory =
  | 'Budgeting'
  | 'Saving'
  | 'Emergency Fund'
  | 'Banking'
  | 'Loans'
  | 'Interest'
  | 'Inflation'
  | 'Mutual Funds'
  | 'SIP'
  | 'FD'
  | 'Gold'
  | 'Government Bonds'
  | 'Insurance'
  | 'Financial Safety';

export interface FinancialArticle {
  id: string;
  category: EducationCategory;
  title: string;
  shortExplanation: string;
  example: string;
  keyPoints: string[];
  source: string;
  language: string;
  isPublished: boolean;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  name: string;
  category: 'Identity' | 'Banking' | 'Insurance' | 'Education' | 'Property' | 'Other';
  fileSize: number;
  mimeType: string;
  dataBase64?: string;
  notes?: string;
  createdAt: string;
}

export type FinancialDocument = DocumentItem;

export type EducationArticle = FinancialArticle & {
  summary?: string;
  readTimeMinutes?: number;
};

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'BUDGET_ALERT' | 'SAVINGS_REMINDER' | 'SYSTEM' | 'REPORT_UPDATE';
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: string;
}
