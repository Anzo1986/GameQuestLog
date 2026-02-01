import { ref, computed } from 'vue';
import { useSettings } from './useSettings';

export function useGameFilters() {
    const { sortOption } = useSettings();
    const searchQuery = ref('');

    // Logic moved from App.vue
    const getProcessedGames = (gameList) => {
        let result = [...gameList];

        // 1. Filter
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase();
            result = result.filter(g => g.title.toLowerCase().includes(q));
        }

        // 2. Sort
        result.sort((a, b) => {
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
        getProcessedGames
    };
}
