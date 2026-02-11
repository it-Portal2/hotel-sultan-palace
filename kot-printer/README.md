# KOT Printer Listener

Local service for the Sultan Palace Hotel kitchen PC that automatically prints Kitchen Order Tickets (KOT) when new orders are placed through the web app.

## Quick Setup (5 Minutes)

### Step 1: Install Node.js

Download and install **Node.js 18+** from [nodejs.org](https://nodejs.org/en/download/)

Open **Command Prompt** and verify:

```
node --version
```

### Step 2: Copy Files to the Hotel PC

Copy the entire `kot-printer/` folder to the hotel PC. Recommended location:

```
C:\kot-printer\
```

### Step 3: Install Dependencies

Open **Command Prompt** in the `kot-printer` folder:

```
cd C:\kot-printer
npm install
```

### Step 4: Configure Environment

```
copy .env.example .env
```

Edit `.env` with Notepad:

| Variable                        | Description                     | Example                    |
| ------------------------------- | ------------------------------- | -------------------------- |
| `NODE_ENV`                      | `development` or `production`   | `production`               |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON    | `./serviceAccountKey.json` |
| `PRINTER_TYPE`                  | `epson` or `star`               | `epson`                    |
| `PRINTER_INTERFACE`             | USB or network path             | `tcp://192.168.1.100:9100` |
| `PRINTER_WIDTH`                 | Characters per line (58mm = 32) | `32`                       |

> **CRITICAL:** Set `NODE_ENV=production` on the hotel PC. This enables actual printing.
> In development (`NODE_ENV=development`), orders are logged but NOT printed — saving paper during testing.

### Step 5: Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in the `kot-printer` folder

### Step 6: Test It

```
npm start
```

You should see:

```
╔══════════════════════════════════════╗
║   KOT PRINTER LISTENER — v1.0.0     ║
║   Sultan Palace Hotel               ║
╚══════════════════════════════════════╝

  Printer Type: epson
  Printer Interface: tcp://192.168.1.100:9100
  Paper Width: 32 chars
  Environment: production
  ✓ Printer connected and ready

  ● System is live — waiting for orders...
```

---

## Auto-Start on Boot (Windows)

This ensures the printer listener starts automatically whenever the PC is turned on — no manual action needed.

### Option A: Windows Startup Folder (Simplest)

1. Press `Win + R`, type `shell:startup`, press Enter
2. The Startup folder opens
3. **Right-click** in the folder → **New → Shortcut**
4. For the location, enter:
   ```
   C:\kot-printer\start.bat
   ```
5. Name it `KOT Printer`
6. Click Finish

Now `start.bat` runs every time the PC boots. It also auto-restarts if the process crashes.

### Option B: Windows Task Scheduler (More Reliable)

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click **Create Task** (not Basic Task)
3. **General tab:**
   - Name: `KOT Printer Listener`
   - Check: `Run whether user is logged on or not`
   - Check: `Run with highest privileges`
4. **Triggers tab:**
   - New → Begin the task: `At startup`
   - Delay task for: `30 seconds` (lets network connect first)
5. **Actions tab:**
   - New → Action: `Start a program`
   - Program: `C:\kot-printer\start.bat`
   - Start in: `C:\kot-printer`
6. **Settings tab:**
   - Check: `If the task fails, restart every: 1 minute`
   - Attempt to restart up to: `999 times`
   - Check: `Allow task to be run on demand`
7. Click OK

### Option C: PM2 (Most Professional — Recommended)

PM2 is a Node.js process manager. It handles auto-restart, logging, and startup.

**Install PM2 globally:**

```
npm install -g pm2
npm install -g pm2-windows-startup
```

**Start the listener with PM2:**

```
cd C:\kot-printer
pm2 start index.js --name kot-printer --env production
```

**Set up auto-start on boot:**

```
pm2-startup install
pm2 save
```

**Useful PM2 commands:**

```
pm2 status          # Check if running
pm2 logs kot-printer # View live logs
pm2 restart kot-printer # Restart
pm2 stop kot-printer    # Stop
```

> **Why PM2?** Auto-restarts on crash (with exponential backoff), saves logs to files, shows memory/CPU usage, and survives reboots. This is the industry-standard way to run Node.js services.

---

## How It Works

1. **Listens** for Firestore docs where `kotPrinted == false`
2. **Prints** the receipt on the thermal printer (production only)
3. **Updates** `kotPrinted: true` to prevent duplicate prints
4. Also watches for `reprintRequested == true` (staff clicks "Print" in admin)

## Environment Modes

| Mode        | `NODE_ENV`    | Printing    | Use                    |
| ----------- | ------------- | ----------- | ---------------------- |
| Development | `development` | ❌ Disabled | Testing on your laptop |
| Production  | `production`  | ✅ Enabled  | Hotel kitchen PC       |

## Troubleshooting

| Issue                          | Solution                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| Printer not detected           | Check USB cable / network IP. Run `npm start` to see status                                   |
| Orders not printing            | Check `NODE_ENV=production` in `.env`                                                         |
| Double printing                | The system uses Firestore transactions — this shouldn't happen. Check for multiple instances  |
| `serviceAccountKey.json` error | Ensure the file exists and has valid Firebase Admin SDK credentials                           |
| Network drops                  | The listener auto-reconnects to Firestore. If printer is network, ensure it's on the same LAN |
