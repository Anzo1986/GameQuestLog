<script setup>
import { Trophy } from 'lucide-vue-next';
import { useAchievements } from '../composables/useAchievements';

const { recentUnlocks } = useAchievements();
</script>

<template>
  <div class="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
        <div 
            v-for="achievement in recentUnlocks" 
            :key="achievement.id" 
            class="backdrop-blur-xl border rounded-xl p-4 shadow-2xl flex items-center gap-4 w-80 pointer-events-auto transform transition-all duration-300"
            :class="[
                achievement.tier === 'bronze' ? 'bg-orange-950/80 border-orange-700/50 shadow-orange-900/20' : '',
                achievement.tier === 'silver' ? 'bg-gray-900/90 border-gray-500/50 shadow-gray-700/20' : '',
                achievement.tier === 'gold' ? 'bg-yellow-950/80 border-yellow-500/50 shadow-yellow-900/20' : '',
                achievement.tier === 'platinum' ? 'bg-purple-950/80 border-purple-500/50 shadow-purple-900/20' : '',
                !achievement.tier ? 'bg-gray-900/95 border-gray-700' : ''
            ]"
        >
            <div 
                class="p-2 rounded-lg text-white shadow-lg shrink-0"
                :class="[
                    achievement.tier === 'bronze' ? 'bg-gradient-to-br from-orange-500 to-orange-700' : '',
                    achievement.tier === 'silver' ? 'bg-gradient-to-br from-gray-400 to-gray-600' : '',
                    achievement.tier === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : '',
                    achievement.tier === 'platinum' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : '',
                    !achievement.tier ? 'bg-gray-700' : ''
                ]"
            >
                <Trophy class="w-6 h-6 animate-pulse" />
            </div>
            <div>
                <p 
                    class="text-[10px] uppercase tracking-wider font-bold"
                    :class="[
                        achievement.tier === 'bronze' ? 'text-orange-400' : '',
                        achievement.tier === 'silver' ? 'text-gray-300' : '',
                        achievement.tier === 'gold' ? 'text-yellow-400' : '',
                        achievement.tier === 'platinum' ? 'text-purple-400' : '',
                        !achievement.tier ? 'text-gray-400' : ''
                    ]"
                >
                    {{ achievement.tier || 'Achievement' }} Unlocked
                </p>
                <h4 class="text-white font-bold leading-tight">{{ achievement.title }}</h4>
            </div>
        </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.5s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
