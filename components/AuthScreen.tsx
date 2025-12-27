
import React, { useState } from 'react';

interface AuthScreenProps {
  onUnlock: (token?: string) => void;
  onStayOffline: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock, onStayOffline }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    try {
      // @ts-ignore
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: '782298926978-f7b8jbe976159j8rph87un87r7671077.apps.googleusercontent.com', // Public-safe client ID for demo/app use
        scope: 'https://www.googleapis.com/auth/drive.appdata email profile',
        callback: (response: any) => {
          if (response.access_token) {
            onUnlock(response.access_token);
          } else {
            setLoading(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("Auth init failed", e);
      setLoading(false);
      alert("Cloud login failed. Please try again or stay offline.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fff9f8] flex flex-col items-center justify-center p-6 z-[100] animate-in fade-in duration-700">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-rose-100/50 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-sm w-full text-center">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-rose-100 border border-rose-50 flex items-center justify-center mx-auto mb-8 animate-bounce duration-[3000ms]">
          <span className="text-5xl">🌙</span>
        </div>
        
        <h1 className="text-4xl font-serif text-rose-900 mb-3">Welcome to Luna</h1>
        <p className="text-rose-400 font-medium text-sm leading-relaxed mb-12">
          A private companion for your cycle.<br/>Choose how you want to keep your data.
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl flex flex-col items-center justify-center gap-1 font-bold shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] squishy disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 brightness-0 invert" alt="G" />
              <span>Sync with Private Cloud</span>
            </div>
            <span className="text-[9px] opacity-70 font-normal uppercase tracking-widest">Automatic & Secure</span>
          </button>

          <button 
            onClick={onStayOffline}
            disabled={loading}
            className="w-full py-5 bg-white border-2 border-rose-100 text-rose-900 rounded-3xl flex flex-col items-center justify-center gap-1 font-bold hover:bg-rose-50 transition-all squishy disabled:opacity-50"
          >
            <span>Stay Offline Only</span>
            <span className="text-[9px] text-rose-300 font-normal uppercase tracking-widest">Local Device Only</span>
          </button>
        </div>

        <p className="mt-12 text-[10px] text-rose-300 font-bold uppercase tracking-widest px-8 leading-loose">
          Luna never sees your data.<br/>All sync happens via your own Google account.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
