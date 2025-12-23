
import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceRequest } from "../types";

export const getCycleAdvice = async (req: AIAdviceRequest): Promise<string[]> => {
  const provider = req.provider || 'gemini';
  
  const roleInstruction = req.role === 'partner' 
    ? `Empathetic support guide for a partner. Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`
    : `Self-care expert for women. Phase: ${req.phase}. Symptoms: ${req.symptoms.join(', ') || 'none'}. Period in ${req.daysRemaining} days.`;

  const prompt = `${roleInstruction} Provide exactly 3 short, helpful self-care tips as a JSON array of strings named "tips". Ensure the output is valid JSON.`;

  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      return data.tips || [];
    } catch (error: any) {
      if (error?.toString().includes("429")) return ["RATE_LIMIT_ERROR"];
      throw error;
    }
  } else {
    // Grok / OpenAI Compatible Call
    const key = req.customKey || "";
    if (!key) return ["MISSING_KEY_ERROR"];

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "grok-beta", // Standard Grok model name
          messages: [
            { role: "system", content: "You are a helpful assistant that only responds in JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (response.status === 429) return ["RATE_LIMIT_ERROR"];
      
      const json = await response.json();
      const content = json.choices[0].message.content;
      const data = JSON.parse(content);
      return data.tips || [];
    } catch (error) {
      console.error("Grok Error:", error);
      return ["CONNECTION_ERROR"];
    }
  }
};
