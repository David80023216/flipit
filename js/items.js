/* ============================================================
   FLIP IT — Item Database
   Separated from game logic on purpose: to add items, just push
   new objects into ITEMS. Required fields are validated at boot.
   price bands: ask drives which net-worth tiers see the item.
   ============================================================ */

const CATEGORIES = {
  cars:          { name: "Cars",                  emoji: "🚗", gradient: "linear-gradient(135deg,#0ea5e9,#1e3a8a)" },
  tools:         { name: "Tools",                 emoji: "🔧", gradient: "linear-gradient(135deg,#f59e0b,#92400e)" },
  heavy:         { name: "Heavy Equipment",       emoji: "🏗️", gradient: "linear-gradient(135deg,#f97316,#7c2d12)" },
  electronics:   { name: "Electronics",           emoji: "📺", gradient: "linear-gradient(135deg,#8b5cf6,#312e81)" },
  sportscards:   { name: "Sports Cards",          emoji: "🃏", gradient: "linear-gradient(135deg,#22c55e,#14532d)" },
  antiques:      { name: "Antiques",              emoji: "🏺", gradient: "linear-gradient(135deg,#a16207,#422006)" },
  furniture:     { name: "Furniture",             emoji: "🛋️", gradient: "linear-gradient(135deg,#d946ef,#701a75)" },
  collectibles:  { name: "Collectibles",          emoji: "🎸", gradient: "linear-gradient(135deg,#ef4444,#7f1d1d)" },
  storage:       { name: "Storage Units",         emoji: "📦", gradient: "linear-gradient(135deg,#64748b,#1e293b)" },
  estate:        { name: "Estate-Sale Finds",     emoji: "🕰️", gradient: "linear-gradient(135deg,#14b8a6,#134e4a)" },
  scrap:         { name: "Scrap",                 emoji: "⚙️",  gradient: "linear-gradient(135deg,#78716c,#1c1917)" },
  construction:  { name: "Construction Equipment",emoji: "🚜", gradient: "linear-gradient(135deg,#eab308,#713f12)" },
  mystery:       { name: "Mystery Boxes",         emoji: "🎁", gradient: "linear-gradient(135deg,#ec4899,#500f28)" },
};

/* cond: Mint | Excellent | Good | Fair | Poor | Unknown | Untested
   risk: LOW | MEDIUM | HIGH
   rarity: Common | Uncommon | Rare | Epic | Legendary                 */

