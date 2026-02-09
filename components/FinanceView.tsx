
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
  Heart, Users2, Split, BarChart2, Eye, Activity, Percent, ChevronDown
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
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'debts' | 'goals' | 'subscriptions' | 'investments'>('overview');
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
      <div className="space-y-6 animate-in fade-in pb-20 p-4">
          
          {/* Workspace Toggle */}
          <div className="flex justify-center mb-2">
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-full flex relative shadow-inner">
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
                  <div className={`absolute top-1 bottom-1 w-[50%] bg-indigo-600 rounded-full transition-transform duration-300 ${workspaceMode === 'joint' ? 'translate-x-full' : 'translate-x-0'}`} />
              </div>
          </div>

          {/* Premium Card */}
          <div className="relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.01] duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/15 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
              
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <div className="text-indigo-100/80 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</div>
                          <div className="text-4xl font-black tracking-tight drop-shadow-sm">{formatCurrency(stats.balance)}</div>
                      </div>
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                          <Wallet size={24} className="text-white" />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl p-3 border border-emerald-500/20">
                          <div className="flex items-center gap-1.5 text-emerald-100 text-[10px] font-bold uppercase mb-1">
                              <div className="p-1 bg-emerald-500 rounded-full"><ArrowDownCircle size={10} /></div>
                              Income
                          </div>
                          <div className="font-bold text-lg">{formatCurrency(stats.income)}</div>
                      </div>
                      <div className="bg-rose-500/20 backdrop-blur-sm rounded-2xl p-3 border border-rose-500/20">
                          <div className="flex items-center gap-1.5 text-rose-100 text-[10px] font-bold uppercase mb-1">
                              <div className="p-1 bg-rose-500 rounded-full"><ArrowUpCircle size={10} /></div>
                              Expense
                          </div>
                          <div className="font-bold text-lg">{formatCurrency(stats.expense)}</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderDebts = () => {
      const selectedDebtor = debtors.find(d => d.id === selectedDebtorId);
      const debtorDebts = selectedDebtorId ? debts.filter(d => d.debtorId === selectedDebtorId) : debts;
      
      const totalLent = debts.filter(d => d.type === 'Lend').reduce((acc, d) => acc + d.amount, 0);
      const totalBorrowed = debts.filter(d => d.type === 'Borrow').reduce((acc, d) => acc + d.amount, 0);

      return (
          <div className="p-4 space-y-4 pb-24">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-[24px] border border-emerald-100 dark:border-emerald-800">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">To Receive</span>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{formatCurrency(totalLent)}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-[24px] border border-red-100 dark:border-red-800">
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">To Pay</span>
                      <div className="text-xl font-black text-red-700 dark:text-red-300 mt-1">{formatCurrency(totalBorrowed)}</div>
                  </div>
              </div>

              {/* Debtors Horizontal List */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  <button onClick={() => setShowDebtorModal(true)} className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Plus size={20} />
                      <span className="text-[9px] font-bold">Add</span>
                  </button>
                  {debtors.map(d => (
                      <div 
                          key={d.id} 
                          onClick={() => setSelectedDebtorId(selectedDebtorId === d.id ? null : d.id)}
                          className={`flex-shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center p-1 border-2 transition-all cursor-pointer ${selectedDebtorId === d.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md transform scale-105' : 'border-transparent bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      >
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg">{d.icon ? <span className="text-xl">👤</span> : <User size={16}/>}</div>
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate w-full text-center mt-1">{d.name}</span>
                      </div>
                  ))}
              </div>

              {/* Debts List */}
              <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Records</h3>
                      {selectedDebtorId && (
                          <button onClick={() => setShowDebtModal(true)} className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                              + New Record
                          </button>
                      )}
                  </div>
                  {debtorDebts.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">No records found. Select a debtor to add one.</div>
                  ) : (
                      debtorDebts.map(debt => (
                          <div key={debt.id} onClick={() => { setEditingDebt(debt); setSelectedDebtorId(debt.debtorId); }} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${debt.type === 'Lend' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                      {debt.type === 'Lend' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white text-sm">{debt.description}</div>
                                      <div className="text-xs text-slate-400">{format(new Date(debt.date), 'MMM d, yyyy')} • {debtors.find(d => d.id === debt.debtorId)?.name}</div>
                                  </div>
                              </div>
                              <span className={`font-bold ${debt.type === 'Lend' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatCurrency(debt.amount)}
                              </span>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  };

  const renderGoals = () => (
      <div className="p-4 space-y-4 pb-24">
          <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Savings Goals</h3>
              <button onClick={() => setShowGoalModal(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                  <Plus size={20}/>
              </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              {goals.map(goal => {
                  const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                      <div key={goal.id} onClick={() => setEditingGoal(goal)} className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
                              <div className="w-20 h-20 rounded-full blur-xl" style={{ backgroundColor: goal.color }} />
                          </div>
                          <div className="relative z-10">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white shadow-md" style={{ backgroundColor: goal.color }}>
                                  <Target size={20} />
                              </div>
                              <div className="font-bold text-slate-800 dark:text-white mb-1">{goal.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</div>
                              
                              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                              </div>
                              <div className="mt-2 text-[10px] font-bold text-slate-400 text-right">{progress}%</div>
                          </div>
                      </div>
                  );
              })}
              <button onClick={() => setShowGoalModal(true)} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all min-h-[160px]">
                  <Plus size={32} />
                  <span className="text-xs font-bold">New Goal</span>
              </button>
          </div>
      </div>
  );

  const renderSubscriptions = () => {
      const totalMonthly = subscriptions.filter(s => s.isActive).reduce((acc, s) => {
          return acc + (s.period === 'Monthly' ? s.price : s.price / 12);
      }, 0);

      return (
          <div className="p-4 space-y-6 pb-24">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                      <div className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Monthly Recurring</div>
                      <div className="text-3xl font-black">{formatCurrency(totalMonthly)}<span className="text-base font-medium text-slate-500">/mo</span></div>
                  </div>
              </div>

              <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Subscriptions</h3>
                  <button onClick={() => setShowSubModal(true)} className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                      + Add New
                  </button>
              </div>

              <div className="space-y-3">
                  {subscriptions.map(sub => {
                      const nextDate = getNextRenewal(sub.startDate, sub.period);
                      const daysLeft = differenceInDays(nextDate, new Date());
                      
                      return (
                          <div key={sub.id} onClick={() => setEditingSubscription(sub)} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                  {sub.url ? (
                                      <img src={`https://www.google.com/s2/favicons?domain=${sub.url}&sz=64`} alt="logo" className="w-12 h-12 rounded-xl bg-white p-1 object-contain shadow-sm border border-slate-100" />
                                  ) : (
                                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                          {sub.name.charAt(0)}
                                      </div>
                                  )}
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white text-sm">{sub.name}</div>
                                      <div className="text-xs text-slate-400 mt-0.5">{sub.period} • Next in <span className={daysLeft <= 3 ? 'text-red-500 font-bold' : ''}>{daysLeft} days</span></div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(sub.price)}</div>
                                  {!sub.isActive && <div className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded inline-block mt-1">Inactive</div>}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const renderInvestments = () => {
      const totalInvested = investments.reduce((acc, i) => acc + (i.units * i.avgPrice), 0);
      const currentValue = investments.reduce((acc, i) => acc + (i.units * (i.currentPrice || i.avgPrice)), 0);
      const pnl = currentValue - totalInvested;
      const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

      return (
          <div className="p-4 space-y-6 pb-24">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Portfolio Value</div>
                  <div className="flex items-end gap-3 mb-4">
                      <div className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(currentValue)}</div>
                      <div className={`text-sm font-bold mb-1.5 flex items-center gap-1 px-2 py-0.5 rounded-lg ${pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                          {pnl >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                          {Math.abs(pnlPercent).toFixed(2)}%
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                          <div className="text-xs text-slate-400 mb-1">Invested</div>
                          <div className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(totalInvested)}</div>
                      </div>
                      <div>
                          <div className="text-xs text-slate-400 mb-1">P&L</div>
                          <div className={`font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</div>
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Assets</h3>
                  <button onClick={() => setShowInvModal(true)} className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                      + Add Asset
                  </button>
              </div>

              <div className="space-y-3">
                  {investments.map(inv => {
                      const current = inv.units * (inv.currentPrice || inv.avgPrice);
                      const gain = current - (inv.units * inv.avgPrice);
                      return (
                          <div key={inv.id} onClick={() => setEditingInvestment(inv)} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 font-bold text-xs shadow-sm">
                                      {inv.type.substring(0,2).toUpperCase()}
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white text-sm">{inv.name}</div>
                                      <div className="text-xs text-slate-400 mt-0.5">{inv.units} units @ {formatCurrency(inv.avgPrice)}</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(current)}</div>
                                  <div className={`text-[10px] font-bold ${gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
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
                    {Capacitor.isNativePlatform() && (
                        <button 
                            onClick={() => handleSyncSms()} 
                            disabled={isSyncingSms}
                            className={`p-2 rounded-full transition-colors ${isSyncingSms ? 'bg-indigo-50 text-indigo-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <RefreshCw size={20} className={isSyncingSms ? "animate-spin" : ""} />
                        </button>
                    )}
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
                                                {/* Category Icon */}
                                                {(() => {
                                                    const cat = normalizeCategory(t.category);
                                                    const iconKey = DEFAULT_CATEGORIES.find(c => c.name === cat)?.icon || 'circle-dot';
                                                    const color = DEFAULT_CATEGORIES.find(c => c.name === cat)?.color || '#94a3b8';
                                                    const IconComp = ICON_MAP[iconKey] || CircleDot;
                                                    return <IconComp size={20} style={{ color }} />;
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
            {activeTab === 'debts' && renderDebts()}
            {activeTab === 'goals' && renderGoals()}
            {activeTab === 'subscriptions' && renderSubscriptions()}
            {activeTab === 'investments' && renderInvestments()}
        </div>

        {/* Add Transaction Modal */}
        {showInput && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in" onClick={() => setShowInput(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
                        <button onClick={() => setShowInput(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20}/></button>
                    </div>
                    
                    {/* Amount Input */}
                    <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</label>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-3xl font-bold text-indigo-500">{currency.symbol}</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full text-4xl font-black bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-300"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Type Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
                        <button onClick={() => setType('debit')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'debit' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Expense</button>
                        <button onClick={() => setType('credit')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'credit' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Income</button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Merchant</label>
                            <input 
                                value={merchant} 
                                onChange={(e) => setMerchant(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mt-1 text-base font-bold outline-none border border-transparent focus:border-indigo-500 transition-colors dark:text-white"
                                placeholder="Where did you spend?"
                            />
                            {/* Suggestions */}
                            {merchantSuggestions.length > 0 && (
                                <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                                    {merchantSuggestions.map(s => (
                                        <button key={s} onClick={() => setMerchant(s)} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 whitespace-nowrap hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors font-bold">{s}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category</label>
                                <div className="relative">
                                    <select 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mt-1 text-sm font-bold outline-none appearance-none border border-transparent focus:border-indigo-500 transition-colors dark:text-white"
                                    >
                                        {Object.entries(GROUPED_CATEGORIES).map(([group, cats]) => (
                                            <optgroup key={group} label={group}>
                                                {cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 mt-0.5">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Date</label>
                                <input 
                                    type="date"
                                    value={entryDate} 
                                    onChange={(e) => setEntryDate(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mt-1 text-sm font-bold outline-none border border-transparent focus:border-indigo-500 transition-colors dark:text-white"
                                />
                            </div>
                        </div>

                        {workspaceMode === 'joint' && (
                            <div 
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${isSharedTransaction ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' : 'border-slate-100 dark:border-slate-800'}`}
                                onClick={() => setIsSharedTransaction(!isSharedTransaction)}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSharedTransaction ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-300'}`}>
                                    {isSharedTransaction && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span className={`text-sm font-bold ${isSharedTransaction ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>Share with Partner</span>
                            </div>
                        )}
                    </div>

                    <button onClick={handleManualSubmit} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-8 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]">
                        {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                    </button>
                    {editingTransaction && (
                        <button onClick={() => { onDeleteTransaction(editingTransaction.id); setShowInput(false); }} className="w-full text-red-500 font-bold py-3 mt-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors">Delete Transaction</button>
                    )}
                </div>
            </div>
        )}

        {/* Debtor Modal */}
        {showDebtorModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowDebtorModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 dark:text-white">Add Debtor</h3>
                    <input autoFocus value={debtorName} onChange={(e) => setDebtorName(e.target.value)} placeholder="Name" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 outline-none dark:text-white" />
                    <button onClick={handleAddDebtor} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Add</button>
                </div>
            </div>
        )}

        {/* Debt Modal */}
        {showDebtModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => { setShowDebtModal(false); resetDebtForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 dark:text-white">{editingDebt ? 'Edit Record' : 'New Record'}</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                        <button onClick={() => setDebtActionType('Borrow')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${debtActionType === 'Borrow' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}>I Borrowed</button>
                        <button onClick={() => setDebtActionType('Lend')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${debtActionType === 'Lend' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}>I Lent</button>
                    </div>
                    <input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} placeholder="Amount" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} placeholder="Description" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 outline-none dark:text-white" />
                    <button onClick={handleSaveDebt} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save</button>
                    {editingDebt && <button onClick={() => { if(onDeleteDebt) onDeleteDebt(editingDebt.id); setShowDebtModal(false); }} className="w-full text-red-500 font-bold py-3 mt-2 text-sm">Delete</button>}
                </div>
            </div>
        )}

        {/* Goals Modal */}
        {showGoalModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => { setShowGoalModal(false); resetGoalForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 dark:text-white">{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                    <input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Goal Name" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="Target Amount" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input type="number" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} placeholder="Current Saved" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 outline-none dark:text-white" />
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                        {GOAL_COLORS.map(c => (
                            <button key={c} onClick={() => setGoalColor(c)} className={`w-8 h-8 rounded-full flex-shrink-0 ${goalColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <button onClick={handleSaveGoal} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save</button>
                    {editingGoal && <button onClick={() => { if(onDeleteGoal) onDeleteGoal(editingGoal.id); setShowGoalModal(false); }} className="w-full text-red-500 font-bold py-3 mt-2 text-sm">Delete</button>}
                </div>
            </div>
        )}

        {/* Subscriptions Modal */}
        {showSubModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => { setShowSubModal(false); resetSubForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 dark:text-white">{editingSubscription ? 'Edit Subscription' : 'New Subscription'}</h3>
                    <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Name (e.g. Netflix)" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input type="number" value={subPrice} onChange={(e) => setSubPrice(e.target.value)} placeholder="Price" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input value={subUrl} onChange={(e) => setSubUrl(e.target.value)} placeholder="Website URL (for icon)" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <div className="flex gap-2 mb-4">
                        {(['Monthly', 'Yearly'] as const).map(p => (
                            <button key={p} onClick={() => setSubPeriod(p)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${subPeriod === p ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{p}</button>
                        ))}
                    </div>
                    <input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 outline-none dark:text-white" />
                    <button onClick={handleSaveSub} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save</button>
                    {editingSubscription && <button onClick={() => { if(onDeleteSubscription) onDeleteSubscription(editingSubscription.id); setShowSubModal(false); }} className="w-full text-red-500 font-bold py-3 mt-2 text-sm">Delete</button>}
                </div>
            </div>
        )}

        {/* Investment Modal */}
        {showInvModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => { setShowInvModal(false); resetInvForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 dark:text-white">{editingInvestment ? 'Edit Asset' : 'New Asset'}</h3>
                    <input value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Asset Name" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input type="number" value={invUnits} onChange={(e) => setInvUnits(e.target.value)} placeholder="Units Held" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <input type="number" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} placeholder="Average Buy Price" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 outline-none dark:text-white" />
                    <select value={invType} onChange={(e) => setInvType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 outline-none dark:text-white">
                        <option value="Stock">Stock</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Mutual Fund">Mutual Fund</option>
                        <option value="Gold">Gold</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Other">Other</option>
                    </select>
                    <button onClick={handleSaveInv} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save</button>
                    {editingInvestment && <button onClick={() => { if(onDeleteInvestment) onDeleteInvestment(editingInvestment.id); setShowInvModal(false); }} className="w-full text-red-500 font-bold py-3 mt-2 text-sm">Delete</button>}
                </div>
            </div>
        )}
    </div>
  );
};

export default FinanceView;
