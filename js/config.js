/* ============================================================
   FLIP IT — Game Configuration
   Levels, events, challenges, store, achievements, rewards.
   Admin panel can override most of this at runtime.
   ============================================================ */

const LEVELS = [
  { min: 0,        title: "Garage Flipper",  maxAsk: 2000,    desc: "Hustle from the garage." },
  { min: 5000,     title: "Weekend Dealer",  maxAsk: 10000,   desc: "Side hustle getting serious." },
  { min: 25000,    title: "Local Dealer",    maxAsk: 40000,   desc: "Everyone in town knows your name." },
  { min: 100000,   title: "Warehouse Owner", maxAsk: 150000,  desc: "You rent space by the square foot now." },
  { min: 500000,   title: "Regional Dealer", maxAsk: 400000,  desc: "Trucks with your logo on them." },
  { min: 1000000,  title: "Millionaire",     maxAsk: 2000000, desc: "Seven figures. Act like it." },
  { min: 10000000, title: "Mogul",           maxAsk: 10000000,desc: "You move markets." },
];

/* category gating: min level index (0-based) to see these deals often */
const CATEGORY_MIN_LEVEL = { mystery: 0, storage: 0 };
const BIG_DEAL_MIN_LEVEL = 3; // whale items (ask >= 45000) need Warehouse Owner+

const REVEAL_EVENTS = [
  { id:"runs",     text:"IT RUNS! 🔥", sub:"Fired right up. Buyers will pay a premium.", valueMult: 1.15, weight: 6 },
  { id:"rare",     text:"EXTREMELY RARE VERSION 😱", sub:"This is the variant collectors hunt for.", valueMult: 2.2, weight: 2 },
  { id:"damage",   text:"HIDDEN DAMAGE DISCOVERED 😬", sub:"It's worse underneath. Value takes a hit.", valueMult: 0.55, weight: 8 },
  { id:"repair",   text:"REPAIR REQUIRED 🔧", sub:"Fixable, but it'll cost you.", repairPct: 0.12, weight: 8 },
  { id:"collector",text:"A COLLECTOR CONTACTED YOU 📞", sub:"They want it badly. Offer incoming above market.", valueMult: 1.3, weight: 4 },
  { id:"marketup", text:"MARKET PRICE SPIKED 📈", sub:"Demand just jumped. Great timing.", valueMult: 1.25, weight: 4 },
  { id:"cold",     text:"NOBODY WANTS THIS ITEM 🥶", sub:"The market went quiet. Value softens.", valueMult: 0.8, weight: 8 },
  { id:"cashnow",  text:"BUYER OFFERS CASH NOW 💵", sub:"No waiting, no fees — but slightly under market.", valueMult: 0.92, weight: 7 },
  { id:"desperate",text:"SELLER WAS DESPERATE 🙏", sub:"You stole this one. True value is higher.", valueMult: 1.2, weight: 5 },
  { id:"threbuy",  text:"THREE BUYERS INTERESTED 👀", sub:"Bidding war energy. Value climbs.", valueMult: 1.18, weight: 4 },
  { id:"minty",    text:"BETTER THAN DESCRIBED ✨", sub:"Cleaner than it looked. Jackpot.", valueMult: 1.35, weight: 3 },
  { id:"dud",      text:"COMPLETE DUD 💀", sub:"It's basically parts. Ouch.", valueMult: 0.35, weight: 6 },
];

const HOLD_EVENTS = [ // fire on owned items between rounds
  { id:"h_marketup", text:"📈 Market price increased on your %ITEM%.", valueMult: 1.15, weight: 6 },
  { id:"h_offer",    text:"💵 A buyer offers $%PRICE% cash for your %ITEM% right now.", offer: true, weight: 8 },
  { id:"h_damage",   text:"😬 You found an issue with your %ITEM%. Value dips.", valueMult: 0.88, weight: 5 },
  { id:"h_collect",  text:"📞 A collector is asking about your %ITEM%.", valueMult: 1.25, weight: 4 },
  { id:"h_cold",     text:"🥶 Interest cooled on your %ITEM%.", valueMult: 0.9, weight: 5 },
];

/* Daily challenge templates. Target scales with level. */
const CHALLENGE_TEMPLATES = [
  { id:"profit",  title:"Profit Hustle",   desc:t=>`Make $${fmtShort(t)} profit today`, target:l=>[2000,5000,15000,50000,150000,500000,2000000][l], metric:"dailyProfit" },
  { id:"flips",   title:"Volume Dealer",   desc:t=>`Complete ${t} flips today`,            target:l=>[6,8,10,12,15,20,25][l],          metric:"dailyFlips" },
  { id:"risky",   title:"Risk Taker",      desc:t=>`Buy ${t} HIGH-risk items today`,        target:l=>[2,3,3,4,5,6,8][l],              metric:"dailyRiskyBuys" },
  { id:"streak",  title:"Hot Streak",      desc:t=>`Score ${t} profitable flips in a row`,  target:l=>[3,4,5,5,6,7,8][l],              metric:"dailyBestStreak" },
  { id:"grow",    title:"Ten-X Day",       desc:t=>`Turn today's stake into $${fmtShort(t)} net worth`, target:l=>[5000,10000,50000,200000,1000000,3000000,20000000][l], metric:"netWorthPeak" },
];

const DAILY_LOGIN_REWARDS = [50, 75, 100, 150, 200, 300, 500]; // FlipCoins by streak day (caps at 7)

