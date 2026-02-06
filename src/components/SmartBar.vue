<script setup>
import { Search, ArrowUpDown, Calendar, Star, Type, LayoutGrid, LayoutList } from 'lucide-vue-next';
import { ref } from 'vue';
import { useSettings } from '../composables/useSettings';

const props = defineProps({
  searchQuery: String,
  sortOption: String
});

const emit = defineEmits(['update:searchQuery', 'update:sortOption']);

const isOpen = ref(false);
const { viewMode } = useSettings();

const toggleView = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

const sortOptions = [
    { value: 'added', label: 'Recently Added', icon: Calendar },
    { value: 'name', label: 'Name (A-Z)', icon: Type },
    { value: 'released', label: 'Release Date', icon: Calendar },
    { value: 'rating', label: 'Highest Rating', icon: Star },
];

const selectSort = (value) => {
    emit('update:sortOption', value);
    isOpen.value = false;
};

// Get current sort label
const currentLabel = () => sortOptions.find(o => o.value === props.sortOption)?.label || 'Sort';
</script>

<template>
  <div class="flex gap-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-300 items-center">
    <!-- Search Input -->
    <div class="relative flex-1 group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
        <div class="relative bg-gray-800 rounded-xl flex items-center px-3 border border-gray-700 focus-within:border-blue-500 transition-colors h-11">
            <Search class="w-4 h-4 text-gray-400 mr-2" />
            <input 
                :value="searchQuery"
                @input="$emit('update:searchQuery', $event.target.value)"
                type="text" 
                placeholder="Filter games..." 
                class="bg-transparent border-none text-sm text-white placeholder-gray-500 focus:ring-0 w-full h-full outline-none"
            />
             <button v-if="searchQuery" @click="$emit('update:searchQuery', '')" class="text-gray-500 hover:text-white">
                 <span class="sr-only">Clear</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
        </div>
    </div>

    <!-- Sort Dropdown -->
    <div class="relative">
        <button 
            @click="isOpen = !isOpen"
            class="h-11 bg-gray-800 hover:bg-gray-750 text-gray-300 px-3 rounded-xl border border-gray-700 hover:border-gray-600 flex items-center gap-2 text-sm font-medium transition-all min-w-[140px] justify-between"
        >
            <span class="flex items-center gap-2 truncate">
                <ArrowUpDown class="w-4 h-4 text-gray-400" />
                {{ currentLabel() }}
            </span>
        </button>

        <!-- Dropdown Menu -->
        <div v-if="isOpen" class="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
             <button 
                v-for="opt in sortOptions" 
                :key="opt.value"
                @click="selectSort(opt.value)"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 flex items-center gap-2 transition-colors"
                :class="sortOption === opt.value ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'"
             >
                <component :is="opt.icon" class="w-4 h-4 opacity-70" />
                {{ opt.label }}
             </button>
             
              <!-- Click outside overlay -->
             <div class="fixed inset-0 z-[-1]" @click="isOpen = false"></div>
        </div>
    </div>

    <!-- View Toggle -->
    <button 
        @click="toggleView"
        class="h-11 w-11 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl border border-gray-700 hover:border-gray-600 flex items-center justify-center transition-all hover:text-white flex-shrink-0"
        :title="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
    >
        <LayoutList v-if="viewMode === 'grid'" class="w-5 h-5" />
        <LayoutGrid v-else class="w-5 h-5" />
    </button>
  </div>
</template>
