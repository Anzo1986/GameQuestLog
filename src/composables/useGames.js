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
