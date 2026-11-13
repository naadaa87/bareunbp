/* 바른혈압 — 진료 준비 리포트 */
(function () {
  "use strict";
  if (!window.BPStore) return;
  var sel = document.getElementById("range");
  var sheet = document.getElementById("sheet");
  var empty = document.getElementById("report-empty");

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(d) { return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()); }

  function build() {
    var days = parseInt(sel.value, 10);
    var list = BPStore.recentDays(days);
    if (!list.length) { empty.style.display = "block"; sheet.style.display = "none"; return; }
    empty.style.display = "none"; sheet.style.display = "block";
    var st = BPStore.stats(list);
    var first = new Date(list[0].ts), last = new Date(list[list.length - 1].ts);
    document.getElementById("r-period").textContent = fmt(first) + " ~ " + fmt(last) + " (" + Object.keys(BPStore.byDay(list)).length + "일 · " + st.n + "회)";
    document.getElementById("r-made").textContent = "작성일 " + fmt(new Date());
    document.getElementById("r-stats").innerHTML =
      cell("전체 평균", st.sysAvg + " / " + st.diaAvg, "mmHg") +
      cell("아침 평균", st.am ? st.amSys + " / " + st.amDia : "-", st.am ? st.am + "회" : "") +
      cell("저녁 평균", st.pm ? st.pmSys + " / " + st.pmDia : "-", st.pm ? st.pm + "회" : "") +
      cell("범위", st.sysMin + "~" + st.sysMax + " / " + st.diaMin + "~" + st.diaMax, st.pulseAvg ? "맥박 평균 " + st.pulseAvg : "");
    var rows = "";
    list.forEach(function (r) {
      var d = new Date(r.ts); var q = r.quality || {};
      var qs = [q.rest5 ? "안정" : null, q.posture ? "자세" : null, q.cuff ? "커프" : null, q.noCaffeine ? "무카페인" : null, q.noExercise ? "운동전" : null].filter(Boolean).join("·");
      rows += "<tr><td>" + (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + "</td><td>" + (r.slot === "am" ? "아침" : "저녁") + "</td><td class=\"num\">" + r.sys + "</td><td class=\"num\">" + r.dia + "</td><td class=\"num\">" + (r.pulse || "") + "</td><td>" + qs + "</td><td>" + esc(r.memo || "") + "</td></tr>";
    });
    document.getElementById("r-rows").innerHTML = rows;
    // 복약 체크 요약 (있을 때만)
    var mEl = document.getElementById("r-meds");
    try {
      var md = JSON.parse(localStorage.getItem("bareun_meds_v1") || "null");
      if (md && md.days && Object.keys(md.days).length) {
        var since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (days - 1));
        var need = 0, got = 0;
        for (var d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
          var k = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
          var r = md.days[k] || {};
          (md.slots === 2 ? ["am", "pm"] : ["am"]).forEach(function (s) { need++; if (r[s]) got++; });
        }
        mEl.textContent = "복약 체크(이용자 기록): 기간 중 " + got + " / " + need + "회" + (md.name ? " · " + md.name : "");
        mEl.style.display = "";
      } else { mEl.style.display = "none"; }
    } catch (e) { mEl.style.display = "none"; }
  }
  function cell(l, v, u) { return "<div><small>" + l + "</small><b>" + v + "</b>" + (u ? " <small style=\"display:inline\">" + u + "</small>" : "") + "</div>"; }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  sel.addEventListener("change", build);
  document.getElementById("btn-print").addEventListener("click", function () { window.print(); });
  build();
})();
