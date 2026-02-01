<script setup>
import { ref, computed, onMounted, watch } from 'vue';

import GameCard from './components/GameCard.vue';
import UserProfile from './components/UserProfile.vue';
import BackgroundAurora from './components/BackgroundAurora.vue';
import BackgroundSynthwave from './components/BackgroundSynthwave.vue';
import TheModals from './components/TheModals.vue'; // Centralized Modals
import AchievementToast from './components/AchievementToast.vue'; 
import SmartBar from './components/SmartBar.vue'; 

import { useGames } from './composables/useGames';
import { useAchievements } from './composables/useAchievements';
import { useGameFilters } from './composables/useGameFilters';
import { useSettings } from './composables/useSettings';
import { useShop } from './composables/useShop';
import { useModals } from './composables/useModals';
import { Settings, Plus, Gamepad2, Layers, CheckCircle2, LayoutDashboard, Ban, Timer, Bell, Dices, Trophy, Menu, X, ShoppingBag } from 'lucide-vue-next';

const { playingGames, backlogGames, completedGames, droppedGames, updateStatus, removeGame, games, userXP, userLevel, userTitle } = useGames();
const { checkAchievements } = useAchievements();
const { getEquippedItem } = useShop();
const { getEquippedTheme } = useSettings();

const equippedBackground = computed(() => getEquippedItem('background'));

const backgroundClass = computed(() => {
    const val = equippedBackground.value?.value;
    if (val === 'stars') return 'bg-gray-900 bg-[radial-gradient(white,transparent_2px)] bg-[size:30px_30px]';
    if (val === 'grid') return 'bg-gray-900 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]';
    if (val === 'synthwave') return 'bg-transparent overflow-hidden'; /* Component handles bg */
    if (val === 'prism_bg') return 'bg-black bg-prism';
    if (val === 'neon_bg') return 'bg-black bg-neon';
    if (val === 'matrix') return 'bg-black matrix-bg';
    if (val === 'matrix') return 'bg-black matrix-bg';
    if (val === 'hex') return 'bg-gray-900 hex-bg';
    if (val === 'aurora') return 'bg-gray-950 overflow-hidden'; /* Base dark bg for aurora */
    if (val === 'pulse') return 'bg-gray-900 pulse-bg';
    if (val === 'dots') return 'bg-gray-900 bg-[radial-gradient(rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[size:20px_20px]';
    if (val === 'circuit') return 'bg-gray-900 bg-[radial-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]'; 
    return 'bg-gray-900';
});

// Modals State
const { openModal, resetModal, activeModal } = useModals();

// Queue Level Up if Victory is showing
watch(userLevel, (newVal, oldVal) => {
    if (newVal > oldVal) {
        if (activeModal.value === 'victory') {
            // Logic handled in Victory overlay close? 
            // Actually, in TheModals we didn't add queue logic.
            // We can just open it immediately? Or wait? 
            // Let's just open it. Overlays can stack if we change logic, but here activeModal is single string.
            // So we must queue it?
            // "pendingLevelUp" was local ref. Let's keep a local ref for queueing if we want that behavior.
            pendingLevelUp.value = true;
        } else {
            openModal('levelUp');
        }
    }
});
const pendingLevelUp = ref(false);

// Handle Victory Close (Check Queue) - We need to watch activeModal changes?
// Or TheModals emits close? 
// TheModals handles close => history.back().
// When activeModal becomes null (via popstate), we check pendingLevelUp?
watch(activeModal, (newVal, oldVal) => {
    if (oldVal === 'victory' && !newVal && pendingLevelUp.value) {
        setTimeout(() => {
            openModal('levelUp');
            pendingLevelUp.value = false;
        }, 500);
    }
});

const selectedGameId = ref(null); // Still needed? detailed modal uses props.gameId. 
// We can remove it if we pass ID in openModal.

const currentTab = ref('dashboard'); // 'dashboard', 'backlog', 'completed'

// Intercept Status Updates for Victory
const handleUpdateStatus = (id, status) => {
    // Check if becoming completed
    if (status === 'completed') {
        const game = games.value.find(g => g.id === id);
        if (game && game.status !== 'completed') {
             // Calculate XP
            const xp = game.status === 'playing' ? 200 : 250;
            openModal('victory', { game: game, xpGained: xp });
        }
    }
    updateStatus(id, status);
};

// Search & Sort State (Refactored to composable)
const { searchQuery: localSearchQuery, sortOption: currentSort, getProcessedGames } = useGameFilters();

