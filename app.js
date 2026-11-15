// Sproutx front-end. No frameworks, no build step: just open index.html with Live Server.
(function () {
  "use strict";
  const D = window.DATA, I = window.I18N;
  const $ = (s) => document.querySelector(s);

  /* ---------- small helpers ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("sproutx_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("sproutx_" + k, JSON.stringify(v)); } catch (e) { /* storage blocked: ignore */ } }
  };
  let lang = store.get("lang", "en");
  let session = store.get("session", null);       // phone number of the logged-in user
  let tab = "home";
  let pending = null;                               // { mode, user, otp } while waiting for OTP
  let gps = null;                                   // { lat, lon } from the GPS button
  let gpsDist = null;                               // district id that the GPS point belongs to
  let profDraft = null;                             // farm-profile form kept while the language is switched
  const draft = {};                                 // sign-up form values kept while the language is switched
  let simulate = false;                             // demo switch on the Alerts tab
  let chat = [];
  const cache = {};

  const t = (k, vars) => {
    let s = (I[k] && (I[k][lang] || I[k].en)) || k;
    if (vars) for (const v in vars) s = s.replace("{" + v + "}", vars[v]);
    return s;
  };
  const L = (o) => (o && (o[lang] || o.en)) || "";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (msg) => { const el = $("#toast"); el.textContent = msg; el.hidden = false; setTimeout(() => (el.hidden = true), 2600); };
  const distName = (id) => { const d = D.districts.find((x) => x.id === id); return d ? L(d.name) : ""; };
  const placeText = (u) => [u.place, distName(u.district)].filter(Boolean).join(", ");   // "Galgamuwa, Kurunegala"

  /* names are compared without spaces, case or punctuation */
  const normName = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, "");
  const kmBetween = (la1, lo1, la2, lo2) => Math.hypot((la1 - la2) * 111, (lo1 - lo2) * 111 * Math.cos(((la1 + la2) / 2) * Math.PI / 180));
  const inSriLanka = (lat, lon) => lat > 5.8 && lat < 9.95 && lon > 79.4 && lon < 82;

  /* ---------- crops: the farmer can pick a known crop OR type any crop name ---------- */
  // known crop => { crop: "rice", cropName: "" }      typed crop => { crop: "", cropName: "Green gram" }
  const cropLabel = (o) => (o.crop && D.advice[o.crop]) ? D.advice[o.crop].icon + " " + L(D.advice[o.crop].name) : "🌱 " + (o.cropName || "-");
  function matchCrop(text) {            // "Rice", "වී", "நெல்" or "rice" -> "rice"; unknown text -> ""
    const s = normName(text); if (!s) return "";
    return Object.keys(D.advice).find((k) => normName(k) === s || ["en", "si", "ta"].some((g) => normName(D.advice[k].name[g]) === s)) || "";
  }

  /* ---------- places: match a district name returned by a map service ---------- */
  const DISTRICT_ALIASES = { moneragala: "monaragala", mullativu: "mullaitivu", killinochchi: "kilinochchi" };
  function matchDistrict(raw) {
    let s = normName(raw); if (!s) return null;
    Object.keys(DISTRICT_ALIASES).forEach((a) => { s = s.replace(a, DISTRICT_ALIASES[a]); });
    // longest name wins, so "Kegalle District" does not match "Galle"
    const hits = D.districts.map((d) => ({ d, n: Math.max(0, ...["en", "si", "ta"].map((g) => normName(d.name[g])).filter((n) => s.includes(n)).map((n) => n.length)) })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    return hits.length ? hits[0].d : null;
  }

  function normPhone(s) {
    let d = String(s || "").replace(/\D/g, "");
    if (d.startsWith("94") && d.length === 11) d = "0" + d.slice(2);
    if (d.length === 9) d = "0" + d;
    return d;
  }

  /* ---------- users (demo: stored in this browser only) ---------- */
  function allUsers() {
    const u = {};
    D.profiles.forEach((p) => (u[p.phone] = p));
    return Object.assign(u, store.get("users", {}));
  }
  function saveUser(u) { const users = store.get("users", {}); users[u.phone] = u; store.set("users", users); }
  const me = () => allUsers()[session];

  function nearestDistrict(lat, lon) {
    let best = D.districts[0], bd = Infinity;
    D.districts.forEach((d) => { const x = (d.lat - lat) ** 2 + (d.lon - lon) ** 2; if (x < bd) { bd = x; best = d; } });
    return best;
  }

  /* ---------- language ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll(".langs button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
    if (session && me()) { renderNav(); renderTab(); } else renderAuth(authMode);
  }
  document.querySelectorAll(".langs button").forEach((b) => b.addEventListener("click", () => { saveDrafts(); lang = b.dataset.lang; store.set("lang", lang); applyLang(); }));

  // Switching language re-draws the page. Keep whatever the farmer already typed.
  const SIGNUP_FIELDS = ["f_name", "f_phone", "f_dist", "f_place", "f_crop", "f_crop_other", "f_rot"];
  function saveDrafts() {
    if ($("#f_name")) SIGNUP_FIELDS.forEach((id) => { if ($("#" + id)) draft[id] = $("#" + id).value; });
    if (tab === "profile" && $("#p_save")) profDraft = readProfile();
  }

  /* ---------- AUTH: phone number + OTP (demo) + GPS ---------- */
  let authMode = "signup";
  function cropOptions(sel) { return Object.keys(D.advice).map((k) => `<option value="${k}" ${k === sel ? "selected" : ""}>${D.advice[k].icon} ${esc(L(D.advice[k].name))}</option>`).join(""); }
  // all 25 districts, sorted A-Z in the farmer's own language
  function districtOptions(sel) {
    const list = D.districts.slice().sort((a, b) => L(a.name).localeCompare(L(b.name), lang));
    return `<option value="">${esc(t("pickDistrict"))}</option>` + list.map((d) => `<option value="${d.id}" ${d.id === sel ? "selected" : ""}>${esc(L(d.name))}</option>`).join("");
  }

  /* crop picker = dropdown of known crops + "Other" which shows a box to TYPE any crop */
  function cropPicker(id, key, name) {
    const custom = !key && !!name;
    return `<select id="${id}">${cropOptions(key)}<option value="__other" ${custom ? "selected" : ""}>✏️ ${esc(t("cropOther"))}</option></select>
      <input id="${id}_other" placeholder="${esc(t("cropTypePh"))}" value="${esc(custom ? name : "")}" style="margin-top:.4rem" ${custom ? "" : "hidden"}>`;
  }
  function syncCropPicker(id) { $("#" + id + "_other").hidden = $("#" + id).value !== "__other"; }
  function wireCropPicker(id) { $("#" + id).onchange = () => { syncCropPicker(id); if (!$("#" + id + "_other").hidden) $("#" + id + "_other").focus(); }; }
  function readCropPicker(id) {
    if ($("#" + id).value !== "__other") return { crop: $("#" + id).value, cropName: "" };
    const txt = $("#" + id + "_other").value.trim(), k = matchCrop(txt);     // typed "Rice" still counts as the known crop
    return k ? { crop: k, cropName: "" } : { crop: "", cropName: txt };
  }

  function renderAuth(mode) {
    authMode = mode || "signup";
    const box = $("#authBox");
    const seg = `<div class="seg"><button data-m="signup" class="${authMode === "signup" ? "on" : ""}">${t("signup")}</button><button data-m="login" class="${authMode === "login" ? "on" : ""}">${t("login")}</button></div>`;
    if (pending) { renderOtp(box, seg); return; }
    if (authMode === "signup") {
      box.innerHTML = seg + `
        <label>👤 ${t("fullName")}</label><input id="f_name" autocomplete="name">
        <label>📱 ${t("phone")}</label><input id="f_phone" inputmode="tel" placeholder="07X XXX XXXX">
        <label>📍 ${t("district")}</label>
        <select id="f_dist">${districtOptions()}</select>
        <label>🏡 ${t("place")}</label>
        <input id="f_place" autocomplete="street-address" placeholder="${esc(t("placePh"))}">
        <div class="row" style="margin-top:.5rem"><button class="btn ghost" id="gpsBtn" type="button">${t("useGps")}</button></div>
        <div class="hint" id="gpsMsg" aria-live="polite"></div>
        <label>🌾 ${t("mainCrop")}</label>${cropPicker("f_crop")}
        <label>🔄 ${t("rotation")}</label><input id="f_rot" placeholder="${esc(t("rotationPh"))}">
        <label>🌐 ${t("language")}</label>
        <select id="f_lang"><option value="si">සිංහල</option><option value="ta">தமிழ்</option><option value="en">English</option></select>
        <button class="btn block" id="goOtp">${t("sendOtp")}</button>
        <div class="err" id="authErr"></div>`;
      Object.keys(draft).forEach((id) => { const el = $("#" + id); if (el) el.value = draft[id]; });   // put back what was typed
      $("#f_lang").value = lang;
      syncCropPicker("f_crop"); wireCropPicker("f_crop");
      if (gps) setGpsMsg("✔ " + t("gpsOk"));
      $("#gpsBtn").onclick = getGps;
      // choosing another district by hand means the GPS point no longer applies
      $("#f_dist").onchange = () => { if (gps && $("#f_dist").value !== gpsDist) { gps = null; setGpsMsg(""); } };
      $("#goOtp").onclick = startSignup;
    } else {
      box.innerHTML = seg + `
        <label>📱 ${t("phone")}</label><input id="f_phone" inputmode="tel" placeholder="07X XXX XXXX">
        <button class="btn block" id="goOtp">${t("sendOtp")}</button>
        <div class="err" id="authErr"></div>
        <p class="hint">${t("demoHint")}</p>`;
      $("#goOtp").onclick = startLogin;
    }
    box.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => renderAuth(b.dataset.m)));
  }

  /* ---------- GPS + address lookup ---------- */
  function setGpsMsg(text, bad) { const m = $("#gpsMsg"); if (m) { m.textContent = text || ""; m.classList.toggle("bad", !!bad); } }

  // GPS coordinates -> village / town name + district (OpenStreetMap Nominatim, free). Throws if the service is unreachable.
  async function reverseGeocode(lat, lon) {
    const j = await getJSON(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=${lang},en&lat=${lat}&lon=${lon}`, 8000);
    const a = j.address || {};
    return { place: a.village || a.hamlet || a.suburb || a.town || a.city || a.neighbourhood || a.locality || "", district: matchDistrict(a.state_district || a.county || "") };
  }

  // typed village / town -> coordinates (Open-Meteo geocoding, free). Only accepted if it is near the chosen district.
  async function geocodePlace(q, d) {
    try {
      const j = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json&countryCode=LK`, 6000);
      let best = null, bd = Infinity;
      (j.results || []).forEach((r) => { const km = kmBetween(r.latitude, r.longitude, d.lat, d.lon); if (km < bd) { bd = km; best = r; } });
      return best && bd <= 70 ? { lat: +best.latitude.toFixed(4), lon: +best.longitude.toFixed(4) } : null;
    } catch (e) { return null; }       // not found or offline: the district centre is used
  }

  function getGps() {
    const btn = $("#gpsBtn");
    if (!window.isSecureContext) { setGpsMsg(t("gpsInsecure"), true); return; }      // browsers block GPS on plain http pages
    if (!navigator.geolocation) { setGpsMsg(t("gpsFail"), true); return; }
    setGpsMsg(t("loading")); btn.disabled = true;

    const fail = (e) => {
      btn.disabled = false;
      setGpsMsg(t(e && e.code === 1 ? "gpsDenied" : e && e.code === 3 ? "gpsTimeout" : "gpsUnavail"), true);
    };
    const ok = (p) => {
      btn.disabled = false;
      const lat = +p.coords.latitude.toFixed(4), lon = +p.coords.longitude.toFixed(4);
      if (!inSriLanka(lat, lon)) { gps = null; setGpsMsg(t("gpsOutside"), true); return; }
      gps = { lat, lon }; gpsDist = nearestDistrict(lat, lon).id;
      $("#f_dist").value = gpsDist; setGpsMsg("✔ " + t("gpsOk"));
      reverseGeocode(lat, lon).then((r) => {                 // fill in the village / town (and the exact district) when the map service answers
        if (!gps || !$("#f_dist")) return;                   // the farmer changed things meanwhile
        if (r.district) { gpsDist = r.district.id; $("#f_dist").value = gpsDist; }
        if (r.place && !$("#f_place").value.trim()) $("#f_place").value = r.place;
      }).catch(() => { /* offline: the farmer can type the place */ });
    };
    // 1st try: fast position from Wi-Fi / mobile network (a saved position up to 2 minutes old is fine).
    // 2nd try (only if the 1st one timed out or found nothing): ask the real GPS chip, which is slower but accurate.
    navigator.geolocation.getCurrentPosition(ok, (e) => {
      if (e.code === 1) { fail(e); return; }                  // permission denied: a retry would not help
      setGpsMsg(t("gpsRetry"));
      navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 });
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 });
  }

  const newOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  async function startSignup() {
    const err = $("#authErr");
    const name = $("#f_name").value.trim(), phone = normPhone($("#f_phone").value), distId = $("#f_dist").value, place = $("#f_place").value.trim();
    const cp = readCropPicker("f_crop"), rotation = $("#f_rot").value.trim();
    if (!name || phone.length !== 10 || (!distId && !gps)) { err.textContent = t("badInput"); return; }
    if (!cp.crop && !cp.cropName) { err.textContent = t("needCrop"); return; }
    err.textContent = "";
    const d = D.districts.find((x) => x.id === (distId || nearestDistrict(gps.lat, gps.lon).id));
    let lat = d.lat, lon = d.lon;
    if (gps) { lat = gps.lat; lon = gps.lon; }
    else if (place) {                                         // typed place: look up its own coordinates so the weather is for the village, not just the district
      const btn = $("#goOtp"); btn.disabled = true; btn.textContent = t("loading");
      const g = await geocodePlace(place, d);
      if (g) { lat = g.lat; lon = g.lon; }
    }
    const user = { phone, name, district: d.id, place, lat, lon, usedGps: !!gps, crop: cp.crop, cropName: cp.cropName, rotation,
      lang: $("#f_lang").value, farmSize: "-", water: { en: "-", si: "-", ta: "-" }, history: [], profileDone: false };
    pending = { mode: "signup", user, otp: newOtp() };
    renderAuth(authMode);
  }

  function startLogin() {
    const phone = normPhone($("#f_phone").value);
    if (phone.length !== 10) { $("#authErr").textContent = t("badPhone"); return; }
    const user = allUsers()[phone];
    if (!user) { $("#authErr").textContent = t("noUser"); return; }
    pending = { mode: "login", user, otp: newOtp() };
    renderAuth(authMode);
  }

  function renderOtp(box, seg) {
    box.innerHTML = seg + `
      <label>🔐 ${t("enterOtp")}</label><input id="f_otp" inputmode="numeric" maxlength="6" autofocus>
      <div class="otpbox">${t("demoOtp")} <b>${pending.otp}</b></div>
      <button class="btn block" id="goVerify">${t("verify")}</button>
      <div class="err" id="authErr"></div>`;
    $("#goVerify").onclick = () => {
      if ($("#f_otp").value.trim() !== pending.otp) { $("#authErr").textContent = t("wrongOtp"); return; }
      const u = pending.user;
      if (pending.mode === "signup") {
        saveUser(u);
        tab = "profile";                                      // new farmers go straight to the farm-profile form
        gps = null; gpsDist = null; Object.keys(draft).forEach((k) => delete draft[k]);
      }
      session = u.phone; store.set("session", session); pending = null;
      lang = u.lang || lang; store.set("lang", lang);
      showApp();
    };
    box.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => { pending = null; renderAuth(b.dataset.m); }));
  }

  /* ---------- APP SHELL ---------- */
  const TABS = [["home", "🏠"], ["account", "👤"], ["alerts", "🔔"], ["advice", "🌱"], ["market", "🛒"], ["chat", "🤖"]];
  function showApp() {
    $("#landing").hidden = true; $("#app").hidden = false; window.scrollTo(0, 0);
    applyLang();
  }
  function renderNav() {
    $("#nav").innerHTML = TABS.map(([k, ic]) => `<button data-t="${k}" class="${k === tab ? "on" : ""}">${ic} ${t("tab_" + k)}</button>`).join("");
    $("#nav").querySelectorAll("button").forEach((b) => (b.onclick = () => go(b.dataset.t)));
  }
  function go(k) { tab = k; if (k !== "profile") profDraft = null; renderNav(); renderTab(); window.scrollTo(0, 0); }
  function renderTab() {
    const u = me(); if (!u) return;
    ({ home: viewHome, account: viewAccount, alerts: viewAlerts, advice: viewAdvice, market: viewMarket, chat: viewChat, profile: viewProfile })[tab](u);
  }
  function logout() { session = null; store.set("session", null); pending = null; tab = "home"; profDraft = null; $("#app").hidden = true; $("#landing").hidden = false; applyLang(); }

  /* ---------- DATA: Open-Meteo (live) + NASA POWER (history), with sample fallback ---------- */
  async function getJSON(url, ms) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms || 9000);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(timer); }
  }

  async function getWeather(u) {
    const key = "wx" + u.lat + u.lon; if (cache[key]) return cache[key];
    let out;
    try {
      const j = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${u.lat}&longitude=${u.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,precipitation_sum&forecast_days=7&timezone=auto`);
      out = { live: true, cur: { temp: j.current.temperature_2m, hum: j.current.relative_humidity_2m, rain: j.current.precipitation, wind: j.current.wind_speed_10m },
        tmax: j.daily.temperature_2m_max, rain: j.daily.precipitation_sum };
    } catch (e) {
      out = { live: false, cur: { temp: 29.4, hum: 78, rain: 0, wind: 11 }, tmax: [31, 32, 31, 33, 32, 31, 30], rain: [2, 0, 8, 12, 0, 1, 5] };
    }
    cache[key] = out; return out;
  }

  const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  async function getNasa(u) {
    const key = "nasa" + u.lat + u.lon; if (cache[key]) return cache[key];
    const end = new Date(Date.now() - 4 * 864e5), start = new Date(end.getTime() - 89 * 864e5);
    let out;
    try {
      const j = await getJSON(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,GWETROOT&community=AG&longitude=${u.lon}&latitude=${u.lat}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`, 15000);
      const P = j.properties.parameter, days = Object.keys(P.T2M);
      const clean = (o) => days.map((d) => (o[d] === -999 ? null : o[d]));
      out = { live: true, days, temp: clean(P.T2M), rain: clean(P.PRECTOTCORR), soil: clean(P.GWETROOT) };
    } catch (e) {
      const days = [], temp = [], rain = [], soil = [];
      for (let i = 0; i < 90; i++) {
        const d = new Date(start.getTime() + i * 864e5); days.push(ymd(d));
        temp.push(+(28 + 2.5 * Math.sin(i / 9) + ((i * 7) % 5) * 0.2).toFixed(1));
        const r = Math.max(0, 12 * Math.sin(i / 6 + 1) + ((i * 13) % 7) - 3); rain.push(+r.toFixed(1));
        soil.push(+(0.55 + 0.2 * Math.sin(i / 10)).toFixed(2));
      }
      out = { live: false, days, temp, rain, soil };
    }
    cache[key] = out; return out;
  }

  /* simple dependency-free SVG chart */
  function svgChart(vals, days, o) {
    const W = 600, H = 210, p = { l: 38, r: 8, t: 10, b: 24 };
    const nums = vals.filter((v) => v != null);
    if (!nums.length) return "";
    let min = Math.min(...nums), max = Math.max(...nums);
    if (o.bar) min = 0; if (o.min != null) min = o.min; if (o.max != null) max = o.max; if (min === max) max = min + 1;
    const iw = W - p.l - p.r, ih = H - p.t - p.b, n = vals.length;
    const X = (i) => p.l + iw * (i / (n - 1)), Y = (y) => p.t + ih * (1 - (y - min) / (max - min));
    let body = "";
    if (o.bar) { const bw = (iw / n) * 0.8; vals.forEach((y, i) => { if (y == null) return; body += `<rect x="${(X(i) - bw / 2).toFixed(1)}" y="${Y(y).toFixed(1)}" width="${bw.toFixed(1)}" height="${(p.t + ih - Y(y)).toFixed(1)}" fill="${o.color}"/>`; }); }
    else { let d = "", on = false; vals.forEach((y, i) => { if (y == null) { on = false; return; } d += (on ? "L" : "M") + X(i).toFixed(1) + " " + Y(y).toFixed(1); on = true; }); body = `<path d="${d}" fill="none" stroke="${o.color}" stroke-width="2.5" stroke-linejoin="round"/>`; }
    let grid = "";
    [min, (min + max) / 2, max].forEach((g) => { grid += `<line x1="${p.l}" x2="${W - p.r}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" stroke="#dbe7da"/><text x="${p.l - 5}" y="${(Y(g) + 4).toFixed(1)}" text-anchor="end">${(+g.toFixed(1))}</text>`; });
    const fmt = (d) => d.slice(6, 8) + "/" + d.slice(4, 6);
    grid += `<text x="${p.l}" y="${H - 6}">${fmt(days[0])}</text><text x="${W - p.r}" y="${H - 6}" text-anchor="end">${fmt(days[n - 1])}</text>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${body}</svg>`;
  }

  const avg = (a) => { const n = a.filter((x) => x != null); return n.length ? n.reduce((s, x) => s + x, 0) / n.length : 0; };
  const sum = (a) => a.filter((x) => x != null).reduce((s, x) => s + x, 0);

  function observeReveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- HOME ---------- */
  async function viewHome(u) {
    const v = $("#view");
    v.innerHTML = `<h2>${t("hello")}, ${esc(u.name)} 👋</h2><p class="src">📍 ${esc(placeText(u))}${u.usedGps ? " (GPS)" : ""}</p><div class="card">${t("loading")}</div>`;
    const [wx, nasa] = await Promise.all([getWeather(u), getNasa(u)]);
    if (tab !== "home") return;
    const soilAvg = avg(nasa.soil.slice(-7)), soilKey = soilAvg < 0.35 ? "soil_dry" : soilAvg > 0.75 ? "soil_wet" : "soil_ok";
    v.innerHTML = `
      <h2>${t("hello")}, ${esc(u.name)} 👋</h2>
      <p class="src">📍 ${esc(placeText(u))}${u.usedGps ? " (GPS)" : ""} · ${u.lat}, ${u.lon}</p>
      <div class="stack">
        ${u.profileDone ? "" : `<div class="insight">📝 ${t("profileNudge")} <button class="btn ghost" data-go="profile" style="margin-left:.4rem">${t("fillProfile")}</button></div>`}
        <div class="card">
          <h3>⛅ ${t("liveWeather")}</h3>
          <div class="grid">
            <div class="stat"><div class="big">${wx.cur.temp}°C</div><div class="lbl">🌡️ ${t("temp")}</div></div>
            <div class="stat"><div class="big">${wx.cur.hum}%</div><div class="lbl">💧 ${t("humidity")}</div></div>
            <div class="stat"><div class="big">${wx.cur.rain} mm</div><div class="lbl">🌧️ ${t("rain")}</div></div>
            <div class="stat"><div class="big">${wx.cur.wind} km/h</div><div class="lbl">🍃 ${t("wind")}</div></div>
          </div>
          <p class="src ${wx.live ? "" : "bad"}">${wx.live ? "Open-Meteo (live)" : t("srcWxSample")}</p>
        </div>
        <h3>🛰️ ${t("nasaTitle")}</h3>
        <div class="insight reveal">${t("insight", { t: avg(nasa.temp).toFixed(1), r: sum(nasa.rain).toFixed(0), s: t(soilKey) })}</div>
        <div class="card reveal"><h3>🌡️ ${t("chartTemp")}</h3>${svgChart(nasa.temp, nasa.days, { color: "#ef6c00" })}</div>
        <div class="card reveal"><h3>🌧️ ${t("chartRain")}</h3>${svgChart(nasa.rain, nasa.days, { color: "#1976d2", bar: true })}</div>
        <div class="card reveal"><h3>🌱 ${t("chartSoil")}</h3>${svgChart(nasa.soil, nasa.days, { color: "#6d4c41", min: 0, max: 1 })}
          <p class="src ${nasa.live ? "" : "bad"}">${nasa.live ? t("srcNasa") : t("srcSample")}</p></div>
      </div>`;
    document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    observeReveal();
  }

  /* ---------- ALERTS (same rules as sms_alerts.py) ---------- */
  const RULES = { heat: 35, rain: 50, dry: 5 };
  function computeAlerts(wx) {
    const out = [], tmax = Math.max(...wx.tmax), rmax = Math.max(...wx.rain), rsum = sum(wx.rain);
    if (tmax >= RULES.heat) out.push({ icon: "🔥", k: "heat", v: Math.round(tmax) });
    if (rmax >= RULES.rain) out.push({ icon: "⛈️", k: "rain", v: Math.round(rmax) });
    if (rsum < RULES.dry) out.push({ icon: "🏜️", k: "dry", v: Math.round(rsum) });
    return out;
  }
  async function viewAlerts(u) {
    const v = $("#view"); v.innerHTML = `<div class="card">${t("loading")}</div>`;
    let wx = await getWeather(u); if (tab !== "alerts") return;
    if (simulate) wx = { live: false, tmax: [33, 36, 37, 35, 34, 33, 32], rain: [0, 0, 62, 20, 0, 0, 0] };
    const list = computeAlerts(wx);
    v.innerHTML = `
      <h2>🔔 ${t("alertsTitle")}</h2>
      <p class="src">📱 ${t("smsOn")} ${esc(u.phone)}</p>
      <div class="stack">
        ${list.length ? list.map((a) => `<div class="card alert"><h3>${a.icon} ${t("a_" + a.k + "_t")}</h3><div>${t("a_" + a.k + "_b", { v: a.v })}</div></div>`).join("") : `<div class="card">${t("noAlerts")}</div>`}
        <button class="btn ghost" id="simBtn">${simulate ? t("simulateOff") : t("simulate")}</button>
        <h3>${t("earlier")}</h3>
        ${D.alertsSample.map((a) => `<div class="card alert old"><h3>${a.icon} ${esc(L(a.title))}</h3><div class="src">${esc(L(a.when))}</div><div>${esc(L(a.body))}</div></div>`).join("")}
      </div>`;
    $("#simBtn").onclick = () => { simulate = !simulate; viewAlerts(u); };
  }

  /* ---------- ADVICE ---------- */
  let adviceCrop = null;
  function viewAdvice(u) {
    const dist = D.districts.find((d) => d.id === u.district) || nearestDistrict(u.lat, u.lon);
    const known = !!(u.crop && D.advice[u.crop]);               // a crop the farmer typed has no sample advice
    const c = adviceCrop || (known ? u.crop : dist.crops[0]), a = D.advice[c];
    const chips = Object.keys(D.advice).map((k) => `<button class="chip ${k === c ? "on" : ""}" data-c="${k}">${D.advice[k].icon} ${esc(L(D.advice[k].name))}</button>`).join("");
    $("#view").innerHTML = `
      <h2>🌱 ${t("adviceTitle")}</h2>
      <p class="src">${t("suggested")}: ${dist.crops.map((k) => D.advice[k].icon + " " + esc(L(D.advice[k].name))).join(", ")} (${esc(L(dist.name))})</p>
      ${!adviceCrop && !known && u.cropName ? `<p class="src bad">${t("noAdviceCrop", { c: esc(u.cropName) })}</p>` : ""}
      <div class="chips">${chips}</div>
      <div class="card stack">
        <h3>${a.icon} ${esc(L(a.name))}</h3>
        <div>📅 <b>${t("sow")}</b><br>${esc(L(a.sow))}</div>
        <div>🧪 <b>${t("fert")}</b><br>${esc(L(a.fert))}</div>
        <div>💧 <b>${t("water")}</b><br>${esc(L(a.water))}</div>
        <div>💰 <b>${t("price")}</b><br>Rs ${a.price} / kg</div>
        <p class="src bad">${t("sampleNote")}</p>
      </div>`;
    document.querySelectorAll(".chip").forEach((b) => (b.onclick = () => { adviceCrop = b.dataset.c; viewAdvice(u); }));
  }

  /* ---------- ACCOUNT ---------- */
  const optText = (list, id) => { const o = list.find((x) => x.id === id); return o ? L(o.name) : ""; };
  // "Urea, TSP, my own mix" in language g (default: the current language)
  const listText = (list, ids, other, g) => (ids || []).map((id) => { const o = list.find((x) => x.id === id); return o ? (o.name[g || lang] || o.name.en) : ""; }).concat(other ? [other] : []).filter(Boolean).join(", ");
  function farmSizeText(u) {
    const p = u.profile;
    if (p && p.size) return p.size + " " + (optText(D.options.unit, p.unit) || "");
    return u.farmSize || "-";                           // sample farmers have a ready-made text like "2.5 acres"
  }

  function viewAccount(u) {
    const p = u.profile;
    const row = (k, v) => (v ? `<dt>${t(k)}</dt><dd>${esc(v)}</dd>` : "");
    $("#view").innerHTML = `
      <h2>👤 ${t("accountTitle")}</h2>
      <div class="stack">
        <div class="card"><dl class="kv">
          <dt>${t("fullName")}</dt><dd>${esc(u.name)}</dd>
          <dt>${t("phone")}</dt><dd>${esc(u.phone)}</dd>
          <dt>${t("location")}</dt><dd>${esc(placeText(u))}${u.usedGps ? " · " + t("gpsLoc") : ""}</dd>
          <dt>${t("mainCrop")}</dt><dd>${esc(cropLabel(u))}</dd>
          ${row("rotationShort", u.rotation)}
          <dt>${t("farmSize")}</dt><dd>${esc(farmSizeText(u))}</dd>
          <dt>${t("waterSource")}</dt><dd>${esc(L(u.water) || "-")}</dd></dl>
          <div class="row" style="margin-top:.8rem"><button class="btn ghost" data-go="advice">${t("goAdvice")}</button><button class="btn ghost" data-go="alerts">${t("goAlerts")}</button></div>
        </div>
        <div class="card"><h3>🧑‍🌾 ${t("profileTitle")}</h3>
          ${p ? `<dl class="kv">
            ${row("experience", p.years ? p.years + " " + t("yrs") : "")}
            ${row("ownership", optText(D.options.ownership, p.own))}
            ${row("soil", optText(D.options.soil, p.soil))}
            ${row("fertUsed", [listText(D.options.fert, p.fert, p.fertOther), p.fertNote].filter(Boolean).join(" · "))}
            ${row("chemShort", p.chem)}
            ${row("difficulties", listText(D.options.diff, p.diff, p.diffOther))}
            ${row("sellShort", optText(D.options.sell, p.sell))}
            ${row("notesShort", p.notes)}</dl>` : `<p class="src">${t("profileNudge")}</p>`}
          <button class="btn ghost" style="margin-top:.8rem" data-go="profile">${p ? t("editProfile") : t("fillProfile")}</button>
        </div>
        <div class="card"><h3>📖 ${t("cropHistory")}</h3>
          ${u.history && u.history.length ? `<table><tr><th>${t("year")}</th><th>${t("crop")}</th><th>${t("season")}</th><th>${t("yield")}</th></tr>${u.history.map((h) => `<tr><td>${h.year}</td><td>${esc(cropLabel(h))}</td><td>${esc(optText(D.options.season, h.season) || "-")}</td><td>${esc(h.yield)}</td></tr>`).join("")}</table>` : "<p class='src'>-</p>"}
        </div>
        <div class="card"><h3>✅ ${t("practices")}</h3>${D.bestPractices.map((p) => `<p>${p.icon} ${esc(L(p.text))}</p>`).join("")}</div>
        <div class="card"><h3>⚙️ ${t("settings")}</h3>
          <label>${t("fullName")}</label><input id="s_name" value="${esc(u.name)}">
          <label>${t("mainCrop")}</label>${cropPicker("s_crop", u.crop, u.cropName)}
          <label>${t("rotation")}</label><input id="s_rot" value="${esc(u.rotation || "")}" placeholder="${esc(t("rotationPh"))}">
          <label>${t("language")}</label><select id="s_lang"><option value="si">සිංහල</option><option value="ta">தமிழ்</option><option value="en">English</option></select>
          <button class="btn block" id="s_save">${t("save")}</button>
        </div>
        <button class="btn ghost" id="outBtn">${t("logout")}</button>
      </div>`;
    $("#s_lang").value = u.lang || lang;
    wireCropPicker("s_crop");
    document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    $("#s_save").onclick = () => {
      const cp = readCropPicker("s_crop");
      if (!cp.crop && !cp.cropName) { toast(t("needCrop")); return; }
      const nu = Object.assign({}, u, { name: $("#s_name").value.trim() || u.name, crop: cp.crop, cropName: cp.cropName, rotation: $("#s_rot").value.trim(), lang: $("#s_lang").value });
      saveUser(nu); lang = nu.lang; store.set("lang", lang); adviceCrop = null; toast(t("saved")); applyLang();
    };
    $("#outBtn").onclick = logout;
  }

  /* ---------- FARM PROFILE: opens right after sign-up, can be edited later from My account ---------- */
  const chk = (name, list, on) => list.map((o) => `<label class="chk"><input type="checkbox" name="${name}" value="${o.id}" ${(on || []).includes(o.id) ? "checked" : ""}> ${esc(L(o.name))}</label>`).join("");
  const opts = (list, sel, placeholderKey) => (placeholderKey === false ? "" : `<option value="">${esc(t(placeholderKey || "choose"))}</option>`) + list.map((o) => `<option value="${o.id}" ${o.id === sel ? "selected" : ""}>${esc(L(o.name))}</option>`).join("");
  const ticked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
  const lyRow = (r) => `<div class="lyrow row">
      <select class="ly_s" aria-label="${esc(t("season"))}">${opts(D.options.season, r.season, "season")}</select>
      <input class="ly_c" list="cropList" placeholder="${esc(t("cropTypePh"))}" value="${esc(r.crop || "")}">
      <input class="ly_y" placeholder="${esc(t("yieldPh"))}" value="${esc(r.yield || "")}">
      <button type="button" class="btn ghost rm" aria-label="remove">✕</button></div>`;

  function readProfile() {
    const v = (id) => ($("#" + id) ? $("#" + id).value.trim() : "");
    const rows = Array.from(document.querySelectorAll(".lyrow")).map((r) => ({ season: r.querySelector(".ly_s").value, crop: r.querySelector(".ly_c").value.trim(), yield: r.querySelector(".ly_y").value.trim() }));
    return { years: v("p_years"), size: v("p_size"), unit: v("p_unit"), own: v("p_own"), soil: v("p_soil"),
      water: ticked("p_water"), waterOther: v("p_waterOther"), rows,
      fert: ticked("p_fert"), fertOther: v("p_fertOther"), fertNote: v("p_fertNote"), chem: v("p_chem"),
      diff: ticked("p_diff"), diffOther: v("p_diffOther"), sell: v("p_sell"), notes: v("p_notes") };
  }

  function saveProfile(u) {
    const p = readProfile(), year = new Date().getFullYear() - 1;           // "last year"
    p.rows = p.rows.filter((r) => r.crop || r.yield);
    const nu = Object.assign({}, u, { profile: p, profileDone: true });
    // keep the older fields (used by Account / Home) in step with the new form
    nu.water = { en: listText(D.options.water, p.water, p.waterOther, "en") || "-", si: listText(D.options.water, p.water, p.waterOther, "si") || "-", ta: listText(D.options.water, p.water, p.waterOther, "ta") || "-" };
    if (p.size) nu.farmSize = p.size + " " + optText(D.options.unit, p.unit);
    if (p.rows.length) nu.history = p.rows.map((r) => { const k = matchCrop(r.crop); return { year, season: r.season, crop: k, cropName: k ? "" : r.crop, yield: r.yield || "-" }; });
    saveUser(nu); toast(t("saved")); go("home");
  }

  function viewProfile(u) {
    const p = profDraft || u.profile || {};
    const rows = p.rows && p.rows.length ? p.rows : [{}];
    $("#view").innerHTML = `
      <div class="profile stack">
        <div><h2>🧑‍🌾 ${t("profileTitle")}</h2><p class="src">${t("profileIntro")}</p></div>

        <div class="card"><h3>🏡 ${t("secFarm")}</h3>
          <label>${t("years")}</label><input id="p_years" type="number" inputmode="numeric" min="0" max="80" value="${esc(p.years || "")}">
          <label>${t("farmSize")}</label>
          <div class="two"><input id="p_size" type="number" inputmode="decimal" min="0" step="any" value="${esc(p.size || "")}"><select id="p_unit">${opts(D.options.unit, p.unit || "acre", false)}</select></div>
          <label>${t("ownership")}</label><select id="p_own">${opts(D.options.ownership, p.own)}</select>
          <label>${t("soil")}</label><select id="p_soil">${opts(D.options.soil, p.soil)}</select>
          <label>${t("waterSource")}</label><div class="checks">${chk("p_water", D.options.water, p.water)}</div>
          <input id="p_waterOther" placeholder="${esc(t("waterOther"))}" value="${esc(p.waterOther || "")}" style="margin-top:.4rem">
        </div>

        <div class="card"><h3>🔄 ${t("secLast")}</h3><p class="src">${t("lastHelp")}</p>
          <datalist id="cropList">${Object.keys(D.advice).map((k) => `<option value="${esc(L(D.advice[k].name))}">`).join("")}</datalist>
          <div id="ly_rows">${rows.map(lyRow).join("")}</div>
          <button type="button" class="btn ghost" id="ly_add" style="margin-top:.6rem">${t("addCrop")}</button>
        </div>

        <div class="card"><h3>🧪 ${t("secFert")}</h3>
          <div class="checks">${chk("p_fert", D.options.fert, p.fert)}</div>
          <input id="p_fertOther" placeholder="${esc(t("fertOther"))}" value="${esc(p.fertOther || "")}" style="margin-top:.4rem">
          <label>${t("fertNote")}</label><input id="p_fertNote" placeholder="${esc(t("fertNotePh"))}" value="${esc(p.fertNote || "")}">
          <label>${t("chem")}</label><input id="p_chem" value="${esc(p.chem || "")}">
        </div>

        <div class="card"><h3>⚠️ ${t("secDiff")}</h3>
          <div class="checks">${chk("p_diff", D.options.diff, p.diff)}</div>
          <input id="p_diffOther" placeholder="${esc(t("diffOther"))}" value="${esc(p.diffOther || "")}" style="margin-top:.4rem">
          <label>${t("sell")}</label><select id="p_sell">${opts(D.options.sell, p.sell)}</select>
          <label>${t("notes")}</label><textarea id="p_notes" rows="3">${esc(p.notes || "")}</textarea>
        </div>

        <button class="btn block" id="p_save">${t("saveProfile")}</button>
        <button class="link" id="p_skip">${u.profileDone ? t("cancel") : t("skip")}</button>
      </div>`;
    $("#ly_add").onclick = () => $("#ly_rows").insertAdjacentHTML("beforeend", lyRow({}));
    $("#ly_rows").onclick = (e) => {
      const b = e.target.closest(".rm"); if (!b) return;
      b.closest(".lyrow").remove();
      if (!document.querySelector(".lyrow")) $("#ly_rows").insertAdjacentHTML("beforeend", lyRow({}));   // always keep one empty row
    };
    $("#p_save").onclick = () => saveProfile(u);
    $("#p_skip").onclick = () => go(u.profileDone ? "account" : "home");
  }

  /* ---------- MARKET (all sample data) ---------- */
  function viewMarket(u) {
    const mine = store.get("listings", []);
    const all = mine.concat(D.market.listings);
    $("#view").innerHTML = `
      <h2>🛒 ${t("marketTitle")}</h2>
      <div class="stack">
        <div class="card"><h3>📈 ${t("todayPrices")}</h3><table>${D.market.prices.map((p) => `<tr><td>${D.advice[p.crop].icon} ${esc(L(D.advice[p.crop].name))}</td><td>Rs ${p.price}/kg</td><td class="${p.change >= 0 ? "up" : "down"}">${p.change >= 0 ? "▲" : "▼"} ${Math.abs(p.change)}%</td></tr>`).join("")}</table></div>
        <div class="card"><h3>🧺 ${t("listings")}</h3>
          ${all.map((l) => `<div style="padding:.5rem 0;border-bottom:1px solid var(--line)">${D.advice[l.crop].icon} <b>${esc(L(D.advice[l.crop].name))}</b> · ${l.qty} kg · Rs ${l.price}/kg<br><span class="src">${esc(l.farmer)} · ${esc(distName(l.district))} · 🚚 ${l.transport ? t("hasTransport") : t("noTransport")}</span><br><a class="btn ghost" style="margin-top:.3rem" href="tel:${esc(l.phone)}">${t("call")}</a></div>`).join("")}
        </div>
        <div class="card"><h3>➕ ${t("postTitle")}</h3>
          <label>${t("crop")}</label><select id="m_crop">${cropOptions(u.crop)}</select>
          <label>${t("qty")}</label><input id="m_qty" type="number" min="1">
          <label>${t("pricePerKg")}</label><input id="m_price" type="number" min="1">
          <label><input id="m_tr" type="checkbox" style="width:auto"> 🚚 ${t("needTransport")}</label>
          <button class="btn block" id="m_post">${t("post")}</button>
        </div>
        <div class="card"><h3>🏢 ${t("buyers")}</h3>
          ${D.market.buyers.map((b) => `<div style="padding:.4rem 0"><b>${esc(b.name)}</b> · ${esc(distName(b.district))}<br><span class="src">${t("wants")}: ${b.needs.map((k) => D.advice[k].icon + " " + esc(L(D.advice[k].name))).join(", ")}</span> <a class="btn ghost" href="tel:${esc(b.phone)}">${t("call")}</a></div>`).join("")}
        </div>
      </div>`;
    $("#m_post").onclick = () => {
      const qty = +$("#m_qty").value, price = +$("#m_price").value; if (!qty || !price) return;
      mine.unshift({ farmer: u.name, crop: $("#m_crop").value, qty, price, district: u.district, transport: !$("#m_tr").checked, phone: u.phone });
      store.set("listings", mine); toast(t("saved")); viewMarket(u);
    };
  }

  /* ---------- CHAT (demo, rule-based) ---------- */
  const KEYS = [
    ["r_yellow", ["yellow", "කහ", "மஞ்சள்"]],
    ["r_pest", ["pest", "insect", "worm", "bug", "කෘමි", "පණු", "பூச்சி", "புழு"]],
    ["r_water", ["water", "irrigat", "dry", "ජල", "වියළ", "நீர்", "வறட்"]],
    ["r_fert", ["fertil", "urea", "පොහොර", "உரம்"]]
  ];
  function botReply(text) { const s = text.toLowerCase(); for (const [k, words] of KEYS) if (words.some((w) => s.includes(w))) return t(k); return t("r_default"); }
  function viewChat() {
    if (!chat.length) chat.push({ me: false, text: "chatHello" });
    $("#view").innerHTML = `
      <h2>🤖 ${t("chatTitle")}</h2><p class="src bad">${t("chatDemo")}</p>
      <div class="card"><div class="chatlog" id="log"></div>
        <div class="row" style="margin-top:.6rem"><input id="c_in" placeholder="${esc(t("chatPh"))}" style="flex:1"><button class="btn" id="c_send">${t("send")}</button></div>
        <div class="row" style="margin-top:.6rem"><label class="btn ghost" style="margin:0;cursor:pointer">${t("upload")}<input id="c_img" type="file" accept="image/*" hidden></label></div>
      </div>`;
    drawChat();
    const send = () => { const el = $("#c_in"), tx = el.value.trim(); if (!tx) return; chat.push({ me: true, text: tx, raw: true }); chat.push({ me: false, text: botReply(tx), raw: true }); el.value = ""; drawChat(); };
    $("#c_send").onclick = send; $("#c_in").onkeydown = (e) => { if (e.key === "Enter") send(); };
    $("#c_img").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      chat.push({ me: true, img: URL.createObjectURL(f) }); chat.push({ me: false, text: "r_image" }); drawChat();
    };
  }
  function drawChat() {
    const log = $("#log"); if (!log) return;
    log.innerHTML = chat.map((m) => `<div class="msg ${m.me ? "me" : ""}">${m.img ? `<img src="${m.img}" alt="">` : esc(m.raw ? m.text : t(m.text))}</div>`).join("");
    log.scrollTop = log.scrollHeight;
  }

  /* ---------- start ---------- */
  if (session && me()) { lang = me().lang || lang; $("#landing").hidden = true; $("#app").hidden = false; }
  applyLang();
})();
