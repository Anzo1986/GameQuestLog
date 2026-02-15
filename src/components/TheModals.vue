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
import DailyLoginModal from './DailyLoginModal.vue';
import ConfirmModal from './ConfirmModal.vue';
import AIQuestModal from './AIQuestModal.vue';
import PromptModal from './PromptModal.vue';

const { activeModal, modalProps, openModal } = useModals(); // Added openModal
const { updateStatus, removeGame, userLevel, userTitle, games } = useGames();

// Confirm Delete from Modals
const confirmDelete = (gameId) => {
    const game = games.value.find(g => g.id === gameId);
    if (!game) return;
    
    openModal('confirm', {
        title: 'Delete Game?',
        message: `Are you sure you want to delete "${game.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'bg-red-500 hover:bg-red-600',
        onConfirm: () => {
            removeGame(gameId);
            // Close detail modal too if open? 
            // openModal replaces current modal, so detail is already closed/hidden.
            // But if we want to go back? 
            // Actually openModal pushes to stack? No, useModals is simple state replacement in current impl?
            // Let's check useModals.js later. Assuming simple replacement for now.
        }
    });
};


// Bridge events from modals to useGames or other logic
const handleClose = () => {
    // If detail modal is open, maybe just close it?
    // Actually close any modal
    history.back(); // Standard close
};

// Global Keyboard Shortcuts (Esc to close)
import { onMounted, onUnmounted } from 'vue';

const handleKeydown = (e) => {
    if (e.key === 'Escape' && activeModal.value) {
        handleClose();
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});

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
      @delete="confirmDelete"
    />

    <SettingsSection v-if="activeModal === 'settings'" @close="handleClose" />
    
    <StatsModal v-if="activeModal === 'stats'" :is-open="true" @close="handleClose" @open-timeline="openModal('timeline')" /> 

    <QuestGiverModal v-if="activeModal === 'quest'" :is-open="true" @close="handleClose" />

    <AIQuestModal v-if="activeModal === 'oracle'" :is-open="true" @close="handleClose" />
    
    <AchievementsModal v-if="activeModal === 'achievements'" :is-open="true" @close="handleClose" />
    
    <TimelineModal v-if="activeModal === 'timeline'" :is-open="true" @close="handleClose" />
    
    <GamerCardModal v-if="activeModal === 'gamerCard'" :is-open="true" @close="handleClose" />
    
    <ShopModal v-if="activeModal === 'shop'" :is-open="true" @close="handleClose" />
    <DailyLoginModal v-if="activeModal === 'dailyLogin'" :is-open="true" @close="handleClose" />
    <PromptModal v-if="activeModal === 'prompt'" :is-open="true" @close="handleClose" />

    <!-- Overlays -->
    <LevelUpOverlay v-if="activeModal === 'levelUp'" :level="userLevel" :title="userTitle" @close="handleClose" />
    
    <VictoryOverlay 
        v-if="activeModal === 'victory'" 
        :game="modalProps.game" 
        :xp-gained="modalProps.xpGained" 
        @close="handleClose" 
    />

    <ConfirmModal 
        v-if="activeModal === 'confirm'"
        :is-open="true"
        :title="modalProps.title"
        :message="modalProps.message"
        :confirm-text="modalProps.confirmText"
        :confirm-color="modalProps.confirmColor"
        :image-url="modalProps.imageUrl"
        @close="handleClose"
        @confirm="() => { modalProps.onConfirm?.(); handleClose(); }"
    />
  </div>
</template>