const showCopyFeedback = ref(false);
const isMenuOpen = ref(false);

const displayGames = computed(() => {
    switch(currentTab.value) {
        case 'dashboard': return getProcessedGames(playingGames.value);
        case 'backlog': return getProcessedGames(backlogGames.value);
        case 'completed': return getProcessedGames(completedGames.value);
        case 'dropped': return getProcessedGames(droppedGames.value);
        default: return [];
    }
});

// Helper functions removed - using openModal directly in template.

// Open Game Details (Used in GameCard click)
const openGameDetails = (gameId) => {
    openModal('gameDetail', { gameId, onUpdateStatus: handleUpdateStatus });
};

onMounted(() => {
    window.addEventListener('popstate', (event) => {
        resetModal();
    });

    // Check achievements on mount
    checkAchievements({ games, playingGames, backlogGames, completedGames, droppedGames, userXP });
});

// Watch games and trigger achievement check
watch([games, userXP], () => {
    checkAchievements({ games, playingGames, backlogGames, completedGames, droppedGames, userXP });
}, { deep: true });

const handleWebCheck = async () => {
    // Generate prompt from games list
    const targetGames = games.value.filter(g => g.status === 'playing' || g.status === 'backlog');
    
    let prompt = "";
    if (targetGames.length === 0) {
        prompt = "Please find updates for my games.";
    } else {
        const gameTitles = targetGames.map(g => g.title).join(', ');
        prompt = `Find the most recent major update, patch, or content release for the following games: ${gameTitles}. Provide the version number, status, and a short summary for each.`;
    }

    try {
        await navigator.clipboard.writeText(prompt);
        showCopyFeedback.value = true;
        setTimeout(() => showCopyFeedback.value = false, 3000);
        
        // Open Gemini
        window.open('https://gemini.google.com/app', '_blank');
    } catch (err) {
        console.error('Failed to copy: ', err);
        window.open('https://gemini.google.com/app', '_blank');
    }
};

const logoPath = `${import.meta.env.BASE_URL}logo.png`;

// Swipe Navigation
import { useSwipe } from './composables/useSwipe';

const mainContainer = ref(null);
const tabs = ['dashboard', 'backlog', 'completed', 'dropped'];

const nextTab = () => {
    const currentIndex = tabs.indexOf(currentTab.value);
    if (currentIndex < tabs.length - 1) {
        currentTab.value = tabs[currentIndex + 1];
    }
};

const prevTab = () => {
    const currentIndex = tabs.indexOf(currentTab.value);
    if (currentIndex > 0) {
        currentTab.value = tabs[currentIndex - 1];
    }
};

useSwipe(mainContainer, {
    onSwipeLeft: nextTab,
    onSwipeRight: prevTab,
    minSwipeDistance: 50,
    maxVerticalDistance: 50 // Slightly higher tolerance
});
</script>

