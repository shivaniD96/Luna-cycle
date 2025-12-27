
import React, { useState } from 'react';
import { SyncService } from '../services/syncService';

interface AuthScreenProps {
  onUnlock: (token?: string) => void;
  onStayOffline: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock, onStayOffline }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    SyncService.triggerLogin(
      (token) => onUnlock(token),
      (err) => {
        setLoading(false);
        if (err === 'MISSING_CLIENT_ID') {
          alert("Developer Note: GOOGLE_CLIENT_ID environment variable is missing in Vercel. Please check your project settings.");
        } else {
          alert("Authentication interrupted. Please try again or continue in Private mode.");
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-[#fff9f8] flex flex-col items-center justify-center p-6 z-[100] animate-in fade-in duration-700 overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-rose-100/50 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-sm w-full text-center py-10">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-rose-100 border border-rose-50 flex items-center justify-center mx-auto mb-8 animate-bounce duration-[3000ms]">
          <span className="text-5xl">🌙</span>
        </div>
        
        <h1 className="text-4xl font-serif text-rose-900 mb-3">Welcome to Luna</h1>
        <p className="text-rose-400 font-medium text-sm leading-relaxed mb-12">
          Your cycle, your privacy.<br/>Your data stays on your device or in your private vault.
        </p>

        <div className="space-y-4">
          <button 
            onClick={onStayOffline}
            disabled={loading}
            className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl flex flex-col items-center justify-center gap-1 font-bold shadow-xl shadow-rose-100 transition-all hover:scale-[1.02] active:scale-[0.98] squishy disabled:opacity-50"
          >
            <span>Start Privately</span>
            <span className="text-[9px] opacity-70 font-normal uppercase tracking-widest">Store Data Locally</span>
          </button>

          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-rose-100"></div>
            <span className="text-[9px] text-rose-300 font-bold uppercase tracking-widest text-nowrap">Link Account</span>
            <div className="h-px flex-1 bg-rose-100"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white border-2 border-rose-100 text-rose-900 rounded-3xl flex items-center justify-center gap-3 font-bold hover:bg-rose-50 transition-all squishy disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" />
            <span className="text-xs">{loading ? 'Connecting...' : 'Automatic Cloud Sync'}</span>
          </button>

          <p className="mt-8 text-[10px] text-rose-300 font-bold uppercase tracking-widest px-8 leading-loose">
            No accounts required. We use your existing Google Drive as a private storage locker.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
