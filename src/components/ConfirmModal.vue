<script setup>
import { AlertTriangle } from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';

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
    <BaseModal :is-open="isOpen" @close="$emit('close')" max-width="max-w-md">
        <div class="flex flex-col items-center text-center gap-4 p-6">
            <div class="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertTriangle class="w-8 h-8 text-red-500" />
            </div>
            
            <h2 class="text-2xl font-bold text-white">{{ title }}</h2>
            
            <p class="text-gray-400">{{ message }}</p>

            <div class="flex gap-3 w-full mt-2">
                <button 
                    @click="$emit('close')" 
                    class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors active:scale-95"
                >
                    Cancel
                </button>
                <button 
                    @click="$emit('confirm')" 
                    class="flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                    :class="confirmColor"
                >
                    {{ confirmText }}
                </button>
            </div>
        </div>
    </BaseModal>
</template>
