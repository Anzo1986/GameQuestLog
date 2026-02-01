
export function useCardStyles() {
    const getCardClasses = (styleName) => {
        // Base Classes
        let classes = 'bg-gray-900 border-2 ';

        if (!styleName || styleName === 'none') {
            return 'bg-gray-900 border-gray-700';
        }

        switch (styleName) {
            case 'gold': return classes + 'border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.2)] bg-gradient-to-br from-gray-900 via-gray-900 to-yellow-900/20';
            case 'holo': return classes + 'border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.2)] relative overflow-hidden';
            case 'cyber': return classes + 'border-pink-500 shadow-[0_0_80px_rgba(236,72,153,0.3)] relative overflow-hidden';
            case 'retro': return classes + 'border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.2)] relative overflow-hidden font-mono';
            case 'fire': return classes + 'border-orange-600 shadow-[0_0_80px_rgba(234,88,12,0.4)] relative overflow-hidden';
            case 'glitter': return classes + 'border-purple-300 shadow-[0_0_60px_rgba(216,180,254,0.3)] relative overflow-hidden';
            case 'spotlight': return classes + 'border-white/40 shadow-[0_0_80px_rgba(255,255,255,0.2)] relative overflow-hidden';

            // New Styles
            case 'prism': return 'border-2 border-transparent bg-gray-900 shadow-[0_0_40px_rgba(255,255,255,0.2)] relative overflow-hidden';
            case 'glitch': return 'border-2 border-cyan-500 border-dashed shadow-[0_0_40px_rgba(6,182,212,0.4)] relative overflow-hidden';

            default: return 'bg-gray-900 border-gray-700';
        }
    };

    return { getCardClasses };
}
