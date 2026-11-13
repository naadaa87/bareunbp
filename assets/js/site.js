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
  (function () {
    var ref = "";
    try { var u = new URL(document.referrer); if (u.host && u.host !== location.host) ref = u.hostname; } catch (e) {}
    var first = 0;
    try { if (!localStorage.getItem("bp_visited")) { localStorage.setItem("bp_visited", "1"); first = 1; } } catch (e) {}
    window.bpTrack(null, { r: ref, n: first });
  })();
  // 폼 접수 성공 집계
  document.addEventListener("bp:form-ok", function (e) { window.bpTrack("form_" + e.detail); });

  // ---- 커뮤니티 답변 표시 (링크 [제목](/주소)만 허용, 나머지는 글자 그대로)
  window.bpRenderAnswer = function (s) {
    var h = String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
    return h.replace(/\[([^\]\n]{1,80})\]\((\/[A-Za-z0-9\-_\/.#]*)\)/g, '<a href="$2">$1</a>').replace(/\n/g, "<br>");
  };

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
