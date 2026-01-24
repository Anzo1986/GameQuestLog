<script setup>
import { ref, onMounted, watch } from 'vue';
import { X, Calendar, Gamepad2, Globe, Star, Play, Check, Trash2, Timer, Ban, Layers, RefreshCw } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const props = defineProps({
  gameId: {
    type: Number,
    required: true
  },
  isOpen: Boolean
});

const emit = defineEmits(['close', 'update-status', 'delete']);

const { games, rateGame, updateGame, refreshGame } = useGames();

const gameDetails = ref(null);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    const game = games.value.find(g => g.id === props.gameId);
    if (game) {
        gameDetails.value = game;
    } else {
        gameDetails.value = null; 
    }
  } else {
    gameDetails.value = null;
  }
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const calculateDaysPlayed = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

const isEditingPlaytime = ref(false);
const tempPlaytime = ref(0);
const playtimeInput = ref(null);



const startEditingPlaytime = () => {
    if (gameDetails.value.startedAt) return; // Don't edit estimated playtime if already playing? Actually users might still want to see estimate. Let's allow it but UI shows Days Played.
    // Wait, the UI only shows "click to edit" if NOT startedAt.
    // If we want to allow editing estimate even while playing, we need to change template logic. 
    // For now, let's strictly follow the template structure: editing is for Backlog estimation mainly.
    // But wait, the user wants to fix Pile of Shame which is Backlog. So this is fine.
    
    tempPlaytime.value = gameDetails.value.playtime || 0;
    isEditingPlaytime.value = true;
    setTimeout(() => playtimeInput.value?.focus(), 50);
};

const savePlaytime = () => {
    if (tempPlaytime.value >= 0) {
        updateGame(props.gameId, { playtime: tempPlaytime.value });
    }
    isEditingPlaytime.value = false;
};

const isRefreshing = ref(false);

const handleAction = async (action, val) => {
    if (action === 'delete') {
        if(confirm('Are you sure you want to delete this game?')) {
            emit('delete', props.gameId);
            emit('close');
        }
    } else if (action === 'refresh') {
        isRefreshing.value = true;
        const result = await refreshGame(props.gameId);
        isRefreshing.value = false;
        
        if (result.success) {
            alert("Game details updated from server!");
        } else {
            alert("Update failed. Check your internet or API Key.");
        }
    } else {
        emit('update-status', props.gameId, val);
        emit('close');
    }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Content -->
      <template v-if="gameDetails">
        <!-- Close Button -->
        <button @click="$emit('close')" class="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full hover:bg-black/70 text-white transition-colors">
          <X class="w-5 h-5" />
        </button>

        <!-- Header Image & Title & Rating -->
        <div class="relative h-64 flex-shrink-0">
          <img :src="gameDetails.background_image" class="w-full h-full object-cover" :alt="gameDetails.name">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
          
          <div class="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
             <h2 class="text-3xl md:text-3xl font-black text-white leading-tight drop-shadow-xl mb-2">{{ gameDetails.name }}</h2>
             
             <!-- My Rating Stars (Large & Centered) -->
             <div class="flex gap-2">
                   <button 
                    v-for="star in 5" 
                    :key="star" 
                    @click.stop="rateGame(gameId, star)"
                    class="transition-transform active:scale-110 focus:outline-none"
                   >
                       <Star 
                        class="w-6 h-6 drop-shadow-md" 
                        :class="star <= (gameDetails.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500/50'" 
                       />
                   </button>
             </div>
             <p class="text-xs text-gray-400 mt-1 font-medium tracking-wide uppercase">My Personal Rating</p>
          </div>
        </div>

        <!-- Meta Bar (Consolidated Info) -->
        <div class="flex items-center justify-between gap-3 px-6 py-4 bg-gray-800/50 border-b border-gray-800 overflow-x-auto">
            
            <!-- Status Badge -->
            <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="gameDetails.status === 'completed'" class="text-green-400 font-bold flex items-center gap-1 text-sm"><Check class="w-4 h-4"/> Completed</span>
                <span v-else-if="gameDetails.status === 'playing'" class="text-blue-400 font-bold flex items-center gap-1 text-sm"><Play class="w-4 h-4"/> Playing</span>
                <span v-else-if="gameDetails.status === 'dropped'" class="text-gray-400 font-bold flex items-center gap-1 text-sm"><Ban class="w-4 h-4"/> Dropped</span>
                <span v-else class="text-yellow-400 font-bold flex items-center gap-1 text-sm"><Layers class="w-4 h-4"/> Backlog</span>
            </div>

            <div class="h-4 w-px bg-gray-700 flex-shrink-0"></div>

            <!-- RAWG Rating -->
            <div class="flex items-center gap-1 text-sm text-gray-300 flex-shrink-0" title="RAWG Rating">
                <Star class="w-4 h-4 text-orange-400" />
                <span class="font-bold text-white">{{ gameDetails.rating_top || '?' }}</span>/5
            </div>

            <!-- Release Date -->
            <div class="flex items-center gap-1 text-sm text-gray-400 flex-shrink-0">
                <Calendar class="w-4 h-4" />
                {{ formatDate(gameDetails.released) }}
            </div>

            <!-- Playtime / HLTB (Days Played Only) -->
            <div class="flex items-center gap-1 text-sm flex-shrink-0" v-if="gameDetails.startedAt">
                <Timer class="w-4 h-4 text-purple-400" />
                <span class="text-white font-bold">{{ calculateDaysPlayed(gameDetails.startedAt) }} Days</span>
            </div>

        </div>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto p-6 space-y-6">
           
           <!-- Description -->
           <div class="prose prose-invert prose-sm max-w-none text-gray-300">
              <div v-html="gameDetails.description"></div>
           </div>

           <!-- Platforms & Genres & Web -->
           <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
              <span v-for="p in gameDetails.parent_platforms" :key="p.platform.id" class="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                  {{ p.platform.name }}
              </span>
              <span v-for="g in gameDetails.genres" :key="g.id" class="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                  {{ g.name }}
              </span>
              <a v-if="gameDetails.website" :href="gameDetails.website" target="_blank" class="flex items-center gap-1 px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 rounded text-xs text-blue-300 border border-blue-800/50 transition-colors ml-auto">
                  <Globe class="w-3 h-3" /> Website
              </a>
           </div>

        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur flex items-center gap-3">
             <button @click="handleAction('update-status', 'playing')" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Play class="w-5 h-5" /> Playing
            </button>
            <button @click="handleAction('update-status', 'completed')" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Check class="w-5 h-5" /> Finish
            </button>
            
            <button @click="handleAction('update-status', 'dropped')" class="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95" title="Drop Game">
                <Ban class="w-5 h-5 text-gray-400" />
            </button>

            <button @click="handleAction('refresh')" class="bg-gray-800 hover:bg-gray-700 text-purple-400 hover:text-purple-300 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95" title="Refresh Data">
                <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': isRefreshing }" />
            </button>

             <button @click="handleAction('delete')" class="p-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-xl transition-transform active:scale-95" title="Delete Game">
                <Trash2 class="w-5 h-5" />
            </button>
        </div>

      </template>
    </div>
  </div>
</template>
