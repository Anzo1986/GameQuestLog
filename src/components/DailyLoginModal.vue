<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDailyLogin } from '../composables/useDailyLogin';
import { useShop } from '../composables/useShop';
import { useCardStyles } from '../composables/useCardStyles';
import GameCardInnerEffects from './GameCardInnerEffects.vue';
import BaseModal from './BaseModal.vue';
import { X, Coins, Check, Zap } from 'lucide-vue-next';

const props = defineProps({
    isOpen: Boolean
});

const emit = defineEmits(['close']);

const { checkLogin, claimBonus } = useDailyLogin();
const { getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();
const equippedStyle = computed(() => getEquippedItem('card_style'));

const currentStatus = ref({ streak: 1 });
const justClaimed = ref(false);
const rewardAmount = ref(0);
const xpAmount = ref(0);
const particles = ref([]);

const cycleDay = computed(() => {
    return (currentStatus.value.streak - 1) % 30 + 1;
});

onMounted(() => {
    const status = checkLogin();
    currentStatus.value = status;
    
    // Check pending reward based on CYCLE
    const s = status.streak;
    const dayInCycle = (s - 1) % 30 + 1;

    if (status.claimed) {
        justClaimed.value = true;
    }
    
    // Init expected reward display
    if (dayInCycle % 5 === 0 && dayInCycle !== 30) {
        // XP Day
        rewardAmount.value = 0;
        xpAmount.value = dayInCycle * 10;
    } else if (dayInCycle === 30) {
        // Big Coin Day
        rewardAmount.value = 100;
        xpAmount.value = 0;
    } else {
        // Normal Coin Day
        rewardAmount.value = 5;
        xpAmount.value = 0;
    }
});

const days = Array.from({ length: 30 }, (_, i) => i + 1);

const handleClaim = () => {
    try {
        const result = claimBonus();
        console.log('Claim Result:', result); // Debug log

        if (result.success) {
            // Fire Custom Animation
            const count = 12;
            for (let i = 0; i < count; i++) {
                particles.value.push({
                    id: i,
                    x: 50 + (Math.random() * 40 - 20), // 30-70%
                    y: 80, // Start near button
                    delay: Math.random() * 0.5,
                    type: 'coin'
                });
            }
            
            // Add XP particles if XP was gained
            if (result.xp > 0) {
                for (let i = 0; i < 8; i++) {
                    particles.value.push({
                        id: `xp-${i}`,
                        x: 50 + (Math.random() * 40 - 20),
                        y: 80,
                        delay: Math.random() * 0.5,
                        type: 'xp'
                    });
                }
            }

            justClaimed.value = true;
            rewardAmount.value = result.reward;
            xpAmount.value = result.xp || 0;
            currentStatus.value.streak = result.streak; // update visuals
            
            // Auto close after 2 seconds
            setTimeout(() => {
                emit('close');
                particles.value = []; // Reset
            }, 2000);
        } else {
            console.warn('Claim failed:', result.message);
            if (result.message === 'Already claimed') {
                justClaimed.value = true; // Sync UI if inconsistent
            }
        }
    } catch (error) {
        console.error('Error claiming bonus:', error);
    }
};

const getDayClass = (day) => {
    const current = cycleDay.value; // Use 1-30 cycle
    
    if (justClaimed.value) {
        if (day <= current) return 'bg-yellow-500/20 border-yellow-500 text-yellow-500'; // Past & Current (Claimed)
        return 'bg-gray-800 border-gray-700 text-gray-500'; // Future
    } else {
        if (day < current) return 'bg-yellow-500/20 border-yellow-500 text-yellow-500'; // Past
        if (day === current) return 'bg-primary/20 border-primary text-primary animate-pulse'; // Today (Target)
        return 'bg-gray-800 border-gray-700 text-gray-500'; // Future
    }
};
</script>

<template>
  <BaseModal :is-open="isOpen" @close="$emit('close')" max-width="max-w-lg">
      <div 
        class="relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
        :class="getCardClasses(equippedStyle?.value)"
      >
        <!-- PRISM BORDER ANIMATION (Behind) -->
        <div v-if="equippedStyle?.value === 'prism'" class="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0 animate-spin-slow opacity-80 blur-sm pointer-events-none"></div>
        <div v-if="equippedStyle?.value === 'prism'" class="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 z-0 animate-spin-slow pointer-events-none"></div>
        
        <GameCardInnerEffects :style-name="equippedStyle?.value" />

        <!-- Content Wrapper -->
        <div class="relative z-10 w-full h-full flex flex-col bg-gray-900/0">
        
        <!-- Header -->
        <div class="p-6 bg-gray-800/50 border-b border-gray-700 flex justify-between items-center">
            <div>
                <h2 class="text-xl font-black text-white flex items-center gap-2">
                    <Coins class="w-5 h-5 text-yellow-400" /> Daily Bonus
                    <span class="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/50">Streak: {{ currentStatus.streak }}</span>
                </h2>
                <p class="text-gray-400 text-xs">Login daily to keep your streak alive!</p>
            </div>
            <button @click="$emit('close')" class="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors active:scale-95">
                <!-- Keep this one? BaseModal only adds if title/header prop used. DailyLogin uses default slot? --> 
                <!-- Wait, DailyLoginModal.vue uses BaseModal WITHOUT title/header props? -->
                <!-- Let's check DailyLoginModal's usage of BaseModal in previous turns (Step 219) -->
                <!-- It uses: <BaseModal ...> <div class="relative ..."> ... -->
                <!-- So BaseModal sees NO title and NO header slot. It falls back to ABSOLUTE close button (lines 45-51 of BaseModal). -->
                <!-- DailyLoginModal has its OWN header structure inside the default slot. -->
                <!-- This means we have TWO close buttons: one from BaseModal (absolute top-right) and one inside the custom header. -->
                <!-- Solution: Identify if we want BaseModal's absolute one or our custom one. -->
                <!-- The custom one is integrated into the "Daily Bonus" header row. -->
                <!-- BaseModal's absolute one is top:4 right:4. -->
                <!-- If I remove the one in DailyLoginModal, I rely on BaseModal's. -->
                <!-- Let's remove the one in DailyLoginModal and see if BaseModal's positioning works. -->
                <!-- Actually, strictly following "remove duplicate", I should remove this one. -->
                 <!-- BUT wait, I can pass the custom header TO the header slot to fix this properly? -->
                 <!-- If I move the header content to #header slot, BaseModal handles the close button. -->
                 <!-- However, simpler change is just remove duplicate. I'll remove this one. -->
                 <!-- Wait, if I remove this one, will the layout break? It is flex-between. -->
                 <!-- If I remove the button, the text stays left. That is fine. -->
            </button>
        </div>

        <!-- Grid -->
        <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div class="grid grid-cols-5 gap-2 sm:gap-3">
                <div 
                    v-for="day in days" 
                    :key="day"
                    class="aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all"
                    :class="getDayClass(day)"
                >
                    <span class="text-xs font-bold mb-1">Day {{ day }}</span>
                    
                    <div v-if="day === 30" class="flex flex-col items-center">
                         <Coins class="w-6 h-6 sm:w-8 sm:h-8 mb-1" :class="day <= cycleDay ? 'text-yellow-400' : 'text-gray-600'" />
                         <span class="text-[10px] font-black">100</span>
                    </div>
                     <!-- XP Milestones -->
                    <div v-else-if="[5, 10, 15, 20, 25].includes(day)" class="flex flex-col items-center">
                         <Zap class="w-4 h-4 sm:w-5 sm:h-5 mb-1" :class="day <= cycleDay ? 'text-blue-400' : 'text-gray-600'" />
                         <span class="text-[10px] font-black">{{ day * 10 }} XP</span>
                    </div>
                    <div v-else class="flex flex-col items-center">
                         <Coins class="w-4 h-4 sm:w-5 sm:h-5 mb-1" :class="day <= cycleDay ? 'text-yellow-400' : 'text-gray-600'" />
                         <span class="text-[10px] font-bold">5</span>
                    </div>

                    <!-- Checkmark for past days -->
                    <div v-if="day < cycleDay || (justClaimed && day === cycleDay)" class="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <Check class="w-6 h-6 text-green-400 drop-shadow-md" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer Action -->
        <div class="p-6 pt-0 mt-auto">
            <button 
                v-if="!justClaimed"
                @click="handleClaim"
                class="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                Claim Reward
            </button>
            <div v-else class="w-full py-4 text-center">
                <p class="text-xl font-bold text-green-400 animate-bounce flex flex-col items-center">
                    <span v-if="rewardAmount > 0">+{{ rewardAmount }} Coins!</span>
                    <span v-if="xpAmount > 0" class="text-blue-400 text-sm mt-1">+{{ xpAmount }} XP!</span>
                </p>
            </div>
        </div>

        </div> <!-- End Content Wrapper -->
    </div>
      <!-- Particles Layer -->
      <div v-if="particles.length > 0" class="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
          <div 
              v-for="p in particles" 
              :key="p.id"
              class="absolute animate-float-up"
              :style="{
                  left: p.x + '%',
                  top: p.y + '%',
                  animationDelay: p.delay + 's'
              }"
          >
              <Coins v-if="p.type === 'coin'" class="w-6 h-6 text-yellow-400 drop-shadow-lg" fill="currentColor" />
              <Zap v-if="p.type === 'xp'" class="w-6 h-6 text-blue-400 drop-shadow-lg" fill="currentColor" />
          </div>
      </div>
  </BaseModal>
</template>

<style scoped>
@keyframes floatUp {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
    100% { transform: translateY(-200px) scale(1); opacity: 0; }
}
.animate-float-up {
    animation: floatUp 1.5s ease-out forwards;
}
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
}
</style>
