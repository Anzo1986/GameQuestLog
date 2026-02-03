import { ref } from 'vue';

const CLIENT_ID_KEY = 'game-tracker-google-client-id';
// Folder name in App Data. Actually App Data is a special folder 'appDataFolder'
const FILENAME = 'gametracker_backup.json';

const isInitialized = ref(false);
const isAuthenticated = ref(false);
const isSyncing = ref(false);
const tokenClient = ref(null);
const accessToken = ref(null);

export function useGoogleDrive() {

    const loadScripts = () => {
        return new Promise((resolve, reject) => {
            if (window.google && window.gapi) {
                resolve();
                return;
            }

            const script1 = document.createElement('script');
            script1.src = 'https://accounts.google.com/gsi/client';
            script1.async = true;
            script1.defer = true;
            document.body.appendChild(script1);

            const script2 = document.createElement('script');
            script2.src = 'https://apis.google.com/js/api.js';
            script2.async = true;
            script2.defer = true;
            script2.onload = () => resolve();
            script2.onerror = (e) => reject(e);
            document.body.appendChild(script2);
        });
    };

    const initClient = async (clientId) => {
        if (!clientId) return false;

        try {
            await loadScripts();

            // 1. Init Token Client (Identity Services)
            tokenClient.value = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.appdata',
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        accessToken.value = tokenResponse.access_token;
                        isAuthenticated.value = true;
                    }
                },
            });

            // 2. Init GAPI (Drive API)
            await new Promise((resolve) => {
                gapi.load('client', resolve);
            });

            // We don't strictly need gapi.client.init with API Key if we use access token manually
            // But it helps for discovery.
            await gapi.client.init({
                // apiKey: '...', // We don't want to expose API Key if possible, and we strictly use OAuth
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });

            isInitialized.value = true;
            return true;
        } catch (e) {
            console.error('Google Drive Init Error:', e);
            return false;
        }
    };

    const login = () => {
        if (!tokenClient.value) return;
        // Request Access Token
        tokenClient.value.requestAccessToken();
    };

    // Helper: Find File
    const findFile = async () => {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name = '${FILENAME}' and 'appDataFolder' in parents and trashed = false`,
                spaces: 'appDataFolder',
                fields: 'files(id, name, modifiedTime)'
            });
            const files = response.result.files;
            if (files && files.length > 0) {
                return files[0];
            }
            return null;
        } catch (e) {
            console.error('Search Error', e);
            // If token expired?
            return null;
        }
    };

    const uploadData = async (jsonData) => {
        if (!accessToken.value) {
            login(); // Try login, but this is async handling...
            return { success: false, error: 'Not logged in' };
        }

        isSyncing.value = true;
        try {
            const file = await findFile();
            const fileContent = JSON.stringify(jsonData);
            const metadata = {
                name: FILENAME,
                mimeType: 'application/json',
                parents: !file ? ['appDataFolder'] : [] // Only set parent on create
            };

            const multipartRequestBody =
                `\r\n--foo_bar_baz\r\n` +
                `Content-Type: application/json\r\n\r\n` +
                JSON.stringify(metadata) +
                `\r\n--foo_bar_baz\r\n` +
                `Content-Type: application/json\r\n\r\n` +
                fileContent +
                `\r\n--foo_bar_baz--`;

            const method = file ? 'PATCH' : 'POST';
            const path = file ? `/upload/drive/v3/files/${file.id}` : '/upload/drive/v3/files';

            const response = await fetch(`https://www.googleapis.com${path}?uploadType=multipart`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`,
                    'Content-Type': 'multipart/related; boundary=foo_bar_baz'
                },
                body: multipartRequestBody
            });

            if (!response.ok) throw new Error(await response.text());

            isSyncing.value = false;
            return { success: true };

        } catch (e) {
            console.error('Upload Error', e);
            isSyncing.value = false;
            return { success: false, error: e.message };
        }
    };

    const downloadData = async () => {
        if (!accessToken.value) return { success: false, error: 'Not logged in' };

        isSyncing.value = true;
        try {
            const file = await findFile();
            if (!file) {
                isSyncing.value = false;
                return { success: false, error: 'No backup found' };
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            isSyncing.value = false;
            return { success: true, data: data, modifiedTime: file.modifiedTime };

        } catch (e) {
            console.error('Download Error', e);
            isSyncing.value = false;
            return { success: false, error: e.message };
        }
    };

    return {
        isInitialized,
        isAuthenticated,
        isSyncing,
        initClient,
        login,
        uploadData,
        downloadData
    };
}
