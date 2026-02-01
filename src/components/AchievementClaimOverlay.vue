<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Trophy, CheckCircle2, RotateCw } from 'lucide-vue-next'; // Icons
import * as LucideIcons from 'lucide-vue-next';
import confetti from 'canvas-confetti';

const props = defineProps({
  achievement: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['claim']);

// Tier styling
const tierColors = {
  bronze: 'text-amber-700 from-amber-200 to-amber-700 border-amber-500',
  silver: 'text-slate-400 from-slate-100 to-slate-500 border-slate-400',
  gold: 'text-yellow-400 from-yellow-100 to-yellow-600 border-yellow-400',
  platinum: 'text-cyan-400 from-cyan-100 to-cyan-600 border-cyan-400'
};

const tierValues = {
  bronze: 20,
  silver: 50,
  gold: 100,
  platinum: 250
};

// Icon resolution
const getIcon = (name) => {
  return LucideIcons[name] || Trophy;
};

// Animations
const animate = ref(false);

const fireConfetti = () => {
    const end = Date.now() + 1000;
    const colors = props.achievement.tier === 'platinum' ? ['#22d3ee', '#e879f9'] : ['#fbbf24', '#f59e0b'];

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: colors
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

onMounted(() => {
    setTimeout(() => animate.value = true, 100);
    fireConfetti();
    
    // Play sound? (Optional)
    // const audio = new Audio('/sfx/achievement.mp3');
    // audio.play();
});
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop with blur -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-500"></div>

    <!-- Main Card -->
    <div 
        class="relative w-full max-w-md bg-gray-900 rounded-3xl p-8 border-4 text-center overflow-hidden shadow-2xl transform transition-all duration-700"
        :class="[
            tierColors[achievement.tier].split(' ').pop(), // Border color
            animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10'
        ]"
    >
        <!-- Background Glow -->
        <div 
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-white/10 to-transparent blur-3xl rounded-full pointer-events-none"
            :class="achievement.tier === 'platinum' ? 'from-cyan-500/20' : 'from-yellow-500/20'"
        ></div>

        <!-- Icon Container -->
        <div class="relative mb-6 inline-block">
             <div 
                class="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-gradient-to-br shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-1000"
                :class="[
                    tierColors[achievement.tier].replace('text-', ''), // Gradient Colors
                    animate ? 'rotate-[360deg]' : 'rotate-0'
                ]"
             >
                <component :is="getIcon(achievement.icon)" class="w-16 h-16 text-white drop-shadow-lg" />
             </div>
             <!-- Shinies -->
             <div class="absolute -top-4 -right-4 text-4xl animate-bounce delay-100">✨</div>
             <div class="absolute -bottom-2 -left-4 text-3xl animate-bounce delay-500">✨</div>
        </div>

        <!-- Text -->
        <h2 class="text-xs font-bold uppercase tracking-[0.3em] mb-2 text-white/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Achievement Unlocked
        </h2>
        
        <h1 class="text-3xl font-black text-white mb-2 drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {{ achievement.title }}
        </h1>
        
        <p class="text-gray-400 mb-8 text-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
            {{ achievement.description }}
        </p>

        <!-- Reward -->
        <div class="flex justify-center items-center gap-4 mb-8 animate-in zoom-in duration-500 delay-1000">
             <div class="bg-gray-800/80 px-6 py-3 rounded-xl border border-gray-700 flex items-center gap-3 shadow-lg">
                <div class="bg-yellow-500 rounded-full p-1.5 shadow-inner">
                    <span class="font-bold text-yellow-900 text-xs">$</span>
                </div>
                <div class="text-left">
                    <p class="text-[10px] text-gray-400 uppercase font-bold">Reward</p>
                    <p class="text-xl font-black text-yellow-400 leading-none">+{{ tierValues[achievement.tier] }}</p>
                </div>
             </div>
        </div>

        <!-- Action Button -->
        <button 
            @click="$emit('claim')"
            class="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 animate-pulse"
            :class="achievement.tier === 'platinum' ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gradient-to-r from-yellow-500 to-orange-600'"
        >
            CLAIM REWARD
        </button>

    </div>
  </div>
</template>
