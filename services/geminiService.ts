
import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceRequest } from "../types";

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string[]> => {
  // Create instance right before call to capture any newly selected personal keys
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const roleInstruction = req.role === 'partner' 
    ? `Empathetic support guide for a partner. Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`
    : `Self-care expert for women. Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`;

  const prompt = `${roleInstruction} Provide exactly 3 short, helpful self-care tips as a JSON array of strings named "tips".`;

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

    const text = response.text || '{"tips": []}';
    const data = JSON.parse(text);
    return data.tips || [];
  } catch (error: any) {
    const errorMsg = error?.toString() || "";
    
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      return ["RATE_LIMIT_ERROR"];
    }
    
    console.error("Gemini Insight Error:", error);
    return ["Guide is offline. Try again in a moment!"];
  }
};
