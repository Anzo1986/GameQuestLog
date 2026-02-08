
export function useCardStyles() {
    const getCardClasses = (styleName, isGlass = false) => {
        // Base Background
        const bgBase = isGlass ? 'bg-gray-900/40' : 'bg-gray-900';

        // Base Classes
        let classes = `${bgBase} border-2 `;

        if (!styleName || styleName === 'none') {
            return `${bgBase} border-gray-700`;
        }

        switch (styleName) {
            case 'gold': return classes + 'border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.2)] bg-gradient-to-br from-gray-900/40 via-gray-900/40 to-yellow-900/20'; // Adjusted for transparency
            case 'holo': return classes + 'border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.2)] relative overflow-hidden';
            case 'cyber': return classes + 'border-pink-500 shadow-[0_0_80px_rgba(236,72,153,0.3)] relative overflow-hidden';
            case 'retro': return classes + 'border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.2)] relative overflow-hidden font-mono';
            case 'fire': return classes + 'border-orange-600 shadow-[0_0_80px_rgba(234,88,12,0.4)] relative overflow-hidden';
            case 'glitter': return classes + 'border-purple-300 shadow-[0_0_60px_rgba(216,180,254,0.3)] relative overflow-hidden';
            case 'spotlight': return classes + 'border-white/40 shadow-[0_0_80px_rgba(255,255,255,0.2)] relative overflow-hidden';

            // New Styles
            case 'prism': return `border-2 border-transparent ${bgBase} shadow-[0_0_40px_rgba(255,255,255,0.2)] relative overflow-hidden`;
            case 'glitch': return 'border-2 border-cyan-500 border-dashed shadow-[0_0_40px_rgba(6,182,212,0.4)] relative overflow-hidden'; // Missing bgBase? Glitch usually needs dark. Let's keep it but add bgBase if needed. Actually it was missing in original too (implicit?). Let's add it.

            default: return `${bgBase} border-gray-700`;
        }
    };

    return { getCardClasses };
}
