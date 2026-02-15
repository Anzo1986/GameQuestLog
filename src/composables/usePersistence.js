import { useSettings } from './useSettings';

export function usePersistence() {
    const settings = useSettings();

    const exportData = () => {
        const backup = {
            version: 2,
            timestamp: new Date().toISOString(),
            games: JSON.parse(localStorage.getItem('game-tracker-games') || '[]'),
            user: JSON.parse(localStorage.getItem('game-tracker-user') || '{}'),
            achievements: JSON.parse(localStorage.getItem('game-tracker-achievements') || '{}'),
            achievementStats: JSON.parse(localStorage.getItem('game-tracker-achievements_stats') || '{}'),
            shop: JSON.parse(localStorage.getItem('game-tracker-shop-v2') || '{}'),
            dailyLogin: JSON.parse(localStorage.getItem('game-tracker-daily-login') || '{}'),
            settings: {
                theme: localStorage.getItem('game-tracker-theme'),
                apiKey: localStorage.getItem('game-tracker-api-key'),
                questUsage: localStorage.getItem('game-tracker-quest-usage'),
                // New Keys
                language: localStorage.getItem('game-tracker-language'),
                vibe: localStorage.getItem('game-tracker-vibe'),
                aiProvider: localStorage.getItem('game-tracker-ai-provider'),
                geminiKey: localStorage.getItem('game-tracker-gemini-key'),
                groqKey: localStorage.getItem('game-tracker-groq-key'),
                tavilyKey: localStorage.getItem('game-tracker-tavily-key'),
                hiddenGems: localStorage.getItem('game-tracker-hidden-gems')
            }
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `game-quest-log-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Update Last Backup Time
        settings.updateLastBackup();
    };

    const importData = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Handle Legacy Format (Array of games only)
                    if (Array.isArray(data)) {
                        if (confirm('Legacy format detected (Games only). Import games?')) {
                            localStorage.setItem('game-tracker-games', JSON.stringify(data));
                            window.location.reload();
                            resolve(true);
                        }
                        return;
                    }

                    // Handle New Format
                    if (data.version || data.games || data.user) {
                        if (data.games) localStorage.setItem('game-tracker-games', JSON.stringify(data.games));
                        if (data.user) localStorage.setItem('game-tracker-user', JSON.stringify(data.user));
                        if (data.achievements) localStorage.setItem('game-tracker-achievements', JSON.stringify(data.achievements));
                        if (data.achievementStats) localStorage.setItem('game-tracker-achievements_stats', JSON.stringify(data.achievementStats));
                        if (data.shop) localStorage.setItem('game-tracker-shop-v2', JSON.stringify(data.shop));
                        if (data.dailyLogin) localStorage.setItem('game-tracker-daily-login', JSON.stringify(data.dailyLogin));

                        if (data.settings) {
                            if (data.settings.theme) localStorage.setItem('game-tracker-theme', data.settings.theme);
                            if (data.settings.apiKey) localStorage.setItem('game-tracker-api-key', data.settings.apiKey);
                            if (data.settings.questUsage) localStorage.setItem('game-tracker-quest-usage', data.settings.questUsage);

                            // Import New Keys
                            if (data.settings.language) localStorage.setItem('game-tracker-language', data.settings.language);
                            if (data.settings.vibe) localStorage.setItem('game-tracker-vibe', data.settings.vibe);
                            if (data.settings.aiProvider) localStorage.setItem('game-tracker-ai-provider', data.settings.aiProvider);
                            if (data.settings.geminiKey) localStorage.setItem('game-tracker-gemini-key', data.settings.geminiKey);
                            if (data.settings.groqKey) localStorage.setItem('game-tracker-groq-key', data.settings.groqKey);
                            if (data.settings.tavilyKey) localStorage.setItem('game-tracker-tavily-key', data.settings.tavilyKey);
                            if (data.settings.hiddenGems) localStorage.setItem('game-tracker-hidden-gems', data.settings.hiddenGems);
                        }

                        window.location.reload(); // Refresh to load changes
                        resolve(true);
                    } else {
                        reject(new Error('Unknown file format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    return {
        exportData,
        importData
    };
}
