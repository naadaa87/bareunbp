/* 바른혈압 — 7일 혈압 기록 도구 */
(function () {
  "use strict";
  if (!window.BPStore) return;

  var form = document.getElementById("bp-form");
  var slotBtns = document.querySelectorAll("#slot button");
  var slot = new Date().getHours() < 12 ? "am" : "pm";

  function setSlot(s) {
    slot = s;
    slotBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.slot === s ? "true" : "false"); });
  }
  slotBtns.forEach(function (b) { b.addEventListener("click", function () { setSlot(b.dataset.slot); }); });
  setSlot(slot);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var sys = parseInt(form.sys.value, 10), dia = parseInt(form.dia.value, 10), pulse = parseInt(form.pulse.value, 10);
    if (!(sys > 50 && sys < 260)) { bpToast("수축기(위) 수치를 확인해 주세요."); form.sys.focus(); return; }
    if (!(dia > 30 && dia < 160)) { bpToast("이완기(아래) 수치를 확인해 주세요."); form.dia.focus(); return; }
    if (dia >= sys) { bpToast("이완기가 수축기보다 크거나 같습니다. 다시 확인해 주세요."); return; }
    var q = {};
    form.querySelectorAll(".quality input").forEach(function (c) { q[c.name] = c.checked; });
    var when = form.when.value ? new Date(form.when.value) : new Date();
    BPStore.add({ ts: when.toISOString(), sys: sys, dia: dia, pulse: isNaN(pulse) ? null : pulse, slot: slot, memo: form.memo.value.trim(), quality: q });
    window.bpTrack && bpTrack("record_saved");
    form.sys.value = ""; form.dia.value = ""; form.pulse.value = ""; form.memo.value = ""; form.when.value = "";
    form.querySelectorAll(".quality input").forEach(function (c) { c.checked = false; });
    bpToast("기록했습니다.");
    render();
    form.sys.focus();
  });

  // 삭제
  document.getElementById("log-body").addEventListener("click", function (e) {
    var b = e.target.closest(".del");
    if (!b) return;
    if (confirm("이 기록을 삭제할까요?")) { BPStore.remove(b.dataset.id); render(); }
  });
  document.getElementById("btn-clear").addEventListener("click", function () {
    if (BPStore.count() === 0) return;
    if (confirm("이 기기에 저장된 모든 혈압 기록을 삭제합니다. 되돌릴 수 없습니다.")) { BPStore.clear(); render(); }
  });
  document.getElementById("btn-csv").addEventListener("click", function () {
    window.bpTrack && bpTrack("csv_export");
    if (BPStore.count() === 0) { bpToast("내보낼 기록이 없습니다."); return; }
    var blob = new Blob([BPStore.exportCSV()], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "바른혈압_기록.csv"; a.click();
  });

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  var WD = ["일", "월", "화", "수", "목", "금", "토"];

  function render() {
    var all = BPStore.all();
    var recent = BPStore.recentDays(7);
    var st = BPStore.stats(recent);
    var empty = document.getElementById("empty");
    var has = all.length > 0;
    empty.style.display = has ? "none" : "block";
    document.getElementById("has-data").style.display = has ? "block" : "none";

    // 통계
    var g = document.getElementById("stats");
    if (st) {
      g.innerHTML =
        stat("7일 평균", "<span class=\"num\">" + st.sysAvg + " / " + st.diaAvg + "</span><em>mmHg</em>") +
        stat("측정 횟수", st.n + "<em>회 · " + Object.keys(BPStore.byDay(recent)).length + "일</em>") +
        stat("아침 평균", st.am ? st.amSys + " / " + st.amDia + "<em>" + st.am + "회</em>" : "<em>기록 없음</em>") +
        stat("저녁 평균", st.pm ? st.pmSys + " / " + st.pmDia + "<em>" + st.pm + "회</em>" : "<em>기록 없음</em>");
    } else {
      g.innerHTML = stat("7일 평균", "<em>최근 7일 기록이 없습니다</em>") + stat("측정 횟수", "0<em>회</em>") + stat("아침 평균", "<em>-</em>") + stat("저녁 평균", "<em>-</em>");
    }

    // 7일 달력
    var byDay = BPStore.byDay(recent);
    var days = document.getElementById("days");
    var html = "";
    var today = new Date(); today.setHours(0, 0, 0, 0);
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today); d.setDate(today.getDate() - i);
      var k = dayKey(d);
      var recs = byDay[k] || [];
      var am = recs.filter(function (r) { return r.slot === "am"; });
      var pm = recs.filter(function (r) { return r.slot === "pm"; });
      html += "<div class=\"day" + (i === 0 ? " is-today" : "") + "\"><small>" + WD[d.getDay()] + "</small><div class=\"d\">" + (d.getMonth() + 1) + "/" + d.getDate() + "</div>";
      if (!recs.length) html += "<div class=\"none\">미기록</div>";
      else {
        html += "<div class=\"v\">";
        if (am.length) html += "<i>아침</i> " + avg(am) + "<br>";
        if (pm.length) html += "<i>저녁</i> " + avg(pm);
        html += "</div>";
      }
      html += "</div>";
    }
    days.innerHTML = html;

    // 그래프
    drawChart(recent);

    // 목록 (전체, 최신순)
    var tb = document.getElementById("log-body");
    tb.innerHTML = all.slice().reverse().map(function (r) {
      var d = new Date(r.ts);
      var q = r.quality || {};
      var qn = ["rest5", "posture", "cuff", "noCaffeine", "noExercise"].filter(function (k) { return q[k]; }).length;
      return "<tr><td>" + (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + "</td><td>" + (r.slot === "am" ? "아침" : "저녁") + "</td><td class=\"n\">" + r.sys + " / " + r.dia + "</td><td class=\"n\">" + (r.pulse || "-") + "</td><td>" + (qn ? qn + "/5" : "-") + "</td><td>" + esc(r.memo || "") + "</td><td><button class=\"del\" data-id=\"" + r.id + "\" aria-label=\"삭제\">삭제</button></td></tr>";
    }).join("");

    document.getElementById("count-all").textContent = all.length;
  }

  function stat(label, val) { return "<div class=\"stat\"><small>" + label + "</small><b>" + val + "</b></div>"; }
  function avg(list) {
    var s = 0, d = 0; list.forEach(function (r) { s += r.sys; d += r.dia; });
    return Math.round(s / list.length) + "/" + Math.round(d / list.length);
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function drawChart(list) {
    var box = document.getElementById("chart");
    if (list.length < 2) { box.innerHTML = "<p class=\"tool-note\" style=\"margin:0\">기록이 2개 이상 쌓이면 추이 그래프가 표시됩니다.</p>"; return; }
    var W = 640, H = 220, L = 40, R = 16, T = 16, B = 30;
    var vals = list.map(function (r) { return r.sys; }).concat(list.map(function (r) { return r.dia; }));
    var lo = Math.max(30, Math.floor((Math.min.apply(null, vals) - 10) / 10) * 10);
    var hi = Math.ceil((Math.max.apply(null, vals) + 10) / 10) * 10;
    var xs = function (i) { return L + (W - L - R) * (list.length === 1 ? 0.5 : i / (list.length - 1)); };
    var ys = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
    var grid = "";
    for (var v = lo; v <= hi; v += 10) {
      grid += "<line x1=\"" + L + "\" x2=\"" + (W - R) + "\" y1=\"" + ys(v) + "\" y2=\"" + ys(v) + "\" stroke=\"#e6ecf3\"/><text x=\"" + (L - 6) + "\" y=\"" + (ys(v) + 4) + "\" font-size=\"10\" fill=\"#8a98a8\" text-anchor=\"end\">" + v + "</text>";
    }
    var p1 = "", p2 = "", dots = "", labels = "";
    list.forEach(function (r, i) {
      p1 += (i ? " L" : "M") + xs(i) + " " + ys(r.sys);
      p2 += (i ? " L" : "M") + xs(i) + " " + ys(r.dia);
      dots += "<circle cx=\"" + xs(i) + "\" cy=\"" + ys(r.sys) + "\" r=\"3.5\" fill=\"#2b6fc2\"/><circle cx=\"" + xs(i) + "\" cy=\"" + ys(r.dia) + "\" r=\"3.5\" fill=\"#2e8f8c\"/>";
      var d = new Date(r.ts);
      if (list.length <= 14 || i % Math.ceil(list.length / 10) === 0) labels += "<text x=\"" + xs(i) + "\" y=\"" + (H - 8) + "\" font-size=\"10\" fill=\"#8a98a8\" text-anchor=\"middle\">" + (d.getMonth() + 1) + "/" + d.getDate() + (r.slot === "am" ? "아" : "저") + "</text>";
    });
    box.innerHTML = "<svg viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"최근 7일 수축기·이완기 추이\">" + grid +
      "<path d=\"" + p1 + "\" fill=\"none\" stroke=\"#2b6fc2\" stroke-width=\"2\"/><path d=\"" + p2 + "\" fill=\"none\" stroke=\"#2e8f8c\" stroke-width=\"2\"/>" + dots + labels +
      "<g font-size=\"11\"><rect x=\"" + (W - 150) + "\" y=\"4\" width=\"10\" height=\"10\" fill=\"#2b6fc2\"/><text x=\"" + (W - 136) + "\" y=\"13\" fill=\"#5b6b7d\">수축기</text><rect x=\"" + (W - 80) + "\" y=\"4\" width=\"10\" height=\"10\" fill=\"#2e8f8c\"/><text x=\"" + (W - 66) + "\" y=\"13\" fill=\"#5b6b7d\">이완기</text></g></svg>";
  }

  render();
  if (location.search.indexOf("from=home") > -1) { bpToast("첫 기록이 저장됐습니다. 아침·저녁으로 7일간 이어가 보세요."); history.replaceState(null, "", location.pathname); }
})();
