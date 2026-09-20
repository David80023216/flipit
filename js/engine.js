/* ============================================================
   FLIP IT — Game Engine
   Pure game logic. No DOM access here (ui.js owns the DOM), so
   this file can be unit-tested headlessly with node.
   Depends on: items.js (ITEMS, CATEGORIES, validateItems),
               config.js (LEVELS, REVEAL_EVENTS, ...)
   ============================================================ */
"use strict";

/* ---------------- utils ---------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function nice(n) {
  if (n < 100) return Math.max(5, Math.round(n / 5) * 5);
  if (n < 1000) return Math.round(n / 10) * 10;
  if (n < 10000) return Math.round(n / 50) * 50;
  return Math.round(n / 100) * 100;
}
function todayKey(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function weightedPick(rng, arr) {
  let total = 0;
  for (const e of arr) total += e.weight || 1;
  let r = rng() * total;
  for (const e of arr) { r -= (e.weight || 1); if (r <= 0) return e; }
  return arr[arr.length - 1];
}

/* ---------------- storage (localStorage w/ memory fallback) ---------------- */
const Store = {
  _mem: {},
  _ls: null,
  init() {
    try { this._ls = window.localStorage; this._ls.getItem("__t"); } catch (e) { this._ls = null; }
  },
  get(k) {
    try {
      if (this._ls) { const v = this._ls.getItem(k); return v == null ? undefined : JSON.parse(v); }
    } catch (e) {}
    return this._mem[k];
  },
  set(k, v) {
    try { if (this._ls) { this._ls.setItem(k, JSON.stringify(v)); return; } } catch (e) {}
    this._mem[k] = JSON.parse(JSON.stringify(v));
  },
  del(k) {
    try { if (this._ls) this._ls.removeItem(k); } catch (e) {}
    delete this._mem[k];
  },
};
Store.init();

/* ---------------- analytics hooks ---------------- */
const Analytics = {
  track(event, props) {
    try {
      const p = FlipIt.profile();
      if (p) {
        p.analytics.push({ t: Date.now(), event, props: props || {} });
        if (p.analytics.length > 500) p.analytics.splice(0, p.analytics.length - 500);
      }
    } catch (e) {}
    if (typeof console !== "undefined" && console.debug) console.debug("[analytics]", event, props || {});
  },
};

const SAVE_KEY = "flipit_save_v1";
let _uid = 1;

/* ============================================================
   FlipIt engine
   ============================================================ */
