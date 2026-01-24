import { GoogleGenerativeAI } from "@google/generative-ai";

export const GeminiService = {

    async checkGameUpdate(gameTitle, platform, apiKey) {
        if (!apiKey) throw new Error("API Key is missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use a model that supports search grounding
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: [{
                googleSearch: {}
            }]
        });

        const prompt = `Find the most recent major update, patch, or content release for the game "${gameTitle}" on ${platform}. 
    Do not restrict by time. Find the absolute latest update available, even if it is old.
    
    Return a JSON object with the following fields:
    - hasUpdate (boolean): Always true if any update history exists.
    - version (string): The version number or name of the update (e.g., "v1.2" or "Shadow of the Erdtree").
    - date (string): Release date of the update (YYYY-MM-DD format if possible).
    - summary (string): A short, exciting summary of the key changes (max 3 bullet points).
    - originalLink (string): A link to the official patch notes or news source if available (optional).
    
    Ensure the response is valid JSON.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonString = text.replace(/```json\n|\n```/g, "").trim();
            return JSON.parse(jsonString);
        } catch (error) {
            console.error("Gemini Scan Error:", error);
            return { hasUpdate: false, error: error.message };
        }
    }
};
