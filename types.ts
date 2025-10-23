
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export const CATEGORIES = {
  INCOME: [
    { id: 'salary', name: 'راتب', color: '#10B981' },
    { id: 'freelance', name: 'عمل حر', color: '#34D399' },
    { id: 'investment', name: 'استثمار', color: '#6EE7B7' },
    { id: 'other_income', name: 'دخل آخر', color: '#A7F3D0' },
  ],
  EXPENSE: [
    { id: 'food', name: 'طعام', color: '#EF4444' },
    { id: 'housing', name: 'سكن', color: '#F87171' },
    { id: 'transport', name: 'مواصلات', color: '#F97316' },
    { id: 'entertainment', name: 'ترفيه', color: '#FBBF24' },
    { id: 'health', name: 'صحة', color: '#3B82F6' },
    { id: 'shopping', name: 'تسوق', color: '#A855F7' },
    { id: 'education', name: 'تعليم', color: '#8B5CF6' },
    { id: 'bills', name: 'فواتير', color: '#6366F1' },
    { id: 'debts', name: 'ديون', color: '#EC4899' },
    { id: 'investment_expense', name: 'استثمارات', color: '#14B8A6' },
    { id: 'leisure', name: 'مصاريف ترفيهية', color: '#D97706' },
    { id: 'other_expense', name: 'مصاريف أخرى', color: '#6B7280' },
  ],
};

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  date: string; // ISO string format
  description: string;
  tags?: string[];
}

export interface DeveloperInfo {
    name: string;
    email: string;
}