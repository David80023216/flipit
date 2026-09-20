# 🔄 FLIP IT — Buy Low. Sell High.

A complete, mobile-first browser game. Start with **$1,000** in fictional cash and flip your way to **$1,000,000+** by buying and reselling items — cars, tools, heavy equipment, sports cards, antiques, storage units, mystery boxes and more.

**Play it:** open `index.html` in any modern browser (or deploy the folder to any static host).

## The game loop

1. **Find a deal** — an item appears with asking price, estimated value range, condition, risk level and a countdown timer.
2. **BUY or PASS** — your call. Estimates are appraisals: usually honest, sometimes optimistic, sometimes pessimistic. You can't tell which.
3. **Reveal** — a suspense animation, then the true value drops with a random event (*"IT RUNS! 🔥"*, *"HIDDEN DAMAGE 😬"*, *"A COLLECTOR CONTACTED YOU 📞"* …).
4. **SELL NOW or HOLD** — take the profit (minus a 5% marketplace fee) or stash it in inventory and wait for the market to move.
5. **Level up** — 7 net-worth ranks from Garage Flipper to Mogul, each unlocking bigger deals.

Around that core: **timed auctions** against AI bidders, **mystery deals** (*"someone needs this gone TODAY"*), **random market events** on held inventory, **daily challenges**, **daily login rewards**, **weekly events**, **achievements**, a **personal records board**, and a **cosmetics store** (FlipCoins earned in-game only — nothing is pay-to-win, no loot boxes, no real-money purchases in this build).

## Balance philosophy

- ~20% of deals are genuine steals, ~50% are fair-margin grinds, ~30% are traps.
- Disciplined buying wins ~70–75% of flips; buying everything wins ~60% but earns far less — **risk/reward matters**.
- Losses are real (hidden damage, duds, bad appraisals). Wins are real (rare variants, collector bidding wars).

## Project structure

```
flipit/
├── index.html        # app shell: all screens + tab bar
├── css/styles.css    # dark mobile-first UI, 3 unlockable themes
├── js/
│   ├── items.js      # ITEM DATABASE (106 items) — add items here
│   ├── config.js     # levels, events, challenges, store, achievements
│   ├── engine.js     # game logic (DOM-free, headless-testable)
│   ├── ui.js         # rendering + interactions
│   └── admin.js      # admin panel
└── test/
    └── simulate.js   # integration test: node test/simulate.js
```

**Adding items:** push objects into `ITEMS` in `js/items.js` (see `validateItems()` for required fields), or use the in-game Admin panel (password `flipit-admin`) to add/edit/hide items live.

**Persistence:** progress auto-saves to `localStorage` (`flipit_save_v1`), with multiple named profiles per device. Export/import/reset from Admin → Data.

**Analytics hooks:** every meaningful action fires `Analytics.track(event, props)` (deal shown, buy/pass, sell, level up, challenge, store purchase, session length…). Events are stored per-profile (cap 500) and viewable in Admin → Data — wire the hook to your backend when ready.

## Testing

```bash
node test/simulate.js
```

Headless integration test: validates all item data, profiles, save/load, then plays 1,200+ rounds with two strategies (disciplined vs. buy-everything), auctions, inventory, challenges, login rewards, store, achievements, side-hustle rescue, and admin CRUD — asserting game invariants (cash never negative, sales math, level progression) and the target balance bands.

## Roadmap ideas

- Cloud saves + global leaderboards (Firebase/Supabase)
- Real-money cosmetic store (Stripe Payment Links, defined items only)
- More weekly events, seasons, friend challenges
