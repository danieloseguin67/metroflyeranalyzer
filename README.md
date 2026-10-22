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
- Select a saved flyer date range, then use **Refresh grid** to restore that snapshot and clear the current filters and edits.
- Open the linked Metro flyer to check the official listing and current availability.
- The grid shows a Moi member price separately from the flyer price when the official flyer marks one. If no separate member price is listed, the Moi price matches the flyer price. Moi prices are only populated when verified in the flyer.

Grid edits are held in the current browser session. Export a JSON copy if you want to keep changes for later.

Dinner portion presets are configured in [`src/app/dinner-portion-sizes.json`](src/app/dinner-portion-sizes.json). Values are grams per person (raw weight) for `small`, `medium`, and `large`. Edit and commit this file to change the presets; the GitHub Pages workflow includes the updated values in its next build.

The date selector always offers the current and next Thursday–Wednesday periods. Saved snapshots currently cover October 15–21 and October 22–28, 2026. Refresh loads the selected period's matching saved flyer data; for a week without a snapshot, it opens the Metro store flyer page in a new tab and leaves the grid unchanged. This static GitHub Pages app does not fetch live flyer data. Additional weekly snapshots can be added to the `flyerSnapshots` list in `src/app/app.component.ts`.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the app when changes are pushed to `main`. You can also start it manually from the repository's **Actions** tab.

1. Push this repository to GitHub, using `main` as the deployment branch.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. Push a commit to `main` or run **Deploy to GitHub Pages** from the **Actions** tab.

The workflow builds with a base path derived from the repository name, then deploys the Angular browser output. This configuration is intended for a project Pages site (`<owner>.github.io/<repository>/`).
