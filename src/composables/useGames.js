// Facade for the Refactored Composables
// This ensures backward compatibility while using the new structure.

import { ref, computed, watch } from 'vue';
import { useSettings } from './useSettings';
import { useGamification } from './useGamification';
import { useGameData } from './useGameData';

// Shared state for Search (keep here or move to useGameSearch if needed)
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

export function useGames() {
    // 1. Import Sub-Modules
    const settings = useSettings();
    const gamification = useGamification();
    const gameData = useGameData();

    // 2. Facade Methods (Stitching logic together)

    // Add Game Wrapper (Data + Gamification + API Fetch)
    const addGame = async (newGameData, platform = 'PC') => {
        // Prepare Basic Object
        const newGame = {
            id: newGameData.id,
            title: newGameData.name,
            background_image: newGameData.background_image,
            released: newGameData.released,
            status: 'backlog',
            platform: platform, // Use mapping if needed, but UI usually passes string
            playtime: newGameData.playtime || 0,
            rating: 0,
            addedAt: new Date().toISOString()
        };

        // Try Add (returns false if duplicate)
        const success = gameData.addGameRaw(newGame);
        if (!success) return;

        // Award XP
        gamification.awardXP(10);

        // Fetch Full Details
        if (settings.apiKey.value) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${newGameData.id}?key=${settings.apiKey.value}`);
                if (response.ok) {
                    const details = await response.json();

                    // Update via gameData
                    gameData.updateGame(newGameData.id, {
                        ...details,
                        // Preserve local state
                        status: 'backlog',
                        platform: platform,
                        rating: 0,
                        addedAt: newGame.addedAt,
                        playtime: details.playtime || newGame.playtime
                    });
                }
            } catch (e) {
                console.error('Failed to fetch full details on add', e);
            }
        }
    };

    // Remove Game Wrapper (Data + Gamification)
    const removeGame = (id) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (game) {
            // Calculate XP to remove
            let deduction = 10;
            if (game.startedAt) deduction += 50;
            if (game.completedAt) deduction += 200;

            gamification.awardXP(-deduction);
            gameData.removeGameRaw(id);
        }
    };

    // Update Status Wrapper (Logic for XP changes on status change)
    const updateStatus = (id, newStatus) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (!game) return;

        const oldStatus = game.status;
        if (oldStatus === newStatus) return;

        const XP_START = 50;
        const XP_COMPLETE = 200;

        // 1. Remove Old XP
        if (oldStatus === 'completed') {
            gamification.awardXP(-XP_COMPLETE);
            game.completedAt = null;
        }
        if (oldStatus === 'playing' && newStatus === 'backlog') {
            gamification.awardXP(-XP_START);
            game.startedAt = null;
        }
        if (oldStatus === 'completed' && newStatus === 'backlog') {
            gamification.awardXP(-XP_START);
            game.startedAt = null;
        }

        // 2. Add New XP
        if (newStatus === 'playing') {
            if (oldStatus === 'backlog') {
                gamification.awardXP(XP_START);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
        }
        else if (newStatus === 'completed') {
            if (oldStatus === 'playing') {
                gamification.awardXP(XP_COMPLETE);
            }
            else if (oldStatus === 'backlog') {
                gamification.awardXP(XP_START + XP_COMPLETE);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
            else if (oldStatus === 'dropped') {
                let bonus = XP_COMPLETE;
                if (!game.startedAt) {
                    bonus += XP_START;
                    game.startedAt = new Date().toISOString();
                }
                gamification.awardXP(bonus);
            }
            game.completedAt = new Date().toISOString();
        }

        // 3. Update Status
        game.status = newStatus;
    };

    // Refresh Game Wrapper (API access)
    const refreshGame = async (id) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (!game || !settings.apiKey.value) return;

        try {
            const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${settings.apiKey.value}`);
            if (response.ok) {
                const details = await response.json();
                const newPlaytime = Math.max(details.playtime || 0, details.average_playtime || 0) || game.playtime;

                gameData.updateGame(id, {
                    ...details,
                    // protect local fields
                    status: game.status,
                    platform: game.platform,
                    rating: game.rating,
                    addedAt: game.addedAt,
                    startedAt: game.startedAt,
                    completedAt: game.completedAt,
                    playtime: newPlaytime
                });
                return { success: true };
            }
        } catch (e) {
            console.error('Failed to refresh game', e);
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Network error' };
    };

    // Search Logic (Depends on API Key and Settings)
    const searchGames = async (query) => {
        if (!query || !settings.apiKey.value) return;

        isSearching.value = true;
        try {
            const response = await fetch(`https://api.rawg.io/api/games?key=${settings.apiKey.value}&search=${encodeURIComponent(query)}&page_size=10`);
            const data = await response.json();
            searchResults.value = (data.results || []).map(game => ({
                ...game,
                selectedPlatform: gameData.mapPlatform(game.parent_platforms || game.platforms)
            }));
        } catch (error) {
            console.error('Search failed', error);
            searchResults.value = [];
        } finally {
            isSearching.value = false;
        }
    };

    // User Persistence Coordinator (Watch all parts and save to one User object)
    // This maintains the original format: { xp, name, avatar, title }
    watch(
        [gamification.userXP, settings.userName, settings.userAvatar, settings.selectedTitle],
        () => {
            localStorage.setItem('game-tracker-user', JSON.stringify({
                xp: gamification.userXP.value,
                name: settings.userName.value,
                avatar: settings.userAvatar.value,
                title: settings.selectedTitle.value
            }));
        }
    );

    // Return Unified Interface (matching original useGames)
    return {
        // Settings
        apiKey: settings.apiKey,
        setApiKey: settings.setApiKey,
        themeColor: settings.themeColor,
        setTheme: settings.setTheme,
        THEMES: settings.THEMES,

        // User
        userName: settings.userName,
        userAvatar: settings.userAvatar,
        setUserName: settings.setUserName,
        setUserAvatar: settings.setUserAvatar,
        userTitle: settings.selectedTitle, // Note: original exposed computed 'userTitle' with fallback logic
        setUserTitle: settings.setUserTitle,

        // Gamification
        userXP: gamification.userXP,
        userLevel: gamification.userLevel,
        awardXP: gamification.awardXP,
        xpProgress: gamification.xpProgress,
        availableTitles: gamification.availableTitles,
        incrementQuestUsage: gamification.incrementQuestUsage,

        // Original Computed User Title needs to be recreated here if logic was complex?
        // Original: if selected return it, else match level.
        // Let's use the one from settings (which is just state) and add the fallback logic again here or in Gamification.
        // Gamification has `getTitleForLevel`.
        userTitle: computed(() => {
            if (settings.selectedTitle.value) return settings.selectedTitle.value;
            return gamification.getTitleForLevel(gamification.userLevel.value);
        }),


        // Data
        games: gameData.games,
        backlogGames: gameData.backlogGames,
        playingGames: gameData.playingGames,
        completedGames: gameData.completedGames,
        droppedGames: gameData.droppedGames,
        gameStats: gameData.gameStats,
        PLATFORMS: gameData.PLATFORMS,

        // Actions (Wrapped)
        addGame,
        removeGame,
        updateStatus,
        refreshGame,

        // Actions (Direct)
        updateGame: gameData.updateGame,
        rateGame: gameData.rateGame,

        // Comprehensive Export
        exportData: () => {
            const backup = {
                version: 2,
                timestamp: new Date().toISOString(),
                games: JSON.parse(localStorage.getItem('game-tracker-games') || '[]'),
                user: JSON.parse(localStorage.getItem('game-tracker-user') || '{}'),
                achievements: JSON.parse(localStorage.getItem('game-tracker-achievements') || '{}'),
                achievementStats: JSON.parse(localStorage.getItem('game-tracker-achievements_stats') || '{}'),
                shop: JSON.parse(localStorage.getItem('game-tracker-shop-v2') || '{}'),
                settings: {
                    theme: localStorage.getItem('game-tracker-theme'),
                    apiKey: localStorage.getItem('game-tracker-api-key'),
                    questUsage: localStorage.getItem('game-tracker-quest-usage')
                }
            };

            const dataStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gametracker_complete_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        // Comprehensive Import
        importData: (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);

                        // Handle Legacy Format (Array of games only)
                        if (Array.isArray(data)) {
                            if (confirm('Legacy format detected (Games only). Import games?')) {
                                localStorage.setItem('game-tracker-games', JSON.stringify(data));
                                window.location.reload();
                                resolve(true);
                            }
                            return;
                        }

                        // Handle New Format
                        if (data.version || data.games || data.user) {
                            if (data.games) localStorage.setItem('game-tracker-games', JSON.stringify(data.games));
                            if (data.user) localStorage.setItem('game-tracker-user', JSON.stringify(data.user));
                            if (data.achievements) localStorage.setItem('game-tracker-achievements', JSON.stringify(data.achievements));
                            if (data.achievementStats) localStorage.setItem('game-tracker-achievements_stats', JSON.stringify(data.achievementStats));
                            if (data.shop) localStorage.setItem('game-tracker-shop-v2', JSON.stringify(data.shop));

                            if (data.settings) {
                                if (data.settings.theme) localStorage.setItem('game-tracker-theme', data.settings.theme);
                                if (data.settings.apiKey) localStorage.setItem('game-tracker-api-key', data.settings.apiKey);
                                if (data.settings.questUsage) localStorage.setItem('game-tracker-quest-usage', data.settings.questUsage);
                            }

                            window.location.reload(); // Refresh to load changes
                            resolve(true);
                        } else {
                            reject(new Error('Unknown file format'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        },

        // Search
        searchQuery,
        searchResults,
        isSearching,
        searchGames
    };
}
