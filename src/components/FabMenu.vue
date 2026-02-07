<script setup>
import { ref } from 'vue';
import { Plus, Dices, ShoppingBag, Calendar, Trophy, Menu, X } from 'lucide-vue-next';

const isMenuOpen = ref(false);

const emit = defineEmits(['open-modal']);

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

const openModal = (modalName) => {
    emit('open-modal', modalName);
    isMenuOpen.value = false;
};

const menuButtons = [
    { id: 'addGame', label: 'Add Game', icon: Plus },
    { id: 'quest', label: 'Quest Giver', icon: Dices },
    { id: 'shop', label: 'Loot Shop', icon: ShoppingBag },
    { id: 'dailyLogin', label: 'Daily Bonus', icon: Calendar },
    { id: 'achievements', label: 'Achievements', icon: Trophy }
];

const getButtonStyle = (index) => {
    if (!isMenuOpen.value) {
        return {
            transform: `translateY(0) scale(0)`,
            opacity: 0,
            transitionDelay: '0ms'
        };
    }
    
    // Vertical Stack with Staggered Entrance
    // Gap: 7px (0.43rem) + 48px height = 55px step (tight)
    const step = 55; 
    const bottomOffset = 0; // Start AT bottom of wrapper (just above main button)

    
    const y = -1 * (bottomOffset + (index * step));

    return {
        transform: `translateY(${y}px) scale(1)`,
        opacity: 1,
        transitionDelay: `${index * 50}ms`
    };
};
</script>

<template>
    <!-- Backdrop to close when clicking outside -->
    <div v-if="isMenuOpen" @click="toggleMenu" class="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300"></div>

    <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none" @touchstart.stop>

        <!-- Fan-Out Menu Items (Now Vertical Stack) -->
        <div class="relative w-14 h-14"> <!-- Anchor for absolute positioning -->
             <button 
                v-for="(btn, index) in menuButtons" 
                :key="btn.id"
                @click="openModal(btn.id)"
                class="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white w-12 h-12 rounded-full shadow-lg border-2 border-gray-900 group transition-all duration-300 pointer-events-auto flex items-center justify-center z-40"
                :style="getButtonStyle(index)"
                :title="btn.label"
            >
                <!-- Tooltip on Left -->
                <div class="absolute right-14 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-gray-700">
                    {{ btn.label }}
                </div>
                <component :is="btn.icon" class="w-5 h-5" />
            </button>
        </div>

        <!-- Main Menu Button -->
        <button 
            @click="toggleMenu"
            class="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-2xl transition-all active:scale-90 border-4 border-gray-900 z-50 group pointer-events-auto"
        >
            <Menu class="w-8 h-8 transition-transform duration-300 scale-100 rotate-0" v-if="!isMenuOpen" />
            <X class="w-8 h-8 transition-transform duration-300 scale-100 rotate-90" v-else />
        </button>

    </div>
</template>
