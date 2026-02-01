import { ref, computed } from 'vue';
import { useGames } from './useGames';

const ACHIEVEMENTS_STORAGE_KEY = 'game-tracker-achievements';

const achievementsList = [
    // 1. Adding Games
    { id: 'add_1', title: 'Quest Beginner', description: 'Add your first game to the library.', icon: 'Plus', tier: 'bronze' },
    { id: 'add_3', title: 'Library Builder', description: 'Add 3 games to your collection.', icon: 'Library', tier: 'bronze' },
    { id: 'add_10_total', title: 'Growing Collection', description: 'Amass a collection of 10 games.', icon: 'Library', tier: 'silver' },
    { id: 'add_25_total', title: 'Dedicated Collector', description: 'Amass a collection of 25 games.', icon: 'Library', tier: 'silver' },
    { id: 'add_50_total', title: 'The Collector', description: 'Amass a collection of 50 games.', icon: 'Library', tier: 'gold' },
    { id: 'add_10_backlog', title: 'Backlog Warrior', description: 'Have 10 games in your backlog.', icon: 'Layers', tier: 'silver' },
    { id: 'add_25_backlog', title: 'Digital Hoarder', description: 'Have 25 games in your backlog.', icon: 'Layers', tier: 'gold' },

    // 2. Completion Count
    { id: 'complete_1', title: 'First Blood', description: 'Complete your first game.', icon: 'Trophy', tier: 'bronze' },
    { id: 'complete_5', title: 'High Five', description: 'Complete 5 games.', icon: 'Trophy', tier: 'bronze' },
    { id: 'complete_10', title: 'On a Roll', description: 'Complete 10 games.', icon: 'Trophy', tier: 'silver' },
    { id: 'complete_20', title: 'Veteran Gamer', description: 'Complete 20 games.', icon: 'Crown', tier: 'silver' },
    { id: 'completionist_50', title: 'The Completionist', description: 'Complete 50 games.', icon: 'Trophy', tier: 'gold' },

    // 3. Dropping Games
    { id: 'drop_1', title: 'Quitter', description: 'Drop a game. Sometimes it is for the best.', icon: 'Ban', tier: 'bronze' },
    { id: 'drop_5', title: 'Decisive', description: 'Drop 5 games. You know what you like.', icon: 'Ban', tier: 'silver' },

    // 4. Playing Habits
    { id: 'start_playing', title: 'Press Start', description: 'Set a game to "Playing" status.', icon: 'Gamepad2', tier: 'bronze' },
    { id: 'playing_5_concurrent', title: 'Indecisive', description: 'Have 5 games in "Playing" status at once.', icon: 'Shuffle', tier: 'bronze' },
    { id: 'playing_1_only', title: 'Laser Focus', description: 'Have exactly 1 playing game while backlog is not empty.', icon: 'Focus', tier: 'silver' },
    { id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Complete a game on a Saturday or Sunday.', icon: 'Calendar', tier: 'silver' },
    { id: 'pile_of_shame', title: 'Pile of Shame', description: 'Have more games in Backlog than Completed.', icon: 'Layers', tier: 'bronze' },
    { id: 'jack_of_all_trades', title: 'Jack of All Trades', description: 'Have at least one game in Playing, Completed, Dropped, and Backlog.', icon: 'Palette', tier: 'silver' },

    // 5. Diversity
    { id: 'platforms_3', title: 'Platform Hopper', description: 'Own games on 3 different platforms.', icon: 'Gamepad2', tier: 'bronze' },
    { id: 'platforms_5', title: 'Console Museum', description: 'Own games on 5 different platforms.', icon: 'Server', tier: 'silver' },
    { id: 'genres_5', title: 'Genre Explorer', description: 'Have games from 5 different genres.', icon: 'Map', tier: 'silver' },

    // 6. Ratings
    { id: 'first_review', title: 'The Reviewer', description: 'Rate a game for the first time.', icon: 'Star', tier: 'bronze' },
    { id: 'rate_5_stars', title: 'Critic\'s Choice', description: 'Rate a game 5 stars.', icon: 'Star', tier: 'bronze' },
    { id: 'rate_1_star', title: 'Harsh Critic', description: 'Rate a game 1 star.', icon: 'ThumbsDown', tier: 'bronze' },
    { id: 'rate_10_total', title: 'Opinionated', description: 'Rate 10 games.', icon: 'Star', tier: 'silver' },
    { id: 'critics_darling', title: 'Critic\'s Darling', description: 'Rate 5 games with 5 stars.', icon: 'Heart', tier: 'silver' },

    // 7. Quest Giver
    { id: 'quest_1', title: 'Quest Accepted', description: 'Use the Quest Giver once.', icon: 'Dices', tier: 'bronze' },
    { id: 'quest_5', title: 'Feeling Lucky', description: 'Use the Quest Giver 5 times.', icon: 'Dices', tier: 'bronze' },
    { id: 'quest_10', title: 'Destiny Awaits', description: 'Use the Quest Giver 10 times.', icon: 'Sparkles', tier: 'silver' },

    // 8. Streak
    { id: 'streak_3', title: 'Warming Up', description: 'Open the app 3 days in a row.', icon: 'Flame', tier: 'bronze' },
    { id: 'streak_7', title: 'On Fire', description: 'Open the app 7 days in a row.', icon: 'Flame', tier: 'silver' },
    { id: 'streak_30', title: 'Unstoppable', description: 'Open the app 30 days in a row.', icon: 'Flame', tier: 'gold' },

    // 9. Completion Rate
    { id: 'rate_50_percent', title: 'Halfway There', description: 'Reach 50% completion rate.', icon: 'PieChart', tier: 'bronze' },
    { id: 'rate_100_percent', title: 'Perfectionist', description: 'Reach 100% completion rate (min 5 games).', icon: 'PieChart', tier: 'gold' },

    // 10. Social / App
    { id: 'safety_first', title: 'Safety First', description: 'Export your data backup.', icon: 'Server', tier: 'bronze' },
    { id: 'share_card', title: 'Show Off', description: 'Share your Gamer Card.', icon: 'Share2', tier: 'bronze' },
    { id: 'download_card', title: 'Digital Souvenir', description: 'Download your Gamer Card.', icon: 'Download', tier: 'bronze' },
    { id: 'show_off', title: 'Card Collector', description: 'Download your Gamer Card.', icon: 'Crown', tier: 'bronze' }, // Duplicate ID map handled in logic? 'show_off' and 'download_card' seem redundant. Keeping 'show_off' as per newest code.

    // 11. Genre Specialist
    { id: 'genre_indie_2', title: 'Hidden Gems', description: 'Own 2 Indie games.', icon: 'Palette', tier: 'bronze' },
    { id: 'genre_indie_5', title: 'Indie Darling', description: 'Own 5 Indie games.', icon: 'Palette', tier: 'silver' },
    { id: 'genre_rpg_2', title: 'Start of a Journey', description: 'Complete 2 RPGs.', icon: 'Map', tier: 'bronze' },
    { id: 'genre_rpg_3', title: 'RPG Legend', description: 'Complete 3 RPGs.', icon: 'Map', tier: 'gold' },
    { id: 'genre_action_2', title: 'Double Tap', description: 'Own 2 Action or Shooter games.', icon: 'Zap', tier: 'bronze' },
    { id: 'genre_action_5', title: 'Adrenalin Junkie', description: 'Own 5 Action or Shooter games.', icon: 'Zap', tier: 'silver' },

    // 12. Leveling
    { id: 'level_5', title: 'Rising Star', description: 'Reach User Level 5.', icon: 'Sparkles', tier: 'bronze' },
    { id: 'level_10', title: 'Seasoned Pro', description: 'Reach User Level 10.', icon: 'Star', tier: 'silver' },
    { id: 'level_20', title: 'Epic Hero', description: 'Reach User Level 20.', icon: 'Crown', tier: 'platinum' }, // Mapped to 'epic_hero'
    { id: 'epic_hero', title: 'Epic Hero', description: 'Reach User Level 20.', icon: 'Crown', tier: 'platinum' }, // Duplicate ID? Logic handles it.
    { id: 'level_50', title: 'Living Legend', description: 'Reach User Level 50.', icon: 'Zap', tier: 'platinum' },
    { id: 'level_100', title: 'Ascended', description: 'Reach User Level 100.', icon: 'Sun', tier: 'platinum', secret: true },

    // 13. Special / Hard
    { id: 'marathon', title: 'Marathon', description: 'Complete a game with over 100 hours of playtime.', icon: 'Hourglass', tier: 'gold' },
    { id: 'quick_fix', title: 'Quick Fix', description: 'Complete a game with under 2 hours of playtime.', icon: 'Zap', tier: 'bronze' },
    { id: 'century_club', title: 'Century Club', description: 'Reach 1000 hours of total playtime.', icon: 'Clock', tier: 'platinum', secret: true },
    { id: 'library_100', title: 'Library of Alexandria', description: 'Own 100 games.', icon: 'Library', tier: 'gold' },
    { id: 'empty_plate', title: 'Empty Plate', description: 'Have 0 games in your backlog (min. 5 total games).', icon: 'CheckCircle2', tier: 'platinum', secret: true },
    { id: 'slow_burn', title: 'Slow Burn', description: 'Complete a game more than 1 year after starting it.', icon: 'Timer', tier: 'gold' },
    { id: 'old_school', title: 'Blast from the Past', description: 'Own a game released before 2000.', icon: 'Rewind', tier: 'bronze' },
    { id: 'future_proof', title: 'Future Proof', description: 'Own a game with a release date in the future.', icon: 'FastForward', tier: 'bronze' },
];

// Persistent State (Shared across components)
const unlockedAchievements = ref({});
const achievementStats = ref({
    exported: false,
    gamerCardDownloaded: false
});

// Load from storage with Migration Logic
const savedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
if (savedAchievements) {
    try {
        const parsed = JSON.parse(savedAchievements);
        // Migration: Check if values are strings (Old Format) -> Convert to Object (New Format)
        let migrated = false;
        for (const key in parsed) {
            if (typeof parsed[key] === 'string') {
                parsed[key] = { unlockedAt: parsed[key], claimed: true }; // Legacy items are auto-claimed
                migrated = true;
            }
        }
        unlockedAchievements.value = parsed;
        if (migrated) {
            localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlockedAchievements.value));
        }
    } catch (e) {
        console.error('Failed to parse achievements', e);
    }
}

