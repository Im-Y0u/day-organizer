# Day Organizer - Deployment Instructions

## Option 1: Deploy via Netlify CLI (Recommended)

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Extract the zip file and deploy:
   ```bash
   unzip day-organizer-netlify.zip -d day-organizer
   cd day-organizer
   netlify deploy --prod
   ```

## Option 2: Deploy via GitHub

1. Create a new GitHub repository
2. Extract the zip file
3. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
4. Go to [app.netlify.com](https://app.netlify.com)
5. Click "Add new site" → "Import an existing project"
6. Connect your GitHub repository
7. Deploy!

## Option 3: Drag & Drop (No Auto-Sync)

If you just want to try it quickly without auto-sync:

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `out/` folder (not the zip)
3. Your app will be live instantly

**Note:** Auto-sync won't work with this method because it requires the serverless function.

## Features

- ✅ Task management with Schedule, Timeline, and Matrix views
- ✅ Dark mode always on
- ✅ Sync across devices via QR code or link
- ✅ Auto-sync every 30 seconds (requires Option 1 or 2)
- ✅ Local storage persistence
- ✅ Undo/Redo support

## How Sync Works

1. **Create Sync:** Click the cloud icon → "Create Sync"
2. **Share:** Show QR code or copy the link to another device
3. **Join:** Open the link on another device
4. **Auto-sync:** Once synced, devices update automatically every 30 seconds
