
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Menu, Wallet, TrendingUp, TrendingDown, 
  ArrowRightLeft, CreditCard, Target, MoreHorizontal,
  ChevronRight, Calendar, Filter, DollarSign, Users, PiggyBank,
  Landmark, CreditCard as CardIcon, Banknote, CircleDollarSign, Split
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { Transaction, Debtor, Debt, SavingsGoal, Subscription, Investment } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip 
} from 'recharts';

// --- Types from Props ---
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

// --- DESIGN SYSTEM TOKENS ---
const PALETTE = {
  ivy: '#6B4DFF',
  ivyDark: '#352680',
  green: '#14CC9E',
  orange: '#FFC44D',
  red: '#FF4D6B',
  darkBg: '#111114',
  cardDark: '#1E1E24',
  textPrimary: '#FAFAFA',
  textSecondary: '#939199',
  medium: '#2B2C2D'
};

const GRADIENTS = {
  primary: 'linear-gradient(135deg, #6B4DFF 0%, #9C27B0 100%)',
  green: 'linear-gradient(135deg, #14CC9E 0%, #0A664F 100%)',
  orange: 'linear-gradient(135deg, #FFC44D 0%, #FF9F30 100%)',
  red: 'linear-gradient(135deg, #FF4D6B 0%, #E62E2E 100%)'
};

// --- COMPONENTS ---

const BalanceDisplay = ({ amount, currency = '$', size = 'lg', hidden = false, className = '' }: any) => {
  if (hidden) return <span className={`font-bold tracking-widest ${size === 'lg' ? 'text-3xl' : 'text-lg'} ${className}`}>••••••</span>;
  
  const formatted = Math.abs(amount).toFixed(2);
  const [intPart, decPart] = formatted.split('.');
  
  const sizeClasses = size === 'lg'? { int: 'text-3xl', dec: 'text-xl' } : { int: 'text-lg', dec: 'text-sm' };
  
  return (
    <div className={`flex items-baseline font-sans ${className}`}>
      <span className="mr-1 text-sm font-bold opacity-70">{currency}</span>
      <span className={`font-bold ${sizeClasses.int}`}>{intPart}</span>
      <span className={`font-medium opacity-70 ${sizeClasses.dec}`}>.{decPart}</span>
    </div>
  );
};

