// Facade for the Refactored Composables
// This ensures backward compatibility while using the new structure.

import { ref, computed, watch } from 'vue';
import { useSettings } from './useSettings';
import { useGamification } from './useGamification';
import { useGameData } from './useGameData';
import { usePersistence } from './usePersistence';
import { XP_REWARDS, GAME_STATUS } from '../config/gamification';
import { GENRES } from '../constants/genres';

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

const IGDB_ENDPOINT = import.meta.env.DEV ? '/api/igdb/v4/games' : 'https://corsproxy.io/?https://api.igdb.com/v4/games';

export function useGames() {
    // 1. Import Sub-Modules
    const settings = useSettings();
    const gamification = useGamification();
    const gameData = useGameData();
    const persistence = usePersistence();

    // 2. Facade Methods (Stitching logic together)

    // Helper: Aggregate Specific IGDB Platforms to RAWG Parent Platforms
    const aggregateIGDBPlatforms = (platforms) => {
        if (!platforms) return [];
        const parents = new Set();
        platforms.forEach(p => {
            parents.add(gameData.mapPlatform([p]));
        });
        return Array.from(parents).map(name => ({ platform: { name } }));
    };

    // Helper: Map IGDB Genres to our internal standard GENRES list
    const aggregateIGDBGenres = (igdbGenres) => {
        if (!igdbGenres) return [];
        const mappedGenres = new Set();

        igdbGenres.forEach(g => {
            const lowerName = g.name.toLowerCase();

            if (lowerName.includes('role-playing') || lowerName.includes('rpg')) { mappedGenres.add('RPG'); }
            else if (lowerName.includes('shooter')) { mappedGenres.add('Shooter'); }
            else if (lowerName.includes('adventure')) { mappedGenres.add('Adventure'); }
            else if (lowerName.includes('action')) { mappedGenres.add('Action'); }
            else if (lowerName.includes('strategy') || lowerName.includes('tactical') || lowerName.includes('rts') || lowerName.includes('tbs') || lowerName.includes('moba')) { mappedGenres.add('Strategy'); }
            else if (lowerName.includes('puzzle')) { mappedGenres.add('Puzzle'); }
            else if (lowerName.includes('platform')) { mappedGenres.add('Platformer'); }
            else if (lowerName.includes('racing')) { mappedGenres.add('Racing'); }
            else if (lowerName.includes('sport')) { mappedGenres.add('Sports'); }
            else if (lowerName.includes('fighting') || lowerName.includes('beat \'em up') || lowerName.includes('hack and slash')) { mappedGenres.add('Fighting'); }
            else if (lowerName.includes('simulator') || lowerName.includes('simulation')) { mappedGenres.add('Simulation'); }
            else if (lowerName.includes('mmo') || lowerName.includes('massively')) { mappedGenres.add('Massively Multiplayer'); }
            else if (lowerName.includes('indie')) { mappedGenres.add('Indie'); }
            else if (lowerName.includes('arcade')) { mappedGenres.add('Arcade'); }
            else if (lowerName.includes('casual')) { mappedGenres.add('Casual'); }
            else if (lowerName.includes('board') || lowerName.includes('tabletop')) { mappedGenres.add('Board Games'); }
            else if (lowerName.includes('card')) { mappedGenres.add('Card'); }
            else if (lowerName.includes('family') || lowerName.includes('party')) { mappedGenres.add('Family'); }
            else if (lowerName.includes('educational')) { mappedGenres.add('Educational'); }
        });

        // Ensure we only return genres that actually exist in our master list
        return Array.from(mappedGenres).filter(genre => GENRES.includes(genre)).map(name => ({ name }));
    };

    // Helper: Get Best Website Link from IGDB mapped categories
    const getBestIGDBWebsite = (websites) => {
        if (!websites || !Array.isArray(websites) || websites.length === 0) return null;
        // Priority: 1 (Official), 13 (Steam), 17 (GOG), 16 (Epic), 3 (Wikipedia), 2 (Wikia), 6 (Twitch), 9 (YouTube)
        const priorities = [1, 13, 17, 16, 3, 2, 6, 9];
        for (const catId of priorities) {
            const found = websites.find(w => w.category === catId);
            if (found && found.url) return found.url;
        }
        return null;
    };

    // Helper: Map IGDB DLCs and Expansions to a unified additions array
    const getBestIGDBBackground = (game) => {
        if (game.artworks && game.artworks.length > 0 && game.artworks[0].image_id) {
            return `https://images.igdb.com/igdb/image/upload/t_1080p/${game.artworks[0].image_id}.jpg`;
        }
        if (game.screenshots && game.screenshots.length > 0 && game.screenshots[0].image_id) {
            return `https://images.igdb.com/igdb/image/upload/t_1080p/${game.screenshots[0].image_id}.jpg`;
        }
        if (game.cover && game.cover.image_id) {
            return `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`;
        }
        return null;
    };

    const aggregateIGDBAdditions = (dlcs, expansions) => {
        const raw = [...(dlcs || []), ...(expansions || [])];
        const unique = Array.from(new Map(raw.map(item => [item.id, item])).values());

        return unique.sort((a, b) => (a.first_release_date || 0) - (b.first_release_date || 0))
            .map(item => ({
                id: item.id,
                name: item.name,
                released: item.first_release_date ? new Date(item.first_release_date * 1000).toISOString().split('T')[0] : null,
                background_image: item.cover ? `https://images.igdb.com/igdb/image/upload/t_1080p/${item.cover.image_id}.jpg` : null
            }));
    };

    // Helper: Fetch RAWG Additions (DLCs)
    const fetchRAWGAdditions = async (gameId) => {
        if (!settings.apiKey.value) return [];
        try {
            const response = await fetch(`https://api.rawg.io/api/games/${gameId}/additions?key=${settings.apiKey.value}`);
            if (response.ok) {
                const data = await response.json();
                return (data.results || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    released: item.released,
                    background_image: item.background_image
                }));
            }
        } catch (e) {
            console.error('Failed to fetch RAWG additions', e);
        }
        return [];
    };

    // Add Game Wrapper (Data + Gamification + API Fetch)
    const addGame = async (newGameData, platform = 'PC') => {
        // Prepare Basic Object
        const newGame = {
            id: newGameData.id,
            title: newGameData.name,
            background_image: newGameData.background_image,
            released: newGameData.released,
            status: GAME_STATUS.BACKLOG,
            platform: platform, // Use mapping if needed, but UI usually passes string
            playtime: newGameData.playtime || 0,
            rating: 0,
            rating_top: 0,
            addedAt: new Date().toISOString()
        };

        // Try Add (returns false if duplicate)
        const success = gameData.addGameRaw(newGame);
        if (!success) return;

        // Award XP
        gamification.awardXP(XP_REWARDS.ADD_GAME);

        // Fetch Full Details (Only for API games, skip manual timestamps)
        if (settings.gameApiProvider.value === 'igdb' && settings.igdbClientId.value && settings.igdbAccessToken.value && newGameData.id < 10000000000) {
            try {
                const response = await fetch(IGDB_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Client-ID': settings.igdbClientId.value.trim(),
                        'Authorization': `Bearer ${settings.igdbAccessToken.value.trim()}`,
                        'Accept': 'application/json',
                    },
                    body: `fields name, summary, cover.image_id, artworks.image_id, screenshots.image_id, first_release_date, platforms.name, aggregated_rating, genres.name, involved_companies.company.name, websites.category, websites.url, dlcs.name, dlcs.first_release_date, dlcs.cover.image_id, expansions.name, expansions.first_release_date, expansions.cover.image_id; where id = ${newGameData.id};`
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const igdbGame = data[0];

                        const details = {
                            id: igdbGame.id,
                            name: igdbGame.name,
                            description: igdbGame.summary || '',
                            description_raw: igdbGame.summary || '',
                            released: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000).toISOString().split('T')[0] : null,
                            background_image: getBestIGDBBackground(igdbGame),
                            metacritic: igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null,
                            rating_top: igdbGame.aggregated_rating ? Math.round((igdbGame.aggregated_rating / 100) * 5) : 0,
                            parent_platforms: aggregateIGDBPlatforms(igdbGame.platforms),
                            genres: aggregateIGDBGenres(igdbGame.genres),
                            developers: igdbGame.involved_companies ? igdbGame.involved_companies.map(c => ({ name: c.company.name })) : [],
                            website: getBestIGDBWebsite(igdbGame.websites),
                            additions: aggregateIGDBAdditions(igdbGame.dlcs, igdbGame.expansions)
                        };

                        gameData.updateGame(newGameData.id, {
                            ...details,
                            status: GAME_STATUS.BACKLOG,
                            platform: platform || gameData.mapPlatform(details.parent_platforms),
                            rating: 0,
                            addedAt: newGame.addedAt,
                            playtime: newGame.playtime,
                            owned_additions: newGame.owned_additions || []
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to fetch full details on add from IGDB', e);
            }
        } else if (settings.gameApiProvider.value === 'rawg' && settings.apiKey.value && newGameData.id < 10000000000) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${newGameData.id}?key=${settings.apiKey.value}`);
                if (response.ok) {
                    const details = await response.json();

                    // Fetch additions separately for RAWG
                    const additions = await fetchRAWGAdditions(newGameData.id);

                    // Update via gameData
                    gameData.updateGame(newGameData.id, {
                        ...details,
                        additions,
                        // Preserve local state
                        status: GAME_STATUS.BACKLOG,
                        platform: platform,
                        rating: 0,
                        addedAt: newGame.addedAt,
                        playtime: details.playtime || newGame.playtime,
                        owned_additions: newGame.owned_additions || []
                    });
                }
            } catch (e) {
                console.error('Failed to fetch full details on add from RAWG', e);
            }
        }
    };

    // Remove Game Wrapper (Data + Gamification)
    const removeGame = (id) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (game) {
            // Calculate XP to remove
            let deduction = XP_REWARDS.REMOVE_GAME;
            if (game.startedAt) deduction += XP_REWARDS.REMOVE_STARTED - XP_REWARDS.REMOVE_GAME; // -60 - (-10) = -50
            // Actually, my constants for REMOVE are totals.
            // But here logic builds it up.
            // Let's use the explicit constants if possible or stick to logic.
            // Current Config: REMOVE_GAME: -10, REMOVE_STARTED: -60.

            // Logic here was: -10 (base), -50 (start), -200 (complete).
            // So:
            // if (game.completedAt) deduction = XP_REWARDS.REMOVE_COMPLETED;
            // else if (game.startedAt) deduction = XP_REWARDS.REMOVE_STARTED;
            // else deduction = XP_REWARDS.REMOVE_GAME;

            if (game.completedAt) {
                gamification.awardXP(XP_REWARDS.REMOVE_COMPLETED);
            } else if (game.startedAt) {
                gamification.awardXP(XP_REWARDS.REMOVE_STARTED);
            } else {
                gamification.awardXP(XP_REWARDS.REMOVE_GAME);
            }

            gameData.removeGameRaw(id);
        }
    };

    // Update Status Wrapper (Logic for XP changes on status change)
    const updateStatus = (id, newStatus) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (!game) return;

        const oldStatus = game.status;
        if (oldStatus === newStatus) return;



        // 1. Remove Old XP
        if (oldStatus === GAME_STATUS.COMPLETED) {
            gamification.awardXP(XP_REWARDS.UNDO_COMPLETE); // -200
            game.completedAt = null;
        }
        if (oldStatus === GAME_STATUS.PLAYING && newStatus === GAME_STATUS.BACKLOG) {
            gamification.awardXP(XP_REWARDS.UNDO_START); // -50
            game.startedAt = null;
        }
        if (oldStatus === GAME_STATUS.COMPLETED && newStatus === GAME_STATUS.BACKLOG) {
            gamification.awardXP(XP_REWARDS.UNDO_START); // -50 (Cleaning up start bonus too? No wait.)
            // Original logic:
            // if old=completed (-200) AND new=backlog (-50). 
            // My constants: UNDO_COMPLETE = -200. UNDO_START = -50.

            // Logic reuse checks:
            // old=completed -> -200. game object now has startedAt but no completedAt.
            // new=backlog -> we need to remove startedAt too.

            // If we just removed 200 above, we still have the start bonus active (presumably).
            // The original code had:
            // if (oldStatus === 'completed' && newStatus === 'backlog') { gamification.awardXP(-XP_START); game.startedAt = null; }

            // So yes, we need to undo start too.
            gamification.awardXP(XP_REWARDS.UNDO_START);
            game.startedAt = null;
        }

        // 2. Add New XP
        if (newStatus === GAME_STATUS.PLAYING) {
            if (oldStatus === GAME_STATUS.BACKLOG) {
                gamification.awardXP(XP_REWARDS.START_GAME);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
        }
        else if (newStatus === GAME_STATUS.COMPLETED) {
            if (oldStatus === GAME_STATUS.PLAYING) {
                gamification.awardXP(XP_REWARDS.COMPLETE_GAME);
            }
            else if (oldStatus === GAME_STATUS.BACKLOG) {
                gamification.awardXP(XP_REWARDS.COMPLETE_FROM_BACKLOG);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
            else if (oldStatus === GAME_STATUS.DROPPED) {
                gamification.awardXP(XP_REWARDS.COMPLETE_FROM_DROPPED);
                if (!game.startedAt) game.startedAt = new Date().toISOString();
            }
            game.completedAt = new Date().toISOString();
        }

        // 3. Apply Status Status
        gameData.updateGame(id, { status: newStatus });
    };

    // Toggle Nested DLC Ownership / Completion Status
    const toggleAdditionStatus = (gameId, additionId) => {
        const game = gameData.games.value.find(g => g.id === gameId);
        if (!game) return;

        // Initialize array if missing
        if (!game.owned_additions) {
            game.owned_additions = [];
        }

        // Auto-Migrate flat arrays (backward compatibility)
        game.owned_additions = game.owned_additions.map(item => {
            if (typeof item !== 'object') {
                return { id: item, status: 'owned' };
            }
            return item;
        });

        const index = game.owned_additions.findIndex(a => a.id === additionId);

        if (index === -1) {
            // State: Unowned -> Owned
            game.owned_additions.push({ id: additionId, status: 'owned' });
            gamification.awardXP(XP_REWARDS.ADD_DLC);
        } else {
            const currentStatus = game.owned_additions[index].status;
            if (currentStatus === 'owned') {
                // State: Owned -> Finished
                game.owned_additions[index].status = 'finished';
                gamification.awardXP(XP_REWARDS.FINISH_DLC);
            } else {
                // State: Finished -> Unowned
                game.owned_additions.splice(index, 1);
                gamification.awardXP(XP_REWARDS.UNDO_FINISH_DLC);
                gamification.awardXP(XP_REWARDS.UNDO_ADD_DLC); // Need to deduct both since it goes flat Unowned
            }
        }

        // Force reactivity update in local storage wrapper
        gameData.updateGame(gameId, { owned_additions: [...game.owned_additions] });
    };

    // Ignore Game Wrapper
    const ignoreGame = (gameTitle, platform = 'Any') => {
        // Add minimal game object with IGN status
        const newGame = {
            id: Date.now(),
            title: gameTitle,
            platform: platform,
            status: 'ignored',
            addedAt: new Date().toISOString()
        };
        gameData.addGameRaw(newGame);
    };

    // Unignore Game Wrapper
    const unignoreGame = (id) => {
        gameData.removeGameRaw(id);
    };

    // Refresh Game Wrapper (API access)
    const refreshGame = async (id) => {
        const game = gameData.games.value.find(g => g.id === id);
        if (!game) return;

        if (settings.gameApiProvider.value === 'igdb' && settings.igdbClientId.value && settings.igdbAccessToken.value) {
            try {
                const response = await fetch(IGDB_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Client-ID': settings.igdbClientId.value.trim(),
                        'Authorization': `Bearer ${settings.igdbAccessToken.value.trim()}`,
                        'Accept': 'application/json'
                    },
                    body: `fields name, summary, cover.image_id, artworks.image_id, screenshots.image_id, first_release_date, platforms.name, aggregated_rating, genres.name, involved_companies.company.name, websites.category, websites.url, dlcs.name, dlcs.first_release_date, dlcs.cover.image_id, expansions.name, expansions.first_release_date, expansions.cover.image_id; where id = ${id};`
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const igdbGame = data[0];
                        const details = {
                            id: igdbGame.id,
                            name: igdbGame.name,
                            description: igdbGame.summary || '',
                            description_raw: igdbGame.summary || '',
                            released: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000).toISOString().split('T')[0] : null,
                            background_image: getBestIGDBBackground(igdbGame),
                            metacritic: igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null,
                            rating_top: igdbGame.aggregated_rating ? Math.round((igdbGame.aggregated_rating / 100) * 5) : 0,
                            parent_platforms: aggregateIGDBPlatforms(igdbGame.platforms),
                            genres: aggregateIGDBGenres(igdbGame.genres),
                            developers: igdbGame.involved_companies ? igdbGame.involved_companies.map(c => ({ name: c.company.name })) : [],
                            website: getBestIGDBWebsite(igdbGame.websites),
                            additions: aggregateIGDBAdditions(igdbGame.dlcs, igdbGame.expansions)
                        };
                        gameData.updateGame(id, {
                            ...details,
                            // Preserve local info
                            status: game.status,
                            platform: game.platform,
                            rating: game.rating,
                            addedAt: game.addedAt,
                            startedAt: game.startedAt,
                            completedAt: game.completedAt,
                            playtime: game.playtime || details.playtime || 0
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to refresh details from IGDB', e);
            }
        } else if (settings.gameApiProvider.value === 'rawg' && settings.apiKey.value && id < 10000000000) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${settings.apiKey.value}`);
                if (response.ok) {
                    const details = await response.json();

                    // Fetch additions separately for RAWG
                    const additions = await fetchRAWGAdditions(id);

                    gameData.updateGame(id, {
                        ...details,
                        additions,
                        status: game.status,
                        platform: game.platform,
                        rating: game.rating,
                        addedAt: game.addedAt,
                        startedAt: game.startedAt,
                        completedAt: game.completedAt,
                        playtime: game.playtime || details.playtime || 0
                    });
                }
            } catch (e) {
                console.error('Failed to refresh details from RAWG', e);
            }
        }
        return { success: false, error: 'Network error or missing keys' };
    };

    // Deep fetch single game without saving to backlog
    const fetchGameDetailsOnly = async (id) => {
        if (settings.gameApiProvider.value === 'igdb' && settings.igdbClientId.value && settings.igdbAccessToken.value) {
            try {
                const response = await fetch(IGDB_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Client-ID': settings.igdbClientId.value.trim(),
                        'Authorization': `Bearer ${settings.igdbAccessToken.value.trim()}`,
                        'Accept': 'application/json'
                    },
                    body: `fields name, summary, cover.image_id, artworks.image_id, screenshots.image_id, first_release_date, platforms.name, aggregated_rating, genres.name, involved_companies.company.name, websites.category, websites.url, dlcs.name, dlcs.first_release_date, dlcs.cover.image_id, expansions.name, expansions.first_release_date, expansions.cover.image_id; where id = ${id};`
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const igdbGame = data[0];
                        return {
                            id: igdbGame.id,
                            name: igdbGame.name,
                            description: igdbGame.summary || '',
                            description_raw: igdbGame.summary || '',
                            released: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000).toISOString().split('T')[0] : null,
                            background_image: getBestIGDBBackground(igdbGame),
                            metacritic: igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null,
                            rating_top: igdbGame.aggregated_rating ? Math.round((igdbGame.aggregated_rating / 100) * 5) : 0,
                            parent_platforms: aggregateIGDBPlatforms(igdbGame.platforms),
                            genres: aggregateIGDBGenres(igdbGame.genres),
                            developers: igdbGame.involved_companies ? igdbGame.involved_companies.map(c => ({ name: c.company.name })) : [],
                            website: getBestIGDBWebsite(igdbGame.websites),
                            additions: aggregateIGDBAdditions(igdbGame.dlcs, igdbGame.expansions)
                        };
                    }
                }
            } catch (e) {
                console.error('Failed to fetch deep details from IGDB', e);
            }
        } else if (settings.gameApiProvider.value === 'rawg' && settings.apiKey.value) {
            try {
                const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${settings.apiKey.value}`);
                if (response.ok) {
                    const details = await response.json();

                    // Fetch additions separately for RAWG
                    const additions = await fetchRAWGAdditions(id);

                    return {
                        ...details,
                        additions
                    };
                }
            } catch (e) {
                console.error('Failed to fetch deep details from RAWG', e);
            }
        }
        return null;
    };

    // Helper: Fetch only available hi-res artworks and screenshots for a game from IGDB
    const fetchGameImages = async (id) => {
        if (settings.gameApiProvider.value !== 'igdb' || !settings.igdbClientId.value || !settings.igdbAccessToken.value) {
            return [];
        }

        try {
            const response = await fetch(IGDB_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Client-ID': settings.igdbClientId.value.trim(),
                    'Authorization': `Bearer ${settings.igdbAccessToken.value.trim()}`,
                    'Accept': 'application/json'
                },
                body: `fields cover.image_id, artworks.image_id, screenshots.image_id; where id = ${id};`
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const game = data[0];
                    const images = [];

                    // Extract Cover (Fallback)
                    if (game.cover && game.cover.image_id) {
                        images.push({
                            id: `cover_${game.cover.id || Math.random()}`,
                            thumb: `https://images.igdb.com/igdb/image/upload/t_screenshot_med/${game.cover.image_id}.jpg`, // Use wide format thumb for UI consistency
                            hires: `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`
                        });
                    }

                    // Extract Artworks
                    if (game.artworks) {
                        game.artworks.forEach(art => {
                            if (art.image_id) {
                                images.push({
                                    id: `art_${art.id || Math.random()}`,
                                    thumb: `https://images.igdb.com/igdb/image/upload/t_screenshot_med/${art.image_id}.jpg`,
                                    hires: `https://images.igdb.com/igdb/image/upload/t_1080p/${art.image_id}.jpg`
                                });
                            }
                        });
                    }

                    // Extract Screenshots
                    if (game.screenshots) {
                        game.screenshots.forEach(screen => {
                            if (screen.image_id) {
                                images.push({
                                    id: `screen_${screen.id || Math.random()}`,
                                    thumb: `https://images.igdb.com/igdb/image/upload/t_screenshot_med/${screen.image_id}.jpg`,
                                    hires: `https://images.igdb.com/igdb/image/upload/t_1080p/${screen.image_id}.jpg`
                                });
                            }
                        });
                    }

                    return images;
                }
            }
        } catch (e) {
            console.error('Failed to fetch game images from IGDB', e);
        }
        return [];
    };

    // Search Logic (Depends on API Key and Settings)
    const searchGames = async (query) => {
        if (!query) return;

        isSearching.value = true;
        try {
            if (settings.gameApiProvider.value === 'igdb' && settings.igdbClientId.value && settings.igdbAccessToken.value) {
                const response = await fetch(IGDB_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Client-ID': settings.igdbClientId.value.trim(),
                        'Authorization': `Bearer ${settings.igdbAccessToken.value.trim()}`,
                        'Accept': 'application/json'
                    },
                    body: `search "${query}"; fields id, name, cover.image_id, artworks.image_id, screenshots.image_id, first_release_date, platforms.name, aggregated_rating; limit 10;`
                });

                if (response.ok) {
                    const data = await response.json();
                    searchResults.value = (data || []).map(game => {
                        let background_image = null;
                        if (game.cover && game.cover.image_id) {
                            background_image = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`;
                        } else {
                            background_image = getBestIGDBBackground(game);
                        }

                        return {
                            id: game.id,
                            name: game.name,
                            background_image,
                            released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : null,
                            rating_top: game.aggregated_rating ? Math.round((game.aggregated_rating / 100) * 5) : 0,
                            parent_platforms: aggregateIGDBPlatforms(game.platforms),
                            selectedPlatform: gameData.mapPlatform(game.platforms ? game.platforms.map(p => ({ platform: { name: p.name } })) : [])
                        };
                    });
                } else {
                    searchResults.value = [];
                }
            } else if (settings.gameApiProvider.value === 'rawg' && settings.apiKey.value) {
                const response = await fetch(`https://api.rawg.io/api/games?key=${settings.apiKey.value}&search=${encodeURIComponent(query)}&page_size=10`);
                if (response.ok) {
                    const data = await response.json();
                    searchResults.value = (data.results || []).map(game => ({
                        ...game,
                        selectedPlatform: gameData.mapPlatform(game.parent_platforms || game.platforms)
                    }));
                } else {
                    searchResults.value = [];
                }
            } else {
                searchResults.value = [];
            }
        } catch (error) {
            console.error('Search failed', error);
            searchResults.value = [];
        } finally {
            isSearching.value = false;
        }
    };

    // User Persistence Coordinator (Watch all parts and save to one User object)
    // This maintains the original format: { xp, name, avatar, title }
    watch(
        [gamification.userXP, settings.userName, settings.userAvatar, settings.selectedTitle],
        () => {
            localStorage.setItem('game-tracker-user', JSON.stringify({
                xp: gamification.userXP.value,
                name: settings.userName.value,
                avatar: settings.userAvatar.value,
                title: settings.selectedTitle.value
            }));
        }
    );

    // Return Unified Interface (matching original useGames)
    return {
        // Settings
        apiKey: settings.apiKey,
        gameApiProvider: settings.gameApiProvider,
        igdbClientId: settings.igdbClientId,
        igdbAccessToken: settings.igdbAccessToken,
        setApiKey: settings.setApiKey,
        themeColor: settings.themeColor,
        setTheme: settings.setTheme,
        THEMES: settings.THEMES,

        // User
        userName: settings.userName,
        userAvatar: settings.userAvatar,
        setUserName: settings.setUserName,
        setUserAvatar: settings.setUserAvatar,
        userTitle: settings.selectedTitle, // Note: original exposed computed 'userTitle' with fallback logic
        setUserTitle: settings.setUserTitle,

        // Gamification
        userXP: gamification.userXP,
        userLevel: gamification.userLevel,
        awardXP: gamification.awardXP,
        xpProgress: gamification.xpProgress,
        levelStartXP: gamification.levelStartXP,
        nextLevelXP: gamification.nextLevelXP,
        availableTitles: gamification.availableTitles,
        incrementQuestUsage: gamification.incrementQuestUsage,

        // Original Computed User Title needs to be recreated here if logic was complex?
        // Original: if selected return it, else match level.
        // Let's use the one from settings (which is just state) and add the fallback logic again here or in Gamification.
        // Gamification has `getTitleForLevel`.
        userTitle: computed(() => {
            if (settings.selectedTitle.value) return settings.selectedTitle.value;
            return gamification.getTitleForLevel(gamification.userLevel.value);
        }),


        // Data
        games: computed(() => gameData.games.value.filter(g => g.status !== 'ignored')),
        backlogGames: gameData.backlogGames,
        playingGames: gameData.playingGames,
        completedGames: gameData.completedGames,
        droppedGames: gameData.droppedGames,
        ignoredGames: computed(() => gameData.games.value.filter(g => g.status === 'ignored')),
        gameStats: gameData.gameStats,
        PLATFORMS: gameData.PLATFORMS,

        // Actions (Wrapped)
        addGame,
        removeGame,
        updateStatus,
        toggleAdditionStatus,
        refreshGame,
        fetchGameDetailsOnly,
        ignoreGame,
        unignoreGame,
        fetchGameImages,

        // Actions (Direct)
        updateGame: gameData.updateGame, // Map directly to raw update for simple edits
        rateGame: gameData.rateGame,

        // Comprehensive Export
        exportData: persistence.exportData,

        // Comprehensive Import
        importData: persistence.importData,

        // Search
        searchQuery,
        searchResults,
        isSearching,
        searchGames
    };
}
