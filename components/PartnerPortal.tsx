
import React, { useState, useRef, useEffect } from 'react';
import { PartnerData } from '../types';
import { PHASE_COLORS, PHASE_DESCRIPTIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface PartnerPortalProps {
  data: PartnerData;
}

const PartnerPortal: React.FC<PartnerPortalProps> = ({ data }) => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: `Hi! I'm Luna, your partner support companion. They are currently in their ${data.phase} phase. How can I help you support them today?` }
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

    const provider = data.provider || 'gemini';
    const key = data.customKey || "";
    
    const roleInstruction = `You are Luna, an empathetic AI cycle guide. 
    A partner is asking you for help.
    CONTEXT:
    - User's Phase: ${data.phase}
    - Symptoms: ${data.symptoms.join(', ') || 'None'}
    - Days until period: ${data.daysUntilNext}
    - Partner's Message: "${userMessage}"`;

    const prompt = `${roleInstruction} Provide kind, practical, and non-medical advice on support. Keep it concise.`;

    try {
      let aiResponse = "";
      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        aiResponse = response.text || "I'm having a little trouble thinking.";
      } else {
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });
        const json = await response.json();
        aiResponse = json.choices[0].message.content;
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm offline right now, but generally, patience and extra snacks are always a win!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center p-6 pb-12">
      <header className="w-full max-w-2xl mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-serif text-indigo-900 mb-2">Support Portal</h1>
        <p className="text-indigo-400 font-medium text-xs uppercase tracking-widest">LunaCycle Companion (via {data.provider === 'gemini' ? 'Gemini' : 'Grok'})</p>
      </header>

      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-indigo-100">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl ${PHASE_COLORS[data.phase]} flex items-center justify-center text-white`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Status</p>
              <p className="text-2xl font-serif text-indigo-900">{data.phase} Phase</p>
            </div>
          </div>
          <p className="text-indigo-700/70 text-sm leading-relaxed">{PHASE_DESCRIPTIONS[data.phase]}</p>
        </div>

        <div className="bg-indigo-900 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-indigo-800 text-white font-bold text-sm">Luna AI Assistant</div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-indigo-800 text-indigo-50'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-indigo-400 text-xs animate-pulse">Luna is typing...</div>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-4 bg-indigo-950/50 flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Luna..." className="flex-1 bg-indigo-900/50 border border-indigo-800 rounded-xl px-4 py-3 text-white text-sm outline-none" />
            <button type="submit" disabled={isTyping} className="p-3 bg-indigo-500 text-white rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerPortal;
