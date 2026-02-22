<script setup>
import { ref, watch, computed } from 'vue';
import { X, Save, ImageIcon, Calendar, Gamepad2, Tag, Check, Search, Loader2 } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { GENRES } from '../constants/genres';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  isOpen: Boolean,
  game: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const { updateGame, PLATFORMS, fetchGameImages, gameApiProvider } = useGames();

const form = ref({
    name: '',
    background_image: '',
    released: '',
    platform: 'PC',
    genres: []
});

const showGenreDropdown = ref(false);
const showGallery = ref(false);
const isFetchingImages = ref(false);
const galleryImages = ref([]);

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.game) {
    form.value = {
        name: props.game.title || props.game.name, 
        background_image: props.game.background_image || '',
        released: props.game.released || '',
        platform: props.game.platform || 'PC',
        // Map existing genres to just names for local editing, or keep as objects?
        // Let's store as simple array of names locally for easier handling
        genres: props.game.genres ? props.game.genres.map(g => g.name) : []
    };
    showGallery.value = false;
    galleryImages.value = [];
  }
});

const toggleGenre = (genre) => {
    if (form.value.genres.includes(genre)) {
        form.value.genres = form.value.genres.filter(g => g !== genre);
    } else {
        form.value.genres.push(genre);
    }
};

const openGallery = async () => {
    if (!props.game || isFetchingImages.value) return;
    
    // Toggle close if already open
    if (showGallery.value) {
        showGallery.value = false;
        return;
    }
    
    // Open and fetch if empty
    showGallery.value = true;
    if (galleryImages.value.length === 0) {
        isFetchingImages.value = true;
        galleryImages.value = await fetchGameImages(props.game.id);
        isFetchingImages.value = false;
    }
};

const selectGalleryImage = (hiresUrl) => {
    form.value.background_image = hiresUrl;
};

const saveChanges = () => {
    if (!props.game) return;
    
    // Convert simple genre names back to objects for compatibility
    const genreObjects = form.value.genres.map(name => ({
        id: Date.now() + Math.random(), // Mock ID
        name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-')
    }));

    updateGame(props.game.id, {
        name: form.value.name,
        title: form.value.name,
        background_image: form.value.background_image,
        released: form.value.released,
        platform: form.value.platform,
        genres: genreObjects
    });
    
    emit('close');
};
</script>

<template>
  <BaseModal :is-open="isOpen" @close="$emit('close')" title="Edit Game Details" max-width="max-w-md">
      <!-- Form Scrollable -->
      <div class="p-6 space-y-4">
          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400">Game Title</label>
              <input 
                v-model="form.name" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600 active:scale-[0.99]"
                placeholder="Game Title"
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center justify-between">
                  <span class="flex items-center gap-2"><ImageIcon class="w-4 h-4" /> Cover Image URL</span>
                  <button 
                    v-if="gameApiProvider === 'igdb'"
                    @click="openGallery" 
                    class="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold"
                  >
                      <Search class="w-3.5 h-3.5" /> Search Gallery
                  </button>
              </label>
              
              <!-- Image Gallery UI -->
              <div v-if="showGallery" class="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2 animate-in slide-in-from-top-2 duration-200">
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
                          :class="form.background_image === img.hires ? 'border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'border-transparent opacity-70 hover:opacity-100'"
                      />
                  </div>
                  <div v-else class="text-xs text-gray-500 text-center p-4">
                      No alternate artworks or screenshots found for this game.
                  </div>
              </div>

              <input 
                v-model="form.background_image" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600 active:scale-[0.99]"
                placeholder="https://..."
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Calendar class="w-4 h-4" /> Release Date
              </label>
              <input 
                v-model="form.released" 
                type="date"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600 active:scale-[0.99]"
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Gamepad2 class="w-4 h-4" /> Platform
              </label>
              <select 
                v-model="form.platform" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600 appearance-none active:scale-[0.99]"
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
                  <div class="flex flex-wrap gap-2" v-if="form.genres.length > 0">
                      <span v-for="g in form.genres" :key="g" class="bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30 flex items-center gap-1">
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
                        :class="form.genres.includes(genre) ? 'text-white bg-gray-700/50' : 'text-gray-300'"
                   >
                       {{ genre }}
                       <Check v-if="form.genres.includes(genre)" class="w-4 h-4 text-primary" />
                   </div>
              </div>
              <!-- Backdrop for dropdown -->
              <div v-if="showGenreDropdown" class="fixed inset-0 z-40" @click="showGenreDropdown = false"></div>
          </div>
      </div>

      <!-- Footer -->
      <template #footer>
          <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors active:scale-95">
              Cancel
          </button>
          <button 
            @click="saveChanges" 
            class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
              <Save class="w-4 h-4" /> Save Changes
          </button>
      </template>
  </BaseModal>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
