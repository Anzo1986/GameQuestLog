<script setup>
import { computed } from 'vue';
import { Trophy, Crown, PieChart } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useShop } from '../composables/useShop';
import AvatarFrame from './AvatarFrame.vue';

const emit = defineEmits(['open-stats', 'open-gamer-card']);

const { userName, userLevel, userTitle, xpProgress, userAvatar, userXP, levelStartXP, nextLevelXP } = useGames();
const { getEquippedItem } = useShop();

const equippedFrame = computed(() => getEquippedItem('frame'));
</script>

<template>
  <div class="bg-gradient-to-r from-primary/30 to-gray-900 rounded-xl p-6 shadow-xl relative overflow-hidden mb-6 border border-primary/30">
    <!-- Decorative Circle -->
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>

    <!-- Stats Button -->
    <button 
        @click="$emit('open-stats')"
        class="absolute top-4 right-4 bg-gray-900/50 hover:bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-white transition-all z-20 border border-white/5 backdrop-blur-sm"
        title="View Statistics"
    >
        <PieChart class="w-5 h-5" />
    </button>

    <div class="relative z-10 flex items-center justify-between gap-4">
        
        <!-- Left: Avatar & Level -->
        <div class="flex items-center gap-4">
            <div class="relative group cursor-pointer" @click="$emit('open-gamer-card')">
                <AvatarFrame 
                    :src="userAvatar" 
                    :frame="equippedFrame ? equippedFrame.value : 'none'" 
                    size="md" 
                    :show-placeholder="true"
                    class="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />

                <div class="absolute -bottom-2 -right-1 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-900 z-30 shadow-md">
                    Lvl {{ userLevel }}
                </div>
            </div>

            <div>
                 <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold text-white tracking-tight">{{ userName }}</h2>
                 </div>
                 <div class="flex items-center gap-1 text-sm text-yellow-400 font-medium mt-0.5">
                     <Crown class="w-3 h-3" />
                     <span>{{ userTitle }}</span>
                 </div>
            </div>
        </div>

        <!-- Right: XP Bar (Hidden on super small screens maybe, but Mobile-first so keep it responsive) -->
    </div>

    <!-- XP Bar -->
    <div class="mt-4">
        <div class="flex justify-between text-xs text-primary/80 mb-1 font-mono">
            <span>Level Progress</span>
            <div class="flex gap-2">
                <span class="text-white font-bold">{{ Math.floor(userXP - levelStartXP) }} / {{ Math.floor(nextLevelXP - levelStartXP) }} XP</span>
                <span class="text-gray-500">({{ Math.floor(xpProgress) }}%)</span>
            </div>
        </div>
        <div class="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
            <div 
                class="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative"
                :style="{ width: `${xpProgress}%` }"
            >
                <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
        </div>
    </div>

  </div>
</template>
