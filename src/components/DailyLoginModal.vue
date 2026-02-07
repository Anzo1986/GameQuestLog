<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDailyLogin } from '../composables/useDailyLogin';
import { useShop } from '../composables/useShop';
import { useCardStyles } from '../composables/useCardStyles';
import GameCardInnerEffects from './GameCardInnerEffects.vue';
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

onMounted(() => {
    const status = checkLogin();
    currentStatus.value = status;
    if (status.claimed) {
        justClaimed.value = true;
        
        // Correctly init display values based on streak
        const s = status.streak;
        if (s % 5 === 0 && s !== 30) {
            // XP Day
            rewardAmount.value = 0;
            xpAmount.value = s * 10;
        } else if (s === 30) {
            // Big Coin Day
            rewardAmount.value = 100;
            xpAmount.value = 0;
        } else {
            // Normal Coin Day
            rewardAmount.value = 5;
            xpAmount.value = 0;
        }
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
    const current = currentStatus.value.streak;
    
    // If we just claimed, we want "current" to show as claimed.
    // If not claimed yet (justClaimed false), "current" is the active target.
    
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
  <div v-if="isOpen" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <div class="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300 isolation-auto"
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
                <h2 class="text-2xl font-black text-white flex items-center gap-2">
                    <Coins class="w-6 h-6 text-yellow-400" /> Daily Bonus
                </h2>
                <p class="text-gray-400 text-sm">Login daily to build your streak!</p>
            </div>
            <button @click="$emit('close')" class="p-2 hover:bg-gray-700 rounded-full text-gray-400">
                <X class="w-6 h-6" />
            </button>
        </div>

        <!-- Grid -->
        <div class="p-6 overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-5 gap-2 sm:gap-3">
                <div 
                    v-for="day in days" 
                    :key="day"
                    class="aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all"
                    :class="getDayClass(day)"
                >
                    <span class="text-xs font-bold mb-1">Day {{ day }}</span>
                    
                    <div v-if="day === 30" class="flex flex-col items-center">
                         <Coins class="w-6 h-6 sm:w-8 sm:h-8 mb-1" :class="day <= currentStatus.streak ? 'text-yellow-400' : 'text-gray-600'" />
                         <span class="text-[10px] font-black">100</span>
                    </div>
                     <!-- XP Milestones -->
                    <div v-else-if="[5, 10, 15, 20, 25].includes(day)" class="flex flex-col items-center">
                         <Zap class="w-4 h-4 sm:w-5 sm:h-5 mb-1" :class="day <= currentStatus.streak ? 'text-blue-400' : 'text-gray-600'" />
                         <span class="text-[10px] font-black">{{ day * 10 }} XP</span>
                    </div>
                    <div v-else class="flex flex-col items-center">
                         <Coins class="w-4 h-4 sm:w-5 sm:h-5 mb-1" :class="day <= currentStatus.streak ? 'text-yellow-400' : 'text-gray-600'" />
                         <span class="text-[10px] font-bold">5</span>
                    </div>

                    <!-- Checkmark for past days -->
                    <div v-if="day < currentStatus.streak || (justClaimed && day === currentStatus.streak)" class="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
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
  </div>
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
</style>
