import React, { createContext, useContext, useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useLocalStorage from './hooks/useLocalStorage';
import { LOCAL_STORAGE_TRANSACTIONS_KEY, DEVELOPER_INFO, LOCAL_STORAGE_DEVELOPER_KEY } from './constants';
import { getSeedData } from './data/seed';
import { Transaction, DeveloperInfo } from './types';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import AddTransactionPage from './pages/AddTransactionPage';
import AboutPage from './pages/AboutPage';
import DeveloperPage from './pages/DeveloperPage';
import SettingsPage from './pages/SettingsPage';
import { AnimatedWalletIcon, CheckCircleIcon } from './components/icons/Icons';

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  resetTransactions: () => void;
  developerInfo: DeveloperInfo;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>(LOCAL_STORAGE_TRANSACTIONS_KEY, getSeedData);
    const [developerInfo] = useLocalStorage<DeveloperInfo>(LOCAL_STORAGE_DEVELOPER_KEY, DEVELOPER_INFO);


    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction: Transaction = {
            ...transaction,
            id: new Date().getTime().toString(),
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };

    const resetTransactions = () => {
        if(window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط جميع بيانات المعاملات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            setTransactions(getSeedData());
            alert('تمت إعادة ضبط البيانات بنجاح!');
        }
    };

    const contextValue = useMemo(() => ({
        transactions,
        addTransaction,
        resetTransactions,
        developerInfo
    }), [transactions, developerInfo]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

const WelcomeScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    return (
        <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-8 text-center animate-fadeIn">
            <AnimatedWalletIcon className="mb-6"/>
            <h1 className="text-3xl font-bold text-primary mb-2">مرحباً بك في مدير المصاريف</h1>
            <p className="text-neutral mb-8 max-w-md">
                التطبيق الأمثل لتتبع دخلك ومصاريفك بسهولة، واتخاذ قرارات مالية أكثر ذكاءً.
            </p>
            
            <div className="space-y-4 text-right mb-10 max-w-sm w-full">
                <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-success mt-1 flex-shrink-0"/>
                    <p className="text-gray-700"><span className="font-bold">تسجيل سريع:</span> أضف معاملاتك المالية في ثوانٍ.</p>
                </div>
                <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-success mt-1 flex-shrink-0"/>
                    <p className="text-gray-700"><span className="font-bold">تقارير مرئية:</span> رسوم بيانية لفهم أين يذهب مالك.</p>
                </div>
                 <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-success mt-1 flex-shrink-0"/>
                    <p className="text-gray-700"><span className="font-bold">أمان تام:</span> بياناتك محفوظة على جهازك فقط.</p>
                </div>
            </div>
            
            <button
                onClick={onFinish}
                className="bg-primary text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-primary-focus transition-transform transform hover:scale-105 animate-pulse-slow"
            >
                ابدأ الآن
            </button>
        </div>
    );
};


function App() {
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('hasSeenWelcome'));

  const handleWelcomeFinish = () => {
      localStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcome(false);
  };

  if (showWelcome) {
      return <WelcomeScreen onFinish={handleWelcomeFinish} />;
  }
  
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
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </HashRouter>
    </AppProvider>
  );
}

export default App;