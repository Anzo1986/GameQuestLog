<script setup>
import { computed, ref } from 'vue';
import { useAchievements } from '../composables/useAchievements';
import { X, Trophy, Lock, Filter, Coins } from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';
import { useShop } from '../composables/useShop';
import { useCardStyles } from '../composables/useCardStyles';
import AchievementClaimOverlay from './AchievementClaimOverlay.vue';
import GameCardInnerEffects from './GameCardInnerEffects.vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { achievementsList, unlockedAchievements, totalQuestScore, claim } = useAchievements();
const { getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();

const equippedStyle = computed(() => getEquippedItem('card_style'));

const getIcon = (name) => {
  return LucideIcons[name] || Trophy;
};

// Check if unlocked (raw check)
const isUnlocked = (id) => !!unlockedAchievements.value[id];

// Check if claimed
const isClaimed = (id) => {
    const data = unlockedAchievements.value[id];
    if (!data) return false;
    if (typeof data === 'string') return true; // Legacy
    return !!data.claimed;
};

// Get Unlocked Date
const getUnlockDate = (id) => {
    const data = unlockedAchievements.value[id];
    if (!data) return '';
    const dateStr = typeof data === 'string' ? data : data.unlockedAt;
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
};

// Tier Styling
const tierColors = {
  bronze: { 
      border: 'border-amber-600', 
      bg: 'from-amber-900/40 to-gray-900', 
      text: 'text-amber-500', 
      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/50',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]', // High glow
      ring: 'ring-amber-500'
  },
  silver: { 
      border: 'border-slate-300', 
      bg: 'from-slate-700/50 to-gray-900', 
      text: 'text-slate-200', 
      badge: 'bg-slate-500/10 text-slate-300 border-slate-400/50',
      glow: 'shadow-[0_0_30px_rgba(203,213,225,0.4)]',
      ring: 'ring-slate-300'
  },
  gold: { 
      border: 'border-yellow-400', 
      bg: 'from-yellow-800/40 to-gray-900', 
      text: 'text-yellow-400', 
      badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
      glow: 'shadow-[0_0_30px_rgba(250,204,21,0.5)]',
      ring: 'ring-yellow-400'
  },
  platinum: { 
      border: 'border-cyan-400', 
      bg: 'from-cyan-900/40 to-gray-900', 
      text: 'text-cyan-400', 
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-400/50',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.5)]',
      ring: 'ring-cyan-400'
  }
};

const getTierClass = (achievement) => {
    if (!isUnlocked(achievement.id)) return 'border-gray-800 bg-gray-900/40 opacity-50';
    
    const colors = tierColors[achievement.tier] || tierColors.bronze;
    const claimed = isClaimed(achievement.id);

    // Unlocked Style
    const base = `border-2 bg-gradient-to-br ${colors.bg} ${colors.border}`;
    
    if (claimed) {
        return `${base} opacity-90`; 
    } else {
        // UNCLAIMED: Strong Glow + Ring + Pulse
        return `${base} ${colors.glow} ring-2 ring-offset-2 ring-offset-gray-900 ${colors.ring} cursor-pointer hover:scale-[1.02] transition-transform animate-pulse`;
    }
};

const getRewardValue = (tier) => {
    const values = { bronze: 20, silver: 50, gold: 100, platinum: 250 };
    return values[tier] || 0;
};

// Stats
const unlockedCount = computed(() => Object.keys(unlockedAchievements.value).length);
const totalCount = achievementsList.length;
const progressPercent = computed(() => Math.round((unlockedCount.value / totalCount) * 100));

// Filter State
const filter = ref('all');

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

        if (aUnlocked && !aClaimed && (!bUnlocked || bClaimed)) return -1;
        if (bUnlocked && !bClaimed && (!aUnlocked || aClaimed)) return 1;
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        if (a.secret && !aUnlocked && (!b.secret || bUnlocked)) return 1;
        if (b.secret && !bUnlocked && (!a.secret || aUnlocked)) return -1;

        return 0; 
    });
});

const filteredAchievements = computed(() => {
    let list = sortedAchievements.value;
    if (filter.value === 'unlocked') {
        list = list.filter(a => isUnlocked(a.id));
    } else if (filter.value === 'locked') {
        list = list.filter(a => !isUnlocked(a.id));
    }
    return list;
});

// Swipe Navigation
import { useSwipe } from '../composables/useSwipe';
const modalContainer = ref(null);
const tabs = ['all', 'unlocked', 'locked'];

const nextTab = () => {
    const currentIndex = tabs.indexOf(filter.value);
    if (currentIndex < tabs.length - 1) {
        filter.value = tabs[currentIndex + 1];
    }
};

const prevTab = () => {
    const currentIndex = tabs.indexOf(filter.value);
    if (currentIndex > 0) {
        filter.value = tabs[currentIndex - 1];
    }
};

