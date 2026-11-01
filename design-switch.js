// Design picker, in the upper right of the nav on every page: Original · Notebook · All pens · Cyanotype · Studio.
// Each design is a full copy of the four pages in its own folder (the original sits at the root). Picking a design opens the
// same page in that design and remembers the choice in this browser, so every page keeps that design until the visitor
// switches back. On a first visit the design is chosen by device (see below). Loaded in <head> (not deferred), so a remembered design is opened before the page draws.
// The picker is the capsules (chosen by Sanjoy, 2026-11-02): one capsule in the current design's colours; hover or tap opens a
// strip of five two-tone capsules, and the chosen one pops before the design changes.
// Kept for later, not shown to visitors: the microscope picker (a tiny side-view microscope whose nosepiece swings the next
// objective over the stage). Open any page with ?switcher=turret to see it (remembered in that browser; ?switcher=capsules
// goes back).
(() => {
  // id, name, folder, capsule colours (left half, right half)
  const designs = [
    ["original", "Original", "", "#ECEDE6", "#1B211D"],
    ["notebook", "Notebook", "notebook/", "#1F3A5F", "#9B2D30"],
    ["pens", "All pens", "notebook-pens/", "#3E7A5E", "#704214"],
    ["cyanotype", "Cyanotype", "cyanotype/", "#1D3E66", "#EEF4FA"],
    ["studio", "Studio", "studio/", "#1FA9E1", "#5CC9A7"],
  ];
  const parts = location.pathname.split("/");
  const file = parts.pop() || "index.html";
  const folder = (parts.pop() || "") + "/";
  const current = designs.find(d => d[2] && d[2] === folder) || designs[0];
  const root = current[0] === "original" ? "" : "../";
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const go = id => { const d = designs.find(x => x[0] === id) || designs[0]; location.href = root + d[2] + file + location.hash; };
  const pick = id => { store("design", id); go(id); };

  const saved = store("design");
  if (saved && saved !== current[0] && designs.some(d => d[0] === saved)) { go(saved); return; }
  // First visit by device (Sanjoy, 2026-11-02): a Mac, iPhone or iPad that opens an Original page with no saved choice gets
  // All pens; every other device (Windows, Android, Linux, Chromebook) keeps the Original. The result is saved like a picked
  // design, so from then on the visitor's own capsule choice always wins. Search engines and link-preview bots are left on
  // the Original. Only when the browser can save the choice; otherwise a visitor could never switch back to the Original.
  if (!saved && current[0] === "original") {
    const ua = navigator.userAgent || "";
    const bot = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i.test(ua);
    const apple = /iPhone|iPad|iPod|Macintosh/.test(ua) || (navigator.userAgentData && navigator.userAgentData.platform === "macOS");
    if (apple && !bot) {
      store("design", "pens");
      if (store("design") === "pens") { go("pens"); return; }
    }
  }
  const asked = new URLSearchParams(location.search).get("switcher");
  if (asked === "turret" || asked === "capsules") store("switcher", asked);
  const look = store("switcher") === "turret" ? "turret" : "capsules";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const css = `
    .design-switch { display: inline-flex; align-items: center; gap: 10px; margin-left: 26px; font: 400 11px "Martian Mono", monospace;
      letter-spacing: .1em; text-transform: uppercase; color: var(--secondary); }
    .design-switch .ds-name { min-width: 7.5em; color: var(--ink); }
    /* capsules: closed, only the current design's capsule shows; hover (or tap) opens the strip and the others slide out */
    .design-switch.is-caps { position: relative; gap: 0; margin-left: 22px; }
    .ds-caps { display: inline-flex; align-items: center; flex-direction: row-reverse; padding: 6px 2px; }
    .ds-cap { position: relative; flex: none; width: 18px; height: 8px; padding: 0; margin: 0; border: 1px solid rgba(27,33,29,.5); border-radius: 999px;
      cursor: pointer; overflow: hidden; background: none; transform: rotate(-24deg);
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), width .3s ease, margin .3s ease, opacity .25s ease, border-width .3s ease; }
    .ds-cap i { position: absolute; top: 0; bottom: 0; width: 50%; }
    .ds-cap i:first-child { left: 0; } .ds-cap i:last-child { right: 0; }
    .ds-cap::after { content: ""; position: absolute; left: 2px; right: 2px; top: 1px; height: 1.5px; border-radius: 2px; background: rgba(255,255,255,.55); }
    /* the strip is laid out right to left (current capsule at the right), so the space goes on each capsule's right side,
       the side that faces the capsule before it; tilted capsules need a little extra room */
    .ds-cap:not([aria-pressed="true"]) { width: 0; margin-right: 0; opacity: 0; border-width: 0; pointer-events: none; }
    .ds-caps.is-open .ds-cap:not([aria-pressed="true"]) { width: 18px; margin-right: 10px; opacity: 1; border-width: 1px; pointer-events: auto; }
    .ds-caps.is-open .ds-cap:nth-child(2) { transition-delay: .02s; } .ds-caps.is-open .ds-cap:nth-child(3) { transition-delay: .05s; }
    .ds-caps.is-open .ds-cap:nth-child(4) { transition-delay: .08s; } .ds-caps.is-open .ds-cap:nth-child(5) { transition-delay: .11s; }
    .ds-cap[aria-pressed="true"]::before { content: ""; position: absolute; }
    .design-switch.is-caps::after { content: ""; position: absolute; right: 8px; bottom: 0; width: 3px; height: 3px; border-radius: 50%; background: var(--ink); }
    .ds-cap:hover { transform: rotate(-24deg) translateY(-1.5px) scale(1.15); }
    .ds-cap:focus-visible { outline: 2px solid var(--glow); outline-offset: 3px; }
    .ds-cap.is-popping { animation: ds-pop .42s cubic-bezier(.34,1.56,.64,1); }
    @keyframes ds-pop { 0% { transform: rotate(-24deg) scale(1); } 35% { transform: rotate(-8deg) scale(1.6); }
      60% { transform: rotate(-34deg) scale(.86); } 100% { transform: rotate(-24deg) scale(1.1); } }
    .ds-tip { position: absolute; top: 100%; right: 0; margin-top: 4px; padding: 3px 7px; white-space: nowrap; pointer-events: none;
      background: var(--ink); color: var(--page); font-size: 10px; letter-spacing: .08em; opacity: 0; transform: translateY(-3px); transition: opacity .18s ease, transform .18s ease; }
    .design-switch.is-caps:hover .ds-tip, .design-switch.is-caps.is-open .ds-tip { opacity: 1; transform: none; }
    /* turret */
    .ds-turret { width: 40px; height: 40px; padding: 0; border: 0; background: none; cursor: pointer; overflow: visible; }
    .ds-turret svg { display: block; overflow: visible; }
    .ds-turret .ds-nose { transform-origin: 18px 13px; transition: transform .5s cubic-bezier(.34,1.56,.64,1); }
    .ds-turret .ds-obj { cursor: pointer; }
    .ds-turret:hover .ds-nose { transform: rotate(-4deg); }
    .ds-turret:focus-visible { outline: 2px solid var(--glow); outline-offset: 3px; }
    @media (max-width: 767px) { .design-switch { margin-left: auto; margin-right: 10px; } .design-switch .ds-name, .design-switch .ds-label { display: none; } }`;

  // capsules: closed, one capsule (the current design) sits in the nav; hovering or tapping it slides the other four out like
  // a blister strip opening; the chosen one pops, then the design changes. The name shows in a small tip below, taking no space.
  const buildCapsules = box => {
    box.classList.add("is-caps");
    const row = document.createElement("span");
    row.className = "ds-caps";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Design");
    const tip = document.createElement("span");
    tip.className = "ds-tip";
    tip.textContent = current[1];
    const open = on => row.classList.toggle("is-open", on);
    box.addEventListener("mouseenter", () => open(true));
    box.addEventListener("mouseleave", () => { open(false); tip.textContent = current[1]; });
    box.addEventListener("focusin", () => open(true));
    box.addEventListener("focusout", e => { if (!box.contains(e.relatedTarget)) open(false); });
    document.addEventListener("click", e => { if (!box.contains(e.target)) open(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") open(false); });
    // the current capsule comes first in the markup and, laid out right to left, stays at the right edge
    [current, ...designs.filter(d => d !== current)].forEach(d => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ds-cap";
      b.title = d[1];
      b.setAttribute("aria-label", d[1] + " design");
      b.setAttribute("aria-pressed", d[0] === current[0] ? "true" : "false");
      b.innerHTML = d[0] === "studio"
        ? `<i style="width:100%;background:linear-gradient(90deg,${d[3]},${d[4]})"></i>`
        : `<i style="background:${d[3]}"></i><i style="background:${d[4]}"></i>`;
      b.addEventListener("mouseenter", () => { tip.textContent = d[1]; });
      b.addEventListener("focus", () => { tip.textContent = d[1]; });
      b.addEventListener("click", e => {
        if (d[0] === current[0]) { e.stopPropagation(); open(!row.classList.contains("is-open")); return; }   // tap on phones opens the strip
        if (reduce) { pick(d[0]); return; }
        b.classList.add("is-popping");
        setTimeout(() => pick(d[0]), 380);
      });
      row.appendChild(b);
    });
    box.append(row, tip);
  };

  // turret: a tiny microscope seen from the side (base, arm, eyepiece tube, stage). Its nosepiece holds three objectives: the
  // middle one points down at the stage and carries the current design's colour band; the left and right ones are the
  // previous and next designs. Clicking swings the nosepiece so the next objective comes over the stage (with a click-into-
  // detent overshoot); clicking the left or right objective swings to that one.
  const buildTurret = box => {
    const n = designs.length, at = designs.indexOf(current);
    const idx = k => ((at + k) % n + n) % n;
    const band = d => (d[0] === "studio" ? "url(#ds-grad)" : d[3]);
    const objective = (k, angle, len) => {
      const d = designs[idx(k)];
      return `<g class="ds-obj" data-i="${idx(k)}" transform="rotate(${angle} 18 13)"><title>${d[1]}</title>`
        + `<rect x="16.5" y="14.2" width="3" height="${len}" rx=".7" fill="var(--panel)" stroke="var(--ink)" stroke-width=".9"/>`
        + `<rect x="16.5" y="${14.2 + len * .45}" width="3" height="2.2" fill="${band(d)}" stroke="var(--ink)" stroke-width=".5"/>`
        + `<rect x="17.2" y="${14.2 + len}" width="1.6" height="1.5" rx=".4" fill="var(--ink)"/></g>`;
    };
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ds-turret";
    b.setAttribute("aria-label", `Design: ${current[1]}. Click for ${designs[idx(1)][1]}`);
    b.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs><linearGradient id="ds-grad" x1="0" x2="1"><stop offset="0" stop-color="#1FA9E1"/><stop offset="1" stop-color="#5CC9A7"/></linearGradient></defs>
      <path d="M8 35.5 H31 Q33 35.5 33 37.5 H6 Q6 35.5 8 35.5 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="1"/>
      <path d="M28 35.5 C 33 28, 33 16, 25 9.5" stroke="var(--ink)" stroke-width="2.4"/>
      <path d="M9 27 H29" stroke="var(--ink)" stroke-width="1.6"/>
      <rect x="13" y="25.6" width="7" height="1" fill="var(--secondary)"/>
      <path d="M12.6 5.6 L17.8 1.4 L24.4 8.6 L19.2 12.8 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="1"/>
      <path d="M11.4 4.4 L16.6 0.2" stroke="var(--ink)" stroke-width="1.4"/>
      <g class="ds-nose">
        ${objective(-1, 32, 6.4)}${objective(1, -32, 6.4)}${objective(0, 0, 7.6)}
      </g>
      <ellipse cx="18" cy="13" rx="5" ry="2.3" fill="var(--panel)" stroke="var(--ink)" stroke-width="1"/>
    </svg>`;
    const nose = () => b.querySelector(".ds-nose");
    const swingTo = k => {                              // k = -1 (previous) or +1 (next)
      nose().style.transform = `rotate(${k > 0 ? -32 : 32}deg)`;
      box.querySelector(".ds-name").textContent = designs[idx(k)][1];
      setTimeout(() => pick(designs[idx(k)][0]), reduce ? 0 : 520);
    };
    b.addEventListener("click", e => {
      const o = e.target.closest(".ds-obj");
      const i = o ? Number(o.dataset.i) : idx(1);
      if (i === at) { swingTo(1); return; }
      swingTo(i === idx(-1) ? -1 : 1);
    });
    box.append(b);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".site-nav-inner");
    if (!nav) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const box = document.createElement("div");
    box.className = "design-switch";
    if (look === "turret") {
      box.innerHTML = `<span class="ds-label">Design</span>`;
      buildTurret(box);
      const name = document.createElement("span");
      name.className = "ds-name";
      name.textContent = current[1];
      box.append(name);
    } else buildCapsules(box);
    const menu = nav.querySelector(".site-menu");
    if (menu) nav.insertBefore(box, menu); else nav.appendChild(box);
  });
})();
