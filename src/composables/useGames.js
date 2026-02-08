// Facade for the Refactored Composables
// This ensures backward compatibility while using the new structure.

import { ref, computed, watch } from 'vue';
import { useSettings } from './useSettings';
import { useGamification } from './useGamification';
import { useGameData } from './useGameData';
import { usePersistence } from './usePersistence';
import { XP_REWARDS, GAME_STATUS } from '../config/gamification';

// Shared state for Search (keep here or move to useGameSearch if needed)
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

export function useGames() {
    // 1. Import Sub-Modules
    const settings = useSettings();
    const gamification = useGamification();
    const gameData = useGameData();
    const persistence = usePersistence();

    // 2. Facade Methods (Stitching logic together)

    // Add Game Wrapper (Data + Gamification + API Fetch)
    const addGame = async (newGameData, platform = 'PC') => {
        // Prepare Basic Object
        const newGame = {
            id: newGameData.id,
            title: newGameData.name,
            background_image: newGameData.background_image,
            released: newGameData.released,
            status: GAME_STATUS.BACKLOG,
            platform: platform, // Use mapping if needed, but UI usually passes string
            playtime: newGameData.playtime || 0,
            rating: 0,
            addedAt: new Date().toISOString()
        };

        // Try Add (returns false if duplicate)
        const success = gameData.addGameRaw(newGame);
        if (!success) return;

        // Award XP
        gamification.awardXP(XP_REWARDS.ADD_GAME);

        // Fetch Full Details (Only for API games, skip manual timestamps)
        if (settings.apiKey.value && newGameData.id < 10000000000) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${newGameData.id}?key=${settings.apiKey.value}`);
                if (response.ok) {
                    const details = await response.json();

                    // Update via gameData
                    gameData.updateGame(newGameData.id, {
                        ...details,
                        // Preserve local state
                        status: GAME_STATUS.BACKLOG,
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
            let deduction = XP_REWARDS.REMOVE_GAME;
            if (game.startedAt) deduction += XP_REWARDS.REMOVE_STARTED - XP_REWARDS.REMOVE_GAME; // -60 - (-10) = -50
            // Actually, my constants for REMOVE are totals.
            // But here logic builds it up.
            // Let's use the explicit constants if possible or stick to logic.
            // Current Config: REMOVE_GAME: -10, REMOVE_STARTED: -60.

            // Logic here was: -10 (base), -50 (start), -200 (complete).
            // So:
            // if (game.completedAt) deduction = XP_REWARDS.REMOVE_COMPLETED;
            // else if (game.startedAt) deduction = XP_REWARDS.REMOVE_STARTED;
            // else deduction = XP_REWARDS.REMOVE_GAME;

            if (game.completedAt) {
                gamification.awardXP(XP_REWARDS.REMOVE_COMPLETED);
            } else if (game.startedAt) {
                gamification.awardXP(XP_REWARDS.REMOVE_STARTED);
            } else {
                gamification.awardXP(XP_REWARDS.REMOVE_GAME);
            }

            gameData.removeGameRaw(id);
        }
    };

    // Update Status Wrapper (Logic for XP changes on status change)
    const updateStatus = (id, newStatus) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (!game) return;

        const oldStatus = game.status;
        if (oldStatus === newStatus) return;



        // 1. Remove Old XP
        if (oldStatus === GAME_STATUS.COMPLETED) {
            gamification.awardXP(XP_REWARDS.UNDO_COMPLETE); // -200
            game.completedAt = null;
        }
        if (oldStatus === GAME_STATUS.PLAYING && newStatus === GAME_STATUS.BACKLOG) {
            gamification.awardXP(XP_REWARDS.UNDO_START); // -50
            game.startedAt = null;
        }
        if (oldStatus === GAME_STATUS.COMPLETED && newStatus === GAME_STATUS.BACKLOG) {
            gamification.awardXP(XP_REWARDS.UNDO_START); // -50 (Cleaning up start bonus too? No wait.)
            // Original logic:
            // if old=completed (-200) AND new=backlog (-50). 
            // My constants: UNDO_COMPLETE = -200. UNDO_START = -50.

            // Logic reuse checks:
            // old=completed -> -200. game object now has startedAt but no completedAt.
            // new=backlog -> we need to remove startedAt too.

            // If we just removed 200 above, we still have the start bonus active (presumably).
            // The original code had:
            // if (oldStatus === 'completed' && newStatus === 'backlog') { gamification.awardXP(-XP_START); game.startedAt = null; }

            // So yes, we need to undo start too.
            gamification.awardXP(XP_REWARDS.UNDO_START);
            game.startedAt = null;
        }

        // 2. Add New XP
        if (newStatus === GAME_STATUS.PLAYING) {
            if (oldStatus === GAME_STATUS.BACKLOG) {
                gamification.awardXP(XP_REWARDS.START_GAME);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
        }
        else if (newStatus === GAME_STATUS.COMPLETED) {
            if (oldStatus === GAME_STATUS.PLAYING) {
                gamification.awardXP(XP_REWARDS.COMPLETE_GAME);
            }
            else if (oldStatus === GAME_STATUS.BACKLOG) {
                gamification.awardXP(XP_REWARDS.COMPLETE_FROM_BACKLOG);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
            else if (oldStatus === GAME_STATUS.DROPPED) {
                gamification.awardXP(XP_REWARDS.COMPLETE_FROM_DROPPED);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
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
        levelStartXP: gamification.levelStartXP,
        nextLevelXP: gamification.nextLevelXP,
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
        exportData: persistence.exportData,

        // Comprehensive Import
        importData: persistence.importData,

        // Search
        searchQuery,
        searchResults,
        isSearching,
        searchGames
    };
}
