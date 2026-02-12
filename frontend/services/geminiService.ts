
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchDestination = async (query: string): Promise<SearchResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest a travel itinerary or details for: ${query}. Provide realistic price estimates and top activities.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          priceEstimate: { type: Type.STRING },
          bestTimeToVisit: { type: Type.STRING },
          topActivities: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "description", "priceEstimate", "bestTimeToVisit", "topActivities"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not process search results.");
  }
};
