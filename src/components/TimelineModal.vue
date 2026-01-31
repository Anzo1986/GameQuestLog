<script setup>
import { computed, ref } from 'vue';
import { X, Calendar, CheckCircle2, Gamepad2, Layers } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { games } = useGames();

// Group games by Year
const timelineGroups = computed(() => {
    const groups = {};
    
    // Sort games: Newest interactions first
    // Priority: completedAt > released > id (fallback)
    const sortedGames = [...games.value].sort((a, b) => {
        const dateA = new Date(a.completedAt || a.startedAt || a.released || 0);
        const dateB = new Date(b.completedAt || b.startedAt || b.released || 0);
        return dateB - dateA;
    });

    sortedGames.forEach(game => {
        // Deterministic Year
        let year = "Unknown Time";
        if (game.completedAt) year = new Date(game.completedAt).getFullYear();
        else if (game.startedAt) year = new Date(game.startedAt).getFullYear();
        else if (game.released) year = new Date(game.released).getFullYear();

        if (!groups[year]) groups[year] = [];
        groups[year].push(game);
    });

    return groups;
});

const sortedYears = computed(() => {
    return Object.keys(timelineGroups.value).sort((a, b) => b - a); // Newest years first
});

const getStatusColor = (status) => {
    switch(status) {
        case 'completed': return 'text-green-400 border-green-500/50 bg-green-500/10';
        case 'playing': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
        case 'dropped': return 'text-gray-500 border-gray-600/50 bg-gray-600/10';
        default: return 'text-purple-400 border-purple-500/50 bg-purple-500/10';
    }
};

