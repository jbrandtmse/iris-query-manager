# Story 1.1: Initialize Chrome Extension Project

Status: done

## Story

As a **developer**,
I want **to initialize the Chrome extension project with the proper tooling and structure**,
So that **I have a solid foundation for building the Query Manager features**.

## Acceptance Criteria

1. **Given** an empty project directory
   **When** I run `npx create-chrome-ext query-manager --template vanilla-ts`
   **Then** a new Chrome extension project is created with TypeScript and Vite configuration

2. **Given** the initialized project
   **When** I run `npm install`
   **Then** all dependencies install successfully with no errors

3. **Given** the project is installed
   **When** I run `npm run dev`
   **Then** the extension builds and is ready to load as an unpacked extension

4. **Given** the built extension
   **When** I load it in Chrome via chrome://extensions (developer mode)
   **Then** the extension appears in the browser toolbar with a default popup

## Tasks / Subtasks

- [x] **Task 1: Initialize project using create-chrome-ext** (AC: #1)
  - [x] Run `npx create-chrome-ext query-manager --template vanilla-ts` in an empty directory
  - [x] Verify the generated project structure matches expected output
  - [x] Confirm TypeScript and Vite configuration files are present

- [x] **Task 2: Install dependencies** (AC: #2)
  - [x] Run `npm install` in the project directory
  - [x] Verify all dependencies install without errors or warnings
  - [x] Check that `package-lock.json` is generated

- [x] **Task 3: Build and run development server** (AC: #3)
  - [x] Run `npm run dev` to start the Vite development server
  - [x] Verify the build completes successfully
  - [x] Confirm the `build/` folder is generated with extension files (note: `build/` not `dist/`)

- [x] **Task 4: Load and verify extension in Chrome** (AC: #4)
  - [x] Open Chrome and navigate to `chrome://extensions`
  - [x] Enable "Developer mode" toggle
  - [x] Click "Load unpacked" and select the `build/` folder
  - [x] Verify the extension appears in the toolbar
  - [x] Click the extension icon and confirm the default popup opens

- [x] **Task 5: Configure TypeScript strict mode** (AC: #1)
  - [x] Open `tsconfig.json` and verify `"strict": true` is set
  - [x] If not present, add strict mode configuration (already present)
  - [x] Verify no TypeScript errors after enabling strict mode

## Dev Notes

### Project Initialization Command

```bash
npx create-chrome-ext query-manager --template vanilla-ts
```

**What this creates:**
- TypeScript 5.x configuration with `tsconfig.json`
- Vite build configuration with `vite.config.ts`
- Manifest V3 extension structure
- HMR-enabled development workflow
- Basic popup, content script, and service worker scaffolding

### Expected Project Structure After Initialization

```
query-manager/
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── manifest.json
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── content/
│   │   └── content.ts
│   └── background/
│       └── service-worker.ts
└── dist/ (generated after build)
```

### TypeScript Configuration Requirements

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### Development Workflow

1. **Start dev server:** `npm run dev`
2. **Load extension:** Chrome → chrome://extensions → Load unpacked → select `dist/`
3. **HMR scope:** Popup UI changes are hot-reloaded; service worker and content script changes require extension reload

### Chrome Extension Loading Steps

1. Open Chrome browser
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" button
5. Select the `dist/` folder from the project
6. Extension icon appears in toolbar

### Project Structure Notes

- This story creates the foundation; future stories will modify the structure per architecture requirements
- The `shared/` directory (for services and types) will be added in Story 2.1
- Design tokens CSS will be added in Story 2.3

### References

- [Source: architecture.md#Starter Template Evaluation] - Rationale for create-chrome-ext selection
- [Source: architecture.md#Project Organization] - Target directory structure
- [Source: project-context.md#Technology Stack] - TypeScript 5.x, Vite, Vitest requirements
- [Source: project-context.md#Development Workflow Rules] - npm scripts and HMR scope

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- **Deviations from expected create-chrome-ext output:**
  - Generated structure differs from Dev Notes expectations (newer template version)
  - HTML files at project root instead of `src/` subdirectories
  - Source files named `index.ts` instead of `popup.ts`, `content.ts`, etc.
  - Output directory is `build/` not `dist/`
  - Content script folder named `contentScript/` not `content/`
- **Strict mode:** Already configured in generated tsconfig.json (`"strict": true`)
- **Versions installed:**
  - TypeScript: 5.2.2
  - Vite: 5.4.10
  - @crxjs/vite-plugin: 2.0.0-beta.26
  - @types/chrome: 0.0.246
- **Minor observation:** Default popup text has low visibility in Chrome light theme (cosmetic, will be addressed in UI stories)

### File List

**Created:**
- `.editorconfig` - Editor configuration
- `.gitignore` - Git ignore rules
- `.prettierignore` - Prettier ignore rules
- `.prettierrc` - Prettier configuration
- `devtools.html` - DevTools panel HTML
- `newtab.html` - New tab page HTML
- `options.html` - Options page HTML
- `package.json` - NPM package configuration
- `package-lock.json` - NPM lock file
- `popup.html` - Extension popup HTML
- `sidepanel.html` - Side panel HTML
- `tsconfig.json` - TypeScript configuration
- `tsconfig.node.json` - TypeScript node configuration
- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration (added in code review)
- `src/background/index.ts` - Service worker
- `src/contentScript/index.ts` - Content script
- `src/devtools/index.ts` - DevTools panel script
- `src/devtools/index.css` - DevTools styles
- `src/global.d.ts` - Global type declarations
- `src/manifest.ts` - Manifest V3 definition
- `src/newtab/index.ts` - New tab script
- `src/newtab/index.css` - New tab styles
- `src/options/index.ts` - Options page script
- `src/options/index.css` - Options styles
- `src/popup/index.ts` - Popup script
- `src/popup/index.css` - Popup styles
- `src/sidepanel/index.ts` - Side panel script
- `src/sidepanel/index.css` - Side panel styles
- `src/zip.js` - Build zip utility
- `src/shared/types/.gitkeep` - Shared types directory (added in code review)
- `src/shared/services/.gitkeep` - Shared services directory (added in code review)
- `src/shared/services/example.test.ts` - Example test to verify Vitest (added in code review)
- `src/shared/test-utils/.gitkeep` - Test utilities directory (added in code review)
- `public/icons/` - Extension icons directory
- `public/img/` - Extension images directory

**Modified (Code Review Fixes):**
- `package.json` - Added Vitest, test scripts
- `src/manifest.ts` - Replaced @ts-ignore with proper env function
- `src/popup/index.ts` - Added null check, updated repo link
- `src/options/index.ts` - Added null check, updated repo link
- `src/sidepanel/index.ts` - Added null check, updated repo link
- `src/devtools/index.ts` - Added null check, updated panel name, updated repo link
- `src/newtab/index.ts` - Removed unused span element, updated repo link
- `src/background/index.ts` - Added explicit return to message handler

**Removed:**
- `src/assets/logo.png` - Duplicate asset (already in public/img/)

## Change Log

- 2026-01-20: Story 1.1 implemented - Chrome extension project initialized with TypeScript, Vite, and Manifest V3
- 2026-01-20: Code review fixes applied - Added Vitest, shared directory structure, fixed @ts-ignore, null checks, message handler return, removed duplicate assets, updated boilerplate references
