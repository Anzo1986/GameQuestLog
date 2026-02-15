<script setup>
import { X } from 'lucide-vue-next';

defineProps({
    isOpen: Boolean,
    title: {
        type: String,
        default: ''
    },
    maxWidth: {
        type: String,
        default: 'max-w-md' // 'max-w-2xl', 'max-w-lg', etc.
    },
    alignTop: {
        type: Boolean,
        default: false
    }
});

defineEmits(['close']);
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[60] flex justify-center p-4 transition-all duration-300" :class="alignTop ? 'items-start pt-20' : 'items-center'">
    <!-- Backdrop -->
    <!-- Unified Backdrop: blur-sm, black/80 -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <!-- Unified Animation: zoom-in-95, fade-in -->
    <div 
        class="relative w-full rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 isolation-auto"
        :class="maxWidth"
    >
        <!-- Optional Header Slot or Default Title -->
        <div v-if="title || $slots.header" class="p-4 sm:p-5 border-b border-gray-700/50 flex items-center justify-between bg-gray-800/30 rounded-t-2xl">
            <h3 v-if="title" class="text-xl font-bold text-white">{{ title }}</h3>
            <slot name="header"></slot>
            
            <!-- Unified Close Button -->
            <button 
                @click="$emit('close')" 
                class="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-colors active:scale-95"
            >
                <X class="w-5 h-5" />
            </button>
        </div>
        <!-- Close button if no header but still need close logic (e.g. custom layout) -->
         <button 
            v-else
            @click="$emit('close')" 
            class="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors active:scale-95"
        >
            <X class="w-5 h-5" />
        </button>

        <!-- Body -->
        <div class="overflow-y-auto custom-scrollbar flex-1 relative">
            <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="p-4 sm:p-5 border-t border-gray-700/50 bg-gray-800/30 rounded-b-2xl flex justify-end gap-3">
            <slot name="footer"></slot>
        </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
}
</style>
