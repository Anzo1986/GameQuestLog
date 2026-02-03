import { ref } from 'vue';
import { useShop } from './useShop';
import { useGames } from './useGames';

const STORAGE_KEY = 'game-tracker-daily-login';

const state = ref({
    lastLoginDate: null, // "YYYY-MM-DD"
    currentStreak: 0,
    claimedToday: false
});

// Load state
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
    try {
        state.value = JSON.parse(saved);
    } catch (e) { console.error('Failed to parse login state', e); }
}

export function useDailyLogin() {
    const { addCoins } = useShop();
    const { awardXP } = useGames();

    const getTodayDate = () => {
        return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    };

    const checkLogin = () => {
        const today = getTodayDate();
        const last = state.value.lastLoginDate;

        // Reset "claimedToday" if it's a new day
        if (state.value.claimedToday && last !== today) {
            state.value.claimedToday = false;
        }

        // Just checking status, not modifying streak yet until claim? 
        // OR modify streak immediately on check?
        // Let's modify logic to prepare specific state for the UI, 
        // but commit streak change only on claim or robust check.

        // Actually, let's calc what the streak WOULD be.
        let potentialStreak = state.value.currentStreak;

        if (!last) {
            // First time ever
            potentialStreak = 1;
        } else if (last !== today) {
            const oneDayMs = 24 * 60 * 60 * 1000;
            const lastDate = new Date(last);
            const todayDate = new Date(today);
            const diff = Math.round((todayDate - lastDate) / oneDayMs);

            if (diff === 1) {
                // Consecutive day
                // Don't auto-increment here because if we refresh page 10 times we don't want +10.
                // We increment ONLY if we haven't updated for *this* day yet?
                // Wait, we need to know if we already processed logic for today.
                // "lastLoginDate" acts as "last PROCESSED login date".

                // So if last != today, it means we haven't processed today.
                // So it IS a consecutive day.
                potentialStreak++;
            } else {
                // Missed a day (diff > 1)
                potentialStreak = 1;
            }
        }

        // Cap at 30 (Loop)
        if (potentialStreak > 30) potentialStreak = 1;

        return {
            today,
            last,
            streak: potentialStreak,
            claimed: state.value.claimedToday || (last === today && state.value.claimedToday)
        };
    };

    const claimBonus = () => {
        const { today, streak, claimed } = checkLogin();

        if (claimed) return { success: false, message: 'Already claimed' };

        // Award Coins
        const coinReward = streak === 30 ? 100 : 5;
        addCoins(coinReward);

        // Award XP (Milestones: 5, 10, 15, 20, 25)
        let xpReward = 0;
        if (streak === 5) xpReward = 50;
        if (streak === 10) xpReward = 100;
        if (streak === 15) xpReward = 150;
        if (streak === 20) xpReward = 200;
        if (streak === 25) xpReward = 250;

        if (xpReward > 0) {
            awardXP(xpReward);
        }

        // Update State
        state.value.lastLoginDate = today;
        state.value.currentStreak = streak;
        state.value.claimedToday = true;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));

        return { success: true, reward: coinReward, xp: xpReward, streak };
    };

    return {
        loginState: state,
        checkLogin,
        claimBonus
    };
}
