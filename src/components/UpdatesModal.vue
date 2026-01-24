<script setup>
import { computed, ref } from 'vue';
import { X, ExternalLink, Calendar, CheckCircle2 } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const { updates, markUpdateSeen, scanForUpdates, isScanning, scanLogs, getScanPromptString } = useGames();
const showCopyFeedback = ref(false);

// Sort updates by date (newest first)
const sortedUpdates = computed(() => {
    return [...updates.value].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
});

const handleMarkSeen = (update) => {
    markUpdateSeen(update.gameId, update.version);
};

const handleScan = async () => {
    const result = await scanForUpdates();
    
    if (!result.success) {
        // Critical failures (missing key, no games)
        alert(result.error);
        return;
    }

    // Check for partial errors during loop
    if (result.errors && result.errors.length > 0) {
        // Just show the first error to keep it simple, or a summary
        alert(`Scan finished with issues.\n\nFailed games: ${result.errors.length}\nFirst error: ${result.errors[0]}`);
    } else if (result.newUpdates === 0) {
        alert(`Scanned ${result.scannedCount} games successfully.\nNo new updates found (latest versions already tracked?)`);
    } else {
        // Success case - new updates found
        // No alert needed, the UI will update
    }
};

const openLink = (url) => {
    if (url) window.open(url, '_blank');
};

const handleWebScan = async () => {
    const prompt = getScanPromptString();
    try {
        await navigator.clipboard.writeText(prompt);
        showCopyFeedback.value = true;
        setTimeout(() => showCopyFeedback.value = false, 3000);
        
        // Open Gemini
        window.open('https://gemini.google.com/app', '_blank');
    } catch (err) {
        console.error('Failed to copy: ', err);
        window.open('https://gemini.google.com/app', '_blank');
    }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="p-5 border-b border-gray-700 flex flex-col gap-4 bg-gray-800/50">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-blue-400">✨</span> Game Updates
            </h2>
            <div class="flex items-center gap-2">
                <button 
                    @click="handleScan" 
                    :disabled="isScanning"
                    class="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1 shadow-lg border border-blue-400/30"
                >
                    <span v-if="isScanning" class="animate-spin">⟳</span>
                    <span v-else>Scan API</span>
                </button>
                
                <button 
                    @click="handleWebScan" 
                    class="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1 shadow-lg border border-purple-400/30"
                    title="Copy Prompt & Open Gemini"
                >
                    <ExternalLink class="w-3 h-3" />
                    <span>{{ showCopyFeedback ? 'Copied!' : 'Ask Web' }}</span>
                </button>

                <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                    <X class="w-5 h-5" />
                </button>
            </div>
        </div>
        
        <!-- DEBUG LOGS -->
        <div v-if="scanLogs && scanLogs.length > 0" class="w-full p-2 bg-black/50 border border-gray-700 rounded text-xs font-mono h-32 overflow-y-auto">
            <div v-for="(log, i) in scanLogs" :key="i" :class="{'text-red-400': log.startsWith('❌') || log.startsWith('Error'), 'text-green-400': log.startsWith('✅') || log.startsWith('✔'), 'text-gray-400': true}">
                {{ log }}
            </div>
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto p-2 space-y-2 bg-gray-900/50">
         
         <div v-if="sortedUpdates.length === 0" class="p-10 text-center text-gray-500">
            <p>No updates found yet.</p>
            <p class="text-sm mt-2">Click the "Scan" button in the dashboard to check for new content.</p>
         </div>

         <div 
            v-for="update in sortedUpdates" 
            :key="update.gameId + update.version" 
            class="bg-gray-800 border-l-4 rounded-r-lg p-4 transition-all relative group"
            :class="update.seen ? 'border-gray-600 opacity-60' : 'border-blue-500'"
         >
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">{{ update.gameTitle }}</h3>
                    <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span class="px-1.5 py-0.5 bg-gray-700 rounded text-blue-200 font-mono">{{ update.version }}</span>
                        <span class="flex items-center gap-1"><Calendar class="w-3 h-3"/> {{ update.date }}</span>
                        <span class="text-gray-500 ml-2">Fetched: {{ new Date(update.fetchedAt).toLocaleTimeString() }}</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button 
                        v-if="update.originalLink" 
                        @click="openLink(update.originalLink)" 
                        class="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                        title="Read Full Patch Notes"
                    >
                        <ExternalLink class="w-4 h-4" />
                    </button>
                    <button 
                        v-if="!update.seen"
                        @click="handleMarkSeen(update)" 
                        class="p-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded-lg transition-colors"
                        title="Mark as Seen"
                    >
                        <CheckCircle2 class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div class="text-sm text-gray-300 bg-gray-900/50 p-3 rounded border border-gray-700/50">
                <p>{{ update.summary }}</p>
            </div>

         </div>
      </div>
      
    </div>
  </div>
</template>