const ItemIcon = ({ icon: Icon, color, className }: { icon: any, color: string, className?: string }) => (
  <div 
    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${className}`}
    style={{ backgroundColor: color + '20' }} 
  >
    <Icon size={20} color={color} />
  </div>
);

const FinanceView: React.FC<FinanceViewProps> = ({ 
    transactions = [], onAddTransaction, onUpdateTransaction, onDeleteTransaction, onMenuClick,
    debtors = [], debts = [], onAddDebtor, onAddDebt,
    goals = [], onAddGoal, onUpdateGoal, onDeleteGoal,
    subscriptions = [], onAddSubscription, onDeleteSubscription,
    investments = [], onAddInvestment
}) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'TRANSACTIONS' | 'BUDGETS' | 'LOANS'>('ACCOUNTS');
  const [hideTotalBalance, setHideTotalBalance] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- DERIVED STATE ---

  const monthlyStats = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date >= start && date <= end) {
        if (t.type === 'credit') income += t.amount;
        else expense += t.amount;
      }
    });

    return { income, expense };
  }, [transactions, currentMonth]);

  const accounts = useMemo(() => {
      // Dynamically generate accounts from payment methods
      const accs: Record<string, number> = { 'Cash': 0, 'Bank': 0, 'Card': 0, 'Savings': 0 };
      
      transactions.forEach(t => {
          const method = t.payment_method || 'Cash';
          const amount = t.type === 'credit' ? t.amount : -t.amount;
          
          if (method.toLowerCase().includes('card') || method.toLowerCase().includes('credit')) accs['Card'] += amount;
          else if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('upi') || method.toLowerCase().includes('transfer')) accs['Bank'] += amount;
          else if (method.toLowerCase().includes('saving')) accs['Savings'] += amount;
          else accs['Cash'] += amount;
      });

      return [
          { id: 'cash', name: 'Cash', balance: accs['Cash'], icon: Banknote, color: PALETTE.orange },
          { id: 'bank', name: 'Bank Account', balance: accs['Bank'], icon: Landmark, color: PALETTE.ivy },
          { id: 'card', name: 'Credit Card', balance: accs['Card'], icon: CreditCard, color: PALETTE.red },
          { id: 'savings', name: 'Savings', balance: accs['Savings'], icon: PiggyBank, color: PALETTE.green },
      ];
  }, [transactions]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // --- RENDERERS ---

  const renderAccounts = () => (
      <div className="flex flex-col gap-3 pb-20">
          {accounts.map(account => (
              <div 
                key={account.id}
                className="p-4 rounded-2xl flex items-center justify-between border border-white/5 bg-[#1E1E24] hover:bg-[#25252b] transition-colors"
              >
                  <div className="flex items-center gap-4">
                      <ItemIcon icon={account.icon} color={account.color} />
                      <div className="flex flex-col">
                          <span className="font-bold text-white text-base">{account.name}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{account.id}</span>
                      </div>
                  </div>
                  <BalanceDisplay amount={account.balance} hidden={hideTotalBalance} size="md" className="text-white" />
              </div>
          ))}
          
          <button 
            onClick={() => onAddTransaction({ 
                id: Date.now().toString(), 
                amount: 0, 
                type: 'credit', 
                merchant: 'Deposit', 
                category: 'Income', 
                date: format(new Date(), 'yyyy-MM-dd'), 
                is_transaction: true, 
                createdAt: new Date(), 
                payment_method: 'Cash', 
                raw_sms: '' 
            })}
            className="mt-2 w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-white/5 transition-colors text-gray-400"
          >
              <Plus size={20} />
              <span>Add Transaction</span>
          </button>
      </div>
  );

  const renderTransactionsList = () => (
      <div className="flex flex-col gap-3 pb-20">
          {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-[#1E1E24] flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                          {t.type === 'credit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{t.merchant}</span>
                          <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-500">{t.category} • {format(new Date(t.date), 'MMM d')}</span>
                              {t.personalShare !== undefined && t.personalShare !== t.amount && (
                                  <span className="text-[10px] text-blue-400 bg-blue-900/30 px-1.5 rounded flex items-center gap-0.5 ml-1"><Split size={8} /> Split</span>
                              )}
                          </div>
                      </div>
                  </div>
                  <span className={`font-bold ${t.type === 'credit' ? 'text-emerald-500' : 'text-white'}`}>
                      {t.type === 'credit' ? '+' : '-'}{Math.abs(t.amount).toFixed(2)}
                  </span>
              </div>
          ))}
      </div>
  );

  const renderBudgets = () => (
      <div className="flex flex-col gap-4 pb-20">
          {/* Goals as Budgets */}
          {goals.map(goal => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              return (
                  <div key={goal.id} className="p-5 rounded-2xl bg-[#1E1E24]">
                      <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                              <ItemIcon icon={Target} color={goal.color} />
                              <span className="font-bold text-lg text-white">{goal.name}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-400">
                              {goal.currentAmount} / {goal.targetAmount}
                          </span>
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden bg-[#2B2C2D]">
                          <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${progress}%`, backgroundColor: goal.color }} 
                          />
                      </div>
                      <p className="text-xs mt-3 font-medium text-right text-gray-500">
                          {goal.targetAmount - goal.currentAmount} remaining
                      </p>
                  </div>
              );
          })}
          {goals.length === 0 && <div className="text-center text-gray-500 py-10">No budgets or goals set.</div>}
      </div>
  );

  const renderLoans = () => (
      <div className="flex flex-col gap-4 pb-20">
          {debtors.map(debtor => {
              const debtorDebts = debts.filter(d => d.debtorId === debtor.id);
              const totalOwed = debtorDebts.reduce((acc, d) => d.type === 'Lend' ? acc + d.amount : acc - d.amount, 0);
              const isOwed = totalOwed >= 0;

              return (
                  <div key={debtor.id} className="p-5 rounded-2xl border-l-4 relative overflow-hidden bg-[#1E1E24]" style={{ borderLeftColor: isOwed ? PALETTE.green : PALETTE.red }}>
                      <div className="flex justify-between items-start z-10 relative">
                          <div className="flex flex-col">
                              <span className="text-xs font-bold mb-1 tracking-wider" style={{ color: isOwed ? PALETTE.green : PALETTE.red }}>
                                  {isOwed ? 'YOU ARE OWED' : 'YOU OWE'}
                              </span>
                              <span className="font-bold text-xl text-white">{debtor.name}</span>
                          </div>
                          <span className="font-bold text-2xl text-white">
                              ${Math.abs(totalOwed).toLocaleString()}
                          </span>
                      </div>
                      <div className="mt-4 flex gap-2">
                          <button onClick={() => onAddDebt?.({ id: Date.now().toString(), debtorId: debtor.id, amount: 0, type: 'Lend', description: 'New Loan', date: format(new Date(), 'yyyy-MM-dd'), createdAt: new Date() })} className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-colors flex-1">
                              + LEND
                          </button>
                          <button onClick={() => onAddDebt?.({ id: Date.now().toString(), debtorId: debtor.id, amount: 0, type: 'Borrow', description: 'New Borrow', date: format(new Date(), 'yyyy-MM-dd'), createdAt: new Date() })} className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-colors flex-1">
                              - BORROW
                          </button>
                      </div>
                  </div>
              );
          })}
          {debtors.length === 0 && <div className="text-center text-gray-500 py-10">No loans recorded.</div>}
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden bg-[#111114] text-[#FAFAFA]">
      
      {/* HEADER SECTION */}
      <header className="px-6 pt-8 pb-6 flex flex-col gap-6 bg-[#111114] shrink-0">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {onMenuClick && (
                <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors md:hidden">
                    <Menu size={24} color="#FAFAFA" />
                </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-[10px] font-bold tracking-widest text-[#939199] mb-0.5">
                TOTAL BALANCE
              </h1>
              <div onClick={() => setHideTotalBalance(!hideTotalBalance)} className="cursor-pointer">
                <BalanceDisplay 
                  amount={totalBalance} 
                  hidden={hideTotalBalance} 
                  className="text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5">
                <Search size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl flex flex-col gap-2 bg-[#1E1E24]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#14CC9E]" />
              <span className="text-[10px] font-bold text-[#939199]">INCOME</span>
            </div>
            <BalanceDisplay amount={monthlyStats.income} size="sm" className="text-white" />
          </div>
          <div className="p-4 rounded-2xl flex flex-col gap-2 bg-[#1E1E24]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF4D6B]" />
              <span className="text-[10px] font-bold text-[#939199]">EXPENSES</span>
            </div>
            <BalanceDisplay amount={monthlyStats.expense} size="sm" className="text-white" />
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="flex px-6 border-b border-white/10 overflow-x-auto no-scrollbar shrink-0">
        {['ACCOUNTS', 'TRANSACTIONS', 'BUDGETS', 'LOANS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-4 mr-6 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab 
               ? 'text-white border-[#6B4DFF]' 
                : 'text-[#939199] border-transparent hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {activeTab === 'ACCOUNTS' && renderAccounts()}
        {activeTab === 'TRANSACTIONS' && renderTransactionsList()}
        {activeTab === 'BUDGETS' && renderBudgets()}
        {activeTab === 'LOANS' && renderLoans()}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6 z-10">
        <button 
          onClick={() => {
              if (activeTab === 'LOANS') onAddDebtor?.({ id: Date.now().toString(), name: 'New Person', type: 'Person', createdAt: new Date() });
              else if (activeTab === 'BUDGETS') onAddGoal?.({ id: Date.now().toString(), name: 'New Goal', targetAmount: 1000, currentAmount: 0, color: PALETTE.ivy, icon: 'target', createdAt: new Date() });
              else onAddTransaction({ id: Date.now().toString(), amount: 0, type: 'debit', merchant: '', category: 'Other', date: format(new Date(), 'yyyy-MM-dd'), is_transaction: true, createdAt: new Date(), payment_method: 'Cash', raw_sms: '' });
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform active:scale-95 text-white"
          style={{ background: GRADIENTS.primary, boxShadow: '0 10px 25px -5px rgba(107, 77, 255, 0.5)' }}
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
};

export default FinanceView;
