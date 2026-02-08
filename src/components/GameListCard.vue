<script setup>
import { computed, ref, watch } from 'vue';
import { Star, Gamepad2, Play, Check, Ban, Layers, MoreVertical, X, Trash2 } from 'lucide-vue-next';
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


// --- Swipe Logic ---
const touchStartX = ref(0);
const touchCurrentX = ref(0);
const isSwiping = ref(false);
const swipeThreshold = 50; // Minimum distance to trigger action
const maxSwipe = 120; // Max visual displacement (pixels)

// Action States
const swipeAction = computed(() => {
    const diff = touchCurrentX.value - touchStartX.value;
    
    // Swipe Right (Positive)
    if (diff > swipeThreshold) {
        if (diff > swipeThreshold * 2.5) return { type: 'completed', color: 'bg-green-600', icon: Check, label: 'Completed' };
        return { type: 'playing', color: 'bg-primary', icon: Play, label: 'Playing' };
    }
    
    // Swipe Left (Negative)
    if (diff < -swipeThreshold) {
        if (diff < -swipeThreshold * 2.5) return { type: 'delete', color: 'bg-red-600', icon: Trash2, label: 'Delete' };
        return { type: 'backlog', color: 'bg-yellow-600', icon: Layers, label: 'Backlog/Drop' };
    }

    return null;
});

const handleTouchStart = (e) => {
    touchStartX.value = e.touches[0].clientX;
    touchCurrentX.value = e.touches[0].clientX;
    isSwiping.value = true;
};

const handleTouchMove = (e) => {
    if (!isSwiping.value) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.value;
    
    // Clamp movement (resistive drag)
    if (Math.abs(diff) > maxSwipe) {
        // Logarithmic resistance
        const excess = Math.abs(diff) - maxSwipe;
        const resisted = maxSwipe + (excess * 0.2);
        touchCurrentX.value = touchStartX.value + (diff > 0 ? resisted : -resisted);
    } else {
        touchCurrentX.value = currentX;
    }
};

const handleTouchEnd = () => {
    isSwiping.value = false;
    const diff = touchCurrentX.value - touchStartX.value;
    
    if (swipeAction.value) {


        // Execute Action
        const action = swipeAction.value.type;
        
        if (action === 'delete') {
             if (confirm('Delete this game?')) emit('delete', props.game.id);
        } else if (action === 'backlog') {
             // Toggle between backlog and dropped for left swipe short
             if (props.game.status === 'backlog') updateAndClose('dropped');
             else updateAndClose('backlog');
        } else {
             updateAndClose(action);
        }
    }

    // Reset Animation
    touchStartX.value = 0;
    touchCurrentX.value = 0;
};

const cardTransform = computed(() => {
    if (!isSwiping.value && touchCurrentX.value === 0) return {};
    const diff = touchCurrentX.value - touchStartX.value;
    return { transform: `translateX(${diff}px)`, transition: isSwiping.value ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' };
});

const revealStyle = computed(() => {
    if (!swipeAction.value) return {};
    // Calculate opacity based on swipe progress
    const diff = Math.abs(touchCurrentX.value - touchStartX.value);
    const opacity = Math.min(diff / maxSwipe, 1);
    
    return { opacity };
});

// Haptic Feedback
watch(swipeAction, (newVal, oldVal) => {
    if (newVal && !oldVal) {
        if (navigator.vibrate) navigator.vibrate(50); // Enter swipe action
    }
    if (newVal && oldVal && newVal.type !== oldVal.type) {
        if (navigator.vibrate) navigator.vibrate(50); // Change action type
    }
});
</script>

<template>
  <div class="relative group h-14 sm:h-16 w-full touch-pan-y select-none overflow-hidden rounded-xl bg-gray-900/40">
    
    <!-- Swipe Backgrounds (Reveal Layers) -->
    <!-- Right Swipe Layer (Green/Blue) -->
    <div v-if="swipeAction && (swipeAction.type === 'playing' || swipeAction.type === 'completed')" 
         class="absolute inset-0 flex items-center justify-start pl-6 transition-colors duration-200"
         :class="swipeAction.color"
    >
         <component :is="swipeAction.icon" class="w-6 h-6 text-white animate-pulse" />
         <span class="ml-2 font-bold text-white text-sm uppercase tracking-wider">{{ swipeAction.label }}</span>
    </div>

    <!-- Left Swipe Layer (Red/Yellow) -->
    <div v-if="swipeAction && (swipeAction.type === 'delete' || swipeAction.type === 'backlog')" 
         class="absolute inset-0 flex items-center justify-end pr-6 transition-colors duration-200"
         :class="swipeAction.color"
    >
         <span class="mr-2 font-bold text-white text-sm uppercase tracking-wider">{{ swipeAction.label }}</span>
         <component :is="swipeAction.icon" class="w-6 h-6 text-white animate-pulse" />
    </div>


    <!-- Main Card Content (Clickable & Swipable) -->
    <div 
        class="absolute inset-0 flex items-center bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl shadow-sm hover:ring-2 hover:ring-primary z-10 card-swipe-area"
        @click="$emit('open-details')"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        :style="cardTransform"
    >
        <!-- Image -->
        <div class="relative h-full flex-shrink-0 bg-gray-700 overflow-hidden rounded-l-xl" :class="compact ? 'w-14 sm:w-16' : 'w-24'">
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
    <div v-if="showOverlay" class="absolute inset-0 bg-gray-900/95 backdrop-blur-xl z-20 flex items-center justify-between px-2 gap-2 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Left: Status Icons -->
        <div class="flex items-center gap-1">
            <button @click="updateAndClose('playing')" :class="['p-1.5 rounded transition-transform active:scale-95', game.status === 'playing' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400']" title="Play">
                <Play class="w-4 h-4" />
            </button>
            <button @click="updateAndClose('completed')" :class="['p-1.5 rounded transition-transform active:scale-95', game.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400']" title="Completed">
                <Check class="w-4 h-4" />
            </button>
            <button @click="updateAndClose('backlog')" :class="['p-1.5 rounded transition-transform active:scale-95', game.status === 'backlog' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400']" title="Backlog">
                <Layers class="w-4 h-4" />
            </button>
            <button @click="updateAndClose('dropped')" :class="['p-1.5 rounded transition-transform active:scale-95', game.status === 'dropped' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400']" title="Drop">
                <Ban class="w-4 h-4" />
            </button>
        </div>

        <!-- Center: Stars -->
        <div class="flex items-center gap-0.5 hidden sm:flex">
             <button v-for="star in 5" :key="star" @click.stop="rateAndClose(star)" class="active:scale-125 transition-transform">
                <Star class="w-4 h-4" :class="star <= (game.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'" />
             </button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1">
             <button @click="$emit('delete', game.id)" class="p-1.5 text-red-400 hover:text-white hover:bg-red-900/50 rounded transition-transform active:scale-95" title="Delete">
                <Trash2 class="w-4 h-4" />
            </button>
            <div class="w-px h-6 bg-gray-700 mx-1"></div>
            <button @click="showOverlay = false" class="p-1.5 text-gray-400 hover:text-white rounded transition-transform active:scale-95">
                <X class="w-5 h-5" />
            </button>
        </div>
    </div>
  </div>
</template>
