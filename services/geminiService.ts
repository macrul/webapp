import { GoogleGenAI, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { Message, PlayerMessage } from '../types';

// Access API Key from Vite environment variables (VITE_API_KEY) or fallback to standard process.env
// Note: When deploying to Vercel, ensure you set the Environment Variable 'VITE_API_KEY'
const API_KEY = import.meta.env.VITE_API_KEY || process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
  }
} else {
  console.warn("VITE_API_KEY is missing. AI features will not work.");
}

// --- Co-Pilot Assistant Logic ---
export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string
): Promise<string> => {
  if (!ai) return "Error: API Key is missing. Please check your settings.";
  
  try {
    const model = 'gemini-3-flash-preview';
    
    const contents: Content[] = history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    contents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    const response = await ai.models.generateContent({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      contents: contents,
    });

    return response.text || "I'm having trouble reading my spellbook right now. Try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The arcane leylines are disrupted. Please check your connection or API key.";
  }
};

// --- Image Generation (Nano Banana) ---
export const generateGameImage = async (prompt: string): Promise<string | null> => {
  if (!ai) return null;

  try {
    // Using gemini-2.5-flash-image (Nano Banana)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high quality fantasy tabletop RPG illustration, digital art style: ${prompt}` }],
      },
      // Nano banana does not support responseMimeType or tools
    });

    // Extract image from response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// --- AI Dungeon Master Logic ---
export const getAiDmResponse = async (
  chatHistory: PlayerMessage[],
  campaignContext: string
): Promise<string> => {
  if (!ai) return "I cannot speak right now (Missing API Key).";

  try {
    const model = 'gemini-3-flash-preview';
    
    const systemPrompt = `
      You are the Dungeon Master for a D&D 5e campaign.
      Campaign Context: ${campaignContext}
      
      Your Role:
      1. Narrate the story vividly.
      2. React to player actions (in the chat history).
      3. Ask for rolls when necessary (e.g., "Roll for Initiative").
      4. Keep descriptions concise (under 150 words) but evocative.
      5. Do not play the player characters. You control the world and NPCs.
    `;

    // Convert PlayerChat format to Gemini Content format
    const contents: Content[] = chatHistory.slice(-10).map(msg => ({
      role: msg.senderId === 'dm' || msg.senderId === 'ai-dm' ? 'model' : 'user',
      parts: [{ text: `${msg.senderName}: ${msg.content}` }]
    }));

    const response = await ai.models.generateContent({
      model: model,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.9,
      },
      contents: contents,
    });

    return response.text || "The dungeon falls silent...";
  } catch (error) {
    console.error("AI DM Error:", error);
    return "Something disrupts the reality of the realm (API Error).";
  }
};