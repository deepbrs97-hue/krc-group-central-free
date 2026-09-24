# KRC GROUP Windows App v2

## Main changes
- External modules open inside the KRC GROUP desktop window using Electron webview.
- Admin can Add, Edit, Disable/Enable, Open and Delete modules.
- Module Name + URL required; Category optional; built-in icon selector optional; default icon used if none selected.
- Module changes persist in SQLite and are not overwritten on app startup.
- User permissions remain database-driven.
- Admin role automatically sees all active modules.
- Existing KRC Master Portal is not modified by this project.

## Run
```bat
npm install
npm run app
```

## Build installer
```bat
npm run dist
```
