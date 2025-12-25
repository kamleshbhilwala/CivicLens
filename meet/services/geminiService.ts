import { GoogleGenAI } from "@google/genai";
import { ComplaintType, ComplaintLanguage, ComplaintTemplate, LocationDetails } from "../types";

// 1. SAFE ENV ACCESS: This prevents TypeScript from complaining
const metaEnv = (import.meta as any).env;
const apiKey = metaEnv.VITE_GEMINI_API_KEY || 'mock-key'; 

const ai = new GoogleGenAI({ apiKey });

// Helper for fallback (No changes needed here)
const getFallbackLetter = (
  type: ComplaintType,
  location: LocationDetails,
  language: ComplaintLanguage,
  template: ComplaintTemplate,
  authority: string
) => {
  const date = new Date().toLocaleDateString(language === ComplaintLanguage.HINDI ? 'hi-IN' : 'en-IN');
  const authLine = authority || `${location.city} Municipal Corporation`;
  return `[System: AI Service Busy]\nDate: ${date}\nTo: ${authLine}\nSubject: ${type}\n\nRespected Sir/Madam,\nI am reporting ${type} at ${location.area}. Please take action.`;
};

export const generateComplaintDescription = async (
  type: ComplaintType,
  location: LocationDetails,
  language: ComplaintLanguage
): Promise<string> => {
  const hasKey = !!metaEnv.VITE_GEMINI_API_KEY;
  if (!hasKey) return `The ${type} in ${location.area} needs attention.`;

  const prompt = `Write a 2-sentence description for a ${type} complaint in ${language}.`;

  try {
    const response = await ai.models.generateContent({
      // 2. FIXED MODEL NAME: Use 'gemini-1.5-flash' (Current stable version)
      model: 'gemini-1.5-flash', 
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error:", error);
    return "";
  }
};

export const generateFormalLetter = async (
  type: ComplaintType, 
  description: string, 
  imageBase64: string | null,
  location: LocationDetails,
  language: ComplaintLanguage,
  template: ComplaintTemplate,
  authority: string
): Promise<string> => {
  const hasKey = !!metaEnv.VITE_GEMINI_API_KEY;
  if (!hasKey) return getFallbackLetter(type, location, language, template, authority);

  const prompt = `Generate a formal letter for ${type} in ${language}. Description: ${description}`;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Updated model name
      contents: [{ role: 'user', parts: parts }]
    });
    return response.text || "Error generating letter.";
  } catch (error) {
    return getFallbackLetter(type, location, language, template, authority);
  }
};

export const getChatBotResponse = async (
  message: string,
  languageCode: string,
  userContext: { isLoggedIn: boolean; name?: string }
): Promise<string> => {
  const hasKey = !!metaEnv.VITE_GEMINI_API_KEY;
  if (!hasKey) return "Demo mode: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Updated model name
      contents: [{ role: 'user', parts: [{ text: message }] }]
    });
    return response.text || "No response.";
  } catch (error) {
    return "I am currently offline.";
  }
};