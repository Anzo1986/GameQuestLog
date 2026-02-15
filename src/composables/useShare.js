import { ref } from 'vue';

export function useShare() {
    const showShareFeedback = ref(false);

    /**
     * Generates a shareable link for a game
     * @param {Object} game - The game object to share
     * @returns {string} - The full URL with the shared game data
     */
    const generateShareUrl = (game) => {
        // Create a minimal payload with essential data
        const payload = {
            id: game.id,
            name: game.name || game.title,
            background_image: game.background_image,
            released: game.released,
            genres: game.genres,
            parent_platforms: game.parent_platforms,
            platform: game.platform,
            rating_top: game.rating_top,
            playtime: game.playtime
        };

        // Encode payload to Base64 to be URL-safe
        // we use existing window.btoa, but strictly we should handle utf8 properly if there are special chars
        // A simple way to handle utf8 is encodeURIComponent before btoa
        const jsonStr = JSON.stringify(payload);
        const encoded = btoa(encodeURIComponent(jsonStr));

        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('share', encoded);

        return url.toString();
    };

    /**
     * Shares the game using the Web Share API or falls back to clipboard
     * @param {Object} game - The game object to share
     */
    const shareGame = async (game) => {
        const url = generateShareUrl(game);
        const shareData = {
            title: `Check out ${game.name || game.title} on GameQuestLog!`,
            text: `I thought you might like this game: ${game.name || game.title}`,
            url: url
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    copyToClipboard(url);
                }
            }
        } else {
            // Fallback
            copyToClipboard(url);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showShareFeedback.value = true;
            setTimeout(() => {
                showShareFeedback.value = false;
            }, 3000);
        } catch (err) {
            console.error('Failed to copy to clipboard', err);
        }
    };

    /**
     * Checks the current URL for a share parameter and returns the decoded game object
     * @returns {Object|null} - The game object if found and valid, null otherwise
     */
    const checkShareUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const shareParam = params.get('share');

        if (shareParam) {
            try {
                // Decode: atob then decodeURIComponent
                const jsonStr = decodeURIComponent(atob(shareParam));
                const game = JSON.parse(jsonStr);

                // Clean the URL without reloading
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                return game;
            } catch (e) {
                console.error('Failed to parse share data', e);
                return null;
            }
        }
        return null;
    };

    return {
        shareGame,
        checkShareUrl,
        showShareFeedback
    };
}
