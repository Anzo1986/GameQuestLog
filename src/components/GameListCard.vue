<script setup>
import { computed } from 'vue';
import { Star, Gamepad2, Play, Check, Ban, Layers, MoreVertical, X, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { useGames } from '../composables/useGames';

const props = defineProps({
  game: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
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
        class="absolute inset-0 flex items-center bg-gray-800 rounded-xl shadow-sm hover:ring-2 hover:ring-primary transition-all cursor-pointer overflow-hidden z-0"
        @click="$emit('open-details')"
    >
        <!-- Image -->
        <div class="relative h-full flex-shrink-0 bg-gray-700" :class="compact ? 'w-14 sm:w-16' : 'w-24'">
            <img v-if="backgroundImage" :src="backgroundImage" :alt="game.title" class="w-full h-full object-cover" loading="lazy">
            <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                <Gamepad2 :class="compact ? 'w-4 h-4' : 'w-6 h-6'" />
            </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 flex flex-col justify-center py-1 pr-8" :class="compact ? 'pl-2' : 'px-3 pr-12'">
            <h3 class="font-bold text-white truncate leading-tight transition-all" :class="compact ? 'text-xs' : 'text-sm'">{{ game.title }}</h3>
            
            <div class="flex items-center gap-1.5 mt-0.5" :class="compact ? 'flex-wrap' : ''">
                <!-- Status -->
                <span v-if="game.status === 'playing'" class="uppercase font-bold text-primary bg-primary/20 rounded flex items-center gap-1" :class="compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] sm:text-xs px-1.5 py-0.5'"><Play :class="compact ? 'w-2.5 h-2.5' : 'w-3 h-3'"/> <span v-if="!compact">Play</span></span>
                <span v-else-if="game.status === 'completed'" class="uppercase font-bold text-green-400 bg-green-500/20 rounded flex items-center gap-1" :class="compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] sm:text-xs px-1.5 py-0.5'"><Check :class="compact ? 'w-2.5 h-2.5' : 'w-3 h-3'"/> <span v-if="!compact">Done</span></span>
                <span v-else-if="game.status === 'dropped'" class="uppercase font-bold text-gray-400 bg-gray-700/50 rounded flex items-center gap-1" :class="compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] sm:text-xs px-1.5 py-0.5'"><Ban :class="compact ? 'w-2.5 h-2.5' : 'w-3 h-3'"/> <span v-if="!compact">Drop</span></span>
                <span v-else class="uppercase font-bold text-yellow-500 bg-yellow-500/20 rounded flex items-center gap-1" :class="compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] sm:text-xs px-1.5 py-0.5'"><Layers :class="compact ? 'w-2.5 h-2.5' : 'w-3 h-3'"/> <span v-if="!compact">Backlog</span></span>

                <!-- Separator -->
                <span class="text-gray-700 mx-0.5" v-if="!compact">|</span>

                <!-- Rating -->
                <div class="flex items-center gap-0.5" v-if="game.rating && !compact">
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
        class="absolute right-1 top-1/2 -translate-y-1/2 z-50 p-3 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-all active:scale-90"
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
