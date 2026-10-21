# Focus Gate

A browser extension that cuts down social media time and keeps the time you do spend there intentional, mostly for work.

Whenever you open a tracked site (Instagram, TikTok, YouTube, X, Facebook, Reddit, LinkedIn and others), Focus Gate stops you on a pause screen first and asks why you're there:

- **For work.** Type what you're going to do ("Reply to client DMs", "Post today's reel") and pick 10, 25 or 45 minutes. When the time is up, every tracked tab goes back to the gate.
- **Just browsing.** Uses a small daily allowance (20 minutes by default). When it's gone, it's gone until midnight. During work hours this option is turned off.
- **Never mind.** Closes the tab and counts how many times you skipped it today.

There's a few-second "take a breath" pause before you can continue, so opening an app on autopilot gets interrupted.

The toolbar popup shows the current session's countdown (with a button to end it early), today's personal and work time, a 7-day chart, and a log of what you said each work session was for.

## Install (Chrome, Edge, Brave, Arc)

1. Download this repository (green **Code** button → **Download ZIP**) and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the `focus-gate` folder.
5. Pin Focus Gate to the toolbar, then click it → **Settings** to adjust sites, your daily allowance and work hours.

## Settings

| Setting | Default |
| --- | --- |
| Tracked sites | instagram.com, facebook.com, tiktok.com, x.com, twitter.com, youtube.com, reddit.com, linkedin.com, threads.net, pinterest.com, snapchat.com |
| Daily personal allowance | 20 minutes |
| Pause before continuing | 5 seconds |
| Work hours | Mon–Fri, 09:00–17:00 |
| Only work sessions during work hours | On |

## How time is counted

Time is counted only while a tracked site is the active tab in the focused browser window and you aren't idle (no input for 5 minutes or a locked screen). Work and personal time are tallied separately. Everything is stored locally in the browser (`chrome.storage.local`, last 30 days). Nothing is sent anywhere.

## Limits

This works in desktop browsers only. It can't block the Instagram or TikTok phone apps; that needs a native iOS/Android app using Apple's Screen Time API or Android's usage-access permission. Because it's an extension you install yourself, you can also switch it off in `chrome://extensions`. The friction is the point, not a lock.
