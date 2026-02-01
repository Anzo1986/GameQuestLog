<script setup>
import { ref, computed } from 'vue';
import { X, Download, Share2, Crown, Trophy, Clock, Target, Loader2 } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useAchievements } from '../composables/useAchievements';
import { useSettings } from '../composables/useSettings';
import { toPng } from 'html-to-image';
const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { userName, userLevel, userTitle, userAvatar, gameStats } = useGames();
const { themeColor, THEMES } = useSettings();
const { trackAction } = useAchievements();

const primaryColorRgbSafe = computed(() => {
    const raw = THEMES[themeColor.value]?.rgb || '59 130 246';
    return raw.replace(/ /g, ',');
});

const isGenerating = ref(false);
const cardRef = ref(null);

const topGenres = computed(() => {
    if (!gameStats.value) return [];
    return Object.entries(gameStats.value.genreCounts)
        .sort((a, b) => b[1] - a[1]) // Sort desc
        .slice(0, 3) // Top 3
        .map(e => e[0]);
});

const downloadCard = async () => {
    isGenerating.value = true;
    
    try {
        if (!cardRef.value) return;

        // Use html-to-image to capture the DOM exactly as rendered
        const dataUrl = await toPng(cardRef.value, {
            quality: 1.0,
            pixelRatio: 2, // 2x resolution for better quality
            filter: (node) => {
                // Exclude any elements if needed (optional)
                return true;
            },
            skipFonts: true // Prevent CORS errors from external fonts (we use Arial)
        });

        const link = document.createElement('a');
        link.download = `GamerCard-${userName.value}.png`;
        link.href = dataUrl;
        link.click();

        // Track Achievement
        trackAction('download_card');

    } catch (err) {
        console.error('Failed to generate card', err);
        alert('Could not generate image. Please try again.');
    } finally {
        isGenerating.value = false;
    }
};

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-lg flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
        
        <!-- Controls -->
        <div class="flex justify-between items-center text-white relative z-50">
            <h2 class="text-xl font-bold">Your Gamer Card</h2>
            <button @click="$emit('close')" class="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                <X class="w-6 h-6" />
            </button>
        </div>

        <!-- The Card (Capture Target) -->
        <div 
            ref="cardRef" 
            class="rounded-3xl border shadow-2xl relative select-none w-full flex flex-col"
            style="background-color: #111827; border-color: #374151; font-family: Arial, sans-serif; overflow: visible;"
        >
            <!-- Background Decoration -->
            <div class="absolute inset-0 z-0" style="background: linear-gradient(to bottom right, rgba(49, 46, 129, 0.3), rgba(88, 28, 135, 0.1), #111827); border-radius: 1.5rem; overflow: hidden; pointer-events: none;"></div>
            <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full" :style="{ background: `rgba(${primaryColorRgbSafe}, 0.2)`, filter: 'blur(80px)', pointerEvents: 'none' }"></div>
            <div class="absolute -bottom-20 -left-20 w-64 h-64 rounded-full" style="background: rgba(147, 51, 234, 0.2); filter: blur(80px); pointer-events: none;"></div>

            <!-- Header: Avatar & Name -->
            <div class="relative z-10 p-8 flex flex-col items-center border-b" style="border-color: rgba(31, 41, 55, 0.5); background-color: rgba(17, 24, 39, 0.3); border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem;">
                <!-- Avatar Wrapper: Separation of Layout and Image -->
                <div class="relative mb-4" style="width: 96px; height: 96px;">
                    <!-- The Circle Border & Image -->
                    <div style="width: 100%; height: 100%; border-radius: 50%; border: 4px solid #eab308; overflow: hidden; background-color: #1f2937; position: relative;">
                         <img 
                            v-if="userAvatar" 
                            :src="userAvatar" 
                            crossOrigin="anonymous" 
                            style="width: 100%; height: 100%; object-fit: cover; display: block;"
                         />
                         <div v-else class="w-full h-full flex items-center justify-center">
                            <Crown class="w-12 h-12" style="color: #eab308; width: 48px; height: 48px;" />
                         </div>
                    </div>
                    <!-- Level Badge: Positioned absolute over the border -->
                    <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); background-color: #1f2937; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 999px; border: 1px solid #374151; white-space: nowrap; z-index: 20;">
                        Lvl {{ userLevel }}
                    </div>
                </div>
                
                <h2 class="text-3xl font-black tracking-tight text-center leading-none mb-1" style="color: #ffffff; white-space: nowrap;">
                    {{ userName }}
                </h2>
                <p class="font-bold uppercase tracking-widest text-xs flex items-center gap-1" style="color: #facc15; white-space: nowrap;">
                    <Crown class="w-3 h-3" style="width: 12px; height: 12px;" /> {{ userTitle }}
                </p>
            </div>

            <!-- Stats Grid -->
            <div class="relative z-10 p-6 grid grid-cols-2 gap-4 flex-1 content-center" v-if="gameStats">
                <!-- Completion -->
                <div class="rounded-2xl p-4 flex flex-col items-center justify-center text-center border" style="background-color: rgba(31, 41, 55, 0.5); border-color: #374151;">
                    <Trophy class="w-6 h-6 mb-1" style="color: #4ade80; width: 24px; height: 24px;" />
                    <span class="text-2xl font-bold" style="color: #ffffff;">{{ gameStats.completionRate }}%</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider" style="color: #6b7280; white-space: nowrap;">Completion</span>
                </div>

                <!-- Games -->
                <div class="rounded-2xl p-4 flex flex-col items-center justify-center text-center border" style="background-color: rgba(31, 41, 55, 0.5); border-color: #374151;">
                    <Target class="w-6 h-6 mb-1" style="color: #60a5fa; width: 24px; height: 24px;" />
                    <span class="text-2xl font-bold" style="color: #ffffff;">{{ gameStats.totalGames }}</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider" style="color: #6b7280; white-space: nowrap;">Games Logged</span>
                </div>

                <!-- Playtime -->
                <div class="rounded-2xl p-4 flex flex-col items-center justify-center text-center border col-span-2" style="background-color: rgba(31, 41, 55, 0.5); border-color: #374151;">
                     <Clock class="w-6 h-6 mb-1" :style="{ color: `rgb(${primaryColorRgbSafe})`, width: '24px', height: '24px' }" />
                     <div class="flex items-baseline gap-1">
                        <span class="text-3xl font-black" style="color: #ffffff;">{{ gameStats.totalDurationDays }}</span>
                        <span class="text-sm font-medium" style="color: #9ca3af;">Days</span>
                     </div>
                     <span class="text-[10px] uppercase font-bold tracking-wider" style="color: #6b7280; white-space: nowrap;">Life devoted to gaming</span>
                </div>
            </div>

            <!-- Footer: Top Genres -->
            <div class="relative z-10 p-6 pt-0 mt-auto">
                 <p class="text-center text-xs uppercase font-bold mb-3 tracking-widest" style="color: #6b7280;">Top Genres</p>
                 <div class="flex justify-center gap-2 flex-wrap">
                     <span v-for="tag in topGenres" :key="tag" class="px-3 py-1 border rounded-full text-xs font-medium shadow-sm" style="background-color: #1f2937; border-color: #374151; color: #d1d5db; display: inline-block; padding: 4px 12px; white-space: nowrap;">
                         {{ tag }}
                     </span>
                     <span v-if="topGenres.length === 0" class="text-xs italic" style="color: #4b5563;">No data yet</span>
                 </div>
                 
                 <!-- Logo Watermark -->
                 <div class="mt-6 flex justify-center items-center gap-2 opacity-30">
                      <div class="w-4 h-4 rounded-full" style="background-color: #ffffff; width: 16px; height: 16px;"></div>
                      <span class="text-[10px] font-black tracking-[0.2em]" style="color: #ffffff; white-space: nowrap;">GAME QUEST LOG</span>
                 </div>
            </div>

        </div>

        <!-- Action Button -->
        <button 
            @click="downloadCard"
            :disabled="isGenerating"
            class="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Loader2 class="w-5 h-5 animate-spin" v-if="isGenerating" />
            <Download class="w-5 h-5" v-else />
            {{ isGenerating ? 'Generating...' : 'Download Image' }}
        </button>

    </div>



  </div>
</template>
