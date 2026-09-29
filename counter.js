// View counter, one per page, shown at the end of the footer line.
// Counts once per page per visitor per day (the browser remembers the day it counted), using the Abacus counting
// service (abacus.jasoncameron.dev: no sign-up; it keeps only the number). Only the live site counts; a local copy uses a
// separate test counter. If the service cannot be reached, the footer simply shows no count.
(() => {
  const box = document.querySelector("[data-views]");
  if (!box) return;
  const live = location.hostname.endsWith("github.io");
  const ns = live ? "sanjoybasuiitg-portfolio" : "sanjoybasuiitg-portfolio-test";
  const key = box.dataset.views;
  const today = new Date().toISOString().slice(0, 10);
  let counted = null;
  try { counted = localStorage.getItem("views-" + key); } catch (e) { /* private mode: count every visit */ }
  const action = counted === today ? "get" : "hit";
  fetch(`https://abacus.jasoncameron.dev/${action}/${ns}/${key}`)
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(d => {
      if (!(typeof d.value === "number" && d.value >= 0)) return;
      try { localStorage.setItem("views-" + key, today); } catch (e) { /* ignore */ }
      box.querySelector("[data-views-n]").textContent = d.value.toLocaleString("en-IN") + (d.value === 1 ? " view" : " views");
      box.hidden = false;
    })
    .catch(() => { /* no count shown */ });
})();
