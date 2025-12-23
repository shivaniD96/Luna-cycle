
import React, { useState } from 'react';
import { UserData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { SyncService } from '../services/syncService';

interface SettingsViewProps {
  userData: UserData;
  onImport: (data: UserData) => void;
  isSyncActive: boolean;
  onEnableSync: () => void;
  onUpdateLock: (method: 'pin' | 'google' | undefined, value?: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userData, onImport, isSyncActive, onEnableSync, onUpdateLock }) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedData, setFormattedData] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');

  const handleSetPin = () => {
    if (pinInput.length === 4) {
      onUpdateLock('pin', pinInput);
      setPinInput('');
      alert('Privacy PIN set successfully!');
    } else {
      alert('PIN must be exactly 4 digits.');
    }
  };

  const handleGoogleLock = () => {
    // In a real app, you'd trigger a Google login here to get the email/id
    onUpdateLock('google', 'linked@gmail.com');
    alert('Google Lock enabled! You will now use your Google account to unlock the app.');
  };

  const exportData = () => {
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `lunacycle_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.logs && json.symptoms) {
          onImport(json);
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const formatForNotion = async () => {
    setIsFormatting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const prompt = `Convert the following menstrual cycle data into a beautiful, clean Markdown table and summary suitable for pasting into a Notion page. 
    Include columns for Date, Phase (calculate based on your logic), Mood, and Symptoms.
    Data: ${JSON.stringify({ logs: userData.logs, symptoms: userData.symptoms })}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setFormattedData(response.text || "Failed to format.");
    } catch (error) {
      setFormattedData("Error connecting to AI for formatting.");
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Privacy lock Section */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Privacy Lock
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Secure your data with a PIN or your Google Account.
        </p>
        
        <div className="space-y-4">
          {/* PIN Lock Option */}
          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-3">Option 1: Privacy PIN</p>
            {userData.settings.lockMethod === 'pin' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">PIN Active</p>
                    <p className="text-xs text-gray-500">Locked behind 4-digit code.</p>
                  </div>
                </div>
                <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500">Disable</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="password" 
                  maxLength={4} 
                  placeholder="Set 4-digit PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                />
                <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold">Set PIN</button>
              </div>
            )}
          </div>

          {/* Google Lock Option */}
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">Option 2: Google Sign-In</p>
            {userData.settings.lockMethod === 'google' ? (
               <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                 </div>
                 <div>
                   <p className="font-bold text-gray-800">Google Lock Active</p>
                   <p className="text-xs text-gray-500">{userData.settings.googleUserEmail || 'Linked'}</p>
                 </div>
               </div>
               <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-indigo-500">Disable</button>
             </div>
            ) : (
              <button 
                onClick={handleGoogleLock}
                className="w-full flex items-center justify-center gap-3 bg-white border border-indigo-100 py-3 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Use Google Lock
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Live Sync Section */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2 relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          Live Cloud Sync (via Local File)
        </h3>
        <p className="text-sm text-gray-500 mb-6 relative">
          Pick a file in your <strong>Google Drive</strong> or <strong>Dropbox</strong> folder. 
          Luna will auto-save every change to it.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 relative">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isSyncActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <div>
              <p className="font-bold text-gray-800">{isSyncActive ? 'Sync Active' : 'Sync Inactive'}</p>
              <p className="text-xs text-gray-600">{isSyncActive ? 'Changes are auto-saved to your file.' : 'Data is only stored in browser cache.'}</p>
            </div>
          </div>
          <button 
            onClick={onEnableSync}
            disabled={!SyncService.isSupported()}
            className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-md ${isSyncActive ? 'bg-white text-emerald-600 border border-emerald-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {isSyncActive ? 'Change Sync File' : 'Enable Live Sync'}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-50">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Manual Backup
        </h3>
        
        <div className="grid gap-6">
          <div className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100">
            <div>
              <p className="font-bold text-gray-800">Export Backup</p>
              <p className="text-xs text-gray-500">Download raw data as a one-time JSON file.</p>
            </div>
            <button 
              onClick={exportData}
              className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-sm"
            >
              Export JSON
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-800">Restore Data</p>
              <p className="text-xs text-gray-500">Import a previously saved backup file.</p>
            </div>
            <label className="cursor-pointer px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
              Import file
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </section>

      <section className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v19"/><path d="M5 8h14"/><path d="M15 21a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6z"/></svg>
        </div>
        
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          AI Formatter
        </h3>
        <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
          Luna will format your history into a clean report for <strong>Notion</strong>, <strong>Evernote</strong>, or <strong>Sheets</strong>.
        </p>

        {!formattedData ? (
          <button 
            onClick={formatForNotion}
            disabled={isFormatting}
            className={`w-full py-4 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isFormatting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isFormatting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </span>
            ) : 'Generate Notion-Ready Report'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-950/50 p-4 rounded-2xl border border-indigo-700/50 max-h-60 overflow-y-auto font-mono text-xs text-indigo-100 whitespace-pre-wrap">
              {formattedData}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {navigator.clipboard.writeText(formattedData); alert('Copied to clipboard!');}}
                className="flex-1 py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm"
              >
                Copy to Clipboard
              </button>
              <button 
                onClick={() => setFormattedData(null)}
                className="py-3 px-6 bg-indigo-800 text-indigo-300 rounded-xl font-bold text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SettingsView;
