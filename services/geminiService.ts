import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceRequest } from "../types";

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = req.role === 'partner' 
    ? `The user is currently in the ${req.phase} phase of their menstrual cycle. 
       Reported symptoms: ${req.symptoms.join(', ') || 'None reported'}.
       Next period is roughly in ${req.daysRemaining} days.
       As an empathetic AI assistant, provide a list of specific, actionable tips for their partner on how to best support them.`
    : `I am in the ${req.phase} phase of my cycle. 
       Symptoms: ${req.symptoms.join(', ')}.
       Provide a list of 3-4 self-care tips for me for this specific phase of my cycle focusing on nutrition, mood, and movement.`;

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
              items: { type: Type.STRING },
              description: "List of advice strings"
            }
          },
          required: ["tips"]
        },
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text || '{"tips": []}');
    return data.tips || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["I'm having trouble connecting to your AI guide right now. Please try again soon."];
  }
};