const FlipIt = {
  data: null,          // { profiles: {name: profile}, active: name }
  sessionStart: 0,

  /* ---------- boot / profiles ---------- */
  boot() {
    const errs = validateItems();
    if (errs.length && typeof console !== "undefined") console.warn("item data errors:", errs);
    this.data = Store.get(SAVE_KEY) || { profiles: {}, active: null };
    return errs;
  },
  save() { Store.set(SAVE_KEY, this.data); },
  profile() {
    if (!this.data || !this.data.active) return null;
    return this.data.profiles[this.data.active] || null;
  },
  listProfiles() { return Object.keys(this.data.profiles); },
  createProfile(name) {
    name = String(name || "Player").trim().slice(0, 20) || "Player";
    if (this.data.profiles[name]) return { error: "exists" };
    const p = {
      name, createdAt: Date.now(),
      cash: 1000, inventory: [],
      stats: { lifetimeProfit: 0, bestDeal: 0, worstDeal: 0, winStreak: 0, bestStreak: 0,
               totalBuys: 0, totalPasses: 0, totalSales: 0, profitableSales: 0,
               biggestBuy: 0, auctionsWon: 0, auctionsEntered: 0, mysteryProfit: 0,
               minCash: 1000, comebackDone: false },
      xp: 0, flipCoins: 0,
      owned: [], activeTheme: null, activeFrame: null, badges: [],
      achievements: {},
      daily: this._freshDaily(todayKey()),
      admin: { itemOverrides: {}, deletedItems: [], disabledEvents: [], challengeId: null },
      analytics: [],
      sideHustleDay: null,
    };
    this.data.profiles[name] = p;
    this.data.active = name;
    this.save();
    Analytics.track("profile_created", { name });
    return { ok: true };
  },
  switchProfile(name) {
    if (!this.data.profiles[name]) return false;
    this.data.active = name;
    this._rollDaily(this.data.profiles[name]);
    this.save();
    return true;
  },
  deleteProfile(name) {
    delete this.data.profiles[name];
    if (this.data.active === name) this.data.active = Object.keys(this.data.profiles)[0] || null;
    this.save();
  },

  /* ---------- derived ---------- */
  netWorth(p) {
    p = p || this.profile();
    if (!p) return 0;
    let inv = 0;
    for (const it of p.inventory) inv += it.value;
    return p.cash + inv;
  },
  levelIndex(p) {
    const nw = this.netWorth(p);
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) if (nw >= LEVELS[i].min) idx = i;
    return idx;
  },
  level(p) { return LEVELS[this.levelIndex(p)]; },

  _freshDaily(dateKey) {
    return { date: dateKey, challenge: null, dailyProfit: 0, dailyFlips: 0,
             dailyRiskyBuys: 0, dailyBestStreak: 0, dailyStreakRun: 0,
             loginStreak: 0, lastLogin: null, rewardClaimed: false, netWorthPeak: 0 };
  },
  _rollDaily(p) {
    const dk = todayKey();
    if (p.daily.date !== dk) {
      const prevStreak = (p.daily.lastLogin === todayKey(new Date(Date.now() - 864e5))) ? p.daily.loginStreak : 0;
      p.daily = this._freshDaily(dk);
      p.daily.loginStreak = prevStreak;
      p.daily.netWorthPeak = this.netWorth(p);
    }
    if (!p.daily.challenge) p.daily.challenge = this._makeDailyChallenge(p);
  },
  _makeDailyChallenge(p) {
    const dk = todayKey();
    const adminId = p.admin.challengeId;
    let tpl;
    if (adminId) tpl = CHALLENGE_TEMPLATES.find(t => t.id === adminId) || CHALLENGE_TEMPLATES[0];
    else {
      const rng = mulberry32(hashStr(dk + ":" + p.name));
      tpl = CHALLENGE_TEMPLATES[Math.floor(rng() * CHALLENGE_TEMPLATES.length)];
    }
    const lvl = this.levelIndex(p);
    const target = tpl.target(lvl);
    return { id: tpl.id, title: tpl.title, desc: tpl.desc(target), target,
             metric: tpl.metric, progress: 0, done: false, claimed: false };
  },
  challengeProgress(p, metric) {
    p = p || this.profile();
    const d = p.daily;
    switch (metric) {
      case "dailyProfit": return d.dailyProfit;
      case "dailyFlips": return d.dailyFlips;
      case "dailyRiskyBuys": return d.dailyRiskyBuys;
      case "dailyBestStreak": return d.dailyBestStreak;
      case "netWorthPeak": return d.netWorthPeak;
      default: return 0;
    }
  },
  _checkChallenge(p) {
    const c = p.daily.challenge;
    if (!c || c.done) return;
    c.progress = this.challengeProgress(p, c.metric);
    if (c.progress >= c.target) {
      c.done = true;
      p.flipCoins += 150;
      p.xp += 200;
      Analytics.track("challenge_complete", { id: c.id });
    }
    this.save();
  },

  /* ---------- item access (admin overrides applied) ---------- */
  getItem(id) {
    const p = this.profile();
    const base = ITEM_BY_ID[id];
    if (!base) return null;
    if (p && p.admin.deletedItems.includes(id)) return null;
    const ov = p ? (p.admin.itemOverrides[id] || {}) : {};
    return Object.assign({}, base, ov);
  },
  liveItems() { return ITEMS.map(i => this.getItem(i.id)).filter(Boolean); },

  /* ---------- weekly event ---------- */
  weeklyEvent(date) {
    const d = date || new Date();
    const day = d.getDay(); // 0 Sun
    if (day === 1) return { id: "mystery_monday", name: "Mystery Monday", desc: "Mystery deals appear twice as often." };
    if (day === 6 || day === 0) return { id: "weekend_frenzy", name: "Weekend Flip Frenzy", desc: "+10% on every sale this weekend!" };
    if (day === 5) return { id: "high_roller", name: "High-Roller Friday", desc: "Bigger deals, bigger asks. Fortune favors the bold." };
    return null;
  },

  /* ---------- deal generation ---------- */
  newDeal(opts) {
    opts = opts || {};
    const p = this.profile();
    if (!p) return { error: "no_profile" };
    this._rollDaily(p);
    const lvl = this.levelIndex(p);
    const maxAsk = LEVELS[lvl].maxAsk;
    const afford = Math.max(p.cash, 300);
    const weekly = this.weeklyEvent();

    let pool = this.liveItems().filter(i => i.ask <= Math.min(maxAsk, afford));
    pool = pool.filter(i => !(i.ask >= 45000 && lvl < BIG_DEAL_MIN_LEVEL));
    if (!pool.length) pool = this.liveItems().filter(i => i.ask <= 500);
    if (!pool.length) return { error: "no_items" };

    const rng = mulberry32((Math.random() * 1e9) >>> 0);
    let type = "standard";
    let item;
    const mysteryPool = pool.filter(i => i.cat === "mystery");
    let mysteryChance = mysteryPool.length ? 0.12 : 0;
    if (weekly && weekly.id === "mystery_monday") mysteryChance *= 2;
    const whalePool = pool.filter(i => i.ask >= 45000);
    const r = opts.forceType ? 1 : rng();
    if (opts.forceType === "mystery" && mysteryPool.length) type = "mystery";
    else if (opts.forceType === "big" && whalePool.length) type = "big";
    else if (r < mysteryChance) type = "mystery";
    else if (whalePool.length && lvl >= 3 && r < mysteryChance + 0.15) type = "big";

    if (type === "mystery") item = mysteryPool[Math.floor(rng() * mysteryPool.length)];
    else if (type === "big") item = whalePool[Math.floor(rng() * whalePool.length)];
    else item = pool[Math.floor(rng() * pool.length)];

    // true value: anchored on authored actual, with noise + surprises
    // (mystery deals hide bigger dud risk — that's the gamble)
    let V = item.actual * (0.9 + rng() * 0.2);
    const surprise = rng();
    const dudP = type === "mystery" ? 0.15 : 0.07;
    let surpriseNote = null;
    if (surprise < dudP) { V *= 0.3 + rng() * 0.25; surpriseNote = "dud"; }
    else if (surprise > 0.95) { V *= 1.6 + rng() * 1.2; surpriseNote = "gem"; }
    V = Math.max(5, Math.round(V));

    // asking price bands: 20% steal, 50% fair, 30% trap
    // (fair deals are the grind: thin margins, real risk)
    const band = rng();
    let ask;
    if (band < 0.20) ask = V * (0.6 + rng() * 0.25);
    else if (band < 0.70) ask = V * (0.9 + rng() * 0.2);
    else ask = V * (1.15 + rng() * 0.55);
    if (type === "mystery") ask = V * (0.35 + rng() * 0.35); // heavily discounted
    if (weekly && weekly.id === "high_roller") ask *= 1.15;
    ask = nice(ask);
    if (ask > p.cash && p.cash >= 300) ask = nice(p.cash * (0.5 + rng() * 0.5)); // keep affordable

    // shown estimate: an appraisal, roughly honest but fuzzy — and
    // sometimes wrong. 65% honest, 20% optimistic, 15% pessimistic.
    // You can't tell which. That's the risk.
    const biasR = rng();
    const bias = biasR < 0.65 ? 1 : biasR < 0.85 ? 1.25 + rng() * 0.25 : 0.7 + rng() * 0.15;
    const low = nice(V * (0.72 + rng() * 0.2) * bias);
    const high = nice(Math.max(V * (1.05 + rng() * 0.35) * bias, low * 1.15));

    const deal = {
      id: "d" + Date.now() + Math.floor(rng() * 1e6),
      itemId: item.id, type,
      ask, trueValue: Math.round(V),
      low: type === "mystery" ? null : low,
      high: type === "mystery" ? null : high,
      cond: type === "mystery" ? "Unknown" : item.cond,
      risk: type === "mystery" ? "???" : item.risk,
      timeLeft: p.owned.includes("conv_timer") ? 45 : 30,
      surpriseNote,
    };
    Analytics.track("deal_shown", { item: item.id, type, ask: deal.ask });
    return { deal };
  },

  /* ---------- buy / pass ---------- */
  decide(deal, choice) {
    const p = this.profile();
    if (!p || !deal) return { error: "bad" };
    if (choice === "pass") {
      p.stats.totalPasses++;
      Analytics.track("decision", { choice: "pass", item: deal.itemId });
      this.save();
      return { result: "passed" };
    }
    // buy
    if (p.cash < deal.ask) return { error: "insufficient" };
    const item = this.getItem(deal.itemId);
    p.cash -= deal.ask;
    p.stats.totalBuys++;
    p.stats.biggestBuy = Math.max(p.stats.biggestBuy, deal.ask);
    if (p.cash < p.stats.minCash) p.stats.minCash = p.cash;
    if (item.risk === "HIGH" || deal.type === "mystery") p.daily.dailyRiskyBuys++;
    p.xp += 5;

    // reveal event
    const rng = mulberry32((Math.random() * 1e9) >>> 0);
    const allowed = REVEAL_EVENTS.filter(e => !p.admin.disabledEvents.includes(e.id));
    let ev = null;
    if (rng() < 0.7 && allowed.length) ev = weightedPick(rng, allowed);
    let value = deal.trueValue;
    let repairCost = 0;
    if (ev) {
      if (ev.valueMult) value = Math.round(value * ev.valueMult);
      if (ev.repairPct) { repairCost = Math.round(value * ev.repairPct); value -= repairCost; }
    }
    value = Math.max(1, value);
    Analytics.track("decision", { choice: "buy", item: deal.itemId, ask: deal.ask, event: ev ? ev.id : null });
    this.save();
    return {
      result: "bought",
      reveal: { dealId: deal.id, itemId: deal.itemId, cost: deal.ask, value,
                event: ev, repairCost, profit: value - deal.ask, type: deal.type },
    };
  },

  /* 5% marketplace fee on every sale — flipping isn't free */
  netSaleValue(v) { return Math.round(v * 0.95); },

  _recordSale(p, cost, value) {
    value = this.netSaleValue(value);
    const profit = Math.round(value - cost);
    p.cash += Math.round(value);
    const st = p.stats;
    st.lifetimeProfit += profit;
    st.totalSales++;
    if (profit > 0) {
      st.profitableSales++;
      st.winStreak++;
      st.bestStreak = Math.max(st.bestStreak, st.winStreak);
      p.daily.dailyStreakRun++;
      p.daily.dailyBestStreak = Math.max(p.daily.dailyBestStreak, p.daily.dailyStreakRun);
    } else {
      st.winStreak = 0;
      p.daily.dailyStreakRun = 0;
    }
    st.bestDeal = Math.max(st.bestDeal, profit);
    st.worstDeal = Math.min(st.worstDeal, profit);
    p.daily.dailyProfit += profit;
    p.daily.dailyFlips++;
    const weekly = this.weeklyEvent();
    p.daily.netWorthPeak = Math.max(p.daily.netWorthPeak, this.netWorth(p));
    p.xp += profit > 0 ? 25 : 10;
    // comeback achievement support
    if (!st.comebackDone && st.minCash < 500 && this.netWorth(p) >= 5000) st.comebackDone = true;
    if (p.daily.challenge && p.daily.challenge.metric === "mysteryProfit" && profit > 0) { /* reserved */ }
    this._checkAchievements(p);
    this._checkChallenge(p);
    this.save();
    return profit;
  },

  resolveReveal(reveal, action) {
    // action: 'sell' | 'hold'
    const p = this.profile();
    if (!p || !reveal) return { error: "bad" };
    const item = this.getItem(reveal.itemId);
    const weekly = this.weeklyEvent();
    let value = reveal.value;
    if (weekly && weekly.id === "weekend_frenzy") value = Math.round(value * 1.1);
    if (action === "sell") {
      const profit = this._recordSale(p, reveal.cost, value);
      if (reveal.type === "mystery" && profit > 0) p.stats.mysteryProfit++;
      Analytics.track("sell", { item: reveal.itemId, cost: reveal.cost, value, profit, when: "instant" });
      this.save();
      return { result: "sold", profit, value };
    }
    p.inventory.push({ uid: "u" + Date.now() + (_uid++), itemId: reveal.itemId,
                       cost: reveal.cost, value, listedAt: Date.now() });
    Analytics.track("hold", { item: reveal.itemId, cost: reveal.cost, value });
    this.save();
    return { result: "held" };
  },

  sellInventory(uid, opts) {
    const p = this.profile();
    if (!p) return { error: "bad" };
    const idx = p.inventory.findIndex(i => i.uid === uid);
    if (idx < 0) return { error: "not_found" };
    const it = p.inventory[idx];
    const rng = Math.random;
    let price = (opts && opts.fixedPrice) ? Math.round(opts.fixedPrice)
      : Math.round(it.value * (0.97 + rng() * 0.06));
    const weekly = this.weeklyEvent();
    if (weekly && weekly.id === "weekend_frenzy") price = Math.round(price * 1.1);
    p.inventory.splice(idx, 1);
    const profit = this._recordSale(p, it.cost, price);
    Analytics.track("sell", { item: it.itemId, cost: it.cost, value: price, profit, when: "inventory" });
    this.save();
    return { result: "sold", profit, price };
  },

  /* hold events between rounds */
  maybeHoldEvent() {
    const p = this.profile();
    if (!p || !p.inventory.length) return null;
    if (Math.random() > 0.10) return null;
    const it = p.inventory[Math.floor(Math.random() * p.inventory.length)];
    const allowed = HOLD_EVENTS; // admin toggle could extend here
    const ev = weightedPick(Math.random, allowed);
    const item = this.getItem(it.itemId);
    if (ev.offer) {
      const price = Math.round(it.value * (0.9 + Math.random() * 0.15));
      it.pendingOffer = price;
      this.save();
      return { uid: it.uid, text: ev.text.replace("%ITEM%", item.name).replace("%PRICE%", fmt(price)), offer: price };
    }
    it.value = Math.max(1, Math.round(it.value * ev.valueMult));
    this.save();
    return { uid: it.uid, text: ev.text.replace("%ITEM%", item.name), valueMult: ev.valueMult };
  },
  acceptOffer(uid) {
    const p = this.profile();
    const it = p.inventory.find(i => i.uid === uid);
    if (!it || !it.pendingOffer) return { error: "bad" };
    const price = it.pendingOffer;
    return this.sellInventory(uid, { fixedPrice: price });
  },

  /* ---------- auctions ---------- */
  maybeAuction() {
    const p = this.profile();
    if (!p || p.cash < 500) return false;
    return Math.random() < 1 / 14;
  },
  startAuction() {
    const p = this.profile();
    if (!p) return { error: "bad" };
    const lvl = this.levelIndex(p);
    const pool = this.liveItems().filter(i => i.ask <= LEVELS[lvl].maxAsk * 1.5 && i.ask <= Math.max(p.cash * 2, 1000));
    if (!pool.length) return { error: "no_items" };
    const item = pool[Math.floor(Math.random() * pool.length)];
    const V = Math.max(5, Math.round(item.actual * (0.9 + Math.random() * 0.2)));
    const nBid = 2 + Math.floor(Math.random() * 2);
    const shuffled = BIDDERS.slice().sort(() => Math.random() - 0.5).slice(0, nBid);
    const bidders = shuffled.map(b => ({
      name: b.name, emoji: b.emoji, aggro: b.aggro,
      max: Math.round(V * (b.maxMult[0] + Math.random() * (b.maxMult[1] - b.maxMult[0]))),
      lastBid: 0,
    }));
    const start = nice(item.ask * 0.5);
    const auction = {
      id: "a" + Date.now(), itemId: item.id, trueValue: V,
      bid: start, leader: "You", timeLeft: 25,
      bidders, over: false, playerBid: start,
      increment: Math.max(10, nice(start * 0.06)),
    };
    p.stats.auctionsEntered++;
    Analytics.track("auction_start", { item: item.id, start });
    this.save();
    return { auction };
  },
  auctionTick(a) {
    if (a.over) return a;
    a.timeLeft = Math.max(0, a.timeLeft - 1);
    for (const b of a.bidders) {
      if (a.bid >= b.max) continue;
      if (Math.random() < b.aggro * 0.45) {
        const nb = Math.min(a.bid + a.increment * (1 + Math.floor(Math.random() * 2)), b.max);
        if (nb > a.bid) { a.bid = nb; a.leader = b.name + " " + b.emoji; b.lastBid = nb; }
      }
    }
    if (a.timeLeft <= 0) {
      a.over = true;
      const p = this.profile();
      if (a.leader === "You") {
        p.cash -= a.bid;
        p.stats.auctionsWon++;
        p.inventory.push({ uid: "u" + Date.now() + (_uid++), itemId: a.itemId, cost: a.bid, value: a.trueValue, listedAt: Date.now() });
        p.xp += 40;
        Analytics.track("auction_won", { item: a.itemId, bid: a.bid, value: a.trueValue });
        a.won = true;
      } else {
        Analytics.track("auction_lost", { item: a.itemId, bid: a.bid });
        a.won = false;
      }
      this._checkAchievements(p);
      this.save();
    }
    return a;
  },
  playerBid(a, amount) {
    const p = this.profile();
    amount = Math.round(amount);
    if (!p || a.over) return { error: "over" };
    if (amount < a.bid + a.increment) return { error: "too_low", min: a.bid + a.increment };
    if (amount > p.cash) return { error: "insufficient" };
    a.bid = amount; a.leader = "You"; a.playerBid = amount;
    a.timeLeft = Math.max(a.timeLeft, 4); // anti-snipe
    return { ok: true };
  },

  /* ---------- daily login ---------- */
  claimDailyLogin() {
    const p = this.profile();
    if (!p) return { error: "bad" };
    this._rollDaily(p);
    const d = p.daily;
    const dk = todayKey();
    if (d.rewardClaimed && d.date === dk) return { error: "claimed" };
    const yesterday = todayKey(new Date(Date.now() - 864e5));
    d.loginStreak = (d.lastLogin === yesterday) ? d.loginStreak + 1 : 1;
    d.lastLogin = dk;
    const reward = DAILY_LOGIN_REWARDS[Math.min(d.loginStreak, 7) - 1];
    p.flipCoins += reward;
    p.xp += 20;
    d.rewardClaimed = true;
    Analytics.track("daily_login", { streak: d.loginStreak, reward });
    this.save();
    return { ok: true, reward, streak: d.loginStreak };
  },

  /* ---------- side hustle (anti-softlock) ---------- */
  sideHustle() {
    const p = this.profile();
    if (!p) return { error: "bad" };
    const dk = todayKey();
    if (p.sideHustleDay === dk) return { error: "claimed" };
    if (this.netWorth(p) >= 500) return { error: "not_broke" };
    p.sideHustleDay = dk;
    p.cash += 150;
    Analytics.track("side_hustle", {});
    this.save();
    return { ok: true, amount: 150 };
  },

  /* ---------- store ---------- */
  buyCosmetic(id) {
    const p = this.profile();
    const s = STORE_ITEMS.find(x => x.id === id);
    if (!p || !s) return { error: "bad" };
    if (p.owned.includes(id)) return { error: "owned" };
    if (p.flipCoins < s.price) return { error: "insufficient" };
    p.flipCoins -= s.price;
    p.owned.push(id);
    if (s.kind === "theme") p.activeTheme = s.css;
    if (s.kind === "frame") p.activeFrame = s.css;
    if (s.kind === "badge") p.badges.push(s.emoji);
    Analytics.track("store_purchase", { id, price: s.price });
    this.save();
    return { ok: true };
  },
  setCosmetic(id) {
    const p = this.profile();
    const s = STORE_ITEMS.find(x => x.id === id);
    if (!p || !s || !p.owned.includes(id)) return { error: "bad" };
    if (s.kind === "theme") p.activeTheme = s.css;
    if (s.kind === "frame") p.activeFrame = s.css;
    this.save();
    return { ok: true };
  },

  /* ---------- achievements ---------- */
  _checkAchievements(p) {
    for (const a of ACHIEVEMENTS) {
      if (p.achievements[a.id]) continue;
      let ok = false;
      try { ok = !!a.check(p); } catch (e) { ok = false; }
      if (ok) {
        p.achievements[a.id] = Date.now();
        p.xp += a.xp; p.flipCoins += a.coins;
        Analytics.track("achievement", { id: a.id });
        p._newAch = p._newAch || [];
        p._newAch.push(a);
      }
    }
  },
  takeNewAchievements() {
    const p = this.profile();
    const n = (p && p._newAch) || [];
    if (p) p._newAch = [];
    return n;
  },

  /* ---------- level ups ---------- */
  checkLevelUp(prevIdx) {
    const idx = this.levelIndex();
    if (idx > prevIdx) {
      const p = this.profile();
      p.xp += 100;
      Analytics.track("level_up", { level: idx, title: LEVELS[idx].title });
      this.save();
      return LEVELS[idx];
    }
    return null;
  },

  /* ---------- sessions ---------- */
  startSession() {
    this.sessionStart = Date.now();
    Analytics.track("session_start", {});
  },
  endSession() {
    if (!this.sessionStart) return;
    Analytics.track("session_end", { seconds: Math.round((Date.now() - this.sessionStart) / 1000) });
    this.save();
  },

  /* ---------- data mgmt ---------- */
  exportData() { return JSON.stringify(this.data, null, 2); },
  importData(json) {
    const d = JSON.parse(json);
    if (!d.profiles) throw new Error("bad file");
    this.data = d; this.save();
  },
  resetAll() { Store.del(SAVE_KEY); this.data = { profiles: {}, active: null }; },
};

