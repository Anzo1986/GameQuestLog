<script setup>
import { ref, onMounted, watch } from 'vue';
import { X, Calendar, Gamepad2, Globe, Star, Play, Check, Trash2, Timer, Ban, Layers, PenLine } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import EditGameModal from './EditGameModal.vue';

const props = defineProps({
  gameId: {
    type: Number,
    default: null
  },
  isOpen: Boolean
});

const emit = defineEmits(['close', 'update-status', 'delete']);

const { games, rateGame, updateGame } = useGames();

const gameDetails = ref(null);
const showEditModal = ref(false);

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
// ... (keep existing methods)

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

const isOwnedPlatform = (platformName) => {
    if (!gameDetails.value || !gameDetails.value.platform) return false;
    const owned = gameDetails.value.platform.toLowerCase();
    const current = platformName.toLowerCase();
    
    if (owned === current) return true;
    if ((owned === 'ps5' || owned === 'ps4') && current === 'playstation') return true;
    if (owned === 'switch' && current === 'nintendo') return true;
    if (owned.includes('xbox') && current === 'xbox') return true;
    
    return false;};

const isEditingPlaytime = ref(false);
const tempPlaytime = ref(0);
const playtimeInput = ref(null);

const startEditingPlaytime = () => {
    if (gameDetails.value.startedAt) return; 
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
        <!-- Controls -->
        <div class="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button @click="showEditModal = true" class="bg-black/50 p-2 rounded-full hover:bg-black/70 text-white transition-colors" title="Edit Game Details">
                <PenLine class="w-5 h-5" />
            </button>
            <button @click="$emit('close')" class="bg-black/50 p-2 rounded-full hover:bg-black/70 text-white transition-colors">
                <X class="w-5 h-5" />
            </button>
        </div>

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
                <span v-else-if="gameDetails.status === 'playing'" class="text-primary font-bold flex items-center gap-1 text-sm"><Play class="w-4 h-4"/> Playing</span>
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
                <Timer class="w-4 h-4 text-primary" />
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
           <!-- Platforms & Genres & Web Stacked -->
           <div class="space-y-4 pt-4 border-t border-gray-800">
              
              <!-- Row 1: Platforms -->
              <div v-if="gameDetails.parent_platforms && gameDetails.parent_platforms.length > 0">
                  <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Platforms</h4>
                  <div class="flex flex-wrap gap-2">
                       <span v-for="p in gameDetails.parent_platforms" :key="p.platform.id" 
                          class="px-2 py-1 rounded text-xs border transition-colors duration-300"
                          :class="isOwnedPlatform(p.platform.name) 
                            ? 'bg-primary/20 text-primary border-primary/50 font-bold shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] scale-105' 
                            : 'bg-gray-800 text-gray-500 border-gray-700 opacity-60'"
                      >
                          {{ p.platform.name }}
                      </span>
                  </div>
              </div>

              <!-- Row 2: Genres -->
              <div v-if="gameDetails.genres && gameDetails.genres.length > 0">
                  <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Genres</h4>
                  <div class="flex flex-wrap gap-2">
                       <span v-for="g in gameDetails.genres" :key="g.id" class="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                          {{ g.name }}
                      </span>
                  </div>
              </div>

              <!-- Row 3: Website -->
              <div v-if="gameDetails.website">
                   <a :href="gameDetails.website" target="_blank" class="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-primary border border-gray-700 transition-colors">
                      <Globe class="w-4 h-4" /> 
                      <span class="font-medium">Official Website</span>
                  </a>
              </div>

           </div>

        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur flex items-center gap-3">
             <button @click="handleAction('update-status', 'playing')" class="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Play class="w-5 h-5" /> Playing
            </button>
            <button @click="handleAction('update-status', 'completed')" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Check class="w-5 h-5" /> Finish
            </button>
            
            <button @click="handleAction('update-status', 'dropped')" class="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95" title="Drop Game">
                <Ban class="w-5 h-5 text-gray-400" />
            </button>



             <button @click="handleAction('delete')" class="p-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-xl transition-transform active:scale-95" title="Delete Game">
                <Trash2 class="w-5 h-5" />
            </button>
        </div>

      </template>
    </div>
    
    <EditGameModal 
        :is-open="showEditModal" 
        :game="gameDetails" 
        @close="showEditModal = false" 
    />
  </div>
</template>
