<script setup>
import { computed } from 'vue';
import { Trophy, UserCircle } from 'lucide-vue-next';

const props = defineProps({
  src: String,
  frame: {
    type: String, // frame value (e.g., 'gold_ring', 'fire')
    default: 'none'
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg, xl
  },
  showPlaceholder: Boolean
});

// Map frame values to CSS classes
const frameClasses = computed(() => {
    const f = props.frame;
    const base = 'absolute inset-0 rounded-full z-20 pointer-events-none transition-all duration-300';
    
    switch (f) {
        case 'gold_ring': return `${base} border-[3px] border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]`;
        case 'fire': return `${base} border-[3px] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse`;
        case 'glitch': return `${base} border-[3px] border-cyan-500 border-dashed animate-spin-slow`;
        case 'neon_blue': return `${base} border-[3px] border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]`;
        case 'neon_pink': return `${base} border-[3px] border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]`;
        case 'nature': return `${base} border-[4px] border-emerald-600 border-double shadow-sm`;
        case 'ice': return `${base} border-[3px] border-cyan-200 shadow-[0_0_10px_rgba(165,243,252,0.6)] bg-white/5`;
        case 'none': 
        default: return `${base} border-2 border-gray-700`; // Default Neutral
    }
});

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'sm': return 'w-8 h-8';
        case 'md': return 'w-16 h-16'; // Standard
        case 'lg': return 'w-24 h-24';
        case 'xl': return 'w-32 h-32';
        default: return 'w-16 h-16';
    }
});
</script>

<template>
  <div class="relative flex items-center justify-center bg-gray-800 rounded-full shrink-0" :class="sizeClasses">
    
    <!-- Image -->
    <img v-if="src" :src="src" class="w-full h-full object-cover rounded-full z-10" />
    <Trophy v-else-if="showPlaceholder" class="w-1/2 h-1/2 text-yellow-500 z-10" />
    <UserCircle v-else class="w-1/2 h-1/2 text-gray-500 z-10" />

    <!-- Frame Overlay -->
    <div :class="frameClasses"></div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
    animation: spin 8s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