/* admin item helpers */
FlipIt.adminSetItem = function (id, patch) {
  const p = this.profile(); if (!p) return;
  p.admin.itemOverrides[id] = Object.assign({}, p.admin.itemOverrides[id], patch);
  this.save();
};
FlipIt.adminAddItem = function (item) {
  const p = this.profile(); if (!p) return { error: "bad" };
  ITEMS.push(item); ITEM_BY_ID[item.id] = item;
  this.save(); return { ok: true };
};
FlipIt.adminDeleteItem = function (id) {
  const p = this.profile(); if (!p) return;
  if (!p.admin.deletedItems.includes(id)) p.admin.deletedItems.push(id);
  this.save();
};
FlipIt.adminRestoreItem = function (id) {
  const p = this.profile(); if (!p) return;
  p.admin.deletedItems = p.admin.deletedItems.filter(x => x !== id);
  delete p.admin.itemOverrides[id];
  this.save();
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FlipIt, Analytics, Store, mulberry32, hashStr, todayKey, LEVELS, ITEMS, CATEGORIES,
    REVEAL_EVENTS, HOLD_EVENTS, CHALLENGE_TEMPLATES, STORE_ITEMS, ACHIEVEMENTS, BIDDERS, DAILY_LOGIN_REWARDS,
    fmt, fmtShort, money, nice, validateItems };
}
