/* ============================================================
   FLIP IT — Admin interface
   Client-side only: overrides are stored per-profile in the save.
   For a production backend these would be server-side.
   ============================================================ */
"use strict";

const Admin = {
  tab: "items",
  unlocked: false,

  render() {
    if (!this.unlocked) return; // locked view stays
    document.querySelectorAll("#admin-tabs .tab").forEach(t => {
      t.classList.toggle("active", t.dataset.atab === this.tab);
      t.onclick = () => { this.tab = t.dataset.atab; this.render(); };
    });
    const box = document.getElementById("admin-content");
    if (this.tab === "items") this.renderItems(box);
    if (this.tab === "events") this.renderEvents(box);
    if (this.tab === "challenge") this.renderChallenge(box);
    if (this.tab === "data") this.renderData(box);
  },

  unlock() {
    const v = document.getElementById("admin-pass").value;
    if (v === "flipit-admin") {
      this.unlocked = true;
      document.getElementById("admin-lock").style.display = "none";
      document.getElementById("admin-panel").style.display = "";
      this.render();
    } else {
      UI.toast("Wrong password");
    }
  },

  /* ---------- items ---------- */
  renderItems(box) {
    const p = FlipIt.profile();
    const rows = ITEMS.map(it => {
      const live = FlipIt.getItem(it.id);
      const deleted = !live;
      const ov = (p.admin.itemOverrides[it.id] || {});
      const val = f => ov[f] !== undefined ? ov[f] : it[f];
      return `<tr style="${deleted ? "opacity:.4" : ""}">
        <td>${UI.esc(it.id)}<br><b>${UI.esc(val("name"))}</b><br><span class="muted">${UI.esc(it.cat)}</span></td>
        <td><input data-f="ask" data-id="${it.id}" type="number" value="${val("ask")}" style="width:70px"></td>
        <td><input data-f="low" data-id="${it.id}" type="number" value="${val("low")}" style="width:70px"></td>
        <td><input data-f="high" data-id="${it.id}" type="number" value="${val("high")}" style="width:70px"></td>
        <td><input data-f="actual" data-id="${it.id}" type="number" value="${val("actual")}" style="width:70px"></td>
        <td>${deleted
          ? `<button class="btn ghost" data-restore="${it.id}" style="padding:6px 10px;font-size:12px">Restore</button>`
          : `<button class="btn ghost" data-save="${it.id}" style="padding:6px 10px;font-size:12px">Save</button>
             <button class="btn danger" data-del="${it.id}" style="padding:6px 10px;font-size:12px">Hide</button>`}</td>
      </tr>`;
    }).join("");
    box.innerHTML = `
      <div class="card"><h3>Items (${ITEMS.length})</h3>
      <p class="tiny muted">Edits override values for this profile. "Hide" removes an item from deals.</p>
      <div style="overflow-x:auto"><table class="admin-table">
        <tr><th>Item</th><th>Ask</th><th>Low</th><th>High</th><th>Actual</th><th></th></tr>${rows}</table></div>
      <h3 style="margin-top:16px">Add new item</h3>
      <div class="row gap" style="flex-wrap:wrap">
        <input id="ni-name" placeholder="Name" style="flex:2;min-width:140px">
        <input id="ni-ask" type="number" placeholder="Ask $" style="flex:1;min-width:80px">
        <input id="ni-actual" type="number" placeholder="Actual $" style="flex:1;min-width:80px">
        <select id="ni-cat">${Object.keys(CATEGORIES).map(c => `<option value="${c}">${CATEGORIES[c].name}</option>`).join("")}</select>
        <button class="btn primary" id="ni-add" style="padding:10px 14px;font-size:14px">Add</button>
      </div><p class="tiny muted">Adds with sensible defaults (edit above after adding).</p></div>`;

    box.querySelectorAll("[data-save]").forEach(b => b.onclick = () => {
      const id = b.dataset.save, patch = {};
      box.querySelectorAll(`input[data-id="${id}"]`).forEach(inp => patch[inp.dataset.f] = Number(inp.value));
      patch.name = ITEM_BY_ID[id].name;
      FlipIt.adminSetItem(id, patch);
      UI.toast("Saved " + id);
    });
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { FlipIt.adminDeleteItem(b.dataset.del); this.render(); });
    box.querySelectorAll("[data-restore]").forEach(b => b.onclick = () => { FlipIt.adminRestoreItem(b.dataset.restore); this.render(); });
    box.querySelector("#ni-add").onclick = () => {
      const name = box.querySelector("#ni-name").value.trim();
      const ask = Number(box.querySelector("#ni-ask").value);
      const actual = Number(box.querySelector("#ni-actual").value);
      const cat = box.querySelector("#ni-cat").value;
      if (!name || !(ask > 0) || !(actual > 0)) return UI.toast("Name, ask and actual required");
      const id = "custom_" + Date.now().toString(36);
      const r = FlipIt.adminAddItem({ id, name, cat, ask, low: Math.round(actual * 0.7), high: Math.round(actual * 1.4),
        actual, cond: "Good", risk: "MEDIUM", desc: "Added via admin.", rarity: "Common",
        emoji: (CATEGORIES[cat] || {}).emoji || "📦", repair: 0, buyer: "General buyer" });
      if (r.ok) { UI.toast("Added " + name); this.render(); }
    };
  },

  /* ---------- events ---------- */
  renderEvents(box) {
    const p = FlipIt.profile();
    box.innerHTML = `<div class="card"><h3>Reveal events</h3>
      <p class="tiny muted">Uncheck to disable an event.</p>
      ${REVEAL_EVENTS.map(e => `
        <label class="ach"><input type="checkbox" data-ev="${e.id}" ${p.admin.disabledEvents.includes(e.id) ? "" : "checked"}>
        <span><b>${UI.esc(e.text)}</b><br><span class="muted">${UI.esc(e.sub)}</span></span></label>`).join("")}
    </div>`;
    box.querySelectorAll("[data-ev]").forEach(cb => cb.onchange = () => {
      const id = cb.dataset.ev;
      p.admin.disabledEvents = cb.checked
        ? p.admin.disabledEvents.filter(x => x !== id)
        : [...p.admin.disabledEvents, id];
      FlipIt.save();
      UI.toast(cb.checked ? "Enabled" : "Disabled");
    });
  },

  /* ---------- challenge ---------- */
  renderChallenge(box) {
    const p = FlipIt.profile();
    box.innerHTML = `<div class="card"><h3>Daily challenge override</h3>
      <p class="tiny muted">Force a specific challenge template, or leave on Auto (seeded daily).</p>
      <select id="ch-sel" style="width:100%;padding:10px;background:var(--bg2);color:var(--txt);border:1px solid var(--line);border-radius:10px">
        <option value="">Auto (daily rotation)</option>
        ${CHALLENGE_TEMPLATES.map(t => `<option value="${t.id}" ${p.admin.challengeId === t.id ? "selected" : ""}>${UI.esc(t.title)}</option>`).join("")}
      </select>
      <button class="btn primary block" id="ch-apply">Apply & regenerate</button></div>`;
    box.querySelector("#ch-apply").onclick = () => {
      p.admin.challengeId = box.querySelector("#ch-sel").value || null;
      p.daily.challenge = null;
      FlipIt._rollDaily(p);
      FlipIt.save();
      UI.toast("Challenge updated");
    };
  },

  /* ---------- data ---------- */
  renderData(box) {
    const p = FlipIt.profile();
    const evts = p.analytics.slice(-15).reverse();
    box.innerHTML = `<div class="card"><h3>Analytics (last ${evts.length} events)</h3>
      <div style="max-height:220px;overflow-y:auto;font-size:11px;font-family:monospace">
      ${evts.map(a => `<div>${new Date(a.t).toLocaleTimeString()} · <b>${UI.esc(a.event)}</b> ${UI.esc(JSON.stringify(a.props || {}))}</div>`).join("") || "<p class='muted'>No events yet.</p>"}
      </div>
      <div class="row gap" style="margin-top:10px;flex-wrap:wrap">
        <button class="btn ghost" id="ad-clear-an">Clear analytics</button>
      </div></div>
      <div class="card"><h3>Save data</h3>
      <div class="row gap" style="flex-wrap:wrap">
        <button class="btn ghost" id="ad-export">Export JSON</button>
        <button class="btn ghost" id="ad-reset">Reset everything</button>
      </div>
      <h3 style="margin-top:12px">Import</h3>
      <textarea class="code" id="ad-import" placeholder='Paste save JSON here'></textarea>
      <button class="btn primary block" id="ad-doimport">Import</button></div>
      <div id="ad-out"></div>`;
    box.querySelector("#ad-clear-an").onclick = () => { p.analytics = []; FlipIt.save(); this.render(); };
    box.querySelector("#ad-export").onclick = () => {
      box.querySelector("#ad-out").innerHTML = `<textarea class="code" style="height:200px">${UI.esc(FlipIt.exportData())}</textarea>`;
    };
    box.querySelector("#ad-reset").onclick = () => {
      if (confirm("Delete ALL profiles and data?")) { FlipIt.resetAll(); location.reload(); }
    };
    box.querySelector("#ad-doimport").onclick = () => {
      try { FlipIt.importData(box.querySelector("#ad-import").value); UI.toast("Imported!"); location.reload(); }
      catch (e) { UI.toast("Import failed: " + e.message); }
    };
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("btn-admin-unlock");
  if (b) b.onclick = () => Admin.unlock();
  const pw = document.getElementById("admin-pass");
  if (pw) pw.addEventListener("keydown", e => { if (e.key === "Enter") Admin.unlock(); });
});
