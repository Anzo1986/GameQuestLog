import { onMounted, onUnmounted, ref } from 'vue';

export function useSwipe(elementRef, options = {}) {
    const touchStart = ref({ x: 0, y: 0 });
    const touchEnd = ref({ x: 0, y: 0 });

    // Configurable options with defaults
    const minSwipeDistance = options.minSwipeDistance || 50;
    const maxVerticalDistance = options.maxVerticalDistance || 30; // To prevent scrolling from triggering swipe

    const handleTouchStart = (e) => {
        touchEnd.value = { x: 0, y: 0 }; // Reset
        touchStart.value = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        };
    };

    const handleTouchEnd = (e) => {
        touchEnd.value = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };
        checkSwipe();
    };

    const checkSwipe = () => {
        const distanceX = touchStart.value.x - touchEnd.value.x;
        const distanceY = touchStart.value.y - touchEnd.value.y;

        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;

        // Ensure the swipe is mostly horizontal
        if (Math.abs(distanceY) < maxVerticalDistance) {
            if (isLeftSwipe && options.onSwipeLeft) {
                options.onSwipeLeft();
            }
            if (isRightSwipe && options.onSwipeRight) {
                options.onSwipeRight();
            }
        }
    };

    onMounted(() => {
        if (elementRef.value) {
            elementRef.value.addEventListener('touchstart', handleTouchStart, { passive: true });
            elementRef.value.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    });

    onUnmounted(() => {
        if (elementRef.value) {
            elementRef.value.removeEventListener('touchstart', handleTouchStart);
            elementRef.value.removeEventListener('touchend', handleTouchEnd);
        }
    });

    return {
        touchStart,
        touchEnd
    };
}
