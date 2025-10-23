import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// =================================================================================
// TYPES
// =================================================================================

enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

const CATEGORIES = {
  INCOME: [
    { id: 'salary', name: 'راتب', color: '#22c55e' },
    { id: 'freelance', name: 'عمل حر', color: '#4ade80' },
    { id: 'investment', name: 'استثمار', color: '#86efac' },
    { id: 'other_income', name: 'دخل آخر', color: '#bbf7d0' },
  ],
  EXPENSE: [
    { id: 'food', name: 'طعام', color: '#ef4444' },
    { id: 'housing', name: 'سكن', color: '#f87171' },
    { id: 'transport', name: 'مواصلات', color: '#f97316' },
    { id: 'entertainment', name: 'ترفيه', color: '#facc15' },
    { id: 'health', name: 'صحة', color: '#3b82f6' },
    { id: 'shopping', name: 'تسوق', color: '#a855f7' },
    { id: 'education', name: 'تعليم', color: '#8b5cf6' },
    { id: 'bills', name: 'فواتير', color: '#6366f1' },
    { id: 'debts', name: 'ديون', color: '#ec4899' },
    { id: 'investment_expense', name: 'استثمارات', color: '#14b8a6' },
    { id: 'leisure', name: 'مصاريف ترفيهية', color: '#d97706' },
    { id: 'other_expense', name: 'مصاريف أخرى', color: '#6b7280' },
  ],
};

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  date: string; // ISO string format
  description: string;
  tags?: string[];
}

interface DeveloperInfo {
    name: string;
    email: string;
}

// =================================================================================
// CONSTANTS
// =================================================================================

const LOCAL_STORAGE_TRANSACTIONS_KEY = 'personal-expense-manager-transactions';
const LOCAL_STORAGE_DEVELOPER_KEY = 'personal-expense-manager-developer-info';
const LOCAL_STORAGE_THEME_KEY = 'personal-expense-manager-theme';
const LOCAL_STORAGE_BUDGETS_KEY = 'personal-expense-manager-budgets';

const DEVELOPER_INFO: DeveloperInfo = {
    name: "Oday Qutqut",
    email: "oday5qutqut@gmail.com",
};

// =================================================================================
// SEED DATA
// =================================================================================

const getSeedData = (): Transaction[] => {
  return [];
};

// =================================================================================
// LOCAL STORAGE HOOK
// =================================================================================

