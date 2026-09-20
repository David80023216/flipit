/* Headless integration test for FLIP IT.
   Loads items.js + config.js + engine.js into one scope (no DOM),
   then plays the full game loop with two strategies and asserts
   every invariant. Run: node test/simulate.js */
"use strict";
const fs = require("fs");
const path = require("path");
console.debug = () => {}; // silence analytics noise in test output

const root = path.join(__dirname, "..");
const src = ["js/items.js", "js/config.js", "js/engine.js"]
  .map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
const load = new Function(src + `
; return { FlipIt, Analytics, Store, ITEMS, CATEGORIES, LEVELS, REVEAL_EVENTS,
           STORE_ITEMS, ACHIEVEMENTS, CHALLENGE_TEMPLATES, validateItems, money, fmtShort, todayKey };`);
const G = load();
const { FlipIt, ITEMS, LEVELS, STORE_ITEMS, ACHIEVEMENTS, validateItems, todayKey } = G;

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error("  FAIL:", msg); }
}
function section(s) { console.log("\n== " + s + " =="); }

/* ---------- 1. data integrity ---------- */
section("data integrity");
const errs = validateItems();
assert(errs.length === 0, "validateItems errors: " + JSON.stringify(errs.slice(0, 5)));
assert(ITEMS.length >= 100, "need 100+ items, have " + ITEMS.length);
console.log("  items:", ITEMS.length, "| categories:", Object.keys(G.CATEGORIES).length);

/* ---------- 2. profile + save/load ---------- */
section("profiles & persistence");
FlipIt.boot();
let r = FlipIt.createProfile("Tester");
assert(r.ok, "create profile");
assert(FlipIt.profile().cash === 1000, "starts with $1000");
const exported = FlipIt.exportData();
FlipIt.resetAll();
assert(FlipIt.listProfiles().length === 0, "reset clears");
FlipIt.importData(exported);
FlipIt.switchProfile("Tester");
assert(FlipIt.profile().cash === 1000, "import restores");

/* ---------- 3. full game loop simulation ---------- */
section("game loop (400 rounds, smart strategy)");
function playRounds(n, strategy) {
  let buys = 0, passes = 0, sales = 0, profitSales = 0, auctions = 0, auctionWins = 0;
  let prevLvl = FlipIt.levelIndex();
  for (let i = 0; i < n; i++) {
    const p = FlipIt.profile();
    // occasional auction instead of a deal
    if (FlipIt.maybeAuction() && p.cash > 500) {
      const ar = FlipIt.startAuction();
      if (!ar.error) {
        auctions++;
        const a = ar.auction;
        let guard = 0;
        while (!a.over && guard++ < 120) {
          // simple strategy: bid up to 95% of true value
          if (a.leader !== "You" && a.bid < a.trueValue * 0.95 && a.bid + a.increment <= p.cash) {
            FlipIt.playerBid(a, a.bid + a.increment);
          }
          FlipIt.auctionTick(a);
        }
        assert(a.over, "auction ends");
        if (a.won) auctionWins++;
        assert(p.cash >= 0, "cash negative after auction");
        continue;
      }
    }
    const dr = FlipIt.newDeal();
    assert(!dr.error, "newDeal ok (got " + dr.error + ")");
    if (dr.error) continue;
    const d = dr.deal;
    assert(d.ask > 0 && d.trueValue > 0, "deal has prices");
    assert(d.timeLeft === 30 || d.timeLeft === 45, "deal timer set");
    const want = strategy === "smart"
      ? (d.type === "mystery" ? true : d.ask <= d.low * 1.05)
      : true;
    if (!want) { FlipIt.decide(d, "pass"); passes++; continue; }
    const br = FlipIt.decide(d, "buy");
    if (br.error === "insufficient") { passes++; continue; }
    assert(br.result === "bought", "buy works");
    buys++;
    const rev = br.reveal;
    assert(rev.value > 0, "reveal value positive");
    assert(typeof rev.profit === "number", "profit numeric");
    // sell 70%, hold 30%
    if (Math.random() < 0.7) {
      const lvlBefore = FlipIt.levelIndex();
      const sr = FlipIt.resolveReveal(rev, "sell");
      assert(sr.result === "sold", "sell works");
      sales++;
      if (sr.profit > 0) profitSales++;
      FlipIt.checkLevelUp(lvlBefore);
    } else {
      const hr = FlipIt.resolveReveal(rev, "hold");
      assert(hr.result === "held", "hold works");
    }
    // sometimes sell from inventory
    if (p.inventory.length && Math.random() < 0.4) {
      const it = p.inventory[Math.floor(Math.random() * p.inventory.length)];
      const sr = FlipIt.sellInventory(it.uid);
      assert(sr.result === "sold", "inventory sell works");
      sales++;
      if (sr.profit > 0) profitSales++;
    }
    // hold events fire between rounds
    FlipIt.maybeHoldEvent();
    assert(p.cash >= 0 && isFinite(p.cash), "cash sane, round " + i);
    assert(FlipIt.netWorth() >= 0, "net worth sane");
    prevLvl = FlipIt.levelIndex();
  }
  return { buys, passes, sales, profitSales, auctions, auctionWins };
}

