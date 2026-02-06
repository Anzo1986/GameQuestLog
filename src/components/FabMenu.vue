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
</script>

<template>
    <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none" @touchstart.stop>

        <!-- Initial Actions (Hidden by default, slide up when menu open) -->
        <div class="flex flex-col gap-3 transition-all duration-300 origin-bottom pointer-events-auto" :class="isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-0 pointer-events-none'">
             
             <!-- Add Game -->
            <button 
                @click="openModal('addGame')"
                class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Add Game</div>
                <Plus class="w-6 h-6" />
            </button>

            <!-- Quest Giver -->
            <button 
               @click="openModal('quest')"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Quest Giver</div>
                <Dices class="w-6 h-6" />
            </button>

            <!-- Shop -->
            <button 
               @click="openModal('shop')"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Loot Shop</div>
                <ShoppingBag class="w-6 h-6" />
            </button>

            <!-- Daily Bonus -->
            <button 
               @click="openModal('dailyLogin')"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Daily Bonus</div>
                <Calendar class="w-6 h-6" />
            </button>

            <!-- Achievements -->
            <button 
               @click="openModal('achievements')"
               class="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg border-2 border-gray-900 group transition-all"
            >
                <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 absolute right-16 transition-opacity whitespace-nowrap pointer-events-none">Achievements</div>
                <Trophy class="w-6 h-6" />
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