function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : (typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
    } catch (error) {
      console.error(error);
      return (typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
    }
  });

  useEffect(() => {
    try {
      const valueToStore = typeof storedValue === 'function' ? storedValue(storedValue) : storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// =================================================================================
// SERVICES
// =================================================================================

const calculateTotals = (transactions: Transaction[]) => {
  return transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === TransactionType.INCOME) {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      acc.balance = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
};

const getCategoryById = (id: string) => {
    const allCategories = [...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE];
    return allCategories.find(cat => cat.id === id);
};

const groupExpensesByCategory = (transactions: Transaction[]) => {
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
  const grouped = expenses.reduce((acc, expense) => {
    const category = getCategoryById(expense.categoryId);
    if (category) {
      if (!acc[category.name]) {
        acc[category.name] = { total: 0, color: category.color, count: 0 };
      }
      acc[category.name].total += expense.amount;
      acc[category.name].count += 1;
    }
    return acc;
  }, {} as { [key: string]: { total: number; color: string; count: number } });

  return Object.entries(grouped).map(([name, data]) => ({
    name,
    value: data.total,
    color: data.color,
  }));
};

const groupTransactionsByMonth = (transactions: Transaction[]) => {
    const data = transactions.reduce((acc, { date, amount, type }) => {
        const month = new Date(date).toLocaleString('ar-EG', { month: 'short', year: 'numeric', numberingSystem: 'latn' });
        if (!acc[month]) {
            acc[month] = { name: month, دخل: 0, مصروف: 0 };
        }
        if (type === TransactionType.INCOME) {
            acc[month]['دخل'] += amount;
        } else {
            acc[month]['مصروف'] += amount;
        }
        return acc;
    }, {} as { [key: string]: { name: string; دخل: number; مصروف: number } });

    return Object.values(data).sort((a,b) => new Date(b.name).getTime() - new Date(a.name).getTime());
};

const getDashboardStats = (transactions: Transaction[]) => {
    const totalTransactions = transactions.length;

    const expenseTransactions = transactions.filter(tx => tx.type === TransactionType.EXPENSE);
    let largestSpendingCategory = 'لا يوجد';
    if (expenseTransactions.length > 0) {
        const spendingByCategory = expenseTransactions.reduce((acc, tx) => {
            acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
            return acc;
        }, {} as { [key: string]: number });

        const largestCategoryEntry = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a)[0];
        if (largestCategoryEntry) {
            const category = getCategoryById(largestCategoryEntry[0]);
            largestSpendingCategory = category ? category.name : 'غير معروف';
        }
    }

    const incomeTransactions = transactions.filter(tx => tx.type === TransactionType.INCOME);
    const highestIncome = incomeTransactions.length > 0
        ? Math.max(...incomeTransactions.map(tx => tx.amount))
        : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const monthlyTotals = calculateTotals(currentMonthTransactions);
    const monthlySavings = monthlyTotals.income - monthlyTotals.expense;
    const monthlySavingsPercentage = monthlyTotals.income > 0
        ? ((monthlySavings / monthlyTotals.income) * 100)
        : 0;

    return {
        totalTransactions,
        largestSpendingCategory,
        highestIncome,
        monthlySavingsPercentage,
    };
};

// =================================================================================
// ICONS
// =================================================================================

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
);
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
);
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);
const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/></svg>
);
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const WarningIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const AnimatedWalletIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path className="wallet-body" d="M20 12V7.4C20 6.07452 18.9255 5 17.6 5H4.4C3.07452 5 2 6.07452 2 7.4V16.6C2 17.9255 3.07452 19 4.4 19H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="wallet-flap" d="M20 12L15.3333 15V9L20 12Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="wallet-card" d="M16 19H22V17C22 15.8954 21.1046 15 20 15H18C16.8954 15 16 15.8954 16 17V19Z" fill="#a0aec0"/>
    </svg>
);
const ListBulletIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
);
const ArrowUpCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
);
const BanknotesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><line x1="6" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line></svg>
);
const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21.5 2v6h-6"/><path d="M21.34 15.34a10 10 0 1 1-1.22-6.34L21.5 9"/></svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73z"/><path d="M5 3v4"/><path d="M19 3v4"/><path d="M3 19h4"/><path d="M17 19h4"/></svg>
);
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

