# 🧠 Jattus AIO v2.0 ![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Webhooks](https://img.shields.io/badge/Discord-Webhook--Ready-red)

Jattus AIO is a multithreaded, headless-compatible auto-invite bot built for:
- 🟥 **MagicMadhouse**
- 🔶 **CollectorsEdge**

It supports:
- 🧩 Multi-account tasks
- 🌐 Proxy rotation
- 📬 Discord webhook alerts (with embeds)
- 📁 Real-time result exports
- 🏙️ Address generation via Google or OpenStreetMap

---

## 📦 Supported Modules

### 🟥 MagicMadhouse
- Reads: `emails.txt`, `proxy.txt`
- Submits invitation for each email
- Supports rotating proxies
- Sends Discord webhook per task
- Saves results to CSV

### 🔶 CollectorsEdge
- Reads: `tasks.csv` (with full address)
- Auto-generates tasks via postcode using Google Places API
- Handles embedded Shadow DOM forms
- Supports retries & logging
- Discord alert on success

---

## 🗂️ Folder Structure

```
jattus_aio_v2/
├── magicmadhouse_tasks_autoname.js
├── collectorsedge_tasks_autoname.js
├── jattus_main.js
├── emails.txt
├── proxy.txt
├── webhooks.txt
├── tasks.csv
├── settings.json
├── exports/
└── README.md
```

---

## 🛠 Setup

### 1. Install dependencies
```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth csv-parser
```

### 2. Add webhook
`webhooks.txt`
```
https://discord.com/api/webhooks/...
```

### 3. Provide your inputs
- For MagicMadhouse → `emails.txt`, `proxy.txt`
- For CollectorsEdge → `tasks.csv` or generate via postcode

### 4. Launch
```bash
node jattus_main.js
```

---

## 🧠 Features

- ✅ Headless & visible mode
- 🔁 Retry logic (CollectorsEdge)
- 🧪 Real-time validation
- 📊 CSV exports with results
- 📤 Beautiful Discord embeds
- 🔀 Proxy support
- 🌍 Google Places & OSM address generation

---

## ⚠️ Requirements

- Node.js v18+
- Valid Discord webhook
- Optional: Google Maps API key in `settings.json`

---

## 👨‍💻 Author

Built with ❤️ by [Aayush (MooonShot)](https://github.com/MooonShot)
