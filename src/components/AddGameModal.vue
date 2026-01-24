<script setup>
import { ref, watch } from 'vue';
import { Search, Loader2, Plus, X } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { searchQuery, searchResults, isSearching, searchGames, addGame, apiKey } = useGames();
const inputRef = ref(null);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    setTimeout(() => inputRef.value?.focus(), 100);
  } else {
    searchQuery.value = '';
    searchResults.value = [];
  }
});

// Debounce search
let timeout;
watch(searchQuery, (newQuery) => {
  clearTimeout(timeout);
  if (newQuery.trim().length > 2) {
    timeout = setTimeout(() => {
      searchGames(newQuery);
    }, 500); // 500ms delay
  } else {
    searchResults.value = [];
  }
});

const handleAdd = (game) => {
  addGame(game, game.selectedPlatform || 'PC');
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex items-center gap-3">
        <Search class="w-5 h-5 text-gray-400" />
        <input 
          ref="inputRef"
          v-model="searchQuery" 
          placeholder="Search for a game..." 
          class="bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 w-full text-lg outline-none"
        />
        <button @click="$emit('close')" class="p-2 -mr-2 text-gray-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isSearching" class="p-8 flex justify-center">
        <Loader2 class="w-8 h-8 text-blue-500 animate-spin" />
      </div>

      <!-- No API Key Warning -->
       <div v-else-if="!apiKey" class="p-8 text-center text-gray-400">
          <p>Please configure your API Key in settings first.</p>
       </div>

      <!-- Results List -->
      <div v-else class="overflow-y-auto p-2 space-y-2">
        <div v-for="game in searchResults" :key="game.id" class="flex gap-3 bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800 transition-colors group">
          <img :src="game.background_image || 'https://via.placeholder.com/150'" class="w-16 h-20 object-cover rounded-md flex-shrink-0 bg-gray-700" alt="">
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <h4 class="text-white font-medium truncate">{{ game.name }}</h4>
            <div class="flex items-center gap-2 mt-1">
                 <span class="text-sm text-gray-400">{{ game.released?.split('-')[0] || 'Unknown' }}</span>
                 <!-- Platform Quick Select -->
                 <select 
                    @click.stop 
                    v-model="game.selectedPlatform" 
                    class="bg-gray-900 text-xs text-gray-300 border border-gray-700 rounded px-1 py-0.5 outline-none focus:border-blue-500"
                 >
                    <option value="PC">PC</option>
                    <option value="PS5">PS5</option>
                    <option value="PS4">PS4</option>
                    <option value="Switch">Switch</option>
                    <option value="Xbox">Xbox</option>
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
      </div>
      
    </div>
  </div>
</template>
