
import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceRequest, CyclePhase } from "../types";

const FALLBACK_TIPS: Record<CyclePhase, string[]> = {
  [CyclePhase.MENSTRUAL]: [
    "Prioritize deep rest tonight; your body is working hard and deserves a 'winter' slumber.",
    "Sip on warm herbal teas like peppermint or raspberry leaf to soothe cramps and stay hydrated.",
    "Gentle movement, like slow stretching or a short walk, can help ease pelvic congestion."
  ],
  [CyclePhase.FOLLICULAR]: [
    "Your energy is climbing! This is a great window to tackle complex projects or try a new recipe.",
    "Incorporate light fermented foods like yogurt or kimchi to support hormonal metabolization.",
    "Brainstorm new ideas today—your creativity is naturally higher during this 'spring' phase."
  ],
  [CyclePhase.OVULATION]: [
    "You're at your social peak. It's a perfect time for group hangouts or important presentations.",
    "Stay extra hydrated and enjoy vibrant, fresh foods to match your high-energy state.",
    "High-intensity workouts usually feel great today—enjoy your natural strength and stamina."
  ],
  [CyclePhase.LUTEAL]: [
    "Energy is turning inward. Focus on wrapping up existing tasks rather than starting new ones.",
    "Prioritize magnesium-rich foods like dark chocolate or pumpkin seeds to help stabilize your mood.",
    "Listen to your boundaries; it's okay to decline social invites and enjoy a quiet night in."
  ]
};

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string[]> => {
  // Always try the primary Gemini key first
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const roleInstruction = req.role === 'partner' 
    ? `Empathetic support guide for a partner. Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`
    : `Self-care expert for women. Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`;

  const prompt = `${roleInstruction} Provide exactly 3 short, helpful self-care tips as a JSON array of strings named "tips". Ensure the output is valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
    console.warn("AI Service fallback triggered:", error);
    // Return pre-set outputs if API fails
    return FALLBACK_TIPS[req.phase];
  }
};
