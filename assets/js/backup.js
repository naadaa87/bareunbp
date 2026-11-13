/* 기록 백업·복원 */
(function () {
  "use strict";
  var KEYS = ["bareun_bp_v1", "bareun_meds_v1", "bareun_challenge_v1"];
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function msg(t) { var m = document.getElementById("bk-msg"); m.hidden = false; m.textContent = t; }
  var bp = get("bareun_bp_v1") || [];
  document.getElementById("bk-count").textContent = "현재 혈압 기록 " + bp.length + "건";
  document.getElementById("bk-export").addEventListener("click", function () {
    var out = { app: "bareunbp", version: 1, exported_at: new Date().toISOString(), data: {} };
    KEYS.forEach(function (k) { out.data[k] = get(k); });
    var blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
    var d = new Date(), name = "바른혈압_백업_" + d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + ".json";
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    msg("백업 파일을 내려받았습니다. 혈압 기록 " + bp.length + "건이 들어 있습니다.");
  });
  document.getElementById("bk-import").addEventListener("click", function () {
    var f = document.getElementById("bk-file").files[0];
    if (!f) { msg("불러올 파일을 먼저 선택하세요."); return; }
    var r = new FileReader();
    r.onload = function () {
      var o; try { o = JSON.parse(r.result); } catch (e) { msg("파일을 읽을 수 없습니다. 바른혈압에서 내려받은 백업 파일인지 확인하세요."); return; }
      if (!o || o.app !== "bareunbp" || !o.data) { msg("바른혈압 백업 파일이 아닙니다."); return; }
      var cur = get("bareun_bp_v1") || [], ids = {}, added = 0;
      cur.forEach(function (x) { ids[x.id] = 1; });
      (o.data.bareun_bp_v1 || []).forEach(function (x) { if (x && x.id && !ids[x.id] && typeof x.sys === "number") { cur.push(x); ids[x.id] = 1; added++; } });
      try {
        localStorage.setItem("bareun_bp_v1", JSON.stringify(cur));
        if (o.data.bareun_meds_v1 && !get("bareun_meds_v1")) localStorage.setItem("bareun_meds_v1", JSON.stringify(o.data.bareun_meds_v1));
        if (o.data.bareun_challenge_v1 && !get("bareun_challenge_v1")) localStorage.setItem("bareun_challenge_v1", JSON.stringify(o.data.bareun_challenge_v1));
      } catch (e) { msg("저장 공간이 부족해 불러오지 못했습니다."); return; }
      msg("혈압 기록 " + added + "건을 새로 불러왔습니다. 전체 " + cur.length + "건입니다.");
      document.getElementById("bk-count").textContent = "현재 혈압 기록 " + cur.length + "건";
    };
    r.readAsText(f);
  });
})();
