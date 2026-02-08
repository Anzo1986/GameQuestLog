<script setup>
import { ref, computed } from 'vue';
import { Download, Upload, Key, Save, User, Check, X, RefreshCw } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useAchievements } from '../composables/useAchievements';
import { useSettings } from '../composables/useSettings';


const emit = defineEmits(['close']);

const { 
  apiKey, setApiKey, exportData: exportDataRaw, importData, 
  userAvatar, setUserAvatar, 
  themeColor, setTheme, THEMES,
  userName, setUserName,
  userTitle, availableTitles, setUserTitle
} = useGames();

const { trackAction } = useAchievements();
const { lastBackup } = useSettings();


const lastBackupDisplay = computed(() => {
    if (!lastBackup.value) return 'No backup recorded yet';
    const date = new Date(lastBackup.value);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Last backup: Today';
    if (diffDays === 1) return 'Last backup: Yesterday';
    return `Last backup: ${diffDays} days ago (${date.toLocaleDateString()})`;
});

const exportData = () => {
    exportDataRaw();
    trackAction('export');
};

const newKey = ref(apiKey.value);
const fileInput = ref(null);
const avatarInput = ref(null);
const importStatus = ref('');
const showTitles = ref(false);

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
  alert('API Key saved!');
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
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-300">API Configuration</h3>
                <button @click="saveKey" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-lg">
                    <Save class="w-4 h-4" /> Save Keys
                </button>
            </div>
            
            <!-- RAWG Key -->
            <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <label class="block text-sm font-medium text-gray-300 mb-2">RAWG.io API Key</label>
                <div class="relative">
                     <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input 
                      v-model="newKey" 
                      type="text" 
                      placeholder="Enter your RAWG API Key" 
                      class="w-full bg-gray-950 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <p class="mt-2 text-xs text-gray-400">
                  Required for game data. <a href="https://rawg.io/apidocs" target="_blank" class="text-blue-400 hover:underline">Get key</a>.
                </p>
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
