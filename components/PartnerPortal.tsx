
import React, { useState, useRef, useEffect } from 'react';
import { PartnerData, CyclePhase } from '../types';
import { PHASE_COLORS, PHASE_DESCRIPTIONS, PHASE_ICONS } from '../constants';
import { GoogleGenAI } from "@google/genai";

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
    
    const prompt = `You are Luna, an empathetic AI guide for a partner. 
    User's Phase: ${data.phase}. Symptoms: ${data.symptoms.join(', ') || 'None'}. 
    Period in: ${data.daysUntilNext} days. 
    Partner's Message: "${userMessage}". 
    Provide kind, practical, and non-medical support advice.`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const aiResponse = response.text || "I'm having a little trouble thinking, but generally, patience and extra comfort are always appreciated.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm offline, but remember: snacks and listening go a long way!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Calculate progress for the chart
  const cycleDay = data.avgCycle - data.daysUntilNext;
  const progressPercent = Math.min(100, Math.max(0, (cycleDay / data.avgCycle) * 100));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pb-20">
      <header className="w-full max-w-2xl mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-indigo-100 flex items-center justify-center text-3xl mb-4">
          {PHASE_ICONS[data.phase]}
        </div>
        <h1 className="text-3xl font-serif text-slate-900 mb-1">Support Portal</h1>
        <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.2em]">LunaCycle Companion</p>
      </header>

      <div className="w-full max-w-2xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'insights' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            Insights
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            Ask Luna
          </button>
        </div>

        {activeTab === 'insights' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cycle Progress Chart */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 overflow-hidden relative">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Cycle Progress</h3>
              <div className="relative h-4 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-1000 ${PHASE_COLORS[data.phase]}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
                {/* Phase Markers */}
                <div className="absolute top-0 left-[18%] w-px h-full bg-white/30"></div>
                <div className="absolute top-0 left-[45%] w-px h-full bg-white/30"></div>
                <div className="absolute top-0 left-[60%] w-px h-full bg-white/30"></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                <span>START</span>
                <span>Day {cycleDay} of {data.avgCycle}</span>
                <span>NEXT</span>
              </div>
              
              <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                   <div className={`w-3 h-3 rounded-full ${PHASE_COLORS[data.phase]}`}></div>
                   <h4 className="text-lg font-serif text-slate-900">{data.phase} Phase</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{PHASE_DESCRIPTIONS[data.phase]}</p>
              </div>
            </div>

            {/* Quick Tips Guide */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">How to Support</h3>
              <div className="space-y-4">
                {SUPPORT_TIPS[data.phase].map((tip, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                    <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <p className="text-slate-700 text-sm font-medium">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {data.symptoms.length > 0 && (
              <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100">
                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4">Reported Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {data.symptoms.map(s => (
                    <span key={s} className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-amber-700 shadow-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-right-4 duration-500">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-white font-bold text-xs uppercase tracking-widest">Luna Support Assistant</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-indigo-400 text-xs animate-pulse font-bold ml-2">Luna is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 bg-slate-950 flex gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask about symptoms, meals, or support..." 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
              <button type="submit" disabled={isTyping} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-all squishy shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerPortal;
