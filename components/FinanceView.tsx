
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Debtor, Debt, SavingsGoal, Subscription, Investment } from '../types';
import { 
  Menu, Plus, Wallet, X,
  ChevronLeft, ChevronRight, Loader2,
  Search, Check,
  UtensilsCrossed, Bus, Gamepad2, Bandage, ShoppingBag, Plane, Wifi, 
  Notebook, Gift, CircleDot, CreditCard, User, Banknote, Landmark, CircleDollarSign,
  ArrowUpCircle, ArrowDownCircle, Trash2, Edit2, Target, PiggyBank, Briefcase, Car, Home,
  Smartphone, Monitor, ShoppingCart, Coffee,
  Heart, PieChart as PieIcon,
  MessageSquare, MoreHorizontal, Filter, RefreshCw, CalendarClock, Users,
  TrendingUp, Bitcoin, Split
} from 'lucide-react';
import { 
  format, isWithinInterval, eachDayOfInterval, 
  addMonths, subMonths, startOfMonth, endOfMonth, parseISO, addYears
} from 'date-fns';
import { loadFromStorage, saveToStorage } from '../services/storageService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DEFAULT_CATEGORIES } from '../data/financeData';
import { Capacitor } from '@capacitor/core';
import { readRecentSms, parseBankingSms } from '../services/smsService';

// --- IVY DESIGN SYSTEM TOKENS ---
const PALETTE = {
  ivy: '#6B4DFF',
  ivyDark: '#5c42e0',
  green: '#14CC9E',
  orange: '#FFC44D',
  red: '#FF4D6B',
  purple: '#C34CFF',
  blue: '#4CC3FF',
  darkBg: '#111114',
  cardDark: '#1E1E24',
};

const IVY_GRADIENTS = {
  primary: 'bg-gradient-to-br from-[#6B4DFF] to-[#9C27B0]',
  green: 'bg-gradient-to-br from-[#14CC9E] to-[#49F2C8]',
  orange: 'bg-gradient-to-br from-[#FFC44D] to-[#FFD580]',
  red: 'bg-gradient-to-br from-[#FF4D6B] to-[#FF8095]',
  blue: 'bg-gradient-to-br from-[#4CC3FF] to-[#00B4D8]',
  dark: 'bg-gradient-to-br from-[#2B2C2D] to-[#111114]',
};

// Map original colors to Ivy Palette for charts
const CHART_COLORS = [PALETTE.ivy, PALETTE.green, PALETTE.orange, PALETTE.red, PALETTE.purple, PALETTE.blue];

// --- Custom SVG Icons (Converted from Ivy Wallet Android Vectors) ---

