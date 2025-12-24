import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFestiveDescription = async (address: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a short, whimsical, 2-sentence holiday description for a festive home display at ${address}. Make it sound magical and inviting.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    return response.text || "A magical display of holiday cheer!";
  } catch (error) {
    console.error("Gemini failed to generate description:", error);
    return "A beautiful display of lights that warms the heart this holiday season.";
  }
};