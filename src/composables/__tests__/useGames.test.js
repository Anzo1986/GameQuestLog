import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGames } from '../useGames';
import { useSettings } from '../useSettings';
import { useGamification } from '../useGamification';
import { useGameData } from '../useGameData';

// Mock Dependencies
vi.mock('../useSettings', () => ({
    useSettings: vi.fn()
}));

vi.mock('../useGamification', () => ({
    useGamification: vi.fn()
}));

vi.mock('../useGameData', () => ({
    useGameData: vi.fn()
}));

describe('useGames', () => {
    let mockSettings;
    let mockGamification;
    let mockGameData;

    beforeEach(() => {
        // Reset Mocks
        mockSettings = {
            apiKey: { value: 'test-key' },
            setApiKey: vi.fn(),
            userName: { value: 'TestUser' },
            userAvatar: { value: 'test.png' },
            selectedTitle: { value: 'Newbie' }
        };
        useSettings.mockReturnValue(mockSettings);

        mockGamification = {
            userXP: { value: 0 },
            awardXP: vi.fn(),
            userLevel: { value: 1 }
        };
        useGamification.mockReturnValue(mockGamification);

        mockGameData = {
            games: { value: [] },
            addGameRaw: vi.fn().mockReturnValue(true),
            removeGameRaw: vi.fn(),
            updateGame: vi.fn(),
            mapPlatform: vi.fn()
        };
        useGameData.mockReturnValue(mockGameData);
    });

    it('addGame adds a game and awards XP', async () => {
        const { addGame } = useGames();
        const newGame = { id: 1, name: 'Test Game', released: '2020-01-01' };

        await addGame(newGame);

        expect(mockGameData.addGameRaw).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            title: 'Test Game',
            status: 'backlog'
        }));
        expect(mockGamification.awardXP).toHaveBeenCalledWith(10);
    });

    it('removeGame removes a game and deducts XP', () => {
        const { removeGame } = useGames();
        // Setup initial state in mock
        mockGameData.games.value = [{ id: 1, status: 'backlog', title: 'Test' }];

        removeGame(1);

        expect(mockGameData.removeGameRaw).toHaveBeenCalledWith(1);
        // Default deduction for backlog game is 10
        expect(mockGamification.awardXP).toHaveBeenCalledWith(-10);
    });

    it('updateStatus changes status and adjusts XP (Backlog -> Playing)', () => {
        const { updateStatus } = useGames();
        const game = { id: 1, status: 'backlog', title: 'Test' };
        mockGameData.games.value = [game];

        updateStatus(1, 'playing');

        expect(game.status).toBe('playing');
        expect(mockGamification.awardXP).toHaveBeenCalledWith(50); // XP_START
    });

    it('updateStatus changes status and adjusts XP (Playing -> Completed)', () => {
        const { updateStatus } = useGames();
        const game = { id: 1, status: 'playing', title: 'Test' };
        mockGameData.games.value = [game];

        updateStatus(1, 'completed');

        expect(game.status).toBe('completed');
        expect(mockGamification.awardXP).toHaveBeenCalledWith(200); // XP_COMPLETE
    });
});
