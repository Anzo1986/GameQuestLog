# 🧠 AI Development Guide: GameQuestLog

## 🛠️ Tech Stack & Key Libraries
-   **Framework**: Vue 3 (Composition API, `<script setup>`)
-   **Build Tool**: Vite (Fast HMR)
-   **Styling**: Tailwind CSS (v3 with custom animations)
-   **Icons**: `lucide-vue-next` (Consistent SVG icons)
-   **PWA**: `vite-plugin-pwa` (Offline support, Service Worker caching)
-   **State Management**: Native Vue `ref`/`reactive` inside Composables (No Pinia/Vuex needed).
-   **Deployment**: GitHub Pages / Vercel compatible.

---

## 🏗️ Project Architecture & File Structure

### 📂 `src/composables/` (The Brain)
All business logic lives here. **Do not put complex logic in components.**
-   **`useGames.js`**: The main Facade. It wraps `useGameData`, `useSettings`, `useGamification` to provide a single import for components (`const { games, addGame } = useGames()`).
    -   *Data Note*: Distinguishes between `background_image` (landscape) and `cover_image` (portrait). UI should fallback to `background_image` if `cover_image` is unavailable.
-   **`useModals.js`**: Controls global modal state (`activeModal`). Integrates with browser history (back button closes modal).
-   **`useGameFilters.js`**: Handles Search, Sort, and Tab Filtering (Playing/Backlog/Completed).
-   **`useShop.js`**: Manages the Economy (Coins), Inventory (Frames, Backgrounds, Themes), and Purchases.
-   **`useSettings.js`**: Persists `apiKey`, `theme`, `avatar`, and `viewMode` (`grid`, `cover`, `list`, `compact`) to `localStorage`.
-   **`useSwipe.js`**: Handles touch gestures (swipe left/right) for mobile navigation.

### 📂 `src/components/` (The UI)
-   **`TheModals.vue`**: **CRITICAL**. This is the single entry point for all popup windows.
    -   *How to use*: To add a new modal, import it here and add a `<MyNewModal v-if="activeModal === 'myModal'" />` block.
    -   *Trigger*: Call `openModal('myModal')` from anywhere.
-   **`GameDetailModal.vue`**: The main game view. Contains logic for "Edit Mode" and "Status Updates".
    -   *Note*: Uses `GameCardInnerEffects.vue` for Holo/Prism visual effects.
-   **`ShopModal.vue`**: The store UI. Uses real-time previews for Backgrounds and Frames.
-   **`BackgroundAurora.vue`**: The complex animated background. *Do not inline this code in App.vue*.

### 📱 `src/App.vue` (The Skeleton)
-   Contains the **Global Layout**:
    -   `<BackgroundAurora />` (Conditional)
    -   `Header` (User Level, XP)
    -   `SmartBar` (Search/Sort)
    -   `GameList` (Grid of Cards)
    -   `TheModals` (Overlay)
    -   `FAB Menu` (Bottom Right Floating Action Button - Mobile optimized with `@touchstart.stop`).
-   *Rule*: Keep this file clean. Logic goes to Composables.

---

## 🎨 design System (The "Vibe")
-   **Aesthetics**: "Cyber-Glass" / Neon.
    -   Dark backgrounds (`bg-gray-900`, `bg-black/90`).
    -   Vibrant accents (`text-primary`, `border-blue-500`).
    -   Glassmorphism: `backdrop-blur-md`, `bg-white/10`.
-   **Card Effects**:
    -   **Holo**: Rainbow gradients + opacity shifts.
    -   **Prism**: Rotating borders.
    -   **Glitch**: CSS clip-path animations.
    -   *Implementation*: See `useCardStyles.js` and `GameCardInnerEffects.vue`.

---

## ⚠️ "Golden Rules" for AI Developers
1.  **Don't Break Mobile**:
    -   Always consider small screens.
    -   The FAB Menu must have `@touchstart.stop` to avoid conflict with `useSwipe`.
2.  **Modal Management**:
    -   **Never** import a modal directly into `App.vue` (except `TheModals`).
    -   Always use `useModals` to control visibility.
3.  **Persistence**:
    -   State is saved to `localStorage` via `watch` effects in Composables.
    -   When adding new state, ensure it's added to the `exportData`/`importData` logic in `useGames.js`.
4.  **Performance**:
    -   Use `computed` properties for filtering lists.
    -   Use `loading="lazy"` on images.

---

## 🚀 Deployment Checklist
-   **Git**: Ensure all changes are committed (especially `isMenuOpen` fixes).
-   **Service Worker**: Update `CACHE_NAME` in `sw.js` if shipping major updates to force client refresh.
