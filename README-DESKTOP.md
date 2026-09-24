KRC GROUP Windows App — Final User Workplace v5 — Corporate Dashboard

# KRC GROUP — Windows Desktop App v4

## Included
- KRC GROUP desktop login and admin control.
- User Workplace with permission-based modules.
- Modules open inside the KRC GROUP window using an embedded Electron webview.
- Admin module CRUD: Add, Edit, Delete, Open, Active/Disabled.
- Built-in icon selector; no image upload required.
- Dynamic module permissions stored in SQLite.
- Admin accounts automatically have access to every active module.
- Existing app data is stored in Electron userData, outside the installed app folder.
- Old KRC Master Portal is not modified by this project.

## Run
Use Command Prompt (CMD), not PowerShell if npm.ps1 execution policy blocks npm.

```bat
npm install
npm run app
```

If better-sqlite3 needs rebuilding for the installed Electron version:

```bat
npm rebuild better-sqlite3 --runtime=electron --target=38.8.6 --dist-url=https://electronjs.org/headers
```

Then:

```bat
npm run app
```

## Build installer

```bat
npm run dist
```

The Windows installer is generated under `dist`.


## v5 Dashboard updates
- Corporate admin dashboard layout with overview hero, KPI cards, quick module access and recent activity.
- Improved desktop spacing, hierarchy and responsive behavior.
- Existing module management, permissions and embedded module viewer remain intact.


Final user workplace: professional sidebar, user dashboard, My Modules navigation, assigned-module count, access level, and secure logout.
