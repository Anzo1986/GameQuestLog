import { ref } from 'vue';

export function useGemini() {
    const showCopyFeedback = ref(false);

    const handleWebCheck = async (games) => {
        const targetGames = games.filter(g => g.status === 'playing' || g.status === 'backlog');

        let prompt = "";
        if (targetGames.length === 0) {
            prompt = "Please find updates for my games.";
        } else {
            const gameTitles = targetGames.map(g => g.title).join(', ');
            prompt = `Find the most recent major update, patch, or content release for the following games: ${gameTitles}. Provide the version number, status, and a short summary for each.`;
        }

        try {
            await navigator.clipboard.writeText(prompt);
            showCopyFeedback.value = true;
            setTimeout(() => showCopyFeedback.value = false, 3000);
            window.open('https://gemini.google.com/app', '_blank');
        } catch (err) {
            console.error('Failed to copy: ', err);
            window.open('https://gemini.google.com/app', '_blank');
        }
    };

    return {
        showCopyFeedback,
        handleWebCheck
    };
}
