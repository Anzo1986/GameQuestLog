<script setup>
import { ref, watch } from 'vue';
import { Search, Loader2, Plus, X, PenTool, Calendar, Image as ImageIcon, CornerUpLeft, Gamepad2, Tag, Check } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { GENRES } from '../constants/genres';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { searchQuery, searchResults, isSearching, searchGames, addGame, apiKey, PLATFORMS } = useGames();
const inputRef = ref(null);
const manualInputRef = ref(null);

const showManualForm = ref(false);
const showGenreDropdown = ref(false);

const manualForm = ref({
    name: '',
    image: '',
    releaseDate: '',
    platform: 'PC',
    genres: []
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    showManualForm.value = false;
    manualForm.value = { name: '', image: '', releaseDate: '', platform: 'PC', genres: [] };
    setTimeout(() => inputRef.value?.focus(), 100);
  } else {
    searchQuery.value = '';
    searchResults.value = [];
    showManualForm.value = false;
  }
});

// Debounce search
let timeout;
watch(searchQuery, (newQuery) => {
  if (showManualForm.value) return; 
  
  clearTimeout(timeout);
  if (newQuery.trim().length > 2) {
    timeout = setTimeout(() => {
      searchGames(newQuery);
    }, 500); // 500ms delay
  } else {
    searchResults.value = [];
  }
});

const toggleManualMode = () => {
    showManualForm.value = !showManualForm.value;
    if (showManualForm.value) {
        setTimeout(() => manualInputRef.value?.focus(), 100);
    } else {
        setTimeout(() => inputRef.value?.focus(), 100);
    }
};

const toggleGenre = (genre) => {
    if (manualForm.value.genres.includes(genre)) {
        manualForm.value.genres = manualForm.value.genres.filter(g => g !== genre);
    } else {
        manualForm.value.genres.push(genre);
    }
};

const submitManualGame = () => {
    if (!manualForm.value.name) return;

    const newGame = {
        id: Date.now(), // Generate a unique ID
        name: manualForm.value.name,
        background_image: manualForm.value.image || null, // Let placeholder handle null
        released: manualForm.value.releaseDate || null,
        selectedPlatform: manualForm.value.platform, // Use selected platform
        genres: manualForm.value.genres.map(name => ({
            id: Date.now() + Math.random(),
            name: name,
            slug: name.toLowerCase().replace(/\s+/g, '-')
        }))
    };

    addGame(newGame, newGame.selectedPlatform);
    emit('close');
};

const handleAdd = (game) => {
  addGame(game, game.selectedPlatform || 'PC');
  emit('close');
};
</script>

