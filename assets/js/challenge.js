/* 챌린지 진행 — 날짜별 완료 기록 */
(function () {
  "use strict";
  var KEY = "bareun_challenge_v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  var st = load();
  document.querySelectorAll(".challenge").forEach(function (card) {
    var id = card.dataset.id, days = +card.dataset.days;
    var grid = card.querySelector(".ch-grid"), status = card.querySelector(".ch-status"), btn = card.querySelector(".ch-done");
    function render() {
      var done = (st[id] && st[id].dates) || [];
      var html = "";
      for (var i = 0; i < days; i++) html += '<span class="' + (i < done.length ? "on" : "") + '" title="' + (i + 1) + '일차">' + (i + 1) + "</span>";
      grid.innerHTML = html;
      var isToday = done.indexOf(today()) > -1;
      btn.disabled = isToday || done.length >= days;
      btn.textContent = done.length >= days ? "완료했습니다" : isToday ? "오늘 완료함" : "오늘 완료";
      status.textContent = done.length ? done.length + " / " + days + "일 · 시작 " + done[0] : "아직 시작하지 않았습니다.";
    }
    btn.addEventListener("click", function () {
      st[id] = st[id] || { dates: [] };
      if (st[id].dates.indexOf(today()) === -1) st[id].dates.push(today());
      save(st); render(); window.bpTrack && bpTrack("challenge_done");
      if (st[id].dates.length >= days && window.bpToast) bpToast("챌린지를 마쳤습니다. 경험을 커뮤니티에 나눠 주세요.");
    });
    card.querySelector(".ch-reset").addEventListener("click", function () {
      if (!confirm("이 챌린지 기록을 처음부터 다시 시작할까요?")) return;
      delete st[id]; save(st); render();
    });
    render();
  });
})();
