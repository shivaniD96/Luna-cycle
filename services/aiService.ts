import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceRequest, CyclePhase } from "../types";

const FALLBACK_TIPS: Record<CyclePhase, string[]> = {
  [CyclePhase.MENSTRUAL]: [
    "Prioritize deep rest; your body is in its 'winter' phase and deserves extra care.",
    "Warm herbal teas like peppermint can help soothe cramps and maintain hydration.",
    "Gentle stretching or a short walk can help ease pelvic tension today."
  ],
  [CyclePhase.FOLLICULAR]: [
    "Energy is rising! This is a great window to start new projects or creative hobbies.",
    "Try incorporating light, fresh foods to support your metabolism during this 'spring' phase.",
    "Your social battery is recharging—great time for a coffee date or brainstorming."
  ],
  [CyclePhase.OVULATION]: [
    "You're at your vibrant peak! Perfect for important presentations or social gatherings.",
    "High-intensity movement often feels rewarding today—embrace your natural strength.",
    "Confidence is naturally higher; trust your intuition and glow today."
  ],
  [CyclePhase.LUTEAL]: [
    "Energy is turning inward. It's okay to decline plans and enjoy a quiet night in.",
    "Magnesium-rich foods like dark chocolate can help stabilize mood and comfort.",
    "Prioritize finishing existing tasks rather than starting complex new ones."
  ]
};

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string[]> => {
  // Always use a fresh instance with direct process.env.API_KEY access
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = req.role === 'partner' 
    ? "You are Luna, an empathetic support guide helping a partner understand their loved one's hormonal cycle. Provide 3 short, practical, and kind advice points using supportive language. Focus on empathy and small helpful actions."
    : "You are Luna, a specialized hormone health and self-care expert. Provide 3 short, high-quality, encouraging self-care tips. Focus on hormonal balance, nutrition, and mental well-being.";

  const prompt = `Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days. Provide 3 short tips as a JSON array named "tips".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["tips"]
        },
        temperature: 0.7,
      },
    });
    
    const data = JSON.parse(response.text || '{"tips": []}');
    return (data.tips && data.tips.length > 0) ? data.tips : FALLBACK_TIPS[req.phase];
  } catch (error) {
    console.warn("Luna AI: Using fallback tips.", error);
    return FALLBACK_TIPS[req.phase];
  }
};

/**
 * Handles generic partner chat queries
 */
export const getPartnerChatResponse = async (userMessage: string, data: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `You are Luna, an empathetic AI guide for a partner. 
    User's Phase: ${data.phase}. Symptoms: ${data.symptoms.join(', ') || 'None'}. 
    Period in: ${data.daysUntilNext} days. 
    Partner's Message: "${userMessage}". 
    Provide kind, practical, and non-medical support advice using supportive language (e.g., "they may feel", "try offering"). Keep it brief.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8 }
    });
    return response.text || "I'm having trouble thinking, but generally, listening and offering comfort are the best things you can do right now.";
  } catch (err) {
    return "I'm momentarily offline, but remember: small gestures like bringing them a glass of water or their favorite snack go a long way!";
  }
};