import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    // In a real scenario, we might throw, but for UI demo safety we allow returning null
    // and handling it in the UI.
  }
  return new GoogleGenAI({ apiKey: apiKey || 'demo-key' });
};

export const generateEventDescription = async (title: string, type: string, keyPoints: string): Promise<string> => {
  try {
    const ai = getClient();
    const modelId = 'gemini-2.5-flash'; 
    
    const prompt = `
      You are an expert event organizer for a university platform called UNUGHA.
      Write a compelling, exciting, and professional event description (approx 100-150 words) for an event.
      
      Event Details:
      - Title: ${title}
      - Type: ${type}
      - Key Highlights: ${keyPoints}

      Tone: Enthusiastic, inviting, and clear.
      Format: Plain text, structured with a short intro and bullet points for benefits if applicable.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate description at this time. Please try again later.";
  }
};
