import { ref, computed, watch } from 'vue';

const GAMES_STORAGE_KEY = 'game-tracker-games';
const API_KEY_STORAGE_KEY = 'game-tracker-api-key';
const GEMINI_API_KEY_STORAGE_KEY = 'game-tracker-gemini-api-key';
import { GeminiService } from '../services/GeminiService';

// Shared Global State
const games = ref([]);
const apiKey = ref(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
const geminiApiKey = ref(localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '');
const updates = ref([]); // { gameId, title, date, summary, originalLink, seen: false }
const isScanning = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const scanLogs = ref([]); // Public logs for UI debugging

const USER_STORAGE_KEY = 'game-tracker-user';
const userXP = ref(0);
const userName = ref('Guest');
const userAvatar = ref(null);

// Initialization logic
const savedGames = localStorage.getItem(GAMES_STORAGE_KEY);
if (savedGames) {
    try {
        games.value = JSON.parse(savedGames);
    } catch (e) {
        console.error('Failed to parse saved games', e);
    }
}

const savedUser = localStorage.getItem(USER_STORAGE_KEY);
if (savedUser) {
    try {
        const userData = JSON.parse(savedUser);
        userXP.value = userData.xp || 0;
        userName.value = userData.name || 'Guest';
        userAvatar.value = userData.avatar || null;
    } catch (e) {
        console.error('Failed to parse user data', e);
    }
}

// Watchers
watch(games, (newGames) => {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(newGames));
}, { deep: true });

watch([userXP, userName, userAvatar], () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
        xp: userXP.value,
        name: userName.value,
        avatar: userAvatar.value
    }));
});

