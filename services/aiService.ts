
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Transaction } from "../types";

// Fix: obtain API key exclusively from process.env.API_KEY and use named parameter
// Use a fresh instance for each request to ensure the most up-to-date configuration
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseSmartTask = async (input: string): Promise<{
  title: string;
  priority: Priority;
  dueDate?: string;
  tags: string[];
}> => {
  // Fix: initialize GoogleGenAI as per guidelines
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a smart task parser. Extract title, priority (0-3), dueDate (ISO), and tags. Input: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.INTEGER },
            dueDate: { type: Type.STRING, nullable: true },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'priority', 'tags']
        }
      }
    });

    // Fix: Access .text property directly (not as a method)
    const text = response.text;
    if (!text) return { title: input, priority: Priority.None, tags: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Parsing failed:", error);
    return { title: input, priority: Priority.None, tags: [] };
  }
};

export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down: "${taskTitle}" into 3 actionable short subtasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    // Fix: Access .text property directly
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateMagicList = async (prompt: string): Promise<{ title: string, items: string[] }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create an actionable checklist for: "${prompt}". Provide a concise title and a list of 5-8 clear steps.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'items']
        }
      }
    });
    // Fix: Access .text property directly
    return JSON.parse(response.text || `{"title": "${prompt}", "items": []}`);
  } catch (error) {
    console.error("Magic List generation failed:", error);
    return { title: prompt, items: [] };
  }
};

export const parseImageTask = async (base64Data: string, mimeType: string): Promise<{
  title: string;
  description: string;
  tags: string[];
}> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this image and create a task." }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    // Fix: Access .text property directly
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { title: "Image Task", description: "Error", tags: [] };
  }
};

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: "Transcribe this." }] }
    });
    // Fix: Access .text property directly
    return response.text || "";
  } catch (error) {
    return "";
  }
};

export const extractImageText = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: "Extract text." }] }
    });
    // Fix: Access .text property directly
    return response.text || "";
  } catch (error) {
    return "";
  }
};

export const parseFinancialSMS = async (smsText: string): Promise<Transaction | null> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Parse this SMS into a financial transaction. If it's not a transaction, return null. 
      SMS: "${smsText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_transaction: { type: Type.BOOLEAN },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["debit", "credit"] },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            payment_method: { type: Type.STRING }
          },
          required: ['is_transaction', 'amount', 'type', 'merchant']
        }
      }
    });

    // Fix: Access .text property directly
    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.is_transaction) return null;

    const date = new Date();
    return {
        id: Date.now().toString(),
        is_transaction: true,
        amount: parsed.amount,
        type: parsed.type as 'debit' | 'credit',
        merchant: parsed.merchant,
        category: parsed.category || "Other",
        payment_method: parsed.payment_method || "Other",
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5),
        raw_sms: smsText,
        createdAt: date
    };
  } catch (error) {
    console.error("Finance AI parsing failed:", error);
    return null;
  }
};

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  const ai = getAiClient();
  
  if (transactions.length === 0) return "No transactions to analyze for this period.";

  try {
    // Simplify payload to essential fields to save tokens
    const summary = transactions.slice(0, 50).map(t => 
      `${t.date}: ${t.merchant} (${t.category}) - ${t.type === 'credit' ? 'Income' : 'Expense'} ${t.amount}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly personal finance assistant. Analyze these transactions for the current month. 
      Provide a very concise summary (max 2 sentences) of spending habits and 1 specific, actionable saving tip based on the data.
      Be encouraging but realistic.
      
      Transactions:
      ${summary}`,
    });
    
    // Fix: Access .text property directly
    return response.text || "No insights found.";
  } catch (error) {
    console.error("Finance AI error:", error);
    return "Unable to generate insights at the moment. Please try again later.";
  }
};
