import { ref, computed } from 'vue';
import { useAchievements } from './useAchievements';
import { useSettings } from './useSettings';

const SHOP_STORAGE_KEY = 'game-tracker-shop-v2';

// Shop Catalog
export const SHOP_ITEMS = [
    // Themes (Price: 50)
    { id: 'theme_default', type: 'theme', name: 'Original Blue', price: 0, description: 'The classic look.', value: 'blue', owned: true },
    { id: 'theme_emerald', type: 'theme', name: 'Matrix Emerald', price: 50, description: 'Enter the matrix.', value: 'emerald' },
    { id: 'theme_orange', type: 'theme', name: 'Sunset Orange', price: 50, description: 'Warm and energetic.', value: 'orange' },
    { id: 'theme_rose', type: 'theme', name: 'Rose Pink', price: 50, description: 'Soft and elegant.', value: 'pink' },
    { id: 'theme_midnight', type: 'theme', name: 'Midnight Purple', price: 50, description: 'Deep purple vibes.', value: 'purple' },
    { id: 'theme_dracula', type: 'theme', name: 'Vampire Red', price: 50, description: 'Dark and bloody.', value: 'red' },
    { id: 'theme_lime', type: 'theme', name: 'Toxic Lime', price: 50, description: 'Radioactive green.', value: 'lime' },
    { id: 'theme_teal', type: 'theme', name: 'Abyss Teal', price: 50, description: 'From the depths.', value: 'teal' },
    { id: 'theme_indigo', type: 'theme', name: 'Deep Indigo', price: 50, description: 'Night sky.', value: 'indigo' },
    { id: 'theme_fuchsia', type: 'theme', name: 'Neon Fuchsia', price: 50, description: 'Retrowave vibes.', value: 'fuchsia' },
    { id: 'theme_cyberpunk', type: 'theme', name: 'Cyberpunk Neon', price: 50, description: 'High contrast pink and cyan.', value: 'cyberpunk' },
    { id: 'theme_royal', type: 'theme', name: 'Royal Gold', price: 50, description: 'Luxury for the elite.', value: 'gold' },

    // New Neutral Themes
    { id: 'theme_brown', type: 'theme', name: 'Coffee Brown', price: 50, description: 'Earthy and grounded.', value: 'brown' },
    { id: 'theme_white', type: 'theme', name: 'Clean White', price: 50, description: 'Minimalist bright.', value: 'white' },
    { id: 'theme_black', type: 'theme', name: 'Stealth Black', price: 50, description: 'Dark mode supreme.', value: 'black' },

    // Frames (Price: 80)
    { id: 'frame_default', type: 'frame', name: 'No Frame', price: 0, description: 'Clean and simple.', value: 'none', owned: true },
    { id: 'frame_gold', type: 'frame', name: 'Golden Ring', price: 80, description: 'A solid gold border.', value: 'gold_ring' },
    { id: 'frame_nature', type: 'frame', name: 'Forest', price: 80, description: 'Natural double border.', value: 'nature' },
    { id: 'frame_ice', type: 'frame', name: 'Frost', price: 80, description: 'Cold as ice.', value: 'ice' },
    { id: 'frame_neon_blue', type: 'frame', name: 'Neon Blue', price: 80, description: 'Glowing blue energy.', value: 'neon_blue' },
    { id: 'frame_neon_pink', type: 'frame', name: 'Neon Pink', price: 80, description: 'Glowing pink energy.', value: 'neon_pink' },
    { id: 'frame_glitch', type: 'frame', name: 'System Error', price: 80, description: 'Digital corruption.', value: 'glitch' },
    { id: 'frame_fire', type: 'frame', name: 'Inferno', price: 80, description: 'Animated fire effect.', value: 'fire' },
    { id: 'frame_rainbow', type: 'frame', name: 'Prism', price: 80, description: 'Taste the rainbow.', value: 'rainbow' },
    { id: 'frame_lightning', type: 'frame', name: 'Thunder God', price: 80, description: 'Wield the storm.', value: 'lightning' },
    { id: 'frame_cosmos', type: 'frame', name: 'Cosmic Void', price: 80, description: 'Stardust and mystery.', value: 'cosmos' },


    // Card Styles (Price: 100)
    { id: 'style_default', type: 'card_style', name: 'Standard Window', price: 0, description: 'Clean and readable.', value: 'none', owned: true },
    { id: 'style_holo', type: 'card_style', name: 'Holo Foil', price: 100, description: 'Shiny rainbow finish.', value: 'holo' },
    { id: 'style_gold', type: 'card_style', name: 'Golden Plate', price: 100, description: 'Solid gold coating.', value: 'gold' },
    { id: 'style_cyber', type: 'card_style', name: 'Cyberpunk', price: 100, description: 'Neon & Grid vibes.', value: 'cyber' },
    { id: 'style_retro', type: 'card_style', name: 'Retro Terminal', price: 100, description: 'Green phosphor scanlines.', value: 'retro' },
    { id: 'style_fire', type: 'card_style', name: 'Inferno', price: 100, description: 'Burning hot.', value: 'fire' },
    { id: 'style_glitter', type: 'card_style', name: 'Stardust', price: 100, description: 'Sparkle sparkle.', value: 'glitter' },
    { id: 'style_spotlight', type: 'card_style', name: 'Cinema', price: 100, description: 'You are the star.', value: 'spotlight' },

    // New Border Styles
    { id: 'style_prism', type: 'card_style', name: 'Prism', price: 100, description: 'Animated rgb border.', value: 'prism' },
    { id: 'style_glitch', type: 'card_style', name: 'Glitch', price: 100, description: 'Unstable signal.', value: 'glitch' },


    // Backgrounds (Price: 100)
    { id: 'bg_default', type: 'background', name: 'Deep Void', price: 0, description: 'Standard dark mode.', value: 'none', owned: true },
    { id: 'bg_stars', type: 'background', name: 'Starfield', price: 100, description: 'Lost in space.', value: 'stars' },
    { id: 'bg_grid', type: 'background', name: 'Retro Grid', price: 100, description: 'Synthwave horizon.', value: 'grid' },
    { id: 'bg_matrix', type: 'background', name: 'The Matrix', price: 100, description: 'Wake up, Neo.', value: 'matrix' },
    { id: 'bg_hex', type: 'background', name: 'Hex Core', price: 100, description: 'Geometric perfection.', value: 'hex' },
    { id: 'bg_aurora', type: 'background', name: 'Northern Lights', price: 100, description: 'Real aurora effects.', value: 'aurora' },
    { id: 'bg_pulse', type: 'background', name: 'Cyber Pulse', price: 100, description: 'Living digital network.', value: 'pulse' },
    { id: 'bg_dots', type: 'background', name: 'Polka Dots', price: 100, description: 'Subtle pattern.', value: 'dots' },
    { id: 'bg_circuit', type: 'background', name: 'Circuit Board', price: 100, description: 'Digital pathways.', value: 'circuit' },
];

