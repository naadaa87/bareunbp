/* 바른혈압 공통 스크립트 */
(function () {
  "use strict";

  // ---- 모바일 메뉴
  var btn = document.querySelector(".menu-btn");
  var nav = document.querySelector(".nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- 현재 페이지 표시
  var path = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href) return;
    var h = href.replace(/index\.html$/, "");
    if (h !== "/" && path.indexOf(h) === 0) a.setAttribute("aria-current", "page");
    if (h === "/" && (path === "/" || path === "")) a.setAttribute("aria-current", "page");
  });

  // ---- 토스트
  var toastEl;
  window.bpToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  };

  // ---- API 헬퍼 (Cloudflare Pages Functions)
  window.bpApi = function (endpoint, payload) {
    return fetch("/api/" + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    }).then(function (r) {
      if (r.status === 404 || r.status === 405 || r.status === 501 || r.status === 502 || r.status === 503) return { ok: false, error: "not_configured" };
      return r.json().catch(function () { return { ok: false, error: "not_configured" }; })
        .then(function (j) { if (!r.ok && j.ok !== false) j.ok = false; return j; });
    }).catch(function () {
      return { ok: false, error: "offline" };
    });
  };

  // ---- 공통 폼 (data-api="lead|qna|newsletter|report")
  document.querySelectorAll("form[data-api]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".form-msg");
      var submit = form.querySelector("[type=submit]");
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (data.website) return; // honeypot
      if (form.querySelector("[name=agree]") && !form.querySelector("[name=agree]").checked) {
        show(msg, "err", "개인정보 처리 안내에 동의해 주세요.");
        return;
      }
      submit.disabled = true;
      bpApi(form.dataset.api, data).then(function (res) {
        submit.disabled = false;
        if (res.ok) {
          form.reset();
          try { document.dispatchEvent(new CustomEvent("bp:form-ok", { detail: form.dataset.api })); } catch (er) {}
          show(msg, "ok", form.dataset.success || "접수됐습니다. 확인 후 연락드리겠습니다.");
        } else if (res.error === "offline" || res.error === "not_configured") {
          // 데이터베이스 연결 전: 메일 링크로 대체
          var subject = encodeURIComponent("[바른혈압] " + (form.dataset.subject || "문의"));
          var body = encodeURIComponent(Object.keys(data).filter(function (k) { return k !== "agree" && k !== "website"; }).map(function (k) { return k + ": " + data[k]; }).join("\n"));
          show(msg, "err", "접수 서버가 아직 연결되지 않았습니다. <a href=\"mailto:spaceblank0100@gmail.com?subject=" + subject + "&body=" + body + "\">이메일로 보내기</a>");
        } else {
          show(msg, "err", res.error || "접수 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.");
        }
      });
    });
  });

  function show(el, kind, html) {
    if (!el) return;
    el.className = "form-msg " + kind;
    el.innerHTML = html;
  }

  // ---- 홈 빠른 입력 → 7일 기록 도구로
  var quick = document.getElementById("quick-entry");
  if (quick) {
    quick.addEventListener("submit", function (e) {
      e.preventDefault();
      var sys = parseInt(quick.sys.value, 10), dia = parseInt(quick.dia.value, 10), pulse = parseInt(quick.pulse.value, 10);
      if (!(sys > 50 && sys < 260) || !(dia > 30 && dia < 160)) { bpToast("수축기·이완기 수치를 확인해 주세요."); return; }
      if (window.BPStore) {
        BPStore.add({ sys: sys, dia: dia, pulse: isNaN(pulse) ? null : pulse, slot: hourSlot(), memo: "", quality: {} });
      }
      if (window.bpTrack) window.bpTrack("quick_entry");
      location.href = "/check7/?from=home";
    });
  }
  function hourSlot() { var h = new Date().getHours(); return h < 12 ? "am" : "pm"; }

  // ---- 뉴스레터 미니 폼은 data-api="newsletter"로 위 공통 처리 사용

  // ---- 익명 이용 통계
  // 페이지 주소, 유입 사이트(도메인), 도구 이름만 날짜별 합계로 남긴다. 혈압 값·식별자는 보내지 않는다.
  var noTrack = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
  var is404 = document.title.indexOf("페이지를 찾을 수 없습니다") === 0;
  function pretty(p) { return String(p || "/").replace(/\/index\.html$/, "/").replace(/\.html$/, ""); }
  window.bpTrack = function (ev, extra) {
    if (noTrack) return;
    try {
      var d = { p: is404 ? "/404" : pretty(location.pathname) };
      if (ev) d.e = ev;
      if (extra) for (var k in extra) d[k] = extra[k];
      var body = JSON.stringify(d);
      if (navigator.sendBeacon) navigator.sendBeacon("/api/hit", new Blob([body], { type: "text/plain" }));
      else fetch("/api/hit", { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" } });
    } catch (e) {}
  };
  // 방문 집계 — 브라우저에는 '처음 왔는지', '오늘 본 페이지 주소', '이번 방문의 페이지 수'만 저장한다(식별자 없음)
  var thisPage = is404 ? "/404" : pretty(location.pathname);
  (function () {
    var ref = "";
    try { var u = new URL(document.referrer); if (u.host && u.host !== location.host) ref = u.hostname; } catch (e) {}
    var today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    var first = 0, dayFirst = 0, pageFirst = 0, sessStart = 0, sessSecond = 0;
    try { if (!localStorage.getItem("bp_visited")) { localStorage.setItem("bp_visited", "1"); first = 1; } } catch (e) {}
    try {
      var seen = JSON.parse(localStorage.getItem("bp_day") || "null");
      if (!seen || seen.d !== today || !seen.p) { seen = { d: today, p: [] }; dayFirst = 1; }
      if (seen.p.indexOf(thisPage) < 0) { pageFirst = 1; if (seen.p.length < 300) seen.p.push(thisPage); }
      localStorage.setItem("bp_day", JSON.stringify(seen));
    } catch (e) { dayFirst = first; pageFirst = 1; }
    try {
      var n = parseInt(sessionStorage.getItem("bp_sess") || "0", 10) || 0;
      var last = parseInt(sessionStorage.getItem("bp_last") || "0", 10) || 0;
      if (!n || Date.now() - last > 30 * 60000) n = 0;          // 30분 넘게 쉬었다 오면 새 방문
      n += 1;
      sessionStorage.setItem("bp_sess", String(n)); sessionStorage.setItem("bp_last", String(Date.now()));
      sessStart = n === 1 ? 1 : 0; sessSecond = n === 2 ? 1 : 0;
    } catch (e) { sessStart = ref ? 1 : 0; }
    var mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || (window.matchMedia && matchMedia("(pointer: coarse)").matches);
    window.bpTrack(null, { r: ref, n: first, v: dayFirst, u: pageFirst, s: sessStart, s2: sessSecond, d: mobile ? "m" : "d" });
  })();
  // 머문 시간·읽은 정도 — 화면에 보이는 동안의 시간만 센다. 페이지를 떠날 때 한 번 보낸다
  (function () {
    if (noTrack) return;
    var active = 0, since = document.visibilityState === "visible" ? Date.now() : 0, sent = false, maxScroll = 0;
    function onScroll() { var h = document.documentElement; var r = (h.scrollTop + window.innerHeight) / Math.max(1, h.scrollHeight); if (r > maxScroll) maxScroll = r; }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    function flush() {
      if (since) { active += Date.now() - since; since = 0; }
      if (sent) return;
      var t = Math.round(active / 1000);
      if (t < 1) return;
      sent = true;
      window.bpTrack("_t", { t: Math.min(t, 1800), sc: Math.round(Math.min(1, maxScroll) * 100) });
    }
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); else if (!sent && !since) since = Date.now(); });
    window.addEventListener("pagehide", flush);
  })();
  // 클릭 집계 — 바른혈압몰 상품, 글 끝 관련 제품 상자, 바깥 링크(도메인만), 버튼(이름만)
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a, button") : null;
    if (!a) return;
    if (a.dataset && a.dataset.mall) { window.bpTrack("mall_click", { k: a.dataset.mall }); return; }
    if (a.dataset && a.dataset.mallBox) { window.bpTrack("mall_box", { k: a.dataset.mallBox }); return; }
    if (a.tagName === "A" && /^https?:$/.test(a.protocol) && a.hostname && a.hostname !== location.hostname) { window.bpTrack("out", { k: a.hostname.replace(/^www\./, "") }); return; }
    if (a.classList && a.classList.contains("btn")) window.bpTrack("cta", { k: (a.textContent || "").replace(/\d+/g, "#").replace(/\s+/g, " ").trim().slice(0, 24) });
  }, true);
  // 폼 접수 성공 집계
  document.addEventListener("bp:form-ok", function (e) { window.bpTrack("form_" + e.detail); });

  // ---- 커뮤니티 답변 표시 (링크 [제목](/주소)만 허용, 나머지는 글자 그대로)
  window.bpRenderAnswer = function (s) {
    var h = String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
    return h.replace(/\[([^\]\n]{1,80})\]\((\/[A-Za-z0-9\-_\/.#]*)\)/g, '<a href="$2">$1</a>').replace(/\n/g, "<br>");
  };

  // ================================================================ 회원 · 저장 · 공유
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var SVG = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>'
  };
  window.bpIcons = SVG;

  // ---- 회원 상태. 로그인 여부 표시는 브라우저에 남긴 닉네임 표시로 먼저 그리고, 필요한 화면에서만 서버에 확인한다.
  var mePromise = null;
  var User = window.BPUser = {
    hint: function () { return lsGet("bp_user", null); },
    setHint: function (u) { lsSet("bp_user", u ? { n: u.nickname } : null); drawUserLink(); },
    get: function (path) {
      return fetch("/api/" + path, { credentials: "same-origin" }).then(function (r) {
        return r.json().catch(function () { return { ok: false, error: "network" }; }).then(function (j) { j.status = r.status; return j; });
      }).catch(function () { return { ok: false, error: "network", message: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." }; });
    },
    post: function (path, payload) {
      return fetch("/api/" + path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-BP": "1" }, body: JSON.stringify(payload || {}) }).then(function (r) {
        return r.json().catch(function () { return { ok: false, error: "network" }; }).then(function (j) {
          j.status = r.status;
          if (r.status === 401 && j.error === "login_required") User.setHint(null);
          if (!j.ok && !j.message) j.message = j.error === "not_configured" ? "아직 회원 기능이 준비되지 않았습니다. 잠시 후 다시 시도해 주세요." : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
          return j;
        });
      }).catch(function () { return { ok: false, error: "network", message: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." }; });
    },
    // 서버에 로그인 상태 확인 (페이지당 한 번)
    me: function (force) {
      if (!mePromise || force) {
        mePromise = User.get("auth/me").then(function (j) {
          var u = j && j.ok ? j.user : null;
          if (j && j.ok) User.setHint(u);
          return u;
        });
      }
      return mePromise;
    },
    // 비밀번호는 그대로 보내지 않는다. 브라우저에서 PBKDF2로 늘린 값만 서버로 보낸다.
    derive: function (username, password) {
      if (!window.crypto || !crypto.subtle || !window.TextEncoder) return Promise.reject(new Error("unsupported"));
      var enc = new TextEncoder();
      var pw = password.normalize ? password.normalize("NFC") : password;
      return crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]).then(function (key) {
        return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("bareunbp:v1:" + String(username).toLowerCase()), iterations: 310000 }, key, 256);
      }).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      });
    },
    loginUrl: function () { return "/account/login/?next=" + encodeURIComponent(location.pathname + location.search); }
  };
  function drawUserLink() {
    var h = User.hint();
    document.querySelectorAll("[data-user-link]").forEach(function (a) {
      a.href = h ? "/my/" : User.loginUrl();
      a.classList.toggle("on", !!h);
      a.setAttribute("aria-label", h ? "마이페이지" : "로그인");
      a.innerHTML = SVG.user + "<span>" + (h ? esc(h.n) : "로그인") + "</span>";
    });
    var nav = document.querySelector(".nav");
    if (nav) {
      var m = nav.querySelector("[data-user-nav]");
      if (!m) { m = document.createElement("a"); m.setAttribute("data-user-nav", ""); m.className = "only-mobile"; nav.appendChild(m); }
      m.href = h ? "/my/" : User.loginUrl();
      m.textContent = h ? "마이페이지 · 저장한 글" : "로그인 · 회원가입";
    }
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  window.bpEsc = esc;
  drawUserLink();
  // 로그인 표시가 있으면 세션이 살아 있는지 조용히 확인
  if (User.hint() && location.pathname.indexOf("/account/") !== 0) User.me();

  // ---- 저장(찜). 로그인하면 계정에, 아니면 이 기기에만 저장한다.
  var Save = window.BPSave = {
    list: function () { return lsGet("bp_saved", []); },
    has: function (k) { return Save.list().some(function (x) { return x.k === k; }); },
    put: function (k, t) { var l = Save.list().filter(function (x) { return x.k !== k; }); l.unshift({ k: k, t: t, at: new Date().toISOString() }); lsSet("bp_saved", l.slice(0, 500)); },
    drop: function (k) { lsSet("bp_saved", Save.list().filter(function (x) { return x.k !== k; })); },
    toggle: function (k, t) {
      var on = !Save.has(k);
      if (on && window.bpTrack) window.bpTrack("save");
      if (!User.hint()) {
        if (on) Save.put(k, t); else Save.drop(k);
        return Promise.resolve({ ok: true, on: on, local: true });
      }
      return User.post("bookmarks", { key: k, title: t, on: on }).then(function (j) {
        if (j.ok) { if (on) Save.put(k, t); else Save.drop(k); return { ok: true, on: on }; }
        if (j.error === "login_required") { if (on) Save.put(k, t); else Save.drop(k); return { ok: true, on: on, local: true }; }
        return j;
      });
    },
    // 계정에 저장된 목록으로 이 기기의 목록을 맞춘다 (로그인 상태에서만)
    refresh: function () {
      if (!User.hint()) return Promise.resolve(Save.list());
      return User.get("bookmarks").then(function (j) {
        if (j.ok) lsSet("bp_saved", j.items.map(function (x) { return { k: x.key, t: x.title, at: x.created_at }; }));
        return Save.list();
      });
    },
    // 로그인 직후: 이 기기에 저장해 둔 글을 계정으로 옮긴다
    syncUp: function () {
      var l = Save.list();
      var p = l.length ? User.post("bookmarks/sync", { items: l }) : Promise.resolve();
      return p.then(function () { return Save.refresh(); });
    }
  };

  // ---- 공유
  window.bpShare = function (title, url, host) {
    url = url || location.href.split("#")[0];
    title = title || document.title;
    if (navigator.share && window.matchMedia && matchMedia("(pointer: coarse)").matches) {
      navigator.share({ title: title, url: url }).then(function () { window.bpTrack("share"); }).catch(function () {});
      return;
    }
    var old = document.querySelector(".share-menu");
    if (old) { var same = old.parentNode === host; old.remove(); if (same) return; }
    var m = document.createElement("div"); m.className = "share-menu"; m.setAttribute("role", "menu");
    var eu = encodeURIComponent(url), et = encodeURIComponent(title);
    m.innerHTML = '<button type="button" data-s="copy">링크 복사</button>' +
      (navigator.share ? '<button type="button" data-s="sys">다른 앱으로 공유 (카카오톡 등)</button>' : "") +
      '<a target="_blank" rel="noopener" data-s="band" href="https://band.us/plugin/share?body=' + et + "%0A" + eu + "&route=" + encodeURIComponent(location.host) + '">네이버 밴드</a>' +
      '<a target="_blank" rel="noopener" data-s="fb" href="https://www.facebook.com/sharer/sharer.php?u=' + eu + '">페이스북</a>' +
      '<a target="_blank" rel="noopener" data-s="x" href="https://twitter.com/intent/tweet?text=' + et + "&url=" + eu + '">X (트위터)</a>' +
      '<a data-s="mail" href="mailto:?subject=' + et + "&body=" + et + "%0A" + eu + '">이메일로 보내기</a>' +
      "<small>휴대폰에서는 공유 버튼을 누르면 카카오톡·문자로 바로 보낼 수 있습니다.</small>";
    (host || document.body).appendChild(m);
    m.addEventListener("click", function (e) {
      var b = e.target.closest("[data-s]"); if (!b) return;
      window.bpTrack("share");
      if (b.dataset.s === "copy") {
        var done = function () { bpToast("링크를 복사했습니다."); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt("아래 주소를 복사하세요.", url); });
        else window.prompt("아래 주소를 복사하세요.", url);
      } else if (b.dataset.s === "sys") {
        navigator.share({ title: title, url: url }).catch(function () {});
      }
      m.remove();
    });
    setTimeout(function () {
      document.addEventListener("click", function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("click", off); } });
    }, 0);
  };

  // ---- 저장·공유 버튼 (글 위·아래에 붙인다)
  window.bpActions = function (host, key, title, opt) {
    opt = opt || {};
    host.classList.add("article-actions", "no-print");
    var saveBtn = document.createElement("button"); saveBtn.type = "button"; saveBtn.className = "act-btn"; saveBtn.setAttribute("data-save", key);
    var shareBtn = document.createElement("button"); shareBtn.type = "button"; shareBtn.className = "act-btn"; shareBtn.innerHTML = SVG.share + "공유";
    function paint() {
      var on = Save.has(key);
      document.querySelectorAll('[data-save="' + key + '"]').forEach(function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); b.innerHTML = SVG.save + (on ? "저장됨" : "저장"); });
    }
    saveBtn.addEventListener("click", function () {
      saveBtn.disabled = true;
      Save.toggle(key, title).then(function (r) {
        saveBtn.disabled = false; paint();
        if (!r.ok) { bpToast(r.message || "저장하지 못했습니다."); return; }
        if (r.on) bpToast(r.local ? "이 기기에 저장했습니다. 로그인하면 다른 기기에서도 볼 수 있습니다." : "저장했습니다. 마이페이지에서 모아 볼 수 있습니다.");
        else bpToast("저장을 취소했습니다.");
      });
    });
    shareBtn.addEventListener("click", function (e) { e.stopPropagation(); window.bpShare(title, opt.url, host); });
    if (opt.label) { var s = document.createElement("span"); s.textContent = opt.label; host.appendChild(s); }
    host.appendChild(saveBtn); host.appendChild(shareBtn);
    paint();
    return paint;
  };
  (function () {
    var art = document.querySelector("article.article"), recipe = document.querySelector(".recipe .recipe-meta");
    var h1 = document.querySelector("h1");
    if ((!art && !recipe) || !h1) return;
    var key = pretty(location.pathname), title = h1.textContent.replace(/[“”]/g, "").trim();
    var paints = [];
    if (art) {
      var meta = art.querySelector(".article-meta");
      if (!meta) return;
      var top = document.createElement("div"); meta.parentNode.insertBefore(top, meta.nextSibling);
      paints.push(window.bpActions(top, key, title));
      var end = document.createElement("div"); end.className = "article-actions--end";
      // 글 맨 끝의 안내(CTA·정정 요청 문구) 바로 앞에 둔다. 본문 안쪽에 있는 요소는 기준으로 삼지 않는다.
      var before = null;
      Array.prototype.forEach.call(art.children, function (c) { if (!before && (c.classList.contains("article-cta") || (c.tagName === "P" && c.classList.contains("fine") && c === art.lastElementChild))) before = c; });
      if (before) art.insertBefore(end, before); else art.appendChild(end);
      paints.push(window.bpActions(end, key, title, { label: "도움이 됐다면 저장해 두거나 필요한 분께 보내 주세요." }));
    } else {
      var box = document.createElement("div"); recipe.appendChild(box);
      paints.push(window.bpActions(box, key, title));
    }
    if (User.hint()) Save.refresh().then(function () { paints.forEach(function (p) { p(); }); });
  })();

  // ---- 운영 정보 반영: 사이트 공지, 감수 완료 표시
  fetch("/api/public").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j || !j.ok) return;
    if (j.notice && j.notice.text) {
      var nb = document.querySelector(".notice-bar .wrap > span");
      if (nb) {
        nb.textContent = j.notice.text + " ";
        var l = j.notice.link;
        if (l && (/^\/[A-Za-z0-9\-_\/.#]*$/.test(l) || /^https:\/\//.test(l))) {
          var a = document.createElement("a"); a.href = l; a.textContent = "자세히";
          if (l.charAt(0) !== "/") { a.target = "_blank"; a.rel = "noopener"; }
          nb.appendChild(a);
        }
      }
    }
    var me = pretty(location.pathname), rv = null;
    for (var k in (j.reviews || {})) if (pretty(k) === me) rv = j.reviews[k];
    if (rv) {
      document.querySelectorAll(".review-status--pending").forEach(function (el) {
        el.className = "review-status review-status--done";
        el.textContent = "감수 완료 · " + rv.n + (rv.t ? " " + rv.t : "");
        el.title = (rv.o ? rv.o + " · " : "") + "감수일 " + rv.d;
      });
    }
  }).catch(function () {});
})();
