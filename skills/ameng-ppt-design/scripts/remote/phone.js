/* phone.js — the remote. It shows what the computer confirmed, never a guess: the page number
   moves only after the deck has moved. Presses are not queued while offline. */
"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  const CONNECT_MS = 4000, DEBOUNCE_MS = 300, SWIPE_PX = 80, EDGE_PX = 24, PING_MS = 3000, DEAD_MS = 6500, NO_REPLY_MS = 1600, SWITCH_AFTER_MS = 8000;
  const FONT_MIN = 18, FONT_MAX = 44;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  let meta = null, state = null, ws = null, online = false, everOnline = false;
  let wait = 500, lastPong = 0, pingAt = 0, rtt = 0, downSince = 0;
  let lastPress = 0, pressId = 0, pending = null, notesOf = -1, picked = -1;
  let clock = { running: false, elapsed: 0, at: performance.now() };
  let awake = "还没开始", lock = null, loaded = 0, total = 0;
  const cache = [];

  /* ---- drawing ------------------------------------------------------------ */
  const shot = (n, step) => `s/${n + 1}${step === undefined ? "" : "-" + step}.webp?v=${meta.v}`;
  /* the picture of page n after `step` builds: the plain image once everything is showing */
  const view = (n, step) => shot(n, step < meta.slides[n].steps ? step : undefined);
  function nextVisible(i) {
    for (let n = i + 1; n < meta.slides.length; n++) if (!meta.slides[n].hidden) return n;
    return -1;
  }
  function prevVisible(i) {
    for (let n = i - 1; n >= 0; n--) if (!meta.slides[n].hidden) return n;
    return -1;
  }
  function drawSlide() {
    if (!meta || !state) return;
    const s = meta.slides[state.i];
    if (!s) return;
    $("pageNow").textContent = state.i + 1;
    $("pageAll").textContent = "/ " + meta.slides.length;
    $("stepNow").textContent = s.steps ? `${state.step}/${s.steps} 步` : "";
    if (notesOf !== state.i) {
      notesOf = state.i;
      $("notes").textContent = s.notes || "这一页没有备注";
      $("notes").classList.toggle("is-empty", !s.notes);
      $("notes").scrollTop = 0;
    }
    drawBelow();
    const more = s.steps - state.step, n = nextVisible(state.i);
    const p = prevVisible(state.i);
    if (state.step > 0) {
      $("prevImg").src = view(state.i, state.step - 1);
      $("prevLabel").textContent = "上一步";
    } else if (p >= 0) {
      $("prevImg").src = view(p, meta.slides[p].steps);
      $("prevLabel").textContent = `上一页 第 ${p + 1} 页`;
    } else {
      $("prevImg").removeAttribute("src");
      $("prevLabel").textContent = "已经是第一页";
    }
    $("nowImg").src = view(state.i, state.step);
    $("nowLabel").textContent = `当前 第 ${state.i + 1} 页`;
    if (more > 0) {
      $("nextImg").src = view(state.i, state.step + 1);
      $("nextLabel").textContent = `下一步 还有 ${more} 步`;
    } else if (n >= 0) {
      $("nextImg").src = view(n, 0);
      $("nextLabel").textContent = `下一页 第 ${n + 1} 页`;
    } else {
      $("nextImg").removeAttribute("src");
      $("nextLabel").textContent = "已经是最后一页";
    }
    $("next").textContent = !usable() ? (online ? "等放映页" : "重连中") : more > 0 ? "下一步" : n >= 0 ? "下一页" : "最后一页";
  }
  function drawBelow() {
    const n = $("notes");
    $("below").hidden = n.scrollHeight - n.clientHeight - n.scrollTop < 12;
  }
  function drawLink() {
    $("dot").classList.toggle("is-on", usable());
    $("prev").disabled = !usable();
    $("next").disabled = !usable();
    let title = "", text = "";
    if (!online && everOnline) { title = "连不上电脑，正在重连"; text = "电脑键盘翻页不受影响"; }
    else if (!online) { title = "正在连接电脑"; }
    else if (state && !state.decks) { title = "电脑放映页没打开"; text = "打开后这里会自动接上"; }
    else if (state && state.stalled) { title = "放映页没有反应"; text = "看一眼电脑，或用键盘翻页"; }
    $("banner").hidden = !title;
    $("bannerTitle").textContent = title;
    $("bannerText").textContent = text;
    const other = otherRoute();
    $("switchRoute").hidden = !(other && !online && Date.now() - downSince > SWITCH_AFTER_MS);
    $("linkInfo").textContent = !online ? "未连接" : `${routeName()} · ${rtt} 毫秒`;
    $("awakeInfo").textContent = awake;
    $("loadInfo").textContent = meta ? `${loaded}/${total}` : "";
    drawSlide();
  }
  const usable = () => online && !!state && state.decks > 0;
  const routeName = () => (meta?.addresses.find((a) => a.url.startsWith(location.origin))?.label) || location.hostname;
  const otherRoute = () => meta?.addresses.find((a) => !a.url.startsWith(location.origin));
  function mmss(ms) {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    return String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function drawClock() {
    const ms = clock.elapsed + (clock.running ? performance.now() - clock.at : 0);
    $("clock").textContent = mmss(ms);
    $("clock").classList.toggle("is-paused", !clock.running);
  }
  function setClock(t) { clock = { ...t, at: performance.now() }; drawClock(); }
  function toast(text, ms = 2200) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { $("toast").hidden = true; }, ms);
  }
  const buzz = (p) => { try { navigator.vibrate?.(p); } catch { /* not allowed yet */ } };

  /* ---- talking to the Mac ------------------------------------------------- */
  const send = (m) => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); };
  function wentDown() {
    if (!online) return;
    online = false;
    downSince = Date.now();
    pending = null;
    buzz([120, 80, 120]);
    drawLink();
  }
  function connect() {
    const socket = new WebSocket(location.href.replace(/^http/, "ws").replace(/[#?].*$/, "").replace(/[^/]*$/, "") + "ws");
    ws = socket;
    /* a network that swallows packets never fails the handshake, so give up and try again */
    setTimeout(() => { if (socket.readyState === 0) socket.close(); }, CONNECT_MS);
    socket.onopen = () => {
      if (ws !== socket) return;
      if (everOnline) toast("已重连");
      online = everOnline = true;
      wait = 500; lastPong = Date.now();
      ping();
      loadMeta();
      drawLink();
    };
    socket.onmessage = (e) => { if (ws === socket) receive(JSON.parse(e.data)); };
    socket.onclose = () => {
      if (ws !== socket) return;
      ws = null;
      wentDown();
      setTimeout(connect, wait);
      wait = Math.min(wait * 2, 3000);
    };
  }
  function receive(m) {
    lastPong = Date.now();
    if (m.t === "pong") { rtt = Math.round(performance.now() - pingAt); setClock(m.timer); drawLink(); return; }
    if (m.t === "meta") return loadMeta();
    if (m.t === "ack") {
      if (!m.ok) { pending = null; toast(m.why); }
      if (m.why === "edge") { pending = null; toast("已经到头了"); }
      return;
    }
    if (m.t === "state") {
      const moved = !state || state.i !== m.i || state.step !== m.step;
      state = m;
      if (moved) pending = null;
      setClock(m.timer);
      if (meta && meta.v !== m.v) loadMeta();
      drawLink();
    }
  }
  function ping() {
    if (ws?.readyState !== 1) return;
    if (Date.now() - lastPong > DEAD_MS) { ws.close(); ws.onclose?.(); return; }
    pingAt = performance.now();
    send({ t: "ping", n: 1, at: Date.now() });
  }
  async function loadMeta() {
    try {
      const r = await fetch("meta", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const next = await r.json();
      const changed = next.v !== meta?.v;
      meta = next;
      if (changed) { notesOf = -1; buildJump(); preload(); }
      buildRoutes();
      drawLink();
    } catch { if (!meta) toast("读取页面信息失败，正在重试"); setTimeout(() => { if (!meta) loadMeta(); }, 1500); }
  }
  function preload() {
    loaded = 0; cache.length = 0;
    const queue = meta.slides.flatMap((s, i) => [shot(i), ...Array.from({ length: s.steps }, (_, k) => shot(i, k))]);
    const v = meta.v;
    total = queue.length;
    const one = () => {
      const url = queue.shift();
      if (url === undefined || v !== meta.v) return;
      const img = new Image();
      img.onload = img.onerror = () => { loaded += 1; $("loadInfo").textContent = `${loaded}/${total}`; one(); };
      img.src = url;
      cache.push(img);
    };
    for (let k = 0; k < 4; k++) one();
  }
  function press(cmd, i) {
    const now = performance.now();
    if (!usable() || now - lastPress < DEBOUNCE_MS) return;
    lastPress = now;
    buzz(12);
    const id = ++pressId;
    pending = id;
    send({ t: "cmd", id, cmd, i, at: Date.now() });
    setTimeout(() => { if (pending === id) { pending = null; toast("这一下电脑没有回应，看一眼大屏"); } }, NO_REPLY_MS);
  }

  /* ---- which picture is big ------------------------------------------------ */
  /* Tap a picture to make it big, tap the big one to go back. The choice stays while paging,
     and folded and unfolded each remember their own. */
  const unfolded = window.matchMedia("(min-width: 640px) and (min-height: 481px)");
  const focusKey = () => unfolded.matches ? "remote-focus-open" : "remote-focus-closed";
  const focusHome = () => unfolded.matches ? "now" : "none";
  function drawFocus() {
    const saved = store.get(focusKey());
    const allowed = unfolded.matches ? ["prev", "now", "next"] : ["none", "now", "next"];
    const focus = allowed.includes(saved) ? saved : focusHome();
    $("views").dataset.focus = focus;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-big", v.dataset.v === focus));
  }
  function tapView(e) {
    const v = e.target.closest(".view");
    if (!v || performance.now() - lastSwipe < 350) return;
    const now = $("views").dataset.focus;
    store.set(focusKey(), v.dataset.v === now ? focusHome() : v.dataset.v);
    drawFocus();
  }

  /* ---- swipe -------------------------------------------------------------- */
  /* Left for next, right for previous, anywhere above the keys. The pictures follow the finger and
     the page turns on release, so a swipe can be taken back. Touches from the very edge belong to
     the phone's back gesture. Vertical moves stay with the notes. */
  let drag = null, lastSwipe = -1000;
  function dragDraw(dx) {
    const ready = Math.abs(dx) >= SWIPE_PX;
    $("views").style.transform = `translateX(${Math.round(dx * .6)}px)`;
    const hint = $("hint");
    hint.hidden = Math.abs(dx) < 16;
    hint.classList.toggle("is-ready", ready);
    hint.textContent = (dx < 0 ? $("next").textContent : "上一页") + (ready ? "，松手" : "");
  }
  function dragEnd() {
    drag = null;
    $("hint").hidden = true;
    const v = $("views");
    v.classList.add("is-back");
    v.style.transform = "";
    setTimeout(() => v.classList.remove("is-back"), 200);
  }
  function touchStart(e) {
    const t = e.touches[0];
    drag = null;
    if (e.touches.length !== 1 || !usable()) return;
    if (t.clientX < EDGE_PX || t.clientX > innerWidth - EDGE_PX) return;
    drag = { x: t.clientX, y: t.clientY, dx: 0, side: false };
  }
  function touchMove(e) {
    if (!drag) return;
    if (e.touches.length !== 1) return dragEnd();
    const t = e.touches[0], dx = t.clientX - drag.x, dy = t.clientY - drag.y;
    if (!drag.side) {
      if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }   /* reading, not turning */
      if (Math.abs(dx) < 12) return;
      drag.side = true;
      $("views").classList.remove("is-back");
    }
    drag.dx = dx; drag.dy = dy;
    dragDraw(dx);
  }
  function touchEnd() {
    if (!drag) return;
    const { dx, dy = 0, side } = drag;
    if (side) { lastSwipe = performance.now(); dragEnd(); } else drag = null;
    if (side && Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) press(dx < 0 ? "next" : "prev");
  }

  /* ---- jump --------------------------------------------------------------- */
  function buildJump() {
    const host = $("jumpList");
    host.textContent = "";
    let grid = null, section = null;
    meta.slides.forEach((s, i) => {
      if (s.hidden) return;
      if (s.section !== section || !grid) {
        section = s.section;
        const h = document.createElement("div");
        h.className = "sec"; h.textContent = section || "未分组";
        grid = document.createElement("div");
        grid.className = "grid";
        host.append(h, grid);
      }
      const cell = document.createElement("button");
      cell.className = "cell"; cell.dataset.i = i;
      cell.setAttribute("aria-label", `第 ${i + 1} 页 ${s.title}`);
      const img = document.createElement("img");
      img.loading = "lazy"; img.alt = ""; img.src = shot(i);
      const n = document.createElement("span");
      n.textContent = i + 1;
      cell.append(img, n);
      grid.append(cell);
    });
  }
  function pick(i) {
    picked = i;
    document.querySelectorAll(".cell").forEach((c) => c.classList.toggle("is-picked", Number(c.dataset.i) === i));
    $("jumpGo").disabled = i < 0;
    $("jumpGo").textContent = i < 0 ? "先选一页" : `跳到第 ${i + 1} 页`;
  }
  function openJump() {
    if (!meta || !state) return;
    pick(-1);
    document.querySelectorAll(".cell").forEach((c) => c.classList.toggle("is-now", Number(c.dataset.i) === state.i));
    $("jump").hidden = false;
    document.querySelector(".cell.is-now")?.scrollIntoView({ block: "center" });
  }

  /* ---- more --------------------------------------------------------------- */
  function buildRoutes() {
    const host = $("routes");
    host.textContent = "";
    meta.addresses.filter((a) => !a.url.startsWith(location.origin)).forEach((a) => {
      const link = document.createElement("a");
      link.href = a.url;
      const small = document.createElement("small");
      small.textContent = a.url.replace(/\/[^/]+\/$/, "/…");
      link.append("换到" + a.label, small);
      host.append(link);
    });
  }
  function setFont(px) {
    const size = Math.min(FONT_MAX, Math.max(FONT_MIN, px));
    document.documentElement.style.setProperty("--notes", size + "px");
    $("fontNow").textContent = size;
    store.set("remote-notes-size", size);
    setFont.now = size;
  }
  function askReset() {
    const b = $("timerReset");
    if (!b.classList.contains("is-sure")) {
      b.classList.add("is-sure");
      b.textContent = "再点一次";
      setTimeout(() => { b.classList.remove("is-sure"); b.textContent = "归零"; }, 2500);
      return;
    }
    b.classList.remove("is-sure");
    b.textContent = "归零";
    send({ t: "timer", a: "reset" });
    toast("已归零，下次翻页开始计时");
  }

  /* ---- keep the screen on ------------------------------------------------- */
  async function keepAwake() {
    if (lock) return;
    if (window.isSecureContext && navigator.wakeLock) {
      try {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => { lock = null; awake = "已释放"; drawLink(); });
        awake = "系统常亮";
        drawLink();
        return;
      } catch { /* fall through to the video */ }
    }
    try {
      await $("keepAwake").play();
      awake = "视频方式，请真机确认";
    } catch { awake = "没有生效，请调长息屏时间"; }
    drawLink();
  }

  /* ---- wiring ------------------------------------------------------------- */
  $("notes").addEventListener("scroll", drawBelow, { passive: true });
  $("views").addEventListener("click", tapView);
  unfolded.addEventListener("change", drawFocus);
  $("swipe").addEventListener("touchstart", touchStart, { passive: true });
  $("swipe").addEventListener("touchmove", touchMove, { passive: true });
  $("swipe").addEventListener("touchend", touchEnd, { passive: true });
  $("swipe").addEventListener("touchcancel", () => { if (drag?.side) dragEnd(); drag = null; }, { passive: true });
  /* a stray back gesture must not leave the remote in the middle of a talk */
  document.addEventListener("pointerup", function guard() {
    document.removeEventListener("pointerup", guard);
    history.pushState({ stay: true }, "");
    window.addEventListener("popstate", () => { history.pushState({ stay: true }, ""); toast("还在遥控页"); });
  });
  window.addEventListener("resize", drawBelow);
  $("next").addEventListener("click", () => press("next"));
  $("prev").addEventListener("click", () => press("prev"));
  $("pageBtn").addEventListener("click", openJump);
  $("jumpClose").addEventListener("click", () => { $("jump").hidden = true; });
  $("jumpList").addEventListener("click", (e) => { const c = e.target.closest(".cell"); if (c) pick(Number(c.dataset.i)); });
  $("jumpGo").addEventListener("click", () => { if (picked >= 0) { press("go", picked); $("jump").hidden = true; } });
  $("clock").addEventListener("click", () => send({ t: "timer", a: "toggle" }));
  $("moreBtn").addEventListener("click", () => { drawLink(); $("more").hidden = false; });
  $("moreClose").addEventListener("click", () => { $("more").hidden = true; });
  $("fontDown").addEventListener("click", () => setFont(setFont.now - 2));
  $("fontUp").addEventListener("click", () => setFont(setFont.now + 2));
  $("timerReset").addEventListener("click", askReset);
  $("fullscreen").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => toast("这个浏览器不支持全屏"));
  });
  $("switchRoute").addEventListener("click", () => { const o = otherRoute(); if (o) location.href = o.url; });
  document.addEventListener("pointerup", keepAwake, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    keepAwake();
    /* timers slept in the background: give the socket two seconds to prove itself */
    lastPong = Math.max(lastPong, Date.now() - DEAD_MS + 2000);
    ping();
  });
  window.addEventListener("online", () => { if (!online && ws) ws.close(); });

  setFont(Number(store.get("remote-notes-size")) || (innerWidth >= 640 ? 34 : 26));
  drawFocus();
  if (!window.isSecureContext) toast("这个地址下屏幕常亮可能无效，上台前把息屏时间调到 10 分钟", 4500);
  keepAwake();
  setInterval(() => { drawClock(); if (!online) drawLink(); }, 500);
  setInterval(ping, PING_MS);
  loadMeta();
  connect();
})();
