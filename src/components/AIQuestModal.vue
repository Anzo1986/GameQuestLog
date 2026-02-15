<script setup>
import { ref, computed } from 'vue';
import { X, Sparkles, Play, AlertCircle, Bell } from 'lucide-vue-next';
import { useAI } from '../composables/useAI';
import { useGames } from '../composables/useGames';
import { useCardStyles } from '../composables/useCardStyles';
import { useShop } from '../composables/useShop';
import { useToast } from '../composables/useToast';
import { useSettings } from '../composables/useSettings';
import GameCardInnerEffects from './GameCardInnerEffects.vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { generateGameRecommendation, generateGameUpdates, isGenerating, error: aiError } = useAI();
const { games, addGame } = useGames();
const { getEquippedItem } = useShop();
const { getCardClasses } = useCardStyles();
const { hiddenGemsMode } = useSettings();

// const equippedStyle = 'cyber'; // Force Cyber style for AI -> REMOVED. Use shop style.
const equippedStyle = computed(() => getEquippedItem('card_style')?.value);

const mode = ref('menu'); // 'menu', 'oracle', 'updates'
const language = ref('de'); // Default to German
const recommendation = ref(null);
const updateResults = ref([]); 
const localError = ref(null);
const addedGames = ref(new Set()); 
const selectedVibe = ref(null);
// const hiddenGemsMode = ref(false); // NOW SHARED
const selectedGameForUpdate = ref(null);
const batchProgress = ref(0);
const batchTotal = ref(0);

const consultOracle = async () => {
    recommendation.value = null;
    localError.value = null;
    addedGames.value.clear();

    const backlog = games.value.filter(g => g.status === 'backlog');
    const playing = games.value.filter(g => g.status === 'playing');
    const completed = games.value.filter(g => g.status === 'completed');

    try {
        const results = await generateGameRecommendation(
            backlog, 
            completed, 
            playing, 
            selectedVibe.value,
            language.value,
            hiddenGemsMode.value
        );
        recommendation.value = results;
    } catch (e) {
        localError.value = e.message;
    }
};

const checkUpdates = async () => {
    if (!selectedGameForUpdate.value) return;
    
    updateResults.value = [];
    localError.value = null;
    batchProgress.value = 0;
    batchTotal.value = 0;

    let targets = [];

    if (selectedGameForUpdate.value === 'ALL_PLAYING') {
        targets = games.value.filter(g => g.status === 'playing');
    } else if (selectedGameForUpdate.value === 'ALL_BACKLOG') {
        targets = games.value.filter(g => g.status === 'backlog');
    } else {
        targets = [selectedGameForUpdate.value];
    }

    if (targets.length === 0) {
        localError.value = "No games found in this category.";
        return;
    }

    batchTotal.value = targets.length;

    for (const game of targets) {
        try {
            const result = await generateGameUpdates(
                game.title, 
                game.platform || 'PC', 
                language.value
            );
            updateResults.value.push({
                title: game.title,
                text: result
            });
        } catch (e) {
            updateResults.value.push({
                title: game.title,
                text: "Error: " + e.message
            });
        }
        batchProgress.value++;
    }
};

const resetUpdates = () => {
    updateResults.value = [];
    selectedGameForUpdate.value = null;
};

const addToBacklog = async (rec) => {
    if (rec.rawgData) {
        await addGame(rec.rawgData);
        addedGames.value.add(rec.gameTitle);
    } else {
        await addGame({
            id: Date.now(), 
            name: rec.gameTitle,
            background_image: null,
            released: new Date().toISOString().split('T')[0]
        });
        addedGames.value.add(rec.gameTitle);
    }
};

const { addToast } = useToast();