<template>
  <div 
    class="min-h-screen pb-24 px-4 pt-4 max-w-4xl mx-auto flex flex-col transition-colors duration-500 relative touch-pan-y" 
    :class="backgroundClass"
    ref="mainContainer"
  >
    
    <!-- Aurora Layer (Refactored) -->
    <BackgroundAurora v-if="equippedBackground?.value === 'aurora'" />
    <BackgroundSynthwave v-if="equippedBackground?.value === 'synthwave'" />

    <!-- Header -->
    <header class="flex justify-between items-center mb-6 relative z-30">
      <div class="flex items-center gap-3">
        <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <img :src="logoPath" alt="Logo" class="relative w-10 h-10 rounded-full border-2 border-gray-900 shadow-xl" />
        </div>
        <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 tracking-wider drop-shadow-sm" style="font-family: 'Orbitron', sans-serif;">
            GAME<span class="text-white">QUEST</span>LOG
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- Updates Bell (Web Check) -->
        <button 
            @click="handleWebCheck" 
            class="relative p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-800"
            title="Check Game Updates on Web"
        >
            <Bell class="w-6 h-6" />
            <span v-if="showCopyFeedback" class="absolute -bottom-8 right-0 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded shadow animate-bounce whitespace-nowrap z-50">
                Copied! Paste in Gemini
            </span>
        </button>

        <button @click="openModal('settings')" class="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
            <Settings class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- User Profile -->
    <UserProfile @open-stats="openModal('stats')" @open-gamer-card="openModal('gamerCard')" />

    <!-- Settings Section (Modal) -->
    <!-- Centralized Modals -->
    <TheModals />
    
    <!-- Smart Bar (Search & Sort) -->
    <SmartBar 
        v-model:searchQuery="localSearchQuery"
        v-model:sortOption="currentSort"
    />

    <!-- Navigation Tabs (Desktop / Mobile Hybrid) -->
    <nav class="flex p-1 bg-gray-800 rounded-xl mb-6 sticky top-2 z-30 shadow-lg border border-gray-700">
      <button 
        @click="currentTab = 'dashboard'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'dashboard' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <LayoutDashboard class="w-4 h-4" />
        <span class="hidden sm:inline">Dashboard</span>
      </button>
      <button 
        @click="currentTab = 'backlog'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'backlog' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <Layers class="w-4 h-4" />
        <span class="hidden sm:inline">Backlog</span>
        <span v-if="backlogGames.length" class="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{{ backlogGames.length }}</span>
      </button>
      <button 
        @click="currentTab = 'completed'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'completed' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span class="hidden sm:inline">Completed</span>
        <span v-if="completedGames.length" class="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{{ completedGames.length }}</span>
      </button>
      <button 
        @click="currentTab = 'dropped'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'dropped' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <Ban class="w-4 h-4" />
        <span class="hidden sm:inline">Dropped</span>
      </button>
    </nav>

    <main class="flex-1 space-y-8">
      
      <!-- Dashboard / Currently Playing -->
      <section v-if="currentTab === 'dashboard'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2">
          Currently Playing
        </h2>
        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-2 md:grid-cols-2 gap-1.5 sm:gap-2">
          <GameCard 
            v-for="(game, index) in displayGames" 
            :key="game.id" 
            :game="game" 
            @click="openGameDetails(game.id)"
            @update-status="handleUpdateStatus"
            @delete="removeGame"
            class="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-sm animate-stagger-enter"
            :style="{ animationDelay: `${index * 50}ms` }"
          />
          <div v-if="displayGames.length === 0" class="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center text-gray-500 col-span-2">
            {{ localSearchQuery ? "No matching games found." : "No games in progress. Start one from your backlog!" }}
          </div>
        </div>
      </section>

      <!-- Backlog -->
      <section v-if="currentTab === 'backlog'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3">Backlog</h2>
        

        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          <GameCard 
            v-for="(game, index) in displayGames" 
            :key="game.id" 
            :game="game" 
            @click="openGameDetails(game.id)"
            @update-status="updateStatus"
            @delete="removeGame"
            class="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-sm animate-stagger-enter"
            :style="{ animationDelay: `${index * 50}ms` }"
          />
        </div>
        <div v-if="displayGames.length === 0" class="text-center py-10 text-gray-500">
           {{ localSearchQuery ? "No matching games found." : "Your backlog is empty. Time to find new games!" }}
        </div>
      </section>

      <!-- Completed -->
      <section v-if="currentTab === 'completed'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3">Completed</h2>
        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          <div 
             v-for="(game, index) in displayGames" 
             :key="game.id" 
             class="relative group cursor-pointer animate-stagger-enter" 
             @click="openGameDetails(game.id)"
             :style="{ animationDelay: `${index * 50}ms` }"
          >
            <GameCard 
              :game="game" 
              class="opacity-75 hover:opacity-100 transition-opacity hover:ring-2 hover:ring-green-500 shadow-sm"
              @update-status="updateStatus"
              @delete="removeGame"
            />

             <!-- Rating Badge -->
            <div v-if="game.rating" class="absolute bottom-16 right-2 flex bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded shadow pointer-events-none items-center gap-1">
              <span class="text-[10px]">★</span> {{ game.rating }}
            </div>
          </div>
        </div>
        <div v-if="displayGames.length === 0" class="text-center py-10 text-gray-500">
          {{ localSearchQuery ? "No matching games found." : "No completed games yet. Keep playing!" }}
        </div>
      </section>

      <!-- Dropped -->
      <section v-if="currentTab === 'dropped'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3">Dropped Games</h2>
        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          <div 
            v-for="(game, index) in displayGames" 
            :key="game.id" 
            class="relative group cursor-pointer opacity-50 hover:opacity-100 transition-opacity animate-stagger-enter" 
            @click="openGameDetails(game.id)"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <GameCard 
              :game="game" 
              class="grayscale hover:grayscale-0 transition-all shadow-sm"
              @update-status="updateStatus"
              @delete="removeGame"
            />
             <div class="absolute top-2 right-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded shadow pointer-events-none">
              DROPPED
            </div>
          </div>
        </div>
        <div v-if="displayGames.length === 0" class="text-center py-10 text-gray-500">
           {{ localSearchQuery ? "No matching games found." : "No dropped games. That's dedication!" }}
        </div>
      </section>

    </main>

    <!-- FAB Menu Group -->
    <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3" @touchstart.stop>

        <!-- Initial Actions (Hidden by default, slide up when menu open) -->

        <div class="flex flex-col gap-3 transition-all duration-300 origin-bottom" :class="isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-0 pointer-events-none'">
             
             <!-- Add Game -->
            <button 
                @click="openModal('addGame'); isMenuOpen = false"
                class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Add Game</div>
                <Plus class="w-6 h-6" />
            </button>

            <!-- Quest Giver -->
            <button 
               @click="openModal('quest'); isMenuOpen = false"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Quest Giver</div>
                <Dices class="w-6 h-6" />
            </button>

            <!-- Shop -->
            <button 
               @click="openModal('shop'); isMenuOpen = false"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Loot Shop</div>
                <ShoppingBag class="w-6 h-6" />
            </button>

            <!-- Achievements -->
            <button 
               @click="openModal('achievements'); isMenuOpen = false"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Achievements</div>
                <Trophy class="w-6 h-6" />
            </button>
        </div>

        <!-- Main Menu Button -->
        <button 
            @click="isMenuOpen = !isMenuOpen"
            class="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-2xl transition-all active:scale-90 border-4 border-gray-900 z-50 group"
        >
            <Menu class="w-8 h-8 transition-transform duration-300 scale-100 rotate-0" v-if="!isMenuOpen" />
            <X class="w-8 h-8 transition-transform duration-300 scale-100 rotate-90" v-else />
        </button>

    </div>






  </div>
