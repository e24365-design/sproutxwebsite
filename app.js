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
  document.querySelectorAll(".langs button").forEach((b) => b.addEventListener("click", () => { lang = b.dataset.lang; store.set("lang", lang); applyLang(); }));

  /* ---------- AUTH: phone number + OTP (demo) + GPS ---------- */
  let authMode = "signup";
  function cropOptions(sel) { return Object.keys(D.advice).map((k) => `<option value="${k}" ${k === sel ? "selected" : ""}>${D.advice[k].icon} ${esc(L(D.advice[k].name))}</option>`).join(""); }
  function districtOptions(sel) { return `<option value="">${esc(t("pickDistrict"))}</option>` + D.districts.map((d) => `<option value="${d.id}" ${d.id === sel ? "selected" : ""}>${esc(L(d.name))}</option>`).join(""); }

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
        <div class="row" style="margin-top:.5rem"><button class="btn ghost" id="gpsBtn" type="button">${t("useGps")}</button><span class="hint" id="gpsMsg"></span></div>
        <label>🌾 ${t("mainCrop")}</label><select id="f_crop">${cropOptions()}</select>
        <label>🌐 ${t("language")}</label>
        <select id="f_lang"><option value="si">සිංහල</option><option value="ta">தமிழ்</option><option value="en">English</option></select>
        <button class="btn block" id="goOtp">${t("sendOtp")}</button>
        <div class="err" id="authErr"></div>`;
      $("#f_lang").value = lang;
      if (gps) $("#gpsMsg").textContent = "✔ " + t("gpsOk");
      $("#gpsBtn").onclick = getGps;
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

  function getGps() {
    const msg = $("#gpsMsg");
    if (!navigator.geolocation) { msg.textContent = t("gpsFail"); return; }
    msg.textContent = t("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => { gps = { lat: +p.coords.latitude.toFixed(4), lon: +p.coords.longitude.toFixed(4) }; $("#f_dist").value = nearestDistrict(gps.lat, gps.lon).id; msg.textContent = "✔ " + t("gpsOk"); },
      () => { msg.textContent = t("gpsFail"); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  const newOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  function startSignup() {
    const name = $("#f_name").value.trim(), phone = normPhone($("#f_phone").value), dist = $("#f_dist").value;
    if (!name || phone.length !== 10 || (!dist && !gps)) { $("#authErr").textContent = t("badInput"); return; }
    const d = D.districts.find((x) => x.id === (dist || nearestDistrict(gps.lat, gps.lon).id));
    const user = { phone, name, district: d.id, lat: gps ? gps.lat : d.lat, lon: gps ? gps.lon : d.lon, usedGps: !!gps,
      crop: $("#f_crop").value, lang: $("#f_lang").value, farmSize: "-", water: { en: "-", si: "-", ta: "-" }, history: [] };
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
      if (pending.mode === "signup") saveUser(u);
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
  function go(k) { tab = k; renderNav(); renderTab(); window.scrollTo(0, 0); }
  function renderTab() {
    const u = me(); if (!u) return;
    ({ home: viewHome, account: viewAccount, alerts: viewAlerts, advice: viewAdvice, market: viewMarket, chat: viewChat })[tab](u);
  }
  function logout() { session = null; store.set("session", null); pending = null; $("#app").hidden = true; $("#landing").hidden = false; applyLang(); }

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
    v.innerHTML = `<h2>${t("hello")}, ${esc(u.name)} 👋</h2><p class="src">📍 ${esc(distName(u.district))}${u.usedGps ? " (GPS)" : ""}</p><div class="card">${t("loading")}</div>`;
    const [wx, nasa] = await Promise.all([getWeather(u), getNasa(u)]);
    if (tab !== "home") return;
    const soilAvg = avg(nasa.soil.slice(-7)), soilKey = soilAvg < 0.35 ? "soil_dry" : soilAvg > 0.75 ? "soil_wet" : "soil_ok";
    v.innerHTML = `
      <h2>${t("hello")}, ${esc(u.name)} 👋</h2>
      <p class="src">📍 ${esc(distName(u.district))}${u.usedGps ? " (GPS)" : ""} · ${u.lat}, ${u.lon}</p>
      <div class="stack">
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
    const c = adviceCrop || u.crop, a = D.advice[c];
    const dist = D.districts.find((d) => d.id === u.district) || nearestDistrict(u.lat, u.lon);
    const chips = Object.keys(D.advice).map((k) => `<button class="chip ${k === c ? "on" : ""}" data-c="${k}">${D.advice[k].icon} ${esc(L(D.advice[k].name))}</button>`).join("");
    $("#view").innerHTML = `
      <h2>🌱 ${t("adviceTitle")}</h2>
      <p class="src">${t("suggested")}: ${dist.crops.map((k) => D.advice[k].icon + " " + esc(L(D.advice[k].name))).join(", ")} (${esc(L(dist.name))})</p>
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
  function viewAccount(u) {
    $("#view").innerHTML = `
      <h2>👤 ${t("accountTitle")}</h2>
      <div class="stack">
        <div class="card"><dl class="kv">
          <dt>${t("fullName")}</dt><dd>${esc(u.name)}</dd>
          <dt>${t("phone")}</dt><dd>${esc(u.phone)}</dd>
          <dt>${t("location")}</dt><dd>${esc(distName(u.district))}${u.usedGps ? " · " + t("gpsLoc") : ""}</dd>
          <dt>${t("mainCrop")}</dt><dd>${D.advice[u.crop].icon} ${esc(L(D.advice[u.crop].name))}</dd>
          <dt>${t("farmSize")}</dt><dd>${esc(u.farmSize || "-")}</dd>
          <dt>${t("waterSource")}</dt><dd>${esc(L(u.water))}</dd></dl>
          <div class="row" style="margin-top:.8rem"><button class="btn ghost" data-go="advice">${t("goAdvice")}</button><button class="btn ghost" data-go="alerts">${t("goAlerts")}</button></div>
        </div>
        <div class="card"><h3>📖 ${t("cropHistory")}</h3>
          ${u.history && u.history.length ? `<table><tr><th>${t("year")}</th><th>${t("crop")}</th><th>${t("yield")}</th></tr>${u.history.map((h) => `<tr><td>${h.year}</td><td>${D.advice[h.crop].icon} ${esc(L(D.advice[h.crop].name))}</td><td>${esc(h.yield)}</td></tr>`).join("")}</table>` : "<p class='src'>-</p>"}
        </div>
        <div class="card"><h3>✅ ${t("practices")}</h3>${D.bestPractices.map((p) => `<p>${p.icon} ${esc(L(p.text))}</p>`).join("")}</div>
        <div class="card"><h3>⚙️ ${t("settings")}</h3>
          <label>${t("fullName")}</label><input id="s_name" value="${esc(u.name)}">
          <label>${t("mainCrop")}</label><select id="s_crop">${cropOptions(u.crop)}</select>
          <label>${t("language")}</label><select id="s_lang"><option value="si">සිංහල</option><option value="ta">தமிழ்</option><option value="en">English</option></select>
          <button class="btn block" id="s_save">${t("save")}</button>
        </div>
        <button class="btn ghost" id="outBtn">${t("logout")}</button>
      </div>`;
    $("#s_lang").value = u.lang || lang;
    document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    $("#s_save").onclick = () => {
      const nu = Object.assign({}, u, { name: $("#s_name").value.trim() || u.name, crop: $("#s_crop").value, lang: $("#s_lang").value });
      saveUser(nu); lang = nu.lang; store.set("lang", lang); adviceCrop = null; toast(t("saved")); applyLang();
    };
    $("#outBtn").onclick = logout;
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
