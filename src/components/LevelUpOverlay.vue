<script setup>
import { onMounted, ref } from 'vue';

const props = defineProps({
  level: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);

const showContent = ref(false);

onMounted(() => {
  // Trigger animations after mount
  setTimeout(() => {
    showContent.value = true;
  }, 100);
});

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" @click="handleClose">
    
    <div class="relative flex flex-col items-center pointer-events-none select-none">
      
      <!-- Glitch Text "LEVEL UP" -->
      <h2 class="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 glitch-text mb-4" data-text="LEVEL UP">
        LEVEL UP
      </h2>

      <!-- Level Number Slam -->
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-blue-500 blur-3xl opacity-50 animate-pulse-fast rounded-full"></div>
        <div class="text-[12rem] md:text-[16rem] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-slam relative z-10" style="font-family: 'Orbitron', sans-serif;">
          {{ level }}
        </div>
      </div>

      <!-- New Title Reveal -->
      <div class="flex flex-col items-center gap-2 animate-slide-up" style="animation-delay: 0.8s; opacity: 0; animation-fill-mode: forwards;">
        <span class="text-blue-400 uppercase tracking-[0.3em] text-sm font-bold">New Rank Acquired</span>
        <div class="text-3xl md:text-5xl font-bold text-white uppercase tracking-wider drop-shadow-lg text-center bg-gradient-to-r from-white via-blue-200 to-gray-400 bg-clip-text text-transparent px-4 py-2 border-y-2 border-blue-500/30 bg-black/50 backdrop-blur-sm">
          {{ title }}
        </div>
      </div>

      <div class="absolute bottom-[-100px] text-gray-500 animate-pulse text-sm">
        Click anywhere to continue
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');

/* Entrance Fade */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slam Effect */
.animate-slam {
  animation: slam 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  opacity: 0;
  transform: scale(3);
}

@keyframes slam {
  0% {
    opacity: 0;
    transform: scale(3);
  }
  50% {
    opacity: 1;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide Up Reveal */
.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Glitch Effect */
.glitch-text {
  position: relative;
  animation: glitch-skew 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch-text::before {
  left: 2px;
  text-shadow: -2px 0 #ff00c1;
  clip-path: inset(50% 0 30% 0);
  animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
}

.glitch-text::after {
  left: -2px;
  text-shadow: -2px 0 #00fff9;
  clip-path: inset(10% 0 60% 0);
  animation: glitch-anim-2 3s infinite linear alternate-reverse;
}

@keyframes glitch-anim-1 {
  0% { clip-path: inset(20% 0 80% 0); }
  20% { clip-path: inset(60% 0 10% 0); }
  40% { clip-path: inset(40% 0 50% 0); }
  60% { clip-path: inset(80% 0 5% 0); }
  80% { clip-path: inset(10% 0 70% 0); }
  100% { clip-path: inset(30% 0 20% 0); }
}

@keyframes glitch-anim-2 {
  0% { clip-path: inset(10% 0 60% 0); }
  20% { clip-path: inset(80% 0 5% 0); }
  40% { clip-path: inset(30% 0 50% 0); }
  60% { clip-path: inset(70% 0 10% 0); }
  80% { clip-path: inset(20% 0 30% 0); }
  100% { clip-path: inset(50% 0 20% 0); }
}

@keyframes glitch-skew {
  0% { transform: skew(0deg); }
  20% { transform: skew(-2deg); }
  40% { transform: skew(2deg); }
  60% { transform: skew(-1deg); }
  80% { transform: skew(1deg); }
  100% { transform: skew(0deg); }
}
</style>