// Load stats
const savedStats = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY + '_stats');
if (savedStats) {
    try {
        achievementStats.value = JSON.parse(savedStats);
    } catch (e) { console.error('Failed stats', e); }
}

// Queue for toasts to show (FIFO)
const recentUnlocks = ref([]);

export function useAchievements() {

    const saveAchievements = () => {
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlockedAchievements.value));
    };

    const saveStats = () => {
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY + '_stats', JSON.stringify(achievementStats.value));
    };

    const unlock = (id) => {
        if (!unlockedAchievements.value[id]) {
            // New Unlock: Not claimed yet
            unlockedAchievements.value[id] = {
                unlockedAt: new Date().toISOString(),
                claimed: false
            };
            saveAchievements();

            const achievement = achievementsList.find(a => a.id === id);
            if (achievement) {
                recentUnlocks.value.push(achievement);
                // Remove from queue after 5 seconds
                setTimeout(() => {
                    recentUnlocks.value = recentUnlocks.value.filter(a => a.id !== id);
                }, 5000);
            }
        }
    };

    const claim = (id) => {
        if (unlockedAchievements.value[id] && !unlockedAchievements.value[id].claimed) {
            unlockedAchievements.value[id].claimed = true;
            saveAchievements();
            // Trigger any "on claim" effects if needed (e.g. sound)
        }
    };

    const trackAction = (action) => {
        if (action === 'export') {
            achievementStats.value.exported = true;
            saveStats();
            unlock('safety_first');
        }
        if (action === 'download_card') {
            achievementStats.value.gamerCardDownloaded = true;
            saveStats();
            unlock('show_off');
        }
        if (action === 'share_card') {
            unlock('share_card');
        }

        // Quest usage tracking handled in QuestGiver component via localStorage
        if (action === 'quest_use') {
            let usage = parseInt(localStorage.getItem('game-tracker-quest-usage') || '0');
            usage++;
            localStorage.setItem('game-tracker-quest-usage', usage.toString());
            // Check immediately
            if (usage >= 1) unlock('quest_1');
            if (usage >= 5) unlock('quest_5');
            if (usage >= 10) unlock('quest_10');
        }
    };

    const nukeAchievements = () => {
        unlockedAchievements.value = {};
        localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
        // Reset stats too
        achievementStats.value = { exported: false, gamerCardDownloaded: false };
        localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY + '_stats');
    };

    /**
     * Main check function. Call this whenever game state changes.
     * @param {Object} context - The context from useGames (games, userXP, etc)
     */
    const checkAchievements = (context) => {
        const { games, playingGames, backlogGames, completedGames, droppedGames, userXP } = context;
        const allGames = games.value;

        // 1. Quest Beginner & Builder & Collector
        if (allGames.length >= 1) unlock('add_1');
        if (allGames.length >= 3) unlock('add_3');
        if (allGames.length >= 10) unlock('add_10_total');
        if (allGames.length >= 25) unlock('add_25_total');
        if (allGames.length >= 50) unlock('add_50_total');
        if (allGames.length >= 100) unlock('library_100');

        // 2. Backlog
        if (backlogGames.value.length >= 10) unlock('add_10_backlog');
        if (backlogGames.value.length >= 25) unlock('add_25_backlog');

        // 3. Start Playing
        if (playingGames.value.length >= 1) unlock('start_playing');

        // 4. Rankings / Reviews
        if (allGames.some(g => g.rating > 0)) unlock('first_review');
        if (allGames.some(g => g.rating === 5)) unlock('rate_5_stars');
        if (allGames.some(g => g.rating === 1)) unlock('rate_1_star');
        if (allGames.filter(g => g.rating > 0).length >= 10) unlock('rate_10_total');
        if (allGames.filter(g => g.rating === 5).length >= 5) unlock('critics_darling');

        // 5. Completion Count
        if (completedGames.value.length >= 1) unlock('complete_1');
        if (completedGames.value.length >= 5) unlock('complete_5');
        if (completedGames.value.length >= 10) unlock('complete_10');
        if (completedGames.value.length >= 20) unlock('complete_20');
        if (completedGames.value.length >= 50) unlock('completionist_50');

        // 6. Dropping Games
        if (droppedGames.value.length >= 1) unlock('drop_1');
        if (droppedGames.value.length >= 5) unlock('drop_5');

        // 7. Habits
        if (playingGames.value.length >= 5) unlock('playing_5_concurrent');
        if (playingGames.value.length === 1 && backlogGames.value.length > 0) unlock('playing_1_only');

        // 8. Diversity (Platforms/Genres)
        const platforms = new Set(allGames.map(g => g.platform));
        if (platforms.size >= 3) unlock('platforms_3');
        if (platforms.size >= 5) unlock('platforms_5');

        const genres = new Set();
        allGames.forEach(g => {
            if (g.genres) g.genres.forEach(gen => genres.add(gen.name));
        });
        if (genres.size >= 5) unlock('genres_5');

        // 9. Quest Usage
        const questUsage = parseInt(localStorage.getItem('game-tracker-quest-usage') || '0');
        if (questUsage >= 1) unlock('quest_1');
        if (questUsage >= 5) unlock('quest_5');
        if (questUsage >= 10) unlock('quest_10');

        // 10. Jack of all trades
        if (playingGames.value.length > 0 && backlogGames.value.length > 0 && completedGames.value.length > 0 && droppedGames.value.length > 0) {
            unlock('jack_of_all_trades');
        }

        // 11. Playtime
        const totalHours = allGames.reduce((acc, g) => acc + (g.playtime || 0), 0);
        if (totalHours >= 1000) unlock('century_club');

        if (completedGames.value.some(g => g.playtime && g.playtime >= 100)) unlock('marathon');
        if (completedGames.value.some(g => g.playtime > 0 && g.playtime < 2)) unlock('quick_fix');

        // 12. Leveling
        const level = Math.floor(Math.pow(userXP.value / 500, 1 / 1.2)) + 1;
        if (level >= 5) unlock('level_5');
        if (level >= 10) unlock('level_10');
        if (level >= 20) unlock('epic_hero');
        if (level >= 50) unlock('level_50');
        if (level >= 100) unlock('level_100');

        // FIX: Consistency check for level resets
        ['level_5', 'level_10', 'epic_hero', 'level_50', 'level_100'].forEach(id => {
            const requiredLevel = id === 'epic_hero' ? 20 : parseInt(id.split('_')[1]);
            if (unlockedAchievements.value[id] && level < requiredLevel) {
                delete unlockedAchievements.value[id];
                saveAchievements();
                recentUnlocks.value = recentUnlocks.value.filter(a => a.id !== id);
            }
        });

        // 13. Advanced / Meta
        if (allGames.length >= 5 && backlogGames.value.length === 0) unlock('empty_plate');
        if (backlogGames.value.length > completedGames.value.length && completedGames.value.length > 0) unlock('pile_of_shame');

        // Slow Burn
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (completedGames.value.some(g => g.startedAt && g.completedAt && (new Date(g.completedAt) - new Date(g.startedAt)) > oneYearMs)) unlock('slow_burn');

        // Old School
        if (allGames.some(g => g.released && parseInt(g.released.split('-')[0]) < 2000)) unlock('old_school');

        // Future Proof
        if (allGames.some(g => g.released && new Date(g.released) > new Date())) unlock('future_proof');

        // Weekend Warrior
        const weekendWarrior = completedGames.value.some(g => {
            if (!g.completedAt) return false;
            const day = new Date(g.completedAt).getDay();
            return day === 0 || day === 6; // Sun or Sat
        });
        if (weekendWarrior) unlock('weekend_warrior');

        // 14. Genre Specialist
        const indieCount = allGames.filter(g => g.genres && g.genres.some(gen => gen.name === 'Indie')).length;
        if (indieCount >= 2) unlock('genre_indie_2');
        if (indieCount >= 5) unlock('genre_indie_5');

        const rpgCount = completedGames.value.filter(g => g.genres && g.genres.some(gen => gen.name === 'Role-playing Games' || gen.name === 'RPG')).length;
        if (rpgCount >= 2) unlock('genre_rpg_2');
        if (rpgCount >= 3) unlock('genre_rpg_3');

        const actionCount = allGames.filter(g => g.genres && g.genres.some(gen => gen.name === 'Action' || gen.name === 'Shooter')).length;
        if (actionCount >= 2) unlock('genre_action_2');
        if (actionCount >= 5) unlock('genre_action_5');

        // 15. Stats
        if (achievementStats.value.exported) unlock('safety_first');
        if (achievementStats.value.gamerCardDownloaded) unlock('show_off');
    };

    const totalQuestScore = computed(() => {
        let score = 0;
        const tierValues = {
            bronze: 20,
            silver: 50,
            gold: 100,
            platinum: 250
        };

        for (const id in unlockedAchievements.value) {
            // Count Score ONLY if Claimed
            const achievementData = unlockedAchievements.value[id];
            // Backward compatibility check inside loop not needed if migration ran, but good for safety
            const isClaimed = achievementData === true || (typeof achievementData === 'object' && achievementData.claimed);

            if (isClaimed) {
                const achievement = achievementsList.find(a => a.id === id);
                if (achievement) {
                    score += (tierValues[achievement.tier] || 0);
                }
            }
        }
        return score;
    });

    return {
        achievementsList,
        unlockedAchievements,
        recentUnlocks,
        checkAchievements,
        nukeAchievements,
        trackAction,
        totalQuestScore,
        claim
    };
}
