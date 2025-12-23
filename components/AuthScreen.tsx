
import React, { useState, useEffect } from 'react';

interface AuthScreenProps {
  correctPin?: string;
  lockMethod?: 'pin' | 'google';
  onUnlock: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ correctPin, lockMethod = 'pin', onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (lockMethod === 'google') {
      // Initialize Google Identity Services
      // @ts-ignore
      if (window.google) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Placeholder
          callback: (response: any) => {
            console.log("Encoded JWT ID token: " + response.credential);
            // In a real app, you'd verify this JWT. Here we treat any valid login as unlocking.
            onUnlock();
          }
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", shape: "pill", width: 280 }
        );
      }
    }
  }, [lockMethod, onUnlock]);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-rose-50 flex flex-col items-center justify-center p-6 z-[100] animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-rose-100 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 className="text-3xl font-serif text-rose-900 mb-2">LunaCycle</h1>
        <p className="text-rose-400 font-medium text-sm">
          {lockMethod === 'google' ? 'Sign in with Google to unlock' : 'Enter your 4-digit PIN to unlock'}
        </p>
      </div>

      {lockMethod === 'google' ? (
        <div className="flex flex-col items-center gap-6">
          <div id="googleBtn" className="min-h-[44px]"></div>
          <button 
            onClick={onUnlock} 
            className="text-[10px] text-rose-300 uppercase tracking-widest hover:text-rose-500 transition-colors"
          >
            Simulate Login (Development)
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-4 mb-12">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  error ? 'bg-rose-500 border-rose-500 animate-bounce' : 
                  pin.length > i ? 'bg-rose-400 border-rose-400' : 'border-rose-200'
                }`}
              ></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="w-16 h-16 rounded-full bg-white text-rose-900 text-2xl font-medium shadow-sm active:bg-rose-100 active:scale-95 transition-all flex items-center justify-center mx-auto"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleKeyPress('0')}
              className="w-16 h-16 rounded-full bg-white text-rose-900 text-2xl font-medium shadow-sm active:bg-rose-100 active:scale-95 transition-all flex items-center justify-center mx-auto"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              className="w-16 h-16 flex items-center justify-center text-rose-300 hover:text-rose-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthScreen;
