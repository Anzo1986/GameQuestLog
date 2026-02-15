import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDailyLogin } from '../useDailyLogin';

// Mock dependencies
const mockAddCoins = vi.fn();
const mockAwardXP = vi.fn();

vi.mock('../useShop', () => ({
    useShop: () => ({
        addCoins: mockAddCoins,
        getEquippedItem: () => ({ value: 'none' })
    })
}));

vi.mock('../useGames', () => ({
    useGames: () => ({
        awardXP: mockAwardXP
    })
}));

describe('useDailyLogin', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Reset internal state if needed (state is outside function, might persist?)
        // In real app, state is singleton. In tests, we might need to reset it manually via a helper if exposed,
        // or rely on fresh module import (vitest usually isolates).
        // Since state is constant outside function, let's manually reset it if we can access it.
        // But it is exported as `loginState`.
        const { loginState } = useDailyLogin();
        loginState.value = { lastLoginDate: null, currentStreak: 0, claimedToday: false };
    });

    it('should initialize with default state', () => {
        const { loginState } = useDailyLogin();
        expect(loginState.value.currentStreak).toBe(0);
        expect(loginState.value.lastLoginDate).toBeNull();
    });

    it('should claim daily reward for Day 1 (5 Coins)', () => {
        const { claimBonus, checkLogin } = useDailyLogin();

        // Mock Date
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01'));

        const result = claimBonus();

        expect(result.success).toBe(true);
        expect(result.streak).toBe(1);
        expect(mockAddCoins).toHaveBeenCalledWith(5); // 5 Coins
        expect(mockAwardXP).not.toHaveBeenCalled(); // No XP on normal days

        vi.useRealTimers();
    });

    it('should increment streak on consecutive day', () => {
        const { claimBonus, loginState } = useDailyLogin();

        // Setup Day 1
        loginState.value = { lastLoginDate: '2025-01-01', currentStreak: 1, claimedToday: true };

        // Advance to Day 2
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-02'));

        const result = claimBonus();

        expect(result.success).toBe(true);
        expect(result.streak).toBe(2);
        expect(mockAddCoins).toHaveBeenCalledWith(5);

        vi.useRealTimers();
    });

    it('should reset streak if day is missed', () => {
        const { claimBonus, loginState } = useDailyLogin();

        // Setup Day 1
        loginState.value = { lastLoginDate: '2025-01-01', currentStreak: 5, claimedToday: true };

        // Advance to Day 3 (Skipped Jan 02)
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-03'));

        const result = claimBonus();

        expect(result.streak).toBe(1); // Reset
        expect(mockAddCoins).toHaveBeenCalledWith(5);

        vi.useRealTimers();
    });

    it('should award ONLY XP on Day 5 (Milestone)', () => {
        const { claimBonus, loginState } = useDailyLogin();

        // Setup Day 4
        loginState.value = { lastLoginDate: '2025-01-04', currentStreak: 4, claimedToday: true };

        // Advance to Day 5
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-05'));

        const result = claimBonus();

        expect(result.streak).toBe(5);
        expect(mockAwardXP).toHaveBeenCalledWith(50); // XP Reward
        expect(mockAddCoins).not.toHaveBeenCalled(); // Mutually Exclusive!

        vi.useRealTimers();
    });

    it('should award 100 Coins on Day 30 (Big Reward)', () => {
        const { claimBonus, loginState } = useDailyLogin();

        // Setup Day 29
        loginState.value = { lastLoginDate: '2025-01-29', currentStreak: 29, claimedToday: true };

        // Advance to Day 30
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-30'));

        const result = claimBonus();

        expect(result.streak).toBe(30);
        expect(mockAddCoins).toHaveBeenCalledWith(100);
        expect(mockAwardXP).not.toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('should prevent double claiming', () => {
        const { claimBonus } = useDailyLogin();

        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01'));

        // First Claim
        const result1 = claimBonus();
        expect(result1.success).toBe(true);

        // Second Claim
        const result2 = claimBonus();
        expect(result2.success).toBe(false);
        expect(result2.message).toBe('Already claimed');

        expect(mockAddCoins).toHaveBeenCalledTimes(1); // Only once

        vi.useRealTimers();
    });

    it('should correctly track maxStreak', () => {
        const { claimBonus, loginState } = useDailyLogin();

        // 1. Start with fresh state
        loginState.value = { lastLoginDate: null, currentStreak: 0, maxStreak: 0, claimedToday: false };

        vi.useFakeTimers();

        // Day 1
        vi.setSystemTime(new Date('2025-02-01'));
        claimBonus();
        expect(loginState.value.currentStreak).toBe(1);
        expect(loginState.value.maxStreak).toBe(1);

        // Day 2 (Streak 2)
        vi.setSystemTime(new Date('2025-02-02'));
        claimBonus();
        expect(loginState.value.currentStreak).toBe(2);
        expect(loginState.value.maxStreak).toBe(2);

        // Day 4 (Missed Day 3 -> Reset to 1)
        vi.setSystemTime(new Date('2025-02-04'));
        claimBonus();
        expect(loginState.value.currentStreak).toBe(1);
        expect(loginState.value.maxStreak).toBe(2); // Should remain 2!

        // Day 5 (Streak 2) - tied with max
        vi.setSystemTime(new Date('2025-02-05'));
        claimBonus();
        expect(loginState.value.currentStreak).toBe(2);
        expect(loginState.value.maxStreak).toBe(2);

        // Day 6 (Streak 3) - New Record!
        vi.setSystemTime(new Date('2025-02-06'));
        claimBonus();
        expect(loginState.value.currentStreak).toBe(3);
        expect(loginState.value.maxStreak).toBe(3);

        vi.useRealTimers();
    });

});
