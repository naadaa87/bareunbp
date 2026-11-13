/* 측정 알림 — iCalendar(.ics) 생성 */
(function () {
  "use strict";
  var f = document.getElementById("rm-form"); if (!f) return;
  var st = document.getElementById("rm-start");
  var t = new Date(); st.value = t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2);
  function pad(n) { return ("0" + n).slice(-2); }
  function ev(uid, date, time, title, desc, count) {
    var p = date.split("-"), h = time.split(":");
    var dt = p[0] + p[1] + p[2] + "T" + h[0] + h[1] + "00";
    var now = new Date(); var stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + "T" + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + "00Z";
    return ["BEGIN:VEVENT", "UID:" + uid + "@bareunbp", "DTSTAMP:" + stamp, "DTSTART;TZID=Asia/Seoul:" + dt, "DURATION:PT10M",
      "RRULE:FREQ=DAILY" + (count ? ";COUNT=" + count : ""), "SUMMARY:" + title, "DESCRIPTION:" + desc,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + title, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT"].join("\r\n");
  }
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var useAm = document.getElementById("rm-use-am").checked, usePm = document.getElementById("rm-use-pm").checked;
    if (!useAm && !usePm) { bpToast("아침 또는 저녁 알림을 하나 이상 선택하세요."); return; }
    var n = parseInt(document.getElementById("rm-len").value, 10), date = st.value, meds = document.getElementById("rm-meds").checked;
    var base = "등받이 의자에 앉아 5분 안정 후 1~2분 간격으로 2번 재고 기록하세요. " + location.origin + "/check7/";
    var evs = [];
    if (useAm) evs.push(ev("am-" + Date.now(), date, document.getElementById("rm-am").value, "아침 혈압 측정" + (meds ? " (약 복용 전)" : ""), "기상 후 1시간 이내\\, 소변 후\\, 식사·약 복용 전. " + base, n));
    if (usePm) evs.push(ev("pm-" + Date.now(), date, document.getElementById("rm-pm").value, "저녁 혈압 측정", "잠들기 전. " + base, n));
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bareun BP//Reminder//KO", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VTIMEZONE", "TZID:Asia/Seoul", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0900", "TZOFFSETTO:+0900", "TZNAME:KST", "END:STANDARD", "END:VTIMEZONE"].concat(evs).concat(["END:VCALENDAR"]).join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "바른혈압_측정알림.ics"; document.body.appendChild(a); a.click(); a.remove();
    bpToast("캘린더 파일을 내려받았습니다. 파일을 열어 추가하세요.");
  });
})();
