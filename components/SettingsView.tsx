
import React, { useState, useEffect } from 'react';
import { UserData, AIProvider } from '../types';
import { GoogleGenAI } from "@google/genai";

interface SettingsViewProps {
  userData: UserData;
  onImport: (data: UserData) => void;
  isSyncActive: boolean;
  onEnableSync: () => void;
  onUpdateLock: (method: 'pin' | 'google' | undefined, value?: string) => void;
  onUpdateSettings: (settings: Partial<UserData['settings']>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  userData, onImport, isSyncActive, onEnableSync, onUpdateLock, onUpdateSettings 
}) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedData, setFormattedData] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [hasPersonalKey, setHasPersonalKey] = useState(false);

  // Check key status on mount and whenever provider changes
  useEffect(() => {
    const checkKeyStatus = async () => {
      try {
        const aiStudio = (window as any).aistudio;
        if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
          const selected = await aiStudio.hasSelectedApiKey();
          setHasPersonalKey(!!selected);
        }
      } catch (e) {
        console.warn('AI Studio key check failed:', e);
      }
    };
    checkKeyStatus();
  }, [userData.settings.aiProvider]);

  const handleSetPin = () => {
    if (pinInput.length === 4) {
      onUpdateLock('pin', pinInput);
      setPinInput('');
      alert('Privacy PIN set successfully!');
    } else {
      alert('PIN must be exactly 4 digits.');
    }
  };

  const handleOpenKeySelector = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const aiStudio = (window as any).aistudio;
    
    if (!aiStudio) {
      alert('Personal API Key selection is only available when hosted in the AI Studio environment.');
      return;
    }

    if (typeof aiStudio.openSelectKey !== 'function') {
      alert('The key selector is not available in this environment.');
      return;
    }

    try {
      await aiStudio.openSelectKey();
      // Per guidelines, assume success to mitigate race condition
      setHasPersonalKey(true);
    } catch (err) {
      console.error('Failed to open key selector:', err);
      alert('There was an error opening the key selector. Please try again.');
    }
  };

  const selectProvider = (p: AIProvider) => {
    onUpdateSettings({ aiProvider: p });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* AI BRAIN SELECTION */}
      <section className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 4.93 5.66 5.66"/><path d="M2 12h8"/><path d="m4.93 19.07 5.66-5.66"/><path d="M12 22v-8"/><path d="m19.07 19.07-5.66-5.66"/><path d="M22 12h-8"/><path d="m19.07 4.93-5.66 5.66"/></svg>
        </div>

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm shadow-inner">🧠</span>
          AI Engine Control
        </h3>
        
        <div className="flex bg-indigo-950/60 p-1.5 rounded-2xl mb-6 relative z-10 border border-white/5">
          <button 
            type="button"
            onClick={() => selectProvider('gemini')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${userData.settings.aiProvider === 'gemini' ? 'bg-white text-indigo-900 shadow-xl scale-100' : 'text-indigo-300 hover:text-white scale-95'}`}
          >
            Gemini Flash
          </button>
          <button 
            type="button"
            onClick={() => selectProvider('grok')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${userData.settings.aiProvider === 'grok' ? 'bg-white text-indigo-900 shadow-xl scale-100' : 'text-indigo-300 hover:text-white scale-95'}`}
          >
            Grok / Custom
          </button>
        </div>

        <div className="relative z-10 min-h-[140px]">
          {userData.settings.aiProvider === 'grok' ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-between items-end px-1">
                <p className="text-indigo-200 text-[11px] leading-relaxed max-w-[70%]">
                  Using <strong>xAI Grok</strong> or a custom OpenAI-compatible endpoint.
                </p>
                <span className="bg-indigo-500/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-indigo-100 border border-white/10">Active</span>
              </div>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="Paste xAI or Groq key here..."
                  autoFocus
                  value={userData.settings.customApiKey || ''}
                  onChange={(e) => onUpdateSettings({ customApiKey: e.target.value })}
                  className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-indigo-800"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
                </div>
              </div>
              <p className="text-[10px] text-indigo-400 font-bold tracking-tight px-1">
                Your key is stored locally in this browser. Never shared.
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-indigo-200 text-xs px-2 leading-relaxed">
                Connect your personal Google project to unlock <strong>15 requests per minute</strong> for free. No more shared quota errors!
              </p>
              <div className="space-y-3">
                <button 
                  type="button"
                  onClick={handleOpenKeySelector}
                  className={`w-full py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-3 border shadow-lg group ${hasPersonalKey ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                >
                  {hasPersonalKey ? (
                    <>
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                      Personal Quota Active
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                      Link Personal API Key
                    </>
                  )}
                </button>
                {hasPersonalKey && (
                  <button 
                    type="button"
                    onClick={handleOpenKeySelector}
                    className="w-full text-[10px] text-indigo-400 uppercase font-bold tracking-widest hover:text-white transition-colors py-1"
                  >
                    Switch Project Key
                  </button>
                )}
              </div>
              <p className="text-[10px] text-indigo-500 text-center font-bold px-4 leading-normal uppercase">
                Requires a paid GCP project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline decoration-indigo-800 hover:text-indigo-300">Docs &rarr;</a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SYNC SECTION */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 relative overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          Private Cloud Sync
        </h3>
        <div className={`p-6 rounded-[2rem] border transition-all mt-4 ${isSyncActive ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          {isSyncActive ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <p className="font-bold text-emerald-900">Actively Linked</p>
            </div>
          ) : (
            <button onClick={onEnableSync} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 squishy">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Resume Connection
            </button>
          )}
        </div>
      </section>

      {/* PRIVACY LOCK */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Privacy Lock
        </h3>
        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 mt-4">
          {userData.settings.lockMethod === 'pin' ? (
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">PIN Active ✓</p>
              <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500">Disable</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="password" maxLength={4} placeholder="Set PIN" value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3 text-center font-bold outline-none"
              />
              <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold squishy">Set</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
