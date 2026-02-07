import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {

    const showToast = (message, type = 'info', duration = 5000) => {
        const id = Date.now();
        toasts.value.push({ id, message, type, duration });

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    };

    return {
        toasts,
        showToast,
        removeToast
    };
}