/* Store: cosmetics & convenience, bought with FlipCoins earned in-game.
   NEVER required to play. No randomness, no loot boxes — every listing
   is a defined item. */
const STORE_ITEMS = [
  { id:"theme_neon",    kind:"theme",  name:"Neon Nights Theme",      price: 400, desc:"Electric purple UI theme.", css:"theme-neon" },
  { id:"theme_gold",    kind:"theme",  name:"Mogul Gold Theme",       price: 900, desc:"Gold-trimmed luxury UI.", css:"theme-gold" },
  { id:"theme_forest",  kind:"theme",  name:"Money Forest Theme",     price: 400, desc:"Deep green cash vibes.", css:"theme-forest" },
  { id:"frame_bronze",  kind:"frame",  name:"Bronze Profile Frame",   price: 250, desc:"Bronze ring for your profile.", css:"frame-bronze" },
  { id:"frame_silver",  kind:"frame",  name:"Silver Profile Frame",   price: 500, desc:"Silver ring for your profile.", css:"frame-silver" },
  { id:"frame_diamond", kind:"frame",  name:"Diamond Profile Frame",  price: 1200,desc:"Animated diamond ring.", css:"frame-diamond" },
  { id:"badge_first",   kind:"badge",  name:"First Flip Badge",       price: 100, desc:"Show off your first deal.", emoji:"🌱" },
  { id:"badge_shark",   kind:"badge",  name:"Deal Shark Badge",       price: 600, desc:"For ruthless negotiators.", emoji:"🦈" },
  { id:"badge_whale",   kind:"badge",  name:"Whale Hunter Badge",     price: 1000,desc:"For closers of big deals.", emoji:"🐋" },
  { id:"anim_confetti", kind:"anim",   name:"Confetti Reveal",        price: 350, desc:"Confetti burst on big wins.", css:"anim-confetti" },
  { id:"conv_timer",    kind:"conven", name:"Extra Time (+15s deals)",price: 800, desc:"Deal timer extended to 45s, forever.", effect:"timer15" },
  { id:"conv_intel",    kind:"conven", name:"Insider Intel",          price: 1500,desc:"See exact low estimate on every deal.", effect:"showLow" },
];

const ACHIEVEMENTS = [
  { id:"a_first",    name:"First Flip",      desc:"Complete your first profitable flip.", xp:50,  coins:50,  check:s=>s.stats.profitableSales>=1 },
  { id:"a_ten",      name:"Double Digits",   desc:"Complete 10 flips.",                  xp:100, coins:100, check:s=>s.stats.totalSales>=10 },
  { id:"a_streak5",  name:"On Fire",         desc:"5 profitable flips in a row.",          xp:150, coins:150, check:s=>s.stats.bestStreak>=5 },
  { id:"a_10k",      name:"Five Figures",    desc:"Reach $10,000 net worth.",             xp:150, coins:150, check:s=>FlipIt.netWorth()>=10000 },
  { id:"a_100k",     name:"Six Figures",     desc:"Reach $100,000 net worth.",            xp:300, coins:300, check:s=>FlipIt.netWorth()>=100000 },
  { id:"a_mill",     name:"Millionaire",     desc:"Reach $1,000,000 net worth.",          xp:1000,coins:1000,check:s=>FlipIt.netWorth()>=1000000 },
  { id:"a_whale",    name:"Whale Hunter",    desc:"Buy an item worth $50,000+.",          xp:400, coins:400, check:s=>s.stats.biggestBuy>=50000 },
  { id:"a_auction",  name:"Auction Winner",  desc:"Win your first auction.",              xp:200, coins:200, check:s=>s.stats.auctionsWon>=1 },
  { id:"a_mystery",  name:"Mystery Solved",  desc:"Profit on a mystery box.",             xp:200, coins:200, check:s=>s.stats.mysteryProfit>=1 },
  { id:"a_comeback", name:"Comeback Kid",    desc:"Recover from under $500 to $5,000+.", xp:300, coins:300, check:s=>s.stats.comebackDone },
  { id:"a_dealer",   name:"Century Club",    desc:"Complete 100 flips.",                 xp:500, coins:500, check:s=>s.stats.totalSales>=100 },
];

/* Bidder personalities for auction mode */
const BIDDERS = [
  { name:"Fast Eddie",   emoji:"🧢", aggro:0.9, maxMult:[0.85,1.05] },
  { name:"Collector Kim",emoji:"👓", aggro:0.6, maxMult:[0.9,1.2] },
  { name:"Cautious Carl",emoji:"🧥", aggro:0.35,maxMult:[0.7,0.9] },
  { name:"Whale Wanda",  emoji:"💎", aggro:0.75,maxMult:[1.0,1.35] },
];

/* formatting helpers (used by config templates) */
function fmt(n){ return "$" + Math.round(n).toLocaleString("en-US"); }
function fmtShort(n){
  if (n>=1e6) return (n/1e6).toFixed(n%1e6?1:0)+"M";
  if (n>=1e3) return (n/1e3).toFixed(n%1e3?1:0)+"K";
  return ""+Math.round(n);
}
function money(n){
  const neg = n < 0;
  const a = Math.abs(Math.round(n));
  const s = a>=100000 ? fmtShort(a) : a.toLocaleString("en-US");
  return (neg?"-$":"$")+s;
}
