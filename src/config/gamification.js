export const GAME_STATUS = {
    PLAYING: 'playing',
    BACKLOG: 'backlog',
    COMPLETED: 'completed',
    DROPPED: 'dropped'
};

export const XP_REWARDS = {
    // Basic Actions
    ADD_GAME: 10,

    // Status Changes
    START_GAME: 50,      // Backlog -> Playing
    COMPLETE_GAME: 200,  // Playing -> Completed

    // Bonuses
    COMPLETE_FROM_BACKLOG: 250, // 50 (Start) + 200 (Complete)
    COMPLETE_FROM_DROPPED: 250, // Reclaiming a dropped game

    // Deductions (Negative values)
    REMOVE_GAME: -10,
    REMOVE_STARTED: -60, // -10 - 50
    REMOVE_COMPLETED: -260, // -10 - 50 - 200

    // Revert Status (Undo)
    UNDO_COMPLETE: -200,
    UNDO_START: -50
};

export const LEVEL_CURVE = {
    BASE_XP: 500,
    EXPONENT: 1.2
};
