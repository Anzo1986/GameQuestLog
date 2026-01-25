<script setup>
import { computed } from 'vue';
import { useAchievements } from '../composables/useAchievements';
import { X, Trophy, Lock, LockOpen, Gamepad2, Layers, Library, Crown, Ban, Shuffle, Target, Server, Map, Star, ThumbsDown, Dices, Sparkles, Palette, Hourglass, Zap, Plus } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean
});

defineEmits(['close']);

const { achievementsList, unlockedAchievements } = useAchievements();

// Map icons
const icons = {
  Plus, Trophy, Crown, Ban, Layers, Library, Shuffle, Focus: Target, Gamepad2, Server, Map, Star, ThumbsDown, Dices, Sparkles, Palette, Hourglass, Zap, Lock, Unlock: LockOpen
};

// Sort: Unlocked first, then Locked.
const sortedAchievements = computed(() => {
    return [...achievementsList].sort((a, b) => {
        const aUnlocked = !!unlockedAchievements.value[a.id];
        const bUnlocked = !!unlockedAchievements.value[b.id];
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0; // Maintain custom order within groups
    });
});

const getUnlockDate = (id) => {
    const dateStr = unlockedAchievements.value[id];
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
};

const unlockCount = computed(() => Object.keys(unlockedAchievements.value).length);
const totalCount = achievementsList.length;
const completionPercentage = computed(() => Math.round((unlockCount.value / totalCount) * 100));
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-4xl h-[85vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur z-20 sticky top-0 relative overflow-hidden">
           <!-- Progress Background -->
          <div class="absolute inset-0 bg-primary/10 transition-all duration-1000" :style="{ width: completionPercentage + '%' }"></div>
          
          <div class="relative z-10">
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 uppercase tracking-widest flex items-center gap-2">
                <Trophy class="w-8 h-8 text-primary" />
                Achievements
            </h2>
            <p class="text-gray-400 text-sm mt-1 flex items-center gap-2">
                <span class="font-bold text-white">{{ unlockCount }}</span> / {{ totalCount }} Unlocked ({{ completionPercentage }}%)
            </p>
          </div>
          <button @click="$emit('close')" class="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10">
              <X class="w-6 h-6" />
          </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="achievement in sortedAchievements" 
                :key="achievement.id"
                class="relative p-4 rounded-2xl border transition-all duration-300 group overflow-hidden"
                :class="unlockedAchievements[achievement.id] 
                    ? 'bg-gray-800/60 border-primary/30 hover:border-primary/50 hover:bg-gray-800' 
                    : 'bg-gray-900 border-gray-800 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'"
              >
                <!-- Glow Effect for Unlocked -->
                <div v-if="unlockedAchievements[achievement.id]" class="absolute -inset-1 bg-primary/10 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div class="relative flex items-start gap-4">
                    <!-- Icon -->
                    <div 
                        class="p-3 rounded-xl flex items-center justify-center shrink-0"
                        :class="unlockedAchievements[achievement.id] ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/20' : 'bg-gray-800 text-gray-500'"
                    >
                        <component :is="icons[achievement.icon] || Trophy" class="w-6 h-6" />
                    </div>

                    <!-- Text -->
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <h3 
                                class="font-bold truncate"
                                :class="unlockedAchievements[achievement.id] ? 'text-white' : 'text-gray-400'"
                            >
                                {{ achievement.title }}
                            </h3>
                            <Lock v-if="!unlockedAchievements[achievement.id]" class="w-4 h-4 text-gray-600" />
                            <span v-else class="text-[10px] text-primary/80 font-mono border border-primary/20 px-1 rounded bg-primary/10">
                                {{ getUnlockDate(achievement.id) }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-400 leading-snug">{{ achievement.description }}</p>
                    </div>
                </div>
              </div>
          </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
</style>
