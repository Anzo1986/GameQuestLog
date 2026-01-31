<script setup>
import { onMounted, ref } from 'vue';
import { Trophy, Star, X } from 'lucide-vue-next';

const props = defineProps({
  game: {
    type: Object,
    required: true
  },
  xpGained: {
      type: Number,
      default: 0
  }
});

const emit = defineEmits(['close']);

const showContent = ref(false);

onMounted(() => {
    // Show content slightly after the slash
    setTimeout(() => {
        showContent.value = true;
    }, 400);
});

</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-hidden" @click="$emit('close')">
    
    <!-- Cyber Slash Effects (The Beams) -->
    <!-- Center-Anchor Method: All beams originate from absolute center of screen -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        
        <!-- Slash 1 (Green): Top-Left to Bottom-Right (\) -->
        <!-- Rotated 45deg. Animates from Left (-100%) to Right (100%) along its axis. -->
        <div class="absolute w-[200vmax] h-[40px] bg-gradient-to-r from-transparent via-green-400 to-transparent blur-md mix-blend-screen animate-slash-1"></div>
        <div class="absolute w-[200vmax] h-[10px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-slash-1"></div>

        <!-- Slash 2 (Yellow): Top-Right to Bottom-Left (/) -->
        <!-- Rotated -45deg. Animates from Right (100%) to Left (-100%) along its axis to oppose the first slash. -->
        <div class="absolute w-[200vmax] h-[40px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent blur-md mix-blend-screen animate-slash-2"></div>
        <div class="absolute w-[200vmax] h-[10px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-slash-2"></div>

        <!-- Impact Flash -->
        <div class="absolute inset-0 bg-white mix-blend-overlay animate-flash"></div>
    </div>
    
    <div class="relative flex flex-col items-center max-w-lg w-full text-center pointer-events-none select-none transition-opacity duration-500 animate-shake" :class="showContent ? 'opacity-100' : 'opacity-0'">
        
        <!-- Rotating Rays Background -->
        <div class="absolute inset-0 flex items-center justify-center opacity-30 animate-spin-slow">
             <div class="w-[800px] h-[800px] bg-gradient-to-r from-green-500/20 to-transparent blur-3xl rounded-full"></div>
        </div>

        <!-- Trophy Icon (Bouncing) -->
        <div class="mb-8 relative z-10 animate-bounce-slow">
            <div class="absolute inset-0 bg-yellow-500 blur-2xl opacity-40 animate-pulse"></div>
            <Trophy class="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
        </div>

        <!-- Stamped Text -->
        <h2 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 drop-shadow-[0_4px_0_rgba(255,255,255,0.2)] mb-2 animate-stamp">
            VICTORY
        </h2>
        
        <p class="text-green-400 font-bold tracking-[0.5em] uppercase text-sm mb-8 animate-slide-up animation-delay-300">
            Mission Accomplished
        </p>

        <!-- Game Card (Floating) -->
        <div class="bg-gray-800 p-4 rounded-xl border-2 border-green-500/50 shadow-2xl flex items-center gap-4 animate-slide-up animation-delay-500 max-w-md w-full mx-auto backdrop-blur-sm relative z-10">
            <img :src="game.background_image" class="w-20 h-20 object-cover rounded-lg shadow-md border border-gray-700" />
            <div class="text-left flex-1 min-w-0">
                <h3 class="text-xl font-bold text-white truncate">{{ game.title }}</h3>
                <div class="flex items-center gap-1 text-yellow-400 text-sm mt-1">
                    <Star class="w-4 h-4 fill-yellow-400" />
                    <span>Rating: {{ game.rating || '-' }}/5</span>
                </div>
                <div class="text-green-400 text-xs font-bold mt-2 uppercase tracking-wide">
                    +{{ xpGained }} XP Gained
                </div>
            </div>
        </div>

        <div class="absolute bottom-[-80px] text-gray-500 animate-pulse text-sm">
            Click to continue
        </div>

    </div>
  </div>
</template>

<style scoped>
/* Slash 1: Top-Left to Bottom-Right (\) - Moves Left -> Right */
.animate-slash-1 {
    animation: slash1 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes slash1 {
    0% { transform: rotate(45deg) translateX(-100%); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: rotate(45deg) translateX(100%); opacity: 0; }
}

/* Slash 2: Top-Right to Bottom-Left (/) - Moves Right -> Left (Opposing) */
.animate-slash-2 {
    animation: slash2 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes slash2 {
    0% { transform: rotate(-45deg) translateX(100%); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: rotate(-45deg) translateX(-100%); opacity: 0; }
}

.animate-flash {
    animation: flash 0.6s ease-out forwards;
    opacity: 0;
    animation-delay: 0.5s; /* Hit exactly when beams cross center */
}

@keyframes flash {
    0% { opacity: 0; }
    50% { opacity: 0.8; }
    100% { opacity: 0; }
}

.animate-shake {
    animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
    animation-delay: 0.5s;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

.animate-spin-slow {
    animation: spin 10s linear infinite;
}


@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animate-stamp {
    animation: stamp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    opacity: 0;
    transform: scale(3);
}

@keyframes stamp {
    0% { opacity: 0; transform: scale(3) rotate(-5deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

.animate-bounce-slow {
    animation: bounce 3s ease-in-out infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.animate-slide-up {
    animation: slideUp 0.6s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
}

@keyframes slideUp {
    to { opacity: 1; transform: translateY(0); }
}

.animation-delay-300 { animation-delay: 0.3s; }
.animation-delay-500 { animation-delay: 0.5s; }
</style>
