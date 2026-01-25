import { ref, computed, watch } from 'vue';

const ACHIEVEMENTS_STORAGE_KEY = 'game-tracker-achievements';

const achievementsList = [
    // 1. Adding Games
    { id: 'add_1', title: 'Quest Beginner', description: 'Add your first game to the library.', icon: 'Plus' },
    { id: 'add_10_backlog', title: 'Backlog Warrior', description: 'Have 10 games in your backlog.', icon: 'Layers' },
    { id: 'add_50_total', title: 'The Collector', description: 'Amass a collection of 50 games.', icon: 'Library' },

    // 2. Completing Games
    { id: 'complete_1', title: 'First Blood', description: 'Complete 1 game.', icon: 'Trophy' },
    { id: 'complete_5', title: 'High Five', description: 'Complete 5 games.', icon: 'Trophy' },
    { id: 'complete_20', title: 'Veteran Gamer', description: 'Complete 20 games.', icon: 'Crown' },

    // 3. Dropping Games
    { id: 'drop_1', title: 'Quitter', description: 'Drop a game. Sometimes it is for the best.', icon: 'Ban' },
    { id: 'drop_5', title: 'Decisive', description: 'Drop 5 games. You know what you like.', icon: 'Ban' },

    // 4. Playing Habits
    { id: 'playing_5_concurrent', title: 'Indecisive', description: 'Have 5 games in "Playing" status at once.', icon: 'Shuffle' },
    { id: 'playing_1_only', title: 'Laser Focus', description: 'Have exactly 1 playing game while backlog is not empty.', icon: 'Focus' },

    // 5. Diversity
    { id: 'platforms_3', title: 'Platform Hopper', description: 'Own games on 3 different platforms.', icon: 'Gamepad2' },
    { id: 'platforms_5', title: 'Console Museum', description: 'Own games on 5 different platforms.', icon: 'Server' },
    { id: 'genres_5', title: 'Genre Explorer', description: 'Have games from 5 different genres.', icon: 'Map' },

    // 6. Ratings
    { id: 'rate_5_stars', title: 'Critic\'s Choice', description: 'Rate a game 5 stars.', icon: 'Star' },
    { id: 'rate_1_star', title: 'Harsh Critic', description: 'Rate a game 1 star.', icon: 'ThumbsDown' },

    // 7. Features
    { id: 'quest_1', title: 'Quest Accepted', description: 'Use the Quest Giver once.', icon: 'Dices' },
    { id: 'quest_10', title: 'Destiny Awaits', description: 'Use the Quest Giver 10 times.', icon: 'Sparkles' },

    // 8. Special / Complex
    { id: 'jack_of_all_trades', title: 'Jack of All Trades', description: 'Have at least one game in Playing, Completed, Dropped, and Backlog.', icon: 'Palette' },
    { id: 'marathon', title: 'Marathon', description: 'Complete a game with over 100 hours of playtime.', icon: 'Hourglass' },
    { id: 'quick_fix', title: 'Quick Fix', description: 'Complete a game with under 2 hours of playtime.', icon: 'Zap' },
];

// Persistent State
const unlockedAchievements = ref({});

// Load from storage
const savedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
if (savedAchievements) {
    try {
        unlockedAchievements.value = JSON.parse(savedAchievements);
    } catch (e) {
        console.error('Failed to parse achievements', e);
    }
}

// Queue for toasts to show (FIFO)
const recentUnlocks = ref([]);

export function useAchievements() {

    const saveAchievements = () => {
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlockedAchievements.value));
    };

    const unlock = (id) => {
        if (!unlockedAchievements.value[id]) {
            unlockedAchievements.value[id] = new Date().toISOString();
            saveAchievements(); // Save immediately

            const achievement = achievementsList.find(a => a.id === id);
            if (achievement) {
                recentUnlocks.value.push(achievement);
                // Remove from queue after 4 seconds automatically if UI doesn't handle it
                setTimeout(() => {
                    recentUnlocks.value = recentUnlocks.value.filter(a => a.id !== id);
                }, 5000);
            }
        }
    };

    const nukeAchievements = () => {
        unlockedAchievements.value = {};
        localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    };

    /**
     * Main check function. Call this whenever game state changes.
     * @param {Object} context - The context from useGames (games, userXP, etc)
     */
    const checkAchievements = (context) => {
        const { games, playingGames, backlogGames, completedGames, droppedGames, userXP } = context;
        const allGames = games.value;

        // 1. Quest Beginner
        if (allGames.length >= 1) unlock('add_1');

        // 2. Backlog Warrior
        if (backlogGames.value.length >= 10) unlock('add_10_backlog');

        // 3. The Collector
        if (allGames.length >= 50) unlock('add_50_total');

        // 4. First Blood
        if (completedGames.value.length >= 1) unlock('complete_1');

        // 5. High Five
        if (completedGames.value.length >= 5) unlock('complete_5');

        // 6. Veteran Gamer
        if (completedGames.value.length >= 20) unlock('complete_20');

        // 7. Quitter
        if (droppedGames.value.length >= 1) unlock('drop_1');

        // 8. Decisive
        if (droppedGames.value.length >= 5) unlock('drop_5');

        // 9. Indecisive
        if (playingGames.value.length >= 5) unlock('playing_5_concurrent');

        // 10. Laser Focus
        if (playingGames.value.length === 1 && backlogGames.value.length > 0) unlock('playing_1_only');

        // 11/12. Platforms
        const platforms = new Set(allGames.map(g => g.platform));
        if (platforms.size >= 3) unlock('platforms_3');
        if (platforms.size >= 5) unlock('platforms_5');

        // 13. Genres
        const genres = new Set();
        allGames.forEach(g => {
            if (g.genres) g.genres.forEach(gen => genres.add(gen.name));
        });
        if (genres.size >= 5) unlock('genres_5');

        // 14/15. Ratings
        if (allGames.some(g => g.rating === 5)) unlock('rate_5_stars');
        if (allGames.some(g => g.rating === 1)) unlock('rate_1_star');

        // 16/17. Quest Usage (Requires tracking in useGames or User object)
        // We will assume 'questGiverUsage' is passed in context or stored in localStorage
        const questUsage = parseInt(localStorage.getItem('game-tracker-quest-usage') || '0');
        if (questUsage >= 1) unlock('quest_1');
        if (questUsage >= 10) unlock('quest_10');

        // 18. Jack of all trades
        if (playingGames.value.length > 0 && backlogGames.value.length > 0 && completedGames.value.length > 0 && droppedGames.value.length > 0) {
            unlock('jack_of_all_trades');
        }

        // 19. Marathon
        if (completedGames.value.some(g => g.playtime && g.playtime >= 100)) unlock('marathon');

        // 20. Quick Fix
        // Check for completed games with actual recorded playtime > 0 but < 2
        // We need to be careful not to count '0' playtime games unless we're sure.
        // Let's assume if it is > 0 and < 2.
        if (completedGames.value.some(g => g.playtime > 0 && g.playtime < 2)) unlock('quick_fix');
    };

    return {
        achievementsList,
        unlockedAchievements,
        recentUnlocks,
        checkAchievements,
        nukeAchievements
    };
}
