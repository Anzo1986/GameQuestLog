<script setup>
import GameCard from './GameCard.vue';

defineProps({
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
    }
});

const emit = defineEmits(['click-game', 'update-status', 'delete-game']);
</script>

<template>
    <section class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 v-if="title" class="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2">
            {{ title }}
        </h2>
        
        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2">
            
            <div 
                v-for="(game, index) in games" 
                :key="game.id" 
                class="relative group animate-stagger-enter w-full" 
                :style="{ animationDelay: `${index * 50}ms` }"
            >
                 <GameCard 
                    :game="game" 
                    @click="$emit('click-game', game.id)"
                    @update-status="(id, status) => $emit('update-status', id, status)"
                    @delete="(id) => $emit('delete-game', id)"
                    class="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-sm w-full"
                    :class="{ 
                        'grayscale hover:grayscale-0': game.status === 'dropped',
                        'hover:ring-green-500': game.status === 'completed'
                    }"
                />



                <!-- Dropped Badge -->
                <div v-if="game.status === 'dropped'" class="absolute top-2 right-2 bg-gray-600/80 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded shadow pointer-events-none z-10">
                    DROPPED
                </div>
            </div>

            <!-- Empty State -->
             <div v-if="games.length === 0" class="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center text-gray-500 col-span-2 sm:col-span-3">
                {{ searchQuery ? "No matching games found." : emptyMessage }}
            </div>

        </div>
    </section>
</template>