</template>

<style>
/* Custom Scrollbar Hide Utility */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}



/* Prism Effect */
.bg-prism {
    background-color: #000;
    background-image: url('@/assets/shop_background_prism.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}

/* Neon Effect */
.bg-neon {
    background-color: #000;
    background-image: url('@/assets/shop_background_neon.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}

/* Matrix Effect */
.matrix-bg {
    background-color: #000;
    background-image: 
        linear-gradient(rgba(0, 20, 0, 0.9), rgba(0, 0, 0, 0.4)), 
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ctext x='10' y='30' fill='%230f0' font-family='monospace' font-size='20' opacity='0.5'%3E1%3C/text%3E%3Ctext x='50' y='70' fill='%230f0' font-family='monospace' font-size='20' opacity='0.3'%3E0%3C/text%3E%3Ctext x='80' y='40' fill='%230f0' font-family='monospace' font-size='20' opacity='0.4'%3E1%3C/text%3E%3Ctext x='30' y='90' fill='%230f0' font-family='monospace' font-size='20' opacity='0.6'%3E0%3C/text%3E%3C/svg%3E");
    background-size: cover, 200px 200px;
    animation: matrix-scroll 20s linear infinite;
}

@keyframes matrix-scroll {
    from { background-position: 0 0, 0 0; }
    to { background-position: 0 0, 0 200px; }
}

/* Aurora animations moved to BackgroundAurora.vue */

/* Hex Core Effect */
.hex-bg {
    background-color: #0f172a;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%2364748b' fill-opacity='0.15' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L10.98 40v6.35L0 42.7v-2.3zm25.5-18.5l2.5-2.3-10.99-6.35V0h-2v7.5L25.5 15zm0 18.5l2.5 2.3-10.99 6.35V49h-2v-7.5L25.5 33.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    background-attachment: fixed;
    animation: hex-pulse 4s ease-in-out infinite alternate;
}
@keyframes hex-pulse {
    from { opacity: 0.8; }
    to { opacity: 1; }
}

/* Pulse Circuit Effect */
.pulse-bg {
    background-color: #111827;
    background-image: radial-gradient(circle at center, rgba(56, 189, 248, 0.1) 0%, transparent 70%),
                      linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
    background-size: 100% 100%, 50px 50px, 50px 50px;
    animation: pulse-glow 4s ease-in-out infinite alternate;
}
@keyframes pulse-glow {
    from { background-image: radial-gradient(circle at center, rgba(56, 189, 248, 0.05) 0%, transparent 50%), linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px); }
    to { background-image: radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, transparent 80%), linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px); }
}
</style>
