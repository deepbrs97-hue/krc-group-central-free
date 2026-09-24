# KRC GROUP Central Cloud / Windows App

This project provides the KRC GROUP desktop UI plus a central API backed by PostgreSQL.

## Architecture
`Windows PCs → Render Web Service → PostgreSQL`

User accounts and permissions are central, so an admin-created user can sign in from other PCs without the admin laptop remaining online.

## Local development
1. Set `DATABASE_URL` to a PostgreSQL database.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Windows client
Set the Render service URL in `cloud-config.js` before building the installer. The desktop app then runs as a local UI/proxy and sends its `/api` requests to the central service; it does not need a local database.

The UI clock explicitly uses `Asia/Kolkata` (IST), not the Windows computer's timezone.
