
import React, { useState } from 'react';
import { ArrowLeft, Moon, Sun, Bell, CheckCircle2, LogOut, LogIn, Calendar, Target, Clock, Notebook, Wallet, Heart, X, User, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';

export const ProfileMenu: React.FC<{ user: any; onClose: () => void; onLogout: () => void; onLogin: () => void; onSettings: () => void; }> = ({ user, onClose, onLogout, onLogin, onSettings }) => (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center"><div className="w-20 h-20 rounded-full bg-slate-200 mb-4 overflow-hidden">{user?.photoURL ? <img src={user.photoURL} className="w-full h-full"/> : <User size={40} className="m-auto mt-5 text-slate-400"/>}</div><div className="text-xl font-bold">{user?.displayName || 'Guest'}</div><div className="text-sm text-slate-500 mb-6">{user?.email}</div>{user ? <button onClick={onLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold">Sign Out</button> : <button onClick={onLogin} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Sign In</button>}</div>
            <button onClick={onSettings} className="w-full mt-4 py-3 border border-slate-200 rounded-xl font-bold">Settings</button>
        </div>
    </div>
);

const SettingsView: React.FC<{ onClose: () => void; settings: AppSettings; onUpdateSettings: (s: AppSettings) => void; theme: string; onThemeToggle: () => void; user?: any; onLogin: () => void; onLogout: () => void; }> = ({ onClose, settings, onUpdateSettings, theme, onThemeToggle, user, onLogin, onLogout }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col pt-safe animate-in slide-in-from-bottom">
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800"><button onClick={onClose}><ArrowLeft/></button><span className="font-bold ml-4 text-xl">Settings</span></div>
        <div className="p-4 space-y-6">
            <div><h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Account</h3><div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><span>{user ? user.email : 'Not signed in'}</span><button onClick={user ? onLogout : onLogin} className="text-blue-500 font-bold">{user ? 'Logout' : 'Login'}</button></div></div>
            <div><h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Appearance</h3><div onClick={onThemeToggle} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer"><span>Dark Mode</span>{theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}</div></div>
        </div>
    </div>
  );
};
export default SettingsView;
