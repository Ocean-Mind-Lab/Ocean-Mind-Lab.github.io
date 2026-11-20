/* MarrBench project page: hero lens, heat-map leaderboard, examples. */
(() => {
  const data = window.MARRBENCH_DATA;
  if (!data) return;

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, html = "") => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (html) n.innerHTML = html;
    return n;
  };
  const fmt = (v) => v.toFixed(1);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fams = data.families;
  const famById = Object.fromEntries(fams.map((f) => [f.id, f]));
  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  /* Split comparison (examples viewer) ------------- */
  document.querySelectorAll("[data-split]").forEach((split) => {
    const range = split.querySelector(".split-range");
    const set = () => split.style.setProperty("--pos", `${range.value}%`);
    range.addEventListener("input", set);
    set();
  });

  /* Hero lens -------------------------------------------------------------- */
  const canvas = $("#lens");
  const frame = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const dots = $("#lens-dots");
  const pairs = [];
  let idx = 0;
  let prevIdx = -1;
  let fadeStart = 0;
  let lastSwitch = performance.now();
  let pointer = null; // {x, y} in CSS px while the pointer is over the frame
  const lens = { x: 0, y: 0 };
  let running = true;

  fams.forEach((f, i) => {
    const b = el("button", { type: "button", role: "tab", "aria-label": f.name, "aria-selected": "false" });
    b.style.setProperty("--c", f.accent);
    b.addEventListener("click", () => select(i));
    dots.appendChild(b);
  });

  const select = (i) => {
    if (i === idx && prevIdx !== -1) return;
    prevIdx = idx;
    idx = i;
    fadeStart = performance.now();
    lastSwitch = fadeStart;
    const f = fams[i];
    $("#lens-tag").textContent = f.id;
    $("#lens-tag").style.background = f.accent;
    $("#lens-name").textContent = `${f.name} · ${f.task.split(" · ")[1] || f.task}`;
    [...dots.children].forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = frame.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const cover = (img, w, h) => {
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    return [(w - dw) / 2, (h - dh) / 2, dw, dh, s];
  };

  const drawImg = (img, w, h) => {
    const [x, y, dw, dh, s] = cover(img, w, h);
    ctx.imageSmoothingEnabled = s < 2; // small inputs show their pixels
    ctx.drawImage(img, x, y, dw, dh);
  };

  const drawPair = (pair, w, h, r, alpha) => {
    if (!pair) return;
    ctx.globalAlpha = alpha;
    drawImg(pair.input, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#000";
    ctx.fillRect(lens.x - r, lens.y - r, 2 * r, 2 * r);
    drawImg(pair.target, w, h);
    // pixel grid inside the lens
    ctx.globalAlpha = alpha * 0.16;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.5;
    const step = 7;
    ctx.beginPath();
    for (let gx = Math.floor((lens.x - r) / step) * step; gx < lens.x + r; gx += step) {
      ctx.moveTo(gx + 0.25, lens.y - r);
      ctx.lineTo(gx + 0.25, lens.y + r);
    }
    for (let gy = Math.floor((lens.y - r) / step) * step; gy < lens.y + r; gy += step) {
      ctx.moveTo(lens.x - r, gy + 0.25);
      ctx.lineTo(lens.x + r, gy + 0.25);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  const frameLoop = (now) => {
    if (!running) return;
    const w = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
    const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
    const r = Math.min(w, h) * 0.24;

    // lens target: the pointer, or a slow drift
    const t = now / 1000;
    const goal = pointer || {
      x: w / 2 + Math.sin(t * 0.37) * w * 0.26,
      y: h / 2 + Math.sin(t * 0.53 + 1) * h * 0.2,
    };
    const k = pointer ? 0.22 : 0.05;
    lens.x += (goal.x - lens.x) * k;
    lens.y += (goal.y - lens.y) * k;

    if (!pointer && !reduced && now - lastSwitch > 6500) select((idx + 1) % fams.length);

    ctx.clearRect(0, 0, w, h);
    const fade = Math.min(1, (now - fadeStart) / 700);
    if (fade < 1 && prevIdx >= 0) drawPair(pairs[prevIdx], w, h, r, 1);
    drawPair(pairs[idx], w, h, r, fade);

    // the lens ring, ticks, and label
    const c = fams[idx].accent;
    ctx.save();
    ctx.shadowColor = c;
    ctx.shadowBlur = 24;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(lens.x + dx * (r + 6), lens.y + dy * (r + 6));
      ctx.lineTo(lens.x + dx * (r + 16), lens.y + dy * (r + 16));
    }
    ctx.stroke();
    const label = "GROUND TRUTH";
    ctx.font = "600 10px ui-monospace, Menlo, monospace";
    const lw = ctx.measureText(label).width + 12;
    const lx = Math.min(w - lw - 8, lens.x + r * 0.72);
    const ly = Math.max(8, lens.y - r * 0.72 - 22);
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(lx, ly, lw, 18);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, lx + 6, ly + 12.5);

    requestAnimationFrame(frameLoop);
  };

  frame.addEventListener("pointermove", (e) => {
    const r = frame.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    lastSwitch = performance.now();
  });
  frame.addEventListener("pointerleave", () => (pointer = null));
  frame.addEventListener("click", () => select((idx + 1) % fams.length));

  Promise.all(fams.map((f) => Promise.all([loadImage(f.input), loadImage(f.target)]))).then((list) => {
    list.forEach(([input, target], i) => (pairs[i] = input && target ? { input, target } : null));
    resize();
    const rect = frame.getBoundingClientRect();
    lens.x = rect.width / 2;
    lens.y = rect.height / 2;
    select(1); // open on grouping: the most legible input / truth pair
    prevIdx = -1;
    fadeStart = -Infinity; // first image appears at full strength
    requestAnimationFrame(frameLoop);
  });
  window.addEventListener("resize", resize);
  new IntersectionObserver(([entry]) => {
    const was = running;
    running = entry.isIntersecting;
    if (running && !was) requestAnimationFrame(frameLoop);
  }).observe(frame);

  /* Leaderboard ------------------------------------------------------------ */
  const famIds = fams.map((f) => f.id);
  const cols = [
    { key: "rank", label: "#", cls: "c-rank" },
    { key: "name", label: "Model", cls: "c-model", sort: (m) => m.name, asc: true },
    { key: "think", label: "Think", sub: "reasoning", cls: "c-think" },
    { key: "overall", label: "Overall", sub: "54 tasks", cls: "c-overall", sort: (m) => m.overall, mark: true },
    { key: "ci", label: "95% CI", cls: "c-ci" },
    ...famIds.map((id) => ({
      key: id,
      label: `<span class="fam-dot" style="--c:${famById[id].accent}"></span>${id}`,
      sub: `${famById[id].count} tasks`,
      title: famById[id].name,
      cls: "c-fam",
      sort: (m) => m.family[id],
      mark: true,
    })),
    { key: "gap", label: "C−P", sub: "points", cls: "c-gap", title: "Coarse minus pixel credit", sort: (m) => m.gap },
  ];

  const marks = {};
  cols.filter((c) => c.mark).forEach((c) => {
    const vals = [...new Set(data.models.map((m) => fmt(c.sort(m))))].map(Number).sort((a, b) => b - a);
    marks[c.key] = vals;
  });
  const markClass = (key, v) => {
    const n = Number(fmt(v));
    return n === marks[key][0] ? "best" : n === marks[key][1] ? "second" : "";
  };

  const table = $("#board");
  const headRow = el("tr");
  cols.forEach((c) => {
    const th = el("th", { class: c.cls, scope: "col" }, c.label + (c.sub ? `<small>${c.sub}</small>` : ""));
    if (c.title) th.title = c.title;
    if (c.sort) {
      th.dataset.sort = c.key;
      th.tabIndex = 0;
    }
    headRow.appendChild(th);
  });
  table.tHead.appendChild(headRow);

  let sortKey = "overall";
  let asc = false;

  const td = (c, m, i) => {
    const cell = el("td", { class: c.cls });
    switch (c.key) {
      case "rank":
        cell.textContent = String(i + 1).padStart(2, "0");
        break;
      case "name":
        cell.textContent = m.name;
        break;
      case "think":
        cell.innerHTML = `<span class="think think-${m.think}" title="${data.thinking[m.think]}">${m.think}</span>`;
        break;
      case "overall":
        cell.innerHTML = `<div class="overall"><b class="${markClass("overall", m.overall)}">${fmt(m.overall)}</b><span class="bar"><i style="width:${m.overall}%"></i></span></div>`;
        break;
      case "ci":
        cell.textContent = `${fmt(m.ci[0])}–${fmt(m.ci[1])}`;
        break;
      case "gap":
        cell.textContent = `+${fmt(m.gap)}`;
        break;
      default: {
        const v = m.family[c.key];
        cell.style.setProperty("--c", famById[c.key].accent);
        cell.style.setProperty("--a", (0.06 + 0.55 * (v / 100)).toFixed(3));
        cell.innerHTML = `<span class="${markClass(c.key, v)}">${fmt(v)}</span>`;
        cell.title = `${m.name} · ${famById[c.key].name}: ${fmt(v)}`;
      }
    }
    return cell;
  };

  const renderBoard = () => {
    const col = cols.find((c) => c.key === sortKey);
    const rows = [...data.models].sort((a, b) => {
      const x = col.sort(a);
      const y = col.sort(b);
      const d = typeof x === "string" ? x.localeCompare(y) : x - y;
      return (asc ? d : -d) || b.overall - a.overall;
    });
    const body = table.tBodies[0];
    body.innerHTML = "";
    rows.forEach((m, i) => {
      const tr = el("tr");
      cols.forEach((c) => tr.appendChild(td(c, m, i)));
      body.appendChild(tr);
    });
    headRow.querySelectorAll("th[data-sort]").forEach((th) => {
      const on = th.dataset.sort === sortKey;
      th.classList.toggle("is-sorted", on);
      th.classList.toggle("asc", on && asc);
      th.setAttribute("aria-sort", on ? (asc ? "ascending" : "descending") : "none");
    });
  };
  const sortBy = (key) => {
    if (key === sortKey) asc = !asc;
    else {
      sortKey = key;
      asc = Boolean(cols.find((c) => c.key === key).asc);
    }
    renderBoard();
  };
  headRow.addEventListener("click", (e) => {
    const th = e.target.closest("th[data-sort]");
    if (th) sortBy(th.dataset.sort);
  });
  headRow.addEventListener("keydown", (e) => {
    const th = e.target.closest("th[data-sort]");
    if (th && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      sortBy(th.dataset.sort);
    }
  });
  renderBoard();

  $("#think-legend").innerHTML =
    `<span class="title">Think: requested reasoning effort</span>` +
    Object.entries(data.thinking)
      .map(([k, v]) => `<span class="item"><span class="think think-${k}">${k}</span>${v}</span>`)
      .join("");

  /* Rule: checkpoint credits of the run shown (paper/data/main_results.json, Claude Opus 5.5, GRP04) -- */
  const checkpoints = [
    ["P1", "Part mIoU", 0.4, 0.844],
    ["P2", "Thin parts", 0.15, 0.918],
    ["P3", "Part boundaries", 0.3, 0.782],
    ["P4", "Object extent", 0.1, 0.837],
    ["P5", "Part composition", 0.05, 1.0],
  ];
  $("#cp-list").innerHTML = checkpoints
    .map(([id, name, w, c]) => `<li title="${name}, weight ${w}"><span>${id}</span><i><b style="width:${c * 100}%"></b></i><em>${c.toFixed(2)}</em></li>`)
    .join("");

  /* Examples --------------------------------------------------------------- */
  const cases = window.MARRBENCH_CASES || [];
  const strip = $("#case-strip");
  const grid = $("#model-grid");
  const split = $("#case-split");
  const RULES = {
    edges: "Display: boundaries overlaid on the dimmed input.",
    mask: "Display: masks overlaid on the dimmed input.",
    classes: "Display: one fixed colour per class.",
    instances: "Display: each region coloured by its best-matching true region.",
    flow: "Display: hue encodes direction, saturation encodes magnitude.",
    rgb: "Display: output shown as rendered.",
  };
  let current = cases[0];
  let modelKey = null;

  cases.forEach((c) => {
    const b = el("button", { type: "button", role: "tab", "aria-selected": "false", "data-case": c.id });
    b.style.setProperty("--c", famById[c.family]?.accent || "#fff");
    b.innerHTML = `<img src="${c.input}" alt="" loading="lazy" /><span><b>${c.task}</b>${c.title}</span>`;
    strip.appendChild(b);
  });

  const showModel = () => {
    const out = current.outputs.find((o) => o.key === modelKey) || current.outputs[0];
    modelKey = out.key;
    $("#case-model").textContent = out.name;
    $("#case-score").textContent = `${fmt(out.score)} / 100`;
    split.classList.toggle("is-empty", !out.image);
    if (out.image) $("#case-output").src = out.image;
    grid.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.model === out.key)));
  };

  const showCase = (c) => {
    current = c;
    const fam = famById[c.family];
    document.querySelector(".viewer").style.setProperty("--ar", c.aspect);
    strip.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.case === c.id)));
    $("#case-tag").textContent = c.family;
    $("#case-tag").style.background = fam?.accent;
    $("#case-id").textContent = `${c.task} · ${fam?.name || ""}`;
    $("#case-title").textContent = c.title;
    $("#case-desc").textContent = c.description;
    $("#case-rule").textContent = RULES[c.kind] || "";
    $("#case-input").src = c.input;
    $("#case-target").src = c.target;
    grid.innerHTML = "";
    c.outputs.forEach((o, i) => {
      const b = el("button", { type: "button", role: "tab", "aria-selected": "false", "data-model": o.key });
      b.style.setProperty("--s", `${o.score}%`);
      b.innerHTML =
        `<span class="thumb">${o.image ? `<img src="${o.image}" alt="${o.name} output" loading="lazy" />` : "<em>no output</em>"}</span>` +
        `<span class="rank">${i + 1}</span>` +
        `<span class="meta"><span>${o.name}</span><b>${fmt(o.score)}</b><i></i></span>`;
      grid.appendChild(b);
    });
    if (!c.outputs.some((o) => o.key === modelKey)) modelKey = c.outputs[0].key;
    showModel();
  };

  strip.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-case]");
    if (b) showCase(cases.find((c) => c.id === b.dataset.case));
  });
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-model]");
    if (!b) return;
    modelKey = b.dataset.model;
    showModel();
  });
  if (cases.length) showCase(cases[0]);

  /* Reveal, counters, nav, top bar ---------------------------------------- */
  const revealTargets = document.querySelectorAll(".section .eyebrow, .section .display, .section .lede, .flow, .calib, .board-shell, .strip, .viewer, .credits, .affils, .cite");
  revealTargets.forEach((n) => n.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }),
    { threshold: 0.15 },
  );
  revealTargets.forEach((n) => io.observe(n));

  if (!reduced) {
    document.querySelectorAll("[data-count]").forEach((n) => {
      const end = Number(n.dataset.count);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1400);
        n.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const topbar = $("[data-topbar]");
  const links = [...document.querySelectorAll(".nav a")];
  const targets = links.map((a) => document.querySelector(a.getAttribute("href")));
  const onScroll = () => {
    topbar.classList.toggle("is-solid", window.scrollY > 24);
    const y = window.scrollY + 120;
    let active = -1;
    targets.forEach((s, i) => s && s.offsetTop <= y && (active = i));
    links.forEach((a, i) => a.classList.toggle("is-active", i === active));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Citation --------------------------------------------------------------- */
  const copy = $("#copy-cite");
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#cite-code").textContent);
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Select to copy";
    }
    setTimeout(() => (copy.textContent = "Copy"), 1600);
  });
})();
