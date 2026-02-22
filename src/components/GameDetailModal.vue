<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { X, Calendar, Gamepad2, Globe, Star, Play, Check, Trash2, Timer, Ban, Layers, PenLine, Share2, Plus, CheckCircle2, Circle, Loader2, RefreshCw, MoreVertical, Youtube, Twitch, Book, ShoppingCart } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useModals } from '../composables/useModals';
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
  dynamicGame: {
      type: Object,
      default: null
  },
  parentId: {
      type: Number,
      default: null
  },
  isOpen: Boolean
});

const emit = defineEmits(['close', 'update-status', 'delete']);

const { games, rateGame, updateGame, toggleAdditionStatus, fetchGameDetailsOnly } = useGames();
const { getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();
const { shareGame, showShareFeedback } = useShare();
const { activeModal, openModal } = useModals();

const equippedStyle = computed(() => getEquippedItem('card_style')?.value);

// Use computed for gameDetails to ensure immediate availability on mount
const gameDetails = computed(() => {
    if (props.dynamicGame) return props.dynamicGame;
    return games.value.find(g => g.id === props.gameId);
});

const parentGameDetails = computed(() => {
    if (props.parentId) return games.value.find(g => g.id === props.parentId);
    return gameDetails.value;
});

const showEditModal = ref(false);
const showDropdown = ref(false);
const isFetchingDynamic = ref(false);

const openDynamicAddition = async (id, name) => {
    if (isFetchingDynamic.value) return;
    
    // Check if we already cached the full details in the parent game's memory
    const parent = parentGameDetails.value;
    const cachedAddition = parent?.additions?.find(a => a.id === id);
    if (cachedAddition && cachedAddition.fullDetailsLoaded) {
        openModal('gameDetail', { dynamicGame: cachedAddition, parentId: parent?.id });
        return;
    }

    isFetchingDynamic.value = true;
    const dynamicData = await fetchGameDetailsOnly(id);
    isFetchingDynamic.value = false;
    
    if (dynamicData) {
        dynamicData.fullDetailsLoaded = true;
        
        // Inject locally saved rating if it exists
        const localAdditionStatus = parent?.owned_additions?.find(a => (typeof a === 'object' ? a.id === id : a === id));
        if (typeof localAdditionStatus === 'object' && localAdditionStatus.rating) {
            dynamicData.rating = localAdditionStatus.rating;
        } else {
            dynamicData.rating = 0;
        }

        // Cache it in the parent game's `additions` list for the duration of the session
        if (parent && parent.additions) {
            const index = parent.additions.findIndex(a => a.id === id);
            if (index !== -1) {
                // Preserve the original cover_image which is vertical, 
                // while dynamicData has the landscape background_image.
                // Fallback to background_image for migrating existing library items.
                const originalCover = parent.additions[index].cover_image || parent.additions[index].background_image;
                parent.additions[index] = { 
                    ...parent.additions[index], 
                    ...dynamicData,
                    cover_image: originalCover // Force preserve
                };
                updateGame(parent.id, { additions: [...parent.additions] });
            }
        }
        openModal('gameDetail', { dynamicGame: dynamicData, parentId: parent?.id });
    } else {
        // Fallback to searching manually if deep API fails
        emit('close');
        setTimeout(() => openModal('addGame', { initialSearch: name }), 150);
    }
};

const handleRate = (star) => {
    if (props.dynamicGame && parentGameDetails.value) {
        const additionId = props.dynamicGame.id;
        // Emit an event or call useGames (we will add rateNestedAddition to useGames)
        if (props.dynamicGame.rating === star) return;
        
        // Optimistic UI update
        props.dynamicGame.rating = star;

        // Sync with parent
        const parent = parentGameDetails.value;
        if (!parent.owned_additions) parent.owned_additions = [];
        
        // Ensure it's in object format
        parent.owned_additions = parent.owned_additions.map(item => {
            if (typeof item !== 'object') return { id: item, status: 'owned', rating: 0 };
            return item;
        });
        
        const index = parent.owned_additions.findIndex(a => a.id === additionId);
        if (index === -1) {
            // Implicitly mark as owned if they rate it? The user might just be rating an unowned game?
            // Actually, normally you only rate owned games.
            parent.owned_additions.push({ id: additionId, status: 'owned', rating: star });
        } else {
            parent.owned_additions[index].rating = star;
        }
        
        updateGame(parent.id, { owned_additions: [...parent.owned_additions] });
    } else {
        rateGame(props.gameId, star);
    }
};

const toggleNestedAddition = (additionId, event) => {
    if (event) event.stopPropagation();
    if(parentGameDetails.value) {
        toggleAdditionStatus(parentGameDetails.value.id, additionId);
    }
};

const getAdditionStatus = (additionId) => {
    const parent = parentGameDetails.value;
    if (!parent || !parent.owned_additions) return 'unowned';
    
    // Check if it's the old flat array format for safety
    const addition = parent.owned_additions.find(a => (typeof a === 'object' ? a.id === additionId : a === additionId));
    
    if (!addition) return 'unowned';
    if (typeof addition !== 'object') return 'owned'; // Legacy
    return addition.status;
};

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
    const sourceGame = props.dynamicGame ? parentGameDetails.value : gameDetails.value;
    if (!sourceGame || !sourceGame.platform) return false;
    const owned = sourceGame.platform.toLowerCase();
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
        if (activeModal.value === 'gameDetail') {
            emit('close');
        }
    }
}

