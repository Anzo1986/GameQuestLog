import { onMounted, onUnmounted, ref } from 'vue';

export function useSwipe(elementRef, options = {}) {
    const touchStart = ref({ x: 0, y: 0 });
    const touchEnd = ref({ x: 0, y: 0 });

    // Configurable options with defaults
    const minSwipeDistance = options.minSwipeDistance || 50;
    const maxSlope = options.maxSlope || 0.5; // New: Accept diagonal swipes up to this slope (dy/dx)

    const handleTouchStart = (e) => {
        // Optional: Ignore swipes starting on specific elements
        if (options.ignoreClass && e.target.closest(`.${options.ignoreClass}`)) {
            return;
        }

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

    const handleTouchCancel = (e) => {
        // Reset on cancel
        touchStart.value = { x: 0, y: 0 };
        touchEnd.value = { x: 0, y: 0 };
    }

    const checkSwipe = () => {
        const distanceX = touchStart.value.x - touchEnd.value.x;
        const distanceY = touchStart.value.y - touchEnd.value.y;

        const absX = Math.abs(distanceX);
        const absY = Math.abs(distanceY);

        // 1. Minimum Horizontal Distance
        if (absX < minSwipeDistance) return;

        // 2. Slope Check (ensures it's mostly horizontal)
        // Avoid division by zero, though absX >= 50 ensures it's > 0
        const slope = absY / absX;

        if (slope < maxSlope) {
            if (distanceX > 0 && options.onSwipeLeft) {
                options.onSwipeLeft();
            } else if (distanceX < 0 && options.onSwipeRight) {
                options.onSwipeRight();
            }
        }
    };

    onMounted(() => {
        if (elementRef.value) {
            elementRef.value.addEventListener('touchstart', handleTouchStart, { passive: true });
            elementRef.value.addEventListener('touchend', handleTouchEnd, { passive: true });
            elementRef.value.addEventListener('touchcancel', handleTouchCancel, { passive: true });
        }
    });

    onUnmounted(() => {
        if (elementRef.value) {
            elementRef.value.removeEventListener('touchstart', handleTouchStart);
            elementRef.value.removeEventListener('touchend', handleTouchEnd);
            elementRef.value.removeEventListener('touchcancel', handleTouchCancel);
        }
    });

    return {
        touchStart,
        touchEnd
    };
}