useSwipe(modalContainer, {
    onSwipeLeft: nextTab,
    onSwipeRight: prevTab,
    minSwipeDistance: 50,
    maxSlope: 0.5 // Matching App.vue tolerance
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <div ref="modalContainer" 
         class="relative w-full max-w-4xl rounded-2xl shadow-xl border border-gray-700 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 touch-pan-y isolation-auto"
         :class="getCardClasses(equippedStyle?.value)"
    >
      
      <!-- PRISM BORDER ANIMATION (Behind) -->
      <div v-if="equippedStyle?.value === 'prism'" class="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0 animate-spin-slow opacity-80 blur-sm pointer-events-none"></div>
      <div v-if="equippedStyle?.value === 'prism'" class="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0 animate-spin-slow pointer-events-none"></div>

      <!-- Inner Effects -->
      <GameCardInnerEffects :style-name="equippedStyle?.value" />
      
      <!-- Content Wrapper (z-10 to stay above effects) -->
      <div class="relative z-10 w-full h-full flex flex-col bg-gray-900/0"> <!-- Transparent bg to let effects show -->

      <!-- Header -->
      <div class="p-6 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10 space-y-4">
         
      <!-- Top Row: Title & Close -->
          <div class="flex justify-between items-start">
             <div>
                 <h2 class="text-2xl font-black text-white flex items-center gap-3">
                    <Trophy class="w-8 h-8 text-yellow-500" />
                    Achievements
                 </h2>
                 <p class="text-sm text-gray-400 mt-1">
                    Track your journey and claim rewards!
                 </p>
             </div>
             <div class="flex items-center gap-4">
                 <div class="text-right">
                     <p class="text-xs text-gray-400 uppercase font-bold">Total Score</p>
                     <p class="text-2xl font-black text-yellow-400">{{ totalQuestScore }}</p>
                 </div>
                 <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors">
                    <X class="w-6 h-6" />
                 </button>
             </div>
         </div>

         <!-- Controls Row: Progress & Filters -->
         <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            <!-- Progress Bar -->
            <div class="w-full md:w-64 space-y-1">
                <div class="flex justify-between text-xs font-bold text-gray-400">
                    <span>Progress</span>
                    <span>{{ unlockedCount }} / {{ totalCount }} ({{ progressPercent }}%)</span>
                </div>
                <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000"
                        :style="{ width: `${progressPercent}%` }"
                    ></div>
                </div>
            </div>

            <!-- Filter Buttons -->
            <div class="flex bg-gray-800 p-1 rounded-lg">
                <button 
                    v-for="f in ['all', 'unlocked', 'locked']"
                    :key="f"
                    @click="filter = f"
                    class="px-4 py-1.5 text-xs font-bold rounded-md transition-all capitalize"
                    :class="filter === f ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'"
                >
                    {{ f }}
                </button>
            </div>

         </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto p-6 relative z-10">
         <!-- Empty State -->
         <div v-if="filteredAchievements.length === 0" class="text-center py-12 text-gray-500">
             <Filter class="w-12 h-12 mx-auto mb-3 opacity-20" />
             <p>No achievements found in this category.</p>
         </div>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div 
                v-for="achievement in filteredAchievements" 
                :key="achievement.id"
                @click="handleItemClick(achievement)"
                class="relative p-5 rounded-2xl flex items-start gap-4 overflow-hidden transition-all duration-300 group"
                :class="getTierClass(achievement)"
             >
                <!-- Badge (Icon) -->
                <div 
                    class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    :class="isUnlocked(achievement.id) 
                        ? (tierColors[achievement.tier]?.text || 'text-yellow-500') + ' bg-black/20 backdrop-blur-sm'
                        : 'bg-gray-800 text-gray-600'"
                >
                   <component :is="getIcon(achievement.icon)" class="w-8 h-8" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 flex flex-col h-full justify-between gap-2">
                   
                   <!-- Top: Title & Date -->
                   <div class="flex justify-between items-start w-full">
                       <h3 class="font-black text-base leading-tight truncate pr-2" 
                           :class="isUnlocked(achievement.id) ? (tierColors[achievement.tier]?.text || 'text-white') : 'text-gray-500'">
                          {{ (achievement.secret && !isUnlocked(achievement.id)) ? '???' : achievement.title }}
                       </h3>
                       <span v-if="isUnlocked(achievement.id)" class="text-[10px] text-gray-400 font-mono tracking-tighter opacity-70">
                           {{ getUnlockDate(achievement.id) }}
                       </span>
                   </div>

                   <!-- Description -->
                   <p class="text-xs text-gray-400 line-clamp-2">
                      {{ (achievement.secret && !isUnlocked(achievement.id)) ? 'Keep playing to reveal...' : achievement.description }}
                   </p>

                   <!-- Bottom: Tags & Reward -->
                   <div class="flex items-center gap-2 mt-1">
                       
                       <!-- Tier Label -->
                       <div 
                           class="text-[10px] font-black uppercase px-2 py-0.5 rounded border"
                           :class="isUnlocked(achievement.id) 
                                ? (tierColors[achievement.tier]?.badge || 'bg-gray-800 text-gray-400 border-gray-700') 
                                : 'bg-gray-800 text-gray-600 border-gray-800'"
                       >
                           {{ achievement.tier }}
                       </div>

                       <!-- Reward Logic -->
                       <div v-if="isUnlocked(achievement.id) && !isClaimed(achievement.id)" class="ml-auto">
                            <!-- Stronger Pulse Button -->
                            <button class="bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse hover:scale-110 hover:rotate-2 transition-all">
                                <span>CLAIM</span>
                                <Coins class="w-3 h-3" />
                            </button>
                       </div>
                       
                       <div v-else class="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 border border-white/5" 
                            :class="isUnlocked(achievement.id) ? 'text-yellow-400' : 'text-gray-600'">
                           <span class="font-bold text-xs">+{{ getRewardValue(achievement.tier) }}</span>
                           <Coins class="w-3 h-3" />
                       </div>

                   </div>
                </div>

                <!-- REMOVED RED DOT -->

             </div>
         </div>
      </div>
      
      </div> <!-- End Content Wrapper -->
    </div>

    <!-- Claim Overlay -->
    <AchievementClaimOverlay 
        v-if="claimingAchievement" 
        :achievement="claimingAchievement" 
        @claim="finalClaim" 
    />

  </div>
</template>
