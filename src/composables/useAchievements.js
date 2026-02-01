import { ref, computed, watch } from 'vue';

const ACHIEVEMENTS_STORAGE_KEY = 'game-tracker-achievements';

const achievementsList = [
    // 1. Adding Games
    { id: 'add_1', title: 'Quest Beginner', description: 'Add your first game to the library.', icon: 'Plus', tier: 'bronze' },
    { id: 'add_3', title: 'Library Builder', description: 'Add 3 games to your collection.', icon: 'Library', tier: 'bronze' },
    { id: 'add_10_total', title: 'Growing Collection', description: 'Amass a collection of 10 games.', icon: 'Library', tier: 'silver' }, // NEW
    { id: 'add_25_total', title: 'Dedicated Collector', description: 'Amass a collection of 25 games.', icon: 'Library', tier: 'silver' }, // NEW
    { id: 'add_50_total', title: 'The Collector', description: 'Amass a collection of 50 games.', icon: 'Library', tier: 'gold' },
    { id: 'add_10_backlog', title: 'Backlog Warrior', description: 'Have 10 games in your backlog.', icon: 'Layers', tier: 'silver' },

    // 2. Completing Games
    { id: 'complete_1', title: 'First Blood', description: 'Complete 1 game.', icon: 'Trophy', tier: 'bronze' },
    { id: 'complete_5', title: 'High Five', description: 'Complete 5 games.', icon: 'Trophy', tier: 'bronze' },
    { id: 'complete_10', title: 'On a Roll', description: 'Complete 10 games.', icon: 'Trophy', tier: 'silver' }, // NEW
    { id: 'complete_20', title: 'Veteran Gamer', description: 'Complete 20 games.', icon: 'Crown', tier: 'silver' },

    // ... (Dropping, Playing Habits, Diversity, Ratings, etc remain)

    // 24. Epic Hero & Leveling
    { id: 'level_5', title: 'Rising Star', description: 'Reach User Level 5.', icon: 'Sparkles', tier: 'bronze' }, // NEW
    { id: 'level_10', title: 'Seasoned Pro', description: 'Reach User Level 10.', icon: 'Star', tier: 'silver' }, // NEW
    { id: 'epic_hero', title: 'Epic Hero', description: 'Reach User Level 20.', icon: 'Crown', tier: 'platinum' },
    { id: 'level_50', title: 'Living Legend', description: 'Reach User Level 50.', icon: 'Zap', tier: 'platinum' }, // NEW
    { id: 'level_100', title: 'Ascended', description: 'Reach User Level 100.', icon: 'Sun', tier: 'platinum', secret: true }, // NEW

// ... (In checkAchievements)

        // 1. Quest Beginner & Builder
        if (allGames.length >= 1) unlock('add_1');
if (allGames.length >= 3) unlock('add_3');
if (allGames.length >= 10) unlock('add_10_total'); // NEW
if (allGames.length >= 25) unlock('add_25_total'); // NEW

// ...

// 3. The Collector
if (allGames.length >= 50) unlock('add_50_total');

// ...

// 5. High Five
if (completedGames.value.length >= 5) unlock('complete_5');
if (completedGames.value.length >= 10) unlock('complete_10'); // NEW

// ...

// 24. Epic Hero & Levels
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

// 3. Dropping Games
{ id: 'drop_1', title: 'Quitter', description: 'Drop a game. Sometimes it is for the best.', icon: 'Ban', tier: 'bronze' },
{ id: 'drop_5', title: 'Decisive', description: 'Drop 5 games. You know what you like.', icon: 'Ban', tier: 'silver' },

// 4. Playing Habits
{ id: 'playing_5_concurrent', title: 'Indecisive', description: 'Have 5 games in "Playing" status at once.', icon: 'Shuffle', tier: 'bronze' },
{ id: 'playing_1_only', title: 'Laser Focus', description: 'Have exactly 1 playing game while backlog is not empty.', icon: 'Focus', tier: 'silver' },

// 5. Diversity
{ id: 'platforms_3', title: 'Platform Hopper', description: 'Own games on 3 different platforms.', icon: 'Gamepad2', tier: 'bronze' },
{ id: 'platforms_5', title: 'Console Museum', description: 'Own games on 5 different platforms.', icon: 'Server', tier: 'silver' },
{ id: 'genres_5', title: 'Genre Explorer', description: 'Have games from 5 different genres.', icon: 'Map', tier: 'silver' },

// 6. Ratings
{ id: 'rate_5_stars', title: 'Critic\'s Choice', description: 'Rate a game 5 stars.', icon: 'Star', tier: 'bronze' },
{ id: 'rate_1_star', title: 'Harsh Critic', description: 'Rate a game 1 star.', icon: 'ThumbsDown', tier: 'bronze' },

// New: Accessible Achievements
{ id: 'start_playing', title: 'Press Start', description: 'Set a game to "Playing" status.', icon: 'Gamepad2', tier: 'bronze' },
{ id: 'first_review', title: 'The Reviewer', description: 'Rate a game for the first time.', icon: 'Star', tier: 'bronze' },

// 7. Features
{ id: 'quest_1', title: 'Quest Accepted', description: 'Use the Quest Giver once.', icon: 'Dices', tier: 'bronze' },
{ id: 'quest_10', title: 'Destiny Awaits', description: 'Use the Quest Giver 10 times.', icon: 'Sparkles', tier: 'silver' },

// 8. Special / Complex (Existing)
{ id: 'jack_of_all_trades', title: 'Jack of All Trades', description: 'Have at least one game in Playing, Completed, Dropped, and Backlog.', icon: 'Palette', tier: 'silver' },
{ id: 'marathon', title: 'Marathon', description: 'Complete a game with over 100 hours of playtime.', icon: 'Hourglass', tier: 'gold' },
{ id: 'quick_fix', title: 'Quick Fix', description: 'Complete a game with under 2 hours of playtime.', icon: 'Zap', tier: 'bronze' },

// 9. Hard / Long Term (New)
{ id: 'completionist_50', title: 'The Completionist', description: 'Complete 50 games.', icon: 'Trophy', tier: 'gold' },
{ id: 'library_100', title: 'Library of Alexandria', description: 'Own 100 games.', icon: 'Library', tier: 'gold' },
{ id: 'century_club', title: 'Century Club', description: 'Reach 1000 hours of total playtime.', icon: 'Clock', tier: 'platinum', secret: true },
{ id: 'epic_hero', title: 'Epic Hero', description: 'Reach User Level 20.', icon: 'Crown', tier: 'platinum' },
{ id: 'empty_plate', title: 'Empty Plate', description: 'Have 0 games in your backlog (min. 5 total games).', icon: 'CheckCircle2', tier: 'platinum', secret: true },

// 10. Specific / Fun (New)
{ id: 'slow_burn', title: 'Slow Burn', description: 'Complete a game more than 1 year after starting it.', icon: 'Timer', tier: 'gold' },
// 11. Genre Specialist (New)
{ id: 'genre_indie_5', title: 'Indie Darling', description: 'Own 5 Indie games.', icon: 'Palette', tier: 'silver' },
{ id: 'genre_rpg_3', title: 'RPG Legend', description: 'Complete 3 RPGs.', icon: 'Map', tier: 'gold' },
{ id: 'genre_action_5', title: 'Adrenalin Junkie', description: 'Own 5 Action or Shooter games.', icon: 'Zap', tier: 'silver' },

// 12. App Features (New)
{ id: 'safety_first', title: 'Safety First', description: 'Export your data backup.', icon: 'Server', tier: 'bronze' },
{ id: 'show_off', title: 'Show Off', description: 'Download your Gamer Card.', icon: 'Crown', tier: 'bronze' },

// 13. Habits / Meta (New)
{ id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Complete a game on a Saturday or Sunday.', icon: 'Calendar', tier: 'silver' },
{ id: 'pile_of_shame', title: 'Pile of Shame', description: 'Have more games in Backlog than Completed.', icon: 'Layers', tier: 'bronze' },
];

// Persistent State
const unlockedAchievements = ref({});
const achievementStats = ref({
    exported: false,
    gamerCardDownloaded: false
});

// Load from storage
const savedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
if (savedAchievements) {
    try {
        unlockedAchievements.value = JSON.parse(savedAchievements);
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
            unlockedAchievements.value[id] = new Date().toISOString();
            saveAchievements(); // Save immediately

            const achievement = achievementsList.find(a => a.id === id);
            if (achievement) {
                recentUnlocks.value.push(achievement);
                // Remove from queue after 5 seconds automatically if UI doesn't handle it
                setTimeout(() => {
                    recentUnlocks.value = recentUnlocks.value.filter(a => a.id !== id);
                }, 5000);
            }
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
    };

    const nukeAchievements = () => {
        unlockedAchievements.value = {};
        localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
        // Reset stats too logic? Maybe keep specific stats? For now reset all.
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

        // ... existing checks ...
        // 1. Quest Beginner & Builder
        if (allGames.length >= 1) unlock('add_1');
        if (allGames.length >= 3) unlock('add_3');
        if (allGames.length >= 10) unlock('add_10_total'); // NEW add 10
        if (allGames.length >= 25) unlock('add_25_total'); // NEW add 25

        // 2. Backlog Warrior
        if (backlogGames.value.length >= 10) unlock('add_10_backlog');

        // 3. The Collector
        if (allGames.length >= 50) unlock('add_50_total');

        // New: Press Start
        if (playingGames.value.length >= 1) unlock('start_playing');

        // New: First Review
        if (allGames.some(g => g.rating > 0)) unlock('first_review');

        // 4. First Blood
        if (completedGames.value.length >= 1) unlock('complete_1');

        // 5. High Five
        if (completedGames.value.length >= 5) unlock('complete_5');
        if (completedGames.value.length >= 10) unlock('complete_10'); // NEW complete 10

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
        if (completedGames.value.some(g => g.playtime > 0 && g.playtime < 2)) unlock('quick_fix');

        // 21. Completionist
        if (completedGames.value.length >= 50) unlock('completionist_50');

        // 22. Library
        if (allGames.length >= 100) unlock('library_100');

        // 23. Century
        const totalHours = allGames.reduce((acc, g) => acc + (g.playtime || 0), 0);
        if (totalHours >= 1000) unlock('century_club');

        // 24. Epic Hero & Leveling
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

        // 25. Empty Plate
        if (allGames.length >= 5 && backlogGames.value.length === 0) unlock('empty_plate');

        // 26. Slow Burn
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (completedGames.value.some(g => g.startedAt && g.completedAt && (new Date(g.completedAt) - new Date(g.startedAt)) > oneYearMs)) unlock('slow_burn');

        // 27. Critic
        if (allGames.filter(g => g.rating === 5).length >= 5) unlock('critics_darling');

        // 28. Old School
        if (allGames.some(g => g.released && parseInt(g.released.split('-')[0]) < 2000)) unlock('old_school');

        // 29. Future Proof
        if (allGames.some(g => g.released && new Date(g.released) > new Date())) unlock('future_proof');

        // --- NEW ---

        // 30. Indie Darling
        const indieCount = allGames.filter(g => g.genres && g.genres.some(gen => gen.name === 'Indie')).length;
        if (indieCount >= 5) unlock('genre_indie_5');

        // 31. RPG Legend
        const rpgCount = completedGames.value.filter(g => g.genres && g.genres.some(gen => gen.name === 'Role-playing Games' || gen.name === 'RPG')).length;
        if (rpgCount >= 3) unlock('genre_rpg_3');

        // 32. Adrenalin Junkie
        const actionCount = allGames.filter(g => g.genres && g.genres.some(gen => gen.name === 'Action' || gen.name === 'Shooter')).length;
        if (actionCount >= 5) unlock('genre_action_5');

        // 33. Weekend Warrior
        const weekendWarrior = completedGames.value.some(g => {
            if (!g.completedAt) return false;
            const day = new Date(g.completedAt).getDay();
            return day === 0 || day === 6; // Sun or Sat
        });
        if (weekendWarrior) unlock('weekend_warrior');

        // 34. Pile of Shame
        if (backlogGames.value.length > completedGames.value.length && completedGames.value.length > 0) unlock('pile_of_shame');

        // 35. Feature Stats (Export/Download) - Checked via stats
        if (achievementStats.value.exported) unlock('safety_first');
        if (achievementStats.value.gamerCardDownloaded) unlock('show_off');
    };

    const totalQuestScore = computed(() => {
        let score = 0;
        const tierValues = {
            bronze: 20,   // Buffed from 10
            silver: 50,   // Buffed from 25
            gold: 100,    // Buffed from 50
            platinum: 250 // Buffed from 100
        };

        for (const id in unlockedAchievements.value) {
            const achievement = achievementsList.find(a => a.id === id);
            if (achievement) {
                score += (tierValues[achievement.tier] || 0);
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
        totalQuestScore
    };
}
