<script setup>
import { computed, ref } from 'vue';
import { useAchievements } from '../composables/useAchievements';
import { X, Trophy, Lock, LockOpen, Gamepad2, Layers, Library, Crown, Ban, Shuffle, Target, Server, Map, Star, ThumbsDown, Dices, Sparkles, Palette, Hourglass, Zap, Plus, Clock, CheckCircle2, Timer, Calendar, Filter } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean
});

defineEmits(['close']);

const { achievementsList, unlockedAchievements } = useAchievements();

// Map icons
const icons = {
  Plus, Trophy, Crown, Ban, Layers, Library, Shuffle, Focus: Target, Gamepad2, Server, Map, Star, ThumbsDown, Dices, Sparkles, Palette, Hourglass, Zap, Lock, Unlock: LockOpen, Clock, CheckCircle2, Timer, Calendar
};

const tierRewards = {
    bronze: 20,
    silver: 50,
    gold: 100,
    platinum: 250
};

// Filter State
const currentFilter = ref('all'); // 'all', 'unlocked', 'locked'

const setFilter = (filter) => {
    currentFilter.value = filter;
};

// Sort: Unlocked first, then Locked.
const sortedAchievements = computed(() => {
    let list = [...achievementsList];
    
    // Filter
    if (currentFilter.value === 'unlocked') {
        list = list.filter(a => unlockedAchievements.value[a.id]);
    } else if (currentFilter.value === 'locked') {
        list = list.filter(a => !unlockedAchievements.value[a.id]);
    }

    // Sort
    return list.sort((a, b) => {
        const aUnlocked = !!unlockedAchievements.value[a.id];
        const bUnlocked = !!unlockedAchievements.value[b.id];
        
        // Custom Sort: Tiers (Platinum -> Gold -> Silver -> Bronze)
        const tierWeight = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
        const aWeight = tierWeight[a.tier] || 0;
        const bWeight = tierWeight[b.tier] || 0;

        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        
        if (aUnlocked && bUnlocked) {
            // Both unlocked: Higher tier first
            if (aWeight !== bWeight) return bWeight - aWeight;
        }

        return 0; 
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

// Tilt Logic
const handleMouseMove = (e, id) => {
    const card = e.currentTarget;
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
    const rotateY = ((x - centerX) / centerX) * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
};

const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    if (card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-4xl h-[85vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
      
      <!-- Header -->
      <div class="p-6 pb-2 border-b border-gray-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
          <!-- Header Block -->
          <div class="flex items-center gap-4">
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-600 uppercase tracking-widest drop-shadow-sm">
                Achievements
            </h2>
          </div>

          <!-- Controls Block (Filters + Counter) -->
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
             
              <!-- Filters -->
              <div class="relative z-10 flex bg-gray-800/80 rounded-lg p-1 gap-1">
                  <button @click="setFilter('all')" :class="['px-3 py-1.5 rounded text-xs font-bold transition-all', currentFilter === 'all' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white']">All</button>
                  <button @click="setFilter('unlocked')" :class="['px-3 py-1.5 rounded text-xs font-bold transition-all', currentFilter === 'unlocked' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white']">
                      <span class="md:hidden">Unlock</span><span class="hidden md:inline">Unlocked</span>
                  </button>
                  <button @click="setFilter('locked')" :class="['px-3 py-1.5 rounded text-xs font-bold transition-all', currentFilter === 'locked' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white']">Locked</button>
              </div>

              <!-- Counter -->
             <p class="text-gray-400 text-xs font-bold whitespace-nowrap">
                <span class="text-white">{{ unlockCount }}</span> / {{ totalCount }} <span class="hidden sm:inline">Unlocked</span> ({{ completionPercentage }}%)
             </p>
          </div>

          <button @click="$emit('close')" class="absolute top-4 right-4 md:static p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10">
              <X class="w-6 h-6" />
          </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto p-6 flex-1 custom-scrollbar perspective-container">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="(achievement, index) in sortedAchievements" 
                :key="achievement.id"
                class="relative p-4 rounded-2xl border transition-colors duration-300 group overflow-hidden will-change-transform transform-gpu animate-enter"
                :style="{ animationDelay: `${index * 50}ms` }"
                @mousemove="handleMouseMove($event, achievement.id)"
                @mouseleave="handleMouseLeave"
                :class="[
                   unlockedAchievements[achievement.id] 
                    ? 'bg-gray-800/80' // Unlocked Base
                    : 'bg-gray-900/50 border-gray-800 opacity-70', // Locked Base (Removed grayscale to see colors better)
                   
                   // Tier Borders (Unlocked)
                   unlockedAchievements[achievement.id] && achievement.tier === 'bronze' ? 'border-orange-700/50 shadow-[0_0_10px_rgba(194,65,12,0.1)]' : '',
                   unlockedAchievements[achievement.id] && achievement.tier === 'silver' ? 'border-gray-400/50 shadow-[0_0_15px_rgba(156,163,175,0.1)]' : '',
                   unlockedAchievements[achievement.id] && achievement.tier === 'gold' ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/20' : '',
                   unlockedAchievements[achievement.id] && achievement.tier === 'platinum' ? 'border-purple-400/50 shadow-[0_0_25px_rgba(192,132,252,0.2)] ring-1 ring-purple-400/30' : ''
                ]"
              >
                <!-- Glow Effect for Unlocked -->
                <div v-if="unlockedAchievements[achievement.id] && (achievement.tier === 'gold' || achievement.tier === 'platinum')" class="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shine pointer-events-none"></div>

                <div class="relative flex items-start gap-4 pointer-events-none">
                    <!-- Icon -->
                    <div 
                        class="p-3 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                        :class="[
                             unlockedAchievements[achievement.id] && achievement.tier === 'bronze' ? 'bg-gradient-to-br from-orange-800 to-orange-900 text-orange-200' : '',
                             unlockedAchievements[achievement.id] && achievement.tier === 'silver' ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-100' : '',
                             unlockedAchievements[achievement.id] && achievement.tier === 'gold' ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-yellow-100' : '',
                             unlockedAchievements[achievement.id] && achievement.tier === 'platinum' ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-purple-100' : '',
                             !unlockedAchievements[achievement.id] ? 'bg-gray-800 text-gray-600' : ''
                        ]"
                    >
                        <component :is="icons[achievement.icon] || Trophy" class="w-6 h-6" v-if="!achievement.secret || unlockedAchievements[achievement.id]" />
                         <component :is="icons['Lock']" class="w-6 h-6" v-else />
                    </div>

                    <!-- Text -->
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <h3 
                                class="font-bold truncate"
                                :class="[
                                    unlockedAchievements[achievement.id] && achievement.tier === 'bronze' ? 'text-orange-400' : '',
                                    unlockedAchievements[achievement.id] && achievement.tier === 'silver' ? 'text-gray-300' : '',
                                    unlockedAchievements[achievement.id] && achievement.tier === 'gold' ? 'text-yellow-400' : '',
                                    unlockedAchievements[achievement.id] && achievement.tier === 'platinum' ? 'text-purple-400' : '',
                                    !unlockedAchievements[achievement.id] ? 'text-gray-500' : ''
                                ]"
                            >
                                {{ (achievement.secret && !unlockedAchievements[achievement.id]) ? 'Secret Achievement' : achievement.title }}
                            </h3>
                            
                            <!-- Date (Unlocked Only) -->
                            <span v-if="unlockedAchievements[achievement.id]" class="text-[9px] font-mono border border-white/10 px-1.5 py-0.5 rounded text-white/50 bg-black/20">
                                {{ getUnlockDate(achievement.id) }}
                            </span>
                        </div>
                        
                        <p class="text-xs leading-snug" :class="unlockedAchievements[achievement.id] ? 'text-gray-400' : 'text-gray-600'">
                             {{ (achievement.secret && !unlockedAchievements[achievement.id]) ? 'This achievement is hidden until unlocked.' : achievement.description }}
                        </p>

                        <!-- Tier Badge & Reward (Always Visible) -->
                         <div class="mt-2 flex items-center gap-2">
                            <span class="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border border-white/5 bg-black/20"
                                :class="[
                                    achievement.tier === 'bronze' ? 'text-orange-500' : '',
                                    achievement.tier === 'silver' ? 'text-gray-400' : '',
                                    achievement.tier === 'gold' ? 'text-yellow-500' : '',
                                    achievement.tier === 'platinum' ? 'text-purple-400' : '',
                                    !unlockedAchievements[achievement.id] ? 'opacity-50 grayscale' : ''
                                ]"
                            >
                                {{ achievement.tier }}
                            </span>
                            
                            <!-- Coin Reward -->
                            <div class="flex items-center gap-1 text-[10px] font-bold"
                                :class="unlockedAchievements[achievement.id] ? 'text-yellow-500' : 'text-yellow-500/50'"
                            >
                                <span class="px-1.5 py-0.5 rounded border flex items-center gap-1"
                                    :class="unlockedAchievements[achievement.id] ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gray-800 border-gray-700 grayscale'"
                                >
                                    +{{ tierRewards[achievement.tier] }} 🪙
                                </span>
                            </div>
                         </div>
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

@keyframes shine {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(200%) skewX(-12deg); }
}

.animate-shine {
  animation: shine 3s infinite linear;
}

@keyframes enter {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-enter {
    animation: enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
</style>
