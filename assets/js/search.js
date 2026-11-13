/* 사이트 검색 — /search-index.json */
(function () {
  "use strict";
  var form = document.getElementById("sr-form"), input = document.getElementById("sr-q"), out = document.getElementById("sr-results"), info = document.getElementById("sr-info");
  var idx = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, ""); }
  function run(q) {
    var terms = q.trim().split(/\s+/).filter(Boolean).map(norm);
    if (!terms.length) { out.innerHTML = ""; info.textContent = ""; return; }
    var res = idx.map(function (d) {
      var t = norm(d.t), k = norm(d.k), s = norm(d.s), b = norm(d.b), sc = 0;
      terms.forEach(function (w) { if (t.indexOf(w) > -1) sc += 10; if (k.indexOf(w) > -1) sc += 6; if (s.indexOf(w) > -1) sc += 3; if (b.indexOf(w) > -1) sc += 1; });
      return { d: d, sc: sc };
    }).filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 30);
    info.textContent = "‘" + q + "’ 검색 결과 " + res.length + "건";
    out.innerHTML = res.map(function (x) { return '<li><a href="' + x.d.u + '"><span class="cat">' + esc(x.d.c) + '</span><span><b>' + esc(x.d.t) + '</b><span>' + esc(x.d.s) + '</span></span></a></li>'; }).join("") ||
      '<li class="fine" style="padding:16px">결과가 없습니다. 다른 낱말로 찾거나 <a href="/faq/">자주 묻는 질문</a>, <a href="/community/#ask">질문 남기기</a>를 이용하세요.</li>';
  }
  fetch("/search-index.json").then(function (r) { return r.json(); }).then(function (j) {
    idx = j;
    var q = new URLSearchParams(location.search).get("q") || "";
    input.value = q; if (q) { run(q); window.bpTrack && bpTrack("search", { q: q }); }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (!idx) return;
    history.replaceState(null, "", "?q=" + encodeURIComponent(input.value)); run(input.value);
    if (input.value.trim()) window.bpTrack && bpTrack("search", { q: input.value.trim() });
  });
})();
