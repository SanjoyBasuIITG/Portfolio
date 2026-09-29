

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Motion 1: Focus pull
  const focusElements = document.querySelectorAll('.micrograph-frame img, .sketch-svg');
  if (focusElements.length > 0) {
    const focusObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          focusObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    focusElements.forEach(el => {
      el.classList.add('motion-focus-pull');
      focusObserver.observe(el);
    });
  }

  // Motion 2: Ink drawing
  if (!prefersReducedMotion) {
    const DRAW_MS = 1200;
    const sketches = document.querySelectorAll('.sketch-svg');
    const lengths = new WeakMap();

    const shapesOf = sketch => Array.from(
      sketch.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect')
    ).filter(shape => shape.getTotalLength);

    // Hide every stroke instantly (offset = full length)
    const hide = sketch => {
      shapesOf(sketch).forEach(shape => {
        if (!lengths.has(shape)) lengths.set(shape, shape.getTotalLength());
        const length = lengths.get(shape);
        shape.style.transition = 'none';
        shape.style.strokeDasharray = length;
        shape.style.strokeDashoffset = length;
      });
    };

    // Draw from the start; ignored while a draw is already running
    const draw = sketch => {
      if (sketch.dataset.drawing === 'true') return;
      sketch.dataset.drawing = 'true';
      hide(sketch);
      sketch.getBoundingClientRect(); // trigger reflow so the reset applies
      shapesOf(sketch).forEach(shape => {
        shape.style.transition = `stroke-dashoffset ${DRAW_MS}ms ease-out`;
        shape.style.strokeDashoffset = '0';
      });
      setTimeout(() => { sketch.dataset.drawing = 'false'; }, DRAW_MS);
    };

    sketches.forEach(hide);

    const drawObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          draw(entry.target);
          drawObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    sketches.forEach(sketch => {
      drawObserver.observe(sketch);
      // Redraw on cursor enter (desktop) and on tap (touch fires pointerenter too)
      sketch.addEventListener('pointerenter', () => draw(sketch));
    });
  }

  // Motion 3: Data bar scale tick (chapter reaching mid-screen updates the bar)
  const barScale = document.getElementById('data-bar-scale');
  const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
  if (barScale && chapters.length > 0) {
    const barRule = document.querySelector('.data-bar-rule');
    const barName = document.getElementById('data-bar-name');
    const barYears = document.getElementById('data-bar-years');
    const ruleWidths = [32, 24, 16, 8]; // scale bar shrinks mm → µm → nm → force
    const shuffleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let currentChapter = null;
    let shuffleTimer = null;

    const shuffleTo = text => {
      clearInterval(shuffleTimer);
      if (prefersReducedMotion) {
        barScale.textContent = text;
        return;
      }
      const letters = Array.from(text);
      const steps = 8;
      let step = 0;
      shuffleTimer = setInterval(() => {
        step++;
        barScale.textContent = letters.map((letter, index) => {
          if (step >= steps || index < (step / steps) * letters.length) return letter;
          return shuffleChars[Math.floor(Math.random() * shuffleChars.length)];
        }).join('');
        if (step >= steps) clearInterval(shuffleTimer);
      }, 35);
    };

    const showChapter = chapter => {
      if (chapter === currentChapter) return;
      currentChapter = chapter;
      const index = chapters.indexOf(chapter);
      shuffleTo(chapter.dataset.scale);
      if (barName) barName.textContent = chapter.dataset.name;
      if (barYears) barYears.textContent = chapter.dataset.years;
      if (barRule) barRule.style.width = ruleWidths[Math.min(index, ruleWidths.length - 1)] + 'px';
    };

    // Current chapter = the last one whose top has passed the middle of the screen (the first before that),
    // so a jump, a fast scroll or a reload part-way down the page still shows the right chapter
    const pickChapter = () => {
      const middle = window.innerHeight / 2;
      let current = chapters[0];
      chapters.forEach(chapter => {
        if (chapter.getBoundingClientRect().top <= middle) current = chapter;
      });
      showChapter(current);
    };

    // A zero-height line across the middle of the screen; a once-per-frame scroll check catches jumps
    // where no chapter is on screen before or after (e.g. from the hero straight to Contact)
    const midlineObserver = new IntersectionObserver(pickChapter, { rootMargin: '-50% 0px -50% 0px' });
    chapters.forEach(chapter => midlineObserver.observe(chapter));
    let pickQueued = false;
    const queuePick = () => {
      if (pickQueued) return;
      pickQueued = true;
      requestAnimationFrame(() => { pickQueued = false; pickChapter(); });
    };
    window.addEventListener('scroll', queuePick, { passive: true });
    window.addEventListener('resize', queuePick);
    pickChapter();
  }

  // Facts row decode (Home)
  if (!prefersReducedMotion) {
    const decodeElements = document.querySelectorAll('.motion-decode');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+';

    const decodeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const originalText = el.innerText.trim();
          let iterations = 0;
          const duration = 500;
          const intervalTime = 30;
          const maxIterations = duration / intervalTime;

          const interval = setInterval(() => {
            el.innerText = originalText.split('').map((letter, index) => {
              if (letter === ' ' || letter === '·' || letter === '.') return letter;
              if (index < (iterations / maxIterations) * originalText.length) {
                return originalText[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            }).join('');

            iterations++;
            if (iterations > maxIterations) {
              clearInterval(interval);
              el.innerText = originalText;
            }
          }, intervalTime);

          decodeObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    decodeElements.forEach(el => {
      // Keep height stable during decoding
      el.style.minHeight = el.offsetHeight + 'px';
      decodeObserver.observe(el);
    });
  }

  // Motion 5: UV lamp
  if (!prefersReducedMotion) {
    const lamp = document.querySelector('.motion-uv-lamp');
    if (lamp) {
      const lampObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            lamp.classList.add('is-lit');
          } else {
            lamp.classList.remove('is-lit');
          }
        });
      }, { threshold: 0.1 });

      // Observe the parent section to trigger the glow when the section is in view
      lampObserver.observe(lamp.parentElement);
    }
  }

  // Motion 7: Margin stories. When a chapter reaches mid-screen, both side margins redraw that
  // chapter's story stroke by stroke, like a pen; small loops start once it is drawn.
  (() => {
    // sections marked data-margin-story, in page order (the data bar uses data-chapter separately)
    const chapters = Array.from(document.querySelectorAll('[data-margin-story]'));
    const slots = document.querySelectorAll('.marginalia-slot:not([data-mode="scroll"])');
    if (!chapters.length || !slots.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // which story the HTML starts with (-1 = none shown, e.g. Home keeps the hero clear)
    const startSvg = slots[0].querySelector('.marginalia-svg.is-active');
    let current = startSvg ? Number(startSvg.dataset.index) : -1;
    const hideBeforeFirst = slots[0].hasAttribute('data-hide-before-first');

    const isStroke = el => el.tagName === 'path' && el.getAttribute('fill') === 'none';
    const timers = new WeakMap();

    // Entrance "focus" (Home): each field of view comes in blurred and slightly zoomed, then sharpens,
    // like turning a microscope's fine-focus knob; the fields follow one another top to bottom
    const focusIn = (svg, startMs) => {
      let t = startMs;
      svg.querySelectorAll('[data-step]').forEach(step => {
        step.style.transition = 'none';
        step.style.opacity = '0';
        step.style.filter = 'blur(5px)';
        step.style.transform = 'scale(1.12)';
        step.getBoundingClientRect();
        step.style.transition = 'opacity 500ms ease-out ' + t + 'ms, filter 1000ms cubic-bezier(.3,.1,.2,1) ' + t + 'ms, transform 1000ms cubic-bezier(.3,.1,.2,1) ' + t + 'ms';
        step.style.opacity = '1';
        step.style.filter = 'none';
        step.style.transform = 'scale(1)';
        if (step.dataset.step !== '0') t += 650; // frame parts (step 0) arrive together with the first field
      });
      return t + 600;
    };

    // Entrance "file" (Publications): each index card slides in from the outer edge, a little tilted,
    // and settles with a small overshoot, as if being filed; cards follow one another top to bottom
    const fileIn = (svg, startMs) => {
      const dir = svg.parentElement.dataset.side === 'right' ? 1 : -1;
      let t = startMs;
      svg.querySelectorAll('[data-step]').forEach(step => {
        step.style.transition = 'none';
        step.style.opacity = '0';
        step.style.transform = 'translate(' + (dir * 22) + 'px, -8px) rotate(' + (dir * 7) + 'deg)';
        step.getBoundingClientRect();
        step.style.transition = 'opacity 380ms ease-out ' + t + 'ms, transform 850ms cubic-bezier(.2,1.35,.4,1) ' + t + 'ms';
        step.style.opacity = '1';
        step.style.transform = 'none';
        if (step.dataset.step !== '0') t += 520;
      });
      return t + 700;
    };

    // Entrance "develop" (Fun Pictures): every part says how it arrives with data-anim:
    //   advance = the film strip moves on by one frame, develop = a frame goes from pale ghost to full ink,
    //   drop = a print is pinned onto the line with a little bounce, flash = the camera flashes once
    const developIn = (svg, startMs) => {
      let t = startMs;
      let end = startMs;
      svg.querySelectorAll('[data-anim]').forEach(el => {
        const kind = el.dataset.anim;
        el.style.transition = 'none';
        if (kind === 'advance') {
          el.style.transform = 'translateY(100px)';
          el.getBoundingClientRect();
          el.style.transition = 'transform 900ms cubic-bezier(.6,0,.3,1) ' + startMs + 'ms';
          el.style.transform = 'none';
          t = startMs + 700;
        } else if (kind === 'develop') {
          el.style.opacity = '0.12';
          el.style.filter = 'blur(2px)';
          el.getBoundingClientRect();
          el.style.transition = 'opacity 1300ms ease-in ' + t + 'ms, filter 1300ms ease-out ' + t + 'ms';
          el.style.opacity = '1';
          el.style.filter = 'none';
          end = Math.max(end, t + 1300);
          t += 420;
        } else if (kind === 'flash') {
          el.style.opacity = '0';
          el.getBoundingClientRect();
          el.style.transition = 'opacity 120ms ease-out ' + startMs + 'ms';
          el.style.opacity = '1';
          setTimeout(() => { el.style.transition = 'opacity 700ms ease-in'; el.style.opacity = '0'; }, startMs + 160);
        } else if (kind === 'drop') {
          el.style.opacity = '0';
          el.style.transform = 'translateY(-24px) rotate(-10deg)';
          el.getBoundingClientRect();
          el.style.transition = 'opacity 300ms ease-out ' + t + 'ms, transform 900ms cubic-bezier(.2,1.5,.4,1) ' + t + 'ms';
          el.style.opacity = '1';
          el.style.transform = 'none';
          end = Math.max(end, t + 900);
          t += 450;
        }
      });
      return end + 300;
    };

    const draw = (svg, startMs) => {
      clearTimeout(timers.get(svg));
      svg.classList.remove('is-drawn');
      if (reduce) return;
      const entrance = svg.parentElement.dataset.entrance;
      const entrances = { focus: focusIn, file: fileIn, develop: developIn };
      if (entrances[entrance]) {
        const done = entrances[entrance](svg, startMs);
        timers.set(svg, setTimeout(() => svg.classList.add('is-drawn'), done));
        return;
      }
      // Entrance "pen" (default, Journey)
      const BUDGET_MS = 4200; // whole column, pen speed is scaled to fit
      // 1st pass: plan each stroke (longer strokes take longer, like a pen) and the pauses between steps
      const plan = [];
      let planned = 0;
      svg.querySelectorAll('[data-step]').forEach(step => {
        step.querySelectorAll('path:not([data-nodraw]), circle').forEach(el => {
          if (isStroke(el)) {
            const length = el.getTotalLength();
            const dur = Math.min(460, Math.max(110, length * 4.5));
            plan.push({ el, length, dur, at: planned });
            planned += dur * 0.7;
          } else {
            plan.push({ el, at: planned });
            planned += 60;
          }
        });
        planned += 140; // small pause between story steps
      });
      const k = Math.min(1, BUDGET_MS / planned);
      // 2nd pass: apply
      plan.forEach(({ el, length, dur, at }) => {
        el.style.transition = 'none';
        const delay = startMs + at * k;
        if (length !== undefined) {
          el.style.strokeDasharray = length;
          el.style.strokeDashoffset = length;
          el.getBoundingClientRect();
          el.style.transition = 'stroke-dashoffset ' + Math.max(90, dur * k) + 'ms cubic-bezier(.45,.05,.35,1) ' + delay + 'ms';
          el.style.strokeDashoffset = '0';
        } else {
          el.style.opacity = '0';
          el.getBoundingClientRect();
          el.style.transition = 'opacity 320ms ease-out ' + delay + 'ms';
          el.style.opacity = '1';
        }
      });
      const t = startMs + planned * k + 500;
      // once the pen has finished, the details come alive
      timers.set(svg, setTimeout(() => svg.classList.add('is-drawn'), t + 400));
    };

    const show = index => {
      if (index === current) return;
      current = index;
      slots.forEach(slot => {
        const start = slot.dataset.side === 'right' ? 350 : 0; // second hand starts a beat later
        slot.querySelectorAll('.marginalia-svg').forEach(svg => {
          const on = Number(svg.dataset.index) === index;
          svg.classList.toggle('is-active', on);
          if (on) draw(svg, start);
        });
      });
    };
    // current story = last section whose top has passed mid-screen (robust to jumps and reloads);
    // before the first one: the first story, or none at all if the slots ask to stay clear (Home hero)
    const pick = () => {
      const middle = window.innerHeight / 2;
      let index = hideBeforeFirst ? -1 : 0;
      chapters.forEach((chapter, i) => { if (chapter.getBoundingClientRect().top <= middle) index = i; });
      show(index);
    };
    const midline = new IntersectionObserver(pick, { rootMargin: '-50% 0px -50% 0px' });
    chapters.forEach(chapter => midline.observe(chapter));
    let queued = false;
    const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; pick(); }); };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
  })();

  // Motion 7b: Fun Pictures margins that are part of the page (film strip, zig-zag string of prints).
  // They scroll with the page by themselves; here the reels turn with the scroll, each film frame develops
  // (pale → full ink) as it comes into view, and the camera flashes when a new photo section reaches mid-screen.
  (() => {
    const reels = Array.from(document.querySelectorAll(".fun-reel[data-spin]"));
    const frames = Array.from(document.querySelectorAll(".fun-frame[data-develop]"));
    const flash = document.querySelector(".fun-camera [data-flash]");
    const sections = Array.from(document.querySelectorAll("[data-margin-story]"));
    if (!reels.length && !frames.length) return;
    const reduceMargins = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // the first section's frames reach up to the top reel: measure the distance from the sheet's top to the first section
    const sheet = document.querySelector(".contact-sheet-panel");
    const measureLead = () => {
      if (!sheet || !sections.length) return;
      const lead = sections[0].getBoundingClientRect().top - sheet.getBoundingClientRect().top;
      sheet.style.setProperty("--lead", Math.max(0, lead) + "px");
    };
    // only whole frames on the strip: a frame that would be cut at the end of a section's run (or by the
    // leader space next to a reel) is hidden, leaving plain film like the gap between shots
    const columns = Array.from(document.querySelectorAll(".fun-frames"));
    const fitFrames = () => {
      columns.forEach(col => {
        const box = col.getBoundingClientRect();
        const limit = box.bottom - parseFloat(getComputedStyle(col).paddingBottom || 0);
        Array.from(col.children).forEach(frame => {
          frame.style.visibility = frame.getBoundingClientRect().bottom > limit + 0.5 ? "hidden" : "";
        });
      });
    };
    const layout = () => { measureLead(); fitFrames(); };
    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("load", layout);
    if (sheet && "ResizeObserver" in window) new ResizeObserver(layout).observe(sheet); // photos loading change the heights

    // reels turn with the scroll (both directions)
    let queued = false;
    // film wound on a reel: radius² grows or shrinks linearly with film length, and turn angle = ∫ ds / r
    const R0 = 0.45 * 0.45, B = 1 - R0;                         // (empty hub radius)² and (full − empty) for a unit reel
    const angle = (q, supply) => (2 / B) * (supply ? 1 - Math.sqrt(1 - B * q) : Math.sqrt(R0 + B * q) - Math.sqrt(R0));
    const turn = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const q = Math.min(1, Math.max(0, window.scrollY / max)), full = 0.35 * max / angle(1, true);
      reels.forEach((r, i) => { r.style.transform = "rotate(" + (full * angle(q, i === 0)).toFixed(1) + "deg)"; });
    };
    window.addEventListener("scroll", () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; turn(); }); }, { passive: true });
    turn();

    if (reduceMargins) return;
    // frames develop as they scroll into view (content stays visible if JS never runs: the pale state is added here)
    // (starts just before a frame scrolls into view, so it is already developing as it arrives)
    const developObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove("is-pale"); developObserver.unobserve(entry.target); } });
    }, { rootMargin: "0px 0px 12% 0px" });
    frames.forEach((f, i) => { f.classList.add("is-pale"); f.style.transitionDelay = (i % 4) * 0.07 + "s"; developObserver.observe(f); });

    // camera flash when a new photo section reaches the middle of the screen
    if (flash && sections.length) {
      let first = true;
      const flashObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          if (first) { first = false; return; }
          flash.style.transition = "none"; flash.style.opacity = "1"; flash.getBoundingClientRect();
          flash.style.transition = "opacity 700ms ease-in 150ms"; flash.style.opacity = "0";
        });
      }, { rootMargin: "-50% 0px -50% 0px" });
      sections.forEach(s => flashObserver.observe(s));
    }
  })();

  // Motion 7c: Home margins, "powers of ten". Scrolling from 01 / About to Contact drives a continuous zoom in
  // each side window: the view zooms into the glow box of one sketch and the next sketch is inside it.
  // The left window zooms in; the right one zooms out. The camera eases toward the scroll position.
  (() => {
    const wins = Array.from(document.querySelectorAll(".home-zoom"));
    const from = document.querySelector("[data-zoom-from]"), to = document.querySelector("[data-zoom-to]");
    if (!wins.length || !from || !to) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const views = wins.map(win => {
      const stages = Array.from(win.querySelectorAll(".zoom-stage")).map(g => {
        const [x, y] = g.dataset.o.split(" ").map(Number);
        return { g, box: g.querySelector(".zoom-box"), x, y, w: 100 * Number(g.dataset.c) };
      });
      return { win, stages, R: Number(win.dataset.aspect || 1), out: win.dataset.zoom === "out", cam: win.querySelector(".zoom-cam"), dot: win.querySelector(".zoom-depth i"), p: -1 };
    });
    const draw = (v, p) => {
      const n = v.stages.length - 1;
      const k = Math.min(Math.floor(p), n - 1), f = p - k;
      const A = v.stages[k], B = v.stages[k + 1];
      // zoom about the point that keeps its place in both views, so the box grows straight into the frame
      const u = (B.x - A.x) / (A.w - B.w), uy = (B.y - A.y) / (v.R * (A.w - B.w));
      const w = A.w * Math.pow(B.w / A.w, f);
      const ox = A.x + u * A.w - u * w, oy = A.y + uy * v.R * (A.w - w);
      v.cam.setAttribute("transform", `scale(${100 / w}) translate(${-ox} ${-oy})`);
      v.stages.forEach((st, i) => {
        const d = p - i;
        // the next sketch appears as its box fills the frame; the enlarged one fades as the zoom passes it
        st.g.style.opacity = d <= -0.5 ? 0 : d < -0.1 ? (d + 0.5) / 0.4 : d < 0.15 ? 1 : Math.max(0, 1 - (d - 0.15) / 0.4);
        if (st.box) st.box.style.opacity = d < 0 ? 1 : Math.max(0, 1 - d * 1.6);
      });
      v.dot.style.setProperty("--depth", (v.out ? 1 - p / n : p / n) * 100 + "%");
    };
    let raf = 0;
    const target = () => {
      const mid = window.innerHeight / 2;
      const a = from.getBoundingClientRect().top, b = to.getBoundingClientRect().top;
      const t = Math.min(1, Math.max(0, (mid - a) / (b - a)));
      wins.forEach(win => win.classList.toggle("is-on", a < mid + 80));
      return t;
    };
    let last = 0;
    const tick = now => {
      raf = 0;
      const dt = last ? Math.min(100, now - last) : 16.7; last = now;
      const ease = 1 - Math.exp(-dt / 110);   // time constant 110 ms
      const t = target();
      let moving = false;
      views.forEach(v => {
        const n = v.stages.length - 1;
        // each level holds still for most of the scroll; the zoom to the next one happens in the middle stretch
        const raw = (v.out ? 1 - t : t) * n, k = Math.min(Math.floor(raw), n - 1);
        const f = Math.min(1, Math.max(0, (raw - k - 0.32) / 0.36));
        let goal = k + f * f * (3 - 2 * f);
        if (reduce) goal = Math.round(goal);
        const p = v.p < 0 || reduce ? goal : v.p + (goal - v.p) * ease;
        if (Math.abs(goal - p) > 0.002) moving = true;
        if (p !== v.p) { v.p = p; draw(v, Math.min(n, Math.max(0, p))); }
      });
      if (moving) raf = requestAnimationFrame(tick); else last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    tick(performance.now());
  })();
  // Motion 7d: Publications margins, "stamped". Each entry, as it comes into view, stamps its ink impression into
  // the margin: one stamp at a time (one hand), in the order the entries are reached. Impressions stay.
  (() => {
    const fields = document.querySelectorAll(".pub-field");
    const rows = document.querySelectorAll("[data-stamp-for]");
    if (!fields.length || !rows.length) return;
    const all = document.querySelectorAll(".pub-stamp");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      all.forEach(s => s.classList.add("is-stamped"));
      return;
    }
    fields.forEach(f => f.classList.add("is-armed"));
    const queue = [];
    let busy = false;
    const next = () => {
      const s = queue.shift();
      if (!s) { busy = false; return; }
      busy = true;
      s.classList.add("is-stamping");
      setTimeout(() => { s.classList.remove("is-stamping"); s.classList.add("is-stamped"); }, 1000);
      setTimeout(next, 850);   // the next stamp comes down as this one lifts away
    };
    // reaching an entry also stamps any earlier ones that were scrolled past unseen (a fast scroll or a reload mid-page)
    const order = Array.from(rows), done = new Set();
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const upTo = order.indexOf(e.target);
      order.slice(0, upTo + 1).forEach(r => {
        if (done.has(r)) return;
        done.add(r);
        io.unobserve(r);
        const s = document.querySelector('.pub-stamp[data-stamp="' + r.dataset.stampFor + '"]');
        if (s) queue.push(s);
      });
      if (!busy) next();
    }), { rootMargin: "0px 0px -15% 0px" });
    rows.forEach(r => io.observe(r));
  })();
});
