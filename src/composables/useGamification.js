import { ref, computed } from 'vue';

const USER_STORAGE_KEY = 'game-tracker-user';

// Shared State for Gamification
const userXP = ref(0);

// Initialize XP from storage
// (Duplicate logic from useSettings? ideally we share one load, but safeguards are fine)
const savedUser = localStorage.getItem(USER_STORAGE_KEY);
if (savedUser) {
    try {
        const userData = JSON.parse(savedUser);
        userXP.value = userData.xp || 0;
    } catch (e) {
        console.error('Failed to parse user XP', e);
    }
}

import { LEVEL_CURVE } from '../config/gamification';

export function useGamification() {

    // Math Formulas
    const getLevelFromXP = (xp) => Math.floor(Math.pow(xp / LEVEL_CURVE.BASE_XP, 1 / LEVEL_CURVE.EXPONENT)) + 1;
    const getXPForLevel = (level) => Math.ceil(LEVEL_CURVE.BASE_XP * Math.pow(level - 1, LEVEL_CURVE.EXPONENT));

    const userLevel = computed(() => getLevelFromXP(userXP.value));

    const levelStartXP = computed(() => getXPForLevel(userLevel.value));
    const nextLevelXP = computed(() => getXPForLevel(userLevel.value + 1));

    // Progress within current level
    const xpProgress = computed(() => {
        const start = levelStartXP.value;
        const end = nextLevelXP.value;
        const current = userXP.value;

        if (end <= start) return 100;

        const progress = ((current - start) / (end - start)) * 100;
        return Math.min(100, Math.max(0, progress));
    });

    const awardXP = (amount) => {
        userXP.value += amount;
        // console.log(`Awarded ${amount} XP! New Total: ${userXP.value}`);
    };

    // Track Quest Usage
    const incrementQuestUsage = () => {
        let count = parseInt(localStorage.getItem('game-tracker-quest-usage') || '0');
        count++;
        localStorage.setItem('game-tracker-quest-usage', count.toString());
        return count;
    };

    // Titles Configuration
    const TITLES = [
        { level: 100, title: 'Godlike Entity' },
        { level: 95, title: 'Architect of Fun' },
        { level: 90, title: 'Timeless One' },
        { level: 85, title: 'Reality Bender' },
        { level: 80, title: 'Ascended Being' },
        { level: 75, title: 'Avatar of Gaming' },
        { level: 70, title: 'High Score King' },
        { level: 65, title: 'Pixel Perfect' },
        { level: 60, title: '8-Bit Emperor' },
        { level: 55, title: 'Console Conqueror' },
        { level: 50, title: 'Grandmaster' },
        { level: 45, title: 'Mythic Champion' },
        { level: 40, title: 'Legendary Hero' },
        { level: 36, title: 'Legend in the Making' },
        { level: 32, title: 'Hardcore Veteran' },
        { level: 28, title: 'Speedrunner' },
        { level: 24, title: 'Completionist' },
        { level: 20, title: 'Master of Worlds' },
        { level: 16, title: 'Rare Collector' },
        { level: 13, title: 'Boss Battler' },
        { level: 10, title: 'Elite Gamer' },
        { level: 8, title: 'Dungeon Crawler' },
        { level: 5, title: 'Quest Seeker' },
        { level: 3, title: 'Apprentice Hero' },
        { level: 1, title: 'Novice Adventurer' },
    ];

    const availableTitles = computed(() => {
        return TITLES.filter(t => userLevel.value >= t.level).sort((a, b) => b.level - a.level); // Highest first
    });

    // Helper to get title based on level (if no override)
    const getTitleForLevel = (level) => {
        const match = TITLES.find(t => level >= t.level);
        return match ? match.title : 'Novice Adventurer';
    };

    return {
        userXP,
        userLevel,
        nextLevelXP,
        levelStartXP,
        xpProgress,
        awardXP,
        incrementQuestUsage,
        TITLES,
        availableTitles,
        getTitleForLevel
    };
}
