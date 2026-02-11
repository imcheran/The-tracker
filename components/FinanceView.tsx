
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Debtor, Debt, SavingsGoal, Subscription, Investment } from '../types';
import { 
  Menu, Plus, Wallet, X, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Sparkles, Loader2,
  Search, Filter, AlertCircle, RefreshCw, Settings, Check,
  UtensilsCrossed, Bus, Gamepad2, Bandage, ShoppingBag, Plane, Wifi, 
  Notebook, Gift, CircleDot, CreditCard, User, Banknote, Landmark, CircleDollarSign,
  ArrowUpCircle, ArrowDownCircle, Trash2, Edit2, Users, Pencil, CheckCircle, Target, PiggyBank, Briefcase, Car, Home,
  Calendar, RotateCw, Play, Pause, ExternalLink, BarChart3, Clock, Download, FileText, Smartphone, Monitor, ShoppingCart, Coffee,
  Heart, Users2, Split, BarChart2, Eye, Activity, Percent, ChevronDown, Coins, Calculator, Delete, MoreHorizontal
} from 'lucide-react';
import { 
  format, isWithinInterval, isToday, eachDayOfInterval, 
  getDay, addMonths, isSameDay, addDays, isThisMonth, addYears, isBefore, differenceInDays, isYesterday,
  subMonths, startOfMonth, endOfMonth, parseISO
} from 'date-fns';
import { getFinancialInsights } from '../services/aiService';
import { loadFromStorage, saveToStorage } from '../services/storageService';
import { readRecentSms, parseBankingSms } from '../services/smsService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { Capacitor } from '@capacitor/core';
import { CURRENCIES, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from '../data/financeData';

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

const ICON_MAP: Record<string, any> = {
  'utensils-crossed': UtensilsCrossed, 'bus': Bus, 'gamepad-2': Gamepad2, 'bandaid': Bandage, 'shopping-bag': ShoppingBag,
  'plane': Plane, 'wifi': Wifi, 'notebook': Notebook, 'gift': Gift, 'circle-dot': CircleDot, 'credit-card': CreditCard,
  'user': User, 'banknote': Banknote, 'landmark': Landmark, 'circle-dollar-sign': CircleDollarSign, 'target': Target,
  'piggy-bank': PiggyBank, 'briefcase': Briefcase, 'car': Car, 'home': Home, 'smartphone': Smartphone, 'monitor': Monitor,
  'shopping-cart': ShoppingCart, 'coffee': Coffee
};

const GOAL_ICONS = ['target', 'piggy-bank', 'plane', 'car', 'home', 'briefcase', 'gift'];
const GOAL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const GROUPED_CATEGORIES = {
    'Food & Drink': [{ name: 'Food', icon: 'utensils-crossed' }, { name: 'Dining Out', icon: 'utensils-crossed' }, { name: 'Coffee', icon: 'coffee' }, { name: 'Groceries', icon: 'shopping-cart' }],
    'Shopping': [{ name: 'Shopping', icon: 'shopping-bag' }, { name: 'Clothing', icon: 'shopping-bag' }, { name: 'Electronics', icon: 'monitor' }],
    'Transport': [{ name: 'Transportation', icon: 'bus' }, { name: 'Fuel', icon: 'car' }, { name: 'Taxi', icon: 'car' }],
    'Bills & Utilities': [{ name: 'Utilities', icon: 'wifi' }, { name: 'Phone', icon: 'smartphone' }, { name: 'Internet', icon: 'wifi' }, { name: 'Rent', icon: 'home' }],
    'Life': [{ name: 'Entertainment', icon: 'gamepad-2' }, { name: 'Healthcare', icon: 'bandaid' }, { name: 'Education', icon: 'notebook' }, { name: 'Travel', icon: 'plane' }, { name: 'Gifts', icon: 'gift' }],
    'Other': [{ name: 'Other', icon: 'circle-dot' }]
};

const normalizeCategory = (catName: string) => {
    if (catName === 'Transport') return 'Transportation';
    if (catName === 'Health') return 'Healthcare';
    if (catName === 'Bills') return 'Utilities';
    return catName;
};

const getNextRenewal = (start: string | Date, period: 'Monthly' | 'Yearly') => {
    const now = new Date();
    let next = new Date(start);
    let loops = 0;
    while (next < now && loops < 1000) {
        if (period === 'Monthly') next = addMonths(next, 1);
        else next = addYears(next, 1);
        loops++;
    }
    return next;
};

const AccountCard = ({ name, type, amount, currency, onEdit }: any) => {
    const bg = type === 'Credit Card' ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white' : type === 'Bank' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700';
    return (
        <div onClick={onEdit} className={`p-4 rounded-2xl shadow-sm min-w-[140px] flex flex-col justify-between h-28 ${bg} cursor-pointer hover:opacity-90 active:scale-95 transition-all relative group`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{type}</span>
                {type === 'Credit Card' ? <CreditCard size={16} /> : type === 'Bank' ? <Landmark size={16} /> : <Banknote size={16} />}
            </div>
            <div>
                <div className="text-lg font-bold">{currency}{amount.toLocaleString()}</div>
                <div className="text-[10px] opacity-60">Available</div>
            </div>
            <div className="absolute top-2 right-2 p-1 rounded-full bg-black/5 dark:bg-white/10">
                <Edit2 size={12} className="opacity-70" />
            </div>
        </div>
    );
};

const FinanceView: React.FC<FinanceViewProps> = ({ 
    transactions = [], onAddTransaction, onUpdateTransaction, onDeleteTransaction, onMenuClick, onAddTransactions,
    debtors = [], debts = [], onAddDebtor, onDeleteDebtor, onUpdateDebtor,
    onAddDebt, onUpdateDebt, onDeleteDebt,
    goals = [], onAddGoal, onUpdateGoal, onDeleteGoal,
    subscriptions = [], onAddSubscription, onUpdateSubscription, onDeleteSubscription,
    investments = [], onAddInvestment, onUpdateInvestment, onDeleteInvestment,
    user, partnerTransactions = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'debts' | 'goals' | 'subscriptions' | 'investments'>('overview');
  const [showInput, setShowInput] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  
  // Workspace Toggle: 'personal' or 'joint'
  const [workspaceMode, setWorkspaceMode] = useState<'personal' | 'joint'>('personal');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const [currency, setCurrency] = useState(() => loadFromStorage('finance_currency', { code: 'INR', symbol: '₹' }));
  
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);
  const [showDebtorModal, setShowDebtorModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [showGoalDeposit, setShowGoalDeposit] = useState<{ id: string, name: string } | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Balance Adjustment
  const [adjustAccount, setAdjustAccount] = useState<{name: string, type: string, current: number} | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  // Form States
  const [debtorName, setDebtorName] = useState('');
  const [debtorType, setDebtorType] = useState('Person');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [debtActionType, setDebtActionType] = useState<'Borrow' | 'Lend'>('Borrow');
  
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalIcon, setGoalIcon] = useState(GOAL_ICONS[0]);
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
  const [goalDeadline, setGoalDeadline] = useState('');

  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState('');
  const [subPeriod, setSubPeriod] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [subDate, setSubDate] = useState('');
  const [subUrl, setSubUrl] = useState('');

  const [invName, setInvName] = useState('');
  const [invUnits, setInvUnits] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invType, setInvType] = useState<'Stock' | 'Crypto' | 'Mutual Fund' | 'Gold' | 'Real Estate' | 'Other'>('Stock');

  const [isSyncingSms, setIsSyncingSms] = useState(false);

  // Transaction Input
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [type, setType] = useState<'credit'|'debit'>('debit');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSharedTransaction, setIsSharedTransaction] = useState(false);
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([]);

  useEffect(() => { saveToStorage('finance_currency', currency); }, [currency]);

  // Autocomplete Logic
  useEffect(() => {
      if (merchant.length > 1) {
          const uniqueMerchants: string[] = Array.from(new Set(transactions.map(t => t.merchant)));
          const filtered = uniqueMerchants.filter(m => m.toLowerCase().includes(merchant.toLowerCase()) && m !== merchant).slice(0, 3);
          setMerchantSuggestions(filtered);
      } else {
          setMerchantSuggestions([]);
      }
  }, [merchant, transactions]);

  // Editing Hooks
  useEffect(() => {
      if (editingTransaction) {
          setAmount(editingTransaction.amount.toString());
          setMerchant(editingTransaction.merchant);
          setType(editingTransaction.type);
          setCategory(editingTransaction.category);
          setPaymentMethod(editingTransaction.payment_method || 'Cash');
          setNotes(editingTransaction.notes || '');
          setEntryDate(editingTransaction.date);
          setIsSharedTransaction(!!editingTransaction.isShared);
          setShowInput(true);
      }
  }, [editingTransaction]);

  useEffect(() => {
      if (editingGoal) {
          setGoalName(editingGoal.name);
          setGoalTarget(editingGoal.targetAmount.toString());
          setGoalCurrent(editingGoal.currentAmount.toString());
          setGoalIcon(editingGoal.icon);
          setGoalColor(editingGoal.color);
          setGoalDeadline(editingGoal.deadline || '');
          setShowGoalModal(true);
      }
  }, [editingGoal]);

  const resetForm = () => {
      setAmount(''); setMerchant(''); setNotes('');
      setEntryDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentMethod('Cash');
      setIsSharedTransaction(workspaceMode === 'joint');
      setEditingTransaction(null);
  };

  const resetGoalForm = () => {
      setGoalName(''); setGoalTarget(''); setGoalCurrent('0');
      setGoalIcon(GOAL_ICONS[0]); setGoalColor(GOAL_COLORS[0]); setGoalDeadline('');
      setEditingGoal(null);
  };

  const formatCurrency = (val: number) => {
      return val.toLocaleString('en-US', { style: 'currency', currency: currency.code, maximumFractionDigits: 0 });
  };

  // --- Calculator Logic ---
  const handleCalcInput = (key: string) => {
      if (key === 'C') {
          setCalcDisplay('0');
      } else if (key === '=') {
          try {
              // eslint-disable-next-line no-new-func
              const result = new Function('return ' + calcDisplay)();
              setCalcDisplay(String(result));
          } catch (e) {
              setCalcDisplay('Error');
          }
      } else if (key === 'back') {
          setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      } else {
          setCalcDisplay(prev => prev === '0' || prev === 'Error' ? key : prev + key);
      }
  };

  const useCalcResult = () => {
      try {
          // eslint-disable-next-line no-new-func
          const result = new Function('return ' + calcDisplay)();
          setAmount(String(Math.round(result * 100) / 100)); // Round to 2 decimal places
          setShowCalculator(false);
          setCalcDisplay('0');
      } catch (e) {
          // ignore error
      }
  };

  // --- Workspace Data Logic ---
  
  const activeTransactions = useMemo(() => {
      if (workspaceMode === 'joint') {
          const local = transactions || [];
          const partner = partnerTransactions || [];
          return [...local, ...partner];
      }
      return transactions || [];
  }, [workspaceMode, transactions, partnerTransactions]);

  const allTransactionsSorted = useMemo(() => {
      return [...activeTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTransactions]);

  const monthTransactions = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return allTransactionsSorted.filter(t => t.date && isWithinInterval(parseISO(t.date), { start, end }));
  }, [allTransactionsSorted, currentMonth]);

  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      monthTransactions.forEach(t => {
          if (t.exclude_from_budget) return; // Skip excluded transactions in list
          if (!groups[t.date]) groups[t.date] = [];
          groups[t.date].push(t);
      });
      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthTransactions]);

  const stats = useMemo(() => {
      let income = 0;
      let expense = 0;
      monthTransactions.forEach(t => {
          if (t.exclude_from_budget) return;
          if (t.type === 'credit') income += t.amount;
          else expense += t.amount;
      });
      
      return { income, expense, balance: income - expense };
  }, [monthTransactions]);

  const accountBalances = useMemo(() => {
      const acc = { cash: 0, bank: 0, credit: 0 };
      allTransactionsSorted.forEach(t => {
          const val = t.type === 'credit' ? t.amount : -t.amount;
          if (t.payment_method === 'Cash') acc.cash += val;
          else if (t.payment_method === 'Credit Card') acc.credit += val; // Usually negative if expense
          else acc.bank += val; // UPI, Bank Transfer, Debit Card
      });
      return acc;
  }, [allTransactionsSorted]);

  const totalBalance = accountBalances.cash + accountBalances.bank + accountBalances.credit;

  const chartData = useMemo(() => {
      const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
      return days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTxns = monthTransactions.filter(t => t.date === dateStr);
          // Strictly exclude 'exclude_from_budget' items from the graph
          const income = dayTxns.filter(t => t.type === 'credit' && !t.exclude_from_budget).reduce((sum, t) => sum + t.amount, 0);
          const expense = dayTxns.filter(t => t.type === 'debit' && !t.exclude_from_budget).reduce((sum, t) => sum + t.amount, 0);
          return { name: format(day, 'd'), income, expense };
      });
  }, [monthTransactions, currentMonth]);

  const handleManualSubmit = () => {
      if (!amount || !merchant) return;
      const amtVal = parseFloat(amount);
      if(isNaN(amtVal)) return;

      const txData: Transaction = {
          id: editingTransaction ? editingTransaction.id : Date.now().toString(),
          is_transaction: true,
          amount: amtVal,
          merchant,
          type,
          category,
          date: entryDate,
          payment_method: paymentMethod,
          notes,
          raw_sms: editingTransaction?.raw_sms || '',
          createdAt: editingTransaction?.createdAt || new Date(),
          updatedAt: new Date(),
          isShared: isSharedTransaction,
          paidBy: editingTransaction?.paidBy || user?.uid
      };
      
      if (editingTransaction && onUpdateTransaction) onUpdateTransaction(txData);
      else onAddTransaction(txData);
      
      setShowInput(false); 
      resetForm();
  };

  const handleAdjustBalance = () => {
      if (!adjustAccount || !adjustAmount) return;
      const newBal = parseFloat(adjustAmount);
      if (isNaN(newBal)) return;
      
      const diff = newBal - adjustAccount.current;
      if (diff === 0) {
          setAdjustAccount(null);
          return;
      }
      
      const isCredit = diff > 0;
      
      // Create adjustment transaction that doesn't affect budget
      const adjustmentTx: Transaction = {
          id: Date.now().toString(),
          is_transaction: true,
          amount: Math.abs(diff),
          type: isCredit ? 'credit' : 'debit',
          merchant: 'Balance Adjustment',
          category: 'Adjustment',
          date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: adjustAccount.type,
          notes: `Manual adjustment from ${adjustAccount.current} to ${newBal}`,
          raw_sms: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          exclude_from_budget: true, // Key: Exclude from spending graph
          isShared: false,
          paidBy: user?.uid
      };
      
      onAddTransaction(adjustmentTx);
      setAdjustAccount(null);
      setAdjustAmount('');
  };

  const handleSaveGoal = () => {
      if (!goalName || !goalTarget || !onAddGoal || !onUpdateGoal) return;
      const goalId = editingGoal ? editingGoal.id : Date.now().toString();
      const goalData: SavingsGoal = {
          id: goalId,
          name: goalName,
          targetAmount: parseFloat(goalTarget),
          currentAmount: parseFloat(goalCurrent) || 0,
          color: goalColor,
          icon: goalIcon,
          deadline: goalDeadline,
          createdAt: editingGoal ? editingGoal.createdAt : new Date(),
          updatedAt: new Date()
      };
      if (editingGoal) onUpdateGoal(goalData); 
      else onAddGoal(goalData);
      setShowGoalModal(false); 
      resetGoalForm();
  };

  const handleDeposit = () => {
      if(!showGoalDeposit || !depositAmount || !onUpdateGoal) return;
      const goal = goals.find(g => g.id === showGoalDeposit.id);
      if(goal) {
          const amt = parseFloat(depositAmount);
          if(!isNaN(amt)) {
              onUpdateGoal({ ...goal, currentAmount: goal.currentAmount + amt, updatedAt: new Date() });
              onAddTransaction({
                  id: Date.now().toString(),
                  is_transaction: true,
                  amount: amt,
                  type: 'debit',
                  merchant: `Savings: ${goal.name}`,
                  category: 'Savings',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  payment_method: 'Bank Transfer',
                  raw_sms: '',
                  createdAt: new Date(),
                  updatedAt: new Date()
              });
          }
      }
      setShowGoalDeposit(null);
      setDepositAmount('');
  };

  const renderOverview = () => (
      <div className="space-y-6 animate-in fade-in pb-20 p-4">
          
          <div className="flex justify-center mb-2">
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-full flex relative shadow-inner">
                  <button onClick={() => setWorkspaceMode('personal')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 ${workspaceMode === 'personal' ? 'text-white' : 'text-slate-500'}`}>Personal</button>
                  <button onClick={() => setWorkspaceMode('joint')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 flex items-center gap-1 ${workspaceMode === 'joint' ? 'text-white' : 'text-slate-500'}`}><Heart size={10} fill="currentColor" /> Joint</button>
                  <div className={`absolute top-1 bottom-1 w-[50%] bg-indigo-600 rounded-full transition-transform duration-300 ${workspaceMode === 'joint' ? 'translate-x-full' : 'translate-x-0'}`} />
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">Trend</h3>
                  <div className="flex gap-2">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 text-slate-400 hover:text-slate-600"><ChevronLeft size={16}/></button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{format(currentMonth, 'MMM yyyy')}</span>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 text-slate-400 hover:text-slate-600"><ChevronRight size={16}/></button>
                  </div>
              </div>
              <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                          <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={4} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                          <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                          <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
              {/* 3-Column Grid for Income, Expense, Total Balance */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                      <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Income</div>
                      <div className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(stats.income)}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                      <div className="text-[10px] text-red-600 font-bold uppercase mb-1">Expense</div>
                      <div className="text-sm sm:text-base font-bold text-red-700 dark:text-red-400 truncate">{formatCurrency(stats.expense)}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Total Balance</div>
                      <div className={`text-sm sm:text-base font-bold truncate ${totalBalance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-600'}`}>{formatCurrency(totalBalance)}</div>
                  </div>
              </div>
          </div>

          <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 px-1">Accounts</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  <AccountCard 
                    name="Cash" type="Cash" amount={accountBalances.cash} currency={currency.symbol} 
                    onEdit={() => setAdjustAccount({ name: 'Cash', type: 'Cash', current: accountBalances.cash })}
                  />
                  <AccountCard 
                    name="Bank" type="Bank" amount={accountBalances.bank} currency={currency.symbol} 
                    onEdit={() => setAdjustAccount({ name: 'Bank', type: 'Bank', current: accountBalances.bank })}
                  />
                  <AccountCard 
                    name="Cards" type="Credit Card" amount={accountBalances.credit} currency={currency.symbol} 
                    onEdit={() => setAdjustAccount({ name: 'Credit Card', type: 'Credit Card', current: accountBalances.credit })}
                  />
              </div>
          </div>
      </div>
  );

  const renderGoals = () => (
      <div className="p-4 space-y-4 pb-24">
          <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Savings Goals</h3>
              <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                  <Plus size={20}/>
              </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
              {goals.map(goal => {
                  const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                      <div key={goal.id} className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-xl" style={{ backgroundColor: goal.color }}>
                                      <Target size={24} />
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white text-lg">{goal.name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target: {formatCurrency(goal.targetAmount)}</div>
                                  </div>
                              </div>
                              <button onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }} className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200">
                                  <Edit2 size={18} />
                              </button>
                          </div>
                          
                          <div className="flex items-end justify-between mb-2">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                              <span className="text-sm font-bold text-slate-400 mb-1">{progress}%</span>
                          </div>

                          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                          </div>

                          <button 
                              onClick={() => setShowGoalDeposit({ id: goal.id, name: goal.name })}
                              className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                              <Plus size={16} /> Add Money
                          </button>
                      </div>
                  );
              })}
              {goals.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                      <PiggyBank size={48} className="mx-auto mb-2 opacity-50"/>
                      <p>No goals yet. Create one!</p>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
        {/* Header */}
        <div className="pt-safe bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 z-20">
            <div className="h-16 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    {onMenuClick && (
                        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <Menu size={20}/>
                        </button>
                    )}
                    <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Finance</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowInput(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="px-4 pb-3 overflow-x-auto no-scrollbar flex gap-2">
                {(['overview', 'transactions', 'debts', 'goals', 'subscriptions', 'investments'] as const).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`px-4 py-1.5 text-xs font-bold capitalize transition-all rounded-full border ${activeTab === tab ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'transactions' && (
                <div className="p-4 space-y-6">
                    {groupedTransactions.map(([date, txns]) => (
                        <div key={date}>
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">{format(parseISO(date), 'EEEE, MMM d')}</h3>
                            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                {txns.map((t, i) => (
                                    <div key={t.id} onClick={() => setEditingTransaction(t)} className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${i !== txns.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700">
                                                {(() => {
                                                    const cat = normalizeCategory(t.category);
                                                    const iconKey = DEFAULT_CATEGORIES.find(c => c.name === cat)?.icon || 'circle-dot';
                                                    const IconComp = ICON_MAP[iconKey] || CircleDot;
                                                    return <IconComp size={20} />;
                                                })()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white text-sm mb-0.5">{t.merchant}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                                    {t.category} 
                                                    {t.isShared && <Users size={12} className="text-purple-500 ml-1"/>}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${t.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                            {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'goals' && renderGoals()}
            {/* ... other tabs ... */}
        </div>

        {/* Balance Adjustment Modal */}
        {adjustAccount && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setAdjustAccount(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Adjust Balance</h3>
                    <p className="text-sm text-slate-500 mb-6">Set current value for {adjustAccount.name}</p>
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-6">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Current Balance</div>
                        <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(adjustAccount.current)}</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 flex items-center gap-2 border-2 border-indigo-500/20 focus-within:border-indigo-500 transition-colors">
                        <span className="text-2xl font-bold text-indigo-500">{currency.symbol}</span>
                        <input 
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            className="bg-transparent text-3xl font-black text-slate-900 dark:text-white w-full outline-none"
                            placeholder={adjustAccount.current.toString()}
                            autoFocus
                        />
                    </div>
                    
                    <button onClick={handleAdjustBalance} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95">
                        Update Balance
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-3">This adjustment will not affect your monthly spending graph.</p>
                </div>
            </div>
        )}

    </div>
  );
};

export default FinanceView;
