/* 바른혈압 — 로컬 기록 저장소
   원칙: 기본은 브라우저(localStorage)에만 저장. 서버로 보내지 않는다.
   레코드: { id, ts(ISO), sys, dia, pulse, slot("am"|"pm"), memo, quality:{rest5,posture,cuff,noCaffeine,noExercise} } */
(function () {
  "use strict";
  var KEY = "bareun_bp_v1";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  window.BPStore = {
    all: function () { return load().sort(function (a, b) { return a.ts < b.ts ? -1 : 1; }); },
    add: function (rec) {
      var list = load();
      rec.id = rec.id || uid();
      rec.ts = rec.ts || new Date().toISOString();
      list.push(rec);
      save(list);
      return rec;
    },
    remove: function (id) { save(load().filter(function (r) { return r.id !== id; })); },
    clear: function () { save([]); },
    count: function () { return load().length; },
    // 최근 N일 (오늘 포함) 레코드
    recentDays: function (n) {
      var since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (n - 1));
      return this.all().filter(function (r) { return new Date(r.ts) >= since; });
    },
    stats: function (list) {
      if (!list.length) return null;
      var s = { n: list.length, sysAvg: 0, diaAvg: 0, pulseAvg: null, sysMax: -1, sysMin: 999, diaMax: -1, diaMin: 999, am: 0, pm: 0, amSys: 0, amDia: 0, pmSys: 0, pmDia: 0 };
      var ps = 0, pn = 0;
      list.forEach(function (r) {
        s.sysAvg += r.sys; s.diaAvg += r.dia;
        if (r.pulse) { ps += r.pulse; pn++; }
        s.sysMax = Math.max(s.sysMax, r.sys); s.sysMin = Math.min(s.sysMin, r.sys);
        s.diaMax = Math.max(s.diaMax, r.dia); s.diaMin = Math.min(s.diaMin, r.dia);
        if (r.slot === "am") { s.am++; s.amSys += r.sys; s.amDia += r.dia; } else { s.pm++; s.pmSys += r.sys; s.pmDia += r.dia; }
      });
      s.sysAvg = Math.round(s.sysAvg / s.n); s.diaAvg = Math.round(s.diaAvg / s.n);
      s.pulseAvg = pn ? Math.round(ps / pn) : null;
      if (s.am) { s.amSys = Math.round(s.amSys / s.am); s.amDia = Math.round(s.amDia / s.am); }
      if (s.pm) { s.pmSys = Math.round(s.pmSys / s.pm); s.pmDia = Math.round(s.pmDia / s.pm); }
      return s;
    },
    // 일자별 묶음 (YYYY-MM-DD → [rec])
    byDay: function (list) {
      var m = {};
      list.forEach(function (r) { var k = r.ts.slice(0, 10); (m[k] = m[k] || []).push(r); });
      return m;
    },
    exportCSV: function () {
      var rows = [["일시", "구분", "수축기", "이완기", "맥박", "측정전 5분 안정", "자세", "커프 위치", "카페인·흡연 없음", "운동 30분 이상 전", "메모"]];
      this.all().forEach(function (r) {
        var q = r.quality || {};
        rows.push([r.ts.replace("T", " ").slice(0, 16), r.slot === "am" ? "아침" : "저녁", r.sys, r.dia, r.pulse || "", q.rest5 ? "예" : "", q.posture ? "예" : "", q.cuff ? "예" : "", q.noCaffeine ? "예" : "", q.noExercise ? "예" : "", (r.memo || "").replace(/"/g, "'")]);
      });
      return "\uFEFF" + rows.map(function (r) { return r.map(function (c) { return '"' + c + '"'; }).join(","); }).join("\n");
    }
  };
})();
