<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { X, Calendar, Gamepad2, Globe, Star, Play, Check, Trash2, Timer, Ban, Layers, PenLine, Share2 } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useShop } from '../composables/useShop';
import { useCardStyles } from '../composables/useCardStyles';
import { useShare } from '../composables/useShare';
import EditGameModal from './EditGameModal.vue';
import GameCardInnerEffects from './GameCardInnerEffects.vue';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  gameId: {
    type: Number,
    default: null
  },
  isOpen: Boolean
});

const emit = defineEmits(['close', 'update-status', 'delete']);

const { games, rateGame, updateGame } = useGames();
const { getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();
const { shareGame, showShareFeedback } = useShare();

const equippedStyle = computed(() => getEquippedItem('card_style')?.value);

// Use computed for gameDetails to ensure immediate availability on mount
const gameDetails = computed(() => {
    return games.value.find(g => g.id === props.gameId);
});

const showEditModal = ref(false);

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
    
    return false;
};

const handleAction = async (action, val) => {
    if (action === 'delete') {
        emit('delete', props.gameId);
    } else {
        emit('update-status', props.gameId, val);
        emit('close');
    }
}
</script>

<template>
  <BaseModal 
    :is-open="isOpen" 
    @close="$emit('close')" 
    max-width="max-w-2xl"
    transparent
  >
      <template v-if="gameDetails">
        <!-- PRISM BORDER ANIMATION (Behind) -->
        <div v-if="equippedStyle === 'prism'" class="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0 animate-spin-slow opacity-80 blur-sm pointer-events-none"></div>
        <div v-if="equippedStyle === 'prism'" class="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0 animate-spin-slow pointer-events-none"></div>

        <div 
            class="relative w-full h-full flex flex-col backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10 overflow-hidden rounded-2xl" 
            :class="getCardClasses(equippedStyle, true)"
        >
          <!-- REFACTORED INNER EFFECTS -->
          <GameCardInnerEffects :style-name="equippedStyle" />


          <!-- Content Box -->
          <div class="relative z-10 flex flex-col h-full">

            <!-- Controls (Custom placement inside card) -->
            <div class="absolute top-4 right-14 z-50 flex items-center gap-2">
                <button @click="showEditModal = true" class="bg-black/50 p-2 rounded-full hover:bg-black/70 text-white transition-colors active:scale-95" title="Edit Game Details">
                    <PenLine class="w-5 h-5" />
                </button>
                <div class="relative">
                    <button @click="shareGame(gameDetails)" class="bg-black/50 p-2 rounded-full hover:bg-black/70 text-white transition-colors active:scale-95" title="Share Game">
                        <Share2 class="w-5 h-5" />
                    </button>
                     <span v-if="showShareFeedback" class="absolute -bottom-8 right-0 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded shadow animate-bounce whitespace-nowrap z-50">
                        Link Copied!
                    </span>
                </div>
            </div>

            <!-- Header Image & Title & Rating -->
            <div class="relative h-64 flex-shrink-0 bg-transparent group overflow-hidden">
              <img v-if="gameDetails.background_image" :src="gameDetails.background_image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" :alt="gameDetails.name" :style="{ viewTransitionName: `game-image-${gameDetails.id}` }">
              <div v-else class="absolute inset-0 flex items-center justify-center">
                  <Gamepad2 class="w-24 h-24 text-gray-700" />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              
              <div class="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
                 <h2 class="text-3xl md:text-3xl font-black text-white leading-tight drop-shadow-xl mb-2">{{ gameDetails.name }}</h2>
                 
                 <!-- My Rating Stars (Large & Centered) -->
                 <div class="flex gap-2">
                       <button 
                        v-for="star in 5" 
                        :key="star" 
                        @click.stop="rateGame(gameId, star)"
                        class="transition-transform active:scale-110 focus:outline-none hover:scale-110"
                       >
                           <Star 
                            class="w-6 h-6 drop-shadow-md transition-colors" 
                            :class="star <= (gameDetails.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500/50'" 
                           />
                       </button>
                 </div>
                 <p class="text-xs text-gray-400 mt-1 font-medium tracking-wide uppercase">My Personal Rating</p>
              </div>
            </div>

            <!-- Meta Bar (Consolidated Info) -->
            <div class="flex items-center justify-between gap-3 px-6 py-4 bg-gray-900/30 border-b border-white/10 overflow-x-auto custom-scrollbar">
                
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
            <div class="overflow-y-auto p-6 space-y-6 custom-scrollbar flex-1">
               
               <!-- Description -->
               <div class="prose prose-invert prose-sm max-w-none text-gray-300">
                  <div 
                      contenteditable="true"
                      class="outline-none focus:ring-2 focus:ring-primary/50 rounded p-1 transition-all -ml-1"
                      @blur="(e) => updateGame(gameDetails.id, { description: e.target.innerHTML })"
                      v-html="gameDetails.description"
                  ></div>
               </div>

               <!-- Platforms & Genres & Web -->
               <!-- Platforms & Genres & Web Stacked -->
               <div class="space-y-4 pt-4 border-t border-white/10">
                  
                  <!-- Row 1: Platforms -->
                  <div v-if="gameDetails.parent_platforms && gameDetails.parent_platforms.length > 0">
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Platforms</h4>
                      <div class="flex flex-wrap gap-2">
                           <span v-for="p in gameDetails.parent_platforms" :key="p.platform.id" 
                              class="px-2 py-1 rounded text-xs border transition-colors duration-300"
                              :class="isOwnedPlatform(p.platform.name) 
                                ? 'bg-primary/20 text-primary border-primary/50 font-bold shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] scale-105' 
                                : 'bg-white/5 text-gray-500 border-white/10 opacity-60'"
                          >
                              {{ p.platform.name }}
                          </span>
                      </div>
                  </div>

                  <!-- Row 2: Genres -->
                  <div v-if="gameDetails.genres && gameDetails.genres.length > 0">
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Genres</h4>
                      <div class="flex flex-wrap gap-2">
                           <span v-for="g in gameDetails.genres" :key="g.id" class="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/10">
                              {{ g.name }}
                          </span>
                      </div>
                  </div>

                  <!-- Row 3: Website -->
                  <div v-if="gameDetails.website">
                       <a :href="gameDetails.website" target="_blank" class="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-primary border border-white/10 transition-colors active:scale-95">
                          <Globe class="w-4 h-4" /> 
                          <span class="font-medium">Official Website</span>
                      </a>
                  </div>

               </div>

            </div>

            <!-- Footer Actions -->
            <div class="p-4 border-t border-white/10 bg-gray-900/60 backdrop-blur flex items-center gap-3">
                 <button @click="handleAction('update-status', 'playing')" class="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg border border-white/10">
                    <Play class="w-5 h-5" /> Playing
                </button>
                <button @click="handleAction('update-status', 'completed')" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg border border-white/10">
                    <Check class="w-5 h-5" /> Finish
                </button>
                
                <button @click="handleAction('update-status', 'dropped')" class="bg-gray-800/80 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 border border-white/10" title="Drop Game">
                    <Ban class="w-5 h-5 text-gray-400" />
                </button>

                 <button @click="handleAction('delete')" class="p-3 bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded-xl transition-transform active:scale-95 border border-red-500/30" title="Delete Game">
                    <Trash2 class="w-5 h-5" />
                </button>
            </div>

            <EditGameModal 
                :is-open="showEditModal" 
                :game="gameDetails" 
                @close="showEditModal = false" 
            />
          </div>
        </div>
      </template>
  </BaseModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}
.animate-spin-slow-reverse {
    animation: spin 10s linear infinite reverse;
}
.animate-spin-slow {
    animation: spin 8s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
