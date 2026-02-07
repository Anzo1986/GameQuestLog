<script setup>
import { useToast } from '../composables/useToast';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-vue-next';

const { toasts, removeToast } = useToast();

const getIcon = (type) => {
    switch (type) {
        case 'success': return CheckCircle2;
        case 'warning': return AlertTriangle;
        case 'error': return X;
        default: return Info;
    }
};

const getClasses = (type) => {
    switch (type) {
        case 'success': return 'border-l-4 border-green-500 bg-gray-900/95 text-white shadow-green-500/10';
        case 'warning': return 'border-l-4 border-yellow-500 bg-gray-900/95 text-white shadow-yellow-500/10';
        case 'error': return 'border-l-4 border-red-500 bg-gray-900/95 text-white shadow-red-500/10';
        default: return 'border-l-4 border-blue-500 bg-gray-900/95 text-white shadow-blue-500/10';
    }
};
</script>

<template>
    <div class="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
        <transition-group 
            enter-active-class="transition ease-out duration-300 transform"
            enter-from-class="translate-x-full opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="translate-x-full opacity-0"
        >
            <div 
                v-for="toast in toasts" 
                :key="toast.id" 
                class="flex items-start gap-3 p-4 rounded-lg shadow-xl w-80 pointer-events-auto backdrop-blur-sm border border-gray-700/50"
                :class="getClasses(toast.type)"
            >
                <component :is="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="{
                    'text-green-400': toast.type === 'success',
                    'text-yellow-400': toast.type === 'warning',
                    'text-red-400': toast.type === 'error',
                    'text-blue-400': toast.type === 'info'
                }" />
                
                <div class="flex-1 text-sm font-medium leading-tight pt-0.5">
                    {{ toast.message }}
                </div>

                <button @click="removeToast(toast.id)" class="text-gray-400 hover:text-white transition-colors">
                    <X class="w-4 h-4" />
                </button>
            </div>
        </transition-group>
    </div>
</template>
