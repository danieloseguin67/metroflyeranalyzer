# MetroGrid

MetroGrid is an Angular single-page app for organizing grocery flyer deals in a searchable, sortable grid. It includes a saved Metro Plus Dollard flyer snapshot for postal code H8N 3G5, with English and French interface options.

## Requirements

- Node.js 22
- npm (included with Node.js)

## Run locally

```sh
npm ci
npm start
```

Open the local URL printed by Angular CLI (usually `http://localhost:4200`). To create a production build locally, run:

```sh
npm run build
```

The build output is written to `dist/metro-flyer-grid/browser`.

## Use the grid

- Search for items or categories, filter by category, and move through the paginated results.
- Add items to the grid or remove existing items. You can set the item, category, size, price, unit, regular price, and notes when adding.
- Switch the interface between English and French with the language control.
- Export the current list as a JSON file. Import a previous MetroGrid JSON export to replace the current list.
- Use **Refresh grid** to restore the included flyer snapshot and clear the current filters and edits.
- Open the linked Metro flyer to check the official listing and current availability.

Grid edits are held in the current browser session. Export a JSON copy if you want to keep changes for later.

The included flyer is a saved snapshot for October 15–21, 2026; refreshing the grid reloads that snapshot and does not fetch live flyer data.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the app when changes are pushed to `main`. You can also start it manually from the repository's **Actions** tab.

1. Push this repository to GitHub, using `main` as the deployment branch.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. Push a commit to `main` or run **Deploy to GitHub Pages** from the **Actions** tab.

The workflow builds with a base path derived from the repository name, then deploys the Angular browser output. This configuration is intended for a project Pages site (`<owner>.github.io/<repository>/`).
