<script setup>
import { computed } from 'vue';
import { useSettings } from '../composables/useSettings';
import { useShop } from '../composables/useShop';
import BackgroundAurora from './BackgroundAurora.vue';
import BackgroundSynthwave from './BackgroundSynthwave.vue';
import prismBg from '@/assets/shop_background_prism.png';
import neonBg from '@/assets/shop_background_neon.png';

const { getEquippedItem } = useShop();
const equippedBackground = computed(() => getEquippedItem('background'));

const backgroundClass = computed(() => {
    const val = equippedBackground.value?.value;
    if (val === 'stars') return 'bg-gray-900 bg-[radial-gradient(white,transparent_2px)] bg-[size:30px_30px]';
    if (val === 'grid') return 'bg-gray-900 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]';
    if (val === 'synthwave') return 'bg-transparent overflow-hidden'; 
    if (val === 'prism_bg') return 'bg-black bg-prism';
    if (val === 'neon_bg') return 'bg-black bg-neon';
    if (val === 'matrix') return 'bg-black matrix-bg';
    if (val === 'hex') return 'bg-gray-900 hex-bg';
    if (val === 'aurora') return 'bg-gray-950 overflow-hidden'; 
    if (val === 'pulse') return 'bg-gray-900 pulse-bg';
    if (val === 'dots') return 'bg-gray-900 bg-[radial-gradient(rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[size:20px_20px]';
    if (val === 'circuit') return 'bg-gray-900 bg-[radial-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]'; 
    return 'bg-gray-900';
});

// Expose background style object for dynamic URLs
const backgroundStyle = computed(() => {
    const val = equippedBackground.value?.value;
    if (val === 'prism_bg') return { backgroundImage: `url(${prismBg})` };
    if (val === 'neon_bg') return { backgroundImage: `url(${neonBg})` };
    return {};
});
</script>

<template>
    <div class="fixed inset-0 -z-50 transition-colors duration-500 pointer-events-none" :class="backgroundClass" :style="backgroundStyle">
        <BackgroundAurora v-if="equippedBackground?.value === 'aurora'" />
        <BackgroundSynthwave v-if="equippedBackground?.value === 'synthwave'" />
    </div>
</template>

<style>
/* Global Background Styles moved here */
.bg-prism {
    background-color: #000;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
.bg-neon {
    background-color: #000;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
.matrix-bg {
    background-color: #000;
    background-image: 
        linear-gradient(rgba(0, 20, 0, 0.9), rgba(0, 0, 0, 0.4)), 
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ctext x='10' y='30' fill='%230f0' font-family='monospace' font-size='20' opacity='0.5'%3E1%3C/text%3E%3Ctext x='50' y='70' fill='%230f0' font-family='monospace' font-size='20' opacity='0.3'%3E0%3C/text%3E%3Ctext x='80' y='40' fill='%230f0' font-family='monospace' font-size='20' opacity='0.4'%3E1%3C/text%3E%3Ctext x='30' y='90' fill='%230f0' font-family='monospace' font-size='20' opacity='0.6'%3E0%3C/text%3E%3C/svg%3E");
    background-size: cover, 200px 200px;
    animation: matrix-scroll 20s linear infinite;
}
@keyframes matrix-scroll {
    from { background-position: 0 0, 0 0; }
    to { background-position: 0 0, 0 200px; }
}
.hex-bg {
    background-color: #0f172a;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%2364748b' fill-opacity='0.15' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L10.98 40v6.35L0 42.7v-2.3zm25.5-18.5l2.5-2.3-10.99-6.35V0h-2v7.5L25.5 15zm0 18.5l2.5 2.3-10.99 6.35V49h-2v-7.5L25.5 33.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    background-attachment: fixed;
    animation: hex-pulse 4s ease-in-out infinite alternate;
}
@keyframes hex-pulse {
    from { opacity: 0.8; }
    to { opacity: 1; }
}
.pulse-bg {
    background-color: #111827;
    background-image: radial-gradient(circle at center, rgba(56, 189, 248, 0.1) 0%, transparent 70%),
                      linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
    background-size: 100% 100%, 50px 50px, 50px 50px;
    animation: pulse-glow 4s ease-in-out infinite alternate;
}
@keyframes pulse-glow {
    from { background-image: radial-gradient(circle at center, rgba(56, 189, 248, 0.05) 0%, transparent 50%), linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px); }
    to { background-image: radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, transparent 80%), linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px); }
}
</style>
