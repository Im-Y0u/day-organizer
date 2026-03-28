# Day Organizer - Deployment Guide

## Quick Deploy (No Auto-Sync)
1. Go to https://app.netlify.com/drop
2. Drag the `out` folder
3. Done! But sync won't auto-update between devices.

## Full Deploy with Auto-Sync

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "day-organizer")
3. Don't initialize with README

### Step 2: Push Code
```bash
# Extract day-organizer-deploy.zip
unzip day-organizer-deploy.zip -d day-organizer
cd day-organizer

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/day-organizer.git
git branch -M main
git push -u origin main
```

### Step 3: Connect to Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Build settings are auto-detected from netlify.toml
5. Click "Deploy site"

### Step 4: Enjoy Auto-Sync!
- Once deployed, sync will work with auto-updates every 30 seconds
- No more CORS issues!

## Features
- Task management with Schedule, Timeline, Matrix views
- Dark mode (always on)
- Cross-device sync with QR code or link
- Auto-sync every 30 seconds (requires Netlify deployment)
- Local storage persistence
- Undo/Redo support

## How to Sync
1. Click cloud icon → "Create Sync"
2. Scan QR or copy link to other device
3. Once connected, changes sync automatically!
