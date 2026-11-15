#!/usr/bin/env python3
"""
Sproutx SMS alert sender.

What it does
  1. Reads the (FAKE) farmer profiles in subscribers.json
  2. Gets a 7-day forecast for each farmer's GPS point (Open-Meteo, free, no key)
  3. Applies simple rules: heat, heavy rain, dry spell
  4. Writes the alert in the farmer's language (Sinhala / Tamil / English)
  5. Sends it by SMS with Twilio, but ONLY when you pass --send

Usage
  python sms_alerts.py                 # dry run: prints the SMS, sends nothing
  python sms_alerts.py --demo          # dry run with a fake heat wave + heavy rain
  python sms_alerts.py --demo --send   # really send (needs Twilio keys, see README)
"""
import argparse
import json
import os
import sys
from pathlib import Path

import requests

HEAT_C = 35      # alert if any day's max temperature is at or above this
RAIN_MM = 50     # alert if any single day has at least this much rain
DRY_MM = 5       # alert if the whole week has less rain than this

MESSAGES = {
    "heat": {
        "en": "Sproutx: Heat warning for {place}. Up to {v}°C expected. Water early morning or evening and mulch the soil.",
        "si": "Sproutx: {place} සඳහා අධික උෂ්ණත්ව අනතුරු ඇඟවීමකි. {v}°C දක්වා අපේක්ෂිතයි. උදේ හෝ සවස ජලය දී පස mulch කරන්න.",
        "ta": "Sproutx: {place} - அதிக வெப்ப எச்சரிக்கை. {v}°C வரை எதிர்பார்க்கப்படுகிறது. காலை அல்லது மாலை நீர் பாய்ச்சி மண்ணை மூடாக்கு செய்யவும்.",
    },
    "rain": {
        "en": "Sproutx: Heavy rain warning for {place}. About {v} mm in one day. Clear drains and delay fertilizer.",
        "si": "Sproutx: {place} සඳහා අධික වර්ෂා අනතුරු ඇඟවීමකි. එක් දිනක මි.මී. {v} ක් පමණ. කාණු පිරිසිදු කර පොහොර කල් දමන්න.",
        "ta": "Sproutx: {place} - கனமழை எச்சரிக்கை. ஒரே நாளில் சுமார் {v} மிமீ. வடிகால்களைச் சுத்தம் செய்து உரமிடுவதைத் தள்ளிப்போடவும்.",
    },
    "dry": {
        "en": "Sproutx: Dry spell for {place}. Only {v} mm of rain in 7 days. Plan your irrigation.",
        "si": "Sproutx: {place} හි වියළි කාලගුණයකි. දින 7 තුළ වර්ෂාව මි.මී. {v} ක් පමණි. වාරිමාර්ග සැලසුම් කරන්න.",
        "ta": "Sproutx: {place} - வறட்சி நிலை. 7 நாட்களில் {v} மிமீ மழை மட்டுமே. நீர்ப்பாசனத்தைத் திட்டமிடவும்.",
    },
}


def fetch_forecast(lat, lon):
    """7-day forecast from Open-Meteo. Returns (tmax_list, rain_list)."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,precipitation_sum",
        "forecast_days": 7,
        "timezone": "auto",
    }
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    d = r.json()["daily"]
    return d["temperature_2m_max"], d["precipitation_sum"]


def demo_forecast():
    """Fake forecast so you always have something to show in the demo."""
    return [33, 36, 37, 35, 34, 33, 32], [0, 0, 62, 20, 0, 0, 0]


def check_rules(tmax, rain):
    """Return a list of (alert_type, value)."""
    found = []
    hottest = max(t for t in tmax if t is not None)
    wettest = max(r for r in rain if r is not None)
    total = sum(r for r in rain if r is not None)
    if hottest >= HEAT_C:
        found.append(("heat", round(hottest)))
    if wettest >= RAIN_MM:
        found.append(("rain", round(wettest)))
    if total < DRY_MM:
        found.append(("dry", round(total)))
    return found


def to_e164(phone):
    """Sri Lankan 07XXXXXXXX -> +947XXXXXXXX"""
    d = "".join(c for c in phone if c.isdigit())
    if d.startswith("0"):
        d = "94" + d[1:]
    return "+" + d


def send_sms(to, body):
    user = os.environ.get("SMSGATE_USERNAME")
    pw = os.environ.get("SMSGATE_PASSWORD")
    if not (user and pw):
        raise RuntimeError("Missing SMSGATE_USERNAME / SMSGATE_PASSWORD")
    r = requests.post(
        "https://api.sms-gate.app/3rdparty/v1/messages",
        auth=(user, pw),
        json={"textMessage": {"text": body}, "phoneNumbers": [to]},
        timeout=20,
    )
    if not r.ok:
        raise RuntimeError(f"{r.status_code}: {r.text}")
    return r.json().get("id", "queued")


def main():
    # Make Sinhala / Tamil print correctly on Windows terminals
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    ap = argparse.ArgumentParser(description="Sproutx SMS alerts")
    ap.add_argument("--send", action="store_true", help="really send SMS (default: dry run)")
    ap.add_argument("--demo", action="store_true", help="use a fake heat wave + heavy rain forecast")
    args = ap.parse_args()

    here = Path(__file__).parent
    farmers = json.loads((here / "subscribers.json").read_text(encoding="utf-8"))

    sent = skipped = 0
    for f in farmers:
        try:
            tmax, rain = demo_forecast() if args.demo else fetch_forecast(f["lat"], f["lon"])
        except Exception as e:  # network problem: keep going with the next farmer
            print(f"[!] {f['name']}: could not get forecast ({e})")
            continue

        alerts = check_rules(tmax, rain)
        if not alerts:
            print(f"[ok] {f['name']}: no alerts")
            continue

        lang = f.get("lang", "en")
        place = f["place"].get(lang, f["place"]["en"])
        for kind, value in alerts:
            body = MESSAGES[kind][lang].format(place=place, v=value)
            to = to_e164(f["phone"])
            print(f"\n--- {f['name']} ({to}, {lang}) ---\n{body}")
            if args.send and f.get("sms_enabled"):
                try:
                    print("    sent, Twilio id:", send_sms(to, body))
                    sent += 1
                except Exception as e:
                    print("    FAILED:", e)
            else:
                skipped += 1
                why = "dry run" if not args.send else "sms_enabled is false for this farmer"
                print(f"    (not sent: {why})")

    print(f"\nDone. sent={sent}, not sent={skipped}")


if __name__ == "__main__":
    main()
