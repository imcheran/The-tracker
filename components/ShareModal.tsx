
import React, { useState } from 'react';
import { X, UserPlus, Mail, Check, User } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: string[];
  onUpdateCollaborators: (emails: string[]) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, collaborators, onUpdateCollaborators }) => {
  const [emailInput, setEmailInput] = useState('');

  const handleAdd = () => {
    if (emailInput && !collaborators.includes(emailInput)) {
      onUpdateCollaborators([...collaborators, emailInput]);
      setEmailInput('');
    }
  };

  const handleRemove = (email: string) => {
    onUpdateCollaborators(collaborators.filter(c => c !== email));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in scale-in duration-200">
        
        {/* Toolbar - inspired by share_fragment_toolbar.xml */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Collaborators</h2>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
          >
            Save
          </button>
        </div>

        {/* Collaborators List - inspired by sharee.xml */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {/* Owner (Simulated) */}
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 dark:text-white">You (Owner)</div>
              <div className="text-xs text-slate-500 truncate">primary-user@example.com</div>
            </div>
          </div>

          {collaborators.map((email) => (
            <div key={email} className="flex items-center gap-4 px-4 py-3 group">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Mail size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{email}</div>
              </div>
              <button 
                onClick={() => handleRemove(email)}
                className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          ))}

          {/* Add Sharee Entry - inspired by share_fragment_add_sharee.xml */}
          <div className="flex items-center gap-4 px-4 py-3 mt-2">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
              <UserPlus size={18} />
            </div>
            <input 
              autoFocus
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Person or email to share with"
              className="flex-1 bg-transparent text-sm py-2 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              onKeyDown={(e) => { if(e.key === 'Enter') handleAdd(); }}
            />
            {emailInput && (
              <button 
                onClick={handleAdd}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
              >
                <Check size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborators can edit the note</p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
