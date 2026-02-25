<script setup>
import { useGames } from '../composables/useGames';
import { useModals } from '../composables/useModals';
import { Gamepad2 } from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';

const props = defineProps({
    isOpen: Boolean,
    title: {
        type: String,
        default: 'Related Games'
    },
    games: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['close']);

const { openModal } = useModals();

const selectGame = (game) => {
    // Close this modal
    emit('close');
    // Open the Add Game modal pre-filled with this game's name
    setTimeout(() => {
        openModal('addGame', { initialSearch: game.name });
    }, 150);
};
</script>

<template>
  <BaseModal 
    :is-open="isOpen" 
    @close="$emit('close')" 
    :title="title"
    max-width="max-w-3xl"
  >
      <div class="p-6">
          <div v-if="games.length === 0" class="text-center text-gray-500 py-10">
              No games found.
          </div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              <div 
                  v-for="game in games" 
                  :key="game.id"
                  @click="selectGame(game)"
                  class="flex flex-col cursor-pointer group"
              >
                  <div class="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-gray-700 mb-2 bg-gray-900 group-hover:border-primary transition-colors shadow-sm group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                      <img 
                          v-if="game.cover_image || game.background_image" 
                          :src="game.cover_image || game.background_image" 
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          :alt="game.name"
                          loading="lazy"
                      />
                      <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-gray-800">
                          <Gamepad2 class="w-8 h-8 mb-1" />
                      </div>
                  </div>
                  <h4 class="text-xs font-bold text-gray-300 group-hover:text-white leading-tight line-clamp-2">
                      {{ game.name }}
                  </h4>
                  <p v-if="game.released" class="text-[10px] text-gray-500 mt-1">
                      {{ game.released.substring(0, 4) }}
                  </p>
              </div>
          </div>
      </div>
  </BaseModal>
</template>
