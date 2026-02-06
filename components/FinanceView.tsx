
import React, { useState, useMemo } from 'react';
import { Transaction, Debtor, Debt, SavingsGoal, Subscription, Investment } from '../types';
import { Menu, Plus, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { loadFromStorage } from '../services/storageService';

interface FinanceViewProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction?: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onMenuClick?: () => void;
  onAddTransactions?: (t: Transaction[]) => void;
  debtors?: Debtor[];
  debts?: Debt[];
  onAddDebtor?: (d: Debtor) => void;
  onDeleteDebtor?: (id: string) => void;
  onUpdateDebtor?: (d: Debtor) => void;
  onAddDebt?: (d: Debt) => void;
  onUpdateDebt?: (d: Debt) => void;
  onDeleteDebt?: (id: string) => void;
  goals?: SavingsGoal[];
  onAddGoal?: (g: SavingsGoal) => void;
  onUpdateGoal?: (g: SavingsGoal) => void;
  onDeleteGoal?: (id: string) => void;
  subscriptions?: Subscription[];
  onAddSubscription?: (s: Subscription) => void;
  onUpdateSubscription?: (s: Subscription) => void;
  onDeleteSubscription?: (id: string) => void;
  investments?: Investment[];
  onAddInvestment?: (i: Investment) => void;
  onUpdateInvestment?: (i: Investment) => void;
  onDeleteInvestment?: (id: string) => void;
  user?: any;
  partnerTransactions?: Transaction[];
}

const FinanceView: React.FC<FinanceViewProps> = ({ 
    transactions = [], onMenuClick, partnerTransactions = []
}) => {
  const [currency] = useState(() => loadFromStorage('finance_currency', { code: 'USD', symbol: '$' }));
  
  const formatCurrency = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: currency.code, maximumFractionDigits: 0 });

  const activeTransactions = [...transactions, ...(partnerTransactions || [])];
  
  const stats = useMemo(() => {
      let income = 0;
      let expense = 0;
      activeTransactions.forEach(t => {
          if (t.type === 'credit') income += t.amount;
          else expense += t.amount;
      });
      return { income, expense, balance: income - expense };
  }, [activeTransactions]);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <div className="pt-6 px-6 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onMenuClick} className="md:hidden p-3 bg-white rounded-full shadow-organic text-charcoal">
                    <Menu size={24}/>
                </button>
                <div className="flex gap-2">
                    <button className="p-3 bg-white rounded-full shadow-organic text-charcoal/50 hover:text-charcoal transition-colors">
                        <RefreshCw size={20}/>
                    </button>
                    <button className="p-3 bg-charcoal text-white rounded-full shadow-organic hover:scale-105 transition-transform">
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
            <h1 className="text-[48px] font-black text-charcoal tracking-tight">Finance</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 pt-4 no-scrollbar">
            
            {/* Balance Card */}
            <div className="bg-white rounded-card p-8 shadow-organic mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-soft rounded-full -mr-10 -mt-10 opacity-20 blur-2xl"></div>
                <div className="relative z-10">
                    <span className="text-charcoal/50 font-bold uppercase tracking-widest text-sm">Total Balance</span>
                    <div className="text-[64px] font-black text-charcoal leading-tight tracking-tight my-2">
                        {formatCurrency(stats.balance)}
                    </div>
                    <div className="flex gap-8 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-charcoal">
                                <ArrowDown size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-charcoal/40">Income</div>
                                <div className="text-lg font-bold text-charcoal">{formatCurrency(stats.income)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-charcoal">
                                <ArrowUp size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-charcoal/40">Expense</div>
                                <div className="text-lg font-bold text-charcoal">{formatCurrency(stats.expense)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <h3 className="text-2xl font-extrabold text-charcoal mb-4">Recent</h3>
            <div className="space-y-4">
                {activeTransactions.slice(0, 10).map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-card shadow-organic flex items-center justify-between hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${t.type === 'credit' ? 'bg-cream text-charcoal' : 'bg-charcoal/5 text-charcoal'}`}>
                                {t.type === 'credit' ? '💰' : '💸'}
                            </div>
                            <div>
                                <div className="font-bold text-charcoal text-lg">{t.merchant}</div>
                                <div className="text-xs font-bold text-charcoal/40 uppercase">{t.category}</div>
                            </div>
                        </div>
                        <span className={`text-xl font-black ${t.type === 'credit' ? 'text-coral' : 'text-charcoal'}`}>
                            {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default FinanceView;
