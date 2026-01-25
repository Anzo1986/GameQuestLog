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
            class="bg-gray-900/95 backdrop-blur border border-yellow-500/50 rounded-xl p-4 shadow-2xl shadow-yellow-500/10 flex items-center gap-4 w-80 pointer-events-auto transform transition-all duration-300"
        >
            <div class="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-lg text-white shadow-lg">
                <Trophy class="w-6 h-6 animate-pulse" />
            </div>
            <div>
                <p class="text-xs uppercase tracking-wider font-bold text-yellow-500">Achievement Unlocked</p>
                <h4 class="text-white font-bold leading-tight">{{ achievement.title }}</h4>
                <p class="text-xs text-gray-400 mt-0.5">{{ achievement.description }}</p>
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
