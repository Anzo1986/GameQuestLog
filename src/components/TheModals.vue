<script setup>
import { useModals } from '../composables/useModals';
import { useGames } from '../composables/useGames'; 

// Import all modals
import AddGameModal from './AddGameModal.vue';
import GameDetailModal from './GameDetailModal.vue';
import SettingsSection from './SettingsSection.vue';
import StatsModal from './StatsModal.vue';
import QuestGiverModal from './QuestGiverModal.vue';
import AchievementsModal from './AchievementsModal.vue';
import TimelineModal from './TimelineModal.vue';
import GamerCardModal from './GamerCardModal.vue';
import LevelUpOverlay from './LevelUpOverlay.vue';
import VictoryOverlay from './VictoryOverlay.vue';
import ShopModal from './ShopModal.vue';

const { activeModal, modalProps, openModal } = useModals(); // Added openModal
const { updateStatus, removeGame, userLevel, userTitle } = useGames();


// Bridge events from modals to useGames or other logic
const handleClose = () => {
    // Usually handled by popstate which calls resetModal, but some modals emit 'close'
    // We should triggering history.back() if they emit close?
    // Or if the user clicked "X", they expect it to close.
    // openModal pushed state. So we need history.back().
    // We can use the exported closeModal from useModals in the template? No, cycle?
    history.back(); 
};

// Special Handlers
</script>

<template>
  <div>
    <AddGameModal :is-open="activeModal === 'addGame'" @close="handleClose" />

    <GameDetailModal 
      v-if="activeModal === 'gameDetail'" 
      :is-open="true"
      :game-id="modalProps.gameId" 
      @close="handleClose"
      @update-status="modalProps.onUpdateStatus" 
      @delete="removeGame"
    />

    <SettingsSection v-if="activeModal === 'settings'" @close="handleClose" />
    
    <StatsModal v-if="activeModal === 'stats'" :is-open="true" @close="handleClose" @open-timeline="openModal('timeline')" /> 

    <QuestGiverModal v-if="activeModal === 'quest'" :is-open="true" @close="handleClose" />
    
    <AchievementsModal v-if="activeModal === 'achievements'" :is-open="true" @close="handleClose" />
    
    <TimelineModal v-if="activeModal === 'timeline'" :is-open="true" @close="handleClose" />
    
    <GamerCardModal v-if="activeModal === 'gamerCard'" :is-open="true" @close="handleClose" />
    
    <ShopModal v-if="activeModal === 'shop'" :is-open="true" @close="handleClose" />

    <!-- Overlays -->
    <LevelUpOverlay v-if="activeModal === 'levelUp'" :level="userLevel" :title="userTitle" @close="handleClose" />
    
    <VictoryOverlay 
        v-if="activeModal === 'victory'" 
        :game="modalProps.game" 
        :xp-gained="modalProps.xpGained" 
        @close="handleClose" 
    />
  </div>
</template>