const getWebsiteDisplayInfo = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return { label: 'YouTube', icon: Youtube };
        if (hostname.includes('twitch.tv')) return { label: 'Twitch', icon: Twitch };
        if (hostname.includes('wikipedia.org')) return { label: 'Wikipedia', icon: Book };
        if (hostname.includes('steampowered.com') || hostname.includes('steamcommunity.com')) return { label: 'Steam', icon: ShoppingCart };
        if (hostname.includes('epicgames.com')) return { label: 'Epic Games', icon: ShoppingCart };
        if (hostname.includes('gog.com')) return { label: 'GOG', icon: ShoppingCart };
        if (hostname.includes('playstation.com')) return { label: 'PlayStation', icon: Globe };
        if (hostname.includes('xbox.com')) return { label: 'Xbox', icon: Globe };
        if (hostname.includes('nintendo.com')) return { label: 'Nintendo', icon: Globe };
        if (hostname.includes('instagram.com')) return { label: 'Instagram', icon: Globe };
        if (hostname.includes('twitter.com') || hostname.includes('x.com')) return { label: 'X (Twitter)', icon: Globe };
        if (hostname.includes('facebook.com')) return { label: 'Facebook', icon: Globe };
        if (hostname.includes('discord.com') || hostname.includes('discord.gg')) return { label: 'Discord', icon: Globe };
        if (hostname.includes('reddit.com')) return { label: 'Reddit', icon: Globe };

        return { url, label: 'Website', icon: Globe };
    } catch {
        return { url, label: 'Website', icon: Globe };
    }
};

