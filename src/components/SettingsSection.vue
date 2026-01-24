<script setup>
import { ref } from 'vue';
import { Download, Upload, Key, Save, User } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const { apiKey, setApiKey, exportData, importData, userAvatar, setUserAvatar } = useGames();
const newKey = ref(apiKey.value);
const fileInput = ref(null);
const avatarInput = ref(null);
const importStatus = ref('');

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
  <div class="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
    <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
      Settings
    </h2>

    <div class="space-y-6">
      
      <!-- API Key Section -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">RAWG.io API Key</label>
        <div class="flex gap-2">
          <div class="relative flex-1">
             <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
              v-model="newKey" 
              type="text" 
              placeholder="Enter your API Key" 
              class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button @click="saveKey" class="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Save class="w-4 h-4" /> Save
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-400">
          Don't have a key? <a href="https://rawg.io/apidocs" target="_blank" class="text-blue-400 hover:underline">Get one here</a>.
        </p>
      </div>

      <hr class="border-gray-700" />

      <!-- Avatar Upload -->
      <div>
        <h3 class="text-sm font-medium text-gray-300 mb-3">Profile Avatar</h3>
        <div class="flex items-center gap-4">
            <div class="relative group cursor-pointer" @click="triggerAvatarUpload">
                <div class="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 group-hover:border-blue-500 transition-colors flex items-center justify-center">
                    <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover" />
                    <User v-else class="w-8 h-8 text-gray-400" />
                </div>
                <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload class="w-4 h-4 text-white" />
                </div>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-400 mb-2">Upload a custom profile picture (max 250px).</p>
                <button @click="triggerAvatarUpload" class="text-sm text-blue-400 hover:text-blue-300 font-medium">Click to upload</button>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
        </div>
      </div>

      <hr class="border-gray-700" />

      <!-- Data Management -->
      <div>
        <h3 class="text-sm font-medium text-gray-300 mb-3">Data Management</h3>
        <div class="flex gap-3">
          <button @click="exportData" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Download class="w-4 h-4" /> Export JSON
          </button>
          <button @click="triggerImport" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Upload class="w-4 h-4" /> Import JSON
          </button>
          <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />
        </div>
        <p v-if="importStatus" class="mt-2 text-sm text-green-400 text-center">{{ importStatus }}</p>
      </div>

    </div>
  </div>
</template>