// =================================================================================
// UI COMPONENTS
// =================================================================================

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  style?: React.CSSProperties;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, colorClass, style }) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <div className="bg-surface p-5 rounded-2xl shadow-lg flex items-center space-x-4 space-x-reverse animate-swoopIn" style={style}>
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
            {icon}
        </div>
        <div>
            <h3 className="text-text-secondary text-sm font-medium">{title}</h3>
            <p className="text-text-primary text-2xl font-bold">{formattedAmount}</p>
        </div>
    </div>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
  style?: React.CSSProperties;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, style }) => {
  const { deleteTransaction } = useAppContext();
  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === TransactionType.INCOME;

  const formattedAmount = new Intl.NumberFormat('en-US').format(transaction.amount);

  const formattedDate = new Date(transaction.date).toLocaleDateString('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn'
  });

  return (
    <div className="flex items-center justify-between bg-surface p-4 rounded-2xl mb-3 shadow-md hover:shadow-lg transition-shadow duration-300 animate-fadeInUp" style={style}>
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center me-4" style={{ backgroundColor: category?.color || '#ccc' }}>
            <span className="text-white font-bold text-xl">{category?.name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-bold text-text-primary text-md">{category?.name}</p>
          <p className="text-sm text-text-secondary">{transaction.description || formattedDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className={`font-bold text-lg ${isIncome ? 'text-success' : 'text-error'}`}>
          {isIncome ? `+${formattedAmount}` : `-${formattedAmount}`}
        </p>
        <button
            onClick={() => deleteTransaction(transaction.id)}
            className="p-2 text-text-secondary rounded-full hover:bg-error hover:bg-opacity-10 hover:text-error transition-colors"
            aria-label="حذف العملية"
        >
            <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// =================================================================================
// LAYOUT COMPONENT
// =================================================================================

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    
    const navItems = [
        { path: '/', label: 'الرئيسية', icon: HomeIcon },
        { path: '/reports', label: 'تقارير', icon: ChartBarIcon },
        { path: '/about', label: 'عن التطبيق', icon: DocumentTextIcon },
        { path: '/developer', label: 'المطور', icon: UserIcon },
        { path: '/settings', label: 'الإعدادات', icon: CogIcon }
    ];

    const pageTitles: { [key: string]: string } = {
        '/': 'لوحة التحكم',
        '/add': 'إضافة عملية جديدة',
        '/reports': 'التقارير والتحليلات',
        '/about': 'عن التطبيق',
        '/developer': 'معلومات المطور',
        '/settings': 'الإعدادات',
        '/reset': 'إعادة ضبط البيانات'
    };
    
    const currentTitle = pageTitles[location.pathname] || 'مدير المصاريف';

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background">
      <header className="bg-transparent text-text-primary p-4 text-center sticky top-0 z-10 backdrop-blur-sm">
        <h1 className="text-xl font-bold">{currentTitle}</h1>
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto pb-28 animate-fadeIn">
        {children}
      </main>

      <nav className="fixed bottom-4 right-0 left-0 max-w-lg mx-auto w-[95%] z-20">
        <div className="flex justify-around items-center h-16 bg-surface/80 backdrop-blur-lg rounded-full shadow-2xl border border-border">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center w-full text-sm font-medium transition-all duration-300 ${isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'}`
              }
            >
              <div className="relative w-full flex flex-col items-center justify-center">
                <item.icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${useLocation().pathname === item.path ? '-translate-y-1' : ''}`} />
                <span className={`text-xs transition-opacity duration-300 ${useLocation().pathname === item.path ? 'opacity-100 font-bold' : 'opacity-100'}`}>{item.label}</span>
                {useLocation().pathname === item.path && <div className="absolute -bottom-1 w-2 h-2 bg-primary rounded-full"></div>}
              </div>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

// =================================================================================
// PAGE COMPONENTS
// =================================================================================

const DashboardPage: React.FC = () => {
  const { transactions, budgets } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const totals = calculateTotals(transactions);
  const monthlyData = groupTransactionsByMonth(transactions);
  const stats = getDashboardStats(transactions);

  const budgetStatus = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return tx.type === TransactionType.EXPENSE && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const expensesByCategory = currentMonthExpenses.reduce((acc, tx) => {
        acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(budgets)
        .map(categoryId => {
            const budgetAmount = budgets[categoryId];
            if (!budgetAmount || budgetAmount <= 0) return null;
            
            const category = getCategoryById(categoryId);
            const spentAmount = expensesByCategory[categoryId] || 0;
            const percentage = (spentAmount / budgetAmount) * 100;
            const remaining = budgetAmount - spentAmount;

            return { categoryId, categoryName: category?.name || 'غير معروف', budgetAmount, spentAmount, percentage, remaining, color: category?.color || '#ccc' };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a,b) => b.percentage - a.percentage);
  }, [transactions, budgets]);

  const budgetAlerts = useMemo(() => budgetStatus.filter(s => s.percentage >= 80).sort((a, b) => b.percentage - a.percentage), [budgetStatus]);

  const filteredTransactions = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) return transactions.slice(0, 5);
    return transactions.filter(tx => {
      const category = getCategoryById(tx.categoryId);
      return tx.description.toLowerCase().includes(lowercasedQuery) || (category ? category.name.toLowerCase().includes(lowercasedQuery) : false);
    });
  }, [transactions, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
         <SummaryCard title="إجمالي الدخل" amount={totals.income} icon={<ArrowUpCircleIcon className="w-7 h-7 text-success"/>} colorClass="bg-success" style={{ animationDelay: '100ms' }} />
         <SummaryCard title="إجمالي المصروفات" amount={totals.expense} icon={<ArrowUpCircleIcon className="w-7 h-7 text-error rotate-180"/>} colorClass="bg-error" style={{ animationDelay: '200ms' }} />
         <SummaryCard title="الرصيد الحالي" amount={totals.balance} icon={<BanknotesIcon className="w-7 h-7 text-info"/>} colorClass="bg-info" style={{ animationDelay: '300ms' }} />
      </div>

      {budgetAlerts.length > 0 && (
          <div className="bg-surface p-4 rounded-2xl shadow-lg space-y-3 animate-swoopIn" style={{ animationDelay: '350ms' }}>
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2"><WarningIcon className="w-6 h-6 text-warning" /> تنبيهات الميزانية</h3>
              {budgetAlerts.map(alert => {
                  const isExceeded = alert.percentage > 100;
                  const message = isExceeded
                      ? `لقد تجاوزت ميزانية "${alert.categoryName}" بمقدار ${new Intl.NumberFormat('en-US').format(Math.abs(alert.remaining))}!`
                      : `لقد استهلكت ${alert.percentage.toFixed(0)}% من ميزانية "${alert.categoryName}".`;
                  return <div key={alert.categoryId} className={`p-3 rounded-lg text-sm font-bold ${isExceeded ? 'bg-red-100 text-error' : 'bg-amber-100 text-amber-800'}`}>{message}</div>;
              })}
          </div>
      )}

      {Object.keys(budgets).length > 0 && budgetStatus.length > 0 && (
          <div className="bg-surface p-4 rounded-2xl shadow-lg animate-swoopIn" style={{ animationDelay: '450ms' }}>
              <h3 className="font-bold text-lg mb-4 text-text-primary">حالة الميزانية الشهرية</h3>
              <div className="space-y-4">
                  {budgetStatus.map(status => {
                      const progressPercentage = Math.min(status.percentage, 100);
                      const progressBarColor = status.percentage > 100 ? 'bg-error' : status.percentage >= 80 ? 'bg-warning' : 'bg-success';
                      return (
                          <div key={status.categoryId}>
                              <div className="flex justify-between items-center text-sm mb-1">
                                  <span className="font-bold text-text-primary">{status.categoryName}</span>
                                  <span className="text-text-secondary font-mono">{new Intl.NumberFormat('en-US').format(status.spentAmount)} / {new Intl.NumberFormat('en-US').format(status.budgetAmount)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progressPercentage}%` }}></div></div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      <div className="bg-surface p-4 rounded-2xl shadow-lg animate-swoopIn" style={{ animationDelay: '500ms' }}>
        <h3 className="font-bold text-lg mb-4 text-text-primary">نظرة عامة شهرية</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 2, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} fontSize={12} stroke="#64748b"/>
            <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value as number)} fontSize={12} stroke="#64748b"/>
            <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e0e0e0' }} formatter={(value, name) => [new Intl.NumberFormat('en-US').format(value as number), name === 'دخل' ? 'الدخل' : 'المصروف']}/>
            <Legend wrapperStyle={{paddingTop: '20px'}} />
            <Bar dataKey="دخل" fill="#22c55e" name="الدخل" radius={[8, 8, 0, 0]} />
            <Bar dataKey="مصروف" fill="#ef4444" name="المصروف" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="animate-swoopIn" style={{ animationDelay: '600ms' }}>
        <h3 className="font-bold text-lg mb-4 text-text-primary">{searchQuery ? 'نتائج البحث' : 'أحدث العمليات'}</h3>
        <input
            type="text"
            placeholder="ابحث في العمليات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 mb-4 bg-surface border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        <div className="space-y-3">
            {transactions.length === 0 ? (
                 <p className="text-center text-text-secondary p-6 bg-surface rounded-2xl">لا توجد عمليات بعد. ابدأ بإضافة واحدة!</p>
            ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, index) => <TransactionItem key={tx.id} transaction={tx} style={{ animationDelay: `${index * 60}ms` }} />)
            ) : (
                <p className="text-center text-text-secondary p-6 bg-surface rounded-2xl">لا توجد نتائج مطابقة لبحثك.</p>
            )}
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/add')}
        className="fixed bottom-24 right-4 md:right-1/2 md:translate-x-[230px] bg-gradient-accent text-accent-text p-4 rounded-full shadow-lg hover:scale-110 transition-transform transform animate-pulse-glow"
        aria-label="إضافة عملية جديدة"
       >
        <PlusCircleIcon className="w-8 h-8"/>
       </button>
    </div>
  );
};

