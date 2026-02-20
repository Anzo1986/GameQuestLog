<script setup>
import { ref, computed } from 'vue';
import { X, Copy, Check, Terminal, Sparkles, RefreshCw, Image } from 'lucide-vue-next';
import { useAI } from '../composables/useAI';
import { useGames } from '../composables/useGames';
import { useSettings } from '../composables/useSettings';
import { useShop } from '../composables/useShop';
import { useCardStyles } from '../composables/useCardStyles';
import { useToast } from '../composables/useToast';
import { useSwipe } from '../composables/useSwipe';
import GameCardInnerEffects from './GameCardInnerEffects.vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { constructOraclePrompt, constructUpdatePrompt } = useAI();
const { games, playingGames, backlogGames, completedGames, ignoredGames, droppedGames } = useGames();
const { addToast } = useToast();
const { language, vibe, hiddenGemsMode, userName } = useSettings(); 
const { getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();

const activeTab = ref('updates'); // 'updates' | 'oracle'
const selectedGameForUpdate = ref('ALL_PLAYING'); 
const copied = ref(false);
const isUploading = ref(false);
const showPromptDetails = ref(false);

const swipeArea = ref(null);

useSwipe(swipeArea, {
    onSwipeLeft: () => {
        if (activeTab.value === 'updates') {
             activeTab.value = 'oracle';
        }
    },
    onSwipeRight: () => {
        if (activeTab.value === 'oracle') {
             activeTab.value = 'updates';
        }
    }
});

// New Features Refs
const spoilerShield = ref(true); // Default ON
const minMetacriticScore = ref(0); // Default OFF
const maxPlaytime = ref(null); // Default OFF
const isSequelScoutMode = ref(false);

const equippedStyle = computed(() => getEquippedItem('card_style')?.value);

// --- UPDATE LOGIC ---
const updatePromptText = computed(() => {
    // Check if Sequel Scout is selected
    const isSequelScout = selectedGameForUpdate.value === 'SEQUEL_SCOUT';

    if (isSequelScout) {
        // Find top rated completed games (Rating 4 or 5)
        const topGames = completedGames.value.filter(g => g.rating >= 4);
        
        // Combine all owned games for context (Exclusion List)
        const allOwnedGames = [
            ...playingGames.value,
            ...backlogGames.value,
            ...completedGames.value
        ];

        return constructUpdatePrompt(null, null, language.value, "", true, topGames, allOwnedGames);
    }
    
    // ... existing code ...

    const langInstruction = language.value === 'de' ? 'Respond in GERMAN (Deutsch).' : 'Respond in ENGLISH.';
    const sourceLinkInstruction = 'Please provide a direct link to the official patch notes or news article if available.';
    
    // Dynamic Date Range (Last Year - Next Year)
    const currentYear = new Date().getFullYear();
    const dateRange = `${currentYear - 1}-${currentYear + 1}`;

    if (!selectedGameForUpdate.value) {
        return ""; 
    }

    if (selectedGameForUpdate.value === 'ALL_PLAYING') {
        const titles = playingGames.value.map(g => g.title).join(', ');
        return `Please check for the latest updates, patch notes, and DLC news for my CURRENTLY PLAYING games: ${titles}. Focus on changes in ${dateRange}. Summary format. ${sourceLinkInstruction} ${langInstruction}`;
    }

    if (selectedGameForUpdate.value === 'ALL_BACKLOG') {
        const titles = backlogGames.value.map(g => g.title).join(', ');
        return `Please check for the latest updates, patch notes, and DLC news for my BACKLOG games: ${titles}. Focus on changes in ${dateRange}. Summary format. ${sourceLinkInstruction} ${langInstruction}`;
    }

    const game = selectedGameForUpdate.value;
    return constructUpdatePrompt(game.title, game.platform || 'Any', language.value);
});

// --- ORACLE LOGIC ---
const oraclePromptText = computed(() => {
    return constructOraclePrompt(
        backlogGames.value, 
        completedGames.value, 
        playingGames.value, 
        droppedGames.value,
        ignoredGames.value,
        vibe.value, 
        language.value,
        "", 
        false, 
        hiddenGemsMode.value,
        spoilerShield.value,       // New
        minMetacriticScore.value,   // New
        maxPlaytime.value          // New
    );
});

import { useGamification } from '../composables/useGamification';

// ... other imports ...

const { userLevel, getTitleForLevel } = useGamification();

const collageStyle = ref('Cyberpunk'); // Default Style

// ... existing code ...

const collagePromptText = computed(() => {
    // 1. Gather Data - ABSOLUTELY EVERYTHING
    const formatGame = (g) => {
        let title = g.title;
        let ratingInfo = g.rating > 0 ? ` (${g.rating}/5 ⭐)` : ' (Unrated)';
        return `"${title}"${ratingInfo}`;
    };

    // Grouping by status for better structure in prompt, but passing ALL data.
    const heroGames = [
        ...completedGames.value.filter(g => g.rating >= 4), 
        ...playingGames.value, 
        ...backlogGames.value.filter(g => g.rating >= 4) 
    ].map(formatGame);

    const normalGames = [
        ...completedGames.value.filter(g => g.rating === 3),
        ...backlogGames.value.filter(g => !g.rating || g.rating === 3) 
    ].map(formatGame);

    const villainGames = [
        ...ignoredGames.value,
        ...droppedGames.value,
        ...completedGames.value.filter(g => g.rating <= 2),
        ...backlogGames.value.filter(g => g.rating <= 2)
    ].map(formatGame);

    // Calculate Top Genre
    const allGamesForGenre = [...completedGames.value, ...playingGames.value, ...backlogGames.value];
    const genreCounts = {};
    allGamesForGenre.forEach(g => {
        if (g.genres) {
            g.genres.forEach(genre => {
                genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
            });
        }
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Gamer';
    
    // Get actual Player Level and Title
    const playerLevel = userLevel.value;
    const playerTitle = getTitleForLevel(playerLevel);
    const playerName = userName.value;
    
    // 2. Construct Prompt using game titles and negative prompts
    return `
    **Style:** ${collageStyle.value} illustration, epic concept art, 8k, highly detailed.
    
    **Subject:** 
    A masterpiece "Gamer Profile Collage". In the center, a heroic figure sits on a throne or stands triumphant, surrounded by a chaotic, massive mashup of gaming universes.
    
    **Player Metadata (VISUAL INSPIRATION, DO NOT WRITE THIS):**
    The hero represents ${playerName}, a Level ${playerLevel} ${playerTitle} and a Master of ${topGenre} games.
    
    **Visual Elements to Include:**
    - Epic/Center scale characters and themes from: ${heroGames.join(', ')}
    - Mid-ground details characters and themes from: ${normalGames.join(', ')}
    - Dark/Background details characters and themes from: broken controllers, ruined landscapes, ${villainGames.join(', ')}
    
    **Composition:**
    High contrast between the glorious center and the chaotic edges. Densely packed composition (horror vacui).
    
    **CRITICAL INSTRUCTION FOR AI:**
    This image must contain ZERO TEXT. Do NOT write any titles, names, words, letters, logos, UI overlays, star ratings, or numbers in this image. No floating text. No watermarks.
    
    **Negative Prompt (for Midjourney/Stable Diffusion):**
    --no text, words, letters, numbers, fonts, logos, titles, writing, UI, watermarks, signature, user interface, labels
    `;
});

const currentPrompt = computed(() => {
    if (activeTab.value === 'updates') return updatePromptText.value;
    if (activeTab.value === 'oracle') return oraclePromptText.value;
    return collagePromptText.value;
});

const copyToClipboard = async () => {
    if (isUploading.value || copied.value) return;

    // Start Upload Effect
    isUploading.value = true;
    
    setTimeout(async () => {
        try {
            await navigator.clipboard.writeText(currentPrompt.value);
            isUploading.value = false;
            copied.value = true;
            addToast('Prompt extracted successfully!', 'success');
            setTimeout(() => copied.value = false, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            isUploading.value = false;
            addToast('Upload failed', 'error');
        }
    }, 1500); // 1.5s Upload Duration
};

const handleClose = () => {
    emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-20"> <!-- Increased top padding for better vertical centering -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="handleClose"></div>

    <div ref="swipeArea" class="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 transition-all duration-500 max-h-[85vh]"
         :class="getCardClasses(equippedStyle, true)">
        
        <!-- INNER EFFECTS LAYER -->
        <GameCardInnerEffects :style-name="equippedStyle" class="z-0 opacity-50 pointer-events-none" />

        <!-- Header -->
        <div class="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/60 relative z-10 backdrop-blur-md">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <Terminal class="w-5 h-5 text-primary" />
                Manual AI Prompts
            </h2>
            <button @click="handleClose" class="text-gray-400 hover:text-white transition-colors">
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Language & Tabs -->
        <div class="p-4 flex flex-col gap-4 bg-gray-900/30 relative z-10">
            <!-- Tabs -->
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                 <div class="flex p-1 bg-gray-800 rounded-lg shadow-inner w-full sm:w-auto justify-between sm:justify-start overflow-x-auto">
                    <button 
                        @click="activeTab = 'updates'"
                        :class="activeTab === 'updates' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'"
                        class="px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <RefreshCw class="w-3 h-3 sm:w-4 sm:h-4" /> Updates
                    </button>
                    <button 
                        @click="activeTab = 'oracle'"
                        :class="activeTab === 'oracle' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'"
                        class="px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Sparkles class="w-3 h-3 sm:w-4 sm:h-4" /> Oracle
                    </button>
                    <button 
                        @click="activeTab = 'collage'"
                        :class="activeTab === 'collage' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-white'"
                        class="px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Image class="w-3 h-3 sm:w-4 sm:h-4" /> Collage
                    </button>
                </div>

                <!-- Controls -->
                <div class="flex gap-2 w-full sm:w-auto justify-end">
                     <select v-model="language" class="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:border-primary focus:outline-none w-full sm:w-auto">
                        <option value="en">English (EN)</option>
                        <option value="de">German (DE)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="p-4 overflow-y-auto flex-1 space-y-3 relative z-10 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            
            <!-- UPDATE CONTROLS -->
            <div v-if="activeTab === 'updates'" class="space-y-4 animate-in slide-in-from-left-2 duration-300 flex flex-col justify-center">
                <div class="w-full">
                    <p class="text-sm text-center text-gray-400 mb-4">Select a game to check for the latest patch notes or DLC.</p>
                    <select v-model="selectedGameForUpdate" class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                        <option value="ALL_PLAYING">📂 Check All Playing Games</option>
                        <option value="ALL_BACKLOG">📦 Check All Backlog Games</option>
                        <option value="SEQUEL_SCOUT">🔍 Series Scout (Find Sequels & Prequels)</option>
                        <hr class="border-gray-600"/>
                        <optgroup label="Playing">
                            <option v-for="g in playingGames" :key="g.id" :value="g">{{ g.title }}</option>
                        </optgroup>
                        <optgroup label="Backlog">
                            <option v-for="g in backlogGames" :key="g.id" :value="g">{{ g.title }}</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            <!-- COLLAGE CONTROLS -->
            <div v-if="activeTab === 'collage'" class="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <p class="text-xs text-center text-gray-400">Create an epic art prompt from your gaming history.</p>
                
                <div class="p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
                    <div>
                        <label class="text-xs font-bold text-gray-400 block mb-2">Art Style</label>
                        <select v-model="collageStyle" class="w-full bg-gray-900 text-white p-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none">
                            <option value="Cyberpunk">🤖 Cyberpunk / High Tech</option>
                            <option value="Fantasy Oil Painting">🎨 Epic Fantasy Oil Painting</option>
                            <option value="Vaporwave">📼 Vaporwave / Retro 80s</option>
                            <option value="Pixel Art">👾 Detailed Pixel Art</option>
                            <option value="Dark Souls-like">🌑 Grim Dark / Souls-like</option>
                            <option value="Anime Poster">🎌 High Quality Anime Poster</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- ORACLE CONTROLS -->
            <div v-if="activeTab === 'oracle'" class="space-y-3 animate-in slide-in-from-right-2 duration-300">
                <p class="text-xs text-center text-gray-400">Generates a prompt with your game history.</p>
                <select v-model="vibe" class="w-full bg-gray-800 text-white p-2 text-sm rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all">
                    <option :value="null">🔮 Surprise Me (Any Vibe)</option>
                    <option value="Action-Adventure">⚔️ Action & Adventure</option>
                    <option value="RPG">🛡️ RPG & Story Rich</option>
                    <option value="Strategy">🧠 Strategy & Tactics</option>
                    <option value="Cozy">☕ Cozy & Relaxing</option>
                    <option value="Sci-Fi">🚀 Sci-Fi & Space</option>
                    <option value="Horror">👻 Horror & Thriller</option>
                    <option value="Retro">👾 Retro & Indie</option>
                </select>

                <!-- GRID LAYOUT FOR FILTERS -->
                <div class="grid grid-cols-2 gap-2">
                    <!-- Hidden Gems Toggle -->
                    <div class="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 cursor-pointer group" @click="hiddenGemsMode = !hiddenGemsMode">
                        <div class="w-6 h-3 rounded-full relative transition-colors duration-300"
                            :class="hiddenGemsMode ? 'bg-purple-500' : 'bg-gray-600'">
                            <div class="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-transform duration-300"
                                :class="hiddenGemsMode ? 'translate-x-3' : 'translate-x-0'"></div>
                        </div>
                        <span class="text-[10px] font-bold transition-colors" :class="hiddenGemsMode ? 'text-purple-300' : 'text-gray-400'">
                            💎 Hidden Gems
                        </span>
                    </div>
    
                    <!-- Spoiler Shield Toggle -->
                    <div class="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 cursor-pointer group" @click="spoilerShield = !spoilerShield">
                        <div class="w-6 h-3 rounded-full relative transition-colors duration-300"
                            :class="spoilerShield ? 'bg-blue-500' : 'bg-gray-600'">
                            <div class="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-transform duration-300"
                                :class="spoilerShield ? 'translate-x-3' : 'translate-x-0'"></div>
                        </div>
                        <span class="text-[10px] font-bold transition-colors" :class="spoilerShield ? 'text-blue-300' : 'text-gray-400'">
                            🛡️ No Spoilers
                        </span>
                    </div>

                    <!-- Metacritic Slider -->
                    <div class="p-2 bg-gray-800/50 rounded-lg border border-gray-700 space-y-1">
                        <div class="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>💯 Metacritic</span>
                            <span :class="minMetacriticScore > 0 ? 'text-green-400' : 'text-gray-500'">
                                {{ minMetacriticScore > 0 ? `> ${minMetacriticScore}` : 'Any' }}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            v-model.number="minMetacriticScore" 
                            min="0" 
                            max="90" 
                            step="5"
                            class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <!-- Playtime Filter -->
                    <div class="p-2 bg-gray-800/50 rounded-lg border border-gray-700 space-y-1">
                        <div class="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>⏳ Time</span>
                        </div>
                        <select v-model="maxPlaytime" class="w-full bg-gray-900 text-white text-[10px] p-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none cursor-pointer">
                            <option :value="null">Any Length</option>
                            <option value="Short (< 10h)">Short (< 10h)</option>
                            <option value="Medium (10-30h)">Med (10-30h)</option>
                            <option value="Long (30-80h)">Long (30-80h)</option>
                            <option value="Epic (80h+)">Epic (80h+)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- ACTION AREA -->
            <div class="mt-6 flex flex-col gap-4">
                <!-- Big Copy Button -->
                <!-- Big Copy Button with Upload Effect -->
                <button 
                  @click="copyToClipboard" 
                  :disabled="isUploading || copied"
                  class="w-full relative group overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border-2 flex items-center justify-center"
                  :class="[
                      activeTab === 'updates' ? 'border-blue-400/50' : (activeTab === 'collage' ? 'border-pink-400/50' : 'border-purple-400/50'),
                      isUploading ? 'cursor-wait bg-gray-900 border-white/50' : (activeTab === 'updates' ? 'bg-blue-600 hover:bg-blue-500' : (activeTab === 'collage' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-purple-600 hover:bg-purple-500'))
                  ]"
                >
                    <!-- 1. PROGRESS BAR FILL (Background Layer) -->
                    <!-- This div fills from left to right, full height -->
                    <div v-if="isUploading" class="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-green-800 to-green-500 z-0 animate-upload-bar w-0"></div>
                    
                    <!-- 2. LASER SCAN LINE (Overlay Layer) -->
                    <!-- REMOVED AS REQUESTED -->

                    <!-- 3. CONTENT (Foreground Text) -->
                    <div class="relative z-20 flex items-center justify-center gap-3 text-lg font-bold text-white w-full">
                        <template v-if="isUploading">
                            <RefreshCw class="w-6 h-6 animate-spin text-white drop-shadow-md" />
                            <span class="animate-glitch-text text-white font-mono tracking-widest drop-shadow-md">UPLOADING...</span>
                        </template>
                        <template v-else-if="copied">
                            <Check class="w-6 h-6 animate-bounce text-green-200" />
                            <span class="text-green-50">COPIED SUCCESSFULLY!</span>
                        </template>
                        <template v-else>
                            <Copy class="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            <span>COPY PROMPT</span>
                        </template>
                    </div>

                    <!-- 4. IDLE GLOW (Only when NOT uploading) -->
                    <div v-if="!isUploading && !copied" class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none z-30"></div>
                </button>

                <!-- Toggle Details -->
                <button 
                    @click="showPromptDetails = !showPromptDetails"
                    class="text-xs text-gray-500 hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                    <span>{{ showPromptDetails ? 'Hide' : 'Show' }} Generated Prompt Text</span>
                </button>

                <!-- Collapsible Text Area -->
                <div v-if="showPromptDetails" class="animate-in slide-in-from-top-2 fade-in duration-200">
                    <div class="relative group">
                        <div class="absolute -inset-0.5 bg-gradient-to-r opacity-30 rounded-lg blur"
                             :class="activeTab === 'updates' ? 'from-blue-600 to-cyan-500' : 'from-purple-600 to-pink-500'">
                        </div>
                        <div class="relative bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300 h-40 overflow-y-auto whitespace-pre-wrap border border-gray-700 shadow-inner">
                            {{ currentPrompt }}
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="text-center text-xs text-gray-500">
                Paste this prompt into ChatGPT, Claude, or Gemini.
            </p>

        </div>
    </div>
  </div>
</template>

<style scoped>
/* Keyframes */
@keyframes upload-bar {
    0% { width: 0%; }
    100% { width: 100%; }
}

@keyframes laser-scan {
    0% { top: -10%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 110%; opacity: 0; }
}

@keyframes glitch-text {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
}

/* Classes */
.animate-upload-bar {
    animation: upload-bar 1.5s ease-in-out forwards;
}

.animate-laser-scan {
    animation: laser-scan 1.5s linear infinite;
}

.animate-glitch-text {
    animation: glitch-text 0.2s infinite;
}
</style>
