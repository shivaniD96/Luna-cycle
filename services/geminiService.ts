
import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceRequest } from "../types";

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const roleInstruction = req.role === 'partner' 
    ? `You are an empathetic support guide for a partner. The user is in their ${req.phase} phase. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`
    : `You are a self-care expert for women. I am in my ${req.phase} phase. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`;

  const prompt = `${roleInstruction} Provide exactly 3 concise, practical tips as a JSON array of strings named "tips". Do not include medical advice.`;

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
              description: "Actionable advice strings"
            }
          },
          required: ["tips"]
        },
        temperature: 0.8,
      },
    });

    const text = response.text || '{"tips": []}';
    const data = JSON.parse(text);
    return data.tips || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Your guide is catching its breath. Tap refresh in a moment for fresh wisdom!"];
  }
};
