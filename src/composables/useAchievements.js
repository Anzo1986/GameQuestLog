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
    { id: 'full_house', title: 'Full House', description: 'Own a game on PC, PlayStation, Xbox, Nintendo, and Mobile.', icon: 'Server', tier: 'gold' },
    { id: 'genres_5', title: 'Genre Explorer', description: 'Have games from 5 different genres.', icon: 'Map', tier: 'silver' },

    // 6. Ratings
    { id: 'first_review', title: 'The Reviewer', description: 'Rate a game for the first time.', icon: 'Star', tier: 'bronze' },
    { id: 'rate_5_stars', title: 'Critic\'s Choice', description: 'Rate a game 5 stars.', icon: 'Star', tier: 'bronze' },
    { id: 'rate_1_star', title: 'Harsh Critic', description: 'Rate a game 1 star.', icon: 'ThumbsDown', tier: 'bronze' },
    { id: 'rate_10_total', title: 'Opinionated', description: 'Rate 10 games.', icon: 'Star', tier: 'silver' },
    { id: 'critics_darling', title: 'Critic\'s Darling', description: 'Rate 5 games with 5 stars.', icon: 'Heart', tier: 'silver' },
    { id: 'the_critic', title: 'The Critic', description: 'Rate all completed games (min 5).', icon: 'MessagesSquare', tier: 'silver' },

    // 7. Quest Giver
    { id: 'quest_1', title: 'Quest Accepted', description: 'Use the Quest Giver once.', icon: 'Dices', tier: 'bronze' },
    { id: 'quest_5', title: 'Feeling Lucky', description: 'Use the Quest Giver 5 times.', icon: 'Dices', tier: 'bronze' },
    { id: 'quest_10', title: 'Destiny Awaits', description: 'Use the Quest Giver 10 times.', icon: 'Sparkles', tier: 'silver' },

    // 8. Streak
    { id: 'streak_3', title: 'Warming Up', description: 'Open the app 3 days in a row.', icon: 'Flame', tier: 'bronze' },
    { id: 'streak_7', title: 'On Fire', description: 'Open the app 7 days in a row.', icon: 'Flame', tier: 'silver' },
    { id: 'streak_30', title: 'Unstoppable', description: 'Open the app 30 days in a row.', icon: 'Flame', tier: 'gold' },

    // 9. Completion Rate
    { id: 'rate_100_percent', title: 'Perfectionist', description: 'Reach 100% completion rate (min 5 games).', icon: 'PieChart', tier: 'gold' },

    // 10. Social / App
    { id: 'safety_first', title: 'Safety First', description: 'Export your data backup.', icon: 'Server', tier: 'bronze' },
    { id: 'download_card', title: 'Digital Souvenir', description: 'Download your Gamer Card.', icon: 'Download', tier: 'bronze' },

    // 11. Genre Specialist
    { id: 'genre_indie_2', title: 'Hidden Gems', description: 'Own 2 Indie games.', icon: 'Palette', tier: 'bronze' },
    { id: 'genre_indie_5', title: 'Indie Darling', description: 'Own 5 Indie games.', icon: 'Palette', tier: 'silver' },
    { id: 'genre_rpg_2', title: 'Start of a Journey', description: 'Complete 2 RPGs.', icon: 'Map', tier: 'bronze' },
    { id: 'genre_rpg_3', title: 'RPG Legend', description: 'Complete 3 RPGs.', icon: 'Map', tier: 'gold' },
    { id: 'strategy_master', title: 'Master Strategist', description: 'Complete 3 Strategy games.', icon: 'Swords', tier: 'silver' },
    { id: 'adventure_time', title: 'Adventure Time', description: 'Complete 3 Adventure games.', icon: 'Compass', tier: 'silver' },
    { id: 'genre_action_2', title: 'Double Tap', description: 'Own 2 Action or Shooter games.', icon: 'Zap', tier: 'bronze' },
    { id: 'genre_action_5', title: 'Adrenalin Junkie', description: 'Own 5 Action or Shooter games.', icon: 'Zap', tier: 'silver' },

    // 12. Leveling
    { id: 'level_5', title: 'Rising Star', description: 'Reach User Level 5.', icon: 'Sparkles', tier: 'bronze' },
    { id: 'level_10', title: 'Seasoned Pro', description: 'Reach User Level 10.', icon: 'Star', tier: 'silver' },
    { id: 'level_20', title: 'Epic Hero', description: 'Reach User Level 20.', icon: 'Crown', tier: 'platinum' },
    { id: 'epic_hero', title: 'Epic Hero', description: 'Reach User Level 20.', icon: 'Crown', tier: 'platinum' },
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

    // 14. New Challenges
    { id: 'patient_gamer', title: 'Patient Gamer', description: 'Complete a game released over 5 years ago.', icon: 'Hourglass', tier: 'silver' },
    { id: 'speedrunner', title: 'Speedrunner', description: 'Complete a game within 48 hours of starting.', icon: 'Timer', tier: 'silver' },
    { id: 'monthly_binge', title: 'Monthly Binge', description: 'Complete 3 games in a single month.', icon: 'CalendarDays', tier: 'silver' },
    { id: 'quality_control', title: 'Quality Control', description: 'Drop a game you rated 1 star.', icon: 'Trash2', tier: 'bronze' },
    { id: 'year_of_gaming', title: 'Year of Gaming', description: 'Complete 12 games in the last 365 days.', icon: 'Trophy', tier: 'platinum' },
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
            // unlock call happens in checkAchievements or here? Better handled in check via stats.
            // But immediate unlock ensures toast visibility.
            unlock('safety_first');
        }
        if (action === 'download_card') {
            achievementStats.value.gamerCardDownloaded = true;
            saveStats();
            unlock('download_card');
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

        // HELPER: Validate condition. If false, revoke achievement!
        // This ensures strict consistency (e.g. completed 5 games -> unlock; remove one -> lock again).
        const check = (id, condition) => {
            if (condition) {
                unlock(id);
            } else {
                // STRICT REVOCATION: If enabled (unlocked or claimed) but condition false -> Revoke.
                // This will naturally deduct value from totalQuestScore (and thus Balance).
                if (unlockedAchievements.value[id]) {
                    delete unlockedAchievements.value[id];
                    saveAchievements();
                    // Clean up UI
                    recentUnlocks.value = recentUnlocks.value.filter(a => a.id !== id);
                }
            }
        };

        // 1. Quest Beginner & Builder & Collector
        check('add_1', allGames.length >= 1);
        check('add_3', allGames.length >= 3);
        check('add_10_total', allGames.length >= 10);
        check('add_25_total', allGames.length >= 25);
        check('add_50_total', allGames.length >= 50);
        check('library_100', allGames.length >= 100);

        // 2. Backlog
        check('add_10_backlog', backlogGames.value.length >= 10);
        check('add_25_backlog', backlogGames.value.length >= 25);

        // 3. Start Playing
        check('start_playing', playingGames.value.length >= 1);

        // 4. Rankings / Reviews
        check('first_review', allGames.some(g => g.rating > 0));
        check('rate_5_stars', allGames.some(g => g.rating === 5));
        check('rate_1_star', allGames.some(g => g.rating === 1));
        check('rate_10_total', allGames.filter(g => g.rating > 0).length >= 10);
        check('critics_darling', allGames.filter(g => g.rating === 5).length >= 5);
        check('the_critic', completedGames.value.length >= 5 && completedGames.value.every(g => g.rating > 0));

        // 5. Completion Count
        check('complete_1', completedGames.value.length >= 1);
        check('complete_5', completedGames.value.length >= 5);
        check('complete_10', completedGames.value.length >= 10);
        check('complete_20', completedGames.value.length >= 20);
        check('completionist_50', completedGames.value.length >= 50);

        // 6. Dropping Games
        check('drop_1', droppedGames.value.length >= 1);
        check('drop_5', droppedGames.value.length >= 5);

        // 7. Habits
        check('playing_5_concurrent', playingGames.value.length >= 5);
        check('playing_1_only', playingGames.value.length === 1 && backlogGames.value.length > 0);

        // 8. Diversity (Platforms/Genres)
        const platforms = new Set(allGames.map(g => g.platform));
        check('platforms_3', platforms.size >= 3);

        // Full House: Check Ecosystems
        const ecosystems = new Set();
        allGames.forEach(g => {
            const p = (g.platform || '').toLowerCase();
            if (p.includes('pc') || p.includes('windows') || p.includes('mac') || p.includes('linux')) ecosystems.add('PC');
            if (p.includes('playstation') || p.includes('ps')) ecosystems.add('PlayStation');
            if (p.includes('xbox')) ecosystems.add('Xbox');
            if (p.includes('nintendo') || p.includes('switch') || p.includes('wii')) ecosystems.add('Nintendo');
            if (p.includes('mobile') || p.includes('android') || p.includes('ios')) ecosystems.add('Mobile');
        });
        check('full_house', ecosystems.size >= 5);

        const genres = new Set();
        allGames.forEach(g => {
            if (g.genres) g.genres.forEach(gen => genres.add(gen.name));
        });
        check('genres_5', genres.size >= 5);

        // 9. Quest Usage
        const questUsage = parseInt(localStorage.getItem('game-tracker-quest-usage') || '0');
        check('quest_1', questUsage >= 1);
        check('quest_5', questUsage >= 5);
        check('quest_10', questUsage >= 10);

        // 10. Jack of all trades
        const isJack = playingGames.value.length > 0 && backlogGames.value.length > 0 && completedGames.value.length > 0 && droppedGames.value.length > 0;
        check('jack_of_all_trades', isJack);

        // 11. Playtime
        const totalHours = allGames.reduce((acc, g) => acc + (g.playtime || 0), 0);
        check('century_club', totalHours >= 1000);

        check('marathon', completedGames.value.some(g => g.playtime && g.playtime >= 100));
        check('quick_fix', completedGames.value.some(g => g.playtime > 0 && g.playtime < 2));

        // 12. Leveling
        const level = Math.floor(Math.pow(userXP.value / 500, 1 / 1.2)) + 1;
        check('level_5', level >= 5);
        check('level_10', level >= 10);
        check('epic_hero', level >= 20); // Mapped
        check('level_50', level >= 50);
        check('level_100', level >= 100);

        // 13. Advanced / Meta
        check('empty_plate', allGames.length >= 5 && backlogGames.value.length === 0);
        check('pile_of_shame', backlogGames.value.length > completedGames.value.length && completedGames.value.length > 0);

        // Slow Burn
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        check('slow_burn', completedGames.value.some(g => g.startedAt && g.completedAt && (new Date(g.completedAt) - new Date(g.startedAt)) > oneYearMs));

        // Old School
        check('old_school', allGames.some(g => g.released && parseInt(g.released.split('-')[0]) < 2000));

        // Future Proof
        check('future_proof', allGames.some(g => g.released && new Date(g.released) > new Date()));

        // Weekend Warrior
        const weekendWarrior = completedGames.value.some(g => {
            if (!g.completedAt) return false;
            const day = new Date(g.completedAt).getDay();
            return day === 0 || day === 6; // Sun or Sat
        });
        check('weekend_warrior', weekendWarrior);

        // 14. Genre Specialist
        const indieCount = allGames.filter(g => g.genres && g.genres.some(gen => gen.name === 'Indie')).length;
        check('genre_indie_2', indieCount >= 2);
        check('genre_indie_5', indieCount >= 5);

        const rpgCount = completedGames.value.filter(g => g.genres && g.genres.some(gen => gen.name === 'Role-playing Games' || gen.name === 'RPG')).length;
        check('genre_rpg_2', rpgCount >= 2);
        check('genre_rpg_3', rpgCount >= 3);

        const actionCount = allGames.filter(g => g.genres && g.genres.some(gen => gen.name === 'Action' || gen.name === 'Shooter')).length;
        check('genre_action_2', actionCount >= 2);
        check('genre_action_5', actionCount >= 5);

        // 15. Stats
        check('safety_first', achievementStats.value.exported);
        check('show_off', achievementStats.value.gamerCardDownloaded); // Still needed? show_off was removed.
        check('download_card', achievementStats.value.gamerCardDownloaded);

        // 16. New Challenges Logic

        // Patient Gamer: Release Date vs Completion
        const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
        check('patient_gamer', completedGames.value.some(g => {
            if (!g.completedAt || !g.released) return false;
            return (new Date(g.completedAt) - new Date(g.released)) > fiveYearsMs;
        }));

        // Speedrunner: < 48h
        const twoDaysMs = 48 * 60 * 60 * 1000;
        check('speedrunner', completedGames.value.some(g => {
            if (!g.completedAt || !g.startedAt) return false;
            return (new Date(g.completedAt) - new Date(g.startedAt)) < twoDaysMs;
        }));

        // Master Strategist
        const strategyCount = completedGames.value.filter(g => g.genres && g.genres.some(gen => gen.name === 'Strategy')).length;
        check('strategy_master', strategyCount >= 3);

        // Adventure Time
        const adventureCount = completedGames.value.filter(g => g.genres && g.genres.some(gen => gen.name === 'Adventure')).length;
        check('adventure_time', adventureCount >= 3);

        // Monthly Binge
        const monthCounts = {};
        completedGames.value.forEach(g => {
            if (!g.completedAt) return;
            const key = g.completedAt.slice(0, 7); // YYYY-MM
            monthCounts[key] = (monthCounts[key] || 0) + 1;
        });
        check('monthly_binge', Object.values(monthCounts).some(count => count >= 3));

        // Quality Control
        check('quality_control', droppedGames.value.some(g => g.rating === 1));

        // Year of Gaming
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const recentCompletions = completedGames.value.filter(g => g.completedAt && new Date(g.completedAt) > oneYearAgo).length;
        check('year_of_gaming', recentCompletions >= 12);
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
