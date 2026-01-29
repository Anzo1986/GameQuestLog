import { ref, watch } from 'vue';

const API_KEY_STORAGE_KEY = 'game-tracker-api-key';
const USER_STORAGE_KEY = 'game-tracker-user';
const THEME_STORAGE_KEY = 'game-tracker-theme';

// Shared State
const apiKey = ref(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
const themeColor = ref(localStorage.getItem(THEME_STORAGE_KEY) || 'blue');
const userName = ref('Guest');
const userAvatar = ref(null);
const selectedTitle = ref(null);

const THEMES = {
    blue: { name: 'Blue', rgb: '59 130 246' },   // blue-500
    pink: { name: 'Pink', rgb: '236 72 153' },   // pink-500
    green: { name: 'Green', rgb: '34 197 94' },    // green-500
    purple: { name: 'Purple', rgb: '168 85 247' },   // purple-500
    orange: { name: 'Orange', rgb: '249 115 22' },   // orange-500
    red: { name: 'Red', rgb: '239 68 68' },    // red-500
};

// Apply theme immediately
const applyTheme = (color) => {
    const theme = THEMES[color] || THEMES.blue;
    document.documentElement.style.setProperty('--primary-rgb', theme.rgb);
};
applyTheme(themeColor.value);

// Initialization
const savedUser = localStorage.getItem(USER_STORAGE_KEY);
if (savedUser) {
    try {
        const userData = JSON.parse(savedUser);
        userName.value = userData.name || 'Guest';
        userAvatar.value = userData.avatar || null;
        selectedTitle.value = userData.title || null;
    } catch (e) {
        console.error('Failed to parse user data', e);
    }
}

// Actions
const setApiKey = (key) => {
    apiKey.value = key;
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

const setTheme = (color) => {
    if (THEMES[color]) {
        themeColor.value = color;
        applyTheme(color); // Force update
        localStorage.setItem(THEME_STORAGE_KEY, color);
    }
};

const setUserName = (name) => {
    userName.value = name;
};

const setUserAvatar = (dataUrl) => {
    userAvatar.value = dataUrl;
};

const setUserTitle = (title) => {
    selectedTitle.value = title;
};

// Persist User Data (Partial)
// Note: XP is managed by Gamification, but we might share the storage key or coordinate storage.
// For now, let's expose a way to save full user object if needed, or watch internal parts.
// To avoid circular dependency with XP, `useSettings` will only save what it owns, 
// OR we keep the watcher external/in the facade.
// Decision: Let's export persistUser to allow external callers (Gamification) to trigger save,
// OR simply provide getters/setters and let the composition root (useGames) handle the unified watcher.
// FOR NOW: We'll keep local watchers for distinct parts, but XP is missing here.
// Best approach: Expose a `saveUserData` helper that takes XP as argument, or separate Storages.
// Current `useGames.js` saves {xp, name, avatar, title} in one object.
// To support this, we need to coordinate. 
// A simple event bus or shared reactive object works. 
// Let's stick to the current plan: `useGames` (Facade) will have the watcher that combines everything.

// Watchers (for isolated parts)
// Theme is isolated.
watch(themeColor, (newColor) => {
    localStorage.setItem(THEME_STORAGE_KEY, newColor);
    applyTheme(newColor);
});

export function useSettings() {
    return {
        apiKey,
        themeColor,
        userName,
        userAvatar,
        selectedTitle,
        THEMES,
        setApiKey,
        setTheme,
        setUserName,
        setUserAvatar,
        setUserTitle,
        applyTheme
    };
}