// Persistent State
const shopState = ref({
    ownedItems: ['theme_default', 'frame_default', 'style_default'], // IDs of owned items
    equippedTheme: 'theme_default',
    equippedFrame: 'frame_default',
    equippedCardStyle: 'style_default'
});

// Load State
const savedShop = localStorage.getItem(SHOP_STORAGE_KEY);
if (savedShop) {
    try {
        const parsed = JSON.parse(savedShop);
        // Merge with defaults to ensure structure
        shopState.value = { ...shopState.value, ...parsed };
    } catch (e) {
        console.error('Failed to parse shop state', e);
    }
}

export function useShop() {

    // Connect to Economy
    const { totalQuestScore } = useAchievements();

    // Calculated fields
    const totalSpent = computed(() => {
        return shopState.value.ownedItems.reduce((total, itemId) => {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            return total + (item ? item.price : 0);
        }, 0);
    });

    const balance = computed(() => {
        return 999999; // DEV MODE: Infinite Coins for Testing
        // return totalQuestScore.value - totalSpent.value;
    });

    const isOwned = (id) => {
        const item = SHOP_ITEMS.find(i => i.id === id);
        // Default check first to avoid storage dependency for base items
        if (item && (item.price === 0 || item.owned)) return true;
        return shopState.value.ownedItems.includes(id);
    };

    const saveState = () => {
        localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(shopState.value));
    };

    const buyItem = (itemId) => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'Item not found' };
        if (isOwned(itemId)) return { success: false, message: 'Already owned' };
        if (balance.value < item.price) return { success: false, message: 'Not enough coins' };

        // Transaction
        shopState.value.ownedItems.push(itemId);

        // Auto-equip? user preference. Let's not auto-equip.

        saveState();
        return { success: true, message: `Purchased ${item.name}!` };
    };

    const equipItem = (itemId) => {
        if (!isOwned(itemId)) return { success: false, message: 'Item not owned' };

        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (item.type === 'theme') {
            shopState.value.equippedTheme = itemId;
            const { setTheme } = useSettings();
            setTheme(item.value);
        } else if (item.type === 'frame') {
            shopState.value.equippedFrame = itemId;
        } else if (item.type === 'card_style') {
            shopState.value.equippedCardStyle = itemId;
        } else if (item.type === 'background') {
            shopState.value.equippedBackground = itemId;
        }

        saveState();
        return { success: true, message: 'Equipped!' };
    };

    const getEquippedItem = (type) => {
        if (type === 'theme') {
            const id = shopState.value.equippedTheme;
            return SHOP_ITEMS.find(i => i.id === id) || SHOP_ITEMS[0];
        }
        if (type === 'frame') {
            const id = shopState.value.equippedFrame;
            return SHOP_ITEMS.find(i => i.id === id) || SHOP_ITEMS.find(i => i.id === 'frame_default');
        }
        if (type === 'card_style') {
            const id = shopState.value.equippedCardStyle;
            return SHOP_ITEMS.find(i => i.id === id) || SHOP_ITEMS.find(i => i.id === 'style_default');
        }
        if (type === 'background') {
            const id = shopState.value.equippedBackground;
            return SHOP_ITEMS.find(i => i.id === id) || SHOP_ITEMS.find(i => i.id === 'bg_default');
        }
        return null;
    };

    return {
        SHOP_ITEMS,
        shopState,
        balance,
        totalSpent,
        buyItem,
        equipItem,
        isOwned,
        getEquippedItem
    };
}
