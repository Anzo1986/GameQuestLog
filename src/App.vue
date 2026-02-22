<script setup>
import { ref, computed, onMounted, watch } from 'vue';

import UserProfile from './components/UserProfile.vue';
import TheBackground from './components/TheBackground.vue';
import TheModals from './components/TheModals.vue'; 
import AchievementToast from './components/AchievementToast.vue'; 
import SmartBar from './components/SmartBar.vue'; 
import AppNavigation from './components/AppNavigation.vue';
import GameGrid from './components/GameGrid.vue';
import FabMenu from './components/FabMenu.vue';
import ToastNotification from './components/ToastNotification.vue';

import { useGames } from './composables/useGames';
import { useAchievements } from './composables/useAchievements';
import { useDailyLogin } from './composables/useDailyLogin';
import { useGameFilters } from './composables/useGameFilters';
import { useModals } from './composables/useModals';
import { useAI } from './composables/useAI';
import { useGameplayCoordinator } from './composables/useGameplayCoordinator';
import { useSwipe } from './composables/useSwipe';
import { useShare } from './composables/useShare';
import { Settings, Bell } from 'lucide-vue-next';

// Composables
const { playingGames, backlogGames, completedGames, droppedGames, removeGame, addGame, games, updateStatus, userXP } = useGames();
const { checkAchievements } = useAchievements();
const { openModal, resetModal, handlePopstate } = useModals();
const { handleWebCheck, showCopyFeedback } = useAI();
const { handleUpdateStatus } = useGameplayCoordinator();
const { checkShareUrl } = useShare();

// Search & Sort
const { searchQuery: localSearchQuery, sortOption: currentSort, getProcessedGames } = useGameFilters();

// Tabs & Navigation
const currentTab = ref('dashboard'); 
const displayGames = computed(() => {
    switch(currentTab.value) {
        case 'dashboard': return getProcessedGames(playingGames.value);
        case 'backlog': return getProcessedGames(backlogGames.value, { separateUnreleased: true });
        case 'completed': return getProcessedGames(completedGames.value);
        case 'dropped': return getProcessedGames(droppedGames.value);
        default: return [];
    }
});

// UI Handlers
const openGameDetails = (gameId) => {
    openModal('gameDetail', { gameId, onUpdateStatus: handleUpdateStatus });
};

const confirmDelete = (gameId) => {
    const game = games.value.find(g => g.id === gameId);
    if (!game) return;
    
    openModal('confirm', {
        title: 'Delete Game?',
        message: `Are you sure you want to delete "${game.title}"? This action cannot be undone and will remove all associated XP and progress.`,
        confirmText: 'Delete',
        confirmColor: 'bg-red-500 hover:bg-red-600',
        onConfirm: () => {
            removeGame(gameId);
            resetModal();
        }
    });
};

// Lifecycle & Events
onMounted(() => {
    window.addEventListener('popstate', (event) => {
        handlePopstate();
    });

    checkAchievements({ games, playingGames, backlogGames, completedGames, droppedGames, userXP });

    const { checkLogin } = useDailyLogin();
    const status = checkLogin();
    // Check for shared game import
    const sharedGame = checkShareUrl();
    if (sharedGame) {
        // Prevent duplicate import
        if (games.value.some(g => g.id === sharedGame.id)) {
             openModal('confirm', {
                title: 'Game Already Exists',
                message: `You already have "${sharedGame.name}" in your library!`,
                confirmText: 'OK',
                confirmColor: 'bg-gray-600',
                onConfirm: () => {} // Just close
            });
        } else {
            openModal('confirm', {
                title: 'Game Recommendation',
                message: `Someone shared "${sharedGame.name}" with you. Would you like to add it to your Backlog?`,
                confirmText: 'Add to Backlog',
                confirmColor: 'bg-green-500 hover:bg-green-600',
                imageUrl: sharedGame.background_image,
                onConfirm: () => {
                    addGame(sharedGame, sharedGame.platform || 'PC');
                }
            });
        }
    } else {
         // Only check daily login if not importing a game
        if (!status.claimed) {
            setTimeout(() => openModal('dailyLogin'), 1000);
        }
    }
});

watch([games, userXP], () => {
    checkAchievements({ games, playingGames, backlogGames, completedGames, droppedGames, userXP });
}, { deep: true });

// Swipe Logic
const mainContainer = ref(null);
const tabs = ['dashboard', 'backlog', 'completed', 'dropped'];

const nextTab = () => {
    const currentIndex = tabs.indexOf(currentTab.value);
    if (currentIndex < tabs.length - 1) currentTab.value = tabs[currentIndex + 1];
};

const prevTab = () => {
    const currentIndex = tabs.indexOf(currentTab.value);
    if (currentIndex > 0) currentTab.value = tabs[currentIndex - 1];
};

useSwipe(mainContainer, {
    onSwipeLeft: nextTab,
    onSwipeRight: prevTab,
    minSwipeDistance: 50,
    maxVerticalDistance: 50,
    ignoreClass: 'card-swipe-area' // Don't swipe tabs if starting on a card
});

const logoPath = `${import.meta.env.BASE_URL}logo.png`;
</script>

<template>
  <div 
    class="min-h-screen pb-24 px-4 pt-4 max-w-4xl mx-auto flex flex-col transition-colors duration-500 relative touch-pan-y" 
    ref="mainContainer"
  >
    
    <TheBackground />

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
            @click="openModal('prompt')" 
            class="relative p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-800"
            title="Manual AI Prompts"
        >
            <Bell class="w-6 h-6" />
        </button>

        <button @click="openModal('settings')" class="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
            <Settings class="w-6 h-6" />
        </button>
      </div>
    </header>

    <UserProfile @open-stats="openModal('stats')" @open-gamer-card="openModal('gamerCard')" />

    <AchievementToast />
    <ToastNotification />
    <TheModals />
    
    <SmartBar 
        v-model:searchQuery="localSearchQuery"
        v-model:sortOption="currentSort"
    />

    <!-- Navigation -->
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
          @delete-game="confirmDelete"
      />

      <!-- Backlog -->
      <GameGrid 
          v-if="currentTab === 'backlog'"
          :games="displayGames"
          title="Backlog"
          empty-message="Your backlog is empty. Time to find new games!"
          :search-query="localSearchQuery"
          :show-unreleased-separator="true"
          @click-game="openGameDetails"
          @update-status="updateStatus"
          @delete-game="confirmDelete"
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
          @delete-game="confirmDelete"
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

    <FabMenu @open-modal="openModal" />

  </div>
</template>

<style>
/* Global utilities */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
