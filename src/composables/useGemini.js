
import { ref } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function useGemini() {
    const isGenerating = ref(false);
    const error = ref(null);

    const debugModels = async (apiKey) => {
        try {
            console.log("Gemini: Checking API access...");

            // Check v1 (Standard)
            const responseV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
            const dataV1 = await responseV1.json();
            console.log("AVAILABLE MODELS (v1):", dataV1);

            // Check v1beta (Preview/New)
            const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const dataBeta = await responseBeta.json();
            console.log("AVAILABLE MODELS (v1beta):", dataBeta);

            return [
                ...(dataV1.models || []),
                ...(dataBeta.models || [])
            ];
        } catch (e) {
            console.error("Error listing debug models:", e);
            return [];
        }
    };

    const getPrioritizedModels = async (apiKey) => {
        // Force usage of the only verified working model: gemini-2.5-flash
        // gemini-2.5-pro fails with Quota Limit 0.
        await debugModels(apiKey);
        return ["gemini-2.5-flash"];
    };

    const generateGameRecommendation = async (backlogGames, playedGames, playingGames, apiKey, preferredVibe = null, language = 'en') => {
        if (!apiKey) {
            throw new Error('API Key is missing. Please add it in Settings.');
        }

        console.log(`Gemini: Generating recommendations... (Language: ${language})`, new Date().toISOString());

        isGenerating.value = true;
        error.value = null;

        try {
            const modelsToTry = await getPrioritizedModels(apiKey);
            console.log("Gemini: Dynamic Model List for Recommendations:", modelsToTry);

            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Gemini Recommendations: Attempting with model: ${modelName}`);
                    const genAI = new GoogleGenerativeAI(apiKey.trim());
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: 1.5,
                            topP: 0.95,
                            topK: 40,
                        }
                    });
                    console.log("Gemini: Initialized Model ->", modelName);
                    console.log("Gemini: Using API Key ending in...", apiKey.slice(-4));

                    // Format lists for EXCLUSION & CONTEXT
                    const formatGame = (g) => {
                        const ratingInfo = g.rating > 0 ? ` (Rated: ${g.rating}/5 ⭐)` : '';
                        return `${g.title}${ratingInfo}`;
                    };

                    const playedList = (playedGames || []).map(formatGame);
                    const playingList = (playingGames || []).map(g => g.title);
                    const backlogList = (backlogGames || []).map(g => g.title);

                    const allTitles = [
                        ...(playedGames || []).map(g => g.title),
                        ...(playingGames || []).map(g => g.title),
                        ...(backlogGames || []).map(g => g.title)
                    ];
                    // const excludedString = allTitles.slice(0, 300).join(', '); // Unused currently

                    const contextString = playedList.join('\n- ');

                    // Construct Vibe Instruction
                    let vibeInstruction = "";
                    if (preferredVibe && preferredVibe !== 'Surprise Me') {
                        vibeInstruction = `
                    CURRENT MOOD / PREFERENCE:
                    The user is currently in the mood for a "${preferredVibe}" game.
                    Please PRIORITIZE recommending games that fit this vibe or genre.
                    However, do NOT strictly limit yourself to this if there is a perfect match from another genre that fits the user's high-rated history.
                    Use the preference as a strong suggestion/weighting, not a hard filter.
                        `;
                    }

                    const prompt = `
                    You are "The Oracle", a mythical web-traveling entity that helps gamers discover NEW adventures.
                    LANGUAGE INSTRUCTION: Respond in ${language === 'de' ? 'GERMAN (Deutsch)' : 'ENGLISH'}.
                    
                    CONTEXT (USER HISTORY):
                    The user has played/liked the following games (with their personal ratings):
                    - ${contextString}

                    The user is currently playing:
                    ${playingList.join(', ')}

                    Also, the user already owns these games (DO NOT SUGGEST):
                    ${backlogList.join(', ')}

                    ${vibeInstruction}

                    CRITICAL INSTRUCTIONS:
                    1. **Exclusion**: Do NOT recommend any game the user already owns (listed above).
                    2. **Ratings Analysis**:
                    3. **Discovery**: Recommend exactly THREE (3) NEW games.

                    TASK:
                    Recommend exactly THREE (3) NEW video games.
                    Focus on hidden gems or high-quality titles matching the user's tastes${preferredVibe ? ` and current mood (${preferredVibe})` : ''}.

                    RESPONSE FORMAT:
                    Provide a JSON array of 3 objects. Do not wrap in markdown.
                    [
                        {
                            "gameTitle": "Exact Title",
                            "reasoning": "A concise bullet-point style summary (max 2 lines). Mention WHY it fits based on history/mood. Write this in ${language === 'de' ? 'GERMAN' : 'ENGLISH'}.",
                            "estimatedHours": 10,
                            "vibe": "Adjective (in ${language === 'de' ? 'GERMAN' : 'ENGLISH'})"
                        },
                        ...
                    ]
                    `;

                    console.log("Gemini Prompt Vibe:", preferredVibe || "None");

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

                    const suggestions = JSON.parse(text);
                    const recommendations = Array.isArray(suggestions) ? suggestions : [suggestions];

                    // Enhance with Images from RAWG
                    const rawgKey = localStorage.getItem('game-tracker-api-key');
                    const getTrailerUrl = (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;

                    if (rawgKey) {
                        const enhanced = await Promise.all(recommendations.map(async (rec) => {
                            try {
                                const searchUrl = `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(rec.gameTitle)}&page_size=1`;
                                const searchRes = await fetch(searchUrl);
                                const searchData = await searchRes.json();

                                if (searchData.results && searchData.results.length > 0) {
                                    const match = searchData.results[0];
                                    return {
                                        ...rec,
                                        image: match.background_image,
                                        id: match.id,
                                        rawgData: match,
                                        trailerUrl: getTrailerUrl(rec.gameTitle)
                                    };
                                }
                            } catch (e) {
                                console.error(`Image fetch failed for ${rec.gameTitle}`, e);
                            }
                            return {
                                ...rec,
                                image: null,
                                trailerUrl: getTrailerUrl(rec.gameTitle)
                            };
                        }));
                        console.log(`Gemini Recommendations: Success with ${modelName}`);
                        return enhanced;
                    }

                    console.log(`Gemini Recommendations: Success with ${modelName} (No RAWG)`);
                    return recommendations.map(rec => ({
                        ...rec,
                        trailerUrl: getTrailerUrl(rec.gameTitle)
                    }));

                } catch (err) {
                    console.warn(`Gemini Recommendations: Model ${modelName} failed:`, err.message);
                    lastError = err;
                }
            }

            // All failed
            console.error("Gemini Recommendations: All models failed.", lastError);
            let msg = lastError ? lastError.message : "All models failed.";
            if (msg.includes('429') || msg.includes('quota')) {
                if (language === 'de') {
                    msg = "Tageslimit für AI erreicht (Google Quota). Bitte morgen erneut versuchen! 🤖💤";
                } else {
                    msg = "Daily AI Limit Reached (Google Quota). Please try again tomorrow! 🤖💤";
                }
            }
            error.value = msg;
            throw new Error(msg);

        } finally {
            isGenerating.value = false;
        }
    };

    // New Function for Game Updates
    const generateGameUpdates = async (gameTitle, platform, apiKey, language = 'en') => {
        if (!apiKey) {
            throw new Error('API Key is missing.');
        }

        isGenerating.value = true;
        error.value = null;

        // Key Check Logging...
        console.log("--------------- KEY CHECK ---------------");
        if (apiKey && apiKey.length > 10) {
            console.log("USING KEY:", apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 4));
        } else {
            console.error("KEY INVALID/EMPTY:", apiKey);
        }
        console.log("-----------------------------------------");

        try {
            const modelsToTry = await getPrioritizedModels(apiKey);
            console.log("Gemini: Dynamic Model List for Updates:", modelsToTry);

            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Gemini Updates: Attempting with model: ${modelName}`);
                    const genAI = new GoogleGenerativeAI(apiKey.trim());
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: 1.5,
                            topP: 0.95,
                            topK: 40,
                        }
                    });

                    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                    const prompt = `
                    You are a gaming news assistant. 
                    LANGUAGE INSTRUCTION: Respond in ${language === 'de' ? 'GERMAN (Deutsch)' : 'ENGLISH'}.
                    
                    TASK:
                    Search for ANY latest updates, news, patches, or DLC for the game: "${gameTitle}".
                    
                    OUTPUT:
                    - If you find something (even rumors or fan projects), summarize it in 3-4 bullet points.
                    - If absolutely nothing is found, just say so.
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();

                    // If successful, return immediately
                    console.log(`Gemini Updates: Success with ${modelName}`);
                    return text;

                } catch (err) {
                    console.warn(`Gemini Updates: Model ${modelName} failed:`, err.message);
                    lastError = err;
                }
            }

            // If all failed
            console.error("Gemini Updates: All models failed.", lastError);
            let msg = lastError ? lastError.message : "All models failed.";

            if (msg.includes('429') || msg.includes('quota')) {
                if (language === 'de') {
                    msg = "Tageslimit für AI erreicht (Google Quota). Bitte morgen erneut versuchen! 🤖💤";
                } else {
                    msg = "Daily AI Limit Reached (Google Quota). Please try again tomorrow! 🤖💤";
                }
            } else if (msg.includes('404') || msg.includes('not found')) {
                if (language === 'de') {
                    msg = "AI Modell nicht verfügbar (Region/Key gesperrt). Bitte API Key prüfen.";
                } else {
                    msg = "AI Model not available (Region/Key blocked). Please check API Key.";
                }
            }
            error.value = msg;
            throw new Error(msg);

        } finally {
            isGenerating.value = false;
        }
    };



    return {
        isGenerating,
        error,
        generateGameRecommendation,
        generateGameUpdates,
        debugModels
    };
}
