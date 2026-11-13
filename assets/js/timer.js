/* 혈압 측정 타이머 — 5분 안정 → 1회 → 1분 휴식 → 2회 → 저장 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var step = $("tm-step"), clock = $("tm-clock"), guide = $("tm-guide"), entry = $("tm-entry"), go = $("tm-go"), skip = $("tm-skip"), result = $("tm-result");
  var phase = "ready", timer = null, left = 0, first = null;
  function fmt(s) { return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function beep() { try { var c = new (window.AudioContext || window.webkitAudioContext)(); var o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); setTimeout(function () { o.stop(); c.close(); }, 300); } catch (e) {} if (navigator.vibrate) navigator.vibrate(200); }
  function count(sec, done) {
    clearInterval(timer); left = sec; clock.textContent = fmt(left); skip.hidden = false;
    timer = setInterval(function () { left--; clock.textContent = fmt(Math.max(0, left)); if (left <= 0) { clearInterval(timer); skip.hidden = true; beep(); done(); } }, 1000);
    skip.onclick = function () { clearInterval(timer); skip.hidden = true; done(); };
  }
  function read() {
    var s = parseInt($("tm-sys").value, 10), d = parseInt($("tm-dia").value, 10), p = parseInt($("tm-pulse").value, 10);
    if (!(s > 50 && s < 260) || !(d > 30 && d < 160) || d >= s) { bpToast("수치를 확인해 주세요."); return null; }
    return { sys: s, dia: d, pulse: isNaN(p) ? null : p };
  }
  function clearInputs() { $("tm-sys").value = ""; $("tm-dia").value = ""; $("tm-pulse").value = ""; }
  go.addEventListener("click", function () {
    if (phase === "ready") {
      window.bpTrack && bpTrack("timer_start"); phase = "rest"; step.textContent = "1단계 · 안정"; guide.textContent = "말하지 않고 편안히 앉아 기다립니다. 휴대폰도 잠시 내려놓으세요.";
      go.hidden = true;
      count(300, function () { phase = "m1"; step.textContent = "2단계 · 1회 측정"; clock.textContent = "측정"; guide.textContent = "지금 혈압계를 작동하세요. 재는 동안 말하거나 움직이지 않습니다. 결과를 입력하세요."; entry.hidden = false; go.hidden = false; go.textContent = "1회 값 저장"; $("tm-sys").focus(); });
    } else if (phase === "m1") {
      first = read(); if (!first) return;
      clearInputs(); entry.hidden = true; go.hidden = true; phase = "pause"; step.textContent = "3단계 · 휴식"; guide.textContent = "커프를 감은 채 1분 쉬었다가 다시 잽니다.";
      count(60, function () { phase = "m2"; step.textContent = "4단계 · 2회 측정"; clock.textContent = "측정"; guide.textContent = "두 번째로 잽니다. 결과를 입력하세요."; entry.hidden = false; go.hidden = false; go.textContent = "2회 값 저장하고 기록"; $("tm-sys").focus(); });
    } else if (phase === "m2") {
      var second = read(); if (!second) return;
      var slot = new Date().getHours() < 12 ? "am" : "pm";
      var q = { rest5: true, posture: true, cuff: true };
      [first, second].forEach(function (m) { BPStore.add({ sys: m.sys, dia: m.dia, pulse: m.pulse, slot: slot, memo: "타이머 측정", quality: q }); });
      var as = Math.round((first.sys + second.sys) / 2), ad = Math.round((first.dia + second.dia) / 2);
      entry.hidden = true; step.textContent = "완료"; clock.textContent = as + "/" + ad;
      guide.textContent = "두 번의 평균입니다. 두 값 모두 " + (slot === "am" ? "아침" : "저녁") + " 기록으로 저장했습니다.";
      result.hidden = false; result.innerHTML = '1회 ' + first.sys + '/' + first.dia + ' · 2회 ' + second.sys + '/' + second.dia + ' — <a href="/check7/">7일 기록에서 보기</a>';
      window.bpTrack && bpTrack("timer_done"); phase = "done"; go.textContent = "다시 시작"; 
    } else { location.reload(); }
  });
})();
