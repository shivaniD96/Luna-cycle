
import React, { useState } from 'react';
import { SyncService } from '../services/syncService';

interface AuthScreenProps {
  onUnlock: (token?: string) => void;
  onStayOffline: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock, onStayOffline }) => {
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(SyncService.getClientId() === 'YOUR_GOOGLE_CLIENT_ID' ? '' : SyncService.getClientId());

  const handleGoogleLogin = () => {
    setLoading(true);
    SyncService.triggerLogin(
      (token) => onUnlock(token),
      (err) => {
        setLoading(false);
        if (err === 'INVALID_CLIENT' || err === 'MISSING_CLIENT_ID' || (err && err.error === 'invalid_client')) {
          setShowConfig(true);
        } else {
          alert("Authorization failed. Ensure your Internet is connected and your Client ID is correct.");
        }
      }
    );
  };

  const saveClientId = () => {
    if (!clientIdInput.trim() || !clientIdInput.includes('.apps.googleusercontent.com')) {
      alert("Please enter a valid Google Client ID (it should end in .apps.googleusercontent.com)");
      return;
    }
    SyncService.setCustomClientId(clientIdInput.trim());
    setShowConfig(false);
    alert("Configuration saved. Now try clicking 'Sync with Private Cloud' again.");
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
          Your cycle, your privacy.<br/>All your data is stored securely on your device.
        </p>

        {showConfig ? (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-rose-100 text-left mb-8 animate-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Cloud Setup Guide
            </h3>
            
            <div className="space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar text-[11px] leading-relaxed text-slate-600">
              <p className="font-bold text-amber-600 mb-2">Advanced: Automatic Sync</p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <p className="font-bold text-rose-900 mb-1">Step 1: Create Project</p>
                <p>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-rose-600 underline font-bold">Google Cloud Console</a>, click "New Project" (e.g., "MyLuna").</p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="font-bold text-indigo-900 mb-1">Step 2: Create Web Client</p>
                <p>In "Credentials", create an <strong>OAuth Client ID</strong> for a <strong>Web Application</strong>.</p>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl shadow-inner">
                <p className="font-bold text-emerald-400 mb-1 uppercase tracking-widest text-[9px]">Authorized Origin</p>
                <code className="block bg-slate-800 p-2 rounded text-[10px] break-all border border-slate-700 select-all font-mono">
                  {window.location.origin}
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-rose-300 uppercase tracking-widest mb-1">Paste Your Client ID Here</label>
                <input 
                  type="text" 
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="...apps.googleusercontent.com"
                  className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-4 py-3 text-[10px] outline-none focus:ring-2 focus:ring-rose-200 transition-all font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveClientId} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all squishy shadow-lg shadow-rose-100">Save & Link</button>
                <button onClick={() => setShowConfig(false)} className="px-4 py-3 bg-rose-50 text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">Back</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={onStayOffline}
              disabled={loading}
              className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl flex flex-col items-center justify-center gap-1 font-bold shadow-xl shadow-rose-100 transition-all hover:scale-[1.02] active:scale-[0.98] squishy disabled:opacity-50"
            >
              <span>Start Privately</span>
              <span className="text-[9px] opacity-70 font-normal uppercase tracking-widest">Local-Only (No Setup)</span>
            </button>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-rose-100"></div>
              <span className="text-[9px] text-rose-300 font-bold uppercase tracking-widest">Or Link Account</span>
              <div className="h-px flex-1 bg-rose-100"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border-2 border-rose-100 text-rose-900 rounded-3xl flex items-center justify-center gap-3 font-bold hover:bg-rose-50 transition-all squishy disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" />
              <span className="text-xs">Automatic Cloud Sync</span>
            </button>

            <p className="mt-8 text-[10px] text-rose-300 font-bold uppercase tracking-widest px-8 leading-loose">
              You can export your data as a backup file anytime from settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