export function useGames() {

    // Gamification Computed
    const userLevel = computed(() => Math.floor(userXP.value / 100) + 1);
    const nextLevelXP = computed(() => userLevel.value * 100);
    const currentLevelXP = computed(() => userXP.value % 100);
    const xpProgress = computed(() => (currentLevelXP.value / 100) * 100);

    const userTitle = computed(() => {
        const lvl = userLevel.value;
        if (lvl >= 50) return 'Godlike Entity';
        if (lvl >= 30) return 'Legendary Hero';
        if (lvl >= 20) return 'Master of Worlds';
        if (lvl >= 10) return 'Elite Gamer';
        if (lvl >= 5) return 'Quest Seeker';
        if (lvl >= 2) return 'Rising Star';
        return 'Novice Adventurer';
    });

    const awardXP = (amount) => {
        userXP.value += amount;
        // Ideally trigger a toast notification here
        console.log(`Awarded ${amount} XP! New Total: ${userXP.value}`);
    };

    // Actions
    const setApiKey = (key) => {
        apiKey.value = key;
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    };

    const setGeminiApiKey = (key) => {
        geminiApiKey.value = key;
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key);
    };

    const setUserName = (name) => {
        userName.value = name;
    };

    const setUserAvatar = (dataUrl) => {
        userAvatar.value = dataUrl;
    };

    // Enhance Status with 'dropped'
    const backlogGames = computed(() => games.value.filter(g => g.status === 'backlog'));
    const playingGames = computed(() => games.value.filter(g => g.status === 'playing'));
    const completedGames = computed(() => games.value.filter(g => g.status === 'completed').sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)));
    const droppedGames = computed(() => games.value.filter(g => g.status === 'dropped'));

    // Pile of Shame (Total hours in backlog)
    const pileOfShameHours = computed(() => {
        return backlogGames.value.reduce((total, game) => total + (game.playtime || 0), 0);
    });

    const addGame = async (gameData, platform = 'PC') => {
        if (games.value.some(g => g.id === gameData.id)) return; // Prevent duplicates

        // 1. Create Basic Object (Optimistic)
        // Use the playtime provided by the search result (usually integers) as a temporary value
        const newGame = {
            id: gameData.id,
            title: gameData.name,
            background_image: gameData.background_image,
            released: gameData.released,
            status: 'backlog',
            platform: platform,
            playtime: gameData.playtime || 0,
            rating: 0,
            addedAt: new Date().toISOString()
        };

        // 2. Add Immediately
        games.value.push(newGame);
        awardXP(10);

        // 3. Fetch Full Details in Background
        if (apiKey.value) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${gameData.id}?key=${apiKey.value}`);
                if (response.ok) {
                    const details = await response.json();

                    // 4. Update the existing object in the array deeply
                    const gameToUpdate = games.value.find(g => g.id === gameData.id);
                    if (gameToUpdate) {
                        // We use Object.assign to mutate the reactive object in place
                        // This ensures 'gameDetails' refs in Modals stay valid
                        Object.assign(gameToUpdate, {
                            ...details,
                            // Preserve these local overrides just in case API conflicts (unlikely but safe)
                            status: gameToUpdate.status,
                            platform: gameToUpdate.platform,
                            rating: gameToUpdate.rating,
                            addedAt: gameToUpdate.addedAt,
                            startedAt: gameToUpdate.startedAt,
                            completedAt: gameToUpdate.completedAt,
                            // Prefer API playtime if non-zero, else keep existing
                            playtime: details.playtime || gameToUpdate.playtime
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to fetch full details on add', e);
            }
        }
    };

    const updateStatus = (id, newStatus) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            const oldStatus = game.status;
            game.status = newStatus;

            if (newStatus === 'playing' && oldStatus !== 'playing') {
                if (!game.startedAt) {
                    game.startedAt = new Date().toISOString();
                }
                if (oldStatus === 'backlog') {
                    awardXP(50); // +50 XP for starting
                }
            }

            if (newStatus === 'completed' && oldStatus !== 'completed') {
                game.completedAt = new Date().toISOString();
                awardXP(200); // +200 XP for finishing
            }
        }
    };

    const rateGame = (id, rating) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            game.rating = rating;
        }
    };

    const removeGame = (id) => {
        games.value = games.value.filter(g => g.id !== id);
    };

    const searchGames = async (query) => {
        if (!query || !apiKey.value) return;

        isSearching.value = true;
        try {
            const response = await fetch(`https://api.rawg.io/api/games?key=${apiKey.value}&search=${encodeURIComponent(query)}&page_size=10`);
            const data = await response.json();
            searchResults.value = data.results || [];
        } catch (error) {
            console.error('Search failed', error);
            searchResults.value = [];
        } finally {
            isSearching.value = false;
        }
    };

    const exportData = () => {
        const dataStr = JSON.stringify(games.value, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gametracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const importData = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedGames = JSON.parse(e.target.result);
                    if (Array.isArray(importedGames)) {
                        games.value = importedGames;
                        resolve(true);
                    } else {
                        reject(new Error('Invalid format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const scanForUpdates = async () => {
        if (!geminiApiKey.value) {
            scanLogs.value.push("Error: API Key missing.");
            return { success: false, error: "Please save your Gemini API Key in Settings first." };
        }

        isScanning.value = true;
        scanLogs.value = ["Starting scan...", "Checking games list..."];

        try {
            // Filter games: Playing and Backlog
            const targetGames = games.value.filter(g => g.status === 'playing' || g.status === 'backlog');

            if (targetGames.length === 0) {
                scanLogs.value.push("No relevant games found to scan.");
                return { success: false, error: "No games found in 'Playing' or 'Backlog' status to scan." };
            }

            scanLogs.value.push(`Found ${targetGames.length} games to scan.`);

            let errors = [];
            let scannedCount = 0;

            // Batch processing: Chunk games into groups of 3 (Safe Mode)
            const CHUNK_SIZE = 3;
            const totalBatches = Math.ceil(targetGames.length / CHUNK_SIZE);

            for (let i = 0; i < targetGames.length; i += CHUNK_SIZE) {
                const chunk = targetGames.slice(i, i + CHUNK_SIZE);
                const batchNum = Math.floor(i / CHUNK_SIZE) + 1;

                scanLogs.value.push(`Scanning Batch ${batchNum}/${totalBatches} (${chunk.map(g => g.title).join(', ')})...`);

                try {
                    const results = await GeminiService.checkUpdatesBatch(chunk, geminiApiKey.value);

                    if (results.error) {
                        const errMsg = `Batch ${batchNum} Failed: ${results.error}`;
                        console.error(errMsg);
                        scanLogs.value.push(`❌ ${errMsg}`);
                        // If rate limit, stop everything
                        if (results.error.includes('429') || results.error.includes('Quota')) {
                            scanLogs.value.push("⛔ Rate Limit Hit. Stops.");
                            break;
                        }
                        errors.push(errMsg);
                        continue;
                    }

                    if (Array.isArray(results)) {
                        scanLogs.value.push(`✔ Batch ${batchNum} Success. Received ${results.length} updates.`);
                        for (const res of results) {
                            if (res.hasUpdate) {
                                // Find original game ID by title matching
                                const originalGame = chunk.find(g => g.title === res.gameTitle) || chunk.find(g => res.gameTitle.includes(g.title));

                                if (originalGame) {
                                    const exists = updates.value.some(u => u.gameId === originalGame.id && u.version === res.version);
                                    if (!exists) {
                                        scanLogs.value.push(`  ➤ New Update: ${originalGame.title} - ${res.version}`);
                                        updates.value.push({
                                            gameId: originalGame.id,
                                            gameTitle: originalGame.title,
                                            ...res,
                                            seen: false,
                                            fetchedAt: new Date().toISOString()
                                        });
                                    } else {
                                        scanLogs.value.push(`  (Skipped existing: ${originalGame.title})`);
                                    }
                                }
                            }
                        }
                        scannedCount += chunk.length;
                    } else {
                        scanLogs.value.push(`⚠ Batch ${batchNum} returned invalid format.`);
                    }

                    // Delay between batches
                    // Gemini 1.5 Pro Free Tier has a limit of 2 Requests Per Minute (RPM).
                    // We must wait 35 seconds to be safe.
                    if (i + CHUNK_SIZE < targetGames.length) {
                        scanLogs.value.push("⏳ Waiting 35s for rate limit (Gemini Pro)...");
                        await new Promise(resolve => setTimeout(resolve, 35000));
                    }

                } catch (e) {
                    console.error("Batch scan error", e);
                    scanLogs.value.push(`❌ Critical Batch Error: ${e.message}`);
                    errors.push(`Batch error: ${e.message}`);
                }
            }

            scanLogs.value.push("✅ Scan Complete.");
            return {
                success: true,
                newUpdates: updates.value.filter(u => !u.seen).length,
                scannedCount,
                errors
            };
        } finally {
            isScanning.value = false;
        }
    };

    const markUpdateSeen = (gameId, version) => {
        const update = updates.value.find(u => u.gameId === gameId && u.version === version);
        if (update) update.seen = true;
    };

    const generateWebScanUrl = () => {
        const targetGames = games.value.filter(g => g.status === 'playing' || g.status === 'backlog');
        if (targetGames.length === 0) return 'https://gemini.google.com/app';

        const gameTitles = targetGames.map(g => g.title).join(', ');
        const prompt = `Find the most recent major update, patch, or content release for the following games: ${gameTitles}. Provide the version number, status, and a short summary for each.`;

        return `https://gemini.google.com/app?text=${encodeURIComponent(prompt)}`;
    };


    return {
        games,
        apiKey,
        setApiKey,
        searchQuery,
        searchResults,
        isSearching,
        backlogGames,
        playingGames,
        completedGames,
        droppedGames,
        pileOfShameHours,
        addGame,
        updateStatus,
        rateGame,
        removeGame,
        searchGames,
        exportData,
        importData,
        userXP,
        userName,
        userAvatar,
        setUserName,
        setUserAvatar,
        userLevel,
        userTitle,
        xpProgress,
        awardXP,
        geminiApiKey,
        setGeminiApiKey,
        updates,
        scanForUpdates,
        markUpdateSeen,
        isScanning,
        scanLogs,
        scanLogs,
        getScanPromptString
    };
}