const SvgIcon = ({ path, className }: { path: React.ReactNode, className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor">
        {path}
    </svg>
);

const Icons = {
    Cash: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M30.3,37.1L30.3,33.7a5.1,5.1 0,1 1,0 -10.2L30.3,21.8a1.7,1.7 0,1 1,3.4 0L33.7,23.5h0.037A5.063,5.063 0,0 1,38.8 28.563a1.7,1.7 0,1 1,-3.4 0A1.663,1.663 0,0 0,33.737 26.9L33.7,26.9v3.4a5.1,5.1 0,0 1,0 10.2v1.7a1.7,1.7 0,0 1,-3.4 0L30.3,40.5h-0.087A5.013,5.013 0,0 1,25.2 35.487a1.7,1.7 0,1 1,3.4 0A1.615,1.615 0,0 0,30.213 37.1ZM33.7,37.1a1.7,1.7 0,1 0,0 -3.4ZM30.3,26.9a1.7,1.7 0,0 0,0 3.4ZM32,49A17,17 0,1 1,49 32,17 17,0 0,1 32,49ZM32,45.6A13.6,13.6 0,1 0,18.4 32,13.6 13.6,0 0,0 32,45.6Z" />
        } />
    ),
    Bank: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M44.8,26.857L44.8,23.429L19.2,23.429L19.2,26.857ZM44.8,32L19.2,32v8.571L44.8,40.571ZM19.2,20L44.8,20A3.32,3.32 0,0 1,48 23.429L48,40.571A3.32,3.32 0,0 1,44.8 44L19.2,44A3.32,3.32 0,0 1,16 40.571L16,23.429A3.32,3.32 0,0 1,19.2 20ZM22.4,35.429L24,35.429a1.718,1.718 0,0 1,0 3.429L22.4,38.858a1.718,1.718 0,0 1,0 -3.429ZM30.4,35.429h8a1.718,1.718 0,0 1,0 3.429h-8a1.718,1.718 0,0 1,0 -3.429Z" />
        } />
    ),
    Crypto: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M43.932,28.628c0.542,-3.616 -2.213,-5.56 -5.978,-6.857l1.221,-4.9 -2.981,-0.742 -1.19,4.77c-0.783,-0.2 -1.587,-0.38 -2.389,-0.562l1.2,-4.8L30.833,14.793l-1.221,4.9c-0.649,-0.148 -1.287,-0.293 -1.9,-0.449l0,-0.016L23.598,18.2l-0.794,3.185s2.213,0.507 2.167,0.538a1.587,1.587 0,0 1,1.389 1.735l-1.39,5.581a2.65,2.65 0,0 1,0.311 0.1l-0.316,-0.078 -1.949,7.818a1.087,1.087 0,0 1,-1.368 0.707c0.031,0.043 -2.167,-0.54 -2.167,-0.54l-1.48,3.412 3.882,0.968c0.721,0.181 1.428,0.371 2.124,0.549l-1.233,4.955 2.979,0.742 1.221,-4.9c0.814,0.219 1.6,0.423 2.377,0.616l-1.218,4.879 2.981,0.742L32.343,44.263c5.086,0.963 8.908,0.574 10.518,-4.025 1.3,-3.7 -0.064,-5.84 -2.739,-7.232a4.753,4.753 0,0 0,3.807 -4.378ZM37.118,38.182c-0.919,3.7 -7.156,1.7 -9.178,1.2l1.639,-6.564C31.601,33.322 38.082,34.321 37.118,38.182ZM38.041,28.575c-0.84,3.369 -6.029,1.656 -7.711,1.237l1.484,-5.952C33.495,24.279 38.917,25.061 38.043,28.575Z" />
        } />
    ),
    Food: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M22.812,27.015l9.14,16.149 8.989,-15.729a26.891,26.891 0,0 1,-6.787 -1.587,2.688 2.688,0 0,0 -1.248,-0.237c-0.246,0.032 -2.757,0.91 -4.229,1.283a13.468,13.468 0,0 1,-5.864 0.12ZM20.555,23.031a11.874,11.874 0,0 0,7.335 0.762c1.181,-0.3 3.965,-1.274 4.613,-1.355a5.658,5.658 0,0 1,2.714 0.392,20.761 20.761,0 0,0 7.525,1.454L44.161,21.8A30,30 0,0 0,19.834 21.754l0.722,1.275ZM16.865,19.631A33.136,33.136 0,0 1,47.139 19.69a1.6,1.6 0,0 1,0.65 2.213L33.334,47.195a1.6,1.6 0,0 1,-2.781 -0.006L16.206,21.84A1.6,1.6 0,0 1,16.866 19.632ZM28.799,32a1.6,1.6 0,1 1,1.6 -1.6A1.6,1.6 0,0 1,28.799 32ZM33.599,36.8a1.6,1.6 0,1 1,1.6 -1.6A1.6,1.6 0,0 1,33.599 36.8Z" />
        } />
    ),
    Shopping: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M47.915,35.591l-14.4,-8.343v-0.339a1.513,1.513 0,0 1,0.813 -1.32,4.907 4.907,0 1,0 -7.236,-4.318 1.519,1.519 0,1 0,3.037 0,1.85 1.85,0 0,1 0.546,-1.32 2.066,2.066 0,0 1,1.394 -0.545,1.868 1.868,0 0,1 1.793,1.941 1.878,1.878 0,0 1,-0.976 1.569,4.546 4.546,0 0,0 -2.41,3.987v0.346l-14.394,8.343a4.18,4.18 0,0 0,2.1 7.8h27.638a4.18,4.18 0,0 0,2.1 -7.8ZM46.806,39.781a1.15,1.15 0,0 1,-0.986 0.57h-27.638a1.142,1.142 0,0 1,-0.571 -2.13l14.39,-8.34 14.391,8.34a1.144,1.144 0,0 1,0.415 1.561Z" />
        } />
    ),
    Health: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M20.8,26a1.634,1.634 0,0 0,-1.6 1.667L19.2,41a1.634,1.634 0,0 0,1.6 1.667L43.2,42.667A1.634,1.634 0,0 0,44.8 41L44.8,27.667A1.634,1.634 0,0 0,43.2 26ZM24,22.667L24,21a4.9,4.9 0,0 1,4.8 -5h6.4A4.9,4.9 0,0 1,40 21L40,22.667h3.2a4.9,4.9 0,0 1,4.8 5L48,41a4.9,4.9 0,0 1,-4.8 5L20.8,46A4.9,4.9 0,0 1,16 41L16,27.667a4.9,4.9 0,0 1,4.8 -5ZM27.2,22.667h9.6L36.8,21a1.634,1.634 0,0 0,-1.6 -1.667L28.8,19.333A1.634,1.634 0,0 0,27.2 21ZM30.4,29.334h3.2v10L30.4,39.334ZM27.2,32.667h9.6L36.8,36L27.2,36Z" />
        } />
    ),
    Bills: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M28.126,46.89v1.88a1.88,1.88 0,0 1,-1.88 1.88h0a1.88,1.88 0,0 1,-1.88 -1.88v-1.88h-4.125A1.515,1.515 0,0 1,18.726 45.374L18.726,14.562a1.516,1.516 0,0 1,1.516 -1.515h19.167a5.64,5.64 0,0 1,5.641 5.641v22.563a5.64,5.64 0,0 1,-5.641 5.641ZM24.366,16.807h-1.88v26.323h1.88ZM28.126,16.807v26.323h11.281a1.88,1.88 0,0 0,1.88 -1.88L41.287,18.687a1.881,1.881 0,0 0,-1.88 -1.88ZM31.886,20.567h5.641a1.881,1.881 0,0 1,1.88 1.88h0a1.88,1.88 0,0 1,-1.88 1.88h-5.641a1.88,1.88 0,0 1,-1.88 -1.88h0A1.881,1.881 0,0 1,31.891 20.567ZM31.886,26.208h5.641a1.881,1.881 0,0 1,1.88 1.88h0a1.88,1.88 0,0 1,-1.88 1.88h-5.641a1.88,1.88 0,0 1,-1.88 -1.88h0A1.881,1.881 0,0 1,31.891 26.208Z" />
        } />
    ),
    Education: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M46.8831,39.559L46.8831,29.759l1.562,-0.556a1.507,1.507 0,0 0,-0.005 -2.841l-17.149,-6.049a1.5,1.5 0,0 0,-1 0L13.139,26.359a1.507,1.507 0,0 0,0 2.841l6.5,2.31L19.639,38.159c0,1.362 1.3,2.475 3.866,3.307a26.433,26.433 0,0 0,14.571 0c2.566,-0.832 3.868,-1.944 3.868,-3.307L41.9441,31.51l1.927,-0.684L43.8711,39.559a3.649,3.649 0,0 0,0 6.649v0.513a1.507,1.507 0,0 0,3.013 0v-0.513a3.651,3.651 0,0 0,0 -6.649ZM43.425,27.789 L30.79,32.281 18.155,27.791 30.79,23.331ZM22.65,32.589 L30.2831,35.303a1.524,1.524 0,0 0,1.011 0l7.633,-2.714L38.9271,37.799a7.813,7.813 0,0 1,-2.269 0.953,23.76 23.76,0 0,1 -11.739,0 7.832,7.832 0,0 1,-2.269 -0.953ZM46.0131,42.889a0.637,0.637 0,1 1,-0.638 -0.636A0.64,0.64 0,0 1,46.0131 42.88Z" />
        } />
    ),
    Game: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M24.648,27.589h1.471a1.471,1.471 0,0 1,0 2.941L24.648,30.53v1.471a1.471,1.471 0,0 1,-2.941 0L21.707,30.53L20.236,30.53a1.471,1.471 0,0 1,0 -2.941L21.707,27.589L21.707,26.119a1.471,1.471 0,0 1,2.941 0ZM28.054,21.707L35.944,21.707a8.823,8.823 0,0 1,13.7 7.353c0,4.873 -3.95,14.705 -8.823,14.705 -2.906,0 -5.484,-3.5 -7.091,-7.353L30.268,36.412c-1.606,3.856 -4.185,7.353 -7.091,7.353C18.304,43.765 14.354,33.936 14.354,29.06A8.823,8.823 0,0 1,28.054 21.707ZM36.83,24.648L27.168,24.648l-0.741,-0.493a5.882,5.882 0,0 0,-9.132 4.9c0,4.584 3.738,11.764 5.882,11.764 1.062,0 2.947,-2.115 4.376,-5.544l0.756,-1.809L35.694,33.466l0.754,1.809c1.428,3.429 3.313,5.544 4.375,5.544 2.144,0 5.882,-7.181 5.882,-11.764a5.882,5.882 0,0 0,-9.132 -4.9l-0.741,0.493ZM40.821,27.589A1.471,1.471 0,1 1,42.294 26.119,1.471 1.471,0 0,1 40.823,27.589ZM37.88,30.53A1.471,1.471 0,1 1,39.354 29.06,1.471 1.471,0 0,1 37.882,30.53ZM43.762,30.53a1.471,1.471 0,1 1,1.471 -1.471A1.471,1.471 0,0 1,43.764 30.53ZM40.821,33.471a1.471,1.471 0,1 1,1.471 -1.471A1.471,1.471 0,0 1,40.823 33.471Z" />
        } />
    ),
    Groceries: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M25.582,19.165L20.769,19.165a1.6,1.6 0,0 0,-1.6 1.6L19.169,23.978a1.6,1.6 0,0 0,1.6 1.6L23.978,25.578a1.6,1.6 0,0 0,1.6 -1.6ZM20.782,28.791L20.782,44.778L23.978,44.778L23.978,36.813a3.209,3.209 0,0 1,3.209 -3.209h3.209a3.209,3.209 0,0 1,3.209 3.209v7.966L43.256,44.779L43.256,28.791h-3.23a4.794,4.794 0,0 1,-3.209 -1.226,4.8 4.8,0 0,1 -3.209,1.226L30.395,28.791a4.794,4.794 0,0 1,-3.209 -1.226,4.8 4.8,0 0,1 -3.209,1.226ZM17.576,27.581A4.8,4.8 0,0 1,15.956 23.978L15.956,20.769A4.813,4.813 0,0 1,20.769 15.956L43.23,15.956a4.813,4.813 0,0 1,4.813 4.813L48.043,23.978a4.8,4.8 0,0 1,-1.584 3.57L46.459,44.778A3.209,3.209 0,0 1,43.256 47.987L30.994,47.987a3.225,3.225 0,0 1,-0.6 0.056L27.187,48.043a3.223,3.223 0,0 1,-0.6 -0.056h-5.8a3.209,3.209 0,0 1,-3.209 -3.209v-17.2ZM30.395,44.781L30.395,36.813L27.187,36.813v7.966h3.209ZM35.208,19.165L28.791,19.165L28.791,23.978a1.6,1.6 0,0 0,1.6 1.6h3.209a1.6,1.6 0,0 0,1.6 -1.6ZM38.417,19.165L38.417,23.978a1.6,1.6 0,0 0,1.6 1.6h3.209a1.6,1.6 0,0 0,1.6 -1.6L44.826,20.769a1.6,1.6 0,0 0,-1.6 -1.6ZM38.417,33.604h1.6a1.6,1.6 0,0 1,1.6 1.6v4.813a1.6,1.6 0,0 1,-1.6 1.6h-1.6a1.6,1.6 0,0 1,-1.6 -1.6L36.817,35.208A1.6,1.6 0,0 1,38.417 33.604Z" />
        } />
    ),
    Location: ({ className }: { className?: string }) => (
        <SvgIcon className={className} path={
            <path d="M40.571,26.9a8.572,8.572 0,0 0,-17.143 0c0,2.934 2.846,8.553 8.571,16.41C37.726,35.453 40.571,29.834 40.571,26.9ZM32,49Q20,33.47 20,26.9a12,12 0,0 1,24 0Q44,33.471 32,49ZM32,33.7a6.8,6.8 0,1 1,6.857 -6.8A6.829,6.829 0,0 1,32 33.7ZM32,30.3a3.4,3.4 0,1 0,-3.429 -3.4A3.414,3.414 0,0 0,32 30.3Z" />
        } />
    ),
    Investment: ({ className }: { className?: string }) => (
         <SvgIcon className={className} path={
            <path d="M48.327,26.29L48.327,38.535h-9.8v9.8L25.474,48.335L25.474,41.8L15.674,41.8L15.674,29.555a4.082,4.082 0,1 1,8.163 0v4.082L25.474,33.637L25.474,22.208a6.531,6.531 0,0 1,13.041 -0.513L38.515,30.375h1.652L40.167,26.29a4.082,4.082 0,0 1,8.163 0ZM28.735,45.065h6.531v-9.8h9.8L45.066,26.29a0.816,0.816 0,0 0,-1.633 0v7.347L35.266,33.637L35.266,22.208a3.265,3.265 0,1 0,-6.531 0L28.735,36.902L20.574,36.902L20.574,29.555a0.816,0.816 0,1 0,-1.633 0L18.941,38.535h9.8ZM32,30.375a1.633,1.633 0,0 1,1.633 1.633v9.8a1.633,1.633 0,1 1,-3.265 0v-9.8A1.633,1.633 0,0 1,32 30.375ZM32,22.212a1.633,1.633 0,0 1,1.633 1.633v3.265a1.633,1.633 0,1 1,-3.265 0L30.368,23.841A1.633,1.633 0,0 1,32 22.208Z" />
         } />
    )
};

