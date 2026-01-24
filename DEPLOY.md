# Deploying to GitHub Pages

Follow these steps to host your Game Tracker online for free!

## 1. Prepare Configuration

In `vite.config.js`, you need to set the `base` property to match your GitHub repository name.

1.  Open `vite.config.js`.
2.  Find `base: '/GameQuestLog/',`
3.  Ensure this matches your future repository name. If you name your repo `my-game-list`, change this to `/my-game-list/`.

## 2. Create a GitHub Repository

1.  Go to [GitHub.com](https://github.com/new).
2.  Create a new repository (e.g., named `GameQuestLog`).
3.  Do **not** initialize with README/gitignore (you already have them).

## 3. Push Your Code

Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/GameQuestLog.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` and `GameQuestLog` with your actual details)*

## 4. Enable GitHub Pages

The project includes a GitHub Action that will automatically build and deploy your app.

1.  Go to your Repository Settings > **Pages**.
2.  Under **Build and deployment** > **Source**, keep it as "Deploy from a branch".
3.  **WAIT** for the Actions tab to finish the first run (it might fail if settings aren't ready, don't worry).
4.  Once the "Deploy" action runs successfully (after you push), it creates a `gh-pages` branch.
5.  Back in Settings > Pages:
    - Select Branch: `gh-pages`
    - Folder: `/ (root)`
    - Click **Save**.

## 5. Done!

Your app will be live at:
`https://YOUR_USERNAME.github.io/GameQuestLog/`
