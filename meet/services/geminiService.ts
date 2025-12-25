import { GoogleGenAI } from "@google/genai";
import { ComplaintType, ComplaintLanguage, ComplaintTemplate, LocationDetails } from "../types";

// Initialize Gemini Client
// Safely access env var without crashing if process is undefined
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || 'mock-key'; 
const ai = new GoogleGenAI({ apiKey });

// Helper to generate fallback content if AI fails or key is missing
const getFallbackLetter = (
  type: ComplaintType,
  location: LocationDetails,
  language: ComplaintLanguage,
  template: ComplaintTemplate,
  authority: string
) => {
  const date = new Date().toLocaleDateString(language === ComplaintLanguage.HINDI ? 'hi-IN' : 'en-IN');
  const authLine = authority || `${location.city} Municipal Corporation`;

  // Specific Fallback for Hindi
  if (language === ComplaintLanguage.HINDI) {
    return `[System: AI Service Busy. Generating Fallback Template]

दिनांक: ${date}

सेवा में,
${authLine}

विषय: ${type} के संबंध में शिकायत (${template})

महोदय/महोदया,

मैं आपका ध्यान ${location.area}, ${location.city} में हो रही ${type} की समस्या की ओर आकर्षित करना चाहता हूं।

यह समस्या स्थानीय निवासियों के लिए बहुत परेशानी का कारण बन रही है।
कृपया इस मामले की जांच करें और शीघ्र समाधान करें।

धन्यवाद,

भवदीय,
एक जागरूक नागरिक`;
  } 
  
  // Specific Fallback for Gujarati
  if (language === ComplaintLanguage.GUJARATI) {
    return `[System: AI Service Busy. Generating Fallback Template]

તારીખ: ${date}

પ્રતિ,
${authLine}

વિષય: ${type} અંગે ફરિયાદ (${template})

સાહેબશ્રી,

હું તમારું ધ્યાન ${location.area}, ${location.city} માં ${type} ની સમસ્યા તરફ દોરવા માંગુ છું.

આ સમસ્યા સ્થાનિક રહેવાસીઓ માટે ઘણી મુશ્કેલી ઊભી કરી રહી છે.
કૃપા કરીને આ બાબતની તપાસ કરો અને જલ્દી ઉકેલ લાવો.

આભાર સહ,

આપનો વિશ્વાસુ,
જાગૃત નાગરિક`;
  }

  // Generic Fallback for English and other languages (where hardcoded template isn't available)
  // For languages like Marathi/Tamil etc, we fallback to English with a note, 
  // as hardcoding templates for 10 languages without AI is prone to error.
  return `[System: AI Service Busy. Generating Fallback Template]
[Note: AI generation unavailable. Letter generated in English.]

Date: ${date}

To,
${authLine}

Subject: Complaint regarding ${type} (${template})

Respected Sir/Madam,

I am writing to bring to your attention the issue of ${type} at ${location.area}, ${location.city}, ${location.state}.

This problem is causing significant inconvenience to the residents and requires your attention. 
${template === ComplaintTemplate.URGENT ? 'This is an urgent matter that poses safety risks.' : 'We request you to take necessary action.'}

I request you to kindly inspect the site and resolve the issue as soon as possible.

Sincerely,

Resident of ${location.area}`;
};

