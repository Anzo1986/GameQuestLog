<script setup>
import { computed } from 'vue';

const props = defineProps({
  styleName: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'lg' // 'sm' | 'lg'
  }
});

// Dynamic Sizing for Patterns
const cyberSize = computed(() => props.size === 'sm' ? 'bg-[size:10px_10px]' : 'bg-[size:20px_20px]');
const glitterSize1 = computed(() => props.size === 'sm' ? 'bg-[size:10px_10px]' : 'bg-[size:20px_20px]');
const glitterSize2 = computed(() => props.size === 'sm' ? 'bg-[size:8px_8px]' : 'bg-[size:15px_15px]');
const retroSize = computed(() => props.size === 'sm' ? 'bg-[size:100%_2px]' : 'bg-[size:100%_4px]');

// Glitch Lines
const glitchBg = computed(() => props.size === 'sm' 
    ? 'bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(6,182,212,0.1)_2px)]' 
    : 'bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.1)_3px)]'
);

</script>

<template>
  <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-inherit">
      <!-- Holo -->
      <div v-if="styleName === 'holo'" class="absolute inset-0 opacity-20 bg-gradient-to-tr from-purple-500/20 via-transparent to-cyan-500/20 animate-pulse"></div>
      <div v-if="styleName === 'holo'" class="absolute -inset-[100%] top-0 block h-[200%] w-[200%] -rotate-45 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:50%_50%] animate-shine"></div>
      
      <!-- Cyber -->
      <div v-if="styleName === 'cyber'" class="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(236,72,153,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.2)_1px,transparent_1px)]" :class="cyberSize"></div>
      <div v-if="styleName === 'cyber'" class="absolute inset-x-0 top-0 h-px bg-pink-500 shadow-[0_0_10px_#ec4899] z-10"></div>
      
      <!-- Retro -->
      <div v-if="styleName === 'retro'" class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(34,197,94,0.3)_1px,transparent_1px)]" :class="retroSize"></div>
      
      <!-- Fire -->
      <div v-if="styleName === 'fire'" class="absolute inset-0 opacity-20 bg-gradient-to-t from-orange-600/30 to-transparent"></div>
      <div v-if="styleName === 'fire'" class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-orange-500/20 to-transparent animate-pulse"></div>
      
      <!-- Glitter -->
      <div v-if="styleName === 'glitter'" class="absolute inset-0 opacity-30 bg-[radial-gradient(white,transparent_1px)] animate-pulse" :class="glitterSize1"></div>
      <div v-if="styleName === 'glitter'" class="absolute inset-0 opacity-30 bg-[radial-gradient(white,transparent_1px)] animate-pulse-slow" :class="glitterSize2"></div>
      
      <!-- Spotlight -->
      <div v-if="styleName === 'spotlight'" class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse opacity-30"></div>

      <!-- Prism (Inner Glow) -->
      <div v-if="styleName === 'prism'" class="absolute inset-0 bg-gradient-to-tr from-red-500/10 via-green-500/10 to-blue-500/10"></div>

      <!-- Glitch (Overlay) -->
      <div v-if="styleName === 'glitch'" class="absolute inset-0 animate-pulse" :class="glitchBg"></div>
  </div>
</template>

<style scoped>
@keyframes shine {
    from { transform: translateX(-100%) rotate(-45deg); }
    to { transform: translateX(100%) rotate(-45deg); }
}
.animate-shine {
    animation: shine 8s ease-in-out infinite;
}
.animate-spin-slow-reverse {
    animation: spin 10s linear infinite reverse;
}
.animate-spin-slow {
    animation: spin 8s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