<template>
  <BaseModal 
    :is-open="isOpen" 
    @close="$emit('close')" 
    max-width="max-w-lg"
    align-top
  >
      <!-- Custom Header Slot -->
      <template #header>
        <div class="flex-1 flex items-center gap-3">
            <template v-if="!showManualForm">
                <Search class="w-5 h-5 text-gray-400" />
                <input 
                  ref="inputRef"
                  v-model="searchQuery" 
                  placeholder="Search for a game..." 
                  class="bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 w-full text-lg outline-none"
                />
                 <!-- Manual Toggle -->
                <button @click="toggleManualMode" class="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-full transition-colors active:scale-95" title="Manually Add Game">
                    <PenTool class="w-5 h-5" />
                </button>
            </template>
            <template v-else>
                <div class="flex items-center gap-2 w-full">
                    <button @click="toggleManualMode" class="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95">
                        <CornerUpLeft class="w-5 h-5" />
                    </button>
                    <h3 class="text-lg font-bold text-white">Add Custom Game</h3>
                </div>
            </template>
        </div>
      </template>

      <!-- Content Area -->
      
      <!-- MANUAL FORM -->
      <div v-if="showManualForm" class="p-6 space-y-4">
          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400">Game Title <span class="text-red-500">*</span></label>
              <input 
                ref="manualInputRef"
                v-model="manualForm.name" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-600 active:scale-[0.99]"
                placeholder="e.g. Super Custom RPG"
                @keyup.enter="submitManualGame"
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <ImageIcon class="w-4 h-4" /> Image URL
              </label>
              <input 
                v-model="manualForm.image" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-600 active:scale-[0.99]"
                placeholder="https://example.com/cover.jpg"
              />
               <!-- Image Preview -->
              <div v-if="manualForm.image" class="mt-2 h-32 w-full rounded-lg overflow-hidden border border-gray-700 bg-gray-800 relative group">
                  <img :src="manualForm.image" class="w-full h-full object-cover" @error="$event.target.style.display='none'" />
              </div>
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Calendar class="w-4 h-4" /> Release Date / Year
              </label>
              <input 
                v-model="manualForm.releaseDate" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-600 active:scale-[0.99]"
                placeholder="e.g. 2024 or 2023-11-15"
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Gamepad2 class="w-4 h-4" /> Platform
              </label>
              <select 
                v-model="manualForm.platform" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-600 appearance-none active:scale-[0.99]"
              >
                  <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
              </select>
          </div>

          <!-- Genres Multi-Select -->
          <div class="space-y-2 relative">
               <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Tag class="w-4 h-4" /> Genres
              </label>
              
              <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 min-h-[46px] cursor-pointer hover:border-gray-600 active:scale-[0.99] transition-transform" @click="showGenreDropdown = !showGenreDropdown">
                  <div class="flex flex-wrap gap-2" v-if="manualForm.genres.length > 0">
                      <span v-for="g in manualForm.genres" :key="g" class="bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30 flex items-center gap-1">
                          {{ g }}
                          <button @click.stop="toggleGenre(g)" class="hover:text-white"><X class="w-3 h-3" /></button>
                      </span>
                  </div>
                  <span v-else class="text-gray-500 text-sm">Select Genres...</span>
              </div>

              <!-- Dropdown -->
              <div v-if="showGenreDropdown" class="absolute left-0 right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto w-full">
                   <div v-for="genre in GENRES" :key="genre" 
                        @click="toggleGenre(genre)"
                        class="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm flex items-center justify-between"
                        :class="manualForm.genres.includes(genre) ? 'text-white bg-gray-700/50' : 'text-gray-300'"
                   >
                       {{ genre }}
                       <Check v-if="manualForm.genres.includes(genre)" class="w-4 h-4 text-primary" />
                   </div>
              </div>
              <!-- Backdrop for dropdown -->
              <div v-if="showGenreDropdown" class="fixed inset-0 z-40" @click="showGenreDropdown = false"></div>
          </div>

          <div class="pt-4 flex justify-end gap-3">
              <button @click="toggleManualMode" class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors active:scale-95">
                  Cancel
              </button>
              <button 
                @click="submitManualGame" 
                :disabled="!manualForm.name"
                class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl shadow-lg font-medium transition-transform active:scale-95 flex items-center gap-2"
              >
                  <Plus class="w-4 h-4" /> Add Game
              </button>
          </div>
      </div>

      <!-- SEARCH RESULTS (Existing) -->
      <template v-else>
          <!-- Loading State -->
          <div v-if="isSearching" class="p-6 space-y-2">
             <div v-for="n in 3" :key="n" class="flex gap-3 bg-gray-800/20 p-2 rounded-lg border border-gray-800 animate-pulse">
                <!-- Image Skeleton -->
               <div class="w-16 h-20 bg-gray-800 rounded-md flex-shrink-0"></div>
               <!-- Text Skeleton -->
               <div class="flex-1 flex flex-col justify-start space-y-2">
                 <div class="h-4 bg-gray-800 rounded w-3/4"></div>
                 <div class="flex gap-2">
                    <div class="h-3 bg-gray-800 rounded w-1/4"></div>
                    <div class="h-3 bg-gray-800 rounded w-1/3"></div>
                 </div>
               </div>
               <!-- Button Skeleton -->
               <div class="self-center w-9 h-9 bg-gray-800 rounded-full"></div>
             </div>
          </div>

          <!-- No API Key Warning -->
           <div v-else-if="!apiKey" class="p-8 text-center text-gray-400">
              <p>Please configure your API Key in settings first.</p>
              <p class="text-sm mt-2 text-gray-500">Or use the manual add button above.</p>
           </div>

          <!-- Results List -->
          <div v-else class="overflow-y-auto p-4 space-y-2 custom-scrollbar flex-1">
            <div v-for="game in searchResults" :key="game.id" class="flex gap-3 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors group">
              <div class="w-16 h-20 rounded-md flex-shrink-0 bg-gray-700 overflow-hidden relative">
                  <img v-if="game.background_image" :src="game.background_image" class="w-full h-full object-cover" alt="">
                  <div v-else class="w-full h-full flex items-center justify-center">
                     <Gamepad2 class="w-6 h-6 text-gray-500" />
                  </div>
              </div>
              <div class="flex-1 min-w-0 flex flex-col justify-start">
                <h4 class="text-white font-medium truncate">{{ game.name }}</h4>
                <div class="flex items-center gap-2 mt-1">
                     <span class="text-sm text-gray-400">{{ game.released?.split('-')[0] || 'Unknown' }}</span>
                     <!-- Platform Quick Select -->
                     <select 
                        @click.stop 
                        v-model="game.selectedPlatform" 
                        class="bg-gray-900 text-xs text-gray-300 border border-gray-700 rounded px-1 py-0.5 outline-none focus:border-blue-500"
                     >
                        <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
                     </select>
                </div>
              </div>
              <button @click="handleAdd(game)" class="self-center bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95">
                <Plus class="w-5 h-5" />
              </button>
            </div>

            <div v-if="searchResults.length === 0 && !isSearching && searchQuery" class="p-8 text-center text-gray-500">
              No games found.
            </div>
            
             <div v-if="searchResults.length === 0 && !isSearching && !searchQuery" class="p-8 text-center text-gray-600">
               <p class="text-sm">Start typing to search...</p>
            </div>
          </div>
      </template>
  </BaseModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
}
</style>
