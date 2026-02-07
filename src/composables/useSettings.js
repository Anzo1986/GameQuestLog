import { ref, watch } from 'vue';

const API_KEY_STORAGE_KEY = 'game-tracker-api-key';
const USER_STORAGE_KEY = 'game-tracker-user';
const THEME_STORAGE_KEY = 'game-tracker-theme';
const SORT_STORAGE_KEY = 'game-tracker-sort';
const VIEW_MODE_STORAGE_KEY = 'game-tracker-view-mode';

// Shared State
const apiKey = ref(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
const themeColor = ref(localStorage.getItem(THEME_STORAGE_KEY) || 'blue');
const sortOption = ref(localStorage.getItem(SORT_STORAGE_KEY) || 'dateDesc');
const viewMode = ref(localStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'grid');
const lastBackup = ref(localStorage.getItem('game-tracker-last-backup') || null);
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

    // Expanded Standard Themes
    lime: { name: 'Lime', rgb: '132 204 22' }, // lime-500
    teal: { name: 'Teal', rgb: '20 184 166' }, // teal-500
    indigo: { name: 'Indigo', rgb: '99 102 241' }, // indigo-500
    fuchsia: { name: 'Fuchsia', rgb: '217 70 239' }, // fuchsia-500

    // Neutral / "Ugly" Themes (Requested)
    brown: { name: 'Brown', rgb: '120 53 15' }, // amber-900
    white: { name: 'White', rgb: '229 231 235' }, // gray-200 (using light gray for visibility on dark bg)
    black: { name: 'Black', rgb: '75 85 99' }, // gray-600 (using dark gray, pure black is invisible)

    // Shop Themes (Special)
    cyberpunk: { name: 'Cyberpunk', rgb: '6 182 212' }, // cyan-500
    emerald: { name: 'Emerald', rgb: '16 185 129' }, // emerald-500
    gold: { name: 'Gold', rgb: '234 179 8' }, // yellow-500
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

const updateLastBackup = () => {
    const now = new Date().toISOString();
    lastBackup.value = now;
    localStorage.setItem('game-tracker-last-backup', now);
};

// Watchers (for isolated parts)
// Theme is isolated.
watch(themeColor, (newColor) => {
    localStorage.setItem(THEME_STORAGE_KEY, newColor);
    applyTheme(newColor);
});

watch(sortOption, (newVal) => {
    localStorage.setItem(SORT_STORAGE_KEY, newVal);
});

watch(viewMode, (newVal) => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, newVal);
});

export function useSettings() {
    return {
        apiKey,
        themeColor,
        sortOption,
        viewMode,
        userName,
        userAvatar,
        selectedTitle,
        THEMES,
        setApiKey,
        setTheme,
        setUserName,
        setUserAvatar,
        setUserTitle,
        updateLastBackup,
        lastBackup,
        applyTheme
    };
}
