<script setup>
import { computed, ref } from 'vue';
import { Play, Check, Trash2, Calendar, MoreVertical, X, Star, Ban, Layers } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-status', 'delete']);
const { rateGame } = useGames();

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
</script>

<template>
  <div class="relative group overflow-hidden rounded-xl bg-gray-800 shadow-lg transition-transform active:scale-95 touch-manipulation min-w-0" @click="showOverlay = false">
    
    <!-- Image Background -->
    <div class="aspect-video w-full overflow-hidden">
      <img :src="backgroundImage" :alt="game.title" class="w-full h-full object-cover transition-opacity duration-300" loading="lazy">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
    </div>

    <!-- Quick Actions Button (Top Right) -->
    <button @click.stop="toggleOverlay" class="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 z-20">
        <MoreVertical class="w-5 h-5" />
    </button>

    <!-- Details Content -->
    <div class="absolute bottom-0 left-0 right-0 p-2 sm:p-3" v-if="!showOverlay">
      <h3 class="text-xs sm:text-sm font-bold text-white leading-tight mb-0.5 drop-shadow-md truncate w-full">{{ game.title }}</h3>
      
      <!-- Status Badge (Mini) -->
      <div class="flex items-center gap-1 mt-0.5">
          <span v-if="game.status === 'playing'" class="text-[9px] uppercase font-bold text-blue-400 bg-blue-900/30 px-1 py-0.5 rounded">Play</span>
          <span v-else-if="game.status === 'completed'" class="text-[9px] uppercase font-bold text-green-400 bg-green-900/30 px-1 py-0.5 rounded">Done</span>
          <span v-else-if="game.status === 'dropped'" class="text-[9px] uppercase font-bold text-gray-400 bg-gray-700/50 px-1 py-0.5 rounded">Drop</span>
          <div v-if="game.rating > 0" class="flex text-yellow-400 text-[9px] items-center gap-0.5"><Star class="w-2.5 h-2.5 fill-yellow-400" /> {{ game.rating }}</div>
      </div>
    </div>

    <!-- Quick Action Overlay -->
    <div v-if="showOverlay" class="absolute inset-0 bg-gray-900/95 z-30 flex flex-col items-center justify-center gap-3 p-4 animate-in fade-in zoom-in duration-200" @click.stop>
        
        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Update Status</h4>
        
        <div class="grid grid-cols-2 gap-2 w-full">
            <button @click="updateAndClose('playing')" :class="['p-2 rounded text-xs font-bold flex items-center justify-center gap-1', game.status === 'playing' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">
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
