
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
  Heart, Users2, Split, BarChart2, Eye, Activity
} from 'lucide-react';
import { 
  format, isWithinInterval, isToday, eachDayOfInterval, 
  getDay, addMonths, isSameDay, addDays, isThisMonth, addYears, isBefore, differenceInDays, isYesterday,
  subMonths, startOfMonth, endOfMonth, parseISO
} from 'date-fns';
import { getFinancialInsights } from '../services/aiService';
import { loadFromStorage, saveToStorage } from '../services/storageService';
import { readRecentSms, parseBankingSms } from '../services/smsService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
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
  user?: any; // Current logged in user
  partnerTransactions?: Transaction[]; // Optional: passed from parent if available
}

const ICON_MAP: Record<string, any> = {
  'utensils-crossed': UtensilsCrossed,
  'bus': Bus,
  'gamepad-2': Gamepad2,
  'bandaid': Bandage,
  'shopping-bag': ShoppingBag,
  'plane': Plane,
  'wifi': Wifi,
  'notebook': Notebook,
  'gift': Gift,
  'circle-dot': CircleDot,
  'credit-card': CreditCard,
  'user': User,
  'banknote': Banknote,
  'landmark': Landmark,
  'circle-dollar-sign': CircleDollarSign,
  'target': Target,
  'piggy-bank': PiggyBank,
  'briefcase': Briefcase,
  'car': Car,
  'home': Home,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'shopping-cart': ShoppingCart,
  'coffee': Coffee
};

const GOAL_ICONS = ['target', 'piggy-bank', 'plane', 'car', 'home', 'briefcase', 'gift'];
const GOAL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Expanded Categories with Grouping Logic
const GROUPED_CATEGORIES = {
    'Food & Drink': [
        { name: 'Food', icon: 'utensils-crossed' },
        { name: 'Dining Out', icon: 'utensils-crossed' },
        { name: 'Coffee', icon: 'coffee' },
        { name: 'Groceries', icon: 'shopping-cart' },
    ],
    'Shopping': [
        { name: 'Shopping', icon: 'shopping-bag' },
        { name: 'Clothing', icon: 'shopping-bag' },
        { name: 'Electronics', icon: 'monitor' },
    ],
    'Transport': [
        { name: 'Transportation', icon: 'bus' },
        { name: 'Fuel', icon: 'car' },
        { name: 'Taxi', icon: 'car' },
    ],
    'Bills & Utilities': [
        { name: 'Utilities', icon: 'wifi' },
        { name: 'Phone', icon: 'smartphone' },
        { name: 'Internet', icon: 'wifi' },
        { name: 'Rent', icon: 'home' },
    ],
    'Life': [
        { name: 'Entertainment', icon: 'gamepad-2' },
        { name: 'Healthcare', icon: 'bandaid' },
        { name: 'Education', icon: 'notebook' },
        { name: 'Travel', icon: 'plane' },
        { name: 'Gifts', icon: 'gift' },
    ],
    'Other': [
        { name: 'Other', icon: 'circle-dot' }
    ]
};

const normalizeCategory = (catName: string) => {
    // Normalize old categories to new ones if needed, or just return
    if (catName === 'Transport') return 'Transportation';
    if (catName === 'Health') return 'Healthcare';
    if (catName === 'Bills') return 'Utilities';
    return catName;
};

