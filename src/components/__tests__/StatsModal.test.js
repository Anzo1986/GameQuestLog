import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import StatsModal from '../StatsModal.vue';
import { ref } from 'vue';

// Mock Dependencies
const mockGameStats = ref({
    statusCounts: { playing: 2, completed: 10, dropped: 1, backlog: 5 },
    genreCounts: { 'RPG': 10, 'Action': 5 },
    platformCounts: { 'PC': 15 },
    completionRate: 60,
    totalDurationDays: 100,
    averageRating: 4.8
});

vi.mock('../../composables/useGames', () => ({
    useGames: () => ({
        gameStats: mockGameStats,
        userLevel: ref(10),
        userTitle: ref('Master')
    })
}));

vi.mock('../../composables/useSettings', () => ({
    useSettings: () => ({
        themeColor: ref('purple'),
        THEMES: { purple: { rgb: '128 0 128' } }
    })
}));

vi.mock('../../composables/useDailyLogin', () => ({
    useDailyLogin: () => ({
        loginState: ref({ maxStreak: 10, currentStreak: 10 })
    })
}));

// Mock Chart Components
vi.mock('vue-chartjs', () => ({
    Doughnut: { template: '<div data-testid="doughnut-chart"></div>' },
    Radar: { template: '<div data-testid="radar-chart"></div>' },
    Bar: { template: '<div data-testid="bar-chart"></div>' }
}));

// Mock useSwipe
let capturedSwipeRightCallback = null;
vi.mock('../../composables/useSwipe', () => ({
    useSwipe: (el, options) => {
        if (options?.onSwipeRight) {
            capturedSwipeRightCallback = options.onSwipeRight;
        }
        return {};
    }
}));


describe('StatsModal', () => {

    it('should open detail view on card click', async () => {
        const wrapper = mount(StatsModal, {
            props: { isOpen: true }
        });

        // Verify initial state (Overview)
        expect(wrapper.text()).not.toContain('Library Status');

        // Click on "Library Status" card
        // We look for the card that contains "Library" text
        const cards = wrapper.findAll('.group');
        const libraryCard = cards.find(c => c.text().includes('Library'));

        expect(libraryCard).toBeDefined();
        await libraryCard.trigger('click');

        // Verify detail view is open
        expect(wrapper.text()).toContain('Library Status');
        expect(wrapper.find('[data-testid="doughnut-chart"]').exists()).toBe(true);
    });

    it('should close detail view on swipe right', async () => {
        const wrapper = mount(StatsModal, {
            props: { isOpen: true }
        });

        // 1. Open Detail View
        const cards = wrapper.findAll('.group');
        const libraryCard = cards.find(c => c.text().includes('Library'));
        await libraryCard.trigger('click');

        expect(wrapper.text()).toContain('Library Status');

        // 2. Trigger Swipe Right
        expect(capturedSwipeRightCallback).toBeDefined();
        capturedSwipeRightCallback();

        await wrapper.vm.$nextTick();

        // 3. Verify return to Overview
        expect(wrapper.text()).not.toContain('Library Status');
        expect(wrapper.find('[data-testid="doughnut-chart"]').exists()).toBe(false);
    });

});
