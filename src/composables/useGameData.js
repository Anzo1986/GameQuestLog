import { ref, computed, watch } from 'vue';

const GAMES_STORAGE_KEY = 'game-tracker-games';

// Shared State (must be outside to be singleton)
const games = ref([]);

// Initialize Games
const savedGames = localStorage.getItem(GAMES_STORAGE_KEY);
if (savedGames) {
    try {
        games.value = JSON.parse(savedGames);
    } catch (e) {
        console.error('Failed to parse saved games', e);
    }
}

// Watch & Persist
watch(games, (newGames) => {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(newGames));
}, { deep: true });

// Simplified Platforms
const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'];

const mapPlatform = (platforms) => {
    if (!platforms || !Array.isArray(platforms)) return 'PC';

    // Check parent_platforms or platforms array from API
    // Flatten names 
    const names = platforms.map(p => p.platform?.name || p.name || '').join(' ').toLowerCase();

    if (names.includes('playstation') || names.includes('ps')) return 'PlayStation';
    if (names.includes('xbox')) return 'Xbox';
    if (names.includes('nintendo') || names.includes('wii') || names.includes('switch') || names.includes('ds') || names.includes('game boy')) return 'Nintendo';
    if (names.includes('android') || names.includes('ios') || names.includes('iphone') || names.includes('mobile')) return 'Mobile';

    if (names.includes('pc')) return 'PC';
    return 'PC'; // Fallback
};

export function useGameData() {

    // Derived Lists
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

            // Duration
            if (game.startedAt) {
                const start = new Date(game.startedAt);
                let end = new Date();

                if (game.status === 'completed' && game.completedAt) {
                    end = new Date(game.completedAt);
                }
                // Using now for playing/dropped per original logic

                if (end >= start) {
                    const diffTime = Math.abs(end - start);
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDurationDays += days;
                }
            }

            // Platform
            let platform = game.platform || 'Unknown';
            const lower = platform.toLowerCase();

            if (lower.includes('playstation') || lower.includes('ps')) platform = 'PlayStation';
            else if (lower.includes('xbox')) platform = 'Xbox';
            else if (lower.includes('nintendo') || lower.includes('switch') || lower.includes('wii') || lower.includes('ds') || lower.includes('game boy')) platform = 'Nintendo';
            else if (lower.includes('android') || lower.includes('ios') || lower.includes('iphone') || lower.includes('mobile')) platform = 'Mobile';
            else if (lower.includes('pc') || lower.includes('windows') || lower.includes('mac') || lower.includes('linux')) platform = 'PC';

            platformCounts[platform] = (platformCounts[platform] || 0) + 1;

            // Genres
            if (game.genres && Array.isArray(game.genres)) {
                game.genres.forEach(g => {
                    genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                });
            }
        });

        const completionRate = totalGames > 0 ? Math.round((statusCounts.completed / totalGames) * 100) : 0;

        // NEW: Average Rating
        const ratedGames = games.value.filter(g => g.rating && g.rating > 0);
        const averageRating = ratedGames.length > 0
            ? (ratedGames.reduce((acc, g) => acc + g.rating, 0) / ratedGames.length).toFixed(1)
            : 'N/A';

        return {
            totalGames,
            statusCounts,
            genreCounts,
            platformCounts,
            totalDurationDays,
            completionRate,
            averageRating
        };
    });

    const updateGame = (id, updates) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            Object.assign(game, updates);
        }
    };

    const rateGame = (id, rating) => {
        const game = games.value.find(g => g.id === id);
        if (game) {
            game.rating = rating;
        }
    };

    // Note: addGame and removeGame are simpler here, but they trigger XP.
    // In strict Separation of Concerns, this store shouldn't know about XP.
    // We will expose "raw" add/remove here, and the "Facade" (useGames) will wrap them to add XP.
    // OR we can pass an optional callback, but Facade is cleaner.

    // Low-level add (just data)
    const addGameRaw = (newGame) => {
        if (games.value.some(g => g.id === newGame.id)) return false;
        games.value.push(newGame);
        return true;
    };

    // Low-level remove
    const removeGameRaw = (id) => {
        games.value = games.value.filter(g => g.id !== id);
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

    return {
        games,
        backlogGames,
        playingGames,
        completedGames,
        droppedGames,
        gameStats,
        PLATFORMS,
        mapPlatform,
        updateGame,
        rateGame,
        addGameRaw,
        removeGameRaw,
        importData,
        exportData
    };
}
