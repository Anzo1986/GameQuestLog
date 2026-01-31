<script setup>
import { computed, ref } from 'vue';
import { Play, Check, Trash2, Calendar, MoreVertical, X, Star, Ban, Layers } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useShop } from '../composables/useShop';

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-status', 'delete']);
const { rateGame } = useGames();
const { getEquippedItem } = useShop();

const equippedStyle = computed(() => getEquippedItem('card_style'));

const showOverlay = ref(false);

const toggleOverlay = () => {
    showOverlay.value = !showOverlay.value;
};

const updateAndClose = (status) => {
    emit('update-status', props.game.id, status);
    showOverlay.value = false;
};

const rateAndClose = (rating) => {
    rateGame(props.game.id, rating);
    // Don't close immediately so they can adjust rating if misclicked
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).getFullYear(); // Just year is cleaner for cards
};

const backgroundImage = computed(() => {
  return props.game.background_image || 'https://via.placeholder.com/600x400?text=No+Image';
});

const isNew = computed(() => {
    if (!props.game.addedAt) return false;
    const added = new Date(props.game.addedAt);
    const now = new Date();
    const diffHours = (now - added) / (1000 * 60 * 60);
    return diffHours < 48; // New if added within 48 hours
});
</script>

<template>
  <div 
    class="group relative bg-gray-800 rounded-xl overflow-hidden shadow-md transition-transform active:scale-95 touch-manipulation min-w-0 backface-hidden will-change-transform flex flex-col h-full"
    :class="{
        'border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]': equippedStyle?.value === 'gold',
        'border-2 border-transparent relative after:absolute after:inset-0 after:rounded-xl after:border-2 after:border-white/20 after:pointer-events-none': equippedStyle?.value === 'holo'
    }"
    @click="showOverlay = false"
  >
    
    <!-- Holo Static Sheen (Subtle) -->
    <div v-if="equippedStyle?.value === 'holo'" class="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent mix-blend-overlay"></div>

    <!-- Image Background -->
    <div class="aspect-video w-full overflow-hidden">
      <img :src="backgroundImage" :alt="game.title" class="w-full h-full object-cover transition-opacity duration-300" loading="lazy">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
    </div>

    <!-- Quick Actions Button (Top Right) -->
    <button @click.stop="toggleOverlay" class="absolute top-2 right-2 p-1.5 bg-gray-900/80 text-white rounded-full hover:bg-black z-20">
        <MoreVertical class="w-5 h-5" />
    </button>

    <!-- NEW Badge (Top Left) -->
    <div v-if="isNew" class="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg z-20 animate-pulse border border-blue-400">
        NEW
    </div>

    <!-- Details Content -->
    <div class="absolute bottom-0 left-0 right-0 p-2 sm:p-3" v-if="!showOverlay">
      <h3 class="text-xs sm:text-sm font-bold text-white leading-tight mb-0.5 drop-shadow-sm truncate w-full">{{ game.title }}</h3>
      
      <!-- Status Badge (Mini) -->
      <div class="flex items-center gap-1 mt-0.5">
          <span v-if="game.status === 'playing'" class="text-[9px] uppercase font-bold text-primary bg-primary/30 px-1 py-0.5 rounded">Play</span>
          <span v-else-if="game.status === 'completed'" class="text-[9px] uppercase font-bold text-green-400 bg-green-900/50 px-1 py-0.5 rounded">Done</span>
          <span v-else-if="game.status === 'dropped'" class="text-[9px] uppercase font-bold text-gray-400 bg-gray-700/50 px-1 py-0.5 rounded">Drop</span>
          <div v-if="game.rating > 0" class="flex text-yellow-400 text-[9px] items-center gap-0.5"><Star class="w-2.5 h-2.5 fill-yellow-400" /> {{ game.rating }}</div>
      </div>
    </div>

    <!-- Quick Action Overlay -->
    <div v-if="showOverlay" class="absolute inset-0 bg-gray-900/95 z-30 flex flex-col items-center justify-center gap-3 p-4 animate-in fade-in zoom-in duration-200" @click.stop>
        
        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Update Status</h4>
        
        <div class="grid grid-cols-2 gap-2 w-full">
            <button @click="updateAndClose('playing')" :class="['p-2 rounded text-xs font-bold flex items-center justify-center gap-1', game.status === 'playing' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">
                <Play class="w-3 h-3" /> Play
            </button>
            <button @click="updateAndClose('completed')" :class="['p-2 rounded text-xs font-bold flex items-center justify-center gap-1', game.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">
                <Check class="w-3 h-3" /> Done
            </button>
            <button @click="updateAndClose('backlog')" :class="['p-2 rounded text-xs font-bold flex items-center justify-center gap-1', game.status === 'backlog' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">
                <Layers class="w-3 h-3" /> Backlog
            </button>
            <button @click="updateAndClose('dropped')" :class="['p-2 rounded text-xs font-bold flex items-center justify-center gap-1', game.status === 'dropped' ? 'bg-gray-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">
                <Ban class="w-3 h-3" /> Drop
            </button>
        </div>

        <!-- Quick Rate -->
        <div class="flex gap-1 mt-1">
            <button v-for="star in 5" :key="star" @click.stop="rateAndClose(star)">
               <Star class="w-5 h-5" :class="star <= (game.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'" />
            </button>
        </div>

        <button @click.stop="$emit('delete', game.id)" class="mt-2 text-red-400 text-xs hover:text-white flex items-center gap-1">
            <Trash2 class="w-3 h-3" /> Delete Game
        </button>

        <button @click.stop="showOverlay = false" class="absolute top-2 right-2 text-gray-500 hover:text-white">
            <X class="w-5 h-5" />
        </button>
    </div>

  </div>
</template>

<style scoped>
.backface-hidden {
  backface-visibility: hidden;
}
.will-change-transform {
  will-change: transform;
}
@keyframes holo {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
}
.animate-holo {
    animation: holo 3s ease infinite;
}
</style>