const ReportsPage: React.FC = () => {
  const { transactions } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const expenseData = groupExpensesByCategory(transactions);
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = <T extends { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; }>({ cx, cy, midAngle, innerRadius, outerRadius, percent }: T) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-sm pointer-events-none">{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <div className="space-y-6">
        <div className="bg-surface p-4 rounded-2xl shadow-lg animate-swoopIn">
            <h3 className="font-bold text-lg mb-4 text-text-primary text-center">توزيع المصروفات حسب الفئة</h3>
             {expenseData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            isAnimationActive={isMounted}
                        >
                        {expenseData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} className="focus:outline-none focus:ring-2 focus:ring-primary" />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e0e0e0' }} formatter={(value) => new Intl.NumberFormat('en-US').format(value as number)}/>
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                    </PieChart>
                 </ResponsiveContainer>
             ) : (
                <p className="text-center text-text-secondary py-16">لا توجد بيانات مصروفات لعرضها.</p>
             )}
        </div>
    </div>
  );
};

const AddTransactionPage: React.FC = () => {
  const { addTransaction } = useAppContext();
  const navigate = useNavigate();
  
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES.EXPENSE[0].id);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategoryId(newType === TransactionType.INCOME ? CATEGORIES.INCOME[0].id : CATEGORIES.EXPENSE[0].id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
        alert('يرجى ملء جميع الحقول المطلوبة.');
        return;
    }
    addTransaction({ type, categoryId, amount: parseFloat(amount), date, description });
    navigate('/');
  };
  
  const categories = type === TransactionType.INCOME ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg animate-swoopIn">
        <div className="relative flex p-1 bg-gray-100 rounded-full mb-6">
            <span className={`absolute top-1 bottom-1 transition-transform duration-300 ease-in-out bg-white rounded-full shadow-md ${type === TransactionType.EXPENSE ? 'right-1 w-1/2' : 'right-1/2 w-1/2'}`} />
            <button onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`z-10 w-1/2 p-2 rounded-full font-bold text-lg transition-colors ${type === TransactionType.EXPENSE ? 'text-error' : 'text-text-secondary'}`}>مصروف</button>
            <button onClick={() => handleTypeChange(TransactionType.INCOME)} className={`z-10 w-1/2 p-2 rounded-full font-bold text-lg transition-colors ${type === TransactionType.INCOME ? 'text-success' : 'text-text-secondary'}`}>دخل</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">المبلغ</label>
                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition" placeholder="0.00" required />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">الفئة</label>
                <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition appearance-none" required>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">التاريخ</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition" required />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">الوصف (اختياري)</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition" rows={3} placeholder="أضف ملاحظات..." />
            </div>
            <button type="submit" className="w-full bg-gradient-primary text-primary-text font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300">حفظ العملية</button>
        </form>
    </div>
  );
};

