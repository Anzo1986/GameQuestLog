import { ref, computed } from 'vue';
import { useSettings } from './useSettings';

export function useGameFilters() {
    const { sortOption } = useSettings();
    const searchQuery = ref('');

    // Helper to identify games with no release date or a future release date
    const isUnreleased = (game) => {
        if (!game.released) return true; // TBA Games
        const releaseStr = game.released.split('T')[0]; // Ensure precision
        const todayStr = new Date().toISOString().split('T')[0];
        return releaseStr > todayStr;
    };

    // Logic moved from App.vue
    const getProcessedGames = (gameList, options = { separateUnreleased: false }) => {
        let result = [...gameList];

        // 1. Filter
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase();
            result = result.filter(g => g.title.toLowerCase().includes(q));
        }

        // 2. Sort
        result.sort((a, b) => {
            // Unreleased Separation (if enabled)
            if (options.separateUnreleased) {
                const aUnreleased = isUnreleased(a);
                const bUnreleased = isUnreleased(b);
                if (aUnreleased && !bUnreleased) return 1; // push a down
                if (!aUnreleased && bUnreleased) return -1; // push b down
                // If they're both released (or both unreleased), continue to normal sort
            }

            // Normal Sort Options
            switch (sortOption.value) {
                case 'name': return a.title.localeCompare(b.title);
                case 'released':
                    return new Date(b.released || 0) - new Date(a.released || 0); // Newest first
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0); // Highest rating first
                case 'added':
                default:
                    return (b.id || 0) - (a.id || 0); // Newest ID = Newest Added
            }
        });

        return result;
    };

    return {
        searchQuery,
        sortOption,
        getProcessedGames,
        isUnreleased
    };
}
