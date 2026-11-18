/* 바른혈압몰 — 관리자가 추가·숨긴 상품 반영, 상품 노출 집계 */
(function () {
  "use strict";
  var esc = window.bpEsc || function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var safeUrl = function (u) { return /^https:\/\/(link\.coupang\.com|coupa\.ng)\//.test(u || "") ? u : ""; };
  var safeImg = function (u) { return /^https:\/\/[a-z0-9.-]+\.coupangcdn\.com\//.test(u || "") ? u : ""; };

  function watchImages(root) {
    root.querySelectorAll(".mall-card img").forEach(function (im) {
      if (im.dataset.w) return; im.dataset.w = "1";
      im.addEventListener("error", function () { im.classList.add("is-missing"); });
      if (im.complete && !im.naturalWidth) im.classList.add("is-missing");
    });
  }

  // 화면에 실제로 보인 상품만 '노출'로 센다 (상품당 한 번)
  var seen = {}, queue = [], timer = 0;
  function flush() { timer = 0; if (!queue.length || !window.bpTrack) return; window.bpTrack("mall_view", { ids: queue.splice(0, 40) }); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (!en.isIntersecting) return;
      var id = en.target.getAttribute("data-pid");
      if (!id || seen[id]) return;
      seen[id] = 1; queue.push(id); io.unobserve(en.target);
      if (!timer) timer = setTimeout(flush, 1500);
    });
  }, { threshold: 0.5 }) : null;
  function observe(root) { if (io) root.querySelectorAll(".mall-card[data-pid]").forEach(function (c) { io.observe(c); }); }
  window.addEventListener("pagehide", flush);

  function card(it) {
    var url = safeUrl(it.url), img = safeImg(it.img);
    if (!url) return "";
    return '<li class="mall-card" data-pid="' + esc(it.pid) + '"><a class="mall-card__img" href="' + esc(url) + '" target="_blank" rel="sponsored nofollow noopener" data-mall="' + esc(it.pid) + '" tabindex="-1" aria-hidden="true">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(it.name) + '" loading="lazy" width="246" height="246" referrerpolicy="no-referrer">' : "") + "</a>" +
      '<div class="mall-card__body"><b>' + esc(it.name) + "</b>" + (it.note ? "<p>" + esc(it.note) + "</p>" : "") +
      '<a class="btn btn--primary btn--sm mall-card__go" href="' + esc(url) + '" target="_blank" rel="sponsored nofollow noopener" data-mall="' + esc(it.pid) + '">쿠팡에서 보기</a></div></li>';
  }

  watchImages(document); observe(document);
  fetch("/api/mall", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
    if (!j || !j.ok) return;
    (j.hidden || []).forEach(function (pid) { var c = document.querySelector('.mall-card[data-pid="' + String(pid).replace(/"/g, "") + '"]'); if (c) c.remove(); });
    var extra = {};
    (j.items || []).forEach(function (it) { (extra[it.cat] = extra[it.cat] || []).push(it); });
    Object.keys(extra).forEach(function (cat) {
      var grid = document.querySelector('.mall-grid[data-cat="' + cat + '"]');
      if (!grid) return;
      grid.insertAdjacentHTML("beforeend", extra[cat].map(card).join(""));
    });
    watchImages(document); observe(document);
  }).catch(function () {});
})();