const ITEMS = [
/* ------------------------------ CARS ------------------------------ */
{id:"car01",name:"2004 Honda Civic (high miles)",cat:"cars",ask:1800,low:1200,high:2600,actual:2100,cond:"Fair",risk:"LOW",rarity:"Common",emoji:"🚗",repair:300,buyer:"Commuter buyer",desc:"Runs and drives. Cosmetically rough but mechanically honest."},
{id:"car02",name:"1998 Ford Mustang GT Convertible",cat:"cars",ask:6500,low:4500,high:9500,actual:8200,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"🏎️",repair:0,buyer:"Weekend cruiser",desc:"V8, clean title, new top last year. Summer demand is strong."},
{id:"car03",name:"2011 BMW 335i (needs turbos?)",cat:"cars",ask:5200,low:3000,high:11000,actual:3800,cond:"Unknown",risk:"HIGH",rarity:"Uncommon",emoji:"🚗",repair:2400,buyer:"BMW enthusiast",desc:"Whistles under boost. Could be a hose… or both turbos."},
{id:"car04",name:"1972 Chevy C10 Pickup",cat:"cars",ask:14000,low:12000,high:28000,actual:24000,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🛻",repair:0,buyer:"Classic truck collector",desc:"Patina for days. Small-block runs strong, frame is solid."},
{id:"car05",name:"2016 Tesla Model 3 (salvage title)",cat:"cars",ask:9000,low:6000,high:16000,actual:13500,cond:"Fair",risk:"HIGH",rarity:"Rare",emoji:"🔋",repair:1500,buyer:"EV flipper",desc:"Light front hit, repaired. Battery health 91%. Salvage scares most buyers."},
{id:"car06",name:"1995 Mazda Miata (rust-free)",cat:"cars",ask:4800,low:4000,high:8500,actual:7900,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"🚗",repair:0,buyer:"Track-day hobbyist",desc:"Southern car, zero rust. The answer is always Miata."},
{id:"car07",name:"1969 Camaro RS Project Car",cat:"cars",ask:22000,low:18000,high:55000,actual:47000,cond:"Poor",risk:"HIGH",rarity:"Epic",emoji:"🏁",repair:8000,buyer:"Restoration shop",desc:"Numbers-matching shell. Needs everything, worth a fortune done."},
{id:"car08",name:"2020 Porsche 911 Carrera S",cat:"cars",ask:98000,low:95000,high:125000,actual:118000,cond:"Mint",risk:"LOW",rarity:"Legendary",emoji:"🏎️",repair:0,buyer:"Exotic dealer",desc:"CPO history, 12k miles, sport chrono. Divorce sale, priced to move."},

/* ------------------------------ TOOLS ------------------------------ */
{id:"tool01",name:"DeWalt 20V Tool Lot (8 pieces)",cat:"tools",ask:220,low:180,high:420,actual:380,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🔧",repair:0,buyer:"Contractor",desc:"Drills, saws, batteries. One charger missing."},
{id:"tool02",name:"Snap-On Tool Chest (used)",cat:"tools",ask:1500,low:1200,high:2800,actual:2500,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"🧰",repair:0,buyer:"Mechanic",desc:"KRL series roll cab. Drawers glide like new."},
{id:"tool03",name:"Vintage Stanley Plane Collection",cat:"tools",ask:340,low:200,high:900,actual:760,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"🪚",repair:0,buyer:"Woodworking collector",desc:"12 planes, two are pre-war Bedrock models."},
{id:"tool04",name:"Miller Bobcat Welder/Generator",cat:"tools",ask:2800,low:2200,high:5200,actual:4900,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🔥",repair:400,buyer:"Farm buyer",desc:"Low hours, starts first pull. Leads included."},
{id:"tool05",name:"Pallet of Returned Power Tools",cat:"tools",ask:900,low:500,high:2400,actual:1100,cond:"Untested",risk:"HIGH",rarity:"Common",emoji:"📦",repair:350,buyer:"Flea-market reseller",desc:"Store returns, untested. Some new in box, some parts-only."},
{id:"tool06",name:"Bridgeport Milling Machine",cat:"tools",ask:3200,low:2500,high:7000,actual:6400,cond:"Fair",risk:"MEDIUM",rarity:"Rare",emoji:"🏭",repair:600,buyer:"Machine shop",desc:"Old iron, tight ways. 3-phase — limits buyers but shops pay up."},
{id:"tool07",name:"MAC Tools Diagnostic Scanner",cat:"tools",ask:1100,low:800,high:2200,actual:1950,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"💻",repair:0,buyer:"Independent shop",desc:"Current software subscription through next year."},
{id:"tool08",name:"Blacksmith Anvil (150 lb, wrought)",cat:"tools",ask:650,low:400,high:1400,actual:1250,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"⚒️",repair:0,buyer:"Bladesmith",desc:"Pre-1900 wrought anvil, great rebound. Smiths hunt these."},

/* --------------------------- HEAVY EQUIPMENT --------------------------- */
{id:"heav01",name:"Bobcat S650 Skid Steer",cat:"heavy",ask:24000,low:20000,high:34000,actual:31000,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🚜",repair:1200,buyer:"Landscaper",desc:"2,800 hours, new tires, tight pins and bushings."},
{id:"heav02",name:"Caterpillar D6 Dozer (older)",cat:"heavy",ask:38000,low:25000,high:65000,actual:30000,cond:"Fair",risk:"HIGH",rarity:"Epic",emoji:"🏗️",repair:9000,buyer:"Site contractor",desc:"Undercarriage at 60%. Strong runner, priced under market."},
{id:"heav03",name:"Genie 40ft Boom Lift",cat:"heavy",ask:16000,low:14000,high:26000,actual:23000,cond:"Good",risk:"LOW",rarity:"Rare",emoji:"🏗️",repair:0,buyer:"Rental yard",desc:"Annual inspection current. Rental yards buy these sight unseen."},
{id:"heav04",name:"Kubota Mini Excavator U27",cat:"heavy",ask:21000,low:18000,high:32000,actual:29500,cond:"Excellent",risk:"LOW",rarity:"Rare",emoji:"🚜",repair:0,buyer:"Utility contractor",desc:"1,100 hours, thumb and 3 buckets. Mini ex market is hot."},
{id:"heav05",name:"Non-Running Crane Truck",cat:"heavy",ask:12000,low:8000,high:30000,actual:9500,cond:"Poor",risk:"HIGH",rarity:"Epic",emoji:"🏗️",repair:7000,buyer:"Crane service",desc:"Engine turns but won't fire. Crane itself certified last year."},
{id:"heav06",name:"John Deere 5075E Tractor",cat:"heavy",ask:26000,low:22000,high:36000,actual:33000,cond:"Good",risk:"LOW",rarity:"Rare",emoji:"🚜",repair:0,buyer:"Small farm",desc:"900 hours, loader, always shedded. Green paint sells itself."},

/* ---------------------------- ELECTRONICS ---------------------------- */
{id:"elec01",name:"iPhone 13 Lot (5 phones)",cat:"electronics",ask:900,low:750,high:1500,actual:1350,cond:"Good",risk:"LOW",rarity:"Common",emoji:"📱",repair:0,buyer:"Refurb reseller",desc:"Unlocked, batteries 85%+. One cracked back glass."},
{id:"elec02",name:"MacBook Pro 16\" M1 (2021)",cat:"electronics",ask:1100,low:1000,high:1800,actual:1650,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"💻",repair:0,buyer:"Student/pro buyer",desc:"Apple silicon, 512GB, battery 94%. Box included."},
{id:"elec03",name:"Sony A7III Camera Body",cat:"electronics",ask:950,low:850,high:1500,actual:1400,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"📷",repair:0,buyer:"Photographer",desc:"28k shutter count. Full-frame for crop-sensor money."},
{id:"elec04",name:"Pallet of 4K TVs (returns)",cat:"electronics",ask:1400,low:900,high:3200,actual:2100,cond:"Untested",risk:"HIGH",rarity:"Common",emoji:"📺",repair:400,buyer:"Discount store",desc:"12 TVs, customer returns. Expect 2-3 duds."},
{id:"elec05",name:"DJI Mavic 3 Drone + Fly More",cat:"electronics",ask:1300,low:1200,high:2100,actual:1950,cond:"Mint",risk:"LOW",rarity:"Rare",emoji:"🚁",repair:0,buyer:"Real-estate photographer",desc:"Flown twice, no crashes. All batteries cycle-counted low."},
{id:"elec06",name:"Vintage Marantz Receiver 2270",cat:"electronics",ask:700,low:500,high:1600,actual:1450,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🎛️",repair:180,buyer:"Audiophile",desc:"Recapped last year, warm sound. Silver-face Marantz is blue-chip."},
{id:"elec07",name:"PS5 Disc + 12 Games Bundle",cat:"electronics",ask:380,low:350,high:650,actual:590,cond:"Excellent",risk:"LOW",rarity:"Common",emoji:"🎮",repair:0,buyer:"Gamer",desc:"Holiday bundle split. Games alone cover the ask."},
{id:"elec08",name:"Bitcoin Mining Rig (6 GPU)",cat:"electronics",ask:2200,low:1500,high:4500,actual:1800,cond:"Fair",risk:"HIGH",rarity:"Rare",emoji:"⛏️",repair:0,buyer:"Crypto miner",desc:"RX 580s, loud and hot. Profitable only with cheap power."},

/* ---------------------------- SPORTS CARDS ---------------------------- */
{id:"card01",name:"1989 Upper Deck Ken Griffey Jr. Rookie",cat:"sportscards",ask:120,low:80,high:300,actual:260,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"⚾",repair:0,buyer:"Set collector",desc:"Centering 60/40. The iconic rookie of the junk-wax era."},
{id:"card02",name:"Sealed 1986 Fleer Basketball Wax Box",cat:"sportscards",ask:45000,low:40000,high:90000,actual:82000,cond:"Mint",risk:"MEDIUM",rarity:"Legendary",emoji:"🏀",repair:0,buyer:"High-end investor",desc:"Possible Jordan rookie inside. BBCE authenticated seal."},
{id:"card03",name:"Pokemon 1st Edition Charizard (played)",cat:"sportscards",ask:2800,low:2000,high:8000,actual:3400,cond:"Fair",risk:"MEDIUM",rarity:"Epic",emoji:"🔥",repair:0,buyer:"Pokemon investor",desc:"Heavy play wear. Even beat copies have a floor."},
{id:"card04",name:"Shoebox of 70s Baseball Commons",cat:"sportscards",ask:60,low:30,high:400,actual:180,cond:"Unknown",risk:"HIGH",rarity:"Common",emoji:"📦",repair:0,buyer:"Nostalgia buyer",desc:"Unsearched since 1982. Stars possible, likely commons."},
{id:"card05",name:"Luka Doncic Prizm Silver Rookie PSA 10",cat:"sportscards",ask:1500,low:1200,high:3200,actual:2900,cond:"Mint",risk:"LOW",rarity:"Rare",emoji:"🏀",repair:0,buyer:"Modern collector",desc:"Graded gem mint. Liquid — sells within a day."},
{id:"card06",name:"1952 Topps Mickey Mantle (reprint?)",cat:"sportscards",ask:400,low:50,high:5000,actual:90,cond:"Unknown",risk:"HIGH",rarity:"Epic",emoji:"⚾",repair:0,buyer:"Dreamer",desc:"Looks right at arm's length. 99% are reprints. Is this the 1%?"},
{id:"card07",name:"Tom Brady Contenders Auto Rookie",cat:"sportscards",ask:95000,low:80000,high:180000,actual:165000,cond:"Mint",risk:"LOW",rarity:"Legendary",emoji:"🏈",repair:0,buyer:"GOAT collector",desc:"On-card auto, BGS 9. The football card blue chip."},
{id:"card08",name:"Unopened 2003 Topps Chrome Football Box",cat:"sportscards",ask:2200,low:1800,high:6000,actual:5400,cond:"Mint",risk:"MEDIUM",rarity:"Epic",emoji:"🏈",repair:0,buyer:"Box breaker",desc:"Rookie class loaded. Sealed product only goes up."},

/* ------------------------------ ANTIQUES ------------------------------ */
{id:"ant01",name:"Victorian Oak Roll-Top Desk",cat:"antiques",ask:450,low:300,high:1100,actual:950,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"🪑",repair:120,buyer:"Home-office buyer",desc:"All tambours work. Needs polish, structurally sound."},
{id:"ant02",name:"Tiffany-Style Stained Glass Lamp",cat:"antiques",ask:280,low:150,high:900,actual:720,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"💡",repair:0,buyer:"Decor buyer",desc:"Repro or period? The patina says old. Wiring is new."},
{id:"ant03",name:"Civil War Era Rifle (non-firing)",cat:"antiques",ask:900,low:600,high:2400,actual:2100,cond:"Fair",risk:"MEDIUM",rarity:"Rare",emoji:"🏛️",repair:0,buyer:"Militaria collector",desc:"1863 Springfield, all matching. Wall-hanger condition."},
{id:"ant04",name:"Roseville Pottery Vase",cat:"antiques",ask:150,low:100,high:600,actual:520,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"🏺",repair:0,buyer:"Pottery collector",desc:"Futura pattern, marked. No chips, crazing, or repairs."},
{id:"ant05",name:"Barnhouse Weathervane (copper)",cat:"antiques",ask:1200,low:800,high:3000,actual:2600,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🐓",repair:0,buyer:"Folk-art dealer",desc:"Full-bodied rooster, verdigris. 19th century, guaranteed old."},
{id:"ant06",name:"Steinway Upright Piano (1910)",cat:"antiques",ask:800,low:500,high:4000,actual:900,cond:"Fair",risk:"HIGH",rarity:"Rare",emoji:"🎹",repair:2500,buyer:"Almost nobody",desc:"Beautiful cabinet, dead action. Moving it costs $600 alone."},
{id:"ant07",name:"Rolex Submariner 5513 (1978)",cat:"antiques",ask:9500,low:9000,high:18000,actual:16500,cond:"Excellent",risk:"LOW",rarity:"Legendary",emoji:"⌚",repair:0,buyer:"Watch dealer",desc:"Unpolished case, original dial. Box and papers."},
{id:"ant08",name:"Box Lot: Costume Jewelry",cat:"antiques",ask:40,low:20,high:500,actual:320,cond:"Unknown",risk:"HIGH",rarity:"Common",emoji:"💍",repair:0,buyer:"Estate liquidator",desc:"Tangled mess. One piece tested 14k — the rest unknown."},

/* ------------------------------ FURNITURE ------------------------------ */
{id:"fur01",name:"Mid-Century Teak Credenza",cat:"furniture",ask:600,low:450,high:1400,actual:1250,cond:"Good",risk:"LOW",rarity:"Uncommon",emoji:"🛋️",repair:80,buyer:"MCM flipper",desc:"Danish modern, dovetailed drawers. Light sun fade on top."},
{id:"fur02",name:"Herman Miller Eames Lounge Chair",cat:"furniture",ask:2800,low:2500,high:6000,actual:5400,cond:"Excellent",risk:"LOW",rarity:"Epic",emoji:"🪑",repair:0,buyer:"Design buyer",desc:"Rosewood veneer, all labels. The chair everyone wants."},
{id:"fur03",name:"Leather Sectional (pet home)",cat:"furniture",ask:350,low:200,high:900,actual:280,cond:"Fair",risk:"MEDIUM",rarity:"Common",emoji:"🛋️",repair:150,buyer:"First-apartment buyer",desc:"Solid frame, smells like dog. Leather cleaner does wonders."},
{id:"fur04",name:"Farmhouse Dining Set (table + 6)",cat:"furniture",ask:500,low:400,high:1100,actual:980,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🍽️",repair:0,buyer:"Young family",desc:"Pine, sturdy. Farmhouse style still moves fast."},
{id:"fur05",name:"Art Deco Bar Cabinet",cat:"furniture",ask:750,low:500,high:2000,actual:1750,cond:"Excellent",risk:"MEDIUM",rarity:"Rare",emoji:"🍸",repair:0,buyer:"Cocktail enthusiast",desc:"Mirrored interior, original glass. Deco is heating up."},
{id:"fur06",name:"IKEA Lot: 3 Dressers + Bed",cat:"furniture",ask:120,low:80,high:350,actual:300,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🛏️",repair:0,buyer:"College student",desc:"Malm everything. Sells in hours near campus."},
{id:"fur07",name:"Chesterfield Sofa (vintage)",cat:"furniture",ask:900,low:700,high:2400,actual:2100,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🛋️",repair:200,buyer:"Moody-interior buyer",desc:"Deep buttoning, broken in perfectly. Smells like a library."},

/* ---------------------------- COLLECTIBLES ---------------------------- */
{id:"col01",name:"Funko Pop Lot (40 figures)",cat:"collectibles",ask:200,low:150,high:600,actual:480,cond:"Good",risk:"MEDIUM",rarity:"Common",emoji:"🧸",repair:0,buyer:"Funko trader",desc:"Mostly commons, 3 chases hiding in the back."},
{id:"col02",name:"First-Edition Comic Longbox",cat:"collectibles",ask:800,low:500,high:3500,actual:2900,cond:"Unknown",risk:"HIGH",rarity:"Rare",emoji:"💥",repair:0,buyer:"Comic dealer",desc:"Bronze-age books, ungraded. Keys possible in the middle."},
{id:"col03",name:"Sealed LEGO UCS Millennium Falcon",cat:"collectibles",ask:650,low:600,high:1100,actual:980,cond:"Mint",risk:"LOW",rarity:"Epic",emoji:"🧱",repair:0,buyer:"AFOL collector",desc:"Retired set, box crisp. Sealed LEGO is money in the bank."},
{id:"col04",name:"Vinyl Record Collection (300 LPs)",cat:"collectibles",ask:450,low:300,high:1800,actual:1500,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"💿",repair:0,buyer:"Record store",desc:"Classic rock heavy. A few original pressings carry the lot."},
{id:"col05",name:"Grail Sneaker: Jordan 1 '85 OG",cat:"collectibles",ask:3200,low:2500,high:9000,actual:7800,cond:"Excellent",risk:"MEDIUM",rarity:"Epic",emoji:"👟",repair:0,buyer:"Sneakerhead",desc:"Deadstock, box and laces. Grails don't sit long."},
{id:"col06",name:"Beanie Baby Tote (princess Di bear?)",cat:"collectibles",ask:75,low:30,high:800,actual:120,cond:"Unknown",risk:"HIGH",rarity:"Common",emoji:"🧸",repair:0,buyer:"Nostalgia hunter",desc:"Attic find. The rare ones need specific tags — check carefully."},
{id:"col07",name:"Signed Guitar (local legend)",cat:"collectibles",ask:500,low:300,high:2500,actual:420,cond:"Good",risk:"HIGH",rarity:"Rare",emoji:"🎸",repair:0,buyer:"Bar owner",desc:"Great player, signature unverified. Decor value is real."},
{id:"col08",name:"Star Wars Kenner Lot (1978-83)",cat:"collectibles",ask:1100,low:800,high:4000,actual:3600,cond:"Good",risk:"MEDIUM",rarity:"Epic",emoji:"🤖",repair:0,buyer:"Vintage toy dealer",desc:"48 figures, weapons mostly present. Vinyl cape Jawa? Check."},

/* ---------------------------- STORAGE UNITS ---------------------------- */
{id:"sto01",name:"10x10 Unit — Furniture Visible",cat:"storage",ask:400,low:200,high:1500,actual:1200,cond:"Unknown",risk:"MEDIUM",rarity:"Common",emoji:"📦",repair:0,buyer:"Furniture flipper",desc:"Couches and boxes from the door. Clean-looking unit."},
{id:"sto02",name:"10x20 Unit — Contractor's Unit",cat:"storage",ask:1500,low:800,high:5000,actual:4400,cond:"Unknown",risk:"MEDIUM",rarity:"Rare",emoji:"🔧",repair:0,buyer:"Tool reseller",desc:"Tool chests, ladders, spools of wire. Someone's livelihood in here."},
{id:"sto03",name:"5x5 Unit — Boxes Only",cat:"storage",ask:150,low:50,high:900,actual:180,cond:"Unknown",risk:"HIGH",rarity:"Common",emoji:"📦",repair:0,buyer:"Curious bidder",desc:"Small, stacked to the ceiling. Could be files. Could be gold."},
{id:"sto04",name:"10x30 Unit — Business Inventory",cat:"storage",ask:3200,low:2000,high:12000,actual:10500,cond:"Unknown",risk:"MEDIUM",rarity:"Epic",emoji:"🏬",repair:0,buyer:"Liquidator",desc:"Shelved retail stock, looks like a closed boutique. Manifest unknown."},
{id:"sto05",name:"Climate Unit — Antiques Peek",cat:"storage",ask:2200,low:1200,high:8000,actual:1800,cond:"Unknown",risk:"HIGH",rarity:"Rare",emoji:"🏺",repair:0,buyer:"Antique dealer",desc:"Furniture under blankets. One peek showed water stains."},
{id:"sto06",name:"Garage Unit — Car Under Tarp",cat:"storage",ask:2800,low:1500,high:15000,actual:12500,cond:"Unknown",risk:"HIGH",rarity:"Epic",emoji:"🚗",repair:1500,buyer:"Barn-find hunter",desc:"Tarped shape screams classic. Could be a Camaro. Could be a kit car."},

/* --------------------------- ESTATE-SALE FINDS --------------------------- */
{id:"est01",name:"Jewelry Box From Estate",cat:"estate",ask:300,low:150,high:2000,actual:1750,cond:"Unknown",risk:"HIGH",rarity:"Uncommon",emoji:"💎",repair:0,buyer:"Gold buyer",desc:"Family selling fast. Heavy pieces — test everything."},
{id:"est02",name:"Garage Full of Fishing Gear",cat:"estate",ask:250,low:180,high:900,actual:780,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🎣",repair:0,buyer:"Tackle flipper",desc:"Rods, reels, tackle boxes. Shimano reels alone worth the ask."},
{id:"est03",name:"Basement Workshop Contents",cat:"estate",ask:600,low:400,high:2200,actual:1950,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"🔧",repair:0,buyer:"Tool collector",desc:"Machinist's estate. Micrometers, indicators, Kennedy boxes."},
{id:"est04",name:"Attic: Vintage Clothing Rack",cat:"estate",ask:350,low:200,high:1600,actual:1400,cond:"Good",risk:"MEDIUM",rarity:"Uncommon",emoji:"👗",repair:0,buyer:"Vintage seller",desc:"70s-90s band tees and denim. Single-stitch gold in here."},
{id:"est05",name:"Whole Library: 2,000 Books",cat:"estate",ask:200,low:100,high:1200,actual:350,cond:"Good",risk:"MEDIUM",rarity:"Common",emoji:"📚",repair:0,buyer:"Book scout",desc:"Professor's library. First editions possible, mostly reading copies."},
{id:"est06",name:"Coin Collection in Whitman Folders",cat:"estate",ask:800,low:500,high:4000,actual:3600,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🪙",repair:0,buyer:"Coin dealer",desc:"Albums nearly complete. Key dates present — check for cleaning."},
{id:"est07",name:"Deceased Watchmaker's Bench",cat:"estate",ask:1500,low:900,high:6000,actual:5200,cond:"Unknown",risk:"HIGH",rarity:"Epic",emoji:"⌚",repair:0,buyer:"Horologist",desc:"Parts drawers, movements, tools. Knowledge required to cherry-pick."},

/* ------------------------------- SCRAP ------------------------------- */
{id:"scr01",name:"Copper Wire Lot (400 lbs)",cat:"scrap",ask:900,low:800,high:1400,actual:1280,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🔶",repair:0,buyer:"Scrap yard",desc:"Bare bright. Weighs honest, price tracks copper daily."},
{id:"scr02",name:"Catalytic Converters (12 units)",cat:"scrap",ask:1100,low:700,high:2600,actual:2300,cond:"Unknown",risk:"MEDIUM",rarity:"Uncommon",emoji:"🚗",repair:0,buyer:"Core buyer",desc:"Mixed OEM. Have paperwork — buyers ask questions now."},
{id:"scr03",name:"Aluminum Rims (40 wheels)",cat:"scrap",ask:500,low:400,high:900,actual:820,cond:"Fair",risk:"LOW",rarity:"Common",emoji:"⭕",repair:0,buyer:"Wheel flipper",desc:"Scrap floor is high, and 6 are resellable as sets."},
{id:"scr04",name:"Demo Debris: 'Just Metal'",cat:"scrap",ask:200,low:100,high:700,actual:150,cond:"Poor",risk:"HIGH",rarity:"Common",emoji:"🏚️",repair:0,buyer:"Nobody",desc:"Mostly steel, some trash mixed in. Yard might reject the load."},
{id:"scr05",name:"Electric Motors (30 units)",cat:"scrap",ask:650,low:500,high:1300,actual:1150,cond:"Fair",risk:"LOW",rarity:"Uncommon",emoji:"⚙️",repair:0,buyer:"Motor rebuilder",desc:"Sealed units from a plant closure. Copper inside is the play."},
{id:"scr06",name:"Brass Fixtures From Demolition",cat:"scrap",ask:380,low:300,high:900,actual:800,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🚰",repair:0,buyer:"Scrap yard",desc:"Doors, handles, valves. Brass pays triple steel."},

/* ------------------------- CONSTRUCTION EQUIPMENT ------------------------- */
{id:"con01",name:"Scissor Lift 19ft (electric)",cat:"construction",ask:5500,low:4500,high:9500,actual:8800,cond:"Good",risk:"LOW",rarity:"Uncommon",emoji:"🏗️",repair:300,buyer:"Rental company",desc:"New batteries, passes inspection. Bread-and-butter rental unit."},
{id:"con02",name:"Plate Compactor + Saws",cat:"construction",ask:900,low:700,high:1800,actual:1600,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🔨",repair:0,buyer:"Paver contractor",desc:"Wacker plate, two cutoff saws. Ready to work tomorrow."},
{id:"con03",name:"Dump Trailer 14ft",cat:"construction",ask:6800,low:5500,high:11000,actual:10200,cond:"Excellent",risk:"LOW",rarity:"Rare",emoji:"🚛",repair:0,buyer:"Hauler",desc:"Tandem axle, scissor hoist, new tarp. Trailers hold value."},
{id:"con04",name:"Scaffolding Set (3 tiers)",cat:"construction",ask:1200,low:900,high:2400,actual:2100,cond:"Good",risk:"LOW",rarity:"Common",emoji:"🪜",repair:0,buyer:"Mason",desc:"Frames, planks, braces. Masons always need more."},
{id:"con05",name:"Diesel Air Compressor (towable)",cat:"construction",ask:3200,low:2500,high:6000,actual:2800,cond:"Fair",risk:"MEDIUM",rarity:"Uncommon",emoji:"💨",repair:800,buyer:"Site foreman",desc:"Runs but leaks air at the fittings. Fixable afternoon job."},
{id:"con06",name:"Excavator Attachments Lot",cat:"construction",ask:2400,low:1800,high:5200,actual:4700,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"🦾",repair:0,buyer:"Excavation company",desc:"Buckets, ripper, hydraulic thumb. Fits 5-ton class."},
{id:"con07",name:"Tower Light Plants (2)",cat:"construction",ask:1800,low:1400,high:3600,actual:3300,cond:"Good",risk:"LOW",rarity:"Uncommon",emoji:"💡",repair:0,buyer:"Event company",desc:"Kubota engines, low hours. Events and night jobs need these."},

/* ---------------------------- MYSTERY BOXES ---------------------------- */
{id:"mys01",name:"Amazon Returns Box (unopened)",cat:"mystery",ask:120,low:60,high:600,actual:420,cond:"Unknown",risk:"HIGH",rarity:"Common",emoji:"🎁",repair:0,buyer:"Mystery hunter",desc:"Sealed gaylord. Weight feels like electronics."},
{id:"mys02",name:"Abandoned Safe (locked)",cat:"mystery",ask:500,low:100,high:5000,actual:180,cond:"Unknown",risk:"HIGH",rarity:"Rare",emoji:"🔐",repair:200,buyer:"Locksmith",desc:"2-hour fire safe, combo lost. Drilling costs $200."},
{id:"mys03",name:"Pallet: 'High-Value Returns'",cat:"mystery",ask:1800,low:900,high:8000,actual:6900,cond:"Unknown",risk:"HIGH",rarity:"Epic",emoji:"🎁",repair:0,buyer:"Liquidator",desc:"Manifest says drones and cameras. Manifests lie sometimes."},
{id:"mys04",name:"Storage Locker: No Peeking",cat:"mystery",ask:800,low:300,high:4000,actual:900,cond:"Unknown",risk:"HIGH",rarity:"Uncommon",emoji:"🚪",repair:0,buyer:"Gambler",desc:"Blind auction rules. Smells like old paper."},
{id:"mys05",name:"Estate Mystery Crate",cat:"mystery",ask:350,low:150,high:2500,actual:2100,cond:"Unknown",risk:"HIGH",rarity:"Rare",emoji:"📦",repair:0,buyer:"Picker",desc:"Nailed shut since the 60s. Stenciled 'FRAGILE — LAB'."},

/* ------------------------- BIG TICKET / WHALES ------------------------- */
{id:"car09",name:"1987 John Deere Riding Mower",cat:"construction",ask:450,low:300,high:1200,actual:1050,cond:"Unknown",risk:"HIGH",rarity:"Common",emoji:"🚜",repair:150,buyer:"Homeowner",desc:"Sat 3 years. If it runs, it's worth double. If not, parts."},
{id:"whl01",name:"1957 Chevy Bel Air Restomod",cat:"cars",ask:65000,low:55000,high:120000,actual:108000,cond:"Excellent",risk:"MEDIUM",rarity:"Legendary",emoji:"🏁",repair:0,buyer:"Collector",desc:"LS swap, pro touring build. Magazine-featured."},
{id:"whl02",name:"Commercial Lot (foreclosure)",cat:"estate",ask:180000,low:150000,high:400000,actual:340000,cond:"Fair",risk:"HIGH",rarity:"Legendary",emoji:"🏢",repair:25000,buyer:"Developer",desc:"Zoned commercial, needs environmental sign-off. Huge upside."},
{id:"whl03",name:"Restaurant Equipment Package",cat:"construction",ask:45000,low:35000,high:95000,actual:82000,cond:"Good",risk:"MEDIUM",rarity:"Epic",emoji:"🍳",repair:0,buyer:"New restaurateur",desc:"Full line from a closed bistro. Walk-in cooler included."},
{id:"whl04",name:"Semi Truck (sleeper, low miles)",cat:"heavy",ask:68000,low:60000,high:110000,actual:99000,cond:"Excellent",risk:"LOW",rarity:"Epic",emoji:"🚛",repair:0,buyer:"Owner-operator",desc:"380k miles, APU, fresh rubber. Owner-ops pay cash."},
{id:"whl05",name:"Apartment Cleanout (30 units)",cat:"estate",ask:25000,low:15000,high:80000,actual:62000,cond:"Unknown",risk:"HIGH",rarity:"Epic",emoji:"🏘️",repair:0,buyer:"Liquidation crew",desc:"Eviction cleanouts, one contract. Labor-heavy, goldmine potential."},
{id:"card09",name:"Michael Jordan Fleer Rookie (raw)",cat:"sportscards",ask:8500,low:6000,high:20000,actual:15000,cond:"Excellent",risk:"MEDIUM",rarity:"Epic",emoji:"🏀",repair:0,buyer:"Jordan collector",desc:"Raw but pack-fresh. Grade it and double up — or don't."},
{id:"card10",name:"Ohtani Bowman Chrome Auto",cat:"sportscards",ask:2200,low:1800,high:5000,actual:4200,cond:"Mint",risk:"LOW",rarity:"Rare",emoji:"⚾",repair:0,buyer:"Modern investor",desc:"Two-way superstar. Autos this clean don't sit."},
{id:"elec09",name:"Roland TR-808 Drum Machine",cat:"electronics",ask:3200,low:2800,high:6000,actual:5200,cond:"Good",risk:"MEDIUM",rarity:"Epic",emoji:"🎹",repair:250,buyer:"Music producer",desc:"The hip-hop holy grail. Original, recently serviced."},
{id:"elec10",name:"iMac Pro 128GB (2017)",cat:"electronics",ask:900,low:800,high:1600,actual:1400,cond:"Good",risk:"LOW",rarity:"Uncommon",emoji:"🖥️",repair:0,buyer:"Video editor",desc:"Still a beast for editing. Boxed with keyboard and mouse."},
{id:"col09",name:"Seiko 6139 'Pogue' Chronograph",cat:"collectibles",ask:1800,low:1400,high:3800,actual:3300,cond:"Good",risk:"MEDIUM",rarity:"Rare",emoji:"⌚",repair:200,buyer:"Watch collector",desc:"First auto chrono in space. Original dial, honest wear."},
{id:"col10",name:"Kenner Millennium Falcon (boxed)",cat:"collectibles",ask:1400,low:1000,high:3500,actual:2900,cond:"Good",risk:"MEDIUM",rarity:"Epic",emoji:"🚀",repair:0,buyer:"Vintage toy dealer",desc:"Box has shelf wear, ship is complete with insert."},
{id:"fur08",name:"Baker Cherry Dining Table",cat:"furniture",ask:1100,low:800,high:2600,actual:2200,cond:"Excellent",risk:"LOW",rarity:"Rare",emoji:"🍽️",repair:0,buyer:"Estate buyer",desc:"High-end maker, barely used. These were $8k new."},
{id:"tool09",name:"Festool Track Saw Kit",cat:"tools",ask:450,low:400,high:800,actual:700,cond:"Excellent",risk:"LOW",rarity:"Uncommon",emoji:"🪚",repair:0,buyer:"Finish carpenter",desc:"The green kool-aid. Holds value like gold."},
];

/* quick lookup + validation helpers (logic lives in engine.js) */
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const REQUIRED_ITEM_FIELDS = ["id","name","cat","ask","low","high","actual","cond","risk","desc","rarity","emoji","buyer"];
function validateItems() {
  const errs = [];
  const seen = new Set();
  for (const it of ITEMS) {
    for (const f of REQUIRED_ITEM_FIELDS) if (it[f] === undefined || it[f] === null) errs.push(`${it.id||"?"}: missing ${f}`);
    if (seen.has(it.id)) errs.push(`${it.id}: duplicate id`);
    seen.add(it.id);
    if (!CATEGORIES[it.cat]) errs.push(`${it.id}: bad category ${it.cat}`);
    if (!(it.ask > 0 && it.low > 0 && it.high >= it.low)) errs.push(`${it.id}: bad prices`);
  }
  return errs;
}