const copyPrompt = async () => {
    if (!selectedGameForUpdate.value) return;
    
    // Check if it's a batch request or single game
    let gameTitle = "";
    let platform = "Any";
    
    if (selectedGameForUpdate.value === 'ALL_PLAYING' || selectedGameForUpdate.value === 'ALL_BACKLOG') {
         gameTitle = "ALL my games";
    } else {
        gameTitle = selectedGameForUpdate.value.title;
        platform = selectedGameForUpdate.value.platform || 'Any';
    }

    const promptText = `Find the latest updates, patch notes, or DLC news for the game "${gameTitle}" (Platform: ${platform}). Focus on 2025-2026. If it's a fan game or rumor, mention that too.`;
    
    try {
        await navigator.clipboard.writeText(promptText);
        addToast('Prompt copied to clipboard!', 'success');
    } catch (err) {
        console.error("Copy failed", err);
        addToast('Failed to copy to clipboard.', 'error');
    }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="!isGenerating && $emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 text-center animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto"
         :class="getCardClasses(equippedStyle, true)">
        
        <!-- INNER EFFECTS LAYER -->
        <GameCardInnerEffects :style-name="equippedStyle" class="z-0 opacity-40 pointer-events-none" />

        <!-- Cyber Grid Background -->
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        
        <!-- Close Button -->
        <button 
          v-if="!isGenerating" 
          @click="$emit('close')" 
          class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20"
        >
          <X class="w-6 h-6" />
        </button>

        <!-- Language Toggle (Top Left) -->
        <div class="absolute top-4 left-4 z-30">
            <div class="flex bg-gray-800 rounded-lg p-1 border border-purple-500/30 shadow-lg">
                <button @click="language = 'de'" :class="language === 'de' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'" class="px-3 py-1.5 rounded text-xs font-bold transition-all">DE</button>
                <button @click="language = 'en'" :class="language === 'en' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'" class="px-3 py-1.5 rounded text-xs font-bold transition-all">EN</button>
            </div>
        </div>

        <!-- Header (Shared) -->
        <div class="mb-6 z-10 relative flex flex-col items-center">


            <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <Sparkles v-if="!isGenerating" class="w-8 h-8 text-purple-400" />
                <Sparkles v-else class="w-8 h-8 text-purple-400 animate-spin-slow" />
            </div>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest">
                AI Hub
            </h2>
            <p class="text-purple-200/60 text-xs font-mono mt-2 tracking-widest">INTELLIGENCE NODE v3.6</p>
        </div>

        <!-- MODE: MENU -->
        <div v-if="mode === 'menu' && !isGenerating" class="z-10 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
            <!-- Oracle Card -->
            <button @click="mode = 'oracle'" class="bg-gray-800/50 hover:bg-purple-900/20 border border-purple-500/30 hover:border-purple-400 rounded-xl p-6 transition-all group flex flex-col items-center">
                <Sparkles class="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 class="text-xl font-bold text-white mb-2">The Oracle</h3>
                <p class="text-gray-400 text-sm">Discover new hidden gems and adventures based on your taste.</p>
            </button>

            <!-- Updates Card -->
            <button @click="mode = 'updates'" class="bg-gray-800/50 hover:bg-blue-900/20 border border-blue-500/30 hover:border-blue-400 rounded-xl p-6 transition-all group flex flex-col items-center">
                <Sparkles class="w-12 h-12 text-blue-400 mb-4 group-hover:rotate-12 transition-transform" />
                <h3 class="text-xl font-bold text-white mb-2">Game Updates</h3>
                <p class="text-gray-400 text-sm">Check for the latest patch notes and news for your games.</p>
            </button>
        </div>

        <!-- MODE: ORACLE -->
        <div v-if="mode === 'oracle'" class="z-10 w-full animate-in fade-in">
            <!-- Back Button -->
            <button v-if="!isGenerating && !recommendation" @click="mode = 'menu'" class="mb-4 text-xs text-purple-400 hover:text-purple-300 uppercase tracking-widest">
                 ← Back to Hub
            </button>

            <!-- Initial Oracle State -->
            <div v-if="!recommendation && !isGenerating && !localError && !aiError" class="w-full max-w-md mx-auto">
                <p class="text-gray-400 mb-6 leading-relaxed text-sm">
                    The Oracle scans the multiverse for games you <span class="text-purple-400 font-bold">don't own yet</span>.
                </p>

                <!-- Vibe Selector -->
                <div class="mb-4 relative">
                    <select 
                        v-model="selectedVibe"
                        class="w-full bg-gray-800/80 border border-purple-500/30 rounded-xl px-4 py-3 text-purple-200 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                        <option :value="null">🔮 Surprise Me (Any Vibe)</option>
                        <option value="Action-Adventure">⚔️ Action & Adventure</option>
                        <option value="RPG">🛡️ RPG & Story Rich</option>
                        <option value="Strategy">🧠 Strategy & Tactics</option>
                        <option value="Cozy">☕ Cozy & Relaxing</option>
                        <option value="Sci-Fi">🚀 Sci-Fi & Space</option>
                        <option value="Horror">👻 Horror & Thriller</option>
                        <option value="Retro">👾 Retro & Indie</option>
                        <option value="High Difficulty">💀 High Difficulty (Souls-like)</option>
                        <option value="Coop">🤝 Co-op Multiplayer</option>
                    </select>
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">▼</div>
                </div>

                <!-- Hidden Gems Toggle -->
                <div class="mb-6 flex items-center justify-center gap-3 bg-gray-800/50 p-3 rounded-xl border border-purple-500/20 hover:bg-gray-800 transition-colors cursor-pointer group" @click="hiddenGemsMode = !hiddenGemsMode">
                    <div class="w-10 h-6 rounded-full relative transition-colors duration-300"
                        :class="hiddenGemsMode ? 'bg-purple-500' : 'bg-gray-600'">
                        <div class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300"
                            :class="hiddenGemsMode ? 'translate-x-4' : 'translate-x-0'"></div>
                    </div>
                    <span class="text-sm font-bold transition-colors" :class="hiddenGemsMode ? 'text-purple-300' : 'text-gray-400'">
                        💎 Hidden Gems Only <span class="text-xs font-normal opacity-70">(No AAA)</span>
                    </span>
                </div>

                <button 
                    @click="consultOracle"
                    class="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 group"
                >
                    <Sparkles class="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Find New Games
                </button>
            </div>

            <!-- Recommendation Results (Same as before) -->
            <div v-if="recommendation" class="w-full animate-in slide-in-from-bottom-5 duration-500">
                 <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <!-- Card -->
                    <div 
                        v-for="(rec, idx) in recommendation" 
                        :key="idx"
                        class="bg-gray-800/50 rounded-xl border border-purple-500/30 overflow-hidden group hover:border-purple-400 transition-colors flex flex-col"
                    >
                        <!-- Image -->
                        <div class="h-32 relative bg-gray-900">
                            <img v-if="rec.image" :src="rec.image" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div v-else class="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 text-xs">No Image</div>
                            <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                            <div class="absolute bottom-2 left-3 right-3">
                                 <h3 class="text-lg font-black text-white leading-tight drop-shadow-md truncate" :title="rec.gameTitle">{{ rec.gameTitle }}</h3>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="p-4 flex-1 flex flex-col">
                            <div class="flex gap-2 mb-3 justify-center">
                                <span class="bg-purple-900/50 text-purple-300 text-[10px] px-2 py-1 rounded border border-purple-500/20 uppercase font-bold">{{ rec.vibe }}</span>
                                <span class="bg-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-600 uppercase font-bold">~{{ rec.estimatedHours }}h</span>
                            </div>
                            <p class="text-gray-400 text-xs italic mb-4 flex-1">"{{ rec.reasoning }}"</p>
                            <div class="flex gap-2">
                                <a :href="rec.trailerUrl" target="_blank" class="flex-1 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                                    <Play class="w-3 h-3 fill-current" /> Trailer
                                </a>
                                <button @click="addToBacklog(rec)" class="flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all" :class="addedGames.has(rec.gameTitle) ? 'bg-green-600 text-white cursor-default' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'" :disabled="addedGames.has(rec.gameTitle)">
                                    {{ addedGames.has(rec.gameTitle) ? 'Added' : 'Add' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="consultOracle" class="text-gray-500 hover:text-purple-400 text-xs font-mono uppercase tracking-widest underline decoration-dashed">Reroll Destiny</button>
            </div>
        </div>

        <!-- MODE: UPDATES -->
        <div v-if="mode === 'updates'" class="z-10 w-full animate-in fade-in">
             <!-- Back Button -->
             <button v-if="!isGenerating" @click="mode = 'menu'" class="mb-4 text-xs text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                 ← Back to Hub
            </button>

            <div v-if="!updateResults.length && !isGenerating && !localError && !aiError" class="w-full max-w-md mx-auto">
                 <p class="text-gray-400 mb-6 leading-relaxed text-sm">
                    Select a game to scan for <span class="text-blue-400 font-bold">Patch Notes & DLC News</span>.
                </p>
                
                <div class="mb-6 relative">
                    <select v-model="selectedGameForUpdate" class="w-full bg-gray-800/80 border border-blue-500/30 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-gray-800 transition-colors">
                        <option :value="null" disabled>Select a Game...</option>
                        <option value="ALL_PLAYING" class="font-bold text-green-400">⚡ Check ALL Currently Playing</option>
                        <option value="ALL_BACKLOG" class="font-bold text-yellow-400">📚 Check ALL Backlog Games</option>
                        <hr />
                        <optgroup label="Playing Now">
                            <option v-for="g in games.filter(g => g.status === 'playing')" :key="g.id" :value="g">{{ g.title }}</option>
                        </optgroup>
                         <optgroup label="Backlog">
                            <option v-for="g in games.filter(g => g.status === 'backlog')" :key="g.id" :value="g">{{ g.title }}</option>
                        </optgroup>
                    </select>
                     <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">▼</div>
                </div>

                <button 
                    @click="checkUpdates"
                    :disabled="!selectedGameForUpdate"
                    class="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span class="text-lg">📰</span> Check Reports
                </button>
            </div>

            <!-- Update Results (List) -->
            <div v-if="updateResults.length > 0" class="w-full max-w-2xl mx-auto space-y-4">
                <div v-if="batchProgress && batchTotal > 1" class="text-center text-blue-300 text-xs font-mono mb-4 animate-pulse">
                    SCANNING FREQUENCIES... ({{ batchProgress }} / {{ batchTotal }})
                </div>

                <div v-for="(res, idx) in updateResults" :key="idx" class="bg-gray-800/80 rounded-xl border border-blue-500/30 p-6 text-left animate-in slide-in-from-bottom-2">
                    <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span class="text-blue-400">REPORT:</span> {{ res.title }}
                    </h3>
                    <div class="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-line">
                        {{ res.text }}
                    </div>
                </div>

                <div class="mt-8 text-center flex flex-col gap-2 relative z-20" v-if="!isGenerating">
                     <button @click="resetUpdates" class="text-gray-500 hover:text-blue-400 text-xs font-mono uppercase tracking-widest underline decoration-dashed">New Scan</button>
                     
                     <div class="flex items-center justify-center gap-2 mt-2">
                        <button @click="copyPrompt" class="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-full border border-gray-700 transition-all shadow-lg active:scale-95" title="Copy Manual Prompt">
                            <Bell class="w-4 h-4" />
                            <span class="text-xs font-bold uppercase tracking-wider">Copy Prompt</span>
                        </button>
                     </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isGenerating" class="z-10 py-20">
            <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full animate-progress" :class="mode === 'updates' ? 'bg-blue-500' : 'bg-purple-500'"></div>
                </div>
                <p class="font-mono text-sm animate-pulse" :class="mode === 'updates' ? 'text-blue-300' : 'text-purple-300'">
                    {{ mode === 'updates' ? 'SCANNING NEWS NETWORKS...' : 'SEARCHING THE DATABASE...' }}
                </p>
            </div>
        </div>

        <!-- Error State -->
        <div v-if="localError || aiError" class="z-10 py-6 text-center animate-in zoom-in-50">
            <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 class="text-red-400 font-bold mb-2">Connection Severed</h3>
            <p class="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto break-words">{{ localError || aiError }}</p>
            
            <button 
                @click="localError = null; aiError = null"
                class="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold text-sm"
            >
                Return
            </button>
        </div>

    </div>
  </div>
</template>

<style scoped>
.mask-gradient-to-b {
    mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
}

.animate-spin-slow {
    animation: spin 3s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animate-progress {
    animation: progress 2s ease-in-out infinite;
    width: 30%;
}

@keyframes progress {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(200%); width: 50%; }
    100% { transform: translateX(400%); }
}
</style>
