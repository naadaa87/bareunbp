/* 복약 체크 — 최근 14일, 하루 1~2회 */
(function () {
  "use strict";
  var KEY = "bareun_meds_v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{"slots":1,"name":"","days":{}}'); } catch (e) { return { slots: 1, name: "", days: {} }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var st = load();
  var grid = document.getElementById("md-grid"), nm = document.getElementById("md-name"), slotBtns = document.querySelectorAll("#md-slots button");
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  function key(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function render() {
    nm.value = st.name || "";
    slotBtns.forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.v === st.slots ? "true" : "false"); });
    var html = "", t = new Date(); t.setHours(0, 0, 0, 0); var done = 0, need = 0;
    for (var i = 13; i >= 0; i--) {
      var d = new Date(t); d.setDate(t.getDate() - i); var k = key(d); var rec = st.days[k] || {};
      html += '<div class="md-day' + (i === 0 ? " is-today" : "") + '"><small>' + WD[d.getDay()] + '</small><b>' + (d.getMonth() + 1) + "/" + d.getDate() + "</b>";
      var labels = st.slots === 2 ? [["am", "아침"], ["pm", "저녁"]] : [["am", "복용"]];
      labels.forEach(function (l) { need++; if (rec[l[0]]) done++; html += '<label><input type="checkbox" data-k="' + k + '" data-s="' + l[0] + '"' + (rec[l[0]] ? " checked" : "") + "> " + l[1] + "</label>"; });
      html += "</div>";
    }
    grid.innerHTML = html;
    document.getElementById("md-sum").textContent = "최근 14일 체크 " + done + " / " + need + "회";
  }
  grid.addEventListener("change", function (e) {
    var c = e.target; if (!c.dataset.k) return;
    st.days[c.dataset.k] = st.days[c.dataset.k] || {}; st.days[c.dataset.k][c.dataset.s] = c.checked; save(); render();
  });
  nm.addEventListener("change", function () { st.name = nm.value.trim(); save(); });
  slotBtns.forEach(function (b) { b.addEventListener("click", function () { st.slots = +b.dataset.v; save(); render(); }); });
  render();
})();
