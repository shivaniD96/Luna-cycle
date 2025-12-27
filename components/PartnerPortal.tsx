import React, { useState, useRef, useEffect } from 'react';
import { PartnerData, CyclePhase } from '../types';
import { PHASE_COLORS, PARTNER_PHASE_DESCRIPTIONS, PHASE_ICONS } from '../constants';
import { getPartnerChatResponse } from '../services/aiService';

interface PartnerPortalProps {
  data: PartnerData;
}

const SUPPORT_TIPS: Record<CyclePhase, string[]> = {
  [CyclePhase.MENSTRUAL]: [
    "Stock up on iron-rich snacks (dark chocolate, spinach).",
    "Keep a warm heating pad or hot water bottle ready.",
    "Offer to take over physically demanding chores today.",
    "Acknowledge that their energy is naturally lower right now."
  ],
  [CyclePhase.FOLLICULAR]: [
    "Plan a fun outing or a new activity to try together.",
    "They likely have rising energy—suggest a social hangout.",
    "Encourage their new ideas or creative projects.",
    "Great time for light, fresh meals together."
  ],
  [CyclePhase.OVULATION]: [
    "Their confidence is high—give extra compliments!",
    "Plan a special date night while their energy is peaking.",
    "Be prepared for them to be more social than usual.",
    "They are likely feeling their most vibrant and social."
  ],
  [CyclePhase.LUTEAL]: [
    "Prioritize patience; they may feel more sensitive.",
    "Stock the pantry with their favorite comfort foods.",
    "Offer more 'parallel play' (just being in the same room).",
    "Early nights and low-stress environments are best."
  ]
};

const PartnerPortal: React.FC<PartnerPortalProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: `Hi! I'm Luna. They are currently in their ${data.phase} phase. How can I help you support them today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await getPartnerChatResponse(userMessage, data);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm offline, but remember: snacks and listening go a long way!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const cycleDay = data.avgCycle - data.daysUntilNext;
  const progressPercent = Math.min(100, Math.max(0, (cycleDay / data.avgCycle) * 100));

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col items-center p-6 pb-20">
      <header className="w-full max-w-2xl mb-8 flex flex-col items-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-indigo-100 flex items-center justify-center text-4xl mb-4 phase-pulse">
          {PHASE_ICONS[data.phase]}
        </div>
        <h1 className="text-3xl font-serif text-slate-900 mb-1">Partner Support</h1>
        <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.2em]">Helping you understand their cycle</p>
      </header>

      <div className="w-full max-w-2xl space-y-6">
        <div className="flex bg-white/70 backdrop-blur-md p-1.5 rounded-3xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'insights' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Insights & Chart
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Ask Luna AI
          </button>
        </div>

        {activeTab === 'insights' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl shadow-indigo-100/30 border border-white overflow-hidden relative">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Cycle Roadmap</h3>
              
              <div className="relative mb-12">
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${PHASE_COLORS[data.phase]}`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">
                  <span>Start</span>
                  <span>Mid-Cycle</span>
                  <span>Next Period</span>
                </div>
              </div>
              
              <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-50">
                <div className="flex items-center gap-4 mb-4">
                   <div className={`w-4 h-4 rounded-full ${PHASE_COLORS[data.phase]} shadow-sm`}></div>
                   <h4 className="text-xl font-serif text-slate-900">{data.phase} Phase</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  {PARTNER_PHASE_DESCRIPTIONS[data.phase]}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl shadow-indigo-100/30 border border-white">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Phase-Specific Care</h3>
              <div className="grid gap-4">
                {SUPPORT_TIPS[data.phase].map((tip, i) => (
                  <div key={i} className="flex gap-5 p-5 bg-white border border-slate-100 rounded-[2rem] hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <p className="text-slate-700 text-sm font-semibold leading-relaxed flex items-center">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-right-4 duration-500 border border-slate-800">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-white font-bold text-xs uppercase tracking-[0.3em]">Luna AI Chat</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-100 border border-slate-700 shadow-lg'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-indigo-400 text-xs animate-pulse font-bold ml-4">Luna is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-6 bg-slate-950 flex gap-3">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="How can I support them?" 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-[1.5rem] px-6 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500" 
              />
              <button type="submit" disabled={isTyping} className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-all squishy shrink-0 disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerPortal;