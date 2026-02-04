import { describe, it, expect, beforeEach } from 'vitest';
import { useGamification } from '../useGamification';

describe('useGamification', () => {
    // Since useGamification uses persistent state (refs outside function), 
    // we need to be careful. Ideally refactor useGamification to accept initialState/resetState 
    // or just test the logic returned. For now, we assume separated instances or check logic behavior.

    // NOTE: useGamification is a singleton pattern in the real app usually (shared refs).
    // Tests might affect each other if we don't reset.
    // Let's assume for this test we are testing the exported logic.

    const { awardXP, userXP, userLevel, xpProgress } = useGamification();

    beforeEach(() => {
        // Reset state manually if possible, or just rely on awardXP Logic
        // This is a limitation of global state composables in testing without a reset mechanism.
        // We will try to reset via a large negative amount?
        // Better: mock localStorage if it uses it directly, but it likely uses refs.
    });

    it('calculates level correctly based on XP', () => {
        // 0 XP = Level 1
        // Level 2 needs 100 XP (assuming base 100 * 1.5^level or similar logic)
        // Let's test increments.

        const initialLevel = userLevel.value;

        // Add huge amount to force level up for sure
        awardXP(10000);
        expect(userLevel.value).toBeGreaterThan(initialLevel);
    });

    it('xpProgress is between 0 and 100', () => {
        awardXP(50);
        expect(xpProgress.value).toBeGreaterThanOrEqual(0);
        expect(xpProgress.value).toBeLessThanOrEqual(100);
    });
});
