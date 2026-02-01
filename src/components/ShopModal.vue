<script setup>
import { ref, computed } from 'vue';
import { X, ShoppingBag, Check, Lock, Coins, Palette, UserCircle, Sparkles, Image } from 'lucide-vue-next';
import { useShop } from '../composables/useShop';
import { useCardStyles } from '../composables/useCardStyles';
import AvatarFrame from './AvatarFrame.vue';
import GameCardInnerEffects from './GameCardInnerEffects.vue';
import prismBg from '@/assets/shop_background_prism.png';
import neonBg from '@/assets/shop_background_neon.png';

const props = defineProps({
  isOpen: Boolean
});

defineEmits(['close']);

const { SHOP_ITEMS, balance, buyItem, equipItem, isOwned, getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();

const activeTab = ref('theme'); // 'theme', 'frame', 'card_style', 'background'
const tabs = ['theme', 'frame', 'card_style', 'background'];

const filteredItems = computed(() => {
    return SHOP_ITEMS.filter(item => item.type === activeTab.value);
});

const currentEquippedId = computed(() => {
    const item = getEquippedItem(activeTab.value);
    return item ? item.id : null;
});

const handleAction = (item) => {
    if (isOwned(item.id)) {
        equipItem(item.id);
    } else {
        if (balance.value >= item.price) {
           const res = buyItem(item.id);
        }
    }
};

// Swipe Logic
const touchStartX = ref(0);
const touchStartY = ref(0);

const handleTouchStart = (e) => {
    touchStartX.value = e.changedTouches[0].screenX;
    touchStartY.value = e.changedTouches[0].screenY;
};

const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX.value - touchEndX;
    const diffY = touchStartY.value - touchEndY;

    // Ignore if vertical scroll was dominant
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    // Threshold
    if (Math.abs(diffX) < 50) return;

    const currentIndex = tabs.indexOf(activeTab.value);
    
    if (diffX > 0) { // Swipe Left -> Next Tab
        if (currentIndex < tabs.length - 1) activeTab.value = tabs[currentIndex + 1];
    } else { // Swipe Right -> Prev Tab
        if (currentIndex > 0) activeTab.value = tabs[currentIndex - 1];
    }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal with Swipe Handlers -->
    <div 
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        class="relative w-full max-w-2xl h-[70vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
    >
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur z-20 sticky top-0">
         <div class="flex items-center gap-3">
             <div class="bg-yellow-500/20 p-2 rounded-xl text-yellow-500">
                 <ShoppingBag class="w-6 h-6" />
             </div>
             <div>
                 <h2 class="text-xl font-black text-white uppercase tracking-wider">Loot Shop</h2>
                 <p class="text-xs text-gray-400">Spend your hard-earned coins.</p>
             </div>
         </div>
         
         <div class="flex items-center gap-4">
             <!-- Balance -->
             <div class="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                 <Coins class="w-4 h-4 text-yellow-400" />
                 <span class="font-mono font-bold text-white">{{ balance }}</span>
             </div>

             <button @click="$emit('close')" class="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                <X class="w-5 h-5" />
            </button>
         </div>
      </div>

      <!-- Navigation tabs -->
      <div class="flex p-2 gap-2 bg-gray-800/50 mx-6 mt-6 rounded-xl overflow-x-auto no-scrollbar">
          <button 
            @click="activeTab = 'theme'"
            class="flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            :class="activeTab === 'theme' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'"
          >
              <Palette class="w-4 h-4" /> Themes
          </button>
          <button 
            @click="activeTab = 'frame'"
            class="flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            :class="activeTab === 'frame' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'"
          >
              <UserCircle class="w-4 h-4" /> Frames
          </button>
          <button 
            @click="activeTab = 'card_style'"
            class="flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            :class="activeTab === 'card_style' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'"
          >
              <Sparkles class="w-4 h-4" /> Effects
          </button>
          <button 
            @click="activeTab = 'background'"
            class="flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            :class="activeTab === 'background' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'"
          >
              <Image class="w-4 h-4" /> BGs
          </button>
      </div>

      <!-- Content Grid -->
      <div class="overflow-y-auto p-4 flex-1 custom-scrollbar">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div 
                v-for="item in filteredItems" 
                :key="item.id"
                class="bg-gray-800/50 border border-gray-700 rounded-xl p-3 flex flex-col gap-2 group hover:border-gray-600 transition-colors relative overflow-hidden"
              >
                 <!-- Preview / Icon -->
                 <div class="h-20 rounded-lg bg-gray-900 flex items-center justify-center relative overflow-hidden">
                     
                     <!-- Theme Preview -->
                     <div v-if="item.type === 'theme'" class="w-full h-full flex items-center justify-center gap-2" :class="{
                         'bg-gradient-to-br from-gray-800 to-black': true
                     }">
                         <div class="w-6 h-6 rounded-full shadow-lg" :style="{ backgroundColor: `rgb(${
                            {
                                blue: '59 130 246', // blue-500
                                pink: '236 72 153', // pink-500
                                purple: '168 85 247', // purple-500
                                orange: '249 115 22', // orange-500
                                red: '239 68 68', // red-500
                                
                                // Enhanced Shop
                                cyberpunk: '6 182 212', // cyan-500
                                emerald: '16 185 129', // emerald-500
                                gold: '234 179 8', // yellow-500
                                
                                // New
                                lime: '132 204 22', 
                                teal: '20 184 166',
                                indigo: '99 102 241',
                                fuchsia: '217 70 239',
                                
                                // Neutral
                                brown: '120 53 15',
                                white: '229 231 235',
                                black: '75 85 99'
                            }[item.value] || '59 130 246'
                         })` }"></div>
                         <div class="w-10 h-3 rounded bg-gray-700"></div>
                     </div>

                     <!-- Frame Preview -->
                     <div v-if="item.type === 'frame'" class="flex items-center justify-center">
                         <AvatarFrame :frame="item.value" size="sm" />
                     </div>

                     <!-- Card Style Preview -->
                     <div v-if="item.type === 'card_style'" 
                          class="w-16 h-10 rounded relative overflow-hidden group transition-all duration-300"
                          :class="getCardClasses(item.value)"
                     >
                         <!-- Content Mock -->
                         <div class="absolute top-1 left-1 w-8 h-1 bg-gray-600 rounded-full z-20 opacity-50"></div>
                         <div class="absolute bottom-1 right-1 w-4 h-4 bg-gray-700 rounded-full z-20 opacity-50"></div>

                         <!-- Inner Effects -->
                         <GameCardInnerEffects :style-name="item.value" size="sm" />

                         <!-- Prism Special Preview (Emulate Outer Border inside container) -->
                         <div v-if="item.value === 'prism'" class="absolute inset-0 bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 p-[2px] animate-spin-slow z-0">
                             <div class="w-full h-full bg-gray-900 rounded-[inherit]"></div>
                         </div>
                     </div>

                     <!-- Background Preview -->
                     <div v-if="item.type === 'background'" class="w-full h-full border border-gray-700 relative overflow-hidden">
                         <!-- Mini App Interface Mockup -->
                         <div class="absolute inset-0 z-0 bg-gray-900">
                             <div v-if="item.value === 'stars'" class="w-full h-full bg-[radial-gradient(white,transparent_2px)] bg-[size:15px_15px] opacity-70"></div>
                             <div v-if="item.value === 'grid'" class="w-full h-full bg-gray-900 bg-[linear-gradient(rgba(0,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.2)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                             
                             <div v-if="item.value === 'synthwave'" class="w-full h-full bg-[#1a0b2e] relative overflow-hidden">
                                  <!-- Sun -->
                                  <div class="absolute top-[15%] left-[50%] -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-pink-500 shadow-[0_0_10px_#ff0055]"></div>
                                  <!-- Grid -->
                                  <div class="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(rgba(255,0,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,255,0.4)_1px,transparent_1px)] bg-[size:10px_10px] [transform:perspective(50px)_rotateX(60deg)] origin-bottom"></div>
                             </div>

                             <div v-if="item.value === 'prism_bg'" class="w-full h-full bg-cover bg-center" :style="{ backgroundImage: `url(${prismBg})` }"></div>
                             <div v-if="item.value === 'neon_bg'" class="w-full h-full bg-cover bg-center" :style="{ backgroundImage: `url(${neonBg})` }"></div>

                             <div v-if="item.value === 'matrix'" class="w-full h-full bg-black border border-gray-700">
                                 <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
                                     <text x="50" y="25" fill="#22c55e" font-family="monospace" font-size="25" text-anchor="middle" font-weight="bold">1 0 1</text>
                                     <text x="50" y="50" fill="#22c55e" font-family="monospace" font-size="25" text-anchor="middle" font-weight="bold" opacity="0.6">0 1 0</text>
                                 </svg>
                             </div>
                             
                             <div v-if="item.value === 'hex'" class="w-full h-full bg-gray-800" style="background-image: url('data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 28 49\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5z\' fill=\'%23ffffff\' fill-opacity=\'0.2\'/%3E%3C/svg%3E')"></div>
                             
                             <div v-if="item.value === 'aurora'" class="w-full h-full bg-slate-900 relative overflow-hidden">
                                 <div class="absolute top-[-10%] left-[-10%] w-10 h-10 bg-teal-400 rounded-full blur-md opacity-60"></div>
                                 <div class="absolute top-[-10%] right-[-10%] w-12 h-12 bg-fuchsia-500 rounded-full blur-md opacity-60"></div>
                             </div>

                             <div v-if="item.value === 'pulse'" class="w-full h-full bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                 <div class="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                                 <div class="w-full h-[1px] bg-blue-500/50"></div>
                             </div>

                             <div v-if="item.value === 'dots'" class="w-full h-full bg-[radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:6px_6px] bg-gray-900"></div>
                             <div v-if="item.value === 'circuit'" class="w-full h-full bg-[radial-gradient(rgba(0,255,0,0.2)_1px,transparent_1px)] bg-[size:8px_8px] opacity-70"></div>
                         </div>
                         <!-- Overlay Content Mock -->
                         <div class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                             <div class="w-12 h-16 bg-gray-800 rounded shadow-lg border border-gray-600"></div>
                         </div>
                     </div>
                 </div>

                 <!-- Info -->
                 <div>
                     <h3 class="font-bold text-white text-sm truncate">{{ item.name }}</h3>
                     <p class="text-[10px] text-gray-400 truncate">{{ item.description }}</p>
                 </div>

                 <!-- Action Button -->
                 <button 
                    @click="handleAction(item)"
                    class="mt-auto w-full py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
                    :class="[
                        currentEquippedId === item.id 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' 
                            : isOwned(item.id)
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : balance >= item.price
                                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    ]"
                    :disabled="!isOwned(item.id) && balance < item.price"
                 >
                     <span v-if="currentEquippedId === item.id" class="flex items-center gap-1"><Check class="w-3 h-3" /> Equipped</span>
                     <span v-else-if="isOwned(item.id)">Equip</span>
                     <span v-else class="flex items-center gap-1">
                         {{ item.price }} <Coins class="w-3 h-3" />
                     </span>
                 </button>

              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}
.animate-spin-slow {
    animation: spin 8s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
@keyframes holo {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
}
.animate-holo {
    animation: holo 3s ease infinite;
}
@keyframes shine {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
}
.animate-shine {
    animation: shine 3s ease infinite;
}
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
