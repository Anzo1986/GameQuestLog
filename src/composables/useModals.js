import { ref } from 'vue';

const activeModal = ref(null);
const modalProps = ref({});

export function useModals() {

    const openModal = (name, props = {}) => {
        activeModal.value = name;
        modalProps.value = props;
        history.pushState({ modal: name }, '', '');
    };

    const closeModal = () => {
        if (activeModal.value) {
            history.back();
            // activeModal cleared by popstate listener usually, 
            // but if called manually we might need to await popstate?
            // Actually standard pattern: UI calls closeModal() -> history.back() -> popstate event -> activeModal = null.
        }
    };

    // For direct closing without history manipulation (e.g. from popstate handler)
    const resetModal = () => {
        activeModal.value = null;
        modalProps.value = {};
    };

    return {
        activeModal,
        modalProps,
        openModal,
        closeModal,
        resetModal
    };
}