const allWebsites = computed(() => {
    const urls = [];
    if (gameDetails.value?.websites && Array.isArray(gameDetails.value.websites)) {
        urls.push(...gameDetails.value.websites);
    } else if (gameDetails.value?.website) { // Legacy fallback
        urls.push(gameDetails.value.website);
    }
    
    return urls.map(url => getWebsiteDisplayInfo(url));
});

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
                <div class="relative">
                    <button @click="showDropdown = !showDropdown" class="bg-black/50 p-2 rounded-full hover:bg-black/70 text-white transition-colors active:scale-95 shadow-md" title="More Actions">
                        <MoreVertical class="w-5 h-5" />
                    </button>
                    
                    <!-- Click-away overlay -->
                    <div v-if="showDropdown" @click="showDropdown = false" class="fixed inset-0 z-[60]"></div>

                    <!-- Dropdown Menu -->
                    <div v-if="showDropdown" class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[70] overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                            @click="showDropdown = false; openModal('refreshGame', { gameId: gameDetails.id })" 
                            class="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white flex items-center gap-3 transition-colors"
                        >
                            <RefreshCw class="w-4 h-4 text-primary" /> Sync Data
                        </button>
                        <button 
                            @click="showDropdown = false; showEditModal = true" 
                            class="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white flex items-center gap-3 transition-colors"
                        >
                            <PenLine class="w-4 h-4 text-blue-400" /> Edit Game
                        </button>
                        <button 
                            @click="showDropdown = false; shareGame(gameDetails)" 
                            class="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white flex items-center gap-3 transition-colors"
                        >
                            <Share2 class="w-4 h-4 text-purple-400" /> Share Game
                        </button>
                    </div>

                    <!-- Share Feedback -->
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
                        @click.stop="handleRate(star)"
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

                  <!-- Row 3: Websites -->
                  <div v-if="allWebsites.length > 0">
                       <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Links</h4>
                       <div class="flex flex-wrap gap-2">
                           <a 
                               v-for="(site, idx) in allWebsites" 
                               :key="idx" 
                               :href="site.url" 
                               target="_blank" 
                               class="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-primary border border-white/10 transition-colors active:scale-95 shadow-sm hover:shadow"
                           >
                              <component :is="site.icon" class="w-4 h-4" /> 
                              <span class="font-medium">{{ site.label }}</span>
                          </a>
                       </div>
                  </div>

                  <!-- Row 4: DLCs & Expansions -->
                  <div v-if="gameDetails.additions && gameDetails.additions.length > 0" class="pt-4 border-t border-white/10 mt-4">
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">DLCs & Expansions</h4>
                      <div class="flex overflow-x-auto gap-4 custom-scrollbar pb-4 snap-x relative">
                          <div 
                              v-for="addition in gameDetails.additions" 
                              :key="addition.id"
                              @click="openDynamicAddition(addition.id, addition.name)"
                              class="flex-shrink-0 w-28 snap-start group cursor-pointer"
                          >
                              <div 
                                  class="relative aspect-[3/4] rounded-lg overflow-hidden border mb-2 bg-gray-900 transition-all duration-300"
                                  :class="getAdditionStatus(addition.id) === 'finished' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] opacity-100' : getAdditionStatus(addition.id) === 'owned' ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] opacity-100' : 'border-white/10 opacity-100'"
                              >
                                  <img :src="addition.cover_image || addition.background_image" v-if="addition.cover_image || addition.background_image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  <div v-else class="w-full h-full bg-gray-800 flex items-center justify-center">
                                      <Gamepad2 class="w-8 h-8 text-gray-600" />
                                  </div>
                                  
                                  <!-- Owned Toggle Badge (View Only) -->
                                  <div 
                                      v-if="getAdditionStatus(addition.id) !== 'unowned'"
                                      class="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-md p-1 z-10"
                                      :title="getAdditionStatus(addition.id) === 'finished' ? 'Expansion Finished' : 'Expansion Owned'"
                                  >
                                      <CheckCircle2 v-if="getAdditionStatus(addition.id) === 'finished'" class="w-5 h-5 text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                      <Plus v-else-if="getAdditionStatus(addition.id) === 'owned'" class="w-5 h-5 text-primary drop-shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]" />
                                  </div>
                                  
                              </div>
                              <h5 class="text-xs font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors leading-snug" :class="getAdditionStatus(addition.id) !== 'unowned' ? 'text-white' : 'text-gray-400'">{{ addition.name }}</h5>
                              <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">{{ addition.type }} {{ addition.released ? '• ' + addition.released.substring(0,4) : '' }}</p>
                          </div>
                      </div>
                  </div>

               </div>

            </div>

            <!-- Loading Overlay -->
            <div v-if="isFetchingDynamic" class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <Loader2 class="w-12 h-12 text-primary animate-spin" />
            </div>

            <!-- Dynamic DLC Footer Actions -->
            <div v-if="dynamicGame" class="p-4 border-t border-white/10 bg-gray-900/60 backdrop-blur flex items-center justify-center gap-3">
                <button @click="toggleNestedAddition(dynamicGame.id)" 
                        class="w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg border border-white/10"
                        :class="getAdditionStatus(dynamicGame.id) === 'finished' ? 'bg-green-600 hover:bg-green-500 text-white' : getAdditionStatus(dynamicGame.id) === 'owned' ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'">
                    
                    <CheckCircle2 v-if="getAdditionStatus(dynamicGame.id) === 'finished'" class="w-6 h-6" />
                    <Plus v-else-if="getAdditionStatus(dynamicGame.id) === 'owned'" class="w-6 h-6" />
                    <Circle v-else class="w-6 h-6" />
                    
                    <span class="text-lg uppercase tracking-wider">{{ getAdditionStatus(dynamicGame.id) === 'finished' ? 'Expansion Finished' : getAdditionStatus(dynamicGame.id) === 'owned' ? 'Expansion Owned' : 'Mark as Owned' }}</span>
                </button>
            </div>

            <!-- Standard Footer Actions -->
            <div v-else class="p-4 border-t border-white/10 bg-gray-900/60 backdrop-blur flex items-center gap-3">
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
