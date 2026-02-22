<script setup>
import GameCard from './GameCard.vue';
import GameListCard from './GameListCard.vue';
import { useSettings } from '../composables/useSettings';

const props = defineProps({
    games: {
        type: Array,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    emptyMessage: {
        type: String,
        default: "No games found."
    },
    searchQuery: {
        type: String,
        default: ''
    },
    showUnreleasedSeparator: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['click-game', 'update-status', 'delete-game']);

const { viewMode } = useSettings();
import { ref, computed, watch } from 'vue';
import { useGameFilters } from '../composables/useGameFilters';

const { isUnreleased } = useGameFilters();

const VISIBLE_INCREMENT = 48; // Enough for 4 rows of 4 cards on XL
const visibleCount = ref(VISIBLE_INCREMENT);

const displayedGames = computed(() => {
    return props.games.slice(0, visibleCount.value);
});

const canLoadMore = computed(() => {
    return visibleCount.value < props.games.length;
});

const loadMore = () => {
    visibleCount.value += VISIBLE_INCREMENT;
};

// Reset count when source array changes drastically or query changes
watch(() => props.searchQuery, () => {
    visibleCount.value = VISIBLE_INCREMENT;
});
</script>

<template>
    <section class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 v-if="title" class="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2">
            {{ title }}
        </h2>
        
        <div :class="{
            'grid grid-cols-[1fr_1fr] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2': viewMode === 'grid',
            'flex flex-col gap-2': viewMode === 'list',
            'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2': viewMode === 'compact'
        }">
            
            
            <template v-for="(game, index) in displayedGames" :key="game.id">
                
                <!-- UNRELEASED SEPARATOR -->
                <div 
                    v-if="showUnreleasedSeparator && isUnreleased(game) && (index === 0 || !isUnreleased(displayedGames[index - 1]))"
                    class="col-span-full flex items-center gap-4 py-6 mt-4 w-full"
                >
                    <div class="h-px bg-gradient-to-r from-transparent via-gray-700 to-gray-700 flex-1"></div>
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Unreleased / TBA</span>
                    <div class="h-px bg-gradient-to-r from-gray-700 via-gray-700 to-transparent flex-1"></div>
                </div>

                <div 
                    class="relative group animate-stagger-enter w-full hover:z-20 min-w-0" 
                    :style="{ animationDelay: `${index * 50}ms` }"
                >
                 <GameCard 
                    v-if="viewMode === 'grid'"
                    :game="game" 
                    @open-details="$emit('click-game', game.id)"
                    @update-status="(id, status) => $emit('update-status', id, status)"
                    @delete="(id) => $emit('delete-game', id)"
                    class="cursor-pointer transition-all shadow-sm w-full"
                    :class="{ 
                        'grayscale hover:grayscale-0': game.status === 'dropped',
                        'hover:ring-green-500': game.status === 'completed'
                    }"
                />
                <GameListCard 
                    v-else
                    :game="game"
                    :compact="viewMode === 'compact'"
                    @open-details="$emit('click-game', game.id)"
                    @delete="$emit('delete-game', game.id)"
                    @update-status="(id, status) => $emit('update-status', id, status)"
                />




            </div>
            </template>

            <!-- Empty State -->
             <div v-if="games.length === 0" class="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center text-gray-500 col-span-2 sm:col-span-3 lg:col-span-4">
                {{ searchQuery ? "No matching games found." : emptyMessage }}
            </div>

            <!-- Load More Button -->
            <div v-if="canLoadMore" class="col-span-full flex justify-center pt-8 pb-4">
                <button 
                    @click="loadMore"
                    class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-6 rounded-full border border-gray-600 transition-colors shadow-lg active:scale-95"
                >
                    Load More Games
                </button>
            </div>

        </div>
    </section>
</template>
