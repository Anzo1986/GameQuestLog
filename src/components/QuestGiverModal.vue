<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { X, Dices, Swords, RotateCw, CheckCircle2 } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import confetti from 'canvas-confetti';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { games, updateStatus, awardXP } = useGames();

// Filter only backlog games
const backlogGames = computed(() => games.value.filter(g => g.status === 'backlog'));

const displayedGame = ref(null);
const isRolling = ref(false);
const showResult = ref(false);
const animationInterval = ref(null);

// Random Logic
const startRoll = () => {
    if (backlogGames.value.length === 0) return;
    
    isRolling.value = true;
    showResult.value = false;
    
    let speed = 50;
    let counter = 0;
    const maxIterations = 20; // How many flips before stopping
    
    // Clear any existing
    if (animationInterval.value) clearInterval(animationInterval.value);

    // Initial rapid shuffle
    animationInterval.value = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * backlogGames.value.length);
        displayedGame.value = backlogGames.value[randomIndex];
        counter++;

        // Slow down effect
        if (counter > maxIterations) {
            clearInterval(animationInterval.value);
            finalizeRoll();
        }
    }, speed);
};

const finalizeRoll = () => {
    isRolling.value = false;
    showResult.value = true;
    // Ensure we have a valid final game
    if (!displayedGame.value) {
         const randomIndex = Math.floor(Math.random() * backlogGames.value.length);
         displayedGame.value = backlogGames.value[randomIndex];
    }
    
    // Trigger Confetti!
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#ffffff'] // Purple, Pink, Blue, White
    });
};

const acceptQuest = () => {
    if (!displayedGame.value) return;
    
    updateStatus(displayedGame.value.id, 'playing');
    awardXP(20); // Bonus for bravery
    emit('close');
    // Ideally show a toast here, but for now the XP log and Status update is visible
};

const reroll = () => {
    startRoll();
};

// Start rolling immediately when opened
onMounted(() => {
    if (props.isOpen) {
        startRoll();
    }
});

onUnmounted(() => {
    if (animationInterval.value) clearInterval(animationInterval.value);
});

// Watch for manual re-opening if component stays mounted (v-if vs v-show handling)
// Since we use v-if in App.vue, onMounted is enough.

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="!isRolling && $emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-gray-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 text-center animate-in fade-in zoom-in duration-300">
      
      <!-- Close Button -->
      <button 
        v-if="!isRolling" 
        @click="$emit('close')" 
        class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
      >
        <X class="w-6 h-6" />
      </button>

      <!-- Header -->
      <div class="mb-6">
          <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse">
              <Dices class="w-8 h-8 text-white" :class="{ 'animate-spin-slow': isRolling }" />
          </div>
          <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-widest">
              Quest Giver
          </h2>
          <p class="text-gray-400 text-sm mt-1">Destiny is choosing your path...</p>
      </div>

      <!-- No Games Error -->
      <div v-if="backlogGames.length === 0" class="py-8">
          <p class="text-red-400 font-bold">Your Backlog is empty!</p>
          <p class="text-gray-500 text-sm mt-2">Add some games first.</p>
      </div>

      <!-- The Reveal Area -->
      <div v-else class="w-full mb-8 relative">
          <!-- Game Card Presentation -->
          <div class="relative aspect-video w-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-800 group transition-all duration-300" :class="{ 'border-purple-500 scale-105 shadow-purple-500/20': showResult }">
            
            <img 
                v-if="displayedGame"
                :src="displayedGame.background_image" 
                class="w-full h-full object-cover transition-transform duration-700"
                :class="{ 'blur-sm scale-110': isRolling }"
            />
            
            <!-- Overlay Text -->
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent flex flex-col justify-end p-4">
                <h3 v-if="displayedGame" class="text-xl font-bold text-white drop-shadow-lg leading-tight">
                    {{ displayedGame.title }}
                </h3>
            </div>

            <!-- Mystery Overlay (while rolling) -->
            <div v-if="false && isRolling" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span class="text-4xl">?</span>
            </div>
          </div>
      </div>

      <!-- Actions -->
      <div v-if="showResult" class="flex flex-col gap-3 w-full animate-in slide-in-from-bottom-4 duration-500">
          <button 
            @click="acceptQuest" 
            class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
              <Swords class="w-5 h-5" /> Accept Quest (+20 XP)
          </button>
          
          <button 
            @click="reroll" 
            class="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
              <RotateCw class="w-4 h-4" /> Reroll Choice
          </button>
      </div>
      
      <div v-if="isRolling" class="h-24 flex items-center justify-center text-purple-400 font-mono text-sm animate-pulse">
          ROLLING FATE...
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
    animation: spin 3s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
