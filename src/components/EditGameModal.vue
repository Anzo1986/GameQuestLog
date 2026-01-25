<script setup>
import { ref, watch } from 'vue';
import { X, Save, ImageIcon, Calendar } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const props = defineProps({
  isOpen: Boolean,
  game: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const { updateGame } = useGames();

const form = ref({
    name: '',
    background_image: '',
    released: ''
});

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.game) {
    form.value = {
        name: props.game.title || props.game.name, // Handle inconsistent naming in object if any
        background_image: props.game.background_image || '',
        released: props.game.released || ''
    };
  }
});

const saveChanges = () => {
    if (!props.game) return;
    
    updateGame(props.game.id, {
        name: form.value.name,
        title: form.value.name, // Ensure consistency
        background_image: form.value.background_image,
        released: form.value.released
    });
    
    emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
        <h3 class="text-lg font-bold text-white">Edit Game Details</h3>
        <button @click="$emit('close')" class="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-4">
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
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-700 bg-gray-800/30 flex justify-end gap-3">
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