const getStatusIcon = (status) => {
    switch(status) {
        case 'completed': return CheckCircle2;
        case 'playing': return Gamepad2;
        case 'dropped': return X; // Or Ban
        default: return Layers;
    }
};
const particles = new Array(40).fill(null).map(() => ({
  left: Math.random() * 100 + '%',
  top: Math.random() * 100 + '%',
  size: Math.random() * 4 + 2 + 'px', // Thicker: 2px to 6px
  duration: Math.random() * 5 + 5 + 's',
  opacity: Math.random() * 0.7 + 0.3
}));
const expandedGames = ref(new Set());
const toggleExpand = (id) => {
    if (expandedGames.value.has(id)) expandedGames.value.delete(id);
    else expandedGames.value.add(id);
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-2xl h-[85vh] bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-10">
          <div>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--primary-rgb))] to-purple-500 uppercase tracking-widest">
                Your Journey
            </h2>
            <p class="text-gray-400 text-sm">A chronicle of your gaming history</p>
          </div>
          <button @click="$emit('close')" class="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              <X class="w-6 h-6" />
          </button>
      </div>

      <!-- Timeline Scroll Area -->
      <!-- Added overflow-anchor-none to prevent scroll jumping -->
      <div class="flex-1 overflow-y-auto p-6 relative custom-scrollbar overflow-anchor-none section-scroll">
          
        <div class="relative min-h-full">
            <!-- Vertical Line Container -->
            <!-- Full height relative to content wrapper -->
            <!-- Vertical Line Container -->
            <!-- Full height relative to content wrapper -->
            <!-- Vertical Line Container -->
            <!-- Centered at left-10 (40px). Wrapper is w-0 to not affect layout, but overflows visible -->
            <!-- Vertical Line Container -->
            <!-- Timeline Anchor at left-10 (40px) -->
            
            <!-- 1. HTML Particles (Theme Colored & Thicker) -->
            <!-- Narrower field: w-24 (6rem) instead of w-48 -->
            <div class="absolute top-0 bottom-0 left-10 w-24 -translate-x-1/2 pointer-events-none overflow-hidden z-0">
                <div 
                  v-for="(p, i) in particles" 
                  :key="i"
                  class="particle shadow-[0_0_4px_currentColor]"
                  :style="{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    opacity: p.opacity,
                    animationDuration: p.duration,
                    backgroundColor: 'rgb(var(--primary-rgb))', 
                    color: 'rgb(var(--primary-rgb)'
                  }"
                ></div>
            </div>

            <!-- 2. Glow Layer (Ambient Light) -->
            <div class="absolute top-0 bottom-0 left-10 w-8 -translate-x-1/2 bg-[rgb(var(--primary-rgb))] opacity-30 blur-xl z-0"></div>
            
            <!-- 3. Core Neon Line - More Transparent, Theme Colored -->
            <!-- Added overflow-hidden to prevent beam from affecting layout size -->
            <div class="absolute top-0 bottom-0 left-10 w-1 -translate-x-1/2 bg-[rgb(var(--primary-rgb))] bg-opacity-40 shadow-[0_0_12px_rgb(var(--primary-rgb))] z-10 overflow-hidden rounded-full">
                 <!-- Beam Animation -->
                 <div class="absolute inset-x-0 h-[30vh] bg-white opacity-80 animate-beam-drop blur-[2px] mix-blend-overlay"></div>
            </div>

            <div v-if="sortedYears.length === 0" class="text-center py-20 text-gray-500">
                No history recorded yet.
            </div>

            <div v-else class="space-y-12 pt-6">
                <div v-for="year in sortedYears" :key="year" class="relative">
                    
                    <!-- Year Marker (Centered on Line) -->
                    <div class="sticky top-0 z-10 flex mb-6 pl-10 pointer-events-none">
                        <div class="bg-gray-900 border text-[rgb(var(--primary-rgb))] font-bold px-3 py-1 rounded-full text-sm shadow-xl relative -translate-x-1/2" style="border-color: rgb(var(--primary-rgb))">
                            {{ year }}
                        </div>
                    </div>

                    <!-- Games List -->
                    <div class="space-y-6 pl-20 relative">
                        <div 
                            v-for="game in timelineGroups[year]" 
                            :key="game.id" 
                            class="relative group"
                        >
                            <!-- Horizontal Connector Line -->
                            <div class="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-[1px] bg-[rgb(var(--primary-rgb))] opacity-30 group-hover:opacity-100 transition-opacity"></div>

                            <!-- Card -->
                            <div 
                                @click.stop="toggleExpand(game.id)"
                                class="relative flex flex-col bg-gradient-to-br from-gray-800 to-gray-900/80 p-4 rounded-xl border border-gray-700/50 border-t-white/10 border-l-white/10 hover:border-[rgb(var(--primary-rgb))] transition-all shadow-lg hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:-translate-y-1 cursor-pointer group-hover:z-10 backdrop-blur-sm"
                            >
                                <!-- Main Row -->
                                <div class="flex gap-4 items-center">
                                    <!-- Image -->
                                    <img :src="game.background_image" class="w-16 h-16 object-cover rounded-lg shadow-md border border-gray-700" />
                                    
                                    <!-- Info -->
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-bold text-white truncate group-hover:text-[rgb(var(--primary-rgb))] transition-colors text-lg">{{ game.title }}</h3>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span :class="['text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1 shadow-sm', getStatusColor(game.status)]">
                                                <component :is="getStatusIcon(game.status)" class="w-3 h-3" />
                                                <span class="uppercase tracking-wider font-bold text-[10px]">{{ game.status }}</span>
                                            </span>
                                            <span v-if="game.rating" class="text-xs text-yellow-500 font-bold drop-shadow-sm">★ {{ game.rating }}</span>
                                        </div>
                                    </div>

                                    <!-- Date/Action (Summary) -->
                                    <div class="text-right text-xs text-gray-500 font-mono hidden sm:block">
                                        <div v-if="game.completedAt">Completed</div>
                                        <div v-else-if="game.startedAt">Started</div>
                                        <div v-else>Released</div>
                                        <div class="text-gray-400">{{ new Date(game.completedAt || game.startedAt || game.released).toLocaleDateString() }}</div>
                                    </div>
                                </div>

                                <!-- Expanded Details (History) -->
                                <div v-if="expandedGames.has(game.id)" class="mt-4 pt-4 border-t border-gray-700/50 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <h4 class="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">History Log</h4>
                                    
                                    <div v-if="game.released" class="flex justify-between text-xs">
                                        <span class="text-gray-400 flex items-center gap-2"><Calendar class="w-3 h-3" /> Released</span>
                                        <span class="font-mono text-gray-300">{{ new Date(game.released).toLocaleDateString() }}</span>
                                    </div>
                                    
                                    <div v-if="game.addedAt" class="flex justify-between text-xs">
                                        <span class="text-gray-400 flex items-center gap-2"><Layers class="w-3 h-3" /> Backlog</span>
                                        <span class="font-mono text-gray-300">{{ new Date(game.addedAt).toLocaleDateString() }}</span>
                                    </div>

                                    <div v-if="game.startedAt" class="flex justify-between text-xs">
                                        <span class="text-blue-400 flex items-center gap-2"><Gamepad2 class="w-3 h-3" /> Started</span>
                                        <span class="font-mono text-gray-300">{{ new Date(game.startedAt).toLocaleDateString() }}</span>
                                    </div>

                                    <div v-if="game.completedAt" class="flex justify-between text-xs">
                                        <span class="text-green-400 flex items-center gap-2"><CheckCircle2 class="w-3 h-3" /> Completed</span>
                                        <span class="font-mono text-white font-bold">{{ new Date(game.completedAt).toLocaleDateString() }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div> 

      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}

@keyframes beam-drop {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(200%); } /* Move well past to ensure full traversal */
}

.animate-beam-drop {
  animation: beam-drop 3s linear infinite;
  top: 0; /* Fix top to 0, let transform handle movement */
  height: 30vh; /* Re-affirm height here or keep in inline style */
}

@keyframes float-up {
  0% { transform: translateY(0); }
  100% { transform: translateY(-200px); }
}

.particle {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation-name: float-up;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
</style>
