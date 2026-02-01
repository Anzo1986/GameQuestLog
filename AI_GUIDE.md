# 🧠 AI Development Guide: GameQuestLog

## 🏗️ Project Architecture

### Core Structure
This Vue 3 project uses a **Composable-based Architecture** to separate Logic from UI.

-   **Root**: `App.vue` handles the main layout (Header, Nav, Game Grid, FAB). It delegates complex logic to composables.
-   **Modals**: `TheModals.vue` is the **Single Source of Truth** for all popups.
    -   *Rule*: Never import individual modals in `App.vue`. Use `TheModals`.
    -   *State*: Managed by `useModals.js`.
-   **Data**: `useGames.js` is the central store for Game Data (CRUD, Status, Persistence).

### 📂 Key Composables
-   `useModals.js`: Controls `activeModal` & `modalProps`. Handles `history.pushState`.
-   `useGameFilters.js`: Handles Search, Sort, and Tab Filtering logic.
-   `useShop.js`: Manages Coins, Inventory (Themes, Frames), and Purchases.
-   `useSettings.js`: Persists user preferences (Sort order, Theme).
-   `useSwipe.js`: Handles touch gestures for mobile navigation.

## 🎨 Design System (The "Vibe")
-   **Framework**: Tailwind CSS.
-   **Aesthetics**: Dark Mode, Neon Accents, Glassmorphism (`backdrop-blur`).
-   **Icons**: Lucide-Vue-Next.
-   **Animations**: Custom keyframes (`animate-blob`, `animate-shine`).

## ⚠️ Golden Rules for AI
1.  **Keep App.vue Clean**: Don't add logic here if it fits in a Composable.
2.  **Modal Management**: To add a new popup, register it in `TheModals.vue` and trigger it via `openModal('name', props)`.
3.  **Persistence**: Always verify `localStorage` logic when adding new state.
4.  **Mobile First**: Always check `touch` interactions (FAB menu, Swipe).