export const generateComplaintDescription = async (
  type: ComplaintType,
  location: LocationDetails,
  language: ComplaintLanguage
): Promise<string> => {
  const hasKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;
  
  if (!hasKey) {
    return `The ${type} in ${location.area || 'our area'} is causing significant issues for residents. We request immediate attention to resolve this matter.`;
  }

  const prompt = `
    Task: Write a concise, clear problem description (1-3 sentences) for a civic complaint.
    Topic: ${type}
    Location: ${location.area}, ${location.city} (Include only if relevant to the sentence flow).
    Target Language: ${language}

    Requirements:
    - Strictly 1-3 sentences.
    - Professional, formal, but simple tone.
    - Specific to the category '${type}' (e.g., if Road: mention potholes/damage; if Water: mention supply/quality).
    - Do NOT include headers, subject lines, or salutations. Just the description text.
    - Example Output: "The drainage system in Sector 5 is clogged, causing water to accumulate during heavy rains."
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Description Generation Error:", error);
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
  
  // MOCK RESPONSE HANDLING FOR NO API KEY
  // Safe check for key existence
  const hasKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;

  if (!hasKey) {
    return getFallbackLetter(type, location, language, template, authority);
  }

  // Uses the authority string passed from the frontend which includes Officer + Body + Department
  const authorityHint = authority || `${location.city} Municipal Corporation`;

  let templateInstructions = "";
  switch (template) {
    case ComplaintTemplate.URGENT:
      templateInstructions = "Tone: Highly Urgent & Serious. Explicitly mention safety hazards or health risks. Use phrases like 'immediate attention required', 'grave concern'. Request action within 48 hours.";
      break;
    case ComplaintTemplate.REMINDER:
      templateInstructions = "Tone: Firm & Persistent. State that this is a follow-up to a previous complaint. Express dissatisfaction with the delay.";
      break;
    case ComplaintTemplate.NORMAL:
    default:
      templateInstructions = "Tone: Professional, Polite & Firm. Standard grievance letter structure.";
      break;
  }

  // Language Specific Instructions
  let languageInstructions = "";
  
  if (language === ComplaintLanguage.HINDI) {
    languageInstructions = `
      - OUTPUT LANGUAGE: PURE FORMAL HINDI (Devanagari Script).
      - TRANSLATE HEADERS: "To" -> "सेवा में", "Subject" -> "विषय", "Respected Sir/Madam" -> "महोदय / महोदया", "Sincerely" -> "भवदीय".
      - VOCABULARY: Use formal government Hindi terms (e.g., 'निवेदन', 'समस्या', 'कष्ट', 'शीघ्र कार्यवाही').
      - DATE FORMAT: DD-MM-YYYY (Devanagari numerals optional but standard preferred).
      - TRANSLATE THE AUTHORITY NAME provided in 'Suggested Authority' to Hindi if it is in English.
    `;
  } else if (language === ComplaintLanguage.GUJARATI) {
    languageInstructions = `
      - OUTPUT LANGUAGE: PURE FORMAL GUJARATI.
      - TRANSLATE HEADERS: "To" -> "પ્રતિ", "Subject" -> "વિષય", "Respected Sir/Madam" -> "માનનીય સાહેબશ્રી", "Sincerely" -> "આપનો વિશ્વાસુ".
      - VOCABULARY: Use formal government Gujarati terms.
      - TRANSLATE THE AUTHORITY NAME provided in 'Suggested Authority' to Gujarati if it is in English.
    `;
  } else if (language === ComplaintLanguage.ENGLISH) {
    languageInstructions = `
      - OUTPUT LANGUAGE: ENGLISH.
      - Tone: Official Indian Government Correspondence style.
    `;
  } else {
    // Generic Instruction for other Indian Languages (Marathi, Punjabi, Tamil, etc.)
    // We rely on the model's strong multilingual capabilities here.
    languageInstructions = `
      - OUTPUT LANGUAGE: PURE FORMAL ${language.toUpperCase()}.
      - TRANSLATE HEADERS: Use standard formal government letter headers for ${language} (equivalent of 'To', 'Subject', 'Respected Sir', 'Sincerely').
      - VOCABULARY: Use formal administrative terms suitable for official complaints in ${language}.
      - TRANSLATE THE AUTHORITY NAME provided in 'Suggested Authority' to ${language} script if it is in English.
      - Ensure the script is native ${language} script.
    `;
  }

  // Image Attachment Instruction
  // Instead of hardcoding the string, we tell the AI to generate it in the target language.
  let imageInstruction = "";
  if (imageBase64) {
    imageInstruction = `
      - IMPORTANT: The user has attached a photo. Include a sentence in the body text (in ${language}) explicitly stating that "Photographic evidence of the issue is attached for reference."
    `;
  }

  const prompt = `
  Context: The user has reported a "${type}".
  Location: Area: ${location.area}, City: ${location.city}, State: ${location.state}, Ward: ${location.ward || 'N/A'}.
  Suggested Authority: ${authorityHint}
  Problem Description: "${description}"
  
  Task: Write a formal, strictly professional complaint letter to the relevant Municipal Corporation or Local Authority in India.
  
  Configuration:
  - Target Language: ${language}
  - Template Type: ${template}
  - Language Rules: ${languageInstructions}
  - Tone Instructions: ${templateInstructions}
  ${imageInstruction}
  
  Format Requirements:
  1. Date (Current Date)
  2. To Address: Use the 'Suggested Authority' provided above. Translate it if the target language is not English.
  3. Subject Line (Formal and Concise)
  4. Salutation
  5. Body Paragraphs:
     - Introduce the resident/area.
     - Describe the issue (${type}) based on the "Problem Description" provided.
     - Explain the impact (health, safety, traffic, etc.).
     - Request specific action.
  6. Closing & Signature Placeholder.
  
  IMPORTANT: Do NOT include any markdown formatting like **bold** or # headings. Return ONLY the plain text of the letter.
  `;

  const parts: any[] = [{ text: prompt }];

  // Add image if it exists
  if (imageBase64) {
    // Basic validation to ensure data URI structure
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1], 
          data: matches[2]
        }
      });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ]
    });
    return response.text || "Error generating letter. Please try again.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback to template if API fails (e.g., 500 error, network issue)
    return getFallbackLetter(type, location, language, template, authority);
  }
};

export const getChatBotResponse = async (
  message: string,
  languageCode: string,
  userContext: { isLoggedIn: boolean; name?: string }
): Promise<string> => {
  
  const hasKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;
  if (!hasKey) {
    return "I am currently in demo mode. Please connect a valid API key to chat with me!";
  }

  const prompt = `
    You are the "Civic Lens Support Agent", an AI assistant for the Civic Lens web application.
    
    APP CONTEXT:
    - Civic Lens helps Indian citizens generate formal complaint letters for civic issues.
    - Features: Multi-language support (10+ Indian Languages), Photo Upload, Auto-location.
    - Export options: PDF, Word (Docx).
    
    USER CONTEXT:
    - Language: ${languageCode} (You MUST respond in this language).
    - Logged In: ${userContext.isLoggedIn ? 'Yes' : 'No'}.
    - Name: ${userContext.name || 'Guest'}.

    YOUR ROLE:
    - Answer questions about how to use the app.
    - Guide users on the complaint process.
    - Be polite, professional, and helpful.
    - Keep answers concise (under 50 words usually).
    
    USER QUERY: "${message}"

    If the user asks about something unrelated to the app or civic issues, politely redirect them to the app's purpose.
    If you don't know the answer, suggest they email "support@civiclens.ai".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "I'm having trouble connecting right now. Please try again later.";
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I am currently offline due to a connection issue. Please try again.";
  }
};
