
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
  Heart, Users2, Split, BarChart2
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
          // If transactions or partnerTransactions are null/undefined, safe fallback
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
      // Add active monthly subscription costs to expense
      const subCost = subscriptions.filter(s => s.isActive).reduce((acc, s) => {
          if (s.period === 'Monthly') return acc + s.price;
          return acc + (s.price / 12);
      }, 0);
      
      return { income, expense: expense + subCost, balance: income - (expense + subCost) };
  }, [monthTransactions, subscriptions]);

  // Couples Split Logic
  const splitStats = useMemo(() => {
      if (workspaceMode !== 'joint') return null;
      
      const myUid = user?.uid;
      let myTotal = 0;
      let partnerTotal = 0;

      // Only count shared expenses for split calculation
      monthTransactions.filter(t => t.type === 'debit' && t.isShared).forEach(t => {
          // If I paid, or if paidBy is undefined but it exists in my local list
          if (t.paidBy === myUid || (!t.paidBy && transactions.some(mt => mt.id === t.id))) {
              myTotal += t.amount;
          } else {
              partnerTotal += t.amount;
          }
      });

      const total = myTotal + partnerTotal;
      const fairShare = total / 2;
      const iOwe = fairShare - myTotal; // If positive, I owe. If negative, partner owes me.

      return { myTotal, partnerTotal, iOwe };
  }, [monthTransactions, workspaceMode, user, transactions]);

  // Comparison Data (Who spent more?)
  const comparisonData = useMemo(() => {
      if (workspaceMode !== 'joint') return [];
      
      const myUid = user?.uid;
      let mySpending = 0;
      let partnerSpending = 0;

      monthTransactions.filter(t => t.type === 'debit').forEach(t => {
          const isMine = t.paidBy === myUid || (!t.paidBy && transactions.some(mt => mt.id === t.id));
          if (isMine) mySpending += t.amount;
          else partnerSpending += t.amount;
      });

      return [
          { name: 'You', value: mySpending, fill: '#3b82f6' },
          { name: 'Partner', value: partnerSpending, fill: '#a855f7' }
      ];
  }, [monthTransactions, workspaceMode, user, transactions]);

  const categoryStats = useMemo(() => {
      const data: Record<string, number> = {};
      let total = 0;
      monthTransactions.filter(t => t.type === 'debit' && !t.exclude_from_budget).forEach(t => {
          const cat = normalizeCategory(t.category) || 'Other';
          data[cat] = (data[cat] || 0) + t.amount;
          total += t.amount;
      });
      
      return Object.entries(data)
          .map(([name, value]) => {
              const catData = DEFAULT_CATEGORIES.find(c => c.name === name) || { color: '#94a3b8' };
              return { 
                  name, 
                  value, 
                  percentage: total > 0 ? Math.round((value / total) * 100) : 0,
                  color: catData.color
              };
          })
          .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  // Monthly Trend Data
  const trendData = useMemo(() => {
      const data = [];
      for (let i = 5; i >= 0; i--) {
          const d = subMonths(new Date(), i);
          const monthStart = startOfMonth(d);
          const monthEnd = endOfMonth(d);
          
          const monthTxns = activeTransactions.filter(t => {
              const tDate = parseISO(t.date);
              return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
          });

          const income = monthTxns.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
          const expense = monthTxns.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
          
          data.push({
              name: format(d, 'MMM'),
              income,
              expense
          });
      }
      return data;
  }, [activeTransactions]);

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
                      <Heart size={10} fill="currentColor" /> Joint
                  </button>
                  <div className={`absolute top-1 bottom-1 w-[50%] bg-blue-600 rounded-full transition-transform duration-300 ${workspaceMode === 'joint' ? 'translate-x-full' : 'translate-x-0'}`} />
              </div>
          </div>

          {/* Couples Split Card (Joint Mode Only) */}
          {workspaceMode === 'joint' && splitStats && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start z-10 relative">
                      <div>
                          <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Shared Expenses Split</div>
                          <div className="text-2xl font-black">{formatCurrency(splitStats.myTotal + splitStats.partnerTotal)}</div>
                          <div className="text-[10px] opacity-70">Total Shared Spending</div>
                      </div>
                      <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                          <Split size={20} className="text-white" />
                      </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                      <div className="flex-1 bg-black/20 rounded-xl p-2 flex flex-col items-center">
                          <span className="text-[10px] opacity-80">You Paid</span>
                          <span className="font-bold">{formatCurrency(splitStats.myTotal)}</span>
                      </div>
                      <div className="flex-1 bg-black/20 rounded-xl p-2 flex flex-col items-center">
                          <span className="text-[10px] opacity-80">Partner Paid</span>
                          <span className="font-bold">{formatCurrency(splitStats.partnerTotal)}</span>
                      </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                      <span className="text-xs font-medium opacity-90">
                          {splitStats.iOwe > 0 
                              ? `You owe partner ${formatCurrency(Math.abs(splitStats.iOwe))}`
                              : splitStats.iOwe < 0 
                                  ? `Partner owes you ${formatCurrency(Math.abs(splitStats.iOwe))}`
                                  : "All settled up! 🎉"
                          }
                      </span>
                  </div>
              </div>
          )}

          {/* Comparison Chart (Joint Mode Only) */}
          {workspaceMode === 'joint' && comparisonData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                      <BarChart2 size={16} className="text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Spending Comparison</h3>
                  </div>
                  <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={comparisonData}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 10}} />
                              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                              <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                  {comparisonData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center gap-1 mb-1">
                      <ArrowDownCircle className="text-emerald-500" size={16}/>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Income</span>
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.income)}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-800">
                  <div className="flex items-center gap-1 mb-1">
                      <ArrowUpCircle className="text-red-500" size={16}/>
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Expense</span>
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.expense)}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-1 mb-1">
                      <Wallet className="text-blue-500" size={16}/>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Balance</span>
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.balance)}</div>
              </div>
          </div>

          {/* Pie Chart: Spending by Category */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Spending by Category</h3>
              <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {categoryStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                  {categoryStats.slice(0, 4).map(c => (
                      <div key={c.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}/>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 font-medium">{c.name}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.percentage}%</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Bar Chart: Income vs Expense Trend */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Financial Trend</h3>
              <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                          <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#94a3b8' }} 
                              dy={10}
                          />
                          <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-xs text-blue-500 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                  {recentTransactions.length === 0 && <div className="text-slate-400 text-xs text-center py-4">No recent activity</div>}
                  {recentTransactions.map(t => {
                      const CatIcon = ICON_MAP[DEFAULT_CATEGORIES.find(c => c.name === normalizeCategory(t.category))?.icon || 'circle-dot'];
                      const isMine = t.paidBy === user?.uid || !t.paidBy;
                      return (
                          <div key={t.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                      {CatIcon ? <CatIcon size={16} /> : <CircleDot size={16} />}
                                  </div>
                                  <div>
                                      <div className="text-sm font-bold text-slate-800 dark:text-white truncate w-32">{t.merchant}</div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                          {format(parseISO(t.date), 'MMM d')}
                                          {workspaceMode === 'joint' && (
                                              <span className={`px-1 rounded text-[8px] font-bold ${isMine ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                  {isMine ? 'You' : 'Partner'}
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                              <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                              </span>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950">
        {/* Header - Safe Area Wrapper */}
        <div className="pt-safe bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 z-20">
            <div className="h-16 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    {onMenuClick && <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Menu size={20}/></button>}
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Finance</h1>
                </div>
                <div className="flex items-center gap-2">
                    {activeTab === 'transactions' && (
                        <button onClick={handleExport} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" title="Export CSV">
                            <Download size={20} />
                        </button>
                    )}
                    <button onClick={() => handleSyncSms()} disabled={isSyncingSms} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full">
                        {isSyncingSms ? <Loader2 size={20} className="animate-spin"/> : <RefreshCw size={20}/>}
                    </button>
                    {activeTab === 'transactions' && (
                        <button onClick={() => setShowInput(true)} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md">
                            <Plus size={20}/>
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                {(['overview', 'transactions', 'subscriptions', 'investments', 'debts', 'goals'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && renderOverview()}
            
            {activeTab === 'transactions' && (
                <div className="space-y-4 animate-in fade-in pb-20">
                    <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 py-2">
                        {/* Type Filter */}
                        <div className="flex gap-2">
                            {(['all', 'debit', 'credit'] as const).map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setTransactionFilter(f)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${transactionFilter === f ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            <button onClick={() => setCategoryFilter('All')} className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'All' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>All Categories</button>
                            {DEFAULT_CATEGORIES.map(c => (
                                <button 
                                    key={c.name}
                                    onClick={() => setCategoryFilter(c.name)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === c.name ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {groupedTransactions.length === 0 && <div className="text-center py-10 text-slate-400">No transactions found.</div>}
                    
                    {groupedTransactions.map(([date, txns]) => {
                        const dateObj = parseISO(date);
                        let dateLabel = format(dateObj, 'MMMM d, yyyy');
                        if (isToday(dateObj)) dateLabel = 'Today';
                        else if (isYesterday(dateObj)) dateLabel = 'Yesterday';

                        return (
                            <div key={date}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{dateLabel}</h3>
                                <div className="space-y-2">
                                    {txns.map(t => {
                                        const CatIcon = ICON_MAP[DEFAULT_CATEGORIES.find(c => c.name === normalizeCategory(t.category))?.icon || 'circle-dot'];
                                        const isMine = t.paidBy === user?.uid || !t.paidBy;
                                        
                                        return (
                                            <div key={t.id} onClick={() => setEditingTransaction(t)} className="bg-white dark:bg-slate-900 p-3 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.99] transition-transform cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                        {CatIcon ? <CatIcon size={18} /> : <CircleDot size={18} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{t.merchant}</div>
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            <span>{t.category}</span>
                                                            <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"/>
                                                            <span>{t.payment_method || 'Cash'}</span>
                                                            {workspaceMode === 'joint' && (
                                                                <>
                                                                    <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"/>
                                                                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isMine ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                                        {isMine ? 'You' : 'Partner'}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Other tabs remain largely the same, can add shared logic later if needed */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-white">Active Subscriptions</h3>
                        <button onClick={() => setShowSubModal(true)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">+ Add</button>
                    </div>
                    {subscriptions.map(sub => {
                        const renewalDate = sub.startDate ? getNextRenewal(sub.startDate, sub.period) : new Date();
                        const isDueSoon = isWithinInterval(renewalDate, { start: new Date(), end: addDays(new Date(), 7) });
                        
                        return (
                            <div key={sub.id} onClick={() => setEditingSubscription(sub)} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                    {sub.url ? <img src={`https://www.google.com/s2/favicons?domain=${sub.url}&sz=64`} alt="logo" className="w-6 h-6" /> : <Calendar size={20} className="text-slate-400"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {sub.name}
                                        {!sub.isActive && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Cancelled</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        {sub.period} • <span className={isDueSoon ? 'text-red-500 font-bold' : ''}>Next: {format(renewalDate, 'MMM d')}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800 dark:text-white">{formatCurrency(sub.price)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'investments' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-white">Portfolio</h3>
                        <button onClick={() => setShowInvModal(true)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">+ Add</button>
                    </div>
                    {investments.map(inv => {
                        const totalVal = inv.units * inv.avgPrice; // Simplified, ideally use currentPrice
                        return (
                            <div key={inv.id} onClick={() => setEditingInvestment(inv)} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer">
                                <div className="flex justify-between mb-2">
                                    <div className="font-bold text-slate-800 dark:text-white">{inv.name}</div>
                                    <div className="font-bold text-blue-600">{formatCurrency(totalVal)}</div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{inv.units} units @ {formatCurrency(inv.avgPrice)}</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">{inv.type}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'debts' && (
                <div className="animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white">Debtors</h3>
                        <button onClick={() => setShowDebtorModal(true)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">+ Add</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {debtors.map(d => (
                            <div key={d.id} onClick={() => { setSelectedDebtorId(d.id); setShowDebtModal(true); }} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold">
                                        {d.name.charAt(0)}
                                    </div>
                                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{d.name}</div>
                                </div>
                                <div className="text-xs text-slate-500">{d.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'goals' && (
                <div className="animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white">Savings Goals</h3>
                        <button onClick={() => setShowGoalModal(true)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">+ Add</button>
                    </div>
                    <div className="space-y-4">
                        {goals.map(g => {
                            const progress = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                            const GIcon = ICON_MAP[g.icon] || Target;
                            return (
                                <div key={g.id} onClick={() => setEditingGoal(g)} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: g.color }}>
                                                <GIcon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white">{g.name}</div>
                                                <div className="text-xs text-slate-500">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</div>
                                            </div>
                                        </div>
                                        <span className="font-bold text-lg text-slate-800 dark:text-white">{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: g.color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {/* Transaction Input Modal */}
        {showInput && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowInput(false)}>
                <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingTransaction ? 'Edit' : 'New'} Transaction</h2>
                        <button onClick={() => setShowInput(false)}><X size={24} className="text-slate-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button onClick={() => setType('debit')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${type === 'debit' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600' : 'text-slate-500'}`}>Expense</button>
                            <button onClick={() => setType('credit')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${type === 'credit' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}>Income</button>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">{currency.symbol}</span>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800 pl-8 pr-4 py-3 rounded-xl outline-none font-bold text-lg text-slate-800 dark:text-white"/>
                        </div>
                        
                        {/* Merchant Input with Autocomplete */}
                        <div className="relative">
                            <input 
                                value={merchant} 
                                onChange={e => setMerchant(e.target.value)} 
                                placeholder="Merchant / Title" 
                                className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none font-medium text-slate-800 dark:text-white"
                            />
                            {merchantSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-10 overflow-hidden">
                                    {merchantSuggestions.map(s => (
                                        <button key={s} onClick={() => { setMerchant(s); setMerchantSuggestions([]); }} className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <select value={category} onChange={e => setCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none text-sm font-medium text-slate-600 dark:text-slate-300">
                                {Object.keys(GROUPED_CATEGORIES).map(group => (
                                    <optgroup key={group} label={group}>
                                        {GROUPED_CATEGORIES[group as keyof typeof GROUPED_CATEGORIES].map(c => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none text-sm font-medium text-slate-600 dark:text-slate-300"/>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${paymentMethod === method ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>

                        {/* Joint Finance Toggle inside Form */}
                        {user?.uid && (
                            <button 
                                onClick={() => setIsSharedTransaction(!isSharedTransaction)}
                                className={`w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${isSharedTransaction ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent'}`}
                            >
                                <Users2 size={16} />
                                {isSharedTransaction ? "Shared Expense" : "Personal Expense"}
                            </button>
                        )}

                        <button onClick={handleManualSubmit} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Save</button>
                        {editingTransaction && (
                            <button onClick={() => { onDeleteTransaction(editingTransaction.id); setShowInput(false); }} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">Delete</button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Other Modals (Subscription, Debt, Goal, Investment) omitted for brevity as they are unchanged structure-wise, but would be present in real file */}
        {showSubModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => { setShowSubModal(false); resetSubForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{editingSubscription ? 'Edit' : 'Add'} Subscription</h3>
                    <div className="space-y-3">
                        <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Service Name" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                        <input type="number" value={subPrice} onChange={e => setSubPrice(e.target.value)} placeholder="Price" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                        <div className="flex gap-2">
                            {['Monthly', 'Yearly'].map(p => (
                                <button key={p} onClick={() => setSubPeriod(p as any)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${subPeriod === p ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>{p}</button>
                            ))}
                        </div>
                        <input type="date" value={subDate} onChange={e => setSubDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                        <input value={subUrl} onChange={e => setSubUrl(e.target.value)} placeholder="Website URL (for icon)" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none text-sm"/>
                        
                        <button onClick={handleSaveSub} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">Save</button>
                        {editingSubscription && <button onClick={() => { if(onDeleteSubscription) onDeleteSubscription(editingSubscription.id); setShowSubModal(false); }} className="w-full py-3 text-red-500 font-bold">Delete</button>}
                    </div>
                </div>
            </div>
        )}

        {showInvModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => { setShowInvModal(false); resetInvForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{editingInvestment ? 'Edit' : 'Add'} Investment</h3>
                    <div className="space-y-3">
                        <input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Asset Name" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="number" value={invUnits} onChange={e => setInvUnits(e.target.value)} placeholder="Units" className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                            <input type="number" value={invPrice} onChange={e => setInvPrice(e.target.value)} placeholder="Buy Price" className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                        </div>
                        <select value={invType} onChange={e => setInvType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none">
                            {['Stock', 'Crypto', 'Mutual Fund', 'Gold', 'Real Estate', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none"/>
                        
                        <button onClick={handleSaveInv} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">Save</button>
                        {editingInvestment && <button onClick={() => { if(onDeleteInvestment) onDeleteInvestment(editingInvestment.id); setShowInvModal(false); }} className="w-full py-3 text-red-500 font-bold">Delete</button>}
                    </div>
                </div>
            </div>
        )}

        {showDebtorModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDebtorModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Add Debtor</h3>
                    <input autoFocus value={debtorName} onChange={e => setDebtorName(e.target.value)} placeholder="Name" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none mb-4 text-slate-800 dark:text-white"/>
                    <button onClick={handleAddDebtor} disabled={!debtorName} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Add</button>
                </div>
            </div>
        )}

        {showDebtModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowDebtModal(false); resetDebtForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{editingDebt ? 'Edit' : 'Add'} Record</h3>
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setDebtActionType('Borrow')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${debtActionType === 'Borrow' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>I Borrowed</button>
                        <button onClick={() => setDebtActionType('Lend')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${debtActionType === 'Lend' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>I Lent</button>
                    </div>
                    <input type="number" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} placeholder="Amount" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none mb-3 font-bold text-lg"/>
                    <input value={debtDesc} onChange={e => setDebtDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none mb-4"/>
                    <button onClick={handleSaveDebt} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mb-2">Save</button>
                    {editingDebt && <button onClick={() => { if(onDeleteDebt) onDeleteDebt(editingDebt.id); setShowDebtModal(false); }} className="w-full py-3 text-red-500 font-bold">Delete</button>}
                </div>
            </div>
        )}

        {showGoalModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowGoalModal(false); resetGoalForm(); }}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                    <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Goal Name" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none mb-3"/>
                    <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Target Amount" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none mb-3"/>
                    <input type="number" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} placeholder="Current Saved" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none mb-4"/>
                    
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                        {GOAL_COLORS.map(c => (
                            <button key={c} onClick={() => setGoalColor(c)} className={`w-8 h-8 rounded-full shrink-0 ${goalColor === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>

                    <button onClick={handleSaveGoal} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mb-2">Save Goal</button>
                    {editingGoal && <button onClick={() => { if(onDeleteGoal) onDeleteGoal(editingGoal.id); setShowGoalModal(false); }} className="w-full py-3 text-red-500 font-bold">Delete</button>}
                </div>
            </div>
        )}
    </div>
  );
};

export default FinanceView;
