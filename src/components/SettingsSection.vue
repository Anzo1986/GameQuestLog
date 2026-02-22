<script setup>
import { ref, computed } from 'vue';
import { Download, Upload, Key, Save, User, Check, X, RefreshCw } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useAchievements } from '../composables/useAchievements';
import { useSettings } from '../composables/useSettings';


const emit = defineEmits(['close']);

const { 
  exportData, importData, 
  availableTitles,
  ignoredGames, unignoreGame
} = useGames();

const {
    apiKey, setApiKey,
    gameApiProvider, setGameApiProvider,
    igdbClientId, setIgdbClientId,
    igdbAccessToken, setIgdbAccessToken,
    geminiApiKey, setGeminiKey,
    groqApiKey, setGroqKey,
    tavilyApiKey, setTavilyKey,
    aiProvider, setAiProvider,
    themeColor, setTheme,
    userName, setUserName,
    userAvatar, setUserAvatar,
    selectedTitle: userTitle, setUserTitle,
    lastBackup,
    THEMES
} = useSettings();

const lastBackupDisplay = computed(() => {
    if (!lastBackup.value) return 'Never';
    return new Date(lastBackup.value).toLocaleString();
});

const newKey = ref(apiKey.value); // Maps to RAWG key input
const currentGameApiProvider = ref(gameApiProvider.value);
const newIgdbClientId = ref(igdbClientId.value);
const newIgdbClientSecret = ref(''); // Only used temporarily to generate the token
const newIgdbAccessToken = ref(igdbAccessToken.value);
const isGeneratingToken = ref(false);

const geminiKeyInput = ref(geminiApiKey.value);
const groqKeyInput = ref(groqApiKey.value);
const tavilyKeyInput = ref(tavilyApiKey.value);
const currentProvider = ref(aiProvider.value);

const fileInput = ref(null);
const avatarInput = ref(null);
const importStatus = ref('');
const showTitles = ref(false);
const showApiConfig = ref(false); // Collapsible state
const showAIConfig = ref(false); // Collapsible state
const showIgnoredGames = ref(false); // Collapsible state

const activeTab = ref('profile'); // Default to Profile
const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'general', label: 'General', icon: Key },
    { id: 'data', label: 'System', icon: Save }
];

// Swipe Logic (Refactored to useSwipe)
const modalRef = ref(null);

import { useSwipe } from '../composables/useSwipe';

useSwipe(modalRef, {
    onSwipeLeft: () => {
        // Next Tab
        const currentIndex = tabs.findIndex(t => t.id === activeTab.value);
        if (currentIndex < tabs.length - 1) activeTab.value = tabs[currentIndex + 1].id;
    },
    onSwipeRight: () => {
        // Prev Tab
        const currentIndex = tabs.findIndex(t => t.id === activeTab.value);
        if (currentIndex > 0) activeTab.value = tabs[currentIndex - 1].id;
    }
});

const saveKey = () => {
  setApiKey(newKey.value);
  alert('RAWG API Key saved!');
};

const saveIgdbKeys = () => {
  setIgdbClientId(newIgdbClientId.value.trim());
  setIgdbAccessToken(newIgdbAccessToken.value.trim());
  alert('IGDB API Keys saved!');
};

