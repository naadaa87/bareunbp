/* 나트륨 계산기 — 오늘 목록은 날짜별로 localStorage에 저장 */
(function () {
  "use strict";
  var data = JSON.parse(document.getElementById("sd-data").textContent);
  var KEY = "bareun_sodium_v1";
  var list = document.getElementById("sd-list"), q = document.getElementById("sd-q");
  var tbody = document.getElementById("sd-today");
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function load() {
    try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return o.date === today() ? o.items || [] : []; } catch (e) { return []; }
  }
  function save(items) { try { localStorage.setItem(KEY, JSON.stringify({ date: today(), items: items })); } catch (e) {} }
  var items = load();
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function renderList() {
    var v = q.value.trim();
    var shown = data.filter(function (d) { return !v || d.n.indexOf(v) > -1 || d.c.indexOf(v) > -1; }).slice(0, 40);
    list.innerHTML = shown.map(function (d, i) {
      return '<li><button type="button" data-n="' + esc(d.n) + '" data-mg="' + d.mg + '"><span>' + esc(d.n) + '<small>' + esc(d.c) + ' · ' + esc(d.s) + '</small></span><b>' + d.mg.toLocaleString() + 'mg</b></button></li>';
    }).join("") || '<li class="fine">검색 결과가 없습니다. 아래에서 직접 입력하세요.</li>';
  }
  function render() {
    var total = 0;
    tbody.innerHTML = items.map(function (it, i) {
      var mg = it.half ? Math.round(it.mg / 2) : it.mg; total += mg;
      return '<tr><td>' + esc(it.n) + '</td><td class="n">' + mg.toLocaleString() + 'mg</td><td><label style="font-size:.85rem"><input type="checkbox" data-half="' + i + '"' + (it.half ? " checked" : "") + '> 남김</label></td><td><button class="del" data-del="' + i + '">삭제</button></td></tr>';
    }).join("") || '<tr><td colspan="4" class="fine" style="padding:16px">메뉴 목록에서 오늘 먹은 메뉴를 골라 보세요.</td></tr>';
    document.getElementById("sd-total").textContent = total.toLocaleString();
    var pct = Math.round(total / 20);
    var bar = document.getElementById("sd-bar");
    bar.style.width = Math.min(100, pct / 2) + "%";
    bar.className = pct > 100 ? "over" : "";
    document.getElementById("sd-msg").textContent = total ? "WHO 하루 권고 상한 2,000mg의 약 " + pct + "%입니다. (소금 약 " + (total / 400).toFixed(1) + "g)" : "WHO 하루 권고 상한 2,000mg(소금 약 5g) 대비 비율을 표시합니다.";
  }
  list.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    items.push({ n: b.dataset.n, mg: parseInt(b.dataset.mg, 10), half: false }); save(items); render();
    if (window.bpToast) bpToast(b.dataset.n + " 추가");
  });
  tbody.addEventListener("click", function (e) {
    var d = e.target.closest("[data-del]"); if (d) { items.splice(+d.dataset.del, 1); save(items); render(); }
  });
  tbody.addEventListener("change", function (e) {
    var h = e.target.closest("[data-half]"); if (h) { items[+h.dataset.half].half = h.checked; save(items); render(); }
  });
  document.getElementById("sd-custom").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("sd-name").value.trim(), mg = parseInt(document.getElementById("sd-mg").value, 10);
    if (!n || !(mg >= 0)) return;
    items.push({ n: n, mg: mg, half: false }); save(items); render(); e.target.reset();
  });
  document.getElementById("sd-clear").addEventListener("click", function () { items = []; save(items); render(); });
  q.addEventListener("input", renderList);
  renderList(); render();
})();