const smart = playRounds(400, "smart");
const p1 = FlipIt.profile();
console.log("  smart: buys", smart.buys, "| passes", smart.passes, "| sales", smart.sales,
  "| win rate", (100 * smart.profitSales / Math.max(1, smart.sales)).toFixed(1) + "%",
  "| auctions", smart.auctions + " (won " + smart.auctionWins + ")");
console.log("  cash", Math.round(p1.cash), "| net worth", Math.round(FlipIt.netWorth()),
  "| level", LEVELS[FlipIt.levelIndex()].title, "| xp", p1.xp);

/* ---------- 4. always-buy baseline (should do worse) ---------- */
section("baseline: always-buy (200 rounds, fresh profile)");
FlipIt.createProfile("Yolo");
FlipIt.switchProfile("Yolo");
const yolo = playRounds(200, "yolo");
const p2 = FlipIt.profile();
const yoloWR = 100 * yolo.profitSales / Math.max(1, yolo.sales);
console.log("  yolo: buys", yolo.buys, "| win rate", yoloWR.toFixed(1) + "%",
  "| net worth", Math.round(FlipIt.netWorth()));
assert(yoloWR < 100, "not every buy wins (risk is real)");
assert(yolo.sales > 50, "yolo played enough rounds");

/* ---------- 5. systems: login, challenge, store, achievements ---------- */
section("systems");
FlipIt.switchProfile("Tester");
const p = FlipIt.profile();
const login = FlipIt.claimDailyLogin();
assert(login.ok && login.reward > 0, "daily login reward: " + JSON.stringify(login));
assert(FlipIt.claimDailyLogin().error === "claimed", "login reward once per day");
assert(p.daily.challenge && p.daily.challenge.target > 0, "daily challenge generated");
console.log("  challenge:", p.daily.challenge.title, "-", p.daily.challenge.desc);
p.flipCoins += 5000;
const buy1 = FlipIt.buyCosmetic("theme_neon");
assert(buy1.ok && p.activeTheme === "theme-neon", "store purchase + auto-equip theme");
assert(FlipIt.buyCosmetic("theme_neon").error === "owned", "no double-buy");
const achCount = Object.keys(p.achievements).length;
console.log("  achievements unlocked:", achCount + "/" + ACHIEVEMENTS.length);
assert(achCount > 0, "achievements fire during play");
const hustle = FlipIt.sideHustle();
console.log("  side hustle when not broke:", hustle.error || "ok");
// broke path
p.cash = 10; p.inventory = [];
const hustle2 = FlipIt.sideHustle();
assert(hustle2.ok && p.cash === 160, "side hustle rescues broke player");

/* ---------- 6. admin ---------- */
section("admin");
FlipIt.adminSetItem("car01", { ask: 1 });
assert(FlipIt.getItem("car01").ask === 1, "admin override applies");
FlipIt.adminDeleteItem("car01");
assert(FlipIt.getItem("car01") === null, "admin hide applies");
assert(!FlipIt.liveItems().some(i => i.id === "car01"), "hidden item excluded from deals");
FlipIt.adminRestoreItem("car01");
assert(FlipIt.getItem("car01").ask === 1800, "admin restore works");
const addR = FlipIt.adminAddItem({ id: "t_custom1", name: "Test Widget", cat: "tools", ask: 100, low: 80, high: 150,
  actual: 120, cond: "Good", risk: "LOW", desc: "x", rarity: "Common", emoji: "🔧", repair: 0, buyer: "x" });
assert(addR.ok && FlipIt.getItem("t_custom1"), "admin add works");

/* ---------- 7. balance report ---------- */
section("balance report (fresh sim, 600 smart rounds)");
FlipIt.createProfile("Balance");
FlipIt.switchProfile("Balance");
const bal = playRounds(600, "smart");
const pb = FlipIt.profile();
const wr = 100 * bal.profitSales / Math.max(1, bal.sales);
console.log("  win rate:", wr.toFixed(1) + "%");
console.log("  final net worth:", Math.round(FlipIt.netWorth()), "| level:", LEVELS[FlipIt.levelIndex()].title);
console.log("  lifetime profit:", Math.round(pb.stats.lifetimeProfit),
  "| best deal:", Math.round(pb.stats.bestDeal), "| worst deal:", Math.round(pb.stats.worstDeal));
console.log("  best streak:", pb.stats.bestStreak, "| inventory:", pb.inventory.length);
assert(wr > 40 && wr < 85, "win rate in believable band, got " + wr.toFixed(1));
assert(pb.stats.worstDeal < 0, "losses happen");
assert(pb.stats.bestDeal > 0, "wins happen");

console.log(failures === 0 ? "\nALL TESTS PASSED ✅" : "\n" + failures + " FAILURES ❌");
process.exit(failures === 0 ? 0 : 1);
