import { ref } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettings } from './useSettings';

// Global State
const isGenerating = ref(false);
const error = ref(null);
const showCopyFeedback = ref(false);

// --- HELPER: Groq API Call ---
const callGroq = async (apiKey, prompt, model = 'llama-3.3-70b-versatile') => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Groq API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
};

// --- HELPER: Gemini API Call ---
const callGemini = async (apiKey, prompt, modelName = 'gemini-2.5-flash') => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 1.5,
            topP: 0.95,
            topK: 40,
        }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};


export function useAI() {
    const { geminiApiKey, groqApiKey, tavilyApiKey, aiProvider } = useSettings();
    const { apiKey: rawgApiKey } = useSettings(); // RAWG requires separate apiKey

    const generateGameRecommendation = async (backlogGames, playedGames, playingGames, preferredVibe = null, language = 'en') => {
        isGenerating.value = true;
        error.value = null;

        const provider = aiProvider.value;
        const currentApiKey = provider === 'groq' ? groqApiKey.value : geminiApiKey.value;

        if (!currentApiKey) {
            error.value = `API Key missing for provider: ${provider.toUpperCase()}`;
            isGenerating.value = false;
            return [];
        }

        console.log(`[useAI] Generating with Provider: ${provider}`);

        try {
            // Format lists
            const formatGame = (g) => {
                const ratingInfo = g.rating > 0 ? ` (Rated: ${g.rating}/5 ⭐)` : '';
                return `${g.title}${ratingInfo}`;
            };

            const playedList = (playedGames || []).map(formatGame);
            const playingList = (playingGames || []).map(g => g.title);
            const backlogList = (backlogGames || []).map(g => g.title);

            const contextString = playedList.join('\n- ');

            // Construct Vibe Instruction & Search Query
            let vibeInstruction = "";
            let searchQuery = `top rated new video games ${new Date().getFullYear()} ${language === 'de' ? 'germany' : ''}`;

            if (preferredVibe && preferredVibe !== 'Surprise Me') {
                vibeInstruction = `
                CURRENT MOOD / PREFERENCE:
                The user is currently in the mood for a "${preferredVibe}" game.
                Please PRIORITIZE recommending games that fit this vibe or genre.
                However, do NOT strictly limit yourself to this if there is a perfect match from another genre that fits the user's high-rated history.
                `;
                searchQuery = `best ${preferredVibe} games ${new Date().getFullYear()} reviews`;
            }

            // --- LIVE WEB CONTEXT ---
            let webContext = "";
            if (tavilyApiKey.value && provider !== 'gemini') {
                console.log(`[useAI] Oracle Searching: ${searchQuery}`);
                const searchResults = await searchWeb(tavilyApiKey.value, searchQuery);
                if (searchResults) {
                    webContext = `
                    \n=== MARKET RESEARCH (LIVE WEB DATA) ===
                    The following games are currently popular/trending or highly rated:
                    ${searchResults}
                    =======================================
                    INSTRUCTION: You MAY use this list to find modern games that fit the user's vibe.
                    `;
                }
            }

            const prompt = `
            You are "The Oracle", a mythical web-traveling entity that helps gamers discover NEW adventures.
            LANGUAGE INSTRUCTION: Respond in ${language === 'de' ? 'GERMAN (Deutsch)' : 'ENGLISH'}.
            
            ${webContext}

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
            2. **Discovery**: Recommend exactly THREE (3) NEW games.
            
            OUTPUT: JSON Array only. No markdown.
            [
                {
                    "gameTitle": "Exact Title",
                    "reasoning": "A concise bullet-point style summary (max 2 lines). Mention WHY it fits based on history/mood.",
                    "estimatedHours": 10,
                    "vibe": "Adjective"
                }
            ]
            `;

            let textResponse = '';

            if (provider === 'groq') {
                textResponse = await callGroq(currentApiKey, prompt + "\nensure VALID JSON output. Do not include explanation outside JSON.");
            } else {
                textResponse = await callGemini(currentApiKey, prompt);
            }

            // Cleanup JSON
            const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            let recommendations = [];
            try {
                const parsed = JSON.parse(jsonStr);
                recommendations = Array.isArray(parsed) ? parsed : [parsed];
            } catch (jsonErr) {
                console.error("JSON Parse Error", jsonErr, textResponse);
                throw new Error("AI returned invalid JSON. Please try again.");
            }

            // Fetch Images from RAWG
            const getTrailerUrl = (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;

            if (rawgApiKey.value) {
                const enhanced = await Promise.all(recommendations.map(async (rec) => {
                    try {
                        const searchUrl = `https://api.rawg.io/api/games?key=${rawgApiKey.value}&search=${encodeURIComponent(rec.gameTitle)}&page_size=1`;
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
                return enhanced;
            }

            return recommendations.map(rec => ({
                ...rec,
                image: null,
                trailerUrl: getTrailerUrl(rec.gameTitle)
            }));

        } catch (e) {
            console.error('[useAI] Error:', e);
            error.value = e.message;
            throw e;
        } finally {
            isGenerating.value = false;
        }
    };

    // --- HELPER: Tavily Search ---
    const searchWeb = async (apiKey, query) => {
        try {
            console.log(`[useAI] Executing Tavily Search: "${query}"`);
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query,
                    search_depth: "advanced", // Use advanced for deeper content
                    include_answer: false,
                    max_results: 5,
                    // topic: "news" - Removed as it returns generic news
                })
            });

            if (!response.ok) {
                console.error(`[useAI] Tavily Search Error: ${response.status} ${response.statusText}`);
                const err = await response.text();
                console.error(`[useAI] Tavily Error Details: ${err}`);
                return null;
            }

            const data = await response.json();
            console.log(`[useAI] Tavily Results Found: ${data.results.length}`);
            return data.results.map(r => `[${r.title}](${r.url}) (${r.published_date || 'No Date'}):\n${r.content}`).join('\n\n');
        } catch (e) {
            console.warn("[useAI] Tavily Search Exception:", e);
            return null;
        }
    };

    const generateGameUpdates = async (gameTitle, platform, language = 'en') => {
        isGenerating.value = true;
        error.value = null;

        const provider = aiProvider.value;
        const currentApiKey = provider === 'groq' ? groqApiKey.value : geminiApiKey.value;

        if (!currentApiKey) {
            error.value = "Missing API Key";
            isGenerating.value = false;
            return null;
        }

        try {
            // Get current date for context
            const now = new Date();
            const currentMonth = now.toLocaleString('default', { month: 'long' });
            const currentYear = now.getFullYear();

            let searchContext = "";
            if (tavilyApiKey.value && provider !== 'gemini') {
                // Simplified strict query for the game
                const query = `"${gameTitle}" patch notes updates ${currentYear}`;
                const searchResults = await searchWeb(tavilyApiKey.value, query);
                if (searchResults) {
                    searchContext = `
                     \n=== LIVE WEB SEARCH RESULTS (REAL-TIME CONTEXT) ===
                     ${searchResults}
                     ===================================================
                     `;
                }
            }

            const prompt = `
             You are a dedicated Gaming News Analyst.
             CURRENT DATE: ${currentMonth} ${currentYear}.
             TARGET GAME: "${gameTitle}" (Platform: ${platform}).

             ${searchContext || ''}

             INSTRUCTION: ${searchContext ? 'Use the "LIVE WEB SEARCH RESULTS" provided above to answer.' : 'Search for ANY latest updates, news, patches, or DLC for the game.'}
             
             TASK:
             Identify updates, DLCs, or patches if you find ANY.
             ${searchContext ? 'Summarize the REAL updates found in the search results.' : 'If absolutely nothing is found, just say so. Otherwise summarize found info.'}
             
             OUTPUT FORMAT:
             - 2-3 Bullet points MAX.
             - Cite sources/dates if available in context.
             
             LANGUAGE: Respond in ${language === 'de' ? 'GERMAN (Deutsch)' : 'ENGLISH'}.
             `;

            let text = '';
            if (provider === 'groq') {
                text = await callGroq(currentApiKey, prompt);
            } else {
                text = await callGemini(currentApiKey, prompt);
            }
            return text;
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            isGenerating.value = false;
        }
    };

    // Helper: Copy Prompt for Web Check
    const handleWebCheck = async (gamesList) => {
        if (!gamesList || gamesList.length === 0) return;

        const titles = gamesList.map(g => g.title).join(', ');
        const promptText = `Find the latest updates, patch notes, or DLC news for these games: ${titles}. Focus on 2024-2026.`;

        try {
            await navigator.clipboard.writeText(promptText);
            showCopyFeedback.value = true;
            setTimeout(() => showCopyFeedback.value = false, 3000);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return {
        generateGameRecommendation,
        generateGameUpdates,
        handleWebCheck,
        showCopyFeedback,
        isGenerating,
        error
    };
}
