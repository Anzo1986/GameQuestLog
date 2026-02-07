<script setup>
import { X, AlertTriangle } from 'lucide-vue-next';

defineProps({
    isOpen: Boolean,
    title: {
        type: String,
        default: 'Are you sure?'
    },
    message: {
        type: String,
        default: 'This action cannot be undone.'
    },
    confirmText: {
        type: String,
        default: 'Confirm'
    },
    confirmColor: {
        type: String,
        default: 'bg-red-500 hover:bg-red-600'
    }
});

const emit = defineEmits(['close', 'confirm']);
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" @click.self="$emit('close')">
        <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 p-6 relative">
            
            <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <X class="w-6 h-6" />
            </button>

            <div class="flex flex-col items-center text-center gap-4">
                <div class="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                    <AlertTriangle class="w-8 h-8 text-red-500" />
                </div>
                
                <h2 class="text-2xl font-bold text-white">{{ title }}</h2>
                
                <p class="text-gray-400">{{ message }}</p>

                <div class="flex gap-3 w-full mt-2">
                    <button 
                        @click="$emit('close')" 
                        class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="$emit('confirm')" 
                        class="flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                        :class="confirmColor"
                    >
                        {{ confirmText }}
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>