const ICON_MAP: Record<string, React.ElementType> = {
    'utensils-crossed': UtensilsCrossed,
    'bus': Bus,
    'gamepad-2': Gamepad2,
    'bandaid': Bandage,
    'shopping-bag': ShoppingBag,
    'plane': Plane,
    'wifi': Wifi,
    'notebook': Notebook,
    'gift': Gift,
    'circle-dot': CircleDot
};

const CategoryIcon = ({ iconName, className }: { iconName: string, className?: string }) => {
    switch (iconName) {
        case 'fooddrink': return <Icons.Food className={className} />;
        case 'groceries': return <Icons.Groceries className={className} />;
        case 'shopping': return <Icons.Shopping className={className} />;
        case 'health': return <Icons.Health className={className} />;
        case 'transport': return <Icons.Location className={className} />;
        case 'bills': return <Icons.Bills className={className} />;
        case 'education': return <Icons.Education className={className} />;
        case 'game': return <Icons.Game className={className} />;
        case 'gift': return <Icons.Gift className={className} />;
        case 'leaf': return <Icons.Investment className={className} />;
        case 'cash': return <Icons.Cash className={className} />;
        case 'bank': return <Icons.Bank className={className} />;
        case 'crypto': return <Icons.Crypto className={className} />;
        default: return <CircleDot className={className} />;
    }
};


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

const normalizeCategory = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('transport') || lower.includes('travel')) return 'Transportation';
    if (lower.includes('health') || lower.includes('med')) return 'Healthcare';
    if (lower.includes('bill') || lower.includes('util')) return 'Utilities';
    if (lower.includes('food') || lower.includes('grocery') || lower.includes('dining')) return 'Food';
    if (lower.includes('shop')) return 'Shopping';
    if (lower.includes('entertain') || lower.includes('movie')) return 'Entertainment';
    return catName;
};

// --- Reusable Ivy Components ---

