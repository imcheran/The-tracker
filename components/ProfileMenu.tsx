
import React from 'react';
import { X, User, LogOut, LogIn, RefreshCw } from 'lucide-react';

interface ProfileMenuProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onSettings: () => void;
  onSync?: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onClose, onLogout, onLogin, onSettings, onSync }) => {
  return (
    <div 
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
    >
        <div 
            className="w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl animate-in scale-in duration-200"
            onClick={e => e.stopPropagation()}
        >
            {/* Header / Account Status */}
            <div className="p-6 flex flex-col items-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                </button>

                <div className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-800 mb-4 overflow-hidden shadow-lg relative bg-slate-100 dark:bg-slate-800">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User size={48} />
                        </div>
                    )}
                </div>

                <div className="text-center w-full">
                    <div className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        {user?.displayName || 'Guest'}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate mb-6">
                        {user?.email || 'Sign in to sync your tasks'}
                    </div>
                    
                    {user ? (
                        <div className="w-full space-y-2">
                            <button 
                                onClick={onSync}
                                className="w-full py-3 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Sync Now
                            </button>
                            <button 
                                onClick={onLogout}
                                className="w-full py-3 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} />
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onLogin}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <LogIn size={18} />
                            Sign in with Google
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={onSettings}
                    className="w-full py-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    Settings
                </button>
                <div className="flex justify-center gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase transition-colors">Privacy</button>
                    <span className="text-slate-300">•</span>
                    <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase transition-colors">Terms</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileMenu;