const generateIgdbToken = async () => {
    if (!newIgdbClientId.value || !newIgdbClientSecret.value) {
        alert('Please provide both Client ID and Client Secret first.');
        return;
    }

    isGeneratingToken.value = true;
    try {
        const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${newIgdbClientId.value.trim()}&client_secret=${newIgdbClientSecret.value.trim()}&grant_type=client_credentials`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            newIgdbAccessToken.value = data.access_token;
            setIgdbClientId(newIgdbClientId.value.trim());
            setIgdbAccessToken(data.access_token);
            alert('Successfully generated App Access Token! Your keys have been auto-saved.');
        } else {
            const err = await response.json();
            alert(`Failed to generate token: ${err.message || 'Unknown error'}`);
        }
    } catch (e) {
        alert('Network error while generating token: ' + e.message);
    } finally {
        isGeneratingToken.value = false;
    }
};

const updateGameApiProvider = (provider) => {
    currentGameApiProvider.value = provider;
    setGameApiProvider(provider);
    alert(`Switched to ${provider === 'igdb' ? 'IGDB' : 'RAWG.io'}`);
};

const saveGeminiKey = () => {
    setGeminiKey(geminiKeyInput.value);
    alert('Gemini API Key saved!');
};

const saveGroqKey = () => {
    setGroqKey(groqKeyInput.value);
    alert('Groq API Key saved!');
};

const saveTavilyKey = () => {
    setTavilyKey(tavilyKeyInput.value);
    alert('Tavily Search Key saved!');
};

const updateAiProvider = (provider) => {
    currentProvider.value = provider;
    setAiProvider(provider);
    alert(`Switched to ${provider === 'groq' ? 'Groq' : 'Gemini'}`);
};

const triggerImport = () => {
  fileInput.value.click();
};

const triggerAvatarUpload = () => {
    avatarInput.value.click();
};

const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Resize image logic
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Max dimensions
            const MAX_WIDTH = 250;
            const MAX_HEIGHT = 250;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress slightly
            setUserAvatar(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (confirm('This will overwrite your current data. Are you sure?')) {
    try {
      await importData(file);
      importStatus.value = 'Data imported successfully!';
      setTimeout(() => importStatus.value = '', 3000);
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
  }
  event.target.value = ''; // Reset
};

const forceUpdate = async () => {
    if (!confirm('This will reload the app to force an update. Your data is safe.')) return;
    
    // 1. Unregister Service Workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
    }

    // 2. Clear Caches (nuclear option)
    if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
            await caches.delete(key);
        }
    }

    // 3. Force Reload
    window.location.reload(true);
};
const version = __APP_VERSION__;
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div 
        ref="modalRef"
        class="relative bg-gray-900/60 backdrop-blur-2xl w-full max-w-lg rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/20 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
    >
      
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900/60 backdrop-blur-md z-10 p-4 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          Settings
        </h2>
        <button @click="$emit('close')" class="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X class="w-6 h-6" />
        </button>
      </div>

      <!-- TABS HEADER -->
      <div class="px-4 pt-0 border-b border-white/10 flex items-center gap-4 bg-gray-900/60 backdrop-blur-md z-10 sticky top-[60px]">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="pb-3 pt-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2"
            :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
          </button>
      </div>

      <div class="p-6 space-y-6 min-h-[400px]">
        
        <!-- ================== GENERAL TAB (API) ================== -->
        <div v-if="activeTab === 'general'" class="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          
          <div class="space-y-4">
            
            <!-- Game Data API Provider Selection (Collapsible) -->
            <div class="rounded-xl border border-gray-700 overflow-hidden bg-gray-800/50">
                <button 
                  @click="showApiConfig = !showApiConfig"
                  class="w-full flex items-center justify-between text-lg font-semibold text-gray-200 p-4 hover:bg-gray-800 transition-colors"
                >
                    <span class="flex items-center gap-2"><span class="text-purple-400">🎮</span> Game Data API</span>
                    <span class="text-xs text-gray-500 transform transition-transform duration-200" :class="showApiConfig ? 'rotate-180' : ''">▼</span>
                </button>
                 
                <div v-show="showApiConfig" class="p-4 border-t border-gray-700 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-gray-900/30">
                    <div class="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                        <span class="text-sm font-medium text-gray-400">Active Provider</span>
                        <button v-if="currentGameApiProvider === 'rawg'" @click="saveKey" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-lg">
                            <Save class="w-4 h-4" /> Save RAWG Key
                        </button>
                        <button v-if="currentGameApiProvider === 'igdb'" @click="saveIgdbKeys" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-lg">
                            <Save class="w-4 h-4" /> Save IGDB Keys
                        </button>
                    </div>

                <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                    <!-- Provider Toggle -->
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-2">Provider</label>
                        <div class="flex gap-2">
                            <button 
                            @click="updateGameApiProvider('rawg')"
                            :class="[
                                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                                currentGameApiProvider === 'rawg' 
                                ? 'bg-blue-600 border-blue-500 text-white' 
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            ]"
                            >
                            RAWG.io
                            </button>
                            <button 
                            @click="updateGameApiProvider('igdb')"
                            :class="[
                                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                                currentGameApiProvider === 'igdb' 
                                ? 'bg-purple-600 border-purple-500 text-white' 
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            ]"
                            >
                            IGDB (Twitch)
                            </button>
                        </div>
                    </div>

                    <!-- RAWG Fields -->
                    <div v-if="currentGameApiProvider === 'rawg'" class="animate-in fade-in space-y-2">
                        <label class="block text-sm font-medium text-gray-300">RAWG.io API Key</label>
                        <div class="relative">
                            <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                            v-model="newKey" 
                            type="password" 
                            placeholder="Enter your RAWG API Key" 
                            class="w-full bg-gray-950 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none tracking-widest placeholder-gray-600 placeholder-normal"
                            />
                        </div>
                        <p class="mt-2 text-xs text-gray-400">
                        Required for game data. <a href="https://rawg.io/apidocs" target="_blank" class="text-blue-400 hover:underline">Get key</a>.
                        </p>
                    </div>

                    <!-- IGDB Fields -->
                    <div v-if="currentGameApiProvider === 'igdb'" class="animate-in fade-in space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Twitch Client ID</label>
                            <div class="relative">
                                <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                v-model="newIgdbClientId" 
                                type="text" 
                                placeholder="Enter Client ID" 
                                class="w-full bg-gray-950 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder-gray-600"
                                />
                            </div>
                        </div>

                        <!-- Auto Generate Token -->
                        <div class="bg-gray-900/50 p-3 rounded-lg border border-purple-500/30">
                            <label class="block text-sm font-medium text-purple-300 mb-1">Generate Access Token</label>
                            <p class="text-xs text-gray-400 mb-2">Provide your Client Secret to automatically generate the required App Access Token.</p>
                            <div class="flex gap-2">
                                <div class="relative flex-1">
                                    <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                    v-model="newIgdbClientSecret" 
                                    type="password" 
                                    placeholder="Enter Client Secret" 
                                    class="w-full bg-gray-950 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder-gray-600"
                                    />
                                </div>
                                <button 
                                    @click="generateIgdbToken"
                                    :disabled="isGeneratingToken || !newIgdbClientId || !newIgdbClientSecret"
                                    class="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                                >
                                    {{ isGeneratingToken ? 'Generating...' : 'Generate' }}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">App Access Token</label>
                            <div class="relative">
                                <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                v-model="newIgdbAccessToken" 
                                type="password" 
                                placeholder="Generated Token will appear here..." 
                                class="w-full bg-gray-950 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none tracking-widest placeholder-gray-600 placeholder-normal"
                                />
                            </div>
                            <p class="mt-2 text-xs text-gray-400">
                            Required for game data. <a href="https://api-docs.igdb.com/#account-creation" target="_blank" class="text-purple-400 hover:underline">Get credentials</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Missing closing tag for the space-y-4 parent of the provider selection -->
            </div>

            <!-- AI Settings (Collapsible) -->
            <div class="space-y-4 mt-6">
                <!-- Header / Toggle -->
                <div class="rounded-xl border border-gray-700 overflow-hidden bg-gray-800/50">
                    <button 
                    @click="showAIConfig = !showAIConfig"
                    class="w-full flex items-center justify-between text-lg font-semibold text-gray-200 p-4 hover:bg-gray-800 transition-colors"
                    >
                        <span class="flex items-center gap-2"><span class="text-blue-400">🤖</span> AI Intelligence</span>
                        <span class="text-xs text-gray-500 transform transition-transform duration-200" :class="showAIConfig ? 'rotate-180' : ''">▼</span>
                    </button>
                    
                    <div v-show="showAIConfig" class="p-4 border-t border-gray-700 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-gray-900/30">
                    <!-- Provider Selection -->
                    <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
                    <div class="flex gap-2">
                        <button 
                        @click="updateAiProvider('gemini')"
                        :class="[
                            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                            currentProvider === 'gemini' 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        ]"
                        >
                        Google Gemini
                        </button>
                        <button 
                        @click="updateAiProvider('groq')"
                        :class="[
                            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                            currentProvider === 'groq' 
                            ? 'bg-orange-600 border-orange-500 text-white' 
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        ]"
                        >
                        Groq (Llama 3) 🚀
                        </button>
                    </div>
                    </div>

                    <!-- Gemini Config -->
                    <div v-if="currentProvider === 'gemini'" class="space-y-2 fade-in">
                    <label class="block text-sm font-medium text-gray-400">Gemini API Key</label>
                    <div class="flex gap-2">
                        <input 
                            v-model="geminiKeyInput"
                            type="password" 
                            placeholder="AIzaSy..."
                            class="flex-1 bg-gray-900 text-gray-200 px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none placeholder-gray-600"
                        />
                        <button @click="saveGeminiKey" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Save
                        </button>
                    </div>
                    <p class="text-xs text-gray-500">
                        Required for "The Oracle" recommendations. Get a free key at 
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-400 hover:underline">Google AI Studio</a>.
                    </p>
                    </div>

                    <!-- Groq Config -->
                    <div v-if="currentProvider === 'groq'" class="space-y-2 fade-in">
                    <label class="block text-sm font-medium text-gray-400">Groq API Key</label>
                    <div class="flex gap-2">
                        <input 
                            v-model="groqKeyInput"
                            type="password" 
                            placeholder="gsk_..."
                            class="flex-1 bg-gray-900 text-gray-200 px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none placeholder-gray-600"
                        />
                        <button @click="saveGroqKey" class="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Save
                        </button>
                    </div>
                    <p class="text-xs text-gray-500">
                        Extremely fast Llama 3 models with high free limits. Get a free key at 
                        <a href="https://console.groq.com/keys" target="_blank" class="text-orange-400 hover:underline">Groq Console</a>.
                    </p>
                    </div>

                    <!-- Tavily Config (Global) -->
                    <div class="pt-4 border-t border-gray-700 space-y-2 fade-in">
                         <label class="block text-sm font-medium text-purple-400 flex items-center gap-2">
                            🌍 Live Web Access (Optional)
                        </label>
                         <div class="flex gap-2">
                            <input 
                                v-model="tavilyKeyInput"
                                type="password" 
                                placeholder="tvly-..."
                                class="flex-1 bg-gray-900 text-gray-200 px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none placeholder-gray-600"
                            />
                            <button @click="saveTavilyKey" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                Save
                            </button>
                        </div>
                        <p class="text-xs text-gray-500">
                            Enables REAL-TIME patch notes search. Get a free key (1000 searches/mo) at 
                            <a href="https://tavily.com/" target="_blank" class="text-purple-400 hover:underline">tavily.com</a>.
                        </p>
                    </div>
                </div>

                </div>
            </div>
            
          </div>
          
            <!-- IGNORED GAMES MANAGEMENT (Collapsible) -->
             <div class="space-y-4 pt-6 border-t border-gray-700">
                <div class="rounded-xl border border-gray-700 overflow-hidden bg-gray-800/50">
                    <button 
                    @click="showIgnoredGames = !showIgnoredGames"
                    class="w-full flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white transition-colors p-4 hover:bg-gray-800"
                    >
                        <span class="flex items-center gap-2">🚫 Ignored Games ({{ ignoredGames.length }})</span>
                        <span class="text-xs text-gray-500 transform transition-transform duration-200" :class="showIgnoredGames ? 'rotate-180' : ''">▼</span>
                    </button>

                    <div v-show="showIgnoredGames" class="p-4 border-t border-gray-700 animate-in slide-in-from-top-2 fade-in duration-200 bg-gray-900/30">
                        <div v-if="ignoredGames.length > 0" class="bg-gray-950 rounded-lg border border-gray-700 overflow-hidden max-h-40 overflow-y-auto">
                            <div v-for="game in ignoredGames" :key="game.id" class="flex items-center justify-between p-3 border-b border-gray-700/50 last:border-0 hover:bg-gray-900 transition-colors">
                                <span class="text-sm text-gray-300">{{ game.title }}</span>
                                <button @click="unignoreGame(game.id)" class="text-xs text-red-400 hover:text-red-300 hover:underline">
                                    Remove
                                </button>
                            </div>
                        </div>
                        <p v-else class="text-xs text-gray-500 italic text-center py-4 bg-gray-950/50 rounded-lg border border-gray-700/50">
                            No ignored games. Recommendations you mark as "Not Interested" will appear here.
                        </p>
                    </div>
                </div>
             </div>

        </div>

        <!-- ================== PROFILE TAB ================== -->
        <div v-if="activeTab === 'profile'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <!-- Avatar & Name -->
            <div class="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div class="relative group cursor-pointer" @click="triggerAvatarUpload">
                    <div class="w-16 h-16 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-600 group-hover:border-primary transition-colors flex items-center justify-center">
                        <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover" />
                        <User v-else class="w-8 h-8 text-gray-400" />
                    </div>
                    <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload class="w-4 h-4 text-white" />
                    </div>
                </div>
                <div class="flex-1">
                    <label class="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">Username</label>
                    <input 
                      :value="userName" 
                      @input="e => setUserName(e.target.value)"
                      type="text" 
                      class="bg-transparent border-b border-gray-600 focus:border-primary text-white w-full py-1 outline-none transition-colors font-bold text-lg" 
                      placeholder="Enter your name"
                    />
                </div>
                <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
            </div>

            <!-- Title Selection -->
            <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                     <span class="text-xs text-gray-400 uppercase tracking-wider font-bold">Current Title</span>
                     <span class="text-xs text-blue-400">{{ availableTitles.length }} Unlocked</span>
                </div>
                <div class="flex items-center justify-between">
                     <h4 class="text-yellow-400 font-bold text-lg drop-shadow-sm">{{ userTitle }}</h4>
                     <button @click="showTitles = !showTitles" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition-colors">
                         Change
                     </button>
                </div>
                
                <div v-if="showTitles" class="mt-3 pt-3 border-t border-gray-700 max-h-40 overflow-y-auto space-y-1">
                    <button 
                      v-for="t in availableTitles" 
                      :key="t.title"
                      @click="setUserTitle(t.title); showTitles = false"
                      class="w-full text-left px-3 py-2 rounded hover:bg-gray-600/50 text-sm transition-colors flex items-center justify-between"
                      :class="userTitle === t.title ? 'text-yellow-400 bg-gray-700/50' : 'text-gray-300'"
                    >
                       <span>{{ t.title }}</span>
                       <span v-if="userTitle === t.title" class="text-xs opacity-70">Active</span>
                       <span v-else class="text-xs text-gray-500">Lvl {{ t.level }}</span>
                    </button>
                </div>
            </div>


        </div>

        <!-- ================== SYSTEM TAB (DATA) ================== -->
        <div v-if="activeTab === 'data'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h3 class="text-sm font-medium text-gray-300 mb-3">Data Management</h3>
            <div class="flex gap-3">
              <button @click="exportData" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors border border-gray-700 hover:border-gray-500 group">
                <div class="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Download class="w-5 h-5" /> <span class="font-bold">Export JSON</span>
                </div>
                <span class="text-[10px] text-gray-400 font-mono">{{ lastBackupDisplay }}</span>
              </button>
              
              <button @click="triggerImport" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors border border-gray-700 hover:border-gray-500 group">
                <div class="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Upload class="w-5 h-5" /> <span class="font-bold">Import JSON</span>
                </div>
                <span class="text-[10px] text-gray-400">Restore from file</span>
              </button>
              <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />
            </div>
            <p v-if="importStatus" class="mt-2 text-sm text-green-400 text-center font-bold animate-pulse">{{ importStatus }}</p>
          </div>

          <!-- Troubleshooting -->
          <div class="pt-6 border-t border-gray-800">
             <h3 class="text-sm font-medium text-red-200/70 mb-3">Danger Zone</h3>
             <button @click="forceUpdate" class="w-full bg-red-900/20 hover:bg-red-900/40 text-red-200 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-900/30 text-sm hover:border-red-500/50">
                <RefreshCw class="w-4 h-4" /> Force Update / Reset Cache
             </button>
             <p class="text-[10px] text-gray-500 mt-2 text-center">Use this only if the app is misbehaving.</p>
          </div>
        </div>

      </div>

      <div class="text-center pb-4">
           <p class="text-xs text-gray-500 font-mono">v{{ version }}</p>
      </div>
    </div>
  </div>
</template>