const AboutPage: React.FC = () => {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg space-y-4 text-text-primary animate-swoopIn">
      <h2 className="text-2xl font-bold text-primary mb-4">عن مدير المصاريف</h2>
      <p className="text-text-secondary">تم تصميم هذا التطبيق ليكون رفيقك المالي الذكي، لمساعدتك على تتبع وإدارة دخلك ومصاريفك اليومية بطريقة سهلة ومرئية. هدفنا هو تزويدك بأداة قوية تمنحك فهماً واضحاً لوضعك المالي، مما يمكنك من اتخاذ قرارات مالية أفضل.</p>
      <h3 className="text-xl font-bold text-text-primary pt-4">الميزات الرئيسية:</h3>
      <ul className="list-disc list-inside space-y-2 pr-4 text-text-secondary">
        <li>تسجيل سريع للدخل والمصروفات.</li>
        <li>عرض ملخصات مرئية ورسوم بيانية تفاعلية.</li>
        <li>تصنيف المعاملات لفهم أنماط إنفاقك.</li>
        <li>واجهة بسيطة وداعمة للغة العربية بشكل كامل.</li>
        <li>حفظ البيانات محلياً على جهازك لضمان الخصوصية.</li>
      </ul>
      <p className="pt-4 text-text-secondary">نأمل أن يكون هذا التطبيق مفيداً لك في رحلتك نحو إدارة مالية أفضل.</p>
    </div>
  );
};