const getNextRenewal = (start: string | Date, period: 'Monthly' | 'Yearly') => {
    const now = new Date();
    let next = new Date(start);
    // Safety break
    let loops = 0;
    while (next < now && loops < 1000) {
        if (period === 'Monthly') next = addMonths(next, 1);
        else next = addYears(next, 1);
        loops++;
    }
    return next;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budget' | 'debts' | 'goals' | 'subscriptions' | 'investments'>('overview');
  const [showInput, setShowInput] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
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
      if (editingDebt) {
          setDebtAmount(editingDebt.amount.toString());
          setDebtDesc(editingDebt.description);
          setDebtActionType(editingDebt.type);
          setShowDebtModal(true);
      }
  }, [editingDebt]);

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

  useEffect(() => {
      if (editingSubscription) {
          setSubName(editingSubscription.name);
          setSubPrice(editingSubscription.price.toString());
          setSubPeriod(editingSubscription.period);
          setSubDate(editingSubscription.startDate);
          setSubUrl(editingSubscription.url || '');
          setShowSubModal(true);
      }
  }, [editingSubscription]);

  useEffect(() => {
      if (editingInvestment) {
          setInvName(editingInvestment.name);
          setInvUnits(editingInvestment.units.toString());
          setInvPrice(editingInvestment.avgPrice.toString());
          setInvDate(editingInvestment.date);
          setInvType(editingInvestment.type);
          setShowInvModal(true);
      }
  }, [editingInvestment]);

  const resetForm = () => {
      setAmount(''); setMerchant(''); setNotes('');
      setEntryDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentMethod('Cash');
      setIsSharedTransaction(workspaceMode === 'joint');
      setEditingTransaction(null);
  };

  const resetDebtForm = () => {
      setDebtAmount(''); setDebtDesc(''); setEditingDebt(null);
  };

  const resetGoalForm = () => {
      setGoalName(''); setGoalTarget(''); setGoalCurrent('0');
      setGoalIcon(GOAL_ICONS[0]); setGoalColor(GOAL_COLORS[0]); setGoalDeadline('');
      setEditingGoal(null);
  };

  const resetSubForm = () => {
      setSubName(''); setSubPrice(''); setSubPeriod('Monthly'); setSubDate(''); setSubUrl('');
      setEditingSubscription(null);
  };

  const resetInvForm = () => {
      setInvName(''); setInvUnits(''); setInvPrice(''); setInvDate(''); setInvType('Stock');
      setEditingInvestment(null);
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

  const monthTransactions = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return allTransactionsSorted.filter(t => t.date && isWithinInterval(parseISO(t.date), { start, end }));
  }, [allTransactionsSorted, currentMonth]);

  const filteredTransactions = useMemo(() => {
      let filtered = monthTransactions;
      if (transactionFilter !== 'all') {
          filtered = filtered.filter(t => t.type === transactionFilter);
      }
      if (categoryFilter !== 'All') {
          filtered = filtered.filter(t => t.category === categoryFilter);
      }
      return filtered;
  }, [monthTransactions, transactionFilter, categoryFilter]);

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      filteredTransactions.forEach(t => {
          if (!groups[t.date]) groups[t.date] = [];
          groups[t.date].push(t);
      });
      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const recentTransactions = useMemo(() => {
      return allTransactionsSorted.slice(0, 5);
  }, [allTransactionsSorted]);

  const stats = useMemo(() => {
      let income = 0;
      let expense = 0;
      monthTransactions.forEach(t => {
          if (t.exclude_from_budget) return;
          
          if (t.type === 'credit') income += t.amount;
          else expense += t.amount;
      });
      const subCost = subscriptions.filter(s => s.isActive).reduce((acc, s) => {
          if (s.period === 'Monthly') return acc + s.price;
          return acc + (s.price / 12);
      }, 0);
      
      return { income, expense: expense + subCost, balance: income - (expense + subCost) };
  }, [monthTransactions, subscriptions]);

  // SMS Sync Handler
  const handleSyncSms = async (silent = false) => {
      if (!Capacitor.isNativePlatform()) {
          if (!silent) alert("SMS Sync is only available on Android devices.");
          return;
      }
      setIsSyncingSms(true);
      try {
          const messages = await readRecentSms(500);
          let newTxns: Transaction[] = [];
          if (messages && messages.length > 0) {
              messages.forEach(msg => {
                  const parsed = parseBankingSms(msg);
                  if (parsed) {
                      const exists = transactions.some(t => 
                          (t.raw_sms && t.raw_sms === parsed.raw_sms) ||
                          (t.amount === parsed.amount && t.date === parsed.date && t.merchant === parsed.merchant)
                      );
                      if (!exists) {
                          newTxns.push({ 
                              ...parsed, 
                              id: `sms-${msg.id}-${Date.now()}-${Math.random()}`, 
                              createdAt: new Date(),
                              isShared: false,
                              paidBy: user?.uid 
                          } as Transaction);
                      }
                  }
              });
              
              if (newTxns.length > 0) {
                  if (onAddTransactions) onAddTransactions(newTxns);
                  else newTxns.forEach(t => onAddTransaction(t));
                  alert(`Success! Synced ${newTxns.length} new transactions.`);
              } else if (!silent) {
                  alert(`No new transactions found.`);
              }
          } else if (!silent) {
              alert("No recent SMS messages found.");
          }
      } catch (e: any) { 
          console.error("SMS Sync Error:", e); 
          if(!silent) alert("Sync failed: " + (e.message || "Unknown error")); 
      }
      finally { setIsSyncingSms(false); }
  };

  const handleManualSubmit = () => {
      if (!amount || !merchant) return;
      const txData: Transaction = {
          id: editingTransaction ? editingTransaction.id : Date.now().toString(),
          is_transaction: true,
          amount: parseFloat(amount),
          merchant,
          type,
          category,
          date: entryDate,
          payment_method: paymentMethod,
          notes,
          raw_sms: editingTransaction?.raw_sms || '',
          createdAt: editingTransaction?.createdAt || new Date(),
          isShared: isSharedTransaction,
          paidBy: editingTransaction?.paidBy || user?.uid
      };
      if (editingTransaction && onUpdateTransaction) onUpdateTransaction(txData);
      else onAddTransaction(txData);
      setShowInput(false); resetForm();
  };

  const handleExport = () => {
      const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Payment Method', 'Notes', 'Shared'];
      const csvContent = [
          headers.join(','),
          ...activeTransactions.map(t => [
              t.date,
              `"${t.merchant.replace(/"/g, '""')}"`, // Escape quotes
              `"${t.category}"`,
              t.amount,
              t.type,
              t.payment_method,
              `"${(t.notes || '').replace(/"/g, '""')}"`,
              t.isShared ? 'Yes' : 'No'
          ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
  };

  const handleAddDebtor = () => {
      if (!debtorName || !onAddDebtor) return;
      const accountType = DEFAULT_ACCOUNTS.find(a => a.name === debtorType);
      onAddDebtor({
          id: Date.now().toString(),
          name: debtorName,
          type: debtorType,
          icon: accountType?.icon,
          color: accountType?.color,
          createdAt: new Date()
      });
      setShowDebtorModal(false); setDebtorName('');
  };

  const handleSaveDebt = () => {
      if (!selectedDebtorId || !debtAmount || !onAddDebt || !onUpdateDebt) return;
      const amountVal = parseFloat(debtAmount);
      if (isNaN(amountVal)) return;
      const debtData: Debt = {
          id: editingDebt ? editingDebt.id : Date.now().toString(),
          debtorId: selectedDebtorId,
          amount: amountVal,
          description: debtDesc,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: debtActionType,
          createdAt: editingDebt ? editingDebt.createdAt : new Date(),
          updatedAt: new Date()
      };
      if (editingDebt) onUpdateDebt(debtData); else onAddDebt(debtData);
      setShowDebtModal(false); resetDebtForm();
  };

  const handleSaveGoal = () => {
      if (!goalName || !goalTarget || !onAddGoal || !onUpdateGoal) return;
      const goalData: SavingsGoal = {
          id: editingGoal ? editingGoal.id : Date.now().toString(),
          name: goalName,
          targetAmount: parseFloat(goalTarget),
          currentAmount: parseFloat(goalCurrent) || 0,
          color: goalColor,
          icon: goalIcon,
          deadline: goalDeadline,
          createdAt: editingGoal ? editingGoal.createdAt : new Date(),
          updatedAt: new Date()
      };
      if (editingGoal) onUpdateGoal(goalData); else onAddGoal(goalData);
      setShowGoalModal(false); resetGoalForm();
  };

  const handleSaveSub = () => {
      if (!subName || !subPrice || !onAddSubscription || !onUpdateSubscription) return;
      const subData: Subscription = {
          id: editingSubscription ? editingSubscription.id : Date.now().toString(),
          name: subName,
          price: parseFloat(subPrice),
          period: subPeriod,
          startDate: subDate,
          url: subUrl,
          isActive: editingSubscription ? editingSubscription.isActive : true,
          createdAt: editingSubscription ? editingSubscription.createdAt : new Date(),
          updatedAt: new Date()
      };
      if (editingSubscription) onUpdateSubscription(subData); else onAddSubscription(subData);
      setShowSubModal(false); resetSubForm();
  };

  const handleSaveInv = () => {
      if (!invName || !invUnits || !onAddInvestment || !onUpdateInvestment) return;
      const invData: Investment = {
          id: editingInvestment ? editingInvestment.id : Date.now().toString(),
          name: invName,
          units: parseFloat(invUnits),
          avgPrice: parseFloat(invPrice),
          date: invDate,
          type: invType,
          createdAt: editingInvestment ? editingInvestment.createdAt : new Date(),
          updatedAt: new Date()
      };
      if (editingInvestment) onUpdateInvestment(invData); else onAddInvestment(invData);
      setShowInvModal(false); resetInvForm();
  };

  const renderOverview = () => (
      <div className="space-y-6 animate-in fade-in pb-20">
          
          {/* Workspace Toggle */}
          <div className="flex justify-center mb-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex relative">
                  <button 
                      onClick={() => setWorkspaceMode('personal')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 ${workspaceMode === 'personal' ? 'text-white' : 'text-slate-500'}`}
                  >
                      Personal
                  </button>
                  <button 
                      onClick={() => setWorkspaceMode('joint')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 flex items-center gap-1 ${workspaceMode === 'joint' ? 'text-white' : 'text-slate-500'}`}
                  >
                      <Heart size={10} fill="currentColor" />
                      Joint
                  </button>
                  <div className={`absolute top-1 bottom-1 w-[50%] bg-blue-600 rounded-full transition-transform duration-300 ${workspaceMode === 'joint' ? 'translate-x-full' : 'translate-x-0'}`} />
              </div>
          </div>

          {/* Cards Row */}
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
              <div className="min-w-[280px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-3xl snap-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                      <div className="text-blue-100 text-xs font-bold mb-1 uppercase tracking-wider">Total Balance</div>
                      <div className="text-3xl font-black mb-6">{formatCurrency(stats.balance)}</div>
                      <div className="flex gap-8">
                          <div>
                              <div className="flex items-center gap-1 text-blue-200 text-xs mb-1"><ArrowDownCircle size={14}/> Income</div>
                              <div className="font-bold text-lg">{formatCurrency(stats.income)}</div>
                          </div>
                          <div>
                              <div className="flex items-center gap-1 text-blue-200 text-xs mb-1"><ArrowUpCircle size={14}/> Expense</div>
                              <div className="font-bold text-lg">{formatCurrency(stats.expense)}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="pt-safe bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 z-20">
            <div className="h-16 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    {onMenuClick && (
                        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <Menu size={20}/>
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Finance</h1>
                </div>
                <div className="flex items-center gap-2">
                    {Capacitor.isNativePlatform() && (
                        <button 
                            onClick={() => handleSyncSms()} 
                            disabled={isSyncingSms}
                            className={`p-2 rounded-full transition-colors ${isSyncingSms ? 'bg-blue-50 text-blue-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <RefreshCw size={20} className={isSyncingSms ? "animate-spin" : ""} />
                        </button>
                    )}
                    <button onClick={() => setShowInput(true)} className="p-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="px-4 pb-2 overflow-x-auto no-scrollbar flex gap-4">
                {(['overview', 'transactions', 'budget', 'debts', 'goals', 'subscriptions', 'investments'] as const).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`pb-2 text-sm font-bold capitalize transition-colors whitespace-nowrap border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600 dark:text-blue-400' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'transactions' && (
                <div className="p-4 space-y-4">
                    {groupedTransactions.map(([date, txns]) => (
                        <div key={date}>
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 sticky top-0 bg-slate-50 dark:bg-slate-950 py-1">{format(parseISO(date), 'EEE, MMM d')}</h3>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                {txns.map((t, i) => (
                                    <div key={t.id} onClick={() => setEditingTransaction(t)} className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${i !== txns.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                {/* Category Icon */}
                                                {(() => {
                                                    const cat = normalizeCategory(t.category);
                                                    const iconKey = DEFAULT_CATEGORIES.find(c => c.name === cat)?.icon || 'circle-dot';
                                                    const IconComp = ICON_MAP[iconKey] || CircleDot;
                                                    return <IconComp size={18} />;
                                                })()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white text-sm">{t.merchant}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    {t.category} 
                                                    {t.isShared && <Users size={10} className="text-purple-500"/>}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${t.type === 'credit' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                            {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Implement other tabs similarly if needed */}
        </div>

        {/* Add Transaction Modal */}
        {showInput && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in" onClick={() => setShowInput(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
                    
                    {/* Amount Input */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                        <div className="flex items-center gap-2 border-b-2 border-blue-500 py-2">
                            <span className="text-2xl font-bold text-blue-500">{currency.symbol}</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full text-3xl font-black bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-300"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Type Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                        <button onClick={() => setType('debit')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'debit' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}>Expense</button>
                        <button onClick={() => setType('credit')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'credit' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}>Income</button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Merchant</label>
                            <input 
                                value={merchant} 
                                onChange={(e) => setMerchant(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-1 text-sm font-medium outline-none"
                                placeholder="Where did you spend?"
                            />
                            {/* Suggestions */}
                            {merchantSuggestions.length > 0 && (
                                <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                                    {merchantSuggestions.map(s => (
                                        <button key={s} onClick={() => setMerchant(s)} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 whitespace-nowrap">{s}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-1 text-sm font-medium outline-none appearance-none"
                                >
                                    {Object.entries(GROUPED_CATEGORIES).map(([group, cats]) => (
                                        <optgroup key={group} label={group}>
                                            {cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                <input 
                                    type="date"
                                    value={entryDate} 
                                    onChange={(e) => setEntryDate(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-1 text-sm font-medium outline-none"
                                />
                            </div>
                        </div>

                        {workspaceMode === 'joint' && (
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSharedTransaction(!isSharedTransaction)}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSharedTransaction ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}>
                                    {isSharedTransaction && <Check size={14} className="text-white"/>}
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Share with Partner</span>
                            </div>
                        )}
                    </div>

                    <button onClick={handleManualSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                    </button>
                    {editingTransaction && (
                        <button onClick={() => { onDeleteTransaction(editingTransaction.id); setShowInput(false); }} className="w-full text-red-500 font-bold py-3 mt-2 text-sm">Delete</button>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default FinanceView;
