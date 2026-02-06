<script setup>
import { computed } from 'vue';
import { Star, Gamepad2, Play, Check, Ban, Layers, MoreVertical, X, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { useGames } from '../composables/useGames';

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-status', 'delete', 'open-details']); // Click handled explicitly for overlay safety
const { rateGame } = useGames();
const showOverlay = ref(false);

const updateAndClose = (status) => {
    emit('update-status', props.game.id, status);
    showOverlay.value = false;
};

const rateAndClose = (rating) => {
    rateGame(props.game.id, rating);
    // showOverlay.value = false; // Optional: Keep open to adjust rating
};

const backgroundImage = computed(() => props.game.background_image || null);
</script>

<template>
  <div class="relative group h-14 sm:h-16 w-full touch-manipulation">
    
    <!-- Main Card Content (Clickable) -->
    <div 
        class="absolute inset-0 flex items-center bg-gray-800 rounded-xl shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer overflow-hidden z-0"
        @click="$emit('open-details')"
    >
        <!-- Image -->
        <div class="relative w-24 h-full flex-shrink-0 bg-gray-700">
            <img v-if="backgroundImage" :src="backgroundImage" :alt="game.title" class="w-full h-full object-cover" loading="lazy">
            <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                <Gamepad2 class="w-6 h-6" />
            </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 flex flex-col justify-center px-3 py-1 pr-12">
            <h3 class="text-sm font-bold text-white truncate leading-tight">{{ game.title }}</h3>
            
            <div class="flex items-center gap-2 mt-1">
                <!-- Status -->
                <span v-if="game.status === 'playing'" class="text-[10px] sm:text-xs uppercase font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded flex items-center gap-1"><Play class="w-3 h-3"/> Play</span>
                <span v-else-if="game.status === 'completed'" class="text-[10px] sm:text-xs uppercase font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><Check class="w-3 h-3"/> Done</span>
                <span v-else-if="game.status === 'dropped'" class="text-[10px] sm:text-xs uppercase font-bold text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded flex items-center gap-1"><Ban class="w-3 h-3"/> Drop</span>
                <span v-else class="text-[10px] sm:text-xs uppercase font-bold text-yellow-500 bg-yellow-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><Layers class="w-3 h-3"/> Backlog</span>

                <!-- Separator -->
                <span class="text-gray-700 mx-1">|</span>

                <!-- Rating -->
                <div class="flex items-center gap-0.5">
                    <Star class="w-3 h-3" :class="game.rating >= 1 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'" />
                    <span class="text-xs font-bold text-gray-300">{{ game.rating || 0 }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions Button (NOW OUTSIDE OVERFLOW CONTAINER) -->
    <button 
        @pointerdown.stop.prevent="showOverlay = !showOverlay" 
        @click.stop
        class="absolute right-1 top-1/2 -translate-y-1/2 z-50 p-3 text-gray-400 bg-gray-800/80 rounded-full hover:bg-gray-700 hover:text-white transition-all backdrop-blur-sm shadow-sm border border-gray-700/50 active:scale-90"
        style="touch-action: manipulation;"
    >
        <MoreVertical class="w-5 h-5" />
    </button>

    <!-- Overlay -->
    <div v-if="showOverlay" class="absolute inset-0 bg-gray-900 z-20 flex items-center justify-between px-2 gap-2 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Left: Status Icons -->
        <div class="flex items-center gap-1">
            <button @click="updateAndClose('playing')" :class="['p-1.5 rounded transition-colors', game.status === 'playing' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400']" title="Play">
                <Play class="w-4 h-4" />
            </button>
            <button @click="updateAndClose('completed')" :class="['p-1.5 rounded transition-colors', game.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400']" title="Completed">
                <Check class="w-4 h-4" />
            </button>
            <button @click="updateAndClose('backlog')" :class="['p-1.5 rounded transition-colors', game.status === 'backlog' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400']" title="Backlog">
                <Layers class="w-4 h-4" />
            </button>
            <button @click="updateAndClose('dropped')" :class="['p-1.5 rounded transition-colors', game.status === 'dropped' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400']" title="Drop">
                <Ban class="w-4 h-4" />
            </button>
        </div>

        <!-- Center: Stars -->
        <div class="flex items-center gap-0.5 hidden sm:flex">
             <button v-for="star in 5" :key="star" @click.stop="rateAndClose(star)">
                <Star class="w-4 h-4" :class="star <= (game.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'" />
             </button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1">
             <button @click="$emit('delete', game.id)" class="p-1.5 text-red-400 hover:text-white hover:bg-red-900/50 rounded" title="Delete">
                <Trash2 class="w-4 h-4" />
            </button>
            <div class="w-px h-6 bg-gray-700 mx-1"></div>
            <button @click="showOverlay = false" class="p-1.5 text-gray-400 hover:text-white rounded">
                <X class="w-5 h-5" />
            </button>
        </div>
    </div>
  </div>
</template>
