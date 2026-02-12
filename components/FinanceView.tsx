
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
  Heart, Users2, Split, BarChart2, Eye, Activity, Percent, ChevronDown, Coins, Calculator, Delete, MoreHorizontal,
  ArrowRightLeft,
  CalendarDays,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  format, isWithinInterval, isToday, eachDayOfInterval, 
  getDay, addMonths, isSameDay, addDays, isThisMonth, addYears, isBefore, differenceInDays, isYesterday,
  subMonths, startOfMonth, endOfMonth, parseISO, startOfYear
} from 'date-fns';
import { loadFromStorage, saveToStorage } from '../services/storageService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { CURRENCIES, DEFAULT_CATEGORIES } from '../data/financeData';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const GOAL_ICONS = ['target', 'piggy-bank', 'plane', 'car', 'home', 'briefcase', 'gift'];
const GOAL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const normalizeCategory = (catName: string) => {
    if (catName === 'Transport') return 'Transportation';
    if (catName === 'Health') return 'Healthcare';
    if (catName === 'Bills') return 'Utilities';
    return catName;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'assets' | 'subscriptions' | 'investments'>('overview');
  const [showInput, setShowInput] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Workspace Toggle: 'personal' or 'joint'
  const [workspaceMode, setWorkspaceMode] = useState<'personal' | 'joint'>('personal');

  // Filters
  const [txnFilterType, setTxnFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [txnSearch, setTxnSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [excludeCategories, setExcludeCategories] = useState<string[]>([]);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const [currency, setCurrency] = useState(() => loadFromStorage('finance_currency', { code: 'INR', symbol: '₹' }));
  
  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showGoalDeposit, setShowGoalDeposit] = useState<{ id: string, name: string } | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  
  const [showDebtorModal, setShowDebtorModal] = useState(false);
  const [showDebtRecordModal, setShowDebtRecordModal] = useState<{ debtorId: string, name: string } | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);

  // Balance Adjustment
  const [adjustAccount, setAdjustAccount] = useState<{name: string, type: string, current: number} | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  // Form States - Debts
  const [debtorName, setDebtorName] = useState('');
  const [debtType, setDebtType] = useState<'Borrow' | 'Lend'>('Lend');
  const [debtAmountVal, setDebtAmountVal] = useState('');
  const [debtDesc, setDebtDesc] = useState('');

  // Form States - Goal
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalIcon, setGoalIcon] = useState(GOAL_ICONS[0]);
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
  const [goalDeadline, setGoalDeadline] = useState('');

  // Form States - Subscriptions
  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState('');
  const [subPeriod, setSubPeriod] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [subStartDate, setSubStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Form States - Investments
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invType, setInvType] = useState<'Stock' | 'Crypto' | 'Mutual Fund' | 'Gold' | 'Real Estate' | 'Other'>('Stock');

  // Form States - Transaction
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

  const filteredTransactions = useMemo(() => {
      return allTransactionsSorted.filter(t => {
          if (txnFilterType !== 'all' && t.type !== txnFilterType) return false;
          if (txnSearch && !t.merchant.toLowerCase().includes(txnSearch.toLowerCase()) && !t.category.toLowerCase().includes(txnSearch.toLowerCase())) return false;
          if (excludeCategories.includes(t.category)) return false;
          return true;
      });
  }, [allTransactionsSorted, txnFilterType, txnSearch, excludeCategories]);

  const monthTransactions = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return filteredTransactions.filter(t => t.date && isWithinInterval(parseISO(t.date), { start, end }));
  }, [filteredTransactions, currentMonth]);

  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      monthTransactions.forEach(t => {
          if (t.exclude_from_budget) return; 
          if (!groups[t.date]) groups[t.date] = [];
          groups[t.date].push(t);
      });
      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthTransactions]);

  const stats = useMemo(() => {
      let income = 0;
      let expense = 0;
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const periodTxns = allTransactionsSorted.filter(t => t.date && isWithinInterval(parseISO(t.date), { start, end }));

      periodTxns.forEach(t => {
          if (t.exclude_from_budget) return;
          if (excludeCategories.includes(t.category)) return;

          if (t.type === 'credit') income += t.amount;
          else expense += t.amount;
      });
      
      return { income, expense, balance: income - expense };
  }, [allTransactionsSorted, currentMonth, excludeCategories]);

  const categoryAnalysis = useMemo(() => {
      const data: Record<string, number> = {};
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      allTransactionsSorted.forEach(t => {
          if (t.type === 'debit' && !t.exclude_from_budget && isWithinInterval(parseISO(t.date), { start, end })) {
              data[t.category] = (data[t.category] || 0) + t.amount;
          }
      });
      
      return Object.entries(data)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
  }, [allTransactionsSorted, currentMonth]);

  const accountBalances = useMemo(() => {
      const acc = { cash: 0, bank: 0, credit: 0 };
      allTransactionsSorted.forEach(t => {
          const val = t.type === 'credit' ? t.amount : -t.amount;
          if (t.payment_method === 'Cash') acc.cash += val;
          else if (t.payment_method === 'Credit Card') acc.credit += val; 
          else acc.bank += val; 
      });
      return acc;
  }, [allTransactionsSorted]);

  const totalBalance = accountBalances.cash + accountBalances.bank + accountBalances.credit;

  const chartData = useMemo(() => {
      const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
      return days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTxns = monthTransactions.filter(t => t.date === dateStr);
          const income = dayTxns.filter(t => t.type === 'credit' && !t.exclude_from_budget).reduce((sum, t) => sum + t.amount, 0);
          const expense = dayTxns.filter(t => t.type === 'debit' && !t.exclude_from_budget).reduce((sum, t) => sum + t.amount, 0);
          return { name: format(day, 'd'), income, expense };
      });
  }, [monthTransactions, currentMonth]);

  // Actions
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
          exclude_from_budget: true, 
          isShared: false,
          paidBy: user?.uid
      };
      
      onAddTransaction(adjustmentTx);
      setAdjustAccount(null);
      setAdjustAmount('');
  };

  // --- Handlers for Goals, Debts, etc ---

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

  const handleAddDebtor = () => {
      if (!debtorName.trim()) return;
      if (onAddDebtor) onAddDebtor({
          id: Date.now().toString(),
          name: debtorName,
          type: 'Person',
          createdAt: new Date(),
          updatedAt: new Date()
      });
      setDebtorName('');
      setShowDebtorModal(false);
  };

  const handleAddDebtRecord = () => {
      if (!showDebtRecordModal || !debtAmountVal || !onAddDebt) return;
      const amt = parseFloat(debtAmountVal);
      if (isNaN(amt)) return;

      onAddDebt({
          id: Date.now().toString(),
          debtorId: showDebtRecordModal.debtorId,
          amount: amt,
          type: debtType,
          description: debtDesc || 'Loan',
          date: format(new Date(), 'yyyy-MM-dd'),
          createdAt: new Date(),
          updatedAt: new Date()
      });

      onAddTransaction({
          id: Date.now().toString(),
          is_transaction: true,
          amount: amt,
          type: debtType === 'Lend' ? 'debit' : 'credit',
          merchant: showDebtRecordModal.name,
          category: 'Debt',
          date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: 'Cash',
          notes: debtDesc,
          raw_sms: '',
          createdAt: new Date(),
          updatedAt: new Date()
      });

      setDebtAmountVal('');
      setDebtDesc('');
      setShowDebtRecordModal(null);
  };

  const handleAddSubscription = () => {
      if (!subName || !subPrice || !onAddSubscription) return;
      onAddSubscription({
          id: editingSubscription ? editingSubscription.id : Date.now().toString(),
          name: subName,
          price: parseFloat(subPrice),
          period: subPeriod,
          startDate: subStartDate,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
      });
      setShowSubModal(false);
      setSubName('');
      setSubPrice('');
      setEditingSubscription(null);
  };

  const handleAddInvestment = () => {
      if (!invName || !invAmount || !onAddInvestment) return;
      onAddInvestment({
          id: editingInvestment ? editingInvestment.id : Date.now().toString(),
          name: invName,
          units: 1, 
          avgPrice: parseFloat(invAmount),
          type: invType,
          date: format(new Date(), 'yyyy-MM-dd'),
          createdAt: new Date(),
          updatedAt: new Date()
      });
      
      onAddTransaction({
          id: Date.now().toString(),
          is_transaction: true,
          amount: parseFloat(invAmount),
          type: 'debit',
          merchant: invName,
          category: 'Investment',
          date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: 'Bank Transfer',
          raw_sms: '',
          createdAt: new Date(),
          updatedAt: new Date()
      });

      setShowInvModal(false);
      setInvName('');
      setInvAmount('');
      setEditingInvestment(null);
  };

  // --- Renderers ---

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

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><PieIcon size={18}/> Spend Analysis</h3>
              <div className="h-60 w-full relative">
                  {categoryAnalysis.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={categoryAnalysis}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {categoryAnalysis.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">No expenses yet</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                          <div className="text-xs text-slate-400 uppercase font-bold">Total</div>
                          <div className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(stats.expense)}</div>
                      </div>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                  {categoryAnalysis.slice(0, 4).map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{cat.name}</span>
                          <span className="font-bold text-slate-800 dark:text-white">{Math.round((cat.value / stats.expense) * 100)}%</span>
                      </div>
                  ))}
              </div>
          </div>

          <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 px-1">Accounts</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  <AccountCard name="Cash" type="Cash" amount={accountBalances.cash} currency={currency.symbol} onEdit={() => setAdjustAccount({ name: 'Cash', type: 'Cash', current: accountBalances.cash })} />
                  <AccountCard name="Bank" type="Bank" amount={accountBalances.bank} currency={currency.symbol} onEdit={() => setAdjustAccount({ name: 'Bank', type: 'Bank', current: accountBalances.bank })} />
                  <AccountCard name="Cards" type="Credit Card" amount={accountBalances.credit} currency={currency.symbol} onEdit={() => setAdjustAccount({ name: 'Credit Card', type: 'Credit Card', current: accountBalances.credit })} />
              </div>
          </div>
      </div>
  );

  const renderTransactions = () => (
      <div className="p-4 space-y-4 pb-24 h-full flex flex-col">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'}`}>
                  <Filter size={18} />
              </button>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  {(['all', 'credit', 'debit'] as const).map(t => (
                      <button key={t} onClick={() => setTxnFilterType(t)} className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${txnFilterType === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>{t}</button>
                  ))}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center px-3 gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-full h-8 text-slate-700 dark:text-slate-200" />
              </div>
          </div>

          {showFilters && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Exclude Categories</h4>
                  <div className="flex flex-wrap gap-2">
                      {['Savings', 'Debt', 'Subscription', 'Investment', 'Transfer'].map(cat => {
                          const isActive = excludeCategories.includes(cat);
                          return (
                              <button 
                                key={cat}
                                onClick={() => isActive ? setExcludeCategories(excludeCategories.filter(c => c !== cat)) : setExcludeCategories([...excludeCategories, cat])}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isActive ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                              >
                                  {isActive ? 'Hide' : 'Show'} {cat}
                              </button>
                          )
                      })}
                  </div>
              </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
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
              {groupedTransactions.length === 0 && (
                  <div className="text-center py-20 text-slate-400">
                      <Search size={48} className="mx-auto mb-4 opacity-20"/>
                      <p>No transactions found.</p>
                  </div>
              )}
          </div>
      </div>
  );

  const renderAssets = () => {
      const totalLent = debts.filter(d => d.type === 'Lend').reduce((sum, d) => sum + d.amount, 0);
      const totalBorrowed = debts.filter(d => d.type === 'Borrow').reduce((sum, d) => sum + d.amount, 0);
      const net = totalLent - totalBorrowed;

      return (
          <div className="p-4 space-y-6 pb-24">
              {/* Savings Goals Section */}
              <div>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Savings Goals</h3>
                      <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors">
                          <Plus size={20}/>
                      </button>
                  </div>
                  <div className="space-y-4">
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
                                      <div className="flex gap-1">
                                          <button onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }} className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200">
                                              <Edit2 size={18} />
                                          </button>
                                          <button onClick={() => onDeleteGoal && onDeleteGoal(goal.id)} className="p-2 text-slate-300 hover:text-red-500">
                                              <Trash2 size={18} />
                                          </button>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-end justify-between mb-2">
                                      <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                                      <span className="text-sm font-bold text-slate-400 mb-1">{progress}%</span>
                                  </div>

                                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                                  </div>

                                  <button onClick={() => setShowGoalDeposit({ id: goal.id, name: goal.name })} className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                      <Plus size={16} /> Add Money
                                  </button>
                              </div>
                          );
                      })}
                      {goals.length === 0 && <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">Create a goal to save!</div>}
                  </div>
              </div>

              {/* Debts Section */}
              <div className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Debt Net Position</div>
                  <div className={`text-3xl font-black mb-6 ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{net >= 0 ? '+' : ''}{formatCurrency(net)}</div>
                  <div className="flex gap-4">
                      <div className="flex-1 bg-white/10 rounded-xl p-3">
                          <div className="text-[10px] text-slate-300 font-bold uppercase mb-1 flex items-center gap-1"><ArrowUpCircle size={12}/> I Owe</div>
                          <div className="font-bold text-red-300">{formatCurrency(totalBorrowed)}</div>
                      </div>
                      <div className="flex-1 bg-white/10 rounded-xl p-3">
                          <div className="text-[10px] text-slate-300 font-bold uppercase mb-1 flex items-center gap-1"><ArrowDownCircle size={12}/> Owed to Me</div>
                          <div className="font-bold text-emerald-300">{formatCurrency(totalLent)}</div>
                      </div>
                  </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-white">Debtors</h3>
                      <button onClick={() => setShowDebtorModal(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"><Plus size={18}/></button>
                  </div>
                  <div className="space-y-3">
                      {debtors.map(debtor => {
                          const debtorDebts = debts.filter(d => d.debtorId === debtor.id);
                          const balance = debtorDebts.reduce((sum, d) => sum + (d.type === 'Lend' ? d.amount : -d.amount), 0);
                          return (
                              <div key={debtor.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                          {debtor.name[0]}
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-900 dark:text-white">{debtor.name}</div>
                                          <div className="text-xs text-slate-500">{debtorDebts.length} records</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-right">
                                          <div className={`font-bold ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                              {balance > 0 ? 'Owes you' : balance < 0 ? 'You owe' : 'Settled'}
                                          </div>
                                          <div className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(Math.abs(balance))}</div>
                                      </div>
                                      <div className="flex gap-1">
                                          <button onClick={() => setShowDebtRecordModal({ debtorId: debtor.id, name: debtor.name })} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                              <Plus size={18}/>
                                          </button>
                                          <button onClick={() => onDeleteDebtor && onDeleteDebtor(debtor.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                              <Trash2 size={18}/>
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                      {debtors.length === 0 && <div className="text-center py-10 text-slate-400">Add people to track debts with.</div>}
                  </div>
              </div>
          </div>
      );
  };

  const renderSubscriptions = () => {
      const monthlyTotal = subscriptions.reduce((acc, s) => acc + (s.period === 'Monthly' ? s.price : s.price / 12), 0);
      return (
          <div className="p-4 space-y-6 pb-24">
              <div className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg flex justify-between items-center">
                  <div>
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Monthly Cost</div>
                      <div className="text-3xl font-black">{formatCurrency(monthlyTotal)}</div>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <RotateCw size={24} className="text-slate-300"/>
                  </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-white">Active Subscriptions</h3>
                      <button onClick={() => setShowSubModal(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"><Plus size={20}/></button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                      {subscriptions.map(sub => (
                          <div key={sub.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold text-xl">
                                      {sub.name[0]}
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-900 dark:text-white">{sub.name}</div>
                                      <div className="text-xs text-slate-500">{sub.period} • {formatCurrency(sub.price)}</div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-1 rounded-lg">
                                      {format(new Date(sub.startDate), 'MMM d')}
                                  </div>
                                  <button onClick={() => onDeleteSubscription && onDeleteSubscription(sub.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 size={18}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const renderInvestments = () => {
      const totalInv = investments.reduce((acc, i) => acc + (i.units * i.avgPrice), 0); // Simplified value
      return (
          <div className="p-4 space-y-6 pb-24">
              <div className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Portfolio Value</div>
                  <div className="text-3xl font-black">{formatCurrency(totalInv)}</div>
                  <div className="flex gap-2 mt-4">
                      <span className="text-xs bg-white/10 px-2 py-1 rounded text-slate-300">Stocks</span>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded text-slate-300">Crypto</span>
                  </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-white">Assets</h3>
                      <button onClick={() => setShowInvModal(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"><Plus size={20}/></button>
                  </div>
                  <div className="space-y-3">
                      {investments.map(inv => (
                          <div key={inv.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{inv.name}</div>
                                  <div className="text-xs text-slate-500">{inv.type} • {inv.units} units</div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right">
                                      <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(inv.units * inv.avgPrice)}</div>
                                      <div className="text-[10px] text-emerald-500 font-bold">+0.0%</div>
                                  </div>
                                  <button onClick={() => onDeleteInvestment && onDeleteInvestment(inv.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 size={18}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

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
                {(['overview', 'transactions', 'assets', 'subscriptions', 'investments'] as const).map(tab => (
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
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'assets' && renderAssets()}
            {activeTab === 'subscriptions' && renderSubscriptions()}
            {activeTab === 'investments' && renderInvestments()}
        </div>

        {/* --- MODALS --- */}

        {/* Transaction Input Modal */}
        {showInput && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in" onClick={() => setShowInput(false)}>
                <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
                        <button onClick={() => setShowInput(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20}/></button>
                    </div>

                    <div className="space-y-5">
                        {/* Type Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                            <button onClick={() => setType('debit')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'debit' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500'}`}>Expense</button>
                            <button onClick={() => setType('credit')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'credit' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>Income</button>
                        </div>

                        {/* Amount & Merchant */}
                        <div className="space-y-3">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{currency.symbol}</span>
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    placeholder="0.00" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-2xl outline-none text-2xl font-black text-slate-900 dark:text-white placeholder-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    autoFocus 
                                />
                            </div>
                            
                            <div className="relative">
                                <input 
                                    value={merchant} 
                                    onChange={(e) => setMerchant(e.target.value)} 
                                    placeholder="Merchant / Title" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                />
                                {merchantSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden">
                                        {merchantSuggestions.map((m, i) => (
                                            <div key={i} onClick={() => { setMerchant(m); setMerchantSuggestions([]); }} className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0">{m}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Grid */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Category</label>
                            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {DEFAULT_CATEGORIES.map(cat => {
                                    const IconComp = ICON_MAP[cat.icon] || CircleDot;
                                    const isSelected = category === cat.name;
                                    return (
                                        <button 
                                            key={cat.name} 
                                            onClick={() => setCategory(cat.name)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl gap-1 transition-all ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500 ring-inset' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        >
                                            <IconComp size={20} />
                                            <span className="text-[9px] font-bold truncate w-full">{cat.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Details Row */}
                        <div className="flex gap-3">
                            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none font-bold text-sm text-slate-700 dark:text-slate-200" />
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none font-bold text-sm text-slate-700 dark:text-slate-200 appearance-none">
                                <option>Cash</option>
                                <option>Card</option>
                                <option>Bank</option>
                                <option>UPI</option>
                            </select>
                        </div>

                        {/* Joint Toggle */}
                        {workspaceMode === 'joint' && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer" onClick={() => setIsSharedTransaction(!isSharedTransaction)}>
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSharedTransaction ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-400'}`}>
                                    {isSharedTransaction && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Shared Expense</span>
                            </div>
                        )}

                        <button onClick={handleManualSubmit} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-lg">
                            {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                        </button>
                        
                        {editingTransaction && (
                            <button onClick={() => { onDeleteTransaction(editingTransaction.id); setShowInput(false); }} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                                Delete Transaction
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Debtor Modal */}
        {showDebtorModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowDebtorModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Person</h3>
                    <input autoFocus value={debtorName} onChange={(e) => setDebtorName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-4" placeholder="Name" />
                    <button onClick={handleAddDebtor} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
                </div>
            </div>
        )}

        {/* Debt Record Modal */}
        {showDebtRecordModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowDebtRecordModal(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">New Record</h3>
                    <p className="text-sm text-slate-500 mb-4">With {showDebtRecordModal.name}</p>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                        <button onClick={() => setDebtType('Lend')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${debtType === 'Lend' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>I Gave</button>
                        <button onClick={() => setDebtType('Borrow')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${debtType === 'Borrow' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>I Took</button>
                    </div>
                    <input type="number" value={debtAmountVal} onChange={(e) => setDebtAmountVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-2 text-2xl font-bold" placeholder="0" />
                    <input value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-4 text-sm" placeholder="Description (Optional)" />
                    <button onClick={handleAddDebtRecord} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Save Record</button>
                </div>
            </div>
        )}

        {/* Goal Modal */}
        {showGoalModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowGoalModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Savings Goal</h3>
                    <input value={goalName} onChange={(e) => setGoalName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-2" placeholder="Goal Name" />
                    <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-2" placeholder="Target Amount" />
                    <input type="number" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-4" placeholder="Current Amount" />
                    
                    <div className="grid grid-cols-6 gap-2 mb-4">
                        {GOAL_COLORS.map(c => (
                            <button key={c} onClick={() => setGoalColor(c)} className={`w-8 h-8 rounded-full ${goalColor === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>

                    <button onClick={handleSaveGoal} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Save Goal</button>
                </div>
            </div>
        )}

        {/* Goal Deposit Modal */}
        {showGoalDeposit && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowGoalDeposit(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Money</h3>
                    <p className="text-sm text-slate-500 mb-4">To {showGoalDeposit.name}</p>
                    <input type="number" autoFocus value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-4 text-2xl font-bold" placeholder="0" />
                    <button onClick={handleDeposit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Deposit</button>
                </div>
            </div>
        )}

        {/* Subscription Modal */}
        {showSubModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowSubModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Subscription</h3>
                    <input value={subName} onChange={(e) => setSubName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-2" placeholder="Name (e.g. Netflix)" />
                    <input type="number" value={subPrice} onChange={(e) => setSubPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-2" placeholder="Price" />
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setSubPeriod('Monthly')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${subPeriod === 'Monthly' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200'}`}>Monthly</button>
                        <button onClick={() => setSubPeriod('Yearly')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${subPeriod === 'Yearly' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200'}`}>Yearly</button>
                    </div>
                    <button onClick={handleAddSubscription} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
                </div>
            </div>
        )}

        {/* Investment Modal */}
        {showInvModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowInvModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Asset</h3>
                    <input value={invName} onChange={(e) => setInvName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-2" placeholder="Asset Name" />
                    <input type="number" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none mb-4" placeholder="Total Value Invested" />
                    <button onClick={handleAddInvestment} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Add to Portfolio</button>
                </div>
            </div>
        )}

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
