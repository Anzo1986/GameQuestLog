import { ref, computed } from 'vue';
import { Settings, Plus, Gamepad2, Layers, CheckCircle2, LayoutDashboard, Ban, Timer, Bell } from 'lucide-vue-next';
import GameCard from './components/GameCard.vue';
import AddGameModal from './components/AddGameModal.vue';
import GameDetailModal from './components/GameDetailModal.vue';
import UpdatesModal from './components/UpdatesModal.vue';
import SettingsSection from './components/SettingsSection.vue';
import UserProfile from './components/UserProfile.vue';
import { useGames } from './composables/useGames';

const { playingGames, backlogGames, completedGames, droppedGames, pileOfShameHours, updateStatus, removeGame, updates } = useGames();

const showAddModal = ref(false);
const showSettings = ref(false);
const showDetailModal = ref(false);
const showUpdatesModal = ref(false);
const selectedGameId = ref(null);
const currentTab = ref('dashboard'); // 'dashboard', 'backlog', 'completed'

const unseenUpdatesCount = computed(() => updates.value.filter(u => !u.seen).length);

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

const openGameDetails = (gameId) => {
  selectedGameId.value = gameId;
  showDetailModal.value = true;
};

const logoPath = `${import.meta.env.BASE_URL}logo.png`;
</script>

<template>
  <div class="min-h-screen pb-24 px-4 pt-4 max-w-4xl mx-auto flex flex-col">
    
    <!-- Header -->
    <header class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <img :src="logoPath" alt="Logo" class="relative w-10 h-10 rounded-full border-2 border-gray-900 shadow-xl" />
        </div>
        <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-wider drop-shadow-sm" style="font-family: 'Orbitron', sans-serif;">
            GAME<span class="text-white">QUEST</span>LOG
        </h1>
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- Updates Bell -->
        <button @click="showUpdatesModal = true" class="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
            <Bell class="w-6 h-6" />
            <span v-if="unseenUpdatesCount > 0" class="absolute top-1 right-1 flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        </button>

        <button @click="toggleSettings" class="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
            <Settings class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- User Profile -->
    <UserProfile />

    <!-- Settings Section -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform -translate-y-2 opacity-0">
      <SettingsSection v-if="showSettings" />
    </transition>

    <!-- Navigation Tabs (Desktop / Mobile Hybrid) -->
    <nav class="flex p-1 bg-gray-800 rounded-xl mb-6 sticky top-2 z-30 shadow-lg border border-gray-700">
      <button 
        @click="currentTab = 'dashboard'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <LayoutDashboard class="w-4 h-4" />
        <span class="hidden sm:inline">Dashboard</span>
      </button>
      <button 
        @click="currentTab = 'backlog'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'backlog' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <Layers class="w-4 h-4" />
        <span class="hidden sm:inline">Backlog</span>
        <span v-if="backlogGames.length" class="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{{ backlogGames.length }}</span>
      </button>
      <button 
        @click="currentTab = 'completed'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'completed' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white']"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span class="hidden sm:inline">Completed</span>
        <span v-if="completedGames.length" class="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{{ completedGames.length }}</span>
      </button>
      <button 
        @click="currentTab = 'dropped'"
        :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all', currentTab === 'dropped' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white']"
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
            v-for="game in playingGames" 
            :key="game.id" 
            :game="game" 
            @click="openGameDetails(game.id)"
            @update-status="updateStatus"
            @delete="removeGame"
            class="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
          />
          <div v-if="playingGames.length === 0" class="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center text-gray-500 col-span-2">
            No games in progress. Start one from your backlog!
          </div>
        </div>
      </section>

      <!-- Backlog -->
      <section v-if="currentTab === 'backlog'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3">Backlog</h2>
        
        <!-- Pile of Shame Widget -->
        <div v-if="pileOfShameHours > 0" class="bg-red-900/20 border border-red-900/50 rounded-lg p-4 mb-4 flex items-center justify-between">
           <div>
              <h3 class="text-red-400 font-bold text-sm uppercase tracking-wider">Pile of Shame</h3>
              <p class="text-xs text-red-300">Total estimated playtime required</p>
           </div>
           <div class="text-2xl font-black text-white flex items-center gap-1">
               <Timer class="w-6 h-6 text-red-500" />
               {{ pileOfShameHours }}h
           </div>
        </div>

        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          <GameCard 
            v-for="game in backlogGames" 
            :key="game.id" 
            :game="game" 
            @click="openGameDetails(game.id)"
            @update-status="updateStatus"
            @delete="removeGame"
            class="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <div v-if="backlogGames.length === 0" class="text-center py-10 text-gray-500">
          Your backlog is empty. Time to find new games!
        </div>
      </section>

      <!-- Completed -->
      <section v-if="currentTab === 'completed'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3">Completed</h2>
        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          <div v-for="game in completedGames" :key="game.id" class="relative group cursor-pointer" @click="openGameDetails(game.id)">
            <GameCard 
              :game="game" 
              class="opacity-75 hover:opacity-100 transition-opacity hover:ring-2 hover:ring-green-500 shadow-sm"
              @update-status="updateStatus"
              @delete="removeGame"
            />
            <div class="absolute top-2 right-2 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded shadow pointer-events-none">
              DONE
            </div>
             <!-- Rating Badge -->
            <div v-if="game.rating" class="absolute bottom-16 right-2 flex bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded shadow pointer-events-none items-center gap-1">
              <span class="text-[10px]">★</span> {{ game.rating }}
            </div>
          </div>
        </div>
        <div v-if="completedGames.length === 0" class="text-center py-10 text-gray-500">
          No completed games yet. Keep playing!
        </div>
      </section>

      <!-- Dropped -->
      <section v-if="currentTab === 'dropped'" class="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <h2 class="text-lg font-bold text-gray-200 mb-3">Dropped Games</h2>
        <div class="grid grid-cols-[1fr_1fr] sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          <div v-for="game in droppedGames" :key="game.id" class="relative group cursor-pointer opacity-50 hover:opacity-100 transition-opacity" @click="openGameDetails(game.id)">
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
        <div v-if="droppedGames.length === 0" class="text-center py-10 text-gray-500">
          No dropped games. That's dedication!
        </div>
      </section>

    </main>

    <!-- FAB -->
    <button 
      @click="showAddModal = true"
      class="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl transition-transform active:scale-90 z-40 border-4 border-gray-900 group"
    >
      <Plus class="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
    </button>

    <!-- Modals -->
    <AddGameModal :is-open="showAddModal" @close="showAddModal = false" />
    
    <GameDetailModal 
      :is-open="showDetailModal" 
      :game-id="selectedGameId" 
      @close="showDetailModal = false"
      @update-status="updateStatus"
      @delete="removeGame"
    />

    <UpdatesModal :is-open="showUpdatesModal" @close="showUpdatesModal = false" />


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
</style>