const DeveloperPage: React.FC = () => {
  const { developerInfo } = useAppContext();
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg text-center animate-swoopIn">
        <h2 className="text-2xl font-bold text-text-primary mt-4">{developerInfo.name}</h2>
        <p className="text-text-secondary mt-2">مطور تطبيقات ويب</p>
        <div className="mt-6 border-t border-border pt-6">
            <h3 className="text-lg font-bold text-primary mb-2">معلومات التواصل</h3>
            <p className="text-text-primary"><a href={`mailto:${developerInfo.email}`} className="hover:underline">{developerInfo.email}</a></p>
        </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
    const { theme, setTheme, budgets, setBudget } = useAppContext();
    const navigate = useNavigate();
    
    const themes = [
      { name: 'محيط', class: 'theme-ocean', color: '#0ea5e9' },
      { name: 'مجرة', class: 'theme-galaxy', color: '#a855f7' },
      { name: 'وردي', class: 'theme-rose', color: '#f43f5e' },
      { name: 'زمردي', class: 'theme-emerald', color: '#10b981' },
    ];
    
    const BudgetInputRow: React.FC<{ category: Category }> = ({ category }) => {
        const [amount, setAmount] = useState(budgets[category.id]?.toString() || '');
        const handleSetBudget = () => { setBudget(category.id, parseFloat(amount) || 0); };
        return (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-gray-50">
                <label htmlFor={`budget-${category.id}`} className="font-medium text-text-primary">{category.name}</label>
                <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      id={`budget-${category.id}`} 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="w-28 p-2 border border-border rounded-lg text-left focus:ring-2 focus:ring-primary focus:border-transparent" 
                      placeholder="غير محدد" 
                      min="0"
                    />
                    <button onClick={handleSetBudget} className="bg-primary text-primary-text font-bold py-2 px-3 rounded-lg hover:opacity-90 transition-opacity"><CheckIcon className="w-5 h-5"/></button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-2xl shadow-lg animate-swoopIn" style={{animationDelay: '100ms'}}>
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><SparklesIcon className="text-primary"/> تخصيص المظهر</h2>
                <div className="grid grid-cols-4 gap-4">
                    {themes.map((item) => (
                        <div key={item.class} className="flex flex-col items-center space-y-2">
                             <button onClick={() => setTheme(item.class)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${theme === item.class ? 'ring-4 ring-offset-2 ring-primary' : ''}`} style={{ backgroundColor: item.color }} aria-label={`تغيير المظهر إلى ${item.name}`}>
                                {theme === item.class && <CheckIcon className="w-6 h-6 text-white" />}
                            </button>
                            <span className="text-xs text-text-secondary">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-lg animate-swoopIn" style={{animationDelay: '200ms'}}>
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><BanknotesIcon className="text-primary"/> إدارة الميزانية</h2>
                <div className="space-y-2 border-t border-border pt-4">
                    {CATEGORIES.EXPENSE.map((cat) => <BudgetInputRow key={cat.id} category={cat} />)}
                </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-lg animate-swoopIn" style={{animationDelay: '300ms'}}>
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><ArrowPathIcon className="text-primary"/> إدارة البيانات</h2>
                <button onClick={() => navigate('/reset')} className="w-full text-left p-4 rounded-xl hover:bg-red-50 text-error font-bold transition-colors flex items-center justify-between">
                    <span>إعادة ضبط بيانات التطبيق</span>
                    <span>&larr;</span>
                </button>
            </div>
            
            <div className="bg-surface p-6 rounded-2xl shadow-lg animate-swoopIn" style={{animationDelay: '400ms'}}>
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><ShieldCheckIcon className="text-primary"/> البيانات والخصوصية</h2>
                <p className="text-text-secondary">نحن نهتم بخصوصيتك. جميع بياناتك المالية يتم حفظها بشكل آمن ومحلي على جهازك فقط ولا يتم مشاركتها مع أي جهة خارجية.</p>
            </div>
        </div>
    );
};

const ResetPage: React.FC = () => {
    const { resetTransactions } = useAppContext();
    const navigate = useNavigate();
    const [confirmationText, setConfirmationText] = useState('');
    const isButtonDisabled = confirmationText !== 'حذف';

    const handleReset = () => {
        if (!isButtonDisabled) {
            resetTransactions();
            navigate('/');
        }
    };

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg space-y-4 text-center animate-swoopIn">
            <WarningIcon className="w-16 h-16 text-error mx-auto"/>
            <h2 className="text-2xl font-bold text-error">هل أنت متأكد تماماً؟</h2>
            <p className="text-text-secondary">
                سيؤدي هذا الإجراء إلى **حذف جميع معاملاتك وميزانياتك بشكل دائم**. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <p className="text-text-secondary font-bold pt-4">
                للتأكيد، يرجى كتابة كلمة "حذف" في الحقل أدناه:
            </p>
            <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full p-3 text-center bg-gray-50 border-2 border-border rounded-xl focus:ring-2 focus:ring-error focus:border-transparent transition"
            />
            <button
                onClick={handleReset}
                disabled={isButtonDisabled}
                className="w-full bg-error text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:shadow-xl enabled:hover:scale-105 transform"
            >
                أفهم العواقب، قم بحذف كل شيء
            </button>
            <button
                onClick={() => navigate('/settings')}
                className="w-full text-text-secondary font-bold py-3 px-4 rounded-xl mt-2 hover:bg-gray-100 transition-colors"
            >
                إلغاء
            </button>
        </div>
    );
};


// =================================================================================
// APP COMPONENT
// =================================================================================

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  resetTransactions: () => void;
  developerInfo: DeveloperInfo;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  budgets: Record<string, number>;
  setBudget: (categoryId: string, amount: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>(LOCAL_STORAGE_TRANSACTIONS_KEY, getSeedData);
    const [developerInfo] = useLocalStorage<DeveloperInfo>(LOCAL_STORAGE_DEVELOPER_KEY, DEVELOPER_INFO);
    const [theme, setTheme] = useLocalStorage<string>(LOCAL_STORAGE_THEME_KEY, 'theme-ocean');
    const [budgets, setBudgets] = useLocalStorage<Record<string, number>>(LOCAL_STORAGE_BUDGETS_KEY, {});

    useEffect(() => {
        const root = document.documentElement;
        const allThemes = ['theme-ocean', 'theme-galaxy', 'theme-rose', 'theme-emerald'];
        root.classList.remove(...allThemes);
        root.classList.add(theme);
    }, [theme]);

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...transaction, id: Date.now().toString() }, ...prev]);
    const deleteTransaction = (id: string) => { if(window.confirm('هل أنت متأكد من حذف هذه العملية؟')) setTransactions(prev => prev.filter(tx => tx.id !== id)); };
    
    const setBudget = (categoryId: string, amount: number) => {
        if (amount < 0) return;
        setBudgets(prev => {
            const newBudgets = { ...prev };
            if (amount === 0) delete newBudgets[categoryId];
            else newBudgets[categoryId] = amount;
            return newBudgets;
        });
    };

    const resetTransactions = () => {
        setTransactions(getSeedData());
        setBudgets({});
        localStorage.removeItem('hasSeenWelcome');
        alert('تمت إعادة ضبط بيانات التطبيق بنجاح.');
    };

    const contextValue = useMemo(() => ({
        transactions, addTransaction, deleteTransaction, resetTransactions, developerInfo, theme, setTheme, budgets, setBudget
    }), [transactions, developerInfo, theme, budgets]);

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

const WelcomeScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    return (
        <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center animate-fadeIn text-primary">
            <AnimatedWalletIcon className="mb-6 w-32 h-32"/>
            <h1 className="text-4xl font-extrabold text-text-primary mb-4">أهلاً بك في مدير المصاريف</h1>
            <p className="text-text-secondary mb-10 max-w-md text-lg">التطبيق الأمثل لتتبع دخلك ومصاريفك بسهولة، واتخاذ قرارات مالية أكثر ذكاءً.</p>
            <button onClick={onFinish} className="bg-gradient-primary text-primary-text font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 animate-pulse-glow">ابدأ رحلتك المالية</button>
        </div>
    );
};

function App() {
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('hasSeenWelcome'));
  const handleWelcomeFinish = () => { localStorage.setItem('hasSeenWelcome', 'true'); setShowWelcome(false); };

  if (showWelcome) return <WelcomeScreen onFinish={handleWelcomeFinish} />;
  
  return (
    <AppProvider>
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/add" element={<AddTransactionPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/developer" element={<DeveloperPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/reset" element={<ResetPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </HashRouter>
    </AppProvider>
  );
}

// =================================================================================
// RENDERER
// =================================================================================

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);