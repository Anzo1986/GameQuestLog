<script setup>
import { ref, watch, computed } from 'vue';
import { Search, Loader2, X, Check, Save, Gamepad2, Database, AlertCircle, RefreshCw, Layers, Calendar, Image as ImageIcon, PenTool } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  isOpen: Boolean,
  gameId: {
    type: Number,
    required: true
  }
});


const emit = defineEmits(['close']);

const { games, searchGames, searchResults, isSearching, fetchGameDetailsOnly, fetchGameImages, updateGame, gameApiProvider } = useGames();

const currentGame = computed(() => games.value.find(g => g.id === props.gameId));

// View States: 'search' | 'fetching' | 'select'
const step = ref('search');
const localSearchQuery = ref('');
const fetchError = ref('');

const newGameDetails = ref(null);

// Form selection
const updateSelection = ref({
    name: false,
    cover: true,
    description: true,
    additions: true,
    metadata: true
});

const showGallery = ref(false);
const isFetchingImages = ref(false);
const galleryImages = ref([]);

watch(() => props.isOpen, (newVal) => {
    if (newVal && currentGame.value) {
        step.value = 'search';
        localSearchQuery.value = currentGame.value.name;
        newGameDetails.value = null;
        fetchError.value = '';
        updateSelection.value = { name: false, cover: true, description: true, additions: true, metadata: true };
        showGallery.value = false;
        galleryImages.value = [];
        
        // Auto-search immediately without debounce
        searchGames(currentGame.value.name);
    }
}, { immediate: true });

let searchTimeout;
const handleSearchInput = () => {
    clearTimeout(searchTimeout);
    if (localSearchQuery.value.trim().length > 2) {
        searchTimeout = setTimeout(() => {
            searchGames(localSearchQuery.value);
        }, 500);
    }
};

const selectResult = async (result) => {
    step.value = 'fetching';
    fetchError.value = '';
    
    try {
        const details = await fetchGameDetailsOnly(result.id);
        if (details) {
            newGameDetails.value = details;
            step.value = 'select';
        } else {
            fetchError.value = 'Could not fetch deep details for this match.';
            step.value = 'search';
        }
    } catch (e) {
        console.error(e);
        fetchError.value = 'An error occurred while fetching details.';
        step.value = 'search';
    }
};

const openGallery = async () => {
    if (!newGameDetails.value || isFetchingImages.value) return;
    
    if (showGallery.value) {
        showGallery.value = false;
        return;
    }
    
    showGallery.value = true;
    if (galleryImages.value.length === 0) {
        isFetchingImages.value = true;
        // Fetch using the new matched game's ID, not the legacy one
        galleryImages.value = await fetchGameImages(newGameDetails.value.id);
        isFetchingImages.value = false;
    }
};

const selectGalleryImage = (hiresUrl) => {
    if (newGameDetails.value) {
        newGameDetails.value.background_image = hiresUrl;
        // Auto-check the cover update box so they don't forget
        updateSelection.value.cover = true; 
    }
};

const applyUpdates = () => {
    if (!newGameDetails.value || !currentGame.value) return;
    
    const updates = {};
    const n = newGameDetails.value;
    const s = updateSelection.value;
    
    if (s.cover && n.background_image) updates.background_image = n.background_image;
    if (s.name && n.name) updates.name = n.name;
    if (s.description && n.description) {
        updates.description = n.description;
        updates.description_raw = n.description_raw;
    }
    if (s.additions && n.additions) updates.additions = n.additions;
    if (s.metadata) {
        if (n.parent_platforms) updates.parent_platforms = n.parent_platforms;
        if (n.genres) updates.genres = n.genres;
        if (n.developers) updates.developers = n.developers;
        if (n.websites) updates.websites = n.websites;
        if (n.released) updates.released = n.released;
        if (n.metacritic) updates.metacritic = n.metacritic;
    }
    
    // Always update ID so it maps to the active provider natively for future fetches
    updates.id = n.id;
    
    updateGame(props.gameId, updates);
    emit('close');
};
</script>

<template>
  <BaseModal :is-open="isOpen" @close="$emit('close')" max-width="max-w-3xl">
    <div class="p-6">
        <h2 class="text-2xl font-black mb-6 text-white flex items-center gap-3">
            <RefreshCw class="w-6 h-6 text-primary" />
            Update Game Data
        </h2>

        <!-- STEP 1: Search -->
        <div v-if="step === 'search'" class="space-y-4">
            <p class="text-gray-400 text-sm">Searching the active API ({{ gameApiProvider.toUpperCase() }}) to find the best match for this game.</p>
            
            <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                    v-model="localSearchQuery" 
                    @input="handleSearchInput"
                    type="text" 
                    class="w-full bg-gray-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Search game title..."
                />
            </div>

            <div v-if="fetchError" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-start gap-3">
                <AlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p class="text-sm">{{ fetchError }}</p>
            </div>

            <div v-if="isSearching" class="flex justify-center p-8">
                <Loader2 class="w-8 h-8 text-primary animate-spin" />
            </div>

            <div v-else-if="searchResults.length > 0" class="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-2 mt-4 cursor-pointer">
                <div 
                    v-for="result in searchResults" 
                    :key="result.id"
                    @click="selectResult(result)"
                    class="flex gap-4 p-3 bg-gray-900 rounded-xl border border-white/5 hover:border-primary/50 transition-colors group"
                >
                    <img v-if="result.background_image" :src="result.background_image" class="w-16 h-20 object-cover rounded-lg bg-gray-800" />
                    <div v-else class="w-16 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Gamepad2 class="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div class="flex-1 min-w-0 py-1">
                        <h4 class="font-bold text-white truncate group-hover:text-primary transition-colors">{{ result.name }}</h4>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
                            <span v-if="result.released" class="flex items-center gap-1">
                                <Calendar class="w-3 h-3" /> {{ result.released.substring(0,4) }}
                            </span>
                            <span v-if="result.parent_platforms">
                                {{ result.parent_platforms.map(p => p.platform.name).join(', ') }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex items-center pr-2">
                        <Database class="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </div>

            <div v-else-if="localSearchQuery.length > 2" class="text-center p-8 text-gray-500">
                No games found for this title under the current provider.
            </div>
        </div>

        <!-- STEP 2: Fetching Details -->
        <div v-if="step === 'fetching'" class="flex flex-col items-center justify-center p-12 py-20 text-gray-400">
            <Loader2 class="w-10 h-10 text-primary animate-spin mb-4" />
            <p>Fetching deep details for comparison...</p>
        </div>

        <!-- STEP 3: Field Selection -->
        <div v-if="step === 'select' && newGameDetails" class="space-y-6">
            <p class="text-sm text-gray-300">
                Found robust data for <strong class="text-white">{{ newGameDetails.name }}</strong>. Select which current fields you want to overwrite.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- Title Selection -->
                <label class="flex gap-3 p-4 bg-gray-900 rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none" :class="{ 'ring-1 ring-primary border-primary': updateSelection.name }">
                    <div class="pt-0.5">
                        <div class="w-5 h-5 rounded border border-gray-600 flex items-center justify-center bg-gray-800" :class="{ 'bg-primary border-primary': updateSelection.name }">
                            <Check v-if="updateSelection.name" class="w-3.5 h-3.5 text-white" />
                        </div>
                        <input type="checkbox" v-model="updateSelection.name" class="hidden" />
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-white mb-1 flex items-center gap-2"><PenTool class="w-4 h-4 text-gray-400" /> Title</h4>
                        <p class="text-xs text-gray-400 line-through truncate opacity-70">{{ currentGame?.name }}</p>
                        <p class="text-xs text-primary font-bold truncate mt-1">➔ {{ newGameDetails.name }}</p>
                    </div>
                </label>

                <!-- Cover Image Selection -->
                <div class="flex flex-col gap-2 p-4 bg-gray-900 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                    <label class="flex gap-3 cursor-pointer select-none" :class="{ 'ring-1 ring-primary border-primary rounded-lg': updateSelection.cover }">
                        <div class="pt-0.5">
                            <div class="w-5 h-5 rounded border border-gray-600 flex items-center justify-center bg-gray-800" :class="{ 'bg-primary border-primary': updateSelection.cover }">
                                <Check v-if="updateSelection.cover" class="w-3.5 h-3.5 text-white" />
                            </div>
                            <input type="checkbox" v-model="updateSelection.cover" class="hidden" />
                        </div>
                        <div class="flex-1 flex flex-col gap-2">
                             <div class="flex items-center justify-between">
                                <h4 class="text-sm font-bold text-white flex items-center gap-2"><ImageIcon class="w-4 h-4 text-gray-400" /> Cover Art</h4>
                                <button 
                                    v-if="gameApiProvider === 'igdb'"
                                    @click.prevent="openGallery" 
                                    class="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold"
                                >
                                    <Search class="w-3.5 h-3.5" /> Search Gallery
                                </button>
                            </div>
                            
                            <div class="flex items-center gap-3">
                                <img v-if="currentGame?.background_image" :src="currentGame.background_image" class="w-12 h-16 object-cover rounded shadow opacity-50 grayscale" />
                                <span class="text-gray-500 font-bold">➔</span>
                                <img v-if="newGameDetails.background_image" :src="newGameDetails.background_image" class="w-12 h-16 object-cover rounded shadow-lg border border-primary/50" />
                                <div v-else class="text-xs text-gray-500 italic">No image found...</div>
                            </div>
                        </div>
                    </label>
                    
                    <!-- Image Gallery UI -->
                    <div v-if="showGallery" class="bg-gray-800/50 rounded-lg p-3 mt-2 animate-in slide-in-from-top-2 duration-200">
                        <div v-if="isFetchingImages" class="flex flex-col items-center justify-center p-6 text-gray-500">
                            <Loader2 class="w-6 h-6 animate-spin mb-2 text-primary" />
                            <span class="text-xs">Fetching high-res images...</span>
                        </div>
                        <div v-else-if="galleryImages.length > 0" class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            <img 
                                v-for="img in galleryImages" 
                                :key="img.id" 
                                :src="img.thumb" 
                                @click="selectGalleryImage(img.hires)"
                                class="w-full aspect-video object-cover rounded cursor-pointer border-2 hover:scale-105 transition-all"
                                :class="newGameDetails.background_image === img.hires ? 'border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'border-transparent opacity-70 hover:opacity-100'"
                            />
                        </div>
                        <div v-else class="text-xs text-gray-500 text-center p-4">
                            No alternate artworks or screenshots found for this game.
                        </div>
                    </div>
                </div>

                <!-- Description Selection -->
                <label class="flex gap-3 p-4 bg-gray-900 rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none" :class="{ 'ring-1 ring-primary border-primary': updateSelection.description }">
                    <div class="pt-0.5">
                        <div class="w-5 h-5 rounded border border-gray-600 flex items-center justify-center bg-gray-800" :class="{ 'bg-primary border-primary': updateSelection.description }">
                            <Check v-if="updateSelection.description" class="w-3.5 h-3.5 text-white" />
                        </div>
                        <input type="checkbox" v-model="updateSelection.description" class="hidden" />
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-white mb-1 flex items-center gap-2"><Database class="w-4 h-4 text-gray-400" /> Description</h4>
                        <p class="text-xs text-gray-500 line-clamp-3 leading-snug">{{ newGameDetails.description_raw || newGameDetails.description || 'No description provided.' }}</p>
                    </div>
                </label>

                <!-- DLC Selection -->
                <label class="flex gap-3 p-4 bg-gray-900 rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none" :class="{ 'ring-1 ring-primary border-primary': updateSelection.additions }">
                    <div class="pt-0.5">
                        <div class="w-5 h-5 rounded border border-gray-600 flex items-center justify-center bg-gray-800" :class="{ 'bg-primary border-primary': updateSelection.additions }">
                            <Check v-if="updateSelection.additions" class="w-3.5 h-3.5 text-white" />
                        </div>
                        <input type="checkbox" v-model="updateSelection.additions" class="hidden" />
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-white mb-1 flex items-center gap-2"><Layers class="w-4 h-4 text-gray-400" /> DLCs & Expansions</h4>
                        <div class="text-xs text-gray-400">
                            Found <strong class="text-primary">{{ newGameDetails.additions?.length || 0 }}</strong> additions. Note: Syncing this array will update available nested contents.
                        </div>
                    </div>
                </label>
                
                <!-- Meta data Selection -->
                <label class="flex gap-3 p-4 md:col-span-2 bg-gray-900 rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none" :class="{ 'ring-1 ring-primary border-primary': updateSelection.metadata }">
                    <div class="pt-0.5">
                        <div class="w-5 h-5 rounded border border-gray-600 flex items-center justify-center bg-gray-800" :class="{ 'bg-primary border-primary': updateSelection.metadata }">
                            <Check v-if="updateSelection.metadata" class="w-3.5 h-3.5 text-white" />
                        </div>
                        <input type="checkbox" v-model="updateSelection.metadata" class="hidden" />
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><Gamepad2 class="w-4 h-4 text-gray-400" /> Metadata (Genres, Tags, Publisher, Web)</h4>
                        <div class="flex flex-wrap gap-2">
                             <span v-for="g in newGameDetails.genres" :key="g.id" class="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 border border-white/10">{{ g.name }}</span>
                             <span v-for="p in newGameDetails.parent_platforms" :key="p.platform.id" class="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 border border-white/10">{{ p.platform.name }}</span>
                             <span v-if="newGameDetails.released" class="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 border border-white/10">{{ newGameDetails.released.substring(0,4) }}</span>
                        </div>
                    </div>
                </label>

            </div>

            <!-- Warning Footer -->
            <div class="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary/80 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                <div class="flex items-start gap-3">
                    <AlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p class="text-xs leading-snug max-w-sm">Applying updates will permanently replace the selected local fields in your Tracker with fresh data from {{ gameApiProvider.toUpperCase() }}. The Database ID will also be updated to match the new provider.</p>
                </div>
                <button 
                    @click="applyUpdates" 
                    class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg flex-shrink-0"
                >
                    <Save class="w-5 h-5" /> Sync Data
                </button>
            </div>
            
        </div>
    </div>
  </BaseModal>
</template>
