<script setup>
import { computed, ref } from 'vue';
import { useAchievements } from '../composables/useAchievements';
import { X, Trophy, Lock } from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';
import AchievementClaimOverlay from './AchievementClaimOverlay.vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { achievementsList, unlockedAchievements, totalQuestScore, claim } = useAchievements();

const getIcon = (name) => {
  return LucideIcons[name] || Trophy;
};

// Check if unlocked (raw check)
const isUnlocked = (id) => !!unlockedAchievements.value[id];

// Check if claimed
const isClaimed = (id) => {
    const data = unlockedAchievements.value[id];
    if (!data) return false;
    // Handle both legacy (string) and new (object) format safe-guard
    if (typeof data === 'string') return true; // Legacy are auto-claimed
    return !!data.claimed;
};

// Overlay State
const claimingAchievement = ref(null);

const handleItemClick = (achievement) => {
    if (isUnlocked(achievement.id) && !isClaimed(achievement.id)) {
        claimingAchievement.value = achievement;
    }
};

const finalClaim = () => {
    if (claimingAchievement.value) {
        claim(claimingAchievement.value.id);
        claimingAchievement.value = null;
    }
};

const sortedAchievements = computed(() => {
    return [...achievementsList].sort((a, b) => {
        const aUnlocked = isUnlocked(a.id);
        const bUnlocked = isUnlocked(b.id);
        const aClaimed = isClaimed(a.id);
        const bClaimed = isClaimed(b.id);

        // 1. Unlocked but Unclaimed (Pulse) First
        if (aUnlocked && !aClaimed && (!bUnlocked || bClaimed)) return -1;
        if (bUnlocked && !bClaimed && (!aUnlocked || aClaimed)) return 1;

        // 2. Unlocked First
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;

        // 3. Secret ID check (Always last)
        if (a.secret && !aUnlocked && (!b.secret || bUnlocked)) return 1;
        if (b.secret && !bUnlocked && (!a.secret || aUnlocked)) return -1;

        return 0; 
    });
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <div class="relative bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl border border-gray-700 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 sticky top-0 z-10">
         <div>
             <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <Trophy class="w-5 h-5 text-yellow-500" />
                Achievements
             </h2>
             <p class="text-xs text-gray-400 mt-1">
                Score: <span class="text-yellow-400 font-bold">{{ totalQuestScore }}</span> Points
             </p>
         </div>
         <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
            <X class="w-6 h-6" />
         </button>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
         <div 
            v-for="achievement in sortedAchievements" 
            :key="achievement.id"
            @click="handleItemClick(achievement)"
            class="relative flex items-center gap-4 p-4 rounded-xl border border-gray-800 transition-all"
            :class="[
                isUnlocked(achievement.id) 
                    ? (isClaimed(achievement.id) ? 'bg-gray-800/50 opacity-80' : 'bg-gradient-to-r from-gray-800 to-gray-700 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer hover:scale-[1.02]') 
                    : 'bg-gray-900/50 opacity-50'
            ]"
         >
            <!-- Badge -->
            <div 
                class="w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 relative"
                :class="[
                   isUnlocked(achievement.id) 
                     ? (isClaimed(achievement.id) ? 'bg-gray-700 border-gray-500 text-gray-300' : 'bg-yellow-500/20 border-yellow-500 text-yellow-500 animate-pulse') 
                     : 'bg-gray-800 border-gray-700 text-gray-600'
                ]"
            >
               <component :is="getIcon(achievement.icon)" class="w-6 h-6" />
               <div v-if="isUnlocked(achievement.id) && !isClaimed(achievement.id)" class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
               <h3 class="font-bold text-sm truncate" :class="isUnlocked(achievement.id) ? 'text-white' : 'text-gray-500'">
                  {{ (achievement.secret && !isUnlocked(achievement.id)) ? '???' : achievement.title }}
               </h3>
               <p class="text-xs truncate" :class="isUnlocked(achievement.id) ? 'text-gray-400' : 'text-gray-600'">
                  {{ (achievement.secret && !isUnlocked(achievement.id)) ? 'Hidden Achievement' : achievement.description }}
               </p>
            </div>

            <!-- Claim Button (Visual Hint) -->
            <div v-if="isUnlocked(achievement.id) && !isClaimed(achievement.id)" class="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow animate-bounce">
                CLAIM
            </div>
            
            <!-- Points -->
             <div v-else class="text-xs font-mono font-bold" :class="isUnlocked(achievement.id) ? 'text-yellow-500' : 'text-gray-700'">
                 {{ achievement.tier === 'platinum' ? '250' : achievement.tier === 'gold' ? '100' : achievement.tier === 'silver' ? '50' : '20' }}
             </div>

         </div>
      </div>
      
    </div>

    <!-- Claim Overlay -->
    <AchievementClaimOverlay 
        v-if="claimingAchievement" 
        :achievement="claimingAchievement" 
        @claim="finalClaim" 
    />

  </div>
</template>
