/* edit.js — in-place editing. Text, images and chart data change on the slide itself;
   slides can be reordered, duplicated, hidden or deleted in the overview. With
   scripts/serve.mjs every change is written back to index.html, so Claude and the
   browser share one source; without it, changes persist in this browser. */
(function () {
  "use strict";
  var TEXT = ".title,.lead,.body,.small,.cap,.source,.kicker,.by,.next,.hero,.sec-num,.kpi__label,.kpi__value,.kpi__delta,.versus__head,.versus__tag,li,td,th,h3,.point b,.point span,.step p,.tl__when,.tl p,.mx b,.mx span,.ring__node b,.ring__node span,.ring__core b,.ring__core span,.layer b,.layer span,.price,.callout,.meta span,.agenda b,.agenda .d,.n";
  var RUNTIME_STYLED = ".ring__node,.kpis,.points,.tiers,.timeline,.steps,.layer,.title,.hero,.kpi__value,.price,.step h3,[data-step],[data-morph]";
  var deck = Deck.el, stage = Deck.stage, editing = false, saveT = 0, served = false, baseHash = "", undo = [], redo = [];
  var KEY = "ameng-deck:" + (deck.getAttribute("data-id") || location.pathname);

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function toast(m, ms) { if (window.Dock) Dock.toast(m, ms); }

  /* ---- serialise: strip everything the runtime added ------------------------ */
  function clean(slide) {
    var c = slide.cloneNode(true);
    c.classList.remove("is-active", "is-seen");
    if (!c.getAttribute("class")) c.setAttribute("class", "slide");
    if (c.hasAttribute("data-tone-auto")) { c.removeAttribute("data-tone"); c.removeAttribute("data-tone-auto"); }
    c.style.viewTransitionName = "";
    Array.prototype.forEach.call(c.querySelectorAll("[data-rt],.chart-tip,.chart > svg"), function (n) { n.remove(); });
    Array.prototype.forEach.call(c.querySelectorAll("[contenteditable],[data-editable],[spellcheck]"), function (n) { n.removeAttribute("contenteditable"); n.removeAttribute("data-editable"); n.removeAttribute("spellcheck"); });
    Array.prototype.forEach.call(c.querySelectorAll(RUNTIME_STYLED), function (n) { n.removeAttribute("style"); });
    Array.prototype.forEach.call(c.querySelectorAll("[style='']"), function (n) { n.removeAttribute("style"); });
    if (!c.getAttribute("style")) c.removeAttribute("style");
    return c.outerHTML;
  }
  /* never serialise a slide mid-animation: split lines and rolling numbers are not content */
  function allHtml() {
    if (Motion.busy() || stage.querySelector(".ln")) Motion.clear();
    return Deck.slides.map(clean);
  }
  function sig(s) { var h = 5381, i = s.length; while (i) h = (h * 33 ^ s.charCodeAt(--i)) >>> 0; return h.toString(36); }

  /* ---- persistence ----------------------------------------------------------- */
  function probe() {
    if (location.protocol === "file:") return Promise.resolve(false);
    return fetch("/__deck/ping?path=" + encodeURIComponent(location.pathname)).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.ok) { baseHash = j.hash; return true; } return false; }).catch(function () { return false; });
  }
  /* One save in flight at a time; the next waits, so a save can never race its own hash.
     Resolves true only once the change is really stored. */
  var inFlight = null, queued = false;
  function writeOut() {
    if (!served) {
      var ok = lsSet(KEY + ":doc", { html: allHtml(), base: baseSigs, file: sig(baseSigs.join()) });
      if (!ok) toast("浏览器存储已满，这次修改没有保存。请用 node scripts/serve.mjs 打开，改动会写进文件", 6000);
      return Promise.resolve(ok);
    }
    if (inFlight) { queued = true; return inFlight; }
    inFlight = fetch("/__deck/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: location.pathname, base: baseHash, stage: allHtml().join("\n\n"), theme: deck.getAttribute("data-theme"), style: deck.getAttribute("data-style") || "", accent: deck.getAttribute("data-accent") || "" }) })
      .then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); })
      .then(function (o) {
        if (o.r.status === 409) { toast("文件刚被别处改过。先复制你的修改，刷新后再改", 7000); return false; }
        if (!o.r.ok) { toast("保存失败：" + (o.j.error || "服务返回 " + o.r.status), 6000); return false; }
        baseHash = o.j.hash; return true;
      }).catch(function () { toast("保存失败：本地服务没有响应", 5000); return false; })
      .then(function (ok) {
        inFlight = null;
        if (queued) { queued = false; return writeOut(); }
        return ok;
      });
    return inFlight;
  }
  function save(now) {
    clearTimeout(saveT);
    return new Promise(function (res) {
      function attempt() {
        if (!now && Motion.busy()) { saveT = setTimeout(attempt, 400); return; }  /* let the entrance finish first */
        writeOut().then(res);
      }
      saveT = setTimeout(attempt, now ? 0 : 700);
    });
  }
  /* source slides as loaded, so a later source change wins over stale browser edits */
  var baseSigs = allHtml().map(sig);
  function restoreLocal() {
    var d = lsGet(KEY + ":doc", null);
    if (!d || !d.html) return;
    /* source untouched since those edits: bring back the whole deck, added pages included */
    if (d.file === sig(baseSigs.join())) {
      if (d.html.join() !== allHtml().join()) { restore({ html: d.html, i: Deck.index }, true); toast("已恢复你在这个浏览器里的修改"); }
      return;
    }
    if (d.html.length !== Deck.slides.length) return;
    var changed = false;
    Deck.slides.forEach(function (s, i) {
      if (d.base[i] !== baseSigs[i] || sig(clean(s)) === sig(d.html[i])) return;
      var t = document.createElement("div"); t.innerHTML = d.html[i];
      s.innerHTML = t.firstElementChild.innerHTML; changed = true;
    });
    if (changed) { Deck.refreshSlides(); Deck.activate(Deck.index, Deck.step); toast("已恢复你在这个浏览器里的修改"); }
  }

  /* ---- undo ------------------------------------------------------------------ */
  function snapshot() { return { html: allHtml(), i: Deck.index }; }
  function checkpoint() { undo.push(snapshot()); if (undo.length > 60) undo.shift(); redo = []; }
  function restore(s, quiet) {
    stage.querySelectorAll(":scope > .slide").forEach(function (n) { n.remove(); });
    var anchor = stage.querySelector(":scope > .progress");
    s.html.forEach(function (h) { var t = document.createElement("div"); t.innerHTML = h; stage.insertBefore(t.firstElementChild, anchor); });
    Deck.refreshSlides(); Deck.activate(Math.min(s.i, Deck.slides.length - 1), 0);
    if (editing) mark(true);
    Overlays.rebuild();
    if (!quiet) save();
  }

  /* ---- text ------------------------------------------------------------------ */
  function mark(on) {
    Array.prototype.forEach.call(stage.querySelectorAll(TEXT), function (el) {
      if (el.closest("[data-rt],.chart,.notes")) return;
      if (Array.prototype.some.call(el.children, function (k) { return k.matches && k.matches(TEXT); })) return;
      if (on) { el.setAttribute("contenteditable", "true"); el.setAttribute("data-editable", ""); el.spellcheck = false; }
      else { el.removeAttribute("contenteditable"); el.removeAttribute("data-editable"); el.removeAttribute("spellcheck"); }
    });
  }
  var pop = document.createElement("div"); pop.className = "ui pop"; pop.hidden = true;
  pop.innerHTML = '<button data-c="em">强调</button><button data-c="b">加粗</button><button data-c="plain">清除</button>';
  document.body.appendChild(pop);
  function wrapSel(tag) {
    var sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed) return;
    var r = sel.getRangeAt(0), host = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
    var e = document.createElement(tag); e.appendChild(r.extractContents()); r.insertNode(e); sel.removeAllRanges();
    void host; Deck.emit("dirty", {}); pop.hidden = true;
  }
  pop.addEventListener("mousedown", function (e) {
    e.preventDefault();
    var b = e.target.closest("[data-c]"); if (!b) return;
    checkpoint();
    var c = b.getAttribute("data-c");
    if (c === "plain") { var s = getSelection(); if (s.rangeCount) { var r = s.getRangeAt(0), t = document.createTextNode(r.toString()); r.deleteContents(); r.insertNode(t); s.removeAllRanges(); pop.hidden = true; Deck.emit("dirty", {}); } }
    else wrapSel(c);
  });
  document.addEventListener("selectionchange", function () {
    if (!editing) return;
    var s = getSelection();
    if (!s.rangeCount || s.isCollapsed || !stage.contains(s.anchorNode)) { pop.hidden = true; return; }
    var r = s.getRangeAt(0).getBoundingClientRect();
    pop.hidden = false;
    pop.style.left = Math.max(8, r.left + r.width / 2 - pop.offsetWidth / 2) + "px";
    pop.style.top = Math.max(8, r.top - pop.offsetHeight - 10) + "px";
  });

  /* ---- image replace ----------------------------------------------------------- */
  var picker = document.createElement("input"); picker.type = "file"; picker.accept = "image/*"; picker.hidden = true; document.body.appendChild(picker);
  var targetImg = null;
  picker.addEventListener("change", function () {
    var f = picker.files[0]; if (!f || !targetImg) return;
    checkpoint();
    var img = targetImg, done = function (src) { img.src = src; save(true).then(function (ok) { if (ok) toast("图片已替换"); }); };
    if (served) {
      fetch("/__deck/upload?path=" + encodeURIComponent(location.pathname) + "&name=" + encodeURIComponent(f.name), { method: "POST", body: f })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.src) throw new Error(j.error || "服务返回 " + r.status); return j; }); })
        .then(function (j) { done(j.src); }).catch(function (e) { toast("上传失败：" + e.message, 5000); });
    } else { var rd = new FileReader(); rd.onload = function () { done(rd.result); }; rd.readAsDataURL(f); }
    picker.value = "";
  });

  /* ---- side panel: chart data, history ------------------------------------------ */
  var panel = document.createElement("aside"); panel.className = "ui sheet-panel";
  panel.innerHTML = '<header><span data-p="title"></span><button data-p="close">关闭</button></header><div class="sheet-panel__body" data-p="body"></div><div class="row" data-p="foot"></div>';
  document.body.appendChild(panel);
  function pq(k) { return panel.querySelector('[data-p="' + k + '"]'); }
  pq("close").addEventListener("click", function () { panel.classList.remove("is-open"); });

  function specRows(spec) {
    if (spec.parts) return { head: ["名称", "数值"], rows: spec.parts.map(function (p) { return [p.name, p.value]; }), write: function (rows) { spec.parts = rows.map(function (r) { return { name: r[0], value: +r[1] || 0 }; }); } };
    if (spec.stages) return { head: ["阶段", "数值"], rows: spec.stages.map(function (p) { return [p.name, p.value]; }), write: function (rows) { spec.stages = rows.map(function (r) { return { name: r[0], value: +r[1] || 0 }; }); } };
    if (spec.items && spec.items[0] && spec.items[0].value != null && spec.items[0].target == null) return { head: ["名称", "数值"], rows: spec.items.map(function (p) { return [p.name, p.value]; }), write: function (rows) { spec.items = rows.map(function (r) { return { name: r[0], value: +r[1] || 0 }; }); } };
    if (spec.categories && spec.series) return {
      head: ["类别"].concat(spec.series.map(function (s) { return s.name; })),
      rows: spec.categories.map(function (c, i) { return [c].concat(spec.series.map(function (s) { return s.values[i]; })); }),
      write: function (rows, head) {
        spec.categories = rows.map(function (r) { return r[0]; });
        spec.series = head.slice(1).map(function (n, k) { return { name: n, values: rows.map(function (r) { return r[k + 1] === "" ? null : +r[k + 1]; }) }; });
      }
    };
    return null;
  }
  function editChart(fig) {
    var spec = Charts.readSpec(fig), m = specRows(spec);
    pq("title").textContent = "图表数据";
    var body = pq("body"), foot = pq("foot");
    if (!m) {
      body.innerHTML = "<textarea style='width:100%;height:100%;background:none;color:inherit;border:1px solid #555;font:13px monospace'></textarea>";
      var ta = body.firstChild; ta.value = JSON.stringify(spec, null, 2);
      ta.addEventListener("change", function () { try { apply(fig, JSON.parse(ta.value)); } catch (e) { toast("数据格式不对：" + e.message, 4000); } });
      foot.innerHTML = ""; panel.classList.add("is-open"); return;
    }
    var head = m.head.slice(), rows = m.rows.map(function (r) { return r.slice(); });
    function draw() {
      var t = document.createElement("table"); t.className = "grid-edit";
      [head].concat(rows).forEach(function (r, ri) {
        var tr = t.insertRow();
        r.forEach(function (v, ci) {
          var inp = document.createElement("input"); inp.value = v == null ? "" : v;
          inp.setAttribute("aria-label", "第 " + (ri + 1) + " 行第 " + (ci + 1) + " 列");
          inp.addEventListener("input", function () { (ri ? rows[ri - 1] : head)[ci] = inp.value; push(); });
          tr.insertCell().appendChild(inp);
        });
      });
      body.innerHTML = ""; body.appendChild(t);
    }
    var firstEdit = true;
    function push() { if (firstEdit) { checkpoint(); firstEdit = false; } m.write(rows, head); apply(fig, spec); }
    foot.innerHTML = "<button data-r>加一行</button><button data-d>删最后一行</button>";
    foot.querySelector("[data-r]").onclick = function () { rows.push(new Array(head.length).fill("")); draw(); };
    foot.querySelector("[data-d]").onclick = function () {
      if (rows.length < 2) { toast("至少留一行数据"); return; }
      rows.pop(); draw(); push();
    };
    draw(); panel.classList.add("is-open");
  }
  function apply(fig, spec) {
    var tag = fig.querySelector(':scope > script[type="application/json"]');
    if (!tag) { tag = document.createElement("script"); tag.type = "application/json"; fig.appendChild(tag); }
    var out = Object.assign({}, spec); if (fig.getAttribute("data-type")) delete out.type;
    /* "<" escaped so a label can never close the script tag when the deck is saved */
    tag.textContent = JSON.stringify(out).replace(/</g, "\\u003c");
    Charts.render(fig); save();
  }

  /* ---- page history ---------------------------------------------------------------- */
  var KV = KEY + ":vers";
  function textOf(h) { var t = document.createElement("div"); t.innerHTML = h; Array.prototype.forEach.call(t.querySelectorAll(".notes,script"), function (n) { n.remove(); }); return t.textContent.replace(/\s+/g, " ").trim(); }
  function recordVersions(before) {
    var map = lsGet(KV, {}), now = allHtml(), t = new Date().toISOString(), n = 0;
    now.forEach(function (h, i) {
      if (!before[i] || sig(before[i]) === sig(h)) return;
      var id = Deck.slides[i].getAttribute("data-id") || String(i), list = map[id] || [];
      if (!list.length) list.push({ t: null, html: before[i] });
      list.unshift({ t: t, html: h }); map[id] = list.slice(0, 30); n++;
    });
    if (n) lsSet(KV, map);
    return n;
  }
  function showHistory() {
    var i = Deck.index, id = Deck.slides[i].getAttribute("data-id") || String(i), list = lsGet(KV, {})[id] || [], body = pq("body");
    pq("title").textContent = "第 " + (i + 1) + " 页的版本"; pq("foot").innerHTML = "";
    body.innerHTML = list.length ? "" : "<p>这一页还没有改动。</p>";
    list.forEach(function (v, k) {
      var older = list[k + 1], d = document.createElement("div"); d.className = "ver";
      var when = v.t ? new Date(v.t).toLocaleString() : "最初版本";
      d.innerHTML = "<small></small><div></div>";
      d.querySelector("small").textContent = when;
      var a = textOf(v.html), b = older ? textOf(older.html) : "", box = d.querySelector("div");
      if (older && a !== b) { var del = document.createElement("del"), ins = document.createElement("ins"); del.textContent = b.slice(0, 80); ins.textContent = a.slice(0, 80); box.appendChild(del); box.appendChild(document.createElement("br")); box.appendChild(ins); }
      else box.textContent = a.slice(0, 80);
      if (k > 0) { var btn = document.createElement("button"); btn.textContent = "恢复这一版"; btn.onclick = function () { checkpoint(); var s = snapshot(); s.html[i] = v.html; restore(s); panel.classList.remove("is-open"); toast("已恢复"); }; d.appendChild(btn); }
      body.appendChild(d);
    });
    panel.classList.add("is-open");
  }

  /* ---- slide operations in the overview ---------------------------------------------- */
  function slideOp(op, i) {
    checkpoint();
    var s = snapshot(), h = s.html;
    if (op === "dup") { h.splice(i + 1, 0, h[i]); s.i = i + 1; }
    else if (op === "del") { if (h.length < 2) return; h.splice(i, 1); s.i = Math.max(0, i - 1); }
    else if (op === "hide") { var t = document.createElement("div"); t.innerHTML = h[i]; t.firstElementChild.toggleAttribute("data-hidden"); h[i] = t.innerHTML; }
    restore(s);
  }
  function moveSlide(from, to) {
    if (from === to) return;
    checkpoint();
    var s = snapshot(), x = s.html.splice(from, 1)[0];
    s.html.splice(to > from ? to - 1 : to, 0, x); s.i = to > from ? to - 1 : to;
    restore(s);
  }
  var ctx = document.createElement("div"); ctx.className = "ui menu"; ctx.hidden = true;
  ctx.innerHTML = '<button data-o="dup">复制这一页</button><button data-o="hide">隐藏 / 显示</button><button data-o="del">删除</button>';
  document.body.appendChild(ctx);
  var ctxIdx = 0;
  ctx.addEventListener("click", function (e) { var b = e.target.closest("[data-o]"); if (!b) return; ctx.hidden = true; slideOp(b.getAttribute("data-o"), ctxIdx); });
  document.addEventListener("pointerdown", function (e) { if (!e.target.closest(".menu")) ctx.hidden = true; });
  var ov = Overlays.el, dragFrom = -1;
  function cells() { return Array.prototype.slice.call(ov.querySelectorAll(".ov")); }
  ov.addEventListener("contextmenu", function (e) {
    var c = e.target.closest(".ov"); if (!c) return;
    e.preventDefault(); ctxIdx = cells().indexOf(c); ctx.hidden = false;
    ctx.style.left = Math.min(e.clientX, innerWidth - 230) + "px"; ctx.style.top = Math.min(e.clientY, innerHeight - 130) + "px"; ctx.style.bottom = "auto";
  });
  ov.addEventListener("dragstart", function (e) { var c = e.target.closest(".ov"); if (c) { dragFrom = cells().indexOf(c); e.dataTransfer.effectAllowed = "move"; } });
  ov.addEventListener("dragover", function (e) { var c = e.target.closest(".ov"); if (!c) return; e.preventDefault(); cells().forEach(function (x) { x.classList.toggle("is-drop-before", x === c); }); });
  ov.addEventListener("drop", function (e) { var c = e.target.closest(".ov"); if (!c || dragFrom < 0) return; e.preventDefault(); moveSlide(dragFrom, cells().indexOf(c)); dragFrom = -1; });
  new MutationObserver(function () { cells().forEach(function (c) { c.draggable = true; }); }).observe(ov, { childList: true });
  cells().forEach(function (c) { c.draggable = true; });

  /* ---- modes ----------------------------------------------------------------------------- */
  var before = null;
  function toggle() {
    editing = !editing;
    deck.classList.toggle("is-editing", editing);
    Motion.finishAll(); Motion.syncSteps(Deck.slides[Deck.index], 99);
    mark(editing);
    var b = document.querySelector('.dock [data-a="edit"]'); if (b) { b.classList.toggle("is-on", editing); b.textContent = editing ? "完成" : "编辑"; }
    if (editing) { before = allHtml(); toast(served ? "点文字直接改，点图片换图，点图表改数据。改动会写回 index.html" : "点文字直接改，点图片换图，点图表改数据。改动保存在这个浏览器"); }
    else {
      pop.hidden = true;
      var n = recordVersions(before);
      Motion.syncSteps(Deck.slides[Deck.index], Deck.step);
      if (!n) { toast("没有改动"); return; }
      save(true).then(function (ok) { if (ok) toast("已保存 " + n + " 页的修改"); });
    }
  }
  stage.addEventListener("click", function (e) {
    if (!editing) return;
    var fig = e.target.closest(".chart"); if (fig) { e.preventDefault(); editChart(fig); return; }
    var im = e.target.closest("img"); if (im && !im.closest("[data-rt]")) { targetImg = im; picker.click(); }
  });
  stage.addEventListener("input", function () { if (editing) save(); });
  stage.addEventListener("focusin", function (e) { if (editing && e.target.hasAttribute("data-editable")) checkpoint(); });
  document.addEventListener("keydown", function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z" && !e.target.isContentEditable) {
      var from = e.shiftKey ? redo : undo, to = e.shiftKey ? undo : redo;
      if (from.length) { e.preventDefault(); to.push(snapshot()); restore(from.pop()); }
    }
    if (e.key === "Escape" && editing) { if (e.target.blur) e.target.blur(); toggle(); }
    if (mod && e.key.toLowerCase() === "s" && editing) { e.preventDefault(); save(true).then(function (ok) { if (ok) toast("已保存"); }); }
  }, true);
  Deck.on(function (t) { if (t === "dirty") save(); if (t === "theme") save(); });

  window.Editor = { toggle: toggle, history: showHistory, save: save, clean: clean, isServed: function () { return served; } };
  probe().then(function (ok) { served = ok; if (!ok) restoreLocal(); });
})();