const IvyButton = ({ onClick, children, variant = 'primary', className = '' }: any) => {
    const base = "relative px-6 py-4 rounded-[20px] font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2";
    const bg = variant === 'primary' ? IVY_GRADIENTS.primary : 
               variant === 'green' ? IVY_GRADIENTS.green : 
               variant === 'red' ? IVY_GRADIENTS.red : 'bg-slate-800 dark:bg-slate-700';
    const shadow = variant === 'primary' ? 'shadow-[#6B4DFF]/30' : 
                   variant === 'green' ? 'shadow-[#14CC9E]/30' : 
                   variant === 'red' ? 'shadow-[#E62E2E]/30' : '';
    
    return (
        <button onClick={onClick} className={`${base} ${bg} ${shadow} ${className}`}>
            {children}
        </button>
    );
};

const AccountCard = ({ name, type, amount, currency, onEdit, gradient, icon: Icon }: any) => {
    return (
        <div 
            onClick={onEdit} 
            className={`
                p-6 rounded-[32px] min-w-[260px] h-[160px] flex flex-col justify-between cursor-pointer 
                transition-all hover:scale-[1.02] active:scale-95 text-white relative overflow-hidden group ${gradient} shadow-xl
            `}
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{type}</span>
                    <span className="text-lg font-bold mt-0.5">{name}</span>
                </div>
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    {Icon ? <Icon className="w-5 h-5 text-white" /> : <CreditCard size={18} />}
                </div>
            </div>

            <div className="relative z-10">
                <div className="text-3xl font-black tracking-tight">{currency}{amount.toLocaleString()}</div>
            </div>

            {/* Decorative Custom Icon Background */}
            <div className="absolute -right-6 -bottom-8 w-32 h-32 opacity-10 pointer-events-none rotate-12">
               {Icon ? <Icon className="w-full h-full text-white" /> : <CreditCard className="w-full h-full text-white" />}
            </div>
        </div>
    );
};

