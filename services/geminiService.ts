
import { GoogleGenAI } from "@google/genai";

/**
 * Generates a short, encouraging productivity tip or quote using Gemini.
 * @param workDuration The duration of the focus work session in minutes.
 * @param breakDuration The duration of the break session in minutes.
 * @returns A motivating string tip.
 */
export const getProductivityTips = async (workDuration: number, breakDuration: number): Promise<string> => {
  // Fix: The API key must be obtained exclusively from process.env.API_KEY as per guidelines.
  // Initialization must use a named parameter: { apiKey: process.env.API_KEY }.
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short (under 15 words) and highly motivating productivity tip or quote for a user who is starting a ${workDuration}-minute focus session.`,
    });
    // Fix: Access .text property directly (not as a method)
    return response.text?.trim() || "Stay focused. You've got this.";
  } catch (error) {
    console.error("Gemini Error in getProductivityTips:", error);
    return "Keep going! Small steps lead to big results.";
  }
};
