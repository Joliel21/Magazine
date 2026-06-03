# BTA Magazine

Clean GitHub-ready magazine reader for Breathtaking Awareness.

## What this repo does

- Opens with a realistic closed magazine cover.
- Lets readers open into a page/spread magazine experience.
- Supports table of contents, thumbnails, page jump, keyboard navigation, swipe navigation, optional music, tilt controls, and single-page/two-page viewing.
- Uses `viewer.json` and `publish_manifest.json` for content updates so normal issue updates do not require app-code changes.
- Uses publication-date issue folders, such as `issues/2026-05-26/`.
- Is ready for GitHub Pages.

## Quick start in GitHub

1. Upload **all files and folders** from this ZIP into your repository root.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push/commit to the `main` branch.
5. GitHub will build and publish the reader.

## Issue naming rule

Use this format for issue folders:

```text
issues/YYYY-MM-DD/
```

Example:

```text
issues/2026-05-26/
```

The URL will be:

```text
https://joliel21.github.io/BTA-Magazine/?issue=2026-05-26
```

## Updating content later

For a new issue:

1. Copy the folder `issues/2026-05-26/`.
2. Rename the copy using the publication date, for example `issues/2026-06-15/`.
3. Edit only:
   - `issues/YYYY-MM-DD/viewer.json`
   - `issues/YYYY-MM-DD/publish_manifest.json`
4. Add page image URLs in `viewer.json`.
5. Update the table of contents in `viewer.json`.
6. Update display/publication settings in `publish_manifest.json`.

No app-code changes are required for normal content updates.

## Important files

```text
.github/workflows/deploy.yml       GitHub Pages build/deploy workflow
issues/2026-05-26/viewer.json      Issue pages, cover, table of contents
issues/2026-05-26/publish_manifest.json  Branding, background, feature toggles
src/App.tsx                        Reader app
src/styles.css                     Reader styling
```

## URL options

Default issue:

```text
/?issue=2026-05-26
```

If no issue is specified, the reader opens `2026-05-26` by default. Change `DEFAULT_ISSUE_ID` in `src/App.tsx` only when you want a different default issue.
