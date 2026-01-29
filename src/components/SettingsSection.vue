<script setup>
import { ref } from 'vue';
import { Download, Upload, Key, Save, User, Check, X } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const emit = defineEmits(['close']);

const { 
  apiKey, setApiKey, exportData, importData, 
  userAvatar, setUserAvatar, 
  themeColor, setTheme, THEMES,
  userName, setUserName,
  userTitle, availableTitles, setUserTitle
} = useGames();

const newKey = ref(apiKey.value);
const fileInput = ref(null);
const avatarInput = ref(null);
const importStatus = ref('');
const showTitles = ref(false);

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
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900/95 backdrop-blur z-10 p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          Settings
        </h2>
        <button @click="$emit('close')" class="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors">
            <X class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        
        <!-- API Configuration -->
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

        <hr class="border-gray-800" />

        <!-- Profile Section -->
        <div>
          <h3 class="text-sm font-medium text-gray-300 mb-3">Profile</h3>
          
          <div class="space-y-4">
              <!-- Avatar -->
              <div class="flex items-center gap-4">
                  <div class="relative group cursor-pointer" @click="triggerAvatarUpload">
                      <div class="w-16 h-16 rounded-full bg-gray-800 overflow-hidden border-2 border-gray-600 group-hover:border-blue-500 transition-colors flex items-center justify-center">
                          <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover" />
                          <User v-else class="w-8 h-8 text-gray-400" />
                      </div>
                      <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload class="w-4 h-4 text-white" />
                      </div>
                  </div>
                  <div class="flex-1">
                      <label class="block text-xs text-gray-400 mb-1">Username</label>
                      <input 
                        :value="userName" 
                        @input="e => setUserName(e.target.value)"
                        type="text" 
                        class="bg-transparent border-b border-gray-600 focus:border-blue-500 text-white w-full py-1 outline-none transition-colors font-medium" 
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
                  
                  <!-- Dropdown for titles -->
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
        </div>

        <hr class="border-gray-800" />

        <!-- Theme Color -->
        <div>
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Appearance</h3>
          
          <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
               <label class="block text-sm font-medium text-gray-300 mb-3">Theme Color</label>
               <div class="flex flex-wrap gap-3">
                  <button 
                    v-for="(theme, key) in THEMES" 
                    :key="key"
                    @click="setTheme(key)"
                    class="w-10 h-10 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center"
                    :class="[
                       themeColor === key ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent'
                    ]"
                    :style="{ backgroundColor: `rgb(${theme.rgb})` }"
                    :title="theme.name"
                  >
                    <Check v-if="themeColor === key" class="w-5 h-5 text-white drop-shadow-md" />
                  </button>
               </div>
          </div>
        </div>

        <hr class="border-gray-800" />

        <!-- Data Management -->
        <div>
          <h3 class="text-sm font-medium text-gray-300 mb-3">Data Management</h3>
          <div class="flex gap-3">
            <button @click="exportData" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-700">
              <Download class="w-4 h-4" /> Export JSON
            </button>
            <button @click="triggerImport" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-700">
              <Upload class="w-4 h-4" /> Import JSON
            </button>
            <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />
          </div>
          <p v-if="importStatus" class="mt-2 text-sm text-green-400 text-center">{{ importStatus }}</p>
        </div>

      </div>

      <div class="text-center pb-4">
           <p class="text-xs text-gray-500 font-mono">v0.8.2</p>
      </div>
    </div>
  </div>
</template>
