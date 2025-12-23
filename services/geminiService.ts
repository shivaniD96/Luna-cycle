
import { GoogleGenAI } from "@google/genai";
import { AIAdviceRequest } from "../types";

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = req.role === 'partner' 
    ? `The user is currently in the ${req.phase} phase of their menstrual cycle. 
       Reported symptoms: ${req.symptoms.join(', ') || 'None reported'}.
       Next period is roughly in ${req.daysRemaining} days.
       As an empathetic AI assistant, explain to their partner (the person reading this) how they can best support her. 
       Provide 3-4 specific, actionable tips. 
       DO NOT USE MARKDOWN HEADERS (no ## or ###). Use plain bullet points.
       Keep the tone supportive, respectful, and helpful.`
    : `I am in the ${req.phase} phase of my cycle. 
       Symptoms: ${req.symptoms.join(', ')}.
       Provide 3-4 self-care tips for me for this specific phase of my cycle. 
       DO NOT USE MARKDOWN HEADERS (no ## or ###). Use plain bullet points.
       Focus on nutrition, mood management, and exercise suitable for this phase.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "I couldn't generate advice right now. Please try again later.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to the AI companion. Ensure you have internet access.";
  }
};
