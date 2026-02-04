<script setup>
import { ref, computed, onMounted, watch } from 'vue';

import UserProfile from './components/UserProfile.vue';
import BackgroundAurora from './components/BackgroundAurora.vue';
import BackgroundSynthwave from './components/BackgroundSynthwave.vue';
import TheModals from './components/TheModals.vue'; 
import AchievementToast from './components/AchievementToast.vue'; 
import SmartBar from './components/SmartBar.vue'; 

// New Components
import AppNavigation from './components/AppNavigation.vue';
import GameGrid from './components/GameGrid.vue';
import FabMenu from './components/FabMenu.vue';

import { useGames } from './composables/useGames';
import { useAchievements } from './composables/useAchievements';
import { useDailyLogin } from './composables/useDailyLogin';
import { useGameFilters } from './composables/useGameFilters';
import { useSettings } from './composables/useSettings';
import { useShop } from './composables/useShop';
import { useModals } from './composables/useModals';
import { Settings, Bell } from 'lucide-vue-next';

const { playingGames, backlogGames, completedGames, droppedGames, updateStatus, removeGame, games, userXP, userLevel } = useGames();
const { checkAchievements } = useAchievements();
const { getEquippedItem } = useShop();
const { getEquippedTheme } = useSettings();

const equippedBackground = computed(() => getEquippedItem('background'));

const backgroundClass = computed(() => {
    const val = equippedBackground.value?.value;
    if (val === 'stars') return 'bg-gray-900 bg-[radial-gradient(white,transparent_2px)] bg-[size:30px_30px]';
    if (val === 'grid') return 'bg-gray-900 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]';
    if (val === 'synthwave') return 'bg-transparent overflow-hidden'; 
    if (val === 'prism_bg') return 'bg-black bg-prism';
    if (val === 'neon_bg') return 'bg-black bg-neon';
    if (val === 'matrix') return 'bg-black matrix-bg';
    if (val === 'hex') return 'bg-gray-900 hex-bg';
    if (val === 'aurora') return 'bg-gray-950 overflow-hidden'; 
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
            pendingLevelUp.value = true;
        } else {
            openModal('levelUp');
        }
    }
});
const pendingLevelUp = ref(false);

watch(activeModal, (newVal, oldVal) => {
    if (oldVal === 'victory' && !newVal && pendingLevelUp.value) {
        setTimeout(() => {
            openModal('levelUp');
            pendingLevelUp.value = false;
        }, 500);
    }
});

const currentTab = ref('dashboard'); // 'dashboard', 'backlog', 'completed'

// Intercept Status Updates for Victory
const handleUpdateStatus = (id, status) => {
    if (status === 'completed') {
        const game = games.value.find(g => g.id === id);
        if (game && game.status !== 'completed') {
            const xp = game.status === 'playing' ? 200 : 250;
            openModal('victory', { game: game, xpGained: xp });
        }
    }
    updateStatus(id, status);
};

// Search & Sort State (Refactored to composable)
const { searchQuery: localSearchQuery, sortOption: currentSort, getProcessedGames } = useGameFilters();

const showCopyFeedback = ref(false);

const displayGames = computed(() => {
    switch(currentTab.value) {
        case 'dashboard': return getProcessedGames(playingGames.value);
        case 'backlog': return getProcessedGames(backlogGames.value);
        case 'completed': return getProcessedGames(completedGames.value);
        case 'dropped': return getProcessedGames(droppedGames.value);
        default: return [];
    }
});

// Open Game Details (Used in GameCard click)
const openGameDetails = (gameId) => {
    openModal('gameDetail', { gameId, onUpdateStatus: handleUpdateStatus });
};

onMounted(() => {
    window.addEventListener('popstate', (event) => {
        resetModal();
    });

    checkAchievements({ games, playingGames, backlogGames, completedGames, droppedGames, userXP });

    const { checkLogin } = useDailyLogin();
    const status = checkLogin();
    if (!status.claimed) {
        setTimeout(() => {
            openModal('dailyLogin');
        }, 1000);
    }
});


watch([games, userXP], () => {
    checkAchievements({ games, playingGames, backlogGames, completedGames, droppedGames, userXP });
}, { deep: true });

const handleWebCheck = async () => {
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
        window.open('https://gemini.google.com/app', '_blank');
    } catch (err) {
        console.error('Failed to copy: ', err);
        window.open('https://gemini.google.com/app', '_blank');
    }
};

const logoPath = `${import.meta.env.BASE_URL}logo.png`;

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
    maxVerticalDistance: 50 
});
</script>

<template>
  <div 
    class="min-h-screen pb-24 px-4 pt-4 max-w-4xl mx-auto flex flex-col transition-colors duration-500 relative touch-pan-y" 
    :class="backgroundClass"
    ref="mainContainer"
  >
    
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

    <UserProfile @open-stats="openModal('stats')" @open-gamer-card="openModal('gamerCard')" />

    <AchievementToast />
    <TheModals />
    
    <SmartBar 
        v-model:searchQuery="localSearchQuery"
        v-model:sortOption="currentSort"
    />
    


    <!-- Extracted Navigation -->
    <AppNavigation 
        v-model:currentTab="currentTab"
        :backlog-count="backlogGames.length"
        :completed-count="completedGames.length"
    />

    <main class="flex-1 space-y-8">
      
      <!-- Dashboard -->
      <GameGrid 
          v-if="currentTab === 'dashboard'"
          :games="displayGames"
          title="Currently Playing"
          empty-message="No games in progress. Start one from your backlog!"
          :search-query="localSearchQuery"
          @click-game="openGameDetails"
          @update-status="handleUpdateStatus"
          @delete-game="removeGame"
      />

      <!-- Backlog -->
      <GameGrid 
          v-if="currentTab === 'backlog'"
          :games="displayGames"
          title="Backlog"
          empty-message="Your backlog is empty. Time to find new games!"
          :search-query="localSearchQuery"
          @click-game="openGameDetails"
          @update-status="updateStatus"
          @delete-game="removeGame"
      />

      <!-- Completed -->
      <GameGrid 
          v-if="currentTab === 'completed'"
          :games="displayGames"
          title="Completed"
          empty-message="No completed games yet. Keep playing!"
          :search-query="localSearchQuery"
          @click-game="openGameDetails"
          @update-status="updateStatus"
          @delete-game="removeGame"
      />

      <!-- Dropped -->
      <GameGrid 
          v-if="currentTab === 'dropped'"
          :games="displayGames"
          title="Dropped Games"
          empty-message="No dropped games. That's dedication!"
          :search-query="localSearchQuery"
          @click-game="openGameDetails"
          @update-status="updateStatus"
          @delete-game="removeGame"
      />
    </main>

    <!-- Extracted FAB Menu -->
    <FabMenu @open-modal="openModal" />

  </div>
</template>

<style>
/* Global styles for backgrounds (kept in App.vue or move to global.css if preferred) */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.bg-prism {
    background-color: #000;
    background-image: url('@/assets/shop_background_prism.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
.bg-neon {
    background-color: #000;
    background-image: url('@/assets/shop_background_neon.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
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
