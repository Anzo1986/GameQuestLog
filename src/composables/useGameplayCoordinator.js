import { ref, watch } from 'vue';
import { useGames } from './useGames';
import { useModals } from './useModals';

export function useGameplayCoordinator() {
    const { userLevel, games, updateStatus } = useGames();
    const { openModal, activeModal } = useModals();

    const pendingLevelUp = ref(false);

    // Watch Level Up
    watch(userLevel, (newVal, oldVal) => {
        if (newVal > oldVal) {
            if (activeModal.value === 'victory') {
                pendingLevelUp.value = true;
            } else {
                openModal('levelUp');
            }
        }
    });

    // Handle Pending Level Up after Victory closes
    watch(activeModal, (newVal, oldVal) => {
        if (oldVal === 'victory' && newVal !== 'victory' && pendingLevelUp.value) {
            setTimeout(() => {
                openModal('levelUp');
                pendingLevelUp.value = false;
            }, 500);
        }
    });

    // Intercept Status Updates for Victory Modal
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

    return {
        handleUpdateStatus
    };
}
