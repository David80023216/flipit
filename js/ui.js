/* ============================================================
   FLIP IT — UI layer. Owns all DOM. Talks to FlipIt engine only.
   ============================================================ */
"use strict";

const UI = {
  deal: null, auction: null, dealTimer: null, auctionTimer: null, prevLevel: 0,

  /* ---------- boot ---------- */
  boot() {
    const errs = FlipIt.boot();
    if (errs.length) this.toast("⚠️ Item data has " + errs.length + " errors — check console");
    this.wireNav();
    this.wireProfile();
    document.getElementById("btn-admin").onclick = () => this.nav("admin");
    const names = FlipIt.listProfiles();
    if (names.length === 1) this.enterApp(names[0]);
    else this.renderProfiles();
    FlipIt.startSession();
  },

  /* ---------- helpers ---------- */
  $(id) { return document.getElementById(id); },
  esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); },
  toast(msg, ms) {
    const t = this.$("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), ms || 2600);
  },
  modal(html) {
    this.$("modal-card").innerHTML = html;
    this.$("modal").classList.remove("hidden");
  },
  closeModal() { this.$("modal").classList.add("hidden"); },

  /* ---------- profiles ---------- */
  wireProfile() {
    this.$("btn-create-profile").onclick = () => {
      const name = this.$("new-profile-name").value.trim();
      if (!name) return this.toast("Enter a dealer name first");
      const r = FlipIt.createProfile(name);
      if (r.error) return this.toast("That name is taken");
      this.enterApp(name);
    };
    this.$("new-profile-name").addEventListener("keydown", e => {
      if (e.key === "Enter") this.$("btn-create-profile").click();
    });
  },
  renderProfiles() {
    const names = FlipIt.listProfiles();
    const box = this.$("profile-list");
    if (!names.length) { box.innerHTML = `<p class="muted tiny">No dealers yet — create your empire below.</p>`; return; }
    box.innerHTML = names.map(n => {
      const p = FlipIt.data.profiles[n];
      const nw = FlipIt.netWorth(p);
      return `<div class="profile-row">
        <div><div class="pname">${this.esc(n)}</div>
        <div class="psub">${money(nw)} net worth · Lv ${FlipIt.levelIndex(p) + 1}</div></div>
        <div class="row gap">
          <button class="btn primary" data-play="${this.esc(n)}">Play</button>
          <button class="btn ghost" data-del="${this.esc(n)}">✕</button>
        </div></div>`;
    }).join("");
    box.querySelectorAll("[data-play]").forEach(b => b.onclick = () => this.enterApp(b.dataset.play));
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      if (confirm("Delete " + b.dataset.del + " forever?")) { FlipIt.deleteProfile(b.dataset.del); this.renderProfiles(); }
    });
  },
  enterApp(name) {
    FlipIt.switchProfile(name);
    this.$("screen-profile").classList.remove("active");
    this.$("main-app").classList.remove("hidden");
    const p = FlipIt.profile();
    document.body.className = p.activeTheme || "";
    this.$("tb-avatar").className = "avatar " + (p.activeFrame || "");
    this.prevLevel = FlipIt.levelIndex();
    this.nav("home");
    // daily login prompt
    if (!p.daily.rewardClaimed) {
      setTimeout(() => {
        this.modal(`<h3 class="center">🎁 Daily Reward</h3>
          <p class="center">Day ${p.daily.loginStreak + 1} login streak</p>
          <button class="btn primary block" id="m-claim-login">Claim 🪙 ${DAILY_LOGIN_REWARDS[Math.min(p.daily.loginStreak + 1, 7) - 1]}</button>
          <button class="btn ghost block" id="m-close">Later</button>`);
        this.$("m-claim-login").onclick = () => {
          const r = FlipIt.claimDailyLogin();
          this.closeModal();
          if (r.ok) { this.toast(`+${r.reward} FlipCoins! ${r.streak}-day streak 🔥`); this.refresh(); }
        };
        this.$("m-close").onclick = () => this.closeModal();
      }, 600);
    }
    Analytics.track("app_enter", {});
  },

  /* ---------- navigation ---------- */
  wireNav() {
    document.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => this.nav(b.dataset.nav));
    this.$("modal").addEventListener("click", e => { if (e.target.id === "modal") this.closeModal(); });
  },
  nav(name) {
    document.querySelectorAll("#tabbar .tab").forEach(t => t.classList.toggle("active", t.dataset.nav === name));
    document.querySelectorAll("#screens .screen").forEach(s => s.classList.toggle("active", s.id === "screen-" + name));
    this.stopTimers();
    if (name === "home") this.renderHome();
    if (name === "deal") this.renderDealIdle();
    if (name === "inventory") this.renderInventory();
    if (name === "challenges") this.renderChallenges();
    if (name === "leaderboard") this.renderLeaderboard();
    if (name === "store") this.renderStore();
    if (name === "admin") Admin.render();
    this.refresh();
  },
  refresh() {
    const p = FlipIt.profile();
    if (!p) return;
    this.$("tb-name").textContent = p.name;
    this.$("tb-level").textContent = "Lv " + (FlipIt.levelIndex() + 1) + " · " + FlipIt.level().title;
    this.$("tb-cash").textContent = money(p.cash);
    this.$("tb-coins").textContent = "🪙 " + p.flipCoins.toLocaleString();
    const badge = this.$("nav-inv-badge");
    badge.style.display = p.inventory.length ? "" : "none";
    badge.textContent = p.inventory.length;
    document.body.className = p.activeTheme || "";
    this.$("tb-avatar").className = "avatar " + (p.activeFrame || "");
  },
  stopTimers() {
    clearInterval(this.dealTimer); clearInterval(this.auctionTimer);
    this.dealTimer = this.auctionTimer = null;
  },

  /* ---------- post-action housekeeping ---------- */
  afterEconomy() {
    const p = FlipIt.profile();
    const lvl = FlipIt.checkLevelUp(this.prevLevel);
    this.prevLevel = FlipIt.levelIndex();
    const achs = FlipIt.takeNewAchievements();
    this.refresh();
    if (lvl) {
      this.modal(`<div class="center"><div style="font-size:64px">🎉</div>
        <h2>LEVEL UP!</h2><p>You are now a</p>
        <h3 style="color:var(--gold)">${this.esc(lvl.title)}</h3>
        <p class="muted tiny">${this.esc(lvl.desc)}</p>
        <p class="muted">Bigger deals unlocked · max ask ${money(lvl.maxAsk)}</p>
        <button class="btn primary block" id="m-close2">Let's go</button></div>`);
      this.$("m-close2").onclick = () => { this.closeModal(); this.showAchievements(achs); };
    } else this.showAchievements(achs);
  },
  showAchievements(achs) {
    if (!achs.length) return;
    const a = achs[0];
    this.toast(`🏆 ${a.name} — +${a.coins} 🪙`);
    if (achs.length > 1) setTimeout(() => this.showAchievements(achs.slice(1)), 2800);
  },

  /* ================= HOME ================= */
  renderHome() {
    const p = FlipIt.profile();
    const st = p.stats, nw = FlipIt.netWorth(), lvl = FlipIt.level();
    const S = (k, v, cls) => `<div class="stat"><div class="k">${k}</div><div class="v ${cls || ""}">${v}</div></div>`;
    this.$("home-stats").innerHTML =
      S("Cash", money(p.cash), "pos") + S("Net worth", money(nw), "gold") +
      S("Items owned", p.inventory.length) + S("Level", (FlipIt.levelIndex() + 1) + " · " + lvl.title) +
      S("Lifetime profit", money(st.lifetimeProfit), st.lifetimeProfit >= 0 ? "pos" : "neg") +
      S("Win streak", st.winStreak + " 🔥") +
      S("Best deal", money(st.bestDeal), "pos") + S("Worst deal", money(st.worstDeal), "neg");

    // weekly banner
    const w = FlipIt.weeklyEvent();
    this.$("weekly-banner").innerHTML = w
      ? `<div class="card" style="border-color:var(--gold)"><b>⚡ ${this.esc(w.name)}</b><br><span class="muted tiny">${this.esc(w.desc)}</span></div>`
      : "";

    // daily login card
    const d = p.daily;
    this.$("daily-login-card").innerHTML = d.rewardClaimed
      ? `<div class="card"><b>🎁 Daily reward claimed</b> <span class="muted tiny">· ${d.loginStreak}-day streak</span></div>`
      : `<div class="card" style="border-color:var(--gold)"><b>🎁 Daily reward ready!</b>
         <button class="btn primary block" id="btn-claim-login">Claim 🪙 ${DAILY_LOGIN_REWARDS[Math.min(d.loginStreak + 1, 7) - 1]}</button></div>`;
    const cb = this.$("btn-claim-login");
    if (cb) cb.onclick = () => { const r = FlipIt.claimDailyLogin(); if (r.ok) { this.toast(`+${r.reward} FlipCoins!`); this.renderHome(); this.refresh(); } };

    // challenge
    const c = d.challenge;
    const pct = Math.min(100, Math.round(100 * c.progress / c.target));
    const fmtP = c.metric === "dailyProfit" || c.metric === "netWorthPeak" ? money(c.progress) : Math.floor(c.progress).toLocaleString();
    const fmtT = c.metric === "dailyProfit" || c.metric === "netWorthPeak" ? money(c.target) : c.target.toLocaleString();
    this.$("home-challenge").innerHTML =
      `<b>${this.esc(c.title)}</b> ${c.done ? "✅" : ""}<br><span class="muted">${this.esc(c.desc)}</span>
       <div class="progress"><i style="width:${pct}%"></i></div>
       <div class="tiny muted" style="margin-top:4px">${fmtP} / ${fmtT} · reward 150 🪙</div>`;

    // side hustle
    const broke = nw < 500;
    this.$("home-sidehustle").style.display = (broke && p.sideHustleDay !== todayKey()) ? "" : "none";
    this.$("btn-sidehustle").onclick = () => {
      const r = FlipIt.sideHustle();
      if (r.ok) { this.toast("Side hustle paid $150 💪"); this.renderHome(); this.refresh(); }
    };

    // achievements
    const got = Object.keys(p.achievements).length;
    this.$("ach-count").textContent = `(${got}/${ACHIEVEMENTS.length})`;
    this.$("home-achievements").innerHTML = ACHIEVEMENTS.map(a => {
      const has = !!p.achievements[a.id];
      return `<div class="ach ${has ? "" : "locked"}"><div class="ae">${has ? "🏆" : "🔒"}</div>
        <div><b>${this.esc(a.name)}</b><br><span class="muted">${this.esc(a.desc)}</span></div></div>`;
    }).join("");
  },

  /* ================= DEAL FLOW ================= */
  renderDealIdle() {
    const p = FlipIt.profile();
    const holdEv = FlipIt.maybeHoldEvent();
    this.$("deal-area").innerHTML = `
      <div class="card center" style="margin-top:40px">
        <div style="font-size:56px">🤝</div>
        <h2>The market awaits</h2>
        <p class="muted">A new opportunity every round.<br>Cash: <b style="color:var(--green)">${money(p.cash)}</b></p>
        <button class="btn primary big block" id="btn-find-deal">🔍 FIND A DEAL</button>
        ${holdEv ? `<p class="tiny" style="margin-top:10px">📣 ${this.esc(holdEv.text)}</p>` : ""}
      </div>`;
    this.$("btn-find-deal").onclick = () => this.nextDeal();
  },
  nextDeal() {
    if (FlipIt.maybeAuction()) {
      const r = FlipIt.startAuction();
      if (!r.error) return this.renderAuction(r.auction);
    }
    const r = FlipIt.newDeal();
    if (r.error) return this.toast("No deals available right now");
    this.renderDeal(r.deal);
  },
  catStyle(cat) {
    const c = CATEGORIES[cat] || {};
    return `background:${c.gradient || "var(--card2)"}`;
  },
  renderDeal(deal) {
    this.deal = deal;
    const p = FlipIt.profile();
    const item = FlipIt.getItem(deal.itemId);
    const cat = CATEGORIES[item.cat];
    const isMystery = deal.type === "mystery";
    const intel = p.owned.includes("conv_intel") && isMystery;
    this.$("deal-area").innerHTML = `
      <div class="deal-card">
        ${isMystery ? `<div class="mystery-banner">🔥 SOMEONE NEEDS THIS GONE TODAY 🔥</div>` : ""}
        <div class="deal-art" style="${this.catStyle(item.cat)}">
          <div class="deal-badges">
            <span class="pill cat">${cat.emoji} ${this.esc(cat.name)}</span>
            <span class="pill risk-${deal.risk}">${deal.risk === "???" ? "❓ RISK ???" : "⚠️ " + deal.risk + " RISK"}</span>
          </div>
          <span>${item.emoji}</span>
        </div>
        <div class="deal-timer" id="deal-timer"><i style="width:100%"></i></div>
        <div class="deal-body">
          <h2 class="deal-name">${this.esc(item.name)}</h2>
          <div class="deal-cat">${this.esc(item.rarity)} · ${this.esc(item.buyer)} wants these</div>
          <div class="deal-rows">
            <div class="deal-row"><div class="k">Asking price</div><div class="v" style="color:var(--gold)">${money(deal.ask)}</div></div>
            <div class="deal-row"><div class="k">Est. value</div><div class="v">${isMystery ? (intel ? "~" + money(deal.trueValue) + " 👀" : "❓❓❓") : money(deal.low) + "–" + money(deal.high)}</div></div>
            <div class="deal-row"><div class="k">Condition</div><div class="v">${this.esc(deal.cond)}</div></div>
            <div class="deal-row"><div class="k">Your cash</div><div class="v" style="color:var(--green)">${money(p.cash)}</div></div>
          </div>
          <p class="deal-desc">${isMystery ? "No photos. No history. Just a price that screams desperation…" : this.esc(item.desc)}</p>
          ${item.repair ? `<p class="tiny muted">🔧 Possible repair cost: ~${money(item.repair)}</p>` : ""}
          <div class="deal-actions">
            <button class="btn pass" id="btn-pass">PASS</button>
            <button class="btn buy" id="btn-buy" ${p.cash < deal.ask ? "disabled" : ""}>BUY ${money(deal.ask)}</button>
          </div>
        </div>
      </div>`;
    // timer
    const total = deal.timeLeft;
    this.dealTimer = setInterval(() => {
      deal.timeLeft--;
      const bar = this.$("deal-timer");
      if (bar) {
        bar.firstElementChild.style.width = Math.max(0, 100 * deal.timeLeft / total) + "%";
        bar.classList.toggle("low", deal.timeLeft <= 8);
      }
      if (deal.timeLeft <= 0) {
        this.stopTimers();
        FlipIt.decide(deal, "pass");
        this.toast("⏰ Time's up — passed");
        this.renderDealIdle();
      }
    }, 1000);
    this.$("btn-pass").onclick = () => { this.stopTimers(); FlipIt.decide(deal, "pass"); this.renderDealIdle(); };
    this.$("btn-buy").onclick = () => {
      this.stopTimers();
      const r = FlipIt.decide(deal, "buy");
      if (r.error) return this.toast("Not enough cash!");
      this.renderSuspense(r.reveal);
    };
  },

  renderSuspense(reveal) {
    const item = FlipIt.getItem(reveal.itemId);
    this.$("deal-area").innerHTML = `
      <div class="deal-card"><div class="reveal">
        <div style="font-size:56px">${item.emoji}</div>
        <div class="r-text">Revealing true value…</div>
        <div class="suspense" id="suspense-num">$0</div>
      </div></div>`;
    const target = reveal.value;
    const t0 = Date.now(), dur = 1500;
    const iv = setInterval(() => {
      const t = Math.min(1, (Date.now() - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const el = this.$("suspense-num");
      if (el) el.textContent = money(target * eased * (0.7 + Math.random() * 0.6) * (t < 1 ? 1 : 1));
      if (t >= 1) { clearInterval(iv); if (this.$("suspense-num")) this.$("suspense-num").textContent = money(target); setTimeout(() => this.renderReveal(reveal), 450); }
    }, 60);
  },

  renderReveal(reveal) {
    const item = FlipIt.getItem(reveal.itemId);
    const ev = reveal.event;
    const netValue = FlipIt.netSaleValue(reveal.value);
    const profit = netValue - reveal.cost;
    const good = profit > 0;
    this.$("deal-area").innerHTML = `
      <div class="deal-card"><div class="reveal">
        <div class="r-emoji">${good ? "💰" : "💸"}</div>
        <div class="r-text">${ev ? this.esc(ev.text) : (good ? "SOLD? NOT YET…" : "Hmm.")}</div>
        <div class="r-sub">${ev ? this.esc(ev.sub) : this.esc(item.name)}${reveal.repairCost ? `<br>🔧 Repairs: -${money(reveal.repairCost)}` : ""}</div>
        <div class="tiny muted">TRUE VALUE</div>
        <div class="r-value">${money(reveal.value)}</div>
        <div class="r-profit" style="color:${good ? "var(--green)" : "var(--red)"}">
          ${good ? "+" : ""}${money(profit).replace("$-", "-$")} ${good ? "profit" : "loss"} if sold now</div>
        <p class="tiny muted">Includes 5% marketplace fee.</p>
        <div class="deal-actions">
          <button class="btn ghost" id="btn-hold">HOLD 📦</button>
          <button class="btn buy" id="btn-sell-now">SELL NOW</button>
        </div>
        <p class="tiny muted">Hold it and the market might move… either way.</p>
      </div></div>`;
    if (good && profit >= 1000 && FlipIt.profile().owned.includes("anim_confetti")) this.confetti();
    this.$("btn-sell-now").onclick = () => {
      const r = FlipIt.resolveReveal(reveal, "sell");
      this.afterEconomy();
      this.dealResult(r.profit >= 0, r.profit, item);
    };
    this.$("btn-hold").onclick = () => {
      FlipIt.resolveReveal(reveal, "hold");
      this.afterEconomy();
      this.toast("📦 Stashed in inventory");
      this.nav("inventory");
    };
  },
  dealResult(won, profit, item) {
    this.$("deal-area").innerHTML = `
      <div class="card center" style="margin-top:40px">
        <div style="font-size:56px">${won ? "🎉" : "😅"}</div>
        <h2 style="color:${won ? "var(--green)" : "var(--red)"}">${won ? "+" : ""}${money(profit).replace("$-", "-$")}</h2>
        <p class="muted">${this.esc(item.name)} flipped.</p>
        <button class="btn primary big block" id="btn-next">NEXT DEAL →</button>
      </div>`;
    this.$("btn-next").onclick = () => this.nextDeal();
  },

  /* ================= AUCTION ================= */
  renderAuction(a) {
    this.auction = a;
    const item = FlipIt.getItem(a.itemId);
    const p = FlipIt.profile();
    const rows = a.bidders.map(b =>
      `<div class="bid-row ${a.leader.startsWith(b.name) ? "leader" : ""}"><span>${b.emoji} ${this.esc(b.name)}</span><b>${b.lastBid ? money(b.lastBid) : "—"}</b></div>`).join("");
    this.$("deal-area").innerHTML = `
      <div class="auction-card">
        <div class="center"><span style="font-size:56px">${item.emoji}</span>
        <h2 style="margin:6px 0">🔨 LIVE AUCTION</h2>
        <div class="muted">${this.esc(item.name)}</div></div>
        <div class="deal-rows" style="margin-top:12px">
          <div class="deal-row"><div class="k">Current bid</div><div class="v" style="color:var(--gold)" id="auc-bid">${money(a.bid)}</div></div>
          <div class="deal-row"><div class="k">Time left</div><div class="v" id="auc-time">${a.timeLeft}s</div></div>
        </div>
        <div class="tiny muted">Leading: <b id="auc-leader">${this.esc(a.leader)}</b></div>
        <div style="margin-top:8px">${rows}</div>
        <div class="bid-controls">
          <button class="btn ghost" id="btn-bid1">BID ${money(a.bid + a.increment)}</button>
          <button class="btn buy" id="btn-bid5">JUMP ${money(a.bid + a.increment * 5)}</button>
        </div>
        <p class="tiny muted center">Your cash: ${money(p.cash)} · anti-snipe: bids extend the clock</p>
      </div>`;
    this.$("btn-bid1").onclick = () => this.doBid(a.increment);
    this.$("btn-bid5").onclick = () => this.doBid(a.increment * 5);
    this.auctionTimer = setInterval(() => {
      FlipIt.auctionTick(a);
      const tb = this.$("auc-bid"), tt = this.$("auc-time"), tl = this.$("auc-leader");
      if (tb) tb.textContent = money(a.bid);
      if (tt) tt.textContent = a.timeLeft + "s";
      if (tl) tl.textContent = a.leader;
      if (a.over) {
        this.stopTimers();
        this.renderAuctionEnd(a);
      } else this.renderAuction(a); // re-render rows each tick for leader highlight
    }, 1000);
  },
  doBid(mult) {
    const a = this.auction;
    const r = FlipIt.playerBid(a, a.bid + mult);
    if (r.error === "insufficient") return this.toast("Not enough cash!");
    if (r.error === "too_low") return this.toast("Minimum bid: " + money(r.min));
    this.renderAuction(a);
  },
  renderAuctionEnd(a) {
    const item = FlipIt.getItem(a.itemId);
    const won = a.won;
    this.afterEconomy();
    this.$("deal-area").innerHTML = `
      <div class="card center" style="margin-top:40px">
        <div style="font-size:56px">${won ? "🏆" : "😤"}</div>
        <h2>${won ? "YOU WON!" : "Outbid!"}</h2>
        <p class="muted">${this.esc(item.name)}<br>Winning bid: <b>${money(a.bid)}</b>
        ${won ? `<br>Est. value: ~${money(a.trueValue)}` : ""}</p>
        <button class="btn primary big block" id="btn-next2">${won ? "VIEW INVENTORY →" : "NEXT DEAL →"}</button>
      </div>`;
    this.$("btn-next2").onclick = () => won ? this.nav("inventory") : this.nextDeal();
  },

  /* ================= INVENTORY ================= */
  renderInventory() {
    const p = FlipIt.profile();
    this.$("inv-count").textContent = `(${p.inventory.length})`;
    const box = this.$("inventory-list");
    if (!p.inventory.length) {
      box.innerHTML = `<div class="empty"><div style="font-size:56px">📦</div><p>Nothing stashed yet.<br>Buy a deal and HOLD it to build inventory.</p>
        <button class="btn primary" data-nav="deal">Find a Deal →</button></div>`;
      box.querySelector("[data-nav]").onclick = () => this.nav("deal");
      return;
    }
    box.innerHTML = p.inventory.map(it => {
      const item = FlipIt.getItem(it.itemId);
      const pl = it.value - it.cost;
      return `<div class="inv-item">
        <div class="inv-art" style="${this.catStyle(item.cat)}">${item.emoji}</div>
        <div class="inv-info">
          <div class="n">${this.esc(item.name)}</div>
          <div class="s">Paid ${money(it.cost)} · Now ~${money(it.value)} ·
            <b style="color:${pl >= 0 ? "var(--green)" : "var(--red)"}">${pl >= 0 ? "+" : ""}${money(pl).replace("$-", "-$")}</b></div>
          ${it.pendingOffer ? `<div class="inv-offer">💵 Buyer offers <b>${money(it.pendingOffer)}</b> cash now!
            <button class="btn primary" data-accept="${it.uid}" style="padding:6px 12px;font-size:13px;margin-left:6px">Accept</button></div>` : ""}
        </div>
        <button class="btn primary" data-sell="${it.uid}" style="padding:10px 14px;font-size:14px">SELL</button>
      </div>`;
    }).join("");
    box.querySelectorAll("[data-sell]").forEach(b => b.onclick = () => {
      const r = FlipIt.sellInventory(b.dataset.sell);
      if (r.error) return;
      this.afterEconomy();
      this.toast(`${r.profit >= 0 ? "+" : ""}${money(r.profit).replace("$-", "-$")} on the flip!`);
      this.renderInventory(); this.refresh();
    });
    box.querySelectorAll("[data-accept]").forEach(b => b.onclick = () => {
      const it = p.inventory.find(i => i.uid === b.dataset.accept);
      const price = it.pendingOffer;
      const r = FlipIt.acceptOffer(b.dataset.accept);
      if (r.error) return;
      this.afterEconomy();
      this.toast(`Accepted ${money(price)}!`);
      this.renderInventory(); this.refresh();
    });
  },

  /* ================= CHALLENGES ================= */
  renderChallenges() {
    const p = FlipIt.profile(), d = p.daily, c = d.challenge;
    const pct = Math.min(100, Math.round(100 * c.progress / c.target));
    const fmtP = c.metric === "dailyProfit" || c.metric === "netWorthPeak" ? money(c.progress) : Math.floor(c.progress).toLocaleString();
    const fmtT = c.metric === "dailyProfit" || c.metric === "netWorthPeak" ? money(c.target) : c.target.toLocaleString();
    this.$("challenge-detail").innerHTML = `<div class="card" style="border-color:${c.done ? "var(--green)" : "var(--line)"}">
      <h3>🎯 ${this.esc(c.title)} ${c.done ? "✅" : ""}</h3>
      <p class="muted">${this.esc(c.desc)}</p>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <p><b>${fmtP}</b> / ${fmtT}</p>
      ${c.done ? `<p class="center" style="color:var(--green);font-weight:800">Reward earned: 150 🪙 + 200 XP</p>` : `<p class="tiny muted">Complete before midnight for 150 🪙 + 200 XP.</p>`}
    </div>`;
    const week = [];
    for (let i = 0; i < 7; i++) {
      const done = i < d.loginStreak;
      const isToday = i === Math.min(d.loginStreak, 6) && !d.rewardClaimed;
      week.push(`<div class="login-day ${done ? "done" : ""} ${isToday ? "today" : ""}">
        <div class="d">Day ${i + 1}</div><div>🪙${DAILY_LOGIN_REWARDS[i]}</div></div>`);
    }
    this.$("login-week").innerHTML = week.join("");
  },

  /* ================= LEADERBOARD ================= */
  renderLeaderboard() {
    const p = FlipIt.profile(), st = p.stats;
    const rows = [
      ["💰 Highest net worth", money(Math.max(...p.analytics.filter(a => a.event === "session_start").map(() => 0), FlipIt.netWorth()))],
      ["📈 Lifetime profit", money(st.lifetimeProfit)],
      ["🔥 Best single flip", money(st.bestDeal)],
      ["⚡ Longest win streak", st.bestStreak + " flips"],
      ["🎯 Daily challenge best", p.daily.challenge.done ? "Completed ✅" : money(p.daily.challenge.progress) + " / " + (p.daily.challenge.metric.includes("Profit") || p.daily.challenge.metric === "netWorthPeak" ? money(p.daily.challenge.target) : p.daily.challenge.target)],
      ["⭐ Total XP", p.xp.toLocaleString()],
      ["🤝 Auctions won", st.auctionsWon + " / " + st.auctionsEntered],
      ["🎁 Mystery profits", st.mysteryProfit],
    ];
    // track peak net worth properly
    const peak = Math.max(p.daily.netWorthPeak, FlipIt.netWorth());
    rows[0][1] = money(Math.max(peak, 1000));
    this.$("leaderboard-list").innerHTML = `<div class="card">` + rows.map(r =>
      `<div class="bid-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("") + `</div>`;
  },

  /* ================= STORE ================= */
  renderStore() {
    const p = FlipIt.profile();
    this.$("store-coins").textContent = "🪙 " + p.flipCoins.toLocaleString();
    const kinds = { theme: "🎨 Themes", frame: "🖼️ Profile Frames", badge: "🎖️ Badges", anim: "✨ Animations", conven: "🧰 Convenience" };
    let html = "";
    for (const k of Object.keys(kinds)) {
      const items = STORE_ITEMS.filter(s => s.kind === k);
      html += `<h3 class="subhead">${kinds[k]}</h3>` + items.map(s => {
        const owned = p.owned.includes(s.id);
        const active = (s.kind === "theme" && p.activeTheme === s.css) || (s.kind === "frame" && p.activeFrame === s.css);
        return `<div class="store-item">
          <div class="se">${s.emoji || (s.kind === "theme" ? "🎨" : s.kind === "frame" ? "🖼️" : s.kind === "anim" ? "✨" : "🧰")}</div>
          <div class="si"><div class="sn">${this.esc(s.name)} ${active ? "✅" : ""}</div><div class="sd">${this.esc(s.desc)}</div></div>
          ${owned
            ? (active ? `<span class="tiny muted">Active</span>` : `<button class="btn ghost" data-equip="${s.id}" style="padding:8px 12px;font-size:13px">Equip</button>`)
            : `<div class="center"><div class="price">🪙 ${s.price}</div><button class="btn primary" data-buy="${s.id}" style="padding:8px 12px;font-size:13px;margin-top:4px" ${p.flipCoins < s.price ? "disabled" : ""}>Buy</button></div>`}
        </div>`;
      }).join("");
    }
    this.$("store-list").innerHTML = html;
    this.$("store-list").querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
      const r = FlipIt.buyCosmetic(b.dataset.buy);
      if (r.error === "insufficient") return this.toast("Not enough FlipCoins — earn them from challenges!");
      if (r.ok) { this.toast("Purchased! 🎉"); this.renderStore(); this.refresh(); }
    });
    this.$("store-list").querySelectorAll("[data-equip]").forEach(b => b.onclick = () => {
      FlipIt.setCosmetic(b.dataset.equip);
      this.toast("Equipped ✨"); this.renderStore(); this.refresh();
    });
  },

  /* confetti burst */
  confetti() {
    for (let i = 0; i < 24; i++) {
      const d = document.createElement("div");
      const em = ["🎉", "💰", "✨", "🪙"][i % 4];
      d.textContent = em;
      d.style.cssText = `position:fixed;left:${20 + Math.random() * 60}vw;top:-40px;font-size:26px;z-index:200;pointer-events:none;transition:transform 1.6s ease-in,opacity 1.6s`;
      document.body.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = `translateY(${110}vh) rotate(${Math.random() * 720}deg)`; d.style.opacity = "0"; });
      setTimeout(() => d.remove(), 1800);
    }
  },
};
