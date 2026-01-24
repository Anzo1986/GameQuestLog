<script setup>
import { ref, watch, nextTick } from 'vue';
import { Edit2, Trophy, Crown } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const { userName, userLevel, userTitle, xpProgress, setUserName } = useGames();

const isEditing = ref(false);
const editName = ref(userName.value);
const nameInput = ref(null);

const startEditing = () => {
    isEditing.value = true;
    editName.value = userName.value;
    nextTick(() => {
        nameInput.value?.focus();
    });
};

const saveName = () => {
    if (editName.value.trim()) {
        setUserName(editName.value.trim());
    }
    isEditing.value = false;
};

// Handle generic click outside if needed, or just blur/enter
</script>

<template>
  <div class="bg-gradient-to-r from-blue-900 to-gray-900 rounded-xl p-6 shadow-xl relative overflow-hidden mb-6 border border-blue-800">
    <!-- Decorative Circle -->
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

    <div class="relative z-10 flex items-center justify-between gap-4">
        
        <!-- Left: Avatar & Level -->
        <div class="flex items-center gap-4">
            <div class="relative">
                <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-lg">
                    <Trophy class="w-8 h-8 text-yellow-500" />
                </div>
                <div class="absolute -bottom-2 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-900">
                    Lvl {{ userLevel }}
                </div>
            </div>

            <div>
                 <div class="flex items-center gap-2">
                    <h2 v-if="!isEditing" class="text-xl font-bold text-white tracking-tight" @click="startEditing">{{ userName }}</h2>
                    <input 
                        v-else
                        ref="nameInput"
                        v-model="editName"
                        @blur="saveName"
                        @keyup.enter="saveName"
                        class="bg-gray-800/50 text-white rounded px-2 py-0.5 outline-none border border-blue-500 w-32"
                    />
                    <button v-if="!isEditing" @click="startEditing" class="text-gray-400 hover:text-white transition-colors">
                        <Edit2 class="w-3 h-3" />
                    </button>
                 </div>
                 <div class="flex items-center gap-1 text-sm text-yellow-400 font-medium mt-0.5">
                     <Crown class="w-3 h-3" />
                     <span>{{ userTitle }}</span>
                 </div>
            </div>
        </div>

        <!-- Right: XP Bar (Hidden on super small screens maybe, but Mobile-first so keep it responsive) -->
    </div>

    <!-- XP Bar -->
    <div class="mt-4">
        <div class="flex justify-between text-xs text-blue-200 mb-1">
            <span>Progress</span>
            <span>{{ Math.floor(xpProgress) }}%</span>
        </div>
        <div class="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
            <div 
                class="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative"
                :style="{ width: `${xpProgress}%` }"
            >
                <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
        </div>
    </div>

  </div>
</template>
