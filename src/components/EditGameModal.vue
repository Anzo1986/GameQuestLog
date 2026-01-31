<script setup>
import { ref, watch, computed } from 'vue';
import { X, Save, ImageIcon, Calendar, Gamepad2, Tag, Check } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { GENRES } from '../constants/genres';

const props = defineProps({
  isOpen: Boolean,
  game: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const { updateGame, PLATFORMS } = useGames();

const form = ref({
    name: '',
    background_image: '',
    released: '',
    platform: 'PC',
    genres: []
});

const showGenreDropdown = ref(false);

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
  }
});

const toggleGenre = (genre) => {
    if (form.value.genres.includes(genre)) {
        form.value.genres = form.value.genres.filter(g => g !== genre);
    } else {
        form.value.genres.push(genre);
    }
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
  <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-visible animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50 rounded-t-2xl">
        <h3 class="text-lg font-bold text-white">Edit Game Details</h3>
        <button @click="$emit('close')" class="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Scrollable -->
      <div class="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400">Game Title</label>
              <input 
                v-model="form.name" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600"
                placeholder="Game Title"
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <ImageIcon class="w-4 h-4" /> Cover Image URL
              </label>
              <input 
                v-model="form.background_image" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600"
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
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600"
              />
          </div>

          <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Gamepad2 class="w-4 h-4" /> Platform
              </label>
              <select 
                v-model="form.platform" 
                class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-600 appearance-none"
              >
                  <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
              </select>
          </div>

          <!-- Genres Multi-Select -->
          <div class="space-y-2 relative">
               <label class="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Tag class="w-4 h-4" /> Genres
              </label>
              
              <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 min-h-[46px] cursor-pointer hover:border-gray-600" @click="showGenreDropdown = !showGenreDropdown">
                  <div class="flex flex-wrap gap-2" v-if="form.genres.length > 0">
                      <span v-for="g in form.genres" :key="g" class="bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30 flex items-center gap-1">
                          {{ g }}
                          <button @click.stop="toggleGenre(g)" class="hover:text-white"><X class="w-3 h-3" /></button>
                      </span>
                  </div>
                  <span v-else class="text-gray-500 text-sm">Select Genres...</span>
              </div>

              <!-- Dropdown -->
              <div v-if="showGenreDropdown" class="absolute left-0 right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
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
      <div class="p-4 border-t border-gray-700 bg-gray-800/30 flex justify-end gap-3 rounded-b-2xl">
          <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Cancel
          </button>
          <button 
            @click="saveChanges" 
            class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
              <Save class="w-4 h-4" /> Save Changes
          </button>
      </div>
      
    </div>
  </div>
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
