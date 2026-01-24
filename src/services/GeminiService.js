import { GoogleGenerativeAI } from "@google/generative-ai";

export const GeminiService = {

    async checkUpdatesBatch(gamesList, apiKey) {
        if (!apiKey) throw new Error("API Key is missing");

        const genAI = new GoogleGenerativeAI(apiKey);

        // gemini-1.5-pro is standard and stable for tool use (2 RPM free tier limit)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            tools: [{
                googleSearch: {}
            }]
        });

        // Construct a prompt listing all games
        const gamesListText = gamesList.map(g => `- ${g.title} (Platform: ${g.platform || 'PC'})`).join('\n');

        const prompt = `Find the most recent major update, patch, or content release for the following games:
        
${gamesListText}

    For EACH game in the list above, find the absolute latest update available (do not restrict by time).
    
    Return a SINGLE JSON ARRAY containing an object for each game with the following fields:
    - gameTitle (string): The name of the game (must match input).
    - hasUpdate (boolean): Always true if any update history exists.
    - version (string): The version number or name of the update.
    - date (string): Release date of the update (YYYY-MM-DD).
    - summary (string): A short, exciting summary of the key changes.
    - originalLink (string): A link to the official patch notes if available.
    
    Ensure the response is a valid JSON Array.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonString = text.replace(/```json\n|\n```/g, "").trim();
            const parsed = JSON.parse(jsonString);

            // Ensure we return an array
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            console.error("Gemini Batch Scan Error:", error);
            return { error: error.message };
        }
    }
};
