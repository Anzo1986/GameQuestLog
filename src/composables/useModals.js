import { ref } from 'vue';

const modalStack = ref([]);
const activeModal = ref(null);
const modalProps = ref({});

export function useModals() {

    const openModal = (name, props = {}) => {
        modalStack.value.push({ name, props });
        activeModal.value = name;
        modalProps.value = props;
        history.pushState({ modal: name }, '', '');
    };

    const closeModal = () => {
        if (activeModal.value) {
            history.back();
            // The actual state update happens in the popstate listener.
        }
    };

    // Called when the browser's back button is pressed, or when history.back() is called
    const handlePopstate = () => {
        if (modalStack.value.length > 0) {
            // Remove the current modal from the stack (the one we just left)
            modalStack.value.pop();

            // Look at the new top of the stack
            if (modalStack.value.length > 0) {
                const previous = modalStack.value[modalStack.value.length - 1];
                activeModal.value = previous.name;
                modalProps.value = previous.props;
            } else {
                activeModal.value = null;
                modalProps.value = {};
            }
        }
    };

    // For direct explicit resets (clears the entire stack visually and from history)
    const resetModal = () => {
        const depth = modalStack.value.length;
        if (depth > 0) {
            // Because history.go is async, clear local state immediately
            modalStack.value = [];
            activeModal.value = null;
            modalProps.value = {};
            // Traverse history back to the starting point where no modals were open
            history.go(-depth);
        } else {
            // Just in case
            activeModal.value = null;
            modalProps.value = {};
        }
    };

    return {
        activeModal,
        modalProps,
        openModal,
        closeModal,
        resetModal,
        handlePopstate
    };
}
