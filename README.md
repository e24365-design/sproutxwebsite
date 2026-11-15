# 🌱 Sproutx – Let your plant grow

Website for farmers (Sinhala / Tamil / English) with NASA-based weather analysis and SMS alerts.
All farmer profiles, market data and advice in this demo are **sample data**.

```
sproutx/
├── index.html            the website (open this)
├── css/style.css         colours and layout
├── js/data.js            FAKE profiles, advice, market data, districts
├── js/i18n.js            all text in 3 languages
├── js/app.js             login, GPS, tabs, charts, NASA + weather
├── sms_alerts.py         Python SMS alert sender
├── subscribers.json      FAKE farmers who get SMS
├── requirements.txt      Python packages (just "requests")
└── .github/workflows/sms-alerts.yml   runs sms_alerts.py every morning on GitHub
```

---

## STEP 1 – Install 3 things (one time, ~15 min)
1. **VS Code** – https://code.visualstudio.com
2. **Git** – https://git-scm.com/downloads (press Next on everything)
3. **Python 3.10+** – https://www.python.org/downloads (**tick "Add Python to PATH"** on Windows)

Create a free account at https://github.com if you don't have one.

## STEP 2 – Open the project in VS Code
1. Unzip `sproutx.zip`.
2. VS Code → **File → Open Folder…** → choose the `sproutx` folder.
3. Install two extensions (left bar, square icon): **Python** (Microsoft) and **Live Server** (Ritwick Dey).

## STEP 3 – See the website
Right-click `index.html` → **Open with Live Server**. The site opens in your browser.
- Try **Log in** with `0771234567` (a demo farmer). The OTP code is shown on screen (demo mode).
- Click the 3 language buttons at the top right.
- Alerts tab → **Simulate a heat wave** button shows how alerts look.

## STEP 4 – Run the Python SMS script
In VS Code: **Terminal → New Terminal**, then:
```
pip install -r requirements.txt
python sms_alerts.py --demo
```
You will see Sinhala, Tamil and English SMS texts printed. Nothing is sent yet (safe dry run).
`python sms_alerts.py` (without `--demo`) uses the real forecast.

## STEP 5 – Get real SMS working (Twilio free trial)
1. Sign up at https://www.twilio.com (free trial). Get a trial phone number.
2. In Twilio **Verified Caller IDs**, add **your own phone** (trial accounts only text verified numbers).
3. In `subscribers.json`, set one farmer's `"phone"` to your number and `"sms_enabled": true`.
4. In the VS Code terminal (Windows PowerShell):
   ```
   $env:TWILIO_ACCOUNT_SID="ACxxxxxxxx"
   $env:TWILIO_AUTH_TOKEN="xxxxxxxx"
   $env:TWILIO_FROM="+1xxxxxxxxxx"
   python sms_alerts.py --demo --send
   ```
   (Mac/Linux: use `export NAME="value"` instead of `$env:NAME="value"`.)
5. Your phone receives the SMS. 🎉
Never paste these keys into a file you commit.

## STEP 6 – Put it on GitHub (inside VS Code)
1. Left bar → **Source Control** (branch icon) → **Initialize Repository**.
2. Type a message like `first version` → click **Commit** (choose "Yes" if it asks to stage changes).
3. Click **Publish Branch** → sign in to GitHub → choose **Public repository** → done.

Every later change: edit → Source Control → message → **Commit** → **Sync Changes**.

## STEP 7 – Make the website live (GitHub Pages)
On github.com open your repo → **Settings → Pages** → Source: **Deploy from a branch** →
Branch: **main**, folder **/ (root)** → Save. After ~1 minute your site is at
`https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## STEP 8 – Automatic daily SMS on GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Add:
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.
Then **Actions** tab → "Sproutx SMS alerts" → **Run workflow** to test. It also runs every day at 6:00 am Sri Lanka time.

> Tip for the demo: the scheduled run only sends when the real forecast triggers an alert. For a live demo, run
> `python sms_alerts.py --demo --send` on your laptop while presenting.

---

## What is real and what is fake
| Part | Status |
|---|---|
| Live weather (Open-Meteo) | **Real**, free |
| 90-day temperature, rain, soil wetness (NASA POWER) | **Real**, free. Shows sample data if the internet blocks it |
| Farmer profiles, market prices, listings, buyers | **Fake sample data** |
| Crop advice | Generic sample text; verify with the Dept. of Agriculture |
| Login OTP | **Demo**: code shown on screen. Real SMS OTP would need a server |
| AI chat | Rule-based demo + canned photo reply. Say "full version connects to an AI model" |
| SMS alerts | **Real** with Twilio (trial: verified numbers only) |

## Ideas to say in the presentation (roadmap)
- Real SMS provider in Sri Lanka (e.g. a local gateway) so any farmer can receive alerts.
- NASA SMAP soil moisture, SRTM elevation, and Landsat crop-health maps (NDVI).
- Real market prices from Sri Lankan sources (HARTI / Dept. of Agriculture).
- Real AI chat and leaf-photo analysis using an AI vision model.
- A real database and server-sent OTP login.
