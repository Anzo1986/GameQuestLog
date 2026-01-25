import { ref, computed, watch } from 'vue';

const GAMES_STORAGE_KEY = 'game-tracker-games';
const API_KEY_STORAGE_KEY = 'game-tracker-api-key';

// Shared Global State
const games = ref([]);
const apiKey = ref(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

const USER_STORAGE_KEY = 'game-tracker-user';
const THEME_STORAGE_KEY = 'game-tracker-theme';

const userXP = ref(0);
const userName = ref('Guest');
const userAvatar = ref(null);
const themeColor = ref(localStorage.getItem(THEME_STORAGE_KEY) || 'blue');

const THEMES = {
    blue: { name: 'Blue', rgb: '59 130 246' },   // blue-500
    pink: { name: 'Pink', rgb: '236 72 153' },   // pink-500
    green: { name: 'Green', rgb: '34 197 94' },    // green-500
    purple: { name: 'Purple', rgb: '168 85 247' },   // purple-500
    orange: { name: 'Orange', rgb: '249 115 22' },   // orange-500
    red: { name: 'Red', rgb: '239 68 68' },    // red-500
};

// Apply theme immediately
const applyTheme = (color) => {
    const theme = THEMES[color] || THEMES.blue;
    document.documentElement.style.setProperty('--primary-rgb', theme.rgb);
};
applyTheme(themeColor.value);

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

watch(themeColor, (newColor) => {
    localStorage.setItem(THEME_STORAGE_KEY, newColor);
    applyTheme(newColor);
});

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
        console.log(`Awarded ${amount} XP! New Total: ${userXP.value}`);
    };

    // Actions
    const setApiKey = (key) => {
        apiKey.value = key;
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    };

    const setUserName = (name) => {
        userName.value = name;
    };

    const setUserAvatar = (dataUrl) => {
        userAvatar.value = dataUrl;
    };

    const setTheme = (color) => {
        if (THEMES[color]) {
            themeColor.value = color;
            applyTheme(color); // Force update
        }
    };

    // Enhance Status with 'dropped'
    const backlogGames = computed(() => games.value.filter(g => g.status === 'backlog'));
    const playingGames = computed(() => games.value.filter(g => g.status === 'playing'));
    const completedGames = computed(() => games.value.filter(g => g.status === 'completed').sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)));
    const droppedGames = computed(() => games.value.filter(g => g.status === 'dropped'));

    const gameStats = computed(() => {
        const totalGames = games.value.length;
        if (totalGames === 0) return null;

        const statusCounts = {
            backlog: 0,
            playing: 0,
            completed: 0,
            dropped: 0
        };

        const genreCounts = {};
        const platformCounts = {};
        let totalDurationDays = 0;

        games.value.forEach(game => {
            // Status
            if (statusCounts[game.status] !== undefined) {
                statusCounts[game.status]++;
            }

            // Duration (Time Invested in Days)
            // Logic: startedAt -> completedAt (or Now)
            if (game.startedAt) {
                const start = new Date(game.startedAt);
                let end = new Date();

                if (game.status === 'completed' && game.completedAt) {
                    end = new Date(game.completedAt);
                } else if (game.status === 'dropped') {
                    // If dropped, arguably we shouldn't count "until today". 
                    // But without droppedAt, let's treat it as 0 additional days or just 'time active'.
                    // User request: "until finished". Dropping is finishing.
                    // Let's count it up to now for simplicity, or maybe skip?
                    // Safe bet: If 'dropped', count only if we have a valid range? 
                    // Let's treat 'dropped' same as 'playing' (until now) for 'Time Invested' duration, 
                    // OR strict: only Completed games have fixed duration.
                    // DECISION: calculate duration for Playing and Completed. Dropped is ambiguous without droppedAt.
                    // Current implementation: use NOW for non-completed.
                }

                // Only count if end > start
                if (end >= start) {
                    const diffTime = Math.abs(end - start);
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDurationDays += days;
                }
            }

            // Platform
            const platform = game.platform || 'Unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;

            // Genres (if available from API)
            if (game.genres && Array.isArray(game.genres)) {
                game.genres.forEach(g => {
                    genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                });
            }
        });

        const completionRate = totalGames > 0 ? Math.round((statusCounts.completed / totalGames) * 100) : 0;

        return {
            totalGames,
            statusCounts,
            genreCounts,
            platformCounts,
            totalDurationDays, // Changed from totalPlaytime
            completionRate
        };
    });



    const addGame = async (gameData, platform = 'PC') => {
        if (games.value.some(g => g.id === gameData.id)) return; // Prevent duplicates

        // 1. Create Basic Object (Optimistic)
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
                        Object.assign(gameToUpdate, {
                            ...details,
                            status: gameToUpdate.status,
                            platform: gameToUpdate.platform,
                            rating: gameToUpdate.rating,
                            addedAt: gameToUpdate.addedAt,
                            startedAt: gameToUpdate.startedAt,
                            completedAt: gameToUpdate.completedAt,
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
            if (oldStatus === newStatus) return;

            // Defines XP values for clarity
            const XP_START = 50;
            const XP_COMPLETE = 200;

            // 1. Handle Removing XP from Old Status
            if (oldStatus === 'completed') {
                awardXP(-XP_COMPLETE); // Remove completion bonus
                game.completedAt = null;
            }

            if (oldStatus === 'playing' && newStatus === 'backlog') {
                // Moving back to backlog implies "un-starting"
                awardXP(-XP_START);
                game.startedAt = null;
            }

            // Special case: Completed -> Backlog (needs to remove Start XP too if we reset everything)
            if (oldStatus === 'completed' && newStatus === 'backlog') {
                awardXP(-XP_START);
                game.startedAt = null;
            }


            // 2. Handle Adding XP for New Status
            if (newStatus === 'playing') {
                if (oldStatus === 'backlog') {
                    awardXP(XP_START);
                    if (!game.startedAt) game.startedAt = new Date().toISOString();
                }
            }
            else if (newStatus === 'completed') {
                // From Playing -> Completed
                if (oldStatus === 'playing') {
                    awardXP(XP_COMPLETE);
                }
                // From Backlog -> Completed (Direct skip)
                else if (oldStatus === 'backlog') {
                    awardXP(XP_START + XP_COMPLETE);
                    if (!game.startedAt) game.startedAt = new Date().toISOString();
                }
                // From Dropped -> Completed
                else if (oldStatus === 'dropped') {
                    // Dropped usually meant we started. If we didn't start (dropped from backlog), maybe add start?
                    // Simplest: Just add completion. Assuming Dropped games were "started" mostly.
                    // But if dropped from Backlog? Let's check startedAt.
                    let bonus = XP_COMPLETE;
                    if (!game.startedAt) {
                        bonus += XP_START;
                        game.startedAt = new Date().toISOString();
                    }
                    awardXP(bonus);
                }

                game.completedAt = new Date().toISOString();
            }

            game.status = newStatus;
        }
    };

    const updateGame = (id, updates) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            Object.assign(game, updates);
        }
    };

    const refreshGame = async (id) => {
        const game = games.value.find(g => g.id === id);
        if (!game || !apiKey.value) return;

        try {
            const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey.value}`);
            if (response.ok) {
                const details = await response.json();

                const newPlaytime = Math.max(details.playtime || 0, details.average_playtime || 0) || game.playtime;
                // Smart update: preserve user-specific fields
                Object.assign(game, {
                    ...details,
                    status: game.status,
                    platform: game.platform,
                    rating: game.rating,
                    addedAt: game.addedAt,
                    startedAt: game.startedAt,
                    completedAt: game.completedAt,
                    // Force update playtime with better data if available
                    playtime: newPlaytime
                });
                return { success: true, playtime: details.playtime, avg: details.average_playtime, used: newPlaytime };
            }
        } catch (e) {
            console.error('Failed to refresh game', e);
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Network or API Key error' };
    };

    const rateGame = (id, rating) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            game.rating = rating;
        }
    };

    const removeGame = (id) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            // Calculate XP to remove
            let deduction = 10; // Base XP for adding
            if (game.startedAt) deduction += 50;
            if (game.completedAt) deduction += 200;

            awardXP(-deduction);
        }
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
        gameStats,
        addGame,
        updateStatus,
        updateGame,
        refreshGame,
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
        themeColor,
        setTheme,
        THEMES,
        userLevel,
        userTitle,
        xpProgress,
        awardXP
    };
}
