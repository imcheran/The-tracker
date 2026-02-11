
import React, { useState } from 'react';
import { 
  ArrowLeft, Moon, Sun, Monitor, Bell, Globe, 
  ChevronRight, Check, MoveDown, LayoutList, Share2, Sparkles, CheckCircle2,
  Cloud, LogOut, LogIn, Calendar, Target, Clock, Notebook, Wallet, Heart, Copy
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onOpenCompletedTasks?: () => void;
  user?: any;
  onLogin: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    onClose, settings, onUpdateSettings, theme, onThemeToggle, onOpenCompletedTasks, user, onLogin, onLogout
}) => {
  const [partnerCode, setPartnerCode] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  // Fixed SectionHeader to correctly handle React children
  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="px-6 pt-6 pb-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
      {children}
    </h2>
  );

  const SettingRow = ({ 
      icon: Icon, label, value, onClick, description 
  }: { 
      icon: any, label: string, value?: React.ReactNode, onClick?: () => void, description?: string 
  }) => (
    <div 
        onClick={onClick}
        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
    >
        <div className="text-slate-500 dark:text-slate-400">
            <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-base font-medium text-slate-800 dark:text-slate-100">{label}</div>
            {description && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</div>}
        </div>
        {value !== undefined && <div>{value}</div>}
    </div>
  );

  const Switch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
      <button 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0 shadow-sm'}`} />
      </button>
  );

  const updateFeature = (feature: string, enabled: boolean) => {
      onUpdateSettings({
          ...settings,
          features: {
              ...settings.features,
              [feature]: enabled
          }
      });
  };

  const handleJoinHousehold = () => {
      if (!partnerCode.trim()) return;
      // Simulate linking
      onUpdateSettings({
          ...settings,
          couples: {
              ...settings.couples,
              partnerId: partnerCode,
              householdId: `house_${Date.now()}`
          }
      });
      setPartnerCode('');
      setShowInvite(false);
  };

  const handleUnlink = () => {
      if(window.confirm("Are you sure you want to unlink your partner? Shared view will be disabled.")) {
          onUpdateSettings({
              ...settings,
              couples: undefined
          });
      }
  };

  const copyMyCode = () => {
      if (user?.uid) {
          navigator.clipboard.writeText(user.uid);
          alert("Code copied! Share this with your partner.");
      } else {
          alert("Please sign in to generate a code.");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header - Safe Area Wrapper */}
        <div className="pt-safe border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="h-16 flex items-center px-4">
                <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold ml-4 text-slate-800 dark:text-white">Settings</h1>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-safe custom-scrollbar">
            <div className="max-w-2xl mx-auto">
                {/* Account Section */}
                <SectionHeader>Account</SectionHeader>
                <SettingRow 
                    icon={Cloud} 
                    label="Google Sync" 
                    description={user ? `Connected as ${user.email}` : "Sync tasks across devices"}
                    onClick={user ? undefined : onLogin}
                    value={
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                user ? onLogout() : onLogin();
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${user ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {user ? (
                                <>
                                    <LogOut size={12} /> Disconnect
                                </>
                            ) : (
                                <>
                                    <LogIn size={12} /> Connect
                                </>
                            )}
                        </button>
                    }
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-2" />

                {/* Couples Finance Section - NEW */}
                <SectionHeader>Couples Finance</SectionHeader>
                <div className="px-6 py-4">
                    {settings.couples?.partnerId ? (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full text-purple-600 dark:text-purple-300">
                                    <Heart size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">Partner Linked</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: {settings.couples.partnerId.substring(0,8)}...</div>
                                </div>
                            </div>
                            <button 
                                onClick={handleUnlink}
                                className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Unlink Partner
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Link accounts to track shared expenses and budget together.</p>
                            
                            {!showInvite ? (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowInvite(true)}
                                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
                                    >
                                        Link Partner
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Your Invite Code</label>
                                        <div className="flex gap-2 mt-1">
                                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono truncate text-slate-600 dark:text-slate-300">
                                                {user?.uid || "Sign in first"}
                                            </div>
                                            <button onClick={copyMyCode} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Enter Partner's Code</label>
                                        <div className="flex gap-2 mt-1">
                                            <input 
                                                value={partnerCode}
                                                onChange={(e) => setPartnerCode(e.target.value)}
                                                placeholder="Paste code here"
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
                                            />
                                            <button 
                                                onClick={handleJoinHousehold}
                                                disabled={!partnerCode}
                                                className="px-4 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                Link
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => setShowInvite(false)} className="text-xs text-slate-400 underline w-full text-center">Cancel</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-2" />

                {/* Modules/Features Section */}
                <SectionHeader>Modules</SectionHeader>
                <SettingRow 
                    icon={Calendar} 
                    label="Calendar" 
                    description="Schedule tasks and events"
                    value={<Switch checked={settings.features?.calendar ?? true} onChange={(v) => updateFeature('calendar', v)} />} 
                />
                <SettingRow 
                    icon={Target} 
                    label="Habits" 
                    description="Track daily routines and streaks"
                    value={<Switch checked={settings.features?.habits ?? true} onChange={(v) => updateFeature('habits', v)} />} 
                />
                <SettingRow 
                    icon={Clock} 
                    label="Focus Timer" 
                    description="Pomodoro timer and forest planting"
                    value={<Switch checked={settings.features?.focus ?? true} onChange={(v) => updateFeature('focus', v)} />} 
                />
                <SettingRow 
                    icon={Notebook} 
                    label="Notes" 
                    description="Capture ideas and lists"
                    value={<Switch checked={settings.features?.notes ?? true} onChange={(v) => updateFeature('notes', v)} />} 
                />
                <SettingRow 
                    icon={Wallet} 
                    label="Finance" 
                    description="Expense tracking and budgeting"
                    value={<Switch checked={settings.features?.finance ?? true} onChange={(v) => updateFeature('finance', v)} />} 
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-2" />

                {/* Lists & Data Section */}
                <SectionHeader>Smart Lists</SectionHeader>
                <SettingRow 
                    icon={CheckCircle2} 
                    label="Completed Tasks" 
                    description="View tasks you have finished"
                    onClick={() => { if (onOpenCompletedTasks) onOpenCompletedTasks(); }}
                    value={<ChevronRight size={18} className="text-slate-400" />}
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-2" />

                {/* Display Options Section */}
                <SectionHeader>Display options</SectionHeader>
                <SettingRow 
                    icon={MoveDown} 
                    label="Add new items to bottom" 
                    value={<Switch checked={true} onChange={() => {}} />} 
                />
                <SettingRow 
                    icon={LayoutList} 
                    label="Move checked items to bottom" 
                    value={<Switch checked={true} onChange={() => {}} />} 
                />
                <SettingRow 
                    icon={theme === 'dark' ? Moon : Sun} 
                    label="Theme" 
                    description={theme.charAt(0).toUpperCase() + theme.slice(1)}
                    onClick={onThemeToggle}
                    value={<ChevronRight size={18} className="text-slate-400" />}
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-2" />

                {/* Reminder Settings Section */}
                <SectionHeader>Reminders</SectionHeader>
                <SettingRow 
                    icon={Bell} 
                    label="Morning" 
                    description="08:00 AM"
                    value={<ChevronRight size={18} className="text-slate-400" />}
                />
                <SettingRow 
                    icon={Bell} 
                    label="Evening" 
                    description="06:00 PM"
                    value={<ChevronRight size={18} className="text-slate-400" />}
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-2" />

                {/* Labs / AI Section */}
                <SectionHeader>Labs</SectionHeader>
                <SettingRow 
                    icon={Sparkles} 
                    label="Gemini AI Assistant" 
                    description="Early access to AI-powered notes and lists"
                    value={<Switch checked={true} onChange={() => {}} />} 
                />

                <div className="py-12 text-center text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">
                    Version 1.4.3 (Tracker)
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;
