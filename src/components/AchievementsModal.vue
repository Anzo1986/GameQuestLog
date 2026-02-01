<script setup>
import { computed, ref } from 'vue';
import { useAchievements } from '../composables/useAchievements';
import { X, Trophy, Lock, Filter, Search } from 'lucide-vue-next';
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
    if (typeof data === 'string') return true; // Legacy
    return !!data.claimed;
};

// Stats
const unlockedCount = computed(() => Object.keys(unlockedAchievements.value).length);
const totalCount = achievementsList.length;
const progressPercent = computed(() => Math.round((unlockedCount.value / totalCount) * 100));

// Filter State
const filter = ref('all'); // 'all', 'unlocked', 'locked'

// Overlay State
const claimingAchievement = ref(null);

const handleItemClick = (achievement) => {
    // Only open claim overlay if unlocked AND NOT claimed
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
    // Base sort: Unclaimed -> Unlocked -> Locked -> Secret
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

const filteredAchievements = computed(() => {
    let list = sortedAchievements.value;
    if (filter.value === 'unlocked') {
        list = list.filter(a => isUnlocked(a.id));
    } else if (filter.value === 'locked') {
        list = list.filter(a => !isUnlocked(a.id));
    }
    return list;
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
    
// Tier Styling
const tierColors = {
  bronze: { border: 'border-amber-700', bg: 'bg-amber-900/10', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
  silver: { border: 'border-slate-400', bg: 'bg-slate-800', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
  gold: { border: 'border-yellow-500', bg: 'bg-yellow-900/10', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
  platinum: { border: 'border-cyan-400', bg: 'bg-cyan-900/10', text: 'text-cyan-400', glow: 'shadow-cyan-400/40' }
};

const getTierClass = (achievement) => {
    if (!isUnlocked(achievement.id)) return 'border-gray-800 bg-gray-900/30 opacity-50';
    
    const colors = tierColors[achievement.tier] || tierColors.bronze;
    const claimed = isClaimed(achievement.id);

    if (claimed) {
        // Claimed: Solid, subtle
        return `border-gray-700 bg-gray-800/60 opacity-80 hover:opacity-100 hover:border-gray-600`;
    } else {
        // Unclaimed: Glowing, pulsing, uses tier colors
        return `${colors.border} bg-gradient-to-br from-gray-800 to-gray-900 ${colors.glow} shadow-[0_0_15px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-[1.02] border`;
    }
};

const getBadgeClass = (achievement) => {
    if (!isUnlocked(achievement.id)) return 'bg-gray-800 border-gray-700 text-gray-700';
    
    const colors = tierColors[achievement.tier] || tierColors.bronze;
    const claimed = isClaimed(achievement.id);

    if (claimed) {
        return `bg-gray-800 border-gray-600 ${colors.text}`;
    } else {
        return `bg-gray-800 ${colors.border} ${colors.text} animate-pulse shadow-[0_0_10px_currentColor]`;
    }
};

// ... existing code ...
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <!-- restored max-w-4xl for wider layout -->
    <div class="relative bg-gray-900 w-full max-w-4xl rounded-2xl shadow-xl border border-gray-700 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10 space-y-4">
         <!-- ... existing header ... -->
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
                    @click="filter = 'all'"
                    class="px-4 py-1.5 text-xs font-bold rounded-md transition-all"
                    :class="filter === 'all' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'"
                >
                    All
                </button>
                <button 
                    @click="filter = 'unlocked'"
                    class="px-4 py-1.5 text-xs font-bold rounded-md transition-all"
                    :class="filter === 'unlocked' ? 'bg-green-900/50 text-green-400 shadow' : 'text-gray-400 hover:text-white'"
                >
                    Unlocked
                </button>
                <button 
                    @click="filter = 'locked'"
                    class="px-4 py-1.5 text-xs font-bold rounded-md transition-all"
                    :class="filter === 'locked' ? 'bg-red-900/50 text-red-400 shadow' : 'text-gray-400 hover:text-white'"
                >
                    Locked
                </button>
            </div>

         </div>
      </div>

      <!-- List (Grid Layout) -->
      <div class="flex-1 overflow-y-auto p-6">
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
                class="relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group"
                :class="getTierClass(achievement)"
             >
                <!-- Badge -->
                <div 
                    class="w-14 h-14 rounded-full flex items-center justify-center border-2 shrink-0 relative transition-transform group-hover:scale-110"
                    :class="getBadgeClass(achievement)"
                >
                   <component :is="getIcon(achievement.icon)" class="w-7 h-7" />
                   
                   <!-- Notification Dot for Unclaimed -->
                   <div v-if="isUnlocked(achievement.id) && !isClaimed(achievement.id)" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800 flex items-center justify-center animate-bounce">
                       <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                   </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                   <h3 class="font-bold text-sm truncate flex items-center gap-2" :class="isUnlocked(achievement.id) ? 'text-gray-100' : 'text-gray-600'">
                      {{ (achievement.secret && !isUnlocked(achievement.id)) ? '???' : achievement.title }}
                      <span v-if="achievement.secret" class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">SECRET</span>
                   </h3>
                   <p class="text-xs truncate max-w-[200px]" :class="isUnlocked(achievement.id) ? 'text-gray-400' : 'text-gray-700'">
                      {{ (achievement.secret && !isUnlocked(achievement.id)) ? 'Keep playing to reveal...' : achievement.description }}
                   </p>
                </div>
                
                <!-- ... existing right side ... -->
                <!-- Right Side: Claim Button OR Points -->
                <div class="shrink-0 flex flex-col items-end gap-1">
                    <!-- Claim Button -->
                    <div v-if="isUnlocked(achievement.id) && !isClaimed(achievement.id)">
                        <span class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                            CLAIM
                        </span>
                    </div>
                    
                    <!-- Points Badge -->
                    <div v-else class="text-xs font-mono font-bold px-2 py-1 rounded bg-gray-800/50 border border-gray-700/50" 
                         :class="isUnlocked(achievement.id) ? (`${tierColors[achievement.tier]?.text || 'text-yellow-500'} border-opacity-20`) : 'text-gray-700'">
                         {{ achievement.tier === 'platinum' ? '250' : achievement.tier === 'gold' ? '100' : achievement.tier === 'silver' ? '50' : '20' }} PTS
                    </div>
                </div>

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