const FinanceView: React.FC<FinanceViewProps> = ({ 
    transactions = [], onAddTransaction, onUpdateTransaction, onDeleteTransaction, onMenuClick, onAddTransactions,
    debtors = [], debts = [], onAddDebtor, onAddDebt,
    goals = [], onAddGoal, onUpdateGoal, onDeleteGoal,
    subscriptions = [], onAddSubscription, onDeleteSubscription,
    investments = [], onAddInvestment, onUpdateInvestment, onDeleteInvestment,
    user, partnerTransactions = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'assets'>('overview');
  const [showInput, setShowInput] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Workspace Toggle
  const [workspaceMode, setWorkspaceMode] = useState<'personal' | 'joint'>('personal');

  // Filters
  const [txnFilterType, setTxnFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [txnSearch, setTxnSearch] = useState('');
  const [excludeCategories, setExcludeCategories] = useState<string[]>([]);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [currency, setCurrency] = useState(() => loadFromStorage('finance_currency', { code: 'INR', symbol: '₹' }));
  const [isReadingSms, setIsReadingSms] = useState(false);
  
  // Modals & Sheets
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showGoalDeposit, setShowGoalDeposit] = useState<{ id: string, name: string } | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  
  const [showDebtorModal, setShowDebtorModal] = useState(false);
  const [showDebtRecordModal, setShowDebtRecordModal] = useState<{ debtorId: string, name: string } | null>(null);
  
  const [showSubModal, setShowSubModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<{name: string, type: string, current: number} | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  // Form States
  const [debtorName, setDebtorName] = useState('');
  const [debtType, setDebtType] = useState<'Borrow' | 'Lend'>('Lend');
  const [debtAmountVal, setDebtAmountVal] = useState('');
  const [debtDesc, setDebtDesc] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalColor, setGoalColor] = useState(PALETTE.ivy);
  
  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState('');
  const [subPeriod, setSubPeriod] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [subStartDate, setSubStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invType, setInvType] = useState<'Stock' | 'Crypto' | 'Mutual Fund' | 'Gold' | 'Real Estate' | 'Other'>('Stock');

  const [amount, setAmount] = useState('');
  const [personalShare, setPersonalShare] = useState(''); // Split: My Share
  const [isSplit, setIsSplit] = useState(false); // Toggle split mode

  const [merchant, setMerchant] = useState('');
  const [type, setType] = useState<'credit'|'debit'>('debit');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSharedTransaction, setIsSharedTransaction] = useState(false);
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([]);

  // Autocomplete
  useEffect(() => {
      if (merchant.length > 1) {
          const uniqueMerchants: string[] = Array.from(new Set(transactions.map(t => t.merchant)));
          const filtered = uniqueMerchants.filter(m => m.toLowerCase().includes(merchant.toLowerCase()) && m !== merchant).slice(0, 3);
          setMerchantSuggestions(filtered);
      } else {
          setMerchantSuggestions([]);
      }
  }, [merchant, transactions]);

  // Load Edit Data
  useEffect(() => {
      if (editingTransaction) {
          setAmount(editingTransaction.amount.toString());
          if (editingTransaction.personalShare !== undefined) {
             setPersonalShare(editingTransaction.personalShare.toString());
             setIsSplit(true);
          } else {
             setPersonalShare('');
             setIsSplit(false);
          }
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
          setGoalColor(editingGoal.color);
          setShowGoalModal(true);
      }
  }, [editingGoal]);

  const resetForm = () => {
      setAmount(''); setMerchant(''); setNotes('');
      setEntryDate(format(new Date(), 'yyyy-MM-dd'));
      setPaymentMethod('Cash');
      setIsSharedTransaction(workspaceMode === 'joint');
      setEditingTransaction(null);
      setIsSplit(false);
      setPersonalShare('');
  };

  const resetGoalForm = () => {
      setGoalName(''); setGoalTarget(''); setGoalCurrent('0');
      setGoalColor(PALETTE.ivy);
      setEditingGoal(null);
  };

  const formatCurrency = (val: number) => {
      return val.toLocaleString('en-US', { style: 'currency', currency: currency.code, maximumFractionDigits: 0 });
  };

  // --- Workspace Logic ---
  const activeTransactions = useMemo(() => {
      if (workspaceMode === 'joint') {
          return [...transactions, ...partnerTransactions];
      }
      return transactions;
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
          else {
              // If it's an expense, use personal share if available for analytics
              expense += (t.personalShare !== undefined ? t.personalShare : t.amount);
          }
      });
      
      return { income, expense, balance: income - expense };
  }, [allTransactionsSorted, currentMonth, excludeCategories]);

  const categoryAnalysis = useMemo(() => {
      const data: Record<string, number> = {};
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      allTransactionsSorted.forEach(t => {
          if (t.type === 'debit' && !t.exclude_from_budget && isWithinInterval(parseISO(t.date), { start, end })) {
              const normCat = normalizeCategory(t.category);
              const val = t.personalShare !== undefined ? t.personalShare : t.amount;
              data[normCat] = (data[normCat] || 0) + val;
          }
      });
      
      return Object.entries(data)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
  }, [allTransactionsSorted, currentMonth]);

  const accountBalances = useMemo(() => {
      const acc = { cash: 0, bank: 0, credit: 0 };
      allTransactionsSorted.forEach(t => {
          // For balance calculations, always use the full amount leaving the account
          const val = t.type === 'credit' ? t.amount : -t.amount;
          if (t.payment_method === 'Cash') acc.cash += val;
          else if (t.payment_method === 'Credit Card') acc.credit += val; 
          else acc.bank += val; 
      });
      return acc;
  }, [allTransactionsSorted]);

  const totalBalance = accountBalances.cash + accountBalances.bank + accountBalances.credit;

  // Actions
  const handleManualSubmit = () => {
      if (!amount || !merchant) return;
      const amtVal = parseFloat(amount);
      if(isNaN(amtVal)) return;

      const personalShareVal = isSplit && personalShare ? parseFloat(personalShare) : undefined;

      const txData: Transaction = {
          id: editingTransaction ? editingTransaction.id : Date.now().toString(),
          is_transaction: true,
          amount: amtVal,
          personalShare: personalShareVal,
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

  const handleSmsSync = async () => {
      if (!Capacitor.isNativePlatform()) {
          alert("SMS Sync is available on mobile only.");
          return;
      }
      
      setIsReadingSms(true);
      try {
          const msgs = await readRecentSms(100);
          const newTxns: Transaction[] = [];
          const existingSmsBodies = new Set(transactions.map(t => t.raw_sms).filter(b => !!b));
          
          for (const msg of msgs) {
              if (existingSmsBodies.has(msg.body)) continue;
              
              const parsed = parseBankingSms(msg);
              if (parsed) {
                  const normalizedCat = normalizeCategory(parsed.category || 'Other');
                  const txn: Transaction = {
                      id: `sms-${msg.id}-${Date.now()}`,
                      is_transaction: true,
                      amount: parsed.amount || 0,
                      type: parsed.type || 'debit',
                      merchant: parsed.merchant || 'Unknown',
                      category: normalizedCat,
                      date: parsed.date || format(new Date(), 'yyyy-MM-dd'),
                      time: parsed.time,
                      payment_method: parsed.payment_method || 'Other',
                      raw_sms: msg.body,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      paidBy: user?.uid
                  };
                  newTxns.push(txn);
                  existingSmsBodies.add(msg.body);
              }
          }
          
          if (newTxns.length > 0) {
              if (onAddTransactions) onAddTransactions(newTxns);
              alert(`Synced ${newTxns.length} new transactions.`);
          } else {
              alert("No new transactions found.");
          }
      } catch (error) {
          console.error("SMS Sync Error", error);
          alert("Failed to sync SMS. Check permissions.");
      } finally {
          setIsReadingSms(false);
      }
  };

  const handleSaveGoal = () => { if (goalName && goalTarget) { const g = { id: editingGoal?.id || Date.now().toString(), name: goalName, targetAmount: parseFloat(goalTarget), currentAmount: parseFloat(goalCurrent)||0, color: goalColor, icon: 'target', createdAt: new Date() }; editingGoal ? onUpdateGoal?.(g) : onAddGoal?.(g); setShowGoalModal(false); resetGoalForm(); } };
  const handleDeposit = () => { if(showGoalDeposit && depositAmount) { const g = goals.find(x=>x.id===showGoalDeposit.id); if(g){ onUpdateGoal?.({...g, currentAmount: g.currentAmount + parseFloat(depositAmount)}); onAddTransaction({id: Date.now().toString(), is_transaction: true, amount: parseFloat(depositAmount), type: 'debit', merchant: `Savings: ${g.name}`, category: 'Savings', date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer', raw_sms: '', createdAt: new Date()}); } setShowGoalDeposit(null); setDepositAmount(''); } };
  const handleAddDebtor = () => { if(debtorName) { onAddDebtor?.({id: Date.now().toString(), name: debtorName, type: 'Person', createdAt: new Date()}); setDebtorName(''); setShowDebtorModal(false); } };
  const handleAddDebtRecord = () => { if(showDebtRecordModal && debtAmountVal) { onAddDebt?.({id: Date.now().toString(), debtorId: showDebtRecordModal.debtorId, amount: parseFloat(debtAmountVal), type: debtType, description: debtDesc, date: format(new Date(), 'yyyy-MM-dd'), createdAt: new Date()}); setDebtAmountVal(''); setDebtDesc(''); setShowDebtRecordModal(null); } };
  const handleAddSubscription = () => { if(subName && subPrice) { onAddSubscription?.({id: Date.now().toString(), name: subName, price: parseFloat(subPrice), period: subPeriod, startDate: subStartDate, isActive: true, createdAt: new Date()}); setShowSubModal(false); setSubName(''); setSubPrice(''); } };
  const handleAddInvestment = () => { if(invName && invAmount) { onAddInvestment?.({id: Date.now().toString(), name: invName, units: 1, avgPrice: parseFloat(invAmount), type: invType, date: format(new Date(), 'yyyy-MM-dd'), createdAt: new Date()}); setShowInvModal(false); setInvName(''); setInvAmount(''); } };

  // --- Renderers ---

  const renderOverview = () => (
      <div className="space-y-6 animate-in fade-in pb-20 p-4">
          <div className="flex justify-center mb-2">
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[20px] flex relative shadow-sm border border-slate-100 dark:border-slate-800">
                  <button onClick={() => setWorkspaceMode('personal')} className={`px-6 py-2 rounded-[16px] text-xs font-bold transition-all z-10 ${workspaceMode === 'personal' ? 'bg-[#6B4DFF] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Personal</button>
                  <button onClick={() => setWorkspaceMode('joint')} className={`px-6 py-2 rounded-[16px] text-xs font-bold transition-all z-10 flex items-center gap-1 ${workspaceMode === 'joint' ? 'bg-[#6B4DFF] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Heart size={12} fill="currentColor" /> Joint</button>
              </div>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
               {/* Total Balance Card */}
               <div className={`p-6 rounded-[32px] min-w-[280px] snap-center text-white shadow-xl shadow-[#6B4DFF]/30 relative overflow-hidden flex flex-col justify-between h-[180px] ${IVY_GRADIENTS.primary}`}>
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={100} /></div>
                   <div className="relative z-10">
                       <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">Total Balance</span>
                       <div className="text-4xl font-black mt-4 tracking-tight">{formatCurrency(totalBalance)}</div>
                   </div>
                   <div className="relative z-10 flex gap-3 mt-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 flex-1 border border-white/10">
                            <div className="text-[10px] opacity-70 font-bold uppercase flex items-center gap-1 text-emerald-300"><ArrowDownCircle size={10}/> Income</div>
                            <div className="font-bold text-sm">{formatCurrency(stats.income)}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 flex-1 border border-white/10">
                            <div className="text-[10px] opacity-70 font-bold uppercase flex items-center gap-1 text-red-300"><ArrowUpCircle size={10}/> Expense</div>
                            <div className="font-bold text-sm">{formatCurrency(stats.expense)}</div>
                        </div>
                   </div>
               </div>

               {/* Accounts Horizontal Scroll */}
               <AccountCard name="Cash" type="Cash" amount={accountBalances.cash} currency={currency.symbol} onEdit={() => setAdjustAccount({ name: 'Cash', type: 'Cash', current: accountBalances.cash })} gradient={IVY_GRADIENTS.orange} icon={Icons.Cash} />
               <AccountCard name="Bank" type="Bank" amount={accountBalances.bank} currency={currency.symbol} onEdit={() => setAdjustAccount({ name: 'Bank', type: 'Bank', current: accountBalances.bank })} gradient={IVY_GRADIENTS.green} icon={Icons.Bank} />
               <AccountCard name="Cards" type="Credit Card" amount={accountBalances.credit} currency={currency.symbol} onEdit={() => setAdjustAccount({ name: 'Credit Card', type: 'Credit Card', current: accountBalances.credit })} gradient={IVY_GRADIENTS.red} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><PieIcon size={18} className="text-[#6B4DFF]"/> Monthly Spending</h3>
                  <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all shadow-sm"><ChevronLeft size={16}/></button>
                      <span className="text-xs font-bold px-3 py-1.5 text-slate-700 dark:text-slate-300">{format(currentMonth, 'MMM')}</span>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all shadow-sm"><ChevronRight size={16}/></button>
                  </div>
              </div>
              
              <div className="flex flex-col gap-6">
                  <div className="h-48 relative w-full flex justify-center">
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
                                      cornerRadius={8}
                                      stroke="none"
                                  >
                                      {categoryAnalysis.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                      ))}
                                  </Pie>
                              </PieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-medium">No spending data</div>
                      )}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                          <span className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(stats.expense)}</span>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                      {categoryAnalysis.slice(0, 4).map((cat, i) => (
                          <div key={cat.name} className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1">{cat.name}</span>
                              <div className="flex flex-col items-end">
                                  <span className="text-xs font-black text-slate-800 dark:text-white">{formatCurrency(cat.value)}</span>
                                  <span className="text-[10px] font-bold text-slate-400">{Math.round((cat.value / stats.expense) * 100)}%</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderTransactions = () => (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
          <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
             <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 flex items-center px-4 py-3 rounded-[20px] gap-2 flex-1 focus-within:ring-2 focus-within:ring-[#6B4DFF]/20 transition-all">
                      <Search size={18} className="text-slate-400" />
                      <input 
                        value={txnSearch} 
                        onChange={(e) => setTxnSearch(e.target.value)} 
                        placeholder="Search..." 
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400"
                      />
                  </div>
                  <button 
                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[20px] hover:text-[#6B4DFF] transition-colors"
                    onClick={() => {
                        const next = txnFilterType === 'all' ? 'debit' : txnFilterType === 'debit' ? 'credit' : 'all';
                        setTxnFilterType(next);
                    }}
                  >
                      <Filter size={20} className={txnFilterType !== 'all' ? 'text-[#6B4DFF]' : ''} />
                  </button>
                  {Capacitor.isNativePlatform() && (
                      <button 
                        onClick={handleSmsSync} 
                        disabled={isReadingSms}
                        className="p-3 bg-blue-50 text-blue-600 rounded-[20px] hover:bg-blue-100 transition-colors"
                      >
                          {isReadingSms ? <Loader2 size={20} className="animate-spin"/> : <MessageSquare size={20} />}
                      </button>
                  )}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-24">
              {groupedTransactions.map(([date, txns]) => (
                  <div key={date} className="animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-3 mb-3 pl-2">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{format(parseISO(date), 'MMM d')}</h3>
                          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                          <span className="text-[10px] font-bold text-slate-300">{format(parseISO(date), 'EEEE')}</span>
                      </div>
                      <div className="space-y-3">
                          {txns.map((t, i) => (
                              <div key={t.id} onClick={() => setEditingTransaction(t)} className="bg-white dark:bg-slate-900 rounded-[24px] p-4 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all">
                                  <div className="flex items-center gap-4 overflow-hidden">
                                      <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-slate-500 shrink-0 ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                          <CategoryIcon iconName={DEFAULT_CATEGORIES.find(c => c.name === normalizeCategory(t.category))?.icon || 'circle-dot'} className="w-6 h-6" />
                                      </div>
                                      <div className="min-w-0">
                                          <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{t.merchant}</div>
                                          <div className="text-[11px] text-slate-400 font-bold mt-0.5">{t.category}</div>
                                          {t.personalShare !== undefined && t.personalShare !== t.amount && (
                                              <div className="text-[10px] text-blue-500 font-bold mt-0.5 flex items-center gap-1">
                                                  <Split size={10} /> My share: {formatCurrency(t.personalShare)}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  <span className={`font-black text-sm whitespace-nowrap ${t.type === 'credit' ? 'text-[#14CC9E]' : 'text-slate-900 dark:text-white'}`}>
                                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
              {groupedTransactions.length === 0 && (
                  <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-300">
                          <Search size={32}/>
                      </div>
                      <p className="text-sm font-bold">No transactions found</p>
                  </div>
              )}
          </div>
      </div>
  );

  const renderAssets = () => (
      <div className="p-4 space-y-8 pb-24">
          
          {/* Goals Section */}
          {goals.length > 0 && (
              <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Saving Goals</h3>
                  <div className="space-y-4">
                      {goals.map(goal => {
                           const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                           return (
                               <div key={goal.id} onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform">
                                  <div className="flex justify-between items-center mb-4 relative z-10">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-md" style={{ backgroundColor: goal.color }}>
                                              <Target size={22} />
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-900 dark:text-white">{goal.name}</div>
                                              <div className="text-xs text-slate-500 font-bold mt-0.5">{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}</div>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setShowGoalDeposit({ id: goal.id, name: goal.name }); }}
                                        className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-[#6B4DFF] hover:text-white transition-colors"
                                      >
                                          <Plus size={18}/>
                                      </button>
                                  </div>
                                  
                                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progress}%`, backgroundColor: goal.color }}>
                                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                      </div>
                                  </div>
                                  <div className="mt-2 text-right text-[10px] font-black text-slate-400">{progress}% Completed</div>
                               </div>
                           );
                      })}
                  </div>
              </div>
          )}
          
          <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-[24px] text-slate-400 font-bold hover:border-[#6B4DFF] hover:text-[#6B4DFF] hover:bg-[#6B4DFF]/5 transition-all flex items-center justify-center gap-2 group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform"/> Create New Goal
          </button>

          {/* Investments Section (NEW) */}
          <div>
              <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Investments</h3>
                  <button onClick={() => setShowInvModal(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-orange-500 transition-colors">
                      <Plus size={16} />
                  </button>
              </div>
              
              <div className="space-y-3">
                  {investments.map(inv => (
                      <div key={inv.id} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative group cursor-pointer hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-[18px] flex items-center justify-center">
                                  <Icons.Crypto className="w-6 h-6" />
                              </div>
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">{inv.name}</div>
                                  <div className="text-[10px] text-slate-500 font-bold uppercase">{inv.type} • {inv.units} units</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(inv.avgPrice * inv.units)}</div>
                              <div className="text-[10px] text-emerald-500 mt-0.5 font-bold flex items-center justify-end gap-1">
                                  <TrendingUp size={10} /> +0.00%
                              </div>
                          </div>
                          <button onClick={() => onDeleteInvestment?.(inv.id)} className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} />
                          </button>
                      </div>
                  ))}
                  {investments.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-900 rounded-[24px]">No investments tracked</div>
                  )}
              </div>
          </div>

          {/* Subscriptions Section */}
          <div>
              <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Subscriptions</h3>
                  <button onClick={() => setShowSubModal(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-blue-500 transition-colors">
                      <Plus size={16} />
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subscriptions.map(sub => (
                      <div key={sub.id} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative group">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center">
                                  <RefreshCw size={18} />
                              </div>
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">{sub.name}</div>
                                  <div className="text-[10px] text-slate-500 font-bold uppercase">{sub.period}</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(sub.price)}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Next: {format(addMonths(parseISO(sub.startDate), 1), 'MMM d')}</div>
                          </div>
                          <button onClick={() => onDeleteSubscription?.(sub.id)} className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} />
                          </button>
                      </div>
                  ))}
              </div>
              {subscriptions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-900 rounded-[24px]">No active subscriptions</div>
              )}
          </div>

          {/* Debts Section */}
          <div>
              <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lending & Borrowing</h3>
                  <button onClick={() => setShowDebtorModal(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-emerald-500 transition-colors">
                      <Plus size={16} />
                  </button>
              </div>

              <div className="space-y-3">
                  {debtors.map(debtor => {
                      const debtorTxns = debts.filter(d => d.debtorId === debtor.id);
                      const netAmount = debtorTxns.reduce((acc, curr) => {
                          return curr.type === 'Lend' ? acc + curr.amount : acc - curr.amount;
                      }, 0);
                      
                      return (
                          <div key={debtor.id} onClick={() => setShowDebtRecordModal({ debtorId: debtor.id, name: debtor.name })} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm">
                                      <Users size={18} />
                                  </div>
                                  <div className="font-bold text-slate-900 dark:text-white">{debtor.name}</div>
                              </div>
                              <div className={`font-black text-sm ${netAmount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {netAmount >= 0 ? 'You are owed' : 'You owe'} {formatCurrency(Math.abs(netAmount))}
                              </div>
                          </div>
                      );
                  })}
                  {debtors.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-900 rounded-[24px]">No debt records</div>
                  )}
              </div>
          </div>

      </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4 pointer-events-none">
            <div className="h-16 flex items-center justify-between pointer-events-auto">
                 <div className="flex items-center gap-3">
                    {onMenuClick && (
                        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-white/50 rounded-full transition-colors md:hidden">
                            <Menu size={20}/>
                        </button>
                    )}
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Finance</h1>
                </div>
                <button onClick={() => setShowInput(true)} className={`p-3 rounded-full shadow-lg shadow-[#6B4DFF]/30 text-white hover:scale-110 active:scale-95 transition-all ${IVY_GRADIENTS.primary}`}>
                    <Plus size={24} strokeWidth={2.5}/>
                </button>
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-6 pb-4 z-10">
            <div className="flex justify-between items-center relative">
                 {(['overview', 'transactions', 'assets'] as const).map(tab => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 px-2 text-sm font-bold capitalize transition-colors relative ${activeTab === tab ? 'text-[#6B4DFF]' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                         {tab}
                         {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6B4DFF] rounded-t-full" />}
                     </button>
                 ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'assets' && renderAssets()}
        </div>

        {/* Transaction Modal */}
        {showInput && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in" onClick={() => setShowInput(false)}>
                <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingTransaction ? 'Edit Record' : 'New Record'}</h3>
                        <button onClick={() => setShowInput(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20}/></button>
                    </div>

                    <div className="space-y-6">
                        {/* Type Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px]">
                            <button onClick={() => { setType('debit'); setIsSplit(false); }} className={`flex-1 py-3 rounded-[16px] text-sm font-bold transition-all ${type === 'debit' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}>Expense</button>
                            <button onClick={() => { setType('credit'); setIsSplit(false); }} className={`flex-1 py-3 rounded-[16px] text-sm font-bold transition-all ${type === 'credit' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}>Income</button>
                        </div>

                        {/* Amount & Merchant */}
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">{currency.symbol}</span>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)} 
                                        placeholder={isSplit ? "Total Bill" : "0.00"}
                                        className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-[24px] outline-none text-2xl font-black text-slate-900 dark:text-white placeholder-slate-300 focus:ring-2 focus:ring-[#6B4DFF]/20 transition-all"
                                        autoFocus 
                                    />
                                    {isSplit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Total</span>}
                                </div>
                                
                                {isSplit && (
                                    <div className="flex-1 relative animate-in fade-in slide-in-from-right">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">{currency.symbol}</span>
                                        <input 
                                            type="number" 
                                            value={personalShare} 
                                            onChange={(e) => setPersonalShare(e.target.value)} 
                                            placeholder="My Part" 
                                            className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-[24px] outline-none text-2xl font-black text-slate-900 dark:text-white placeholder-slate-300 focus:ring-2 focus:ring-[#6B4DFF]/20 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 uppercase">My Share</span>
                                    </div>
                                )}
                            </div>

                            {type === 'debit' && (
                                <div className="flex items-center gap-2 px-2">
                                    <button 
                                        onClick={() => setIsSplit(!isSplit)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${isSplit ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
                                    >
                                        <Split size={14} /> Split Bill
                                    </button>
                                </div>
                            )}
                            
                            <div className="relative">
                                <input 
                                    value={merchant} 
                                    onChange={(e) => setMerchant(e.target.value)} 
                                    placeholder="Title / Merchant" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#6B4DFF]/20 transition-all text-lg" 
                                />
                                {merchantSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-[20px] shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden p-1">
                                        {merchantSuggestions.map((m, i) => (
                                            <div key={i} onClick={() => { setMerchant(m); setMerchantSuggestions([]); }} className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer rounded-xl">{m}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Grid */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Category</label>
                            <div className="grid grid-cols-5 gap-3 max-h-36 overflow-y-auto custom-scrollbar p-1">
                                {DEFAULT_CATEGORIES.map(cat => {
                                    const IconComp = ICON_MAP[cat.icon] || CircleDot;
                                    const isSelected = category === cat.name;
                                    return (
                                        <button 
                                            key={cat.name} 
                                            onClick={() => setCategory(cat.name)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-[18px] gap-1 transition-all ${isSelected ? 'bg-[#6B4DFF]/10 text-[#6B4DFF] ring-2 ring-[#6B4DFF]' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
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
                            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-[16px] outline-none font-bold text-sm text-slate-700 dark:text-slate-200" />
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-[16px] outline-none font-bold text-sm text-slate-700 dark:text-slate-200 appearance-none">
                                <option>Cash</option>
                                <option>Card</option>
                                <option>Bank</option>
                                <option>UPI</option>
                            </select>
                        </div>

                        <IvyButton onClick={handleManualSubmit} className="w-full">
                            {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                        </IvyButton>
                        
                        {editingTransaction && (
                            <button onClick={() => { onDeleteTransaction(editingTransaction.id); setShowInput(false); }} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[20px] transition-colors text-sm">
                                Delete Transaction
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Goal Modal */}
        {showGoalModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowGoalModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Savings Goal</h3>
                    <div className="space-y-4">
                        <input value={goalName} onChange={(e) => setGoalName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Goal Name" />
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency.symbol}</span>
                            <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Target Amount" />
                        </div>
                        
                        <div className="grid grid-cols-6 gap-2 py-2">
                            {[PALETTE.ivy, PALETTE.green, PALETTE.orange, PALETTE.red, PALETTE.purple, PALETTE.blue].map(c => (
                                <button key={c} onClick={() => setGoalColor(c)} className={`w-10 h-10 rounded-full transition-transform ${goalColor === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-current' : 'opacity-50 hover:opacity-100'}`} style={{ backgroundColor: c, color: c }} />
                            ))}
                        </div>

                        <IvyButton onClick={handleSaveGoal} className="w-full">Save Goal</IvyButton>
                    </div>
                </div>
            </div>
        )}

        {/* Subscription Modal */}
        {showSubModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowSubModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">New Subscription</h3>
                    <div className="space-y-4">
                        <input autoFocus value={subName} onChange={(e) => setSubName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Service Name (e.g. Netflix)" />
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency.symbol}</span>
                            <input type="number" value={subPrice} onChange={(e) => setSubPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Price" />
                        </div>
                        <div className="flex gap-3">
                            <select value={subPeriod} onChange={(e) => setSubPeriod(e.target.value as any)} className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-sm text-slate-700 dark:text-slate-200">
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                            <input type="date" value={subStartDate} onChange={(e) => setSubStartDate(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-sm text-slate-700 dark:text-slate-200" />
                        </div>
                        <IvyButton onClick={handleAddSubscription} className="w-full">Save Subscription</IvyButton>
                    </div>
                </div>
            </div>
        )}

        {/* Investment Modal */}
        {showInvModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowInvModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Add Investment</h3>
                    <div className="space-y-4">
                        <input autoFocus value={invName} onChange={(e) => setInvName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Asset Name (e.g. Bitcoin)" />
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency.symbol}</span>
                            <input type="number" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Amount / Price" />
                        </div>
                        <select value={invType} onChange={(e) => setInvType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-sm text-slate-700 dark:text-slate-200 appearance-none">
                            <option>Stock</option>
                            <option>Crypto</option>
                            <option>Mutual Fund</option>
                            <option>Gold</option>
                            <option>Real Estate</option>
                            <option>Other</option>
                        </select>
                        <IvyButton onClick={handleAddInvestment} className="w-full">Save Investment</IvyButton>
                    </div>
                </div>
            </div>
        )}

        {/* Debtor Modal */}
        {showDebtorModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowDebtorModal(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Add Person</h3>
                    <input autoFocus value={debtorName} onChange={(e) => setDebtorName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400 mb-6" placeholder="Name" />
                    <IvyButton onClick={handleAddDebtor} className="w-full">Save Person</IvyButton>
                </div>
            </div>
        )}

        {/* Debt Record Modal */}
        {showDebtRecordModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowDebtRecordModal(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">New Record</h3>
                    <p className="text-sm text-slate-500 font-bold mb-6">With {showDebtRecordModal.name}</p>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px] mb-6">
                        <button onClick={() => setDebtType('Lend')} className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all ${debtType === 'Lend' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>I Gave</button>
                        <button onClick={() => setDebtType('Borrow')} className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all ${debtType === 'Borrow' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>I Took</button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{currency.symbol}</span>
                            <input type="number" autoFocus value={debtAmountVal} onChange={(e) => setDebtAmountVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-4 rounded-[20px] outline-none text-2xl font-black text-slate-900 dark:text-white placeholder-slate-300" placeholder="0" />
                        </div>
                        <input value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-[20px] outline-none font-bold text-slate-900 dark:text-white placeholder-slate-400" placeholder="Description (Optional)" />
                    </div>

                    <IvyButton onClick={handleAddDebtRecord} className="w-full">Save Record</IvyButton>
                </div>
            </div>
        )}

        {/* Deposit Modal */}
        {showGoalDeposit && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowGoalDeposit(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 bg-[#6B4DFF]/10 text-[#6B4DFF] rounded-full flex items-center justify-center mx-auto mb-4">
                        <PiggyBank size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Add Money</h3>
                    <p className="text-sm text-slate-500 font-bold mb-6">To {showGoalDeposit.name}</p>
                    
                    <div className="relative mb-6">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">{currency.symbol}</span>
                        <input type="number" autoFocus value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 pl-14 pr-6 py-5 rounded-[24px] outline-none text-4xl font-black text-slate-900 dark:text-white text-center" placeholder="0" />
                    </div>
                    <IvyButton onClick={handleDeposit} className="w-full">Deposit</IvyButton>
                </div>
            </div>
        )}

        {/* Balance Adjust Modal */}
        {adjustAccount && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setAdjustAccount(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Adjust Balance</h3>
                    <p className="text-sm text-slate-500 font-bold mb-6">Set current value for {adjustAccount.name}</p>
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[24px] mb-6 border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(adjustAccount.current)}</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-[24px] mb-6 flex items-center gap-2 border-2 border-[#6B4DFF]/20 focus-within:border-[#6B4DFF] transition-colors">
                        <span className="text-2xl font-bold text-[#6B4DFF]">{currency.symbol}</span>
                        <input 
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            className="bg-transparent text-3xl font-black text-slate-900 dark:text-white w-full outline-none"
                            placeholder={adjustAccount.current.toString()}
                            autoFocus
                        />
                    </div>
                    
                    <IvyButton onClick={handleAdjustBalance} className="w-full">Update Balance</IvyButton>
                </div>
            </div>
        )}

    </div>
  );
};

export default FinanceView;
