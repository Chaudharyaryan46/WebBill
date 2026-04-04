# DineFlow — Restaurant Management System (Deployment Guide)

This guide explains how to deploy the DineFlow system to the cloud for free using **Render.com**.

## Prerequisites
1. A **GitHub** account.
2. The project code pushed to a GitHub repository.

## Deployment Steps (Render)

### 1. Create a Web Service
- Log in to [Render Dashboard](https://dashboard.render.com).
- Click **New +** > **Web Service**.
- Connect your GitHub repository.

### 2. Configuration Settings
- **Region**: Select the one closest to you.
- **Runtime**: `Node`.
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free`.

### 3. IMPORTANT: Setup Persistent Database (Disk)
Since the system uses a local SQLite-style database (`restaurant.db`), you must add a "Disk" to Render so your data (orders, menu, staff) isn't wiped every time the server restarts.

1.  In your Web Service settings, go to the **Disk** tab.
2.  Click **Add Disk**.
3.  **Name**: `restaurant-db-disk`
4.  **Mount Path**: `/opt/render/project/src/db_disk`
5.  **Size**: `1 GB` (minimum).

### 4. Environmental Variable Update
In your Web Service **Environment** tab, add:
- `PORT` = `3000` (Render detects this automatically, but good to have).
- `DB_CUSTOM_PATH` = `/opt/render/project/src/db_disk/restaurant.db` (Optional, if we modify the code to support it).

---

## Alternative: Local LIVE testing (Temporary)
If you just want to test on your phone right now without a full deployment:
1. Run server: `node server.js`
2. Run tunnel: `npx localtunnel --port 3000`
3. Share the link provided!
