/* 바른혈압 관리자 콘솔 */
(function () {
  "use strict";

  // ============================================================ 상수
  var QNA_ST = { pending: "새 질문", draft: "작성 중", review: "감수 요청", published: "게시됨", hidden: "숨김" };
  var QNA_TAG = { pending: "t-red", draft: "t-amber", review: "t-blue", published: "t-green", hidden: "" };
  var QNA_CATS = ["검진에서 처음", "측정", "생활", "음식", "약", "젊은 혈압", "가족", "기타", "경험담"];
  var LEAD_ST = { "new": "신규", contacted: "연락함", progress: "진행 중", done: "완료", hold: "보류" };
  var LEAD_TAG = { "new": "t-red", contacted: "t-blue", progress: "t-amber", done: "t-green", hold: "" };
  var LEAD_TYPE = { clinic: "의원·병원", checkup: "검진센터", corporate: "기업·단체", "public": "보건소·공공", device: "의료기기·헬스케어", family: "가족 기능 신청", other: "기타" };
  var REP_ST = { pending: "접수", reviewing: "검토 중", published: "발행", rejected: "반려", duplicate: "중복" };
  var REP_TAG = { pending: "t-red", reviewing: "t-amber", published: "t-green", rejected: "", duplicate: "" };
  var TYPE_LABEL = { info: "건강정보", food: "음식·식단", recipe: "레시피", factcheck: "팩트체크", guide: "안내·도구", policy: "정책" };
  var EVENT_LABEL = {
    record_saved: "혈압 기록 저장", quick_entry: "홈 빠른 기록", csv_export: "기록 CSV 내보내기", report_view: "리포트 열람(기록 있음)",
    report_print: "리포트 인쇄", timer_start: "측정 타이머 시작", timer_done: "측정 타이머 완료", sodium_use: "나트륨 계산기 사용",
    meds_check: "복약 체크", reminder_ics: "측정 알림 만들기", backup_export: "기록 백업 저장", backup_import: "기록 불러오기",
    challenge_done: "챌린지 완료 체크", form_qna: "질문·경험담 제출", form_lead: "문의·신청 제출", form_newsletter: "레터 구독",
    form_report: "팩트체크 요청", search: "사이트 검색", logsheet_print: "기록지 인쇄", recipe_print: "레시피 인쇄", mealplan_print: "식단표 인쇄",
    signup: "회원가입", withdraw: "회원 탈퇴", post_create: "게시판 글 작성", comment_create: "댓글 작성", bookmark_add: "글 저장(회원)", share: "글 공유", video_play: "영상 재생",
    save: "글 저장 버튼", mall_click: "쿠팡 상품 클릭", mall_view: "몰 상품 노출 묶음", mall_box: "글 끝 관련 제품 상자 클릭", out: "바깥 링크 클릭", cta: "버튼 클릭"
  };
  var ACTION_LABEL = {
    login: "로그인", login_failed: "로그인 실패", qna_publish: "질문 게시", qna_update: "질문 저장", qna_delete: "질문 삭제",
    qna_review_ok: "답변 검토 완료", qna_review_back: "답변 수정 요청", lead_update: "문의 처리", lead_delete: "문의 파기",
    newsletter_unsubscribe: "구독 해지 처리", newsletter_restore: "구독 복구", newsletter_delete: "구독자 파기", newsletter_export: "구독자 내보내기",
    report_update: "팩트체크 요청 처리", report_delete: "팩트체크 요청 삭제", review_approve: "콘텐츠 감수 승인", review_revise: "콘텐츠 수정 필요",
    review_delete: "감수 기록 삭제", correction_add: "정정 이력 추가", correction_edit: "정정 이력 수정", settings_notice: "공지 변경",
    purge: "보유기간 파기", export_all: "전체 백업",
    member_suspend: "회원 이용 제한", member_restore: "회원 제한 해제", member_temppw: "임시 비밀번호 발급", member_delete: "회원 강제 탈퇴", member_memo: "회원 메모",
    post_hide: "글 숨김", post_restore: "글 다시 보이기", post_delete: "글 완전 삭제", post_pin: "글 고정 변경", post_update: "글 수정", notice_add: "공지 작성",
    comment_hide: "댓글 숨김", comment_restore: "댓글 다시 보이기", comment_delete: "댓글 삭제", ugc_resolve: "신고 처리",
    video_add: "영상 추가", video_edit: "영상 수정", video_delete: "영상 삭제",
    mall_report: "쿠팡 실적 입력", mall_report_delete: "쿠팡 실적 삭제", mall_item_add: "몰 상품 추가", mall_item_edit: "몰 상품 수정", mall_item_delete: "몰 상품 삭제", mall_hide: "몰 상품 숨김 변경"
  };
  // 편집 정책 표현 가이드 — 서버와 같은 목록
  var BANNED = ["완치", "치료합니다", "치료해", "치료 효과", "치료됩니다", "약을 끊", "약 끊", "끊으세요", "끊어도 됩니다", "줄이세요", "복용을 중단", "중단하세요", "드시면 됩니다", "처방합니다", "진단합니다", "진단됩니다", "발병위험", "사망위험", "위험도", "보장합니다", "100%", "특효", "특효약", "확실히 낮", "무조건"];
  var BANNED_HINT = {
    "완치": "관리에 도움이 될 수 있습니다", "치료": "관리에 도움이 될 수 있습니다", "끊": "약의 조정은 처방한 의료진과 상의하세요", "줄이세요": "약의 조정은 처방한 의료진과 상의하세요",
    "중단": "약의 조정은 처방한 의료진과 상의하세요", "드시면": "의료진·약사와 상의하세요", "처방": "의료진이 판단합니다", "진단": "진료 때 의료진과 확인하세요",
    "위험": "개인 위험도·확률 수치는 쓰지 않습니다", "보장": "과장 표현 삭제", "100%": "과장 표현 삭제", "특효": "과장 표현 삭제", "확실히": "과장 표현 삭제", "무조건": "과장 표현 삭제"
  };
  var TEMPLATES = [
    { n: "정보 안내 + 관련 글", t: "(질문의 핵심에 한두 문장으로 답합니다. 지침·공공자료 기준으로 쓰고, 개인 판단은 하지 않습니다.)\n\n관련 글: [제목](/info/)" },
    { n: "개인 판단 영역 (약·진단·수치 해석)", t: "이 질문은 커뮤니티에서 답할 수 없는 영역입니다. 약의 시작·조정·중단과 수치의 해석은 기록과 검사 결과를 본 의료진이 판단합니다.\n\n진료 때 이렇게 물어보세요.\n- 제 가정혈압 평균은 목표 기준으로 어느 범위인가요?\n- 지금 상황에서 약이나 생활습관을 바꿀 필요가 있나요?\n\n진료 전에 [7일 혈압 기록](/check7/)을 [진료 준비 리포트](/report/)로 정리해 가져가면 상담이 수월합니다." },
    { n: "측정 방법 확인", t: "숫자를 해석하기 전에 측정 조건부터 맞춰 보세요. 등받이 의자에 앉아 5분 안정한 뒤, 위팔 심장 높이에 커프를 감고 1~2분 간격으로 2번 잽니다. 아침(기상 후 1시간 이내, 약·식사 전)과 저녁(잠들기 전)으로 5~7일 기록하면 평균을 볼 수 있습니다.\n\n관련: [바르게 재기](/measure/) · [측정 타이머](/tools/timer/)" },
    { n: "응급 신호 안내", t: "말씀하신 상황에 갑작스러운 심한 두통, 가슴 통증, 한쪽 팔다리 힘 빠짐, 말이 어눌해짐, 시야 이상이 함께 있다면 이 답변을 기다리지 말고 즉시 119에 연락하세요. 안정 후에도 혈압이 180/120 이상으로 반복되면 당일 진료를 받으세요.\n\n관련: [혈압 180/120 이상일 때](/info/hypertensive-crisis)" },
    { n: "음식·나트륨", t: "(질문에 대한 답)\n\n메뉴별 나트륨은 [외식 나트륨표](/food/sodium-table)에서 비교할 수 있고, 오늘 먹은 양은 [나트륨 계산기](/tools/sodium/)로 대략 확인할 수 있습니다. 콩팥 질환이 있거나 식이 제한을 받고 있다면 의료진·영양사의 지시를 우선하세요." },
    { n: "경험담 게시 안내", t: "경험을 나눠 주셔서 감사합니다. 같은 고민을 가진 분들께 도움이 될 것 같습니다. 다만 약이나 수치에 관한 판단은 사람마다 다르니, 따라 하기 전에 의료진과 상의하세요." }
  ];

  // ============================================================ 상태·유틸
  var S = { me: null, content: null, contentMap: {}, badge: {}, route: "", params: {} };
  var app = document.getElementById("app");

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function renderAnswer(s) {
    return esc(s).replace(/\[([^\]\n]{1,80})\]\((\/[A-Za-z0-9\-_\/.#]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");
  }
  function kst(iso) {
    if (!iso) return "";
    var d = new Date(new Date(iso).getTime() + 9 * 3600e3);
    var p = function (n) { return ("0" + n).slice(-2); };
    return d.getUTCFullYear() + "." + p(d.getUTCMonth() + 1) + "." + p(d.getUTCDate()) + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes());
  }
  function kstDate(iso) { return kst(iso).slice(0, 10); }
  function kstDay(off) { return new Date(Date.now() + 9 * 3600e3 - (off || 0) * 86400e3).toISOString().slice(0, 10); }
  function ago(iso) {
    if (!iso) return "";
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "방금"; if (m < 60) return m + "분 전"; var h = Math.round(m / 60); if (h < 24) return h + "시간 전"; var d = Math.round(h / 24); return d < 31 ? d + "일 전" : kstDate(iso);
  }
  function toast(msg, err) {
    var t = document.getElementById("toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : "");
    clearTimeout(t._t); t._t = setTimeout(function () { t.className = "toast"; }, 2800);
  }
  function api(path, opt) {
    opt = opt || {};
    var init = { method: opt.method || "GET", credentials: "same-origin", headers: { "X-BP-Admin": "1" } };
    if (opt.body !== undefined) { init.method = "POST"; init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(opt.body); }
    return fetch("/api/admin/" + path, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "network", status: r.status }; }).then(function (j) {
        j.status = r.status;
        if (r.status === 401 && path !== "login") { S.me = null; renderLogin(); throw new Error("unauthorized"); }
        return j;
      });
    }).catch(function (e) {
      if (e && e.message === "unauthorized") throw e;
      return { ok: false, error: "network" };
    });
  }
  function errMsg(j) {
    if (!j) return "알 수 없는 오류";
    if (j.message) return j.message;
    var m = { not_configured: "데이터베이스가 연결되지 않았습니다. 시스템 화면의 안내를 확인하세요.", db_error: "데이터베이스 오류" + (j.detail ? ": " + j.detail : ""), network: "서버에 연결할 수 없습니다.", forbidden: "권한이 없습니다.", not_found: "항목을 찾을 수 없습니다." };
    return m[j.error] || j.error || "오류가 발생했습니다.";
  }
  function qs(o) { var a = []; for (var k in o) if (o[k] !== undefined && o[k] !== "" && o[k] !== null) a.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k])); return a.length ? "?" + a.join("&") : ""; }
  function isAdmin() { return S.me && S.me.role === "admin"; }
  function bannedIn(t) { t = String(t || ""); return BANNED.filter(function (w) { return t.indexOf(w) > -1; }); }
  function hintFor(w) { for (var k in BANNED_HINT) if (w.indexOf(k) > -1) return BANNED_HINT[k]; return "표현 수정"; }
  function csvDownload(name, rows) {
    var csv = "﻿" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function loadContent() {
    if (S.content) return Promise.resolve(S.content);
    return fetch("/content-index.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      S.content = j; j.forEach(function (c) { S.contentMap[c.p] = c; }); return j;
    }).catch(function () { S.content = []; return []; });
  }
  function titleOf(p) { var c = S.contentMap[p]; return c ? c.t : p; }

  // ============================================================ 모달·서랍
  function confirmBox(title, html, okLabel, danger) {
    return new Promise(function (resolve) {
      var bg = document.createElement("div"); bg.className = "modal-bg";
      bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h3>' + esc(title) + "</h3>" + html + '<div class="acts"><button class="btn btn-s" data-x="0">취소</button><button class="btn ' + (danger ? "btn-d" : "btn-p") + '" data-x="1">' + esc(okLabel || "확인") + "</button></div></div>";
      document.body.appendChild(bg);
      bg.addEventListener("click", function (e) { var b = e.target.closest("[data-x]"); if (b || e.target === bg) { var v = b ? b.dataset.x === "1" : false; bg.remove(); resolve(v); } });
      bg.querySelector('[data-x="1"]').focus();
    });
  }
  var drawerEl = null;
  function openDrawer(title, bodyHtml, footHtml) {
    closeDrawer();
    drawerEl = document.createElement("div");
    drawerEl.innerHTML = '<div class="drawer-bg"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="drawer-h"><h2>' + esc(title) + '</h2><button class="btn btn-g" data-close aria-label="닫기">닫기 ✕</button></div><div class="drawer-b">' + bodyHtml + '</div><div class="drawer-f">' + (footHtml || "") + "</div></aside>";
    document.body.appendChild(drawerEl);
    drawerEl.querySelector(".drawer-bg").addEventListener("click", closeDrawer);
    drawerEl.querySelector("[data-close]").addEventListener("click", closeDrawer);
    return drawerEl.querySelector(".drawer");
  }
  function closeDrawer() { if (drawerEl) { drawerEl.remove(); drawerEl = null; } }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var m = document.querySelector(".modal-bg"); if (m) return; closeDrawer(); } });

  // ============================================================ 로그인
  function renderLogin(msgHtml) {
    closeDrawer();
    var savedName = ""; try { savedName = localStorage.getItem("bp_admin_name") || ""; } catch (e) {}
    app.innerHTML = '<div class="login"><form class="login-card" id="lf" autocomplete="off"><img src="/assets/img/logo.png" alt="바른혈압"><h1>관리자 콘솔</h1><p>질문 답변, 문의 처리, 감수 기록, 통계를 관리합니다.</p>' +
      '<div class="field"><label for="ln">처리자 이름</label><input id="ln" maxlength="20" required placeholder="예: 최시준" value="' + esc(savedName) + '"><div class="hint">처리 이력에 기록됩니다.</div></div>' +
      '<div class="field"><label for="lk">접속 키</label><input id="lk" type="password" required autocomplete="current-password"></div>' +
      '<button class="btn btn-p" style="width:100%;padding:11px" type="submit">로그인</button><div id="lmsg">' + (msgHtml || "") + "</div></form></div>";
    var f = document.getElementById("lf");
    (savedName ? document.getElementById("lk") : document.getElementById("ln")).focus();
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("ln").value.trim(), key = document.getElementById("lk").value;
      var btn = f.querySelector("button"); btn.disabled = true;
      api("login", { body: { name: name, key: key } }).then(function (j) {
        btn.disabled = false;
        if (j.ok) { try { localStorage.setItem("bp_admin_name", name); } catch (e) {} S.me = { role: j.role, name: j.name }; boot(); return; }
        var m = document.getElementById("lmsg");
        if (j.error === "no_admin_key") m.innerHTML = setupHtml("key");
        else if (j.error === "not_configured") m.innerHTML = setupHtml("db");
        else m.innerHTML = '<div class="setup" style="background:var(--red-soft);color:var(--red)">' + esc(errMsg(j)) + "</div>";
      });
    });
  }
  function setupHtml(kind) {
    if (kind === "key") return '<div class="setup"><b>관리자 키가 설정되지 않았습니다.</b><ol><li>Cloudflare 대시보드 → Workers &amp; Pages → bareunbp → Settings</li><li>Variables and Secrets → Add → Type: Secret</li><li>이름 <code>ADMIN_KEY</code>, 값은 20자 이상 비밀번호 → Save</li><li>Deployments에서 최신 배포 Retry</li></ol></div>';
    return '<div class="setup"><b>데이터베이스가 연결되지 않았습니다.</b><ol><li>Cloudflare 대시보드 → D1 → Create (이름 bareunbp)</li><li>Pages 프로젝트 → Settings → Bindings → Add → D1, 변수명 <code>DB</code></li><li>Deployments에서 최신 배포 Retry</li></ol>표는 첫 접속 때 자동으로 만들어집니다.</div>';
  }

  // ============================================================ 앱 틀
  var NAV = [
    { g: "운영", items: [["", "대시보드", 1], ["qna", "질문·경험담", 1], ["leads", "문의·신청", 0], ["reports", "팩트체크 요청", 0]] },
    { g: "분석·수익", items: [["kpi", "KPI 대시보드", 0], ["mall", "바른혈압몰", 0]] },
    { g: "커뮤니티", items: [["board", "게시판 관리", 0], ["members", "회원", 0]] },
    { g: "콘텐츠", items: [["content", "콘텐츠·감수", 1], ["corrections", "정정 이력", 1], ["videos", "영상 관리", 0], ["notice", "사이트 공지", 0]] },
    { g: "구독·기록", items: [["newsletter", "구독자", 0], ["audit", "활동 기록", 0], ["system", "시스템·데이터", 0]] },
    { g: "도움말", items: [["guide", "운영 가이드", 1]] }
  ];
  function shell() {
    var nav = NAV.map(function (g) {
      var items = g.items.filter(function (it) { return isAdmin() || it[2]; });
      if (!items.length) return "";
      return '<div class="nav-group"><b>' + g.g + "</b>" + items.map(function (it) { return '<a href="#/' + it[0] + '" data-r="' + it[0] + '">' + it[1] + '<span class="cnt" data-b="' + it[0] + '" hidden></span></a>'; }).join("") + "</div>";
    }).join("");
    app.innerHTML = '<div class="topbar"><button id="mtoggle" aria-label="메뉴">☰</button><img src="/assets/img/logo.png" alt="바른혈압"><span class="tag t-teal">관리자</span></div>' +
      '<div class="shell"><aside class="side" id="side"><div class="brand"><img src="/assets/img/logo.png" alt="바른혈압"><span>' + (isAdmin() ? "관리자" : "감수자") + "</span></div>" + nav +
      '<div class="me"><b>' + esc(S.me.name) + '</b><span class="muted small">' + (isAdmin() ? "관리자 권한" : "감수자 권한 · 검토 전용") + '</span><div class="row"><a class="btn btn-s btn-sm" href="/" target="_blank" rel="noopener">사이트 보기</a><button class="btn btn-g btn-sm" id="logout">로그아웃</button></div></div></aside>' +
      '<main class="main" id="main"></main></div>';
    document.getElementById("logout").addEventListener("click", function () { api("logout", { body: {} }).then(function () { S.me = null; renderLogin('<div class="setup" style="background:var(--green-soft);color:var(--green)">로그아웃했습니다.</div>'); }); });
    document.getElementById("mtoggle").addEventListener("click", function () { document.getElementById("side").classList.toggle("open"); });
    document.getElementById("side").addEventListener("click", function (e) { if (e.target.closest("a[data-r]")) document.getElementById("side").classList.remove("open"); });
  }
  function setBadges(c) {
    if (!c) return;
    var map = { qna: isAdmin() ? c.qna_pending : c.qna_review, leads: c.leads_new, reports: c.reports_open, board: c.ugc_reports_open };
    for (var k in map) { var el = document.querySelector('[data-b="' + k + '"]'); if (el) { el.hidden = !map[k]; el.textContent = map[k]; } }
  }
  function boot() {
    api("me").then(function (j) {
      if (!j.ok) return;
      S.me = { role: j.role, name: j.name, reviewer_enabled: j.reviewer_enabled };
      shell();
      loadContent().then(route);
      api("dashboard").then(function (d) { if (d.ok) setBadges(d.counts); });
    }).catch(function () {});
  }
  window.addEventListener("hashchange", function () { if (S.me) route(); });
  function route() {
    closeDrawer();
    var h = location.hash.replace(/^#\/?/, ""), parts = h.split("?"), r = parts[0] || "";
    S.route = r; S.params = {};
    var side = document.getElementById("side"); if (side) side.classList.remove("open");
    if (parts[1]) parts[1].split("&").forEach(function (kv) { var p = kv.split("="); S.params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
    document.querySelectorAll(".nav-group a").forEach(function (a) { a.classList.toggle("on", a.dataset.r === r); });
    var views = { "": viewDashboard, qna: viewQna, leads: viewLeads, reports: viewReports, content: viewContent, corrections: viewCorrections, notice: viewNotice, newsletter: viewNewsletter, audit: viewAudit, system: viewSystem, members: viewMembers, board: viewBoard, videos: viewVideos, guide: viewGuide, kpi: viewKpi, mall: viewMall };
    var v = views[r] || viewDashboard;
    var main = document.getElementById("main");
    main.innerHTML = '<div class="loading">불러오는 중…</div>';
    window.scrollTo(0, 0);
    v(main);
  }
  function pageHead(title, desc, actions) {
    return '<div class="page-h"><div><h1>' + esc(title) + "</h1>" + (desc ? "<p>" + desc + "</p>" : "") + '</div><div class="actions">' + (actions || "") + "</div></div>";
  }
  function tabsHtml(list, cur, counts) {
    return '<div class="tabs">' + list.map(function (t) { var c = counts && counts[t[0]] != null ? '<span class="c">' + counts[t[0]] + "</span>" : ""; return '<button data-tab="' + t[0] + '" class="' + (t[0] === cur ? "on" : "") + '">' + t[1] + c + "</button>"; }).join("") + "</div>";
  }

  // ============================================================ 대시보드
  function viewDashboard(main) {
    api("dashboard").then(function (d) {
      if (!d.ok) { main.innerHTML = pageHead("대시보드") + '<div class="callout bad">' + esc(errMsg(d)) + "</div>"; return; }
      setBadges(d.counts);
      var c = d.counts;
      // 감수 현황 (콘텐츠 목록 기준)
      var latest = {}; (d.reviews || []).forEach(function (r) { latest[r.path] = r; });
      var need = (S.content || []).filter(function (x) { return x.r; });
      var reviewed = 0, revise = 0, due = 0, dueCut = kstDay(365);
      need.forEach(function (x) { var r = latest[x.p]; if (!r) return; if (r.result === "approved") { reviewed++; if (r.reviewed_at < dueCut) due++; } else revise++; });
      var pendingReview = need.length - reviewed - revise;
      var kpi = function (label, val, href, alert, em) { return '<a class="kpi' + (alert && val ? " alert" : "") + '" href="' + href + '"><small>' + label + '</small><b class="num">' + (val || 0) + "</b>" + (em ? "<em>" + em + "</em>" : "") + "</a>"; };
      var kpis = isAdmin()
        ? kpi("새 질문", c.qna_pending, "#/qna?status=pending", 1) + kpi("답변 작성 중", c.qna_draft, "#/qna?status=draft") + kpi("감수 요청", c.qna_review, "#/qna?status=review") + kpi("새 문의·신청", c.leads_new, "#/leads?status=new", 1) + kpi("팩트체크 요청", c.reports_open, "#/reports", 1) + kpi("감수 전 콘텐츠", pendingReview + revise, "#/content?st=todo", 0, "/ " + need.length) + kpi("재감수 도래", due, "#/content?st=due", 1) + kpi("레터 구독자", c.nl_active, "#/newsletter", 0, c.nl_week ? "+" + c.nl_week + " 이번 주" : "") +
          kpi("게시판 신고", c.ugc_reports_open, "#/board?tab=reports", 1) + kpi("게시판 새 글", c.posts_week, "#/board", 0, "7일 · 댓글 " + (c.comments_week || 0)) + kpi("회원", c.members, "#/members", 0, c.members_week ? "+" + c.members_week + " 이번 주" : "")
        : kpi("감수 요청 답변", c.qna_review, "#/qna?status=review", 1) + kpi("감수 전 콘텐츠", pendingReview + revise, "#/content?st=todo", 0, "/ " + need.length) + kpi("재감수 도래", due, "#/content?st=due", 1) + kpi("감수 완료 콘텐츠", reviewed, "#/content?st=approved");
      // 방문 차트
      var days = [], map = {}; d.visits.series.forEach(function (r) { map[r.day] = r.n; });
      for (var i = 13; i >= 0; i--) days.push({ day: kstDay(i), n: map[kstDay(i)] || 0 });
      var max = Math.max.apply(null, days.map(function (x) { return x.n; }).concat([5]));
      var W = 640, H = 170, bw = W / 14;
      var bars = days.map(function (x, i) { var h = Math.round((x.n / max) * (H - 36)); return '<rect x="' + (i * bw + 6) + '" y="' + (H - 20 - h) + '" width="' + (bw - 12) + '" height="' + h + '" rx="3" fill="' + (i === 13 ? "#2b6fc2" : "#9fc0e6") + '"><title>' + x.day + " · " + x.n + '</title></rect><text x="' + (i * bw + bw / 2) + '" y="' + (H - 5) + '" font-size="10" fill="#8a98a8" text-anchor="middle">' + x.day.slice(5).replace("-", "/") + "</text>" + (x.n ? '<text x="' + (i * bw + bw / 2) + '" y="' + (H - 24 - h) + '" font-size="10" fill="#5f6f81" text-anchor="middle">' + x.n + "</text>" : ""); }).join("");
      var listHtml = function (rows, labeler, emptyMsg) {
        if (!rows || !rows.length) return '<p class="muted small" style="margin:0">' + emptyMsg + "</p>";
        var mx = rows[0].n || 1;
        return '<ul class="list">' + rows.map(function (r) { return "<li><span>" + labeler(r.key) + '</span><span class="num"><i class="bar" style="width:' + Math.max(4, Math.round((r.n / mx) * 60)) + 'px"></i>' + r.n + "</span></li>"; }).join("") + "</ul>";
      };
      var ev = {}; (d.events || []).forEach(function (r) { ev[r.key] = r.n; });
      var funnel = '<div class="funnel"><div><small>기록 저장</small><b class="num">' + ((ev.record_saved || 0) + (ev.quick_entry || 0) + (ev.timer_done || 0)) + '</b></div><div><small>리포트 열람</small><b class="num">' + (ev.report_view || 0) + '</b></div><div><small>리포트 인쇄</small><b class="num">' + (ev.report_print || 0) + "</b></div></div>";
      var evRows = (d.events || []).filter(function (r) { return r.key !== "search"; });
      var noStats = !d.visits.d30;
      var latestQ = (d.latest_qna || []).map(function (q) { return '<li><span><a href="#/qna?status=pending&id=' + q.id + '">' + esc(q.question.slice(0, 48)) + '</a></span><span class="muted small">' + ago(q.created_at) + "</span></li>"; }).join("");
      var latestL = (d.latest_leads || []).map(function (l) { return '<li><span><a href="#/leads?status=new&id=' + l.id + '">' + esc(LEAD_TYPE[l.type] || l.type) + " · " + esc(l.org || l.name || "-") + '</a></span><span class="muted small">' + ago(l.created_at) + "</span></li>"; }).join("");
      var aud = (d.audit || []).map(function (a) { return "<li><span>" + esc(a.actor || "-") + " · " + esc(ACTION_LABEL[a.action] || a.action) + (a.target ? ' <span class="muted">' + esc(a.target) + "</span>" : "") + '</span><span class="muted small">' + ago(a.ts) + "</span></li>"; }).join("");
      main.innerHTML = pageHead("대시보드", "오늘 " + esc(d.today) + " · " + esc(S.me.name) + "님") +
        '<div class="kpis">' + kpis + "</div>" +
        '<div class="grid g2">' +
        '<div class="card"><h2><span>방문 <small>익명 페이지뷰 · 오늘 ' + d.visits.today + " · 7일 " + d.visits.d7 + " · 30일 " + d.visits.d30 + "</small></span>" + (isAdmin() ? '<a class="btn btn-g btn-sm" href="#/kpi">KPI 자세히</a>' : "") + '</h2><div class="chart"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="최근 14일 페이지뷰">' + bars + "</svg></div>" + (noStats ? '<p class="muted small" style="margin:6px 0 0">아직 수집된 방문이 없습니다. 배포 후 방문이 쌓이면 표시됩니다.</p>' : "") + "</div>" +
        '<div class="card"><h2>도구 이용 <small>최근 30일</small></h2>' + funnel + listHtml(evRows, function (k) { return esc(EVENT_LABEL[k] || k); }, "아직 기록이 없습니다.") + "</div>" +
        '<div class="card"><h2>많이 본 페이지 <small>최근 7일</small></h2>' + listHtml(d.top, function (k) { return '<a href="' + esc(k) + '" target="_blank" rel="noopener" title="' + esc(k) + '">' + esc(titleOf(k)) + "</a>"; }, "아직 기록이 없습니다.") + "</div>" +
        '<div class="card"><h2>사이트 검색어 <small>최근 30일 · 콘텐츠 기획에 활용</small></h2>' + listHtml(d.searches, function (k) { return esc(k); }, "아직 검색 기록이 없습니다.") + "</div>" +
        '<div class="card"><h2>유입 경로 <small>최근 30일</small></h2>' + listHtml(d.refs, function (k) { return esc(k); }, "외부 유입 기록이 없습니다. 검색엔진 등록 후 늘어납니다.") + "</div>" +
        '<div class="card"><h2>최근 접수</h2>' + (latestQ || latestL ? '<ul class="list">' + latestQ + latestL + "</ul>" : '<p class="muted small" style="margin:0">처리할 새 접수가 없습니다.</p>') + "</div>" +
        "</div>" +
        (isAdmin() ? '<div class="card" style="margin-top:14px"><h2>최근 활동 <a class="btn btn-g btn-sm" href="#/audit">전체 보기</a></h2>' + (aud ? '<ul class="list">' + aud + "</ul>" : '<p class="muted small" style="margin:0">기록이 없습니다.</p>') + "</div>" : "");
    });
  }

  // ============================================================ 질문·경험담
  function viewQna(main) {
    var st = S.params.status || (isAdmin() ? "pending" : "review"), cat = S.params.cat || "", kw = S.params.q || "", off = 0, items = [];
    function load(append) {
      api("qna" + qs({ status: st, cat: cat, q: kw, limit: 50, offset: off })).then(function (j) {
        if (!j.ok) { main.innerHTML = pageHead("질문·경험담") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
        items = append ? items.concat(j.items) : j.items;
        var tabs = [["pending", "새 질문"], ["draft", "작성 중"], ["review", "감수 요청"], ["published", "게시됨"], ["hidden", "숨김"], ["all", "전체"]];
        var counts = j.tabs || {}; counts.all = Object.keys(j.tabs || {}).reduce(function (a, k) { return a + j.tabs[k]; }, 0);
        var rows = items.map(function (q) {
          var flags = (q.category === "경험담" ? '<span class="tag t-teal">경험담</span> ' : "") + (q.same_ip > 2 ? '<span class="tag t-amber" title="같은 접속지에서 ' + q.same_ip + '건">반복 ' + q.same_ip + "</span> " : "") + (q.question_original ? '<span class="tag">질문 수정됨</span> ' : "") + (q.reviewed_by ? '<span class="tag t-green">검토 완료</span> ' : "");
          return '<tr class="click" data-id="' + q.id + '"><td class="num hide-m">' + q.id + '</td><td><span class="tag ' + QNA_TAG[q.status] + '">' + QNA_ST[q.status] + "</span></td><td>" + flags + '<div class="ex">' + esc(q.question) + '</div></td><td class="hide-m">' + esc(q.category || "-") + '</td><td class="hide-m">' + esc(q.nickname) + '</td><td class="muted small">' + ago(q.created_at) + "</td></tr>";
        }).join("");
        var catSel = '<select class="inp" id="f-cat"><option value="">모든 주제</option>' + QNA_CATS.map(function (c) { return "<option" + (c === cat ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select>";
        main.innerHTML = pageHead("질문·경험담", isAdmin() ? "접수된 질문에 근거를 붙여 답하고 게시합니다. 게시된 글은 커뮤니티 페이지에 1분 안에 반영됩니다." : "감수 요청된 답변을 검토하고 의견을 남깁니다. 게시는 관리자가 합니다.") +
          tabsHtml(tabs, st, counts) +
          '<div class="filters">' + catSel + '<input class="inp" id="f-q" type="search" placeholder="질문·답변·닉네임 검색" value="' + esc(kw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th class="hide-m">#</th><th>상태</th><th>질문</th><th class="hide-m">주제</th><th class="hide-m">닉네임</th><th>접수</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">해당하는 질문이 없습니다.</td></tr>') + "</tbody></table></div>" +
          (items.length < j.total ? '<div class="more"><button class="btn btn-s" id="more">더 보기 (' + items.length + " / " + j.total + ")</button></div>" : "");
        bindList();
        if (S.params.id) { var it = items.filter(function (x) { return String(x.id) === S.params.id; })[0]; S.params.id = null; if (it) openQna(it, reload); }
      });
    }
    function reload() { off = 0; load(false); api("dashboard").then(function (d) { if (d.ok) setBadges(d.counts); }); }
    function bindList() {
      main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { st = b.dataset.tab; off = 0; load(false); }; });
      var go = function () { kw = document.getElementById("f-q").value.trim(); cat = document.getElementById("f-cat").value; off = 0; load(false); };
      document.getElementById("f-go").onclick = go;
      document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
      document.getElementById("f-cat").onchange = go;
      var mb = document.getElementById("more"); if (mb) mb.onclick = function () { off = items.length; load(true); };
      main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { var it = items.filter(function (x) { return String(x.id) === tr.dataset.id; })[0]; openQna(it, reload); }; });
    }
    load(false);
  }

  function linkPicker(onPick) {
    var html = '<div class="field"><input class="inp" type="search" placeholder="글 제목으로 찾기 (예: 정상수치, 나트륨)" data-pk></div><div class="picker" data-pl></div>';
    return { html: html, bind: function (root) {
      var inp = root.querySelector("[data-pk]"), list = root.querySelector("[data-pl]");
      function draw() {
        var v = inp.value.trim();
        var rows = (S.content || []).filter(function (c) { return !v || c.t.indexOf(v) > -1 || c.p.indexOf(v) > -1; }).slice(0, 30);
        list.innerHTML = rows.map(function (c) { return '<button type="button" data-p="' + esc(c.p) + '">' + esc(c.t) + "<small>" + esc(TYPE_LABEL[c.k] || c.k) + " · " + esc(c.p) + "</small></button>"; }).join("") || '<div class="empty">결과 없음</div>';
      }
      inp.oninput = draw; draw();
      list.onclick = function (e) { var b = e.target.closest("[data-p]"); if (b) onPick(S.contentMap[b.dataset.p]); };
    } };
  }

  function openQna(q, done) {
    var admin = isAdmin(), story = q.category === "경험담";
    var catOpts = QNA_CATS.map(function (c) { return "<option" + (c === q.category ? " selected" : "") + ">" + c + "</option>"; }).join("");
    var tpl = '<select data-tpl><option value="">답변 틀 넣기…</option>' + TEMPLATES.map(function (t, i) { return '<option value="' + i + '">' + esc(t.n) + "</option>"; }).join("") + "</select>";
    var meta = '<div class="meta"><span>#' + q.id + "</span><span>" + kst(q.created_at) + " 접수</span><span>" + esc(q.nickname) + "</span>" + (q.same_ip > 1 ? "<span>같은 접속지 " + q.same_ip + "건</span>" : "") + (q.handled_by ? "<span>최근 처리 " + esc(q.handled_by) + " · " + ago(q.updated_at) + "</span>" : "") + '<span class="tag ' + QNA_TAG[q.status] + '">' + QNA_ST[q.status] + "</span></div>";
    var reviewBox = (q.review_note || q.reviewed_by) ? '<div class="callout ' + (q.reviewed_by ? "" : "warn") + '" style="margin-top:10px">' + (q.reviewed_by ? "<b>검토 완료</b> · " + esc(q.reviewed_by) + " · " + kst(q.reviewed_at) : "<b>감수 의견</b>") + (q.review_note ? '<div style="margin-top:4px;white-space:pre-wrap">' + esc(q.review_note) + "</div>" : "") + "</div>" : "";
    var body;
    if (admin) {
      body = meta +
        '<div class="sec"><h3>질문 <span><button class="btn btn-g btn-sm" type="button" data-mask>연락처·이메일 가리기</button></span></h3><div class="field"><textarea data-q rows="4">' + esc(q.question) + "</textarea><div class=\"hint\">공개되는 글입니다. 이름·연락처·병원명 등 개인을 알아볼 수 있는 정보는 지워 주세요. 수정하면 원문은 기록으로 보관됩니다.</div></div>" +
        (q.question_original ? '<details class="small"><summary class="muted">접수 원문 보기</summary><div class="box" style="margin-top:6px">' + esc(q.question_original) + "</div></details>" : "") +
        '<div class="row2" style="margin-top:8px"><div class="field"><label>닉네임</label><input data-nick maxlength="20" value="' + esc(q.nickname) + '"></div><div class="field"><label>주제</label><select data-cat>' + catOpts + "</select></div></div></div>" +
        '<div class="sec"><h3>답변' + (story ? ' <span class="muted small" style="font-weight:500">경험담은 답변 없이 게시할 수 있습니다</span>' : "") + '</h3><div class="toolbar">' + tpl + '<button class="btn btn-s btn-sm" type="button" data-link>관련 글 링크</button></div>' +
        '<div data-lp hidden></div><div class="field"><textarea data-a rows="9" placeholder="근거를 붙여 답합니다. 링크는 [글 제목](/info/주소.html) 형식으로 넣으면 공개 화면에서 눌러 이동할 수 있습니다.">' + esc(q.answer || "") + '</textarea><div class="hint"><span data-len>0</span>자 · 진단·약 조정·개인 위험도는 답하지 않습니다.</div></div><div data-terms></div>' +
        '<div class="sec"><h3>공개 화면 미리보기</h3><div class="preview" data-pv></div></div></div>' + reviewBox;
    } else {
      body = meta + '<div class="sec"><h3>질문</h3><div class="box q">' + esc(q.question) + '</div></div><div class="sec"><h3>작성된 답변</h3>' + (q.answer ? '<div class="preview">' + renderAnswer(q.answer) + "</div>" : '<p class="muted">아직 답변이 없습니다.</p>') + "<div data-terms></div></div>" + reviewBox +
        '<div class="sec"><h3>감수 의견</h3><div class="field"><textarea data-rn rows="4" placeholder="정확성, 누락, 위험한 표현 등 의견을 남겨 주세요.">' + esc(q.review_note || "") + "</textarea></div></div>";
    }
    var foot = admin
      ? '<div class="left"><button class="btn btn-d btn-sm" data-act="delete">삭제</button>' + (q.status !== "hidden" ? '<button class="btn btn-g btn-sm" data-act="hidden">숨김</button>' : "") + '</div><button class="btn btn-s" data-act="draft">작성 중 저장</button>' + (S.me.reviewer_enabled ? '<button class="btn btn-s" data-act="review">감수 요청</button>' : "") + '<button class="btn btn-p" data-act="published">' + (q.status === "published" ? "수정 게시" : "게시") + "</button>"
      : '<button class="btn btn-s" data-rv="back">수정 요청</button><button class="btn btn-t" data-rv="ok">검토 완료</button>';
    var d = openDrawer("질문 #" + q.id, body, foot);

    if (admin) {
      var ta = d.querySelector("[data-a]"), pv = d.querySelector("[data-pv]"), terms = d.querySelector("[data-terms]"), len = d.querySelector("[data-len]");
      var refresh = function () {
        pv.innerHTML = '<span class="lbl">바른혈압 편집팀 답변</span>' + (ta.value.trim() ? renderAnswer(ta.value) : '<span class="muted">답변을 입력하면 여기에 보입니다.</span>');
        len.textContent = ta.value.length;
        var hits = bannedIn(ta.value);
        terms.innerHTML = hits.length ? '<div class="terms"><b>표현 확인 필요</b> — 의료행위로 오인될 수 있는 표현입니다.<ul>' + hits.map(function (w) { return "<li>‘" + esc(w) + "’ → " + esc(hintFor(w)) + "</li>"; }).join("") + "</ul></div>" : (ta.value.trim() ? '<div class="terms ok">표현 기준을 통과했습니다.</div>' : "");
      };
      ta.oninput = refresh; refresh();
      d.querySelector("[data-tpl]").onchange = function (e) {
        var t = TEMPLATES[e.target.value]; if (!t) return;
        ta.value = ta.value.trim() ? ta.value.trim() + "\n\n" + t.t : t.t; e.target.value = ""; refresh(); ta.focus();
      };
      var lp = d.querySelector("[data-lp]");
      d.querySelector("[data-link]").onclick = function () {
        if (!lp.hidden) { lp.hidden = true; return; }
        var pk = linkPicker(function (c) {
          var ins = "[" + c.t.split(" — ")[0] + "](" + c.p + ")";
          var s = ta.selectionStart || ta.value.length, before = ta.value.slice(0, s);
          if (before && !/\s$/.test(before)) ins = " " + ins;
          ta.value = before + ins + ta.value.slice(s); lp.hidden = true; refresh(); ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length;
        });
        lp.innerHTML = pk.html; lp.hidden = false; pk.bind(lp);
      };
      d.querySelector("[data-mask]").onclick = function () {
        var qa = d.querySelector("[data-q]");
        qa.value = qa.value.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "○○○@○○○").replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, "010-○○○○-○○○○").replace(/0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}/g, "○○-○○○○-○○○○");
        toast("연락처·이메일 형식을 가렸습니다. 저장해야 반영됩니다.");
      };
      d.querySelectorAll("[data-act]").forEach(function (b) {
        b.onclick = function () {
          var act = b.dataset.act;
          if (act === "delete") {
            confirmBox("질문을 삭제할까요?", "<p>삭제하면 되돌릴 수 없습니다. 공개하지 않을 글은 ‘숨김’을 권장합니다.</p>", "삭제", true).then(function (ok) {
              if (!ok) return;
              api("qna/" + q.id + "/delete", { body: {} }).then(function (j) { if (j.ok) { toast("삭제했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
            });
            return;
          }
          var payload = { status: act, answer: ta.value, question: d.querySelector("[data-q]").value, nickname: d.querySelector("[data-nick]").value, category: d.querySelector("[data-cat]").value };
          var send = function (ack) {
            payload.ack_terms = !!ack;
            b.disabled = true;
            api("qna/" + q.id, { body: payload }).then(function (j) {
              b.disabled = false;
              if (j.ok) { toast({ draft: "저장했습니다.", review: "감수를 요청했습니다.", published: "게시했습니다. 1분 안에 커뮤니티에 반영됩니다.", hidden: "숨겼습니다." }[act] || "저장했습니다."); closeDrawer(); done(); return; }
              if (j.error === "banned_terms") {
                confirmBox("표현을 다시 확인하세요", "<p>다음 표현이 답변에 있습니다.</p><p><b>" + j.terms.map(esc).join(", ") + "</b></p><p class=\"muted small\">문맥상 문제가 없다면(예: ‘완치된다는 말은 사실이 아닙니다’) 확인 후 게시할 수 있습니다. 이 확인은 활동 기록에 남습니다.</p>", "확인했고 게시").then(function (ok) { if (ok) send(true); });
                return;
              }
              toast(errMsg(j), true);
            });
          };
          if (act === "published" && !payload.answer.trim() && payload.category !== "경험담") { toast("답변을 입력해야 게시할 수 있습니다.", true); return; }
          if (act === "published" && !q.reviewed_by && S.me.reviewer_enabled) {
            confirmBox("감수 없이 게시할까요?", "<p>이 답변은 아직 감수자 검토를 거치지 않았습니다. 일반 정보 안내라면 게시해도 되지만, 약·검사·수치 해석이 들어 있다면 감수 요청을 권장합니다.</p>", "게시").then(function (ok) { if (ok) send(false); });
            return;
          }
          send(false);
        };
      });
    } else {
      var tm = d.querySelector("[data-terms]"); var hits = bannedIn(q.answer);
      if (hits.length) tm.innerHTML = '<div class="terms"><b>표현 확인 필요</b><ul>' + hits.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>";
      d.querySelectorAll("[data-rv]").forEach(function (b) {
        b.onclick = function () {
          var ok = b.dataset.rv === "ok";
          api("qna/" + q.id + "/review", { body: { approve: ok, review_note: d.querySelector("[data-rn]").value } }).then(function (j) {
            if (j.ok) { toast(ok ? "검토 완료로 표시했습니다." : "수정 요청을 남겼습니다."); closeDrawer(); done(); } else toast(errMsg(j), true);
          });
        };
      });
    }
  }

  // ============================================================ 문의·신청
  function viewLeads(main) {
    var st = S.params.status || "all", type = "", kw = "", off = 0, items = [];
    function load(append) {
      api("leads" + qs({ status: st, type: type, q: kw, limit: 50, offset: off })).then(function (j) {
        if (!j.ok) { main.innerHTML = pageHead("문의·신청") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
        items = append ? items.concat(j.items) : j.items;
        var counts = j.tabs || {}; counts.all = Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0);
        var tabs = [["all", "전체"], ["new", "신규"], ["contacted", "연락함"], ["progress", "진행 중"], ["done", "완료"], ["hold", "보류"]];
        var typeSel = '<select class="inp" id="f-type"><option value="">모든 유형</option>' + Object.keys(LEAD_TYPE).map(function (k) { return '<option value="' + k + '"' + (k === type ? " selected" : "") + ">" + LEAD_TYPE[k] + "</option>"; }).join("") + "</select>";
        var rows = items.map(function (l) {
          return '<tr class="click" data-id="' + l.id + '"><td class="muted small">' + kstDate(l.created_at) + '</td><td><span class="tag ' + LEAD_TAG[l.status] + '">' + (LEAD_ST[l.status] || l.status) + "</span></td><td>" + esc(LEAD_TYPE[l.type] || l.type) + "</td><td><b>" + esc(l.org || "-") + '</b><div class="muted small">' + esc(l.name || "") + '</div></td><td class="hide-m">' + esc(l.contact) + '</td><td class="hide-m"><div class="ex">' + esc(l.memo || l.message || "") + "</div></td></tr>";
        }).join("");
        main.innerHTML = pageHead("문의·신청", "기관 협력 문의와 가족 기능 사전 신청을 처리합니다. 처리 완료 후 1년이 지나면 시스템 화면에서 파기할 수 있습니다.", '<button class="btn btn-s btn-sm" id="csv">CSV 내려받기</button>') +
          tabsHtml(tabs, st, counts) +
          '<div class="filters">' + typeSel + '<input class="inp" id="f-q" type="search" placeholder="기관·이름·연락처·메모 검색" value="' + esc(kw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>접수</th><th>상태</th><th>유형</th><th>기관·담당</th><th class="hide-m">연락처</th><th class="hide-m">내용·메모</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">해당하는 문의가 없습니다.</td></tr>') + "</tbody></table></div>" +
          (items.length < j.total ? '<div class="more"><button class="btn btn-s" id="more">더 보기</button></div>' : "");
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { st = b.dataset.tab; off = 0; load(); }; });
        var go = function () { kw = document.getElementById("f-q").value.trim(); type = document.getElementById("f-type").value; off = 0; load(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-type").onchange = go;
        document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        var mb = document.getElementById("more"); if (mb) mb.onclick = function () { off = items.length; load(true); };
        document.getElementById("csv").onclick = function () {
          csvDownload("바른혈압_문의_" + kstDay() + ".csv", [["번호", "접수일", "유형", "기관", "담당자", "연락처", "내용", "상태", "메모", "처리자"]].concat(items.map(function (l) { return [l.id, kst(l.created_at), LEAD_TYPE[l.type] || l.type, l.org, l.name, l.contact, l.message, LEAD_ST[l.status], l.memo, l.handled_by]; })));
        };
        main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openLead(items.filter(function (x) { return String(x.id) === tr.dataset.id; })[0], reload); }; });
        if (S.params.id) { var it = items.filter(function (x) { return String(x.id) === S.params.id; })[0]; S.params.id = null; if (it) openLead(it, reload); }
      });
    }
    function reload() { off = 0; load(); api("dashboard").then(function (d) { if (d.ok) setBadges(d.counts); }); }
    load();
  }
  function contactLinks(c) {
    if (!c) return "";
    if (/@/.test(c)) return '<a class="btn btn-s btn-sm" href="mailto:' + esc(c) + '">메일 쓰기</a>';
    var t = c.replace(/[^\d+]/g, ""); if (t.length >= 9) return '<a class="btn btn-s btn-sm" href="tel:' + esc(t) + '">전화 걸기</a>';
    return "";
  }
  function openLead(l, done) {
    var stOpts = Object.keys(LEAD_ST).map(function (k) { return '<option value="' + k + '"' + (k === l.status ? " selected" : "") + ">" + LEAD_ST[k] + "</option>"; }).join("");
    var body = '<div class="meta"><span>#' + l.id + "</span><span>" + kst(l.created_at) + " 접수</span><span>" + esc(LEAD_TYPE[l.type] || l.type) + "</span>" + (l.handled_by ? "<span>최근 처리 " + esc(l.handled_by) + " · " + ago(l.updated_at) + "</span>" : "") + "</div>" +
      '<div class="row2"><div class="field"><label>기관</label><div class="box">' + esc(l.org || "-") + '</div></div><div class="field"><label>담당자</label><div class="box">' + esc(l.name || "-") + "</div></div></div>" +
      '<div class="sec"><h3>연락처 <span>' + contactLinks(l.contact) + ' <button class="btn btn-g btn-sm" data-copy>복사</button></span></h3><div class="box">' + esc(l.contact) + "</div></div>" +
      '<div class="sec"><h3>문의 내용</h3><div class="box">' + esc(l.message || "(내용 없음)") + "</div></div>" +
      '<div class="sec"><h3>처리</h3><div class="field"><label>상태</label><select data-st>' + stOpts + '</select></div><div class="field" style="margin-top:10px"><label>메모 (내부용)</label><textarea data-memo rows="5" placeholder="연락 일시, 논의 내용, 다음 할 일">' + esc(l.memo || "") + "</textarea></div></div>";
    var d = openDrawer("문의 #" + l.id, body, '<div class="left"><button class="btn btn-d btn-sm" data-del>개인정보 파기</button></div><button class="btn btn-p" data-save>저장</button>');
    d.querySelector("[data-copy]").onclick = function () { navigator.clipboard && navigator.clipboard.writeText(l.contact).then(function () { toast("연락처를 복사했습니다."); }); };
    d.querySelector("[data-save]").onclick = function () {
      api("leads/" + l.id, { body: { status: d.querySelector("[data-st]").value, memo: d.querySelector("[data-memo]").value } }).then(function (j) { if (j.ok) { toast("저장했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
    d.querySelector("[data-del]").onclick = function () {
      confirmBox("이 문의를 파기할까요?", "<p>연락처를 포함한 문의 기록이 영구 삭제됩니다. 파기 사실은 활동 기록에 남습니다.</p>", "파기", true).then(function (ok) {
        if (ok) api("leads/" + l.id + "/delete", { body: {} }).then(function (j) { if (j.ok) { toast("파기했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
      });
    };
  }

  // ============================================================ 팩트체크 요청
  function viewReports(main) {
    var st = "open", kw = "", items = [];
    function load() {
      api("reports" + qs({ status: st, q: kw, limit: 100 })).then(function (j) {
        if (!j.ok) { main.innerHTML = pageHead("팩트체크 요청") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
        items = j.items;
        var c = j.tabs || {}; var counts = { open: (c.pending || 0) + (c.reviewing || 0), reviewing: c.reviewing, published: c.published, rejected: c.rejected, duplicate: c.duplicate, all: Object.keys(c).reduce(function (a, k) { return a + c[k]; }, 0) };
        var tabs = [["open", "처리 대기"], ["reviewing", "검토 중"], ["published", "발행"], ["rejected", "반려"], ["duplicate", "중복"], ["all", "전체"]];
        var rows = items.map(function (r) {
          return '<tr class="click" data-id="' + r.id + '"><td class="muted small">' + kstDate(r.created_at) + '</td><td><span class="tag ' + REP_TAG[r.status] + '">' + REP_ST[r.status] + '</span></td><td><div class="ex">' + esc(r.claim) + '</div></td><td class="hide-m">' + (r.source_url ? '<span class="tag">출처 있음</span>' : "") + (r.contact ? ' <span class="tag">회신 요청</span>' : "") + "</td></tr>";
        }).join("");
        main.innerHTML = pageHead("팩트체크 요청", "이용자가 보낸 검증 요청입니다. 같은 주장이 반복되면 우선순위를 높이고, 발행 후 발행 주소를 연결해 두세요.") + tabsHtml(tabs, st, counts) +
          '<div class="filters"><input class="inp" id="f-q" type="search" placeholder="주장·메모 검색" value="' + esc(kw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>접수</th><th>상태</th><th>검증 요청 주장</th><th class="hide-m">정보</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" class="empty">해당하는 요청이 없습니다.</td></tr>') + "</tbody></table></div>";
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { st = b.dataset.tab; load(); }; });
        var go = function () { kw = document.getElementById("f-q").value.trim(); load(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openReport(items.filter(function (x) { return String(x.id) === tr.dataset.id; })[0], function () { load(); api("dashboard").then(function (d) { if (d.ok) setBadges(d.counts); }); }); }; });
      });
    }
    load();
  }
  function openReport(r, done) {
    var stOpts = Object.keys(REP_ST).map(function (k) { return '<option value="' + k + '"' + (k === r.status ? " selected" : "") + ">" + REP_ST[k] + "</option>"; }).join("");
    var fcOpts = '<option value="">(선택)</option>' + (S.content || []).filter(function (c) { return c.k === "factcheck"; }).map(function (c) { return '<option value="' + esc(c.p) + '"' + (c.p === r.published_url ? " selected" : "") + ">" + esc(c.t.replace(/^팩트체크: /, "")) + "</option>"; }).join("");
    var src = r.source_url ? (/^https?:\/\//.test(r.source_url) ? '<a href="' + esc(r.source_url) + '" target="_blank" rel="noopener noreferrer nofollow">' + esc(r.source_url) + "</a>" : esc(r.source_url)) : "(없음)";
    var body = '<div class="meta"><span>#' + r.id + "</span><span>" + kst(r.created_at) + " 접수</span>" + (r.handled_by ? "<span>최근 처리 " + esc(r.handled_by) + "</span>" : "") + "</div>" +
      '<div class="sec"><h3>검증 요청 주장</h3><div class="box q">' + esc(r.claim) + "</div></div>" +
      '<div class="sec"><h3>출처</h3><div class="box">' + src + '</div><div class="hint muted small" style="margin-top:4px">외부 링크는 새 창으로 열립니다. 출처 링크를 열 때 주의하세요.</div></div>' +
      (r.contact ? '<div class="sec"><h3>회신 이메일 <span>' + contactLinks(r.contact) + '</span></h3><div class="box">' + esc(r.contact) + "</div></div>" : "") +
      '<div class="sec"><h3>처리</h3><div class="row2"><div class="field"><label>상태</label><select data-st>' + stOpts + '</select></div><div class="field"><label>발행한 팩트체크</label><select data-pub>' + fcOpts + '</select></div></div><div class="field" style="margin-top:10px"><label>메모 (근거 자료, 판정 방향)</label><textarea data-memo rows="5">' + esc(r.memo || "") + "</textarea></div></div>" +
      '<div class="callout" style="margin-top:12px">새 팩트체크 글은 생성기(_src/gen/factchecks.py)에 추가해 배포합니다. 발행 후 이 요청을 ‘발행’으로 바꾸고 발행 글을 연결하세요.</div>';
    var d = openDrawer("팩트체크 요청 #" + r.id, body, '<div class="left"><button class="btn btn-d btn-sm" data-del>삭제</button></div><button class="btn btn-p" data-save>저장</button>');
    d.querySelector("[data-save]").onclick = function () {
      api("reports/" + r.id, { body: { status: d.querySelector("[data-st]").value, memo: d.querySelector("[data-memo]").value, published_url: d.querySelector("[data-pub]").value } }).then(function (j) { if (j.ok) { toast("저장했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
    d.querySelector("[data-del]").onclick = function () {
      confirmBox("요청을 삭제할까요?", "<p>회신 이메일을 포함한 기록이 삭제됩니다.</p>", "삭제", true).then(function (ok) { if (ok) api("reports/" + r.id + "/delete", { body: {} }).then(function (j) { if (j.ok) { toast("삭제했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); }); });
    };
  }

  // ============================================================ 콘텐츠·감수
  function viewContent(main) {
    var flt = S.params.st || "all", type = "", kw = "";
    api("reviews").then(function (j) {
      if (!j.ok) { main.innerHTML = pageHead("콘텐츠·감수") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
      var hist = {}; j.items.forEach(function (r) { (hist[r.path] = hist[r.path] || []).push(r); });
      var dueCut = kstDay(365);
      var rows = (S.content || []).filter(function (c) { return c.r; }).map(function (c) {
        var h = hist[c.p] || [], last = h[0] || null, s;
        if (!last) s = "todo"; else if (last.result === "revise") s = "revise"; else if (last.reviewed_at < dueCut) s = "due"; else s = "approved";
        return { c: c, last: last, s: s, n: h.length };
      });
      var cnt = { all: rows.length, todo: 0, revise: 0, approved: 0, due: 0 };
      rows.forEach(function (r) { cnt[r.s]++; });
      var pct = rows.length ? Math.round(((cnt.approved + cnt.due) / rows.length) * 100) : 0;
      var ST = { todo: ["감수 예정", "t-amber"], revise: ["수정 필요", "t-red"], approved: ["감수 완료", "t-green"], due: ["재감수 도래", "t-red"] };
      function draw() {
        var list = rows.filter(function (r) {
          if (flt === "todo" && !(r.s === "todo" || r.s === "revise")) return false;
          if (flt !== "all" && flt !== "todo" && r.s !== flt) return false;
          if (type && r.c.k !== type) return false;
          if (kw && r.c.t.indexOf(kw) === -1 && r.c.p.indexOf(kw) === -1) return false;
          return true;
        });
        var trs = list.map(function (r) {
          var l = r.last;
          return '<tr class="click" data-p="' + esc(r.c.p) + '"><td><b>' + esc(r.c.t) + '</b><div class="muted small">' + esc(r.c.p) + '</div></td><td class="hide-m">' + esc(TYPE_LABEL[r.c.k] || r.c.k) + (r.c.c ? ' <span class="muted small">' + esc(r.c.c) + "</span>" : "") + '</td><td><span class="tag ' + ST[r.s][1] + '">' + ST[r.s][0] + '</span></td><td class="hide-m small">' + (l ? esc(l.reviewer_name) + (l.reviewer_title ? " · " + esc(l.reviewer_title) : "") + '<div class="muted">' + esc(l.reviewed_at) + (l.name_public ? " · 실명 공개" : "") + "</div>" : '<span class="muted">-</span>') + "</td></tr>";
        }).join("");
        document.getElementById("ctab").innerHTML = trs || '<tr><td colspan="4" class="empty">해당하는 콘텐츠가 없습니다.</td></tr>';
        document.querySelectorAll("#ctabs [data-tab]").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === flt); });
        document.querySelectorAll("#ctab tr[data-p]").forEach(function (tr) { tr.onclick = function () { openReview(S.contentMap[tr.dataset.p], hist[tr.dataset.p] || [], function () { viewContent(main); }); }; });
      }
      var typeSel = '<select class="inp" id="f-type"><option value="">모든 유형</option>' + ["info", "food", "recipe", "factcheck", "guide"].map(function (k) { return '<option value="' + k + '">' + TYPE_LABEL[k] + "</option>"; }).join("") + "</select>";
      main.innerHTML = pageHead("콘텐츠·감수", "의료진 감수 기록을 남기는 곳입니다. ‘승인’과 ‘실명 공개 동의’가 함께 기록된 글은 공개 화면의 ‘의료진 감수 예정’ 표시가 ‘감수 완료 · 감수자’로 5분 안에 바뀝니다. 감수하지 않은 글을 완료로 기록하지 마세요.", isAdmin() ? '<button class="btn btn-s btn-sm" id="csv">감수 기록 CSV</button>' : "") +
        '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><b>감수 진행률 ' + pct + '%</b><span class="muted small">감수 완료 ' + (cnt.approved + cnt.due) + " / 대상 " + cnt.all + " · 재감수 주기 12개월</span></div><div class=\"progress\"><span style=\"width:" + pct + '%"></span></div></div>' +
        '<div id="ctabs">' + tabsHtml([["all", "전체"], ["todo", "감수 전·수정 필요"], ["approved", "감수 완료"], ["due", "재감수 도래"]], flt, { all: cnt.all, todo: cnt.todo + cnt.revise, approved: cnt.approved, due: cnt.due }) + "</div>" +
        '<div class="filters">' + typeSel + '<input class="inp" id="f-q" type="search" placeholder="제목·주소 검색"></div>' +
        '<div class="table-wrap"><table><thead><tr><th>콘텐츠</th><th class="hide-m">유형</th><th>상태</th><th class="hide-m">최근 감수</th></tr></thead><tbody id="ctab"></tbody></table></div>';
      document.querySelectorAll("#ctabs [data-tab]").forEach(function (b) { b.onclick = function () { flt = b.dataset.tab; draw(); }; });
      document.getElementById("f-type").onchange = function (e) { type = e.target.value; draw(); };
      document.getElementById("f-q").oninput = function (e) { kw = e.target.value.trim(); draw(); };
      var cb = document.getElementById("csv");
      if (cb) cb.onclick = function () { csvDownload("바른혈압_감수기록_" + kstDay() + ".csv", [["주소", "제목", "감수자", "자격", "소속", "감수일", "결과", "실명공개", "의견", "기록자", "기록일시"]].concat(j.items.map(function (r) { return [r.path, r.title || titleOf(r.path), r.reviewer_name, r.reviewer_title, r.reviewer_org, r.reviewed_at, r.result === "approved" ? "승인" : "수정 필요", r.name_public ? "예" : "아니오", r.note, r.created_by, kst(r.created_at)]; }))); };
      draw();
    });
  }
  function openReview(c, hist, done) {
    var h = hist.map(function (r) {
      return '<li><div style="display:flex;justify-content:space-between;gap:8px"><span><span class="tag ' + (r.result === "approved" ? "t-green" : "t-red") + '">' + (r.result === "approved" ? "승인" : "수정 필요") + "</span> <b>" + esc(r.reviewer_name) + "</b> " + esc(r.reviewer_title || "") + (r.reviewer_org ? " · " + esc(r.reviewer_org) : "") + '</span><span class="muted">' + esc(r.reviewed_at) + "</span></div>" + (r.note ? '<div style="margin-top:6px;white-space:pre-wrap">' + esc(r.note) + "</div>" : "") + '<div class="muted small" style="margin-top:4px">' + (r.name_public ? "실명 공개 · " : "") + "기록 " + esc(r.created_by || "-") + " · " + kst(r.created_at) + (isAdmin() ? ' · <button class="btn btn-g btn-sm" data-delr="' + r.id + '">기록 삭제</button>' : "") + "</div></li>";
    }).join("");
    var lastName = hist[0] || {};
    var body = '<div class="meta"><span>' + esc(TYPE_LABEL[c.k] || c.k) + "</span><span>" + esc(c.p) + '</span><a href="' + esc(c.p) + '" target="_blank" rel="noopener">글 열기 ↗</a></div><div class="box q">' + esc(c.t) + "</div>" +
      '<div class="sec"><h3>감수 기록 추가</h3><div class="row3"><div class="field"><label>감수자 이름</label><input data-n maxlength="40" value="' + esc(S.me.role === "reviewer" ? S.me.name : lastName.reviewer_name || "") + '"></div><div class="field"><label>자격</label><input data-t maxlength="40" placeholder="예: 내과 전문의" value="' + esc(lastName.reviewer_title || "") + '"></div><div class="field"><label>소속 (선택)</label><input data-o maxlength="60" value="' + esc(lastName.reviewer_org || "") + '"></div></div>' +
      '<div class="row2" style="margin-top:10px"><div class="field"><label>감수일</label><input data-d type="date" value="' + kstDay() + '" max="' + kstDay() + '"></div><div class="field"><label>결과</label><select data-r><option value="approved">승인 — 내용이 정확함</option><option value="revise">수정 필요 — 고칠 점 있음</option></select></div></div>' +
      '<div class="field" style="margin-top:10px"><label>의견 (수정할 점, 근거, 추가할 내용)</label><textarea data-note rows="4"></textarea></div>' +
      '<label class="check" style="margin-top:10px"><input type="checkbox" data-pub> <span>감수자에게 <b>이름·자격의 공개 동의</b>를 받았습니다. (승인 시에만 공개 화면에 표시)</span></label>' +
      '<div class="callout warn" style="margin-top:10px">실제로 감수가 이루어진 경우에만 기록하세요. 감수하지 않은 글을 ‘감수 완료’로 표시하는 것은 이용자를 오인하게 하는 표시입니다.</div></div>' +
      '<div class="sec"><h3>감수 이력 <span class="muted small">' + hist.length + "건</span></h3>" + (h ? '<ul class="history">' + h + "</ul>" : '<p class="muted">아직 감수 기록이 없습니다.</p>') + "</div>";
    var d = openDrawer("감수 기록", body, '<button class="btn btn-p" data-save>기록 저장</button>');
    d.querySelector("[data-save]").onclick = function () {
      var payload = { path: c.p, title: c.t, reviewer_name: d.querySelector("[data-n]").value, reviewer_title: d.querySelector("[data-t]").value, reviewer_org: d.querySelector("[data-o]").value, reviewed_at: d.querySelector("[data-d]").value, result: d.querySelector("[data-r]").value, note: d.querySelector("[data-note]").value, name_public: d.querySelector("[data-pub]").checked };
      api("reviews", { body: payload }).then(function (j) { if (j.ok) { toast(payload.result === "approved" ? (payload.name_public ? "승인 기록을 저장했습니다. 5분 안에 공개 화면에 반영됩니다." : "승인 기록을 저장했습니다. 실명 비공개라 공개 표시는 바뀌지 않습니다.") : "수정 필요 기록을 저장했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
    d.querySelectorAll("[data-delr]").forEach(function (b) {
      b.onclick = function () { confirmBox("감수 기록을 삭제할까요?", "<p>잘못 입력한 기록을 지울 때만 사용하세요. 삭제 사실은 활동 기록에 남습니다.</p>", "삭제", true).then(function (ok) { if (ok) api("reviews/" + b.dataset.delr + "/delete", { body: {} }).then(function (j) { if (j.ok) { toast("삭제했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); }); }); };
    });
  }

  // ============================================================ 정정 이력
  var REASONS = ["사실 오류 수정", "수치·통계 갱신", "진료지침 개정 반영", "표현 수정", "출처·링크 수정", "내용 보강"];
  function viewCorrections(main) {
    api("corrections").then(function (j) {
      if (!j.ok) { main.innerHTML = pageHead("정정 이력") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
      var rows = j.items.map(function (c) {
        return "<tr" + (isAdmin() ? ' class="click" data-id="' + c.id + '"' : "") + '><td class="num">' + esc(c.date) + "</td><td>" + (c.target_path ? '<a href="' + esc(c.target_path) + '" target="_blank" rel="noopener">' + esc(c.target_title || titleOf(c.target_path)) + "</a>" : esc(c.target_title || "사이트 전체")) + '</td><td><div class="ex">' + esc(c.content) + '</div></td><td class="hide-m">' + esc(c.reason || "") + '</td><td class="hide-m muted small">' + esc(c.created_by || "") + (c.updated_at ? " · 수정됨" : "") + "</td></tr>";
      }).join("");
      main.innerHTML = pageHead("정정 이력", "콘텐츠를 고치면 여기에 기록합니다. 저장하면 공개 <a href=\"/policy/corrections\" target=\"_blank\">정정 이력 페이지</a>에 5분 안에 표시됩니다. 정책상 정정 이력은 삭제하지 않습니다.", isAdmin() ? '<button class="btn btn-p btn-sm" id="add">정정 기록 추가</button>' : "") +
        '<div class="table-wrap"><table><thead><tr><th>날짜</th><th>대상</th><th>내용</th><th class="hide-m">사유</th><th class="hide-m">기록</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">DB에 기록된 정정 이력이 없습니다. (공개 페이지에는 오픈 시점의 기본 이력이 함께 표시됩니다)</td></tr>') + "</tbody></table></div>";
      var reload = function () { viewCorrections(main); };
      var ab = document.getElementById("add"); if (ab) ab.onclick = function () { openCorrection(null, reload); };
      main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openCorrection(j.items.filter(function (x) { return String(x.id) === tr.dataset.id; })[0], reload); }; });
    });
  }
  function openCorrection(c, done) {
    c = c || {};
    var reasonOpts = REASONS.map(function (r) { return "<option" + (r === c.reason ? " selected" : "") + ">" + r + "</option>"; }).join("");
    var body = '<div class="row2"><div class="field"><label>정정 날짜</label><input data-d type="date" value="' + esc(c.date || kstDay()) + '"></div><div class="field"><label>사유</label><select data-r>' + reasonOpts + "</select></div></div>" +
      '<div class="sec"><h3>대상 글</h3><div class="field"><input data-tt placeholder="대상 글 제목 (사이트 전체면 비워 두기)" value="' + esc(c.target_title || "") + '"><input data-tp type="hidden" value="' + esc(c.target_path || "") + '"><div class="hint" data-tph>' + esc(c.target_path || "아래에서 글을 고르면 주소가 연결됩니다.") + "</div></div><div data-pk></div></div>" +
      '<div class="sec"><h3>정정 내용</h3><div class="field"><textarea data-c rows="5" placeholder="무엇을 어떻게 고쳤는지 (예: 나트륨 섭취량 2022년 수치를 2023년 수치로 갱신)">' + esc(c.content || "") + "</textarea></div></div>" +
      (c.id ? '<div class="callout warn">기존 기록을 수정하면 수정 전 내용이 활동 기록에 남습니다.</div>' : "");
    var d = openDrawer(c.id ? "정정 기록 수정" : "정정 기록 추가", body, '<button class="btn btn-p" data-save>' + (c.id ? "수정 저장" : "기록 추가") + "</button>");
    var pk = linkPicker(function (x) { d.querySelector("[data-tt]").value = x.t; d.querySelector("[data-tp]").value = x.p; d.querySelector("[data-tph]").textContent = x.p; });
    var holder = d.querySelector("[data-pk]"); holder.innerHTML = pk.html; pk.bind(holder);
    d.querySelector("[data-save]").onclick = function () {
      var payload = { date: d.querySelector("[data-d]").value, reason: d.querySelector("[data-r]").value, target_title: d.querySelector("[data-tt]").value, target_path: d.querySelector("[data-tp]").value, content: d.querySelector("[data-c]").value };
      api("corrections" + (c.id ? "/" + c.id : ""), { body: payload }).then(function (j) { if (j.ok) { toast("저장했습니다. 5분 안에 공개 페이지에 반영됩니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
  }

  // ============================================================ 사이트 공지
  function viewNotice(main) {
    api("settings").then(function (j) {
      if (!j.ok) { main.innerHTML = pageHead("사이트 공지") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
      var s = j.items || {}, v = function (k) { return s[k] ? s[k].value || "" : ""; };
      main.innerHTML = pageHead("사이트 공지", "모든 페이지 맨 위의 공지 띠 문구를 바꿉니다. 끄면 기본 문구(근거·감수 표기 안내)가 표시됩니다. 반영까지 최대 5분 걸립니다.") +
        '<div class="card" style="max-width:760px"><div class="stack">' +
        '<label class="check"><input type="checkbox" id="n-on"' + (v("notice_on") === "1" ? " checked" : "") + '> <span><b>공지 켜기</b></span></label>' +
        '<div class="field"><label for="n-t">공지 문구 (140자 이내)</label><input id="n-t" maxlength="140" value="' + esc(v("notice_text")) + '" placeholder="예: 2026년 고혈압 진료지침 개정 내용을 반영해 정보를 갱신했습니다."></div>' +
        '<div class="field"><label for="n-l">링크 (선택)</label><input id="n-l" maxlength="200" value="' + esc(v("notice_link")) + '" placeholder="/info/reading-numbers 또는 https://…"><div class="hint">사이트 안 주소는 /로 시작합니다.</div></div>' +
        '<div><span class="muted small">미리보기</span><div class="notice-preview" id="n-pv"></div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="muted small">' + (s.notice_text ? "최근 변경 " + esc(s.notice_text.updated_by || "-") + " · " + kst(s.notice_text.updated_at) : "") + '</span><button class="btn btn-p" id="n-save">저장</button></div></div></div>' +
        '<div class="callout" style="max-width:760px;margin-top:14px">공지는 짧고 사실만 씁니다. 효과·치료를 암시하는 문구, 특정 제품·병원 홍보는 쓰지 않습니다.</div>';
      var pv = function () {
        var t = document.getElementById("n-t").value.trim(), l = document.getElementById("n-l").value.trim(), on = document.getElementById("n-on").checked;
        document.getElementById("n-pv").innerHTML = on && t ? esc(t) + (l ? ' <u>자세히</u>' : "") : "글마다 근거와 최종 검토일을 밝히고, 의료진 감수가 끝난 글에는 감수자를 표기합니다. <u>운영 원칙 보기</u> <span style=\"opacity:.7\">(기본 문구)</span>";
      };
      ["n-t", "n-l", "n-on"].forEach(function (id) { document.getElementById(id).oninput = pv; document.getElementById(id).onchange = pv; }); pv();
      document.getElementById("n-save").onclick = function () {
        api("settings", { body: { notice_on: document.getElementById("n-on").checked, notice_text: document.getElementById("n-t").value, notice_link: document.getElementById("n-l").value } }).then(function (r) { if (r.ok) toast("저장했습니다. 5분 안에 사이트에 반영됩니다."); else toast(errMsg(r), true); });
      };
    });
  }

  // ============================================================ 구독자
  function viewNewsletter(main) {
    var st = "active", kw = "", off = 0, items = [];
    function load(append) {
      api("newsletter" + qs({ status: st, q: kw, limit: 100, offset: off })).then(function (j) {
        if (!j.ok) { main.innerHTML = pageHead("구독자") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
        items = append ? items.concat(j.items) : j.items;
        var t = j.tabs || {}; var counts = { active: t.active || 0, unsubscribed: t.unsubscribed || 0, all: (t.active || 0) + (t.unsubscribed || 0) };
        var rows = items.map(function (n) {
          return '<tr><td>' + esc(n.email) + '</td><td class="muted small">' + kstDate(n.created_at) + '</td><td class="hide-m small">' + esc(n.source || "") + "</td><td>" + (n.unsubscribed_at ? '<span class="tag">수신거부 ' + kstDate(n.unsubscribed_at) + "</span>" : '<span class="tag t-green">수신 중</span>') + '</td><td style="white-space:nowrap">' +
            (n.unsubscribed_at ? '<button class="btn btn-g btn-sm" data-a="restore" data-id="' + n.id + '">복구</button><button class="btn btn-g btn-sm" data-a="delete" data-id="' + n.id + '">파기</button>' : '<button class="btn btn-g btn-sm" data-a="unsubscribe" data-id="' + n.id + '">수신거부 처리</button>') + "</td></tr>";
        }).join("");
        main.innerHTML = pageHead("구독자", "주간 혈압 레터 구독자입니다. 발송은 스티비·메일침프 같은 발송 도구에서 하고, 여기서는 목록을 관리합니다.", '<button class="btn btn-p btn-sm" id="exp">발송용 CSV (수신 중 전체)</button>') +
          tabsHtml([["active", "수신 중"], ["unsubscribed", "수신거부"], ["all", "전체"]], st, counts) +
          '<div class="filters"><input class="inp" id="f-q" type="search" placeholder="이메일 검색" value="' + esc(kw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>이메일</th><th>가입</th><th class="hide-m">경로</th><th>상태</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">구독자가 없습니다.</td></tr>') + "</tbody></table></div>" +
          (items.length < j.total ? '<div class="more"><button class="btn btn-s" id="more">더 보기</button></div>' : "") +
          '<div class="callout" style="margin-top:14px"><b>발송할 때 지킬 것</b><ul style="margin:6px 0 0;padding-left:18px"><li>CSV의 ‘수신거부 링크’ 열을 발송 도구에 함께 가져와, 메일 하단에 구독자별 수신거부 링크를 넣으세요. 링크를 누르면 바로 해지됩니다.</li><li>메일 하단에 발신자(주식회사 블랭크)와 연락처를 표기합니다.</li><li>수신거부 후 30일이 지난 이메일은 시스템 화면의 ‘보유기간 파기’로 지웁니다.</li></ul></div>';
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { st = b.dataset.tab; off = 0; load(); }; });
        var go = function () { kw = document.getElementById("f-q").value.trim(); off = 0; load(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        var mb = document.getElementById("more"); if (mb) mb.onclick = function () { off = items.length; load(true); };
        document.getElementById("exp").onclick = function () {
          api("newsletter" + qs({ status: "active", all: 1 })).then(function (r) {
            if (!r.ok) { toast(errMsg(r), true); return; }
            csvDownload("바른혈압_레터구독자_" + kstDay() + ".csv", [["email", "가입일", "수신거부 링크"]].concat(r.items.map(function (n) { return [n.email, kstDate(n.created_at), n.unsub_url]; })));
            toast(r.items.length + "명 내보냈습니다. 내보내기 기록이 남습니다.");
          });
        };
        main.querySelectorAll("[data-a]").forEach(function (b) {
          b.onclick = function () {
            var a = b.dataset.a, idv = b.dataset.id;
            var run = function () { api("newsletter/" + idv + (a === "delete" ? "/delete" : ""), { body: { action: a } }).then(function (r) { if (r.ok) { toast("처리했습니다."); off = 0; load(); } else toast(errMsg(r), true); }); };
            if (a === "delete") confirmBox("이메일을 파기할까요?", "<p>구독 기록이 영구 삭제됩니다.</p>", "파기", true).then(function (ok) { if (ok) run(); });
            else run();
          };
        });
      });
    }
    load();
  }

  // ============================================================ 활동 기록
  function viewAudit(main) {
    var kw = "", off = 0, items = [];
    function load(append) {
      api("audit" + qs({ q: kw, limit: 100, offset: off })).then(function (j) {
        if (!j.ok) { main.innerHTML = pageHead("활동 기록") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
        items = append ? items.concat(j.items) : j.items;
        var rows = items.map(function (a) { return '<tr><td class="muted small" style="white-space:nowrap">' + kst(a.ts) + "</td><td>" + esc(a.actor || "-") + ' <span class="muted small">' + (a.role === "admin" ? "관리자" : a.role === "reviewer" ? "감수자" : "") + '</span></td><td><span class="tag ' + (a.action === "login_failed" ? "t-red" : /delete|purge/.test(a.action) ? "t-amber" : "") + '">' + esc(ACTION_LABEL[a.action] || a.action) + "</span></td><td>" + esc(a.target || "") + '</td><td class="hide-m"><div class="ex">' + esc(a.detail || "") + "</div></td></tr>"; }).join("");
        main.innerHTML = pageHead("활동 기록", "로그인, 게시·삭제, 감수 기록, 파기·내보내기 등 관리자 작업이 모두 남습니다. 기록은 수정하거나 지울 수 없습니다.") +
          '<div class="filters"><input class="inp" id="f-q" type="search" placeholder="처리자·작업·대상 검색" value="' + esc(kw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>일시</th><th>처리자</th><th>작업</th><th>대상</th><th class="hide-m">내용</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">기록이 없습니다.</td></tr>') + "</tbody></table></div>" +
          (j.items.length === 100 ? '<div class="more"><button class="btn btn-s" id="more">더 보기</button></div>' : "");
        var go = function () { kw = document.getElementById("f-q").value.trim(); off = 0; load(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        var mb = document.getElementById("more"); if (mb) mb.onclick = function () { off = items.length; load(true); };
      });
    }
    load();
  }

  // ============================================================ 시스템·데이터
  function viewSystem(main) {
    api("system").then(function (j) {
      if (!j.ok) { main.innerHTML = pageHead("시스템·데이터") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
      var t = j.tables, p = j.purgeable, pTotal = p.leads + p.reports + p.newsletter + p.stats + (p.ugc || 0) + (p.ugc_reports || 0);
      var labels = { users: "회원", mall_items: "몰 추가 상품", mall_reports: "쿠팡 실적 기록", posts: "게시판 글", comments: "댓글", bookmarks: "저장(찜)", ugc_reports: "게시판 신고", videos: "등록 영상", qna: "질문·경험담", leads: "문의·신청", newsletter: "구독자", factcheck_reports: "팩트체크 요청", content_reviews: "감수 기록", corrections: "정정 이력", audit_log: "활동 기록", stats_daily: "통계(일별 집계)", rate_limits: "접수 속도 제한 기록" };
      var tr = Object.keys(labels).map(function (k) { return "<tr><td>" + labels[k] + '</td><td class="num">' + (t[k] || 0) + "</td></tr>"; }).join("");
      var ok = function (b) { return b ? '<span class="tag t-green">정상</span>' : '<span class="tag t-amber">미설정</span>'; };
      main.innerHTML = pageHead("시스템·데이터", "연결 상태, 데이터 보관, 백업을 관리합니다.") +
        '<div class="grid g2">' +
        '<div class="card"><h2>연결 상태</h2><table><tbody><tr><td>데이터베이스 (D1 · DB)</td><td>' + ok(j.db) + "</td></tr><tr><td>데이터 구조 버전</td><td>v" + j.schema_version + ' <span class="muted small">자동 갱신</span></td></tr><tr><td>관리자 키 (ADMIN_KEY)</td><td>' + ok(j.keys.admin) + "</td></tr><tr><td>감수자 키 (REVIEWER_KEY)</td><td>" + ok(j.keys.reviewer) + "</td></tr><tr><td>통계 수집 시작</td><td>" + esc(j.tables.stats_from || "아직 없음") + "</td></tr></tbody></table>" +
        (j.keys.reviewer ? "" : '<div class="callout" style="margin-top:12px"><b>감수자 계정을 쓰려면</b> Cloudflare Pages → Settings → Variables and Secrets에 <code>REVIEWER_KEY</code>(Secret)를 추가하고 재배포하세요. 감수자는 그 키로 로그인해 답변 검토와 감수 기록만 할 수 있습니다.</div>') + "</div>" +
        '<div class="card"><h2>데이터 현황</h2><table><tbody>' + tr + "</tbody></table></div>" +
        '<div class="card"><h2>보유기간 지난 데이터 파기</h2><p class="small muted" style="margin-top:0">개인정보 처리방침의 보유기간에 따라 삭제합니다.</p><table><tbody>' +
        '<tr><td>처리 완료·보류 후 1년 지난 문의·신청</td><td class="num">' + p.leads + "건</td></tr>" +
        '<tr><td>처리 끝난 지 1년 지난 팩트체크 요청</td><td class="num">' + p.reports + "건</td></tr>" +
        '<tr><td>수신거부 후 30일 지난 구독자</td><td class="num">' + p.newsletter + "건</td></tr>" +
        '<tr><td>400일 지난 일별 통계</td><td class="num">' + p.stats + "건</td></tr>" +
        '<tr><td>회원이 지운 지 30일 지난 글·댓글</td><td class="num">' + (p.ugc || 0) + "건</td></tr>" +
        '<tr><td>처리한 지 1년 지난 게시판 신고</td><td class="num">' + (p.ugc_reports || 0) + "건</td></tr></tbody></table>" +
        '<div style="margin-top:12px;display:flex;justify-content:flex-end"><button class="btn ' + (pTotal ? "btn-d" : "btn-s") + '" id="purge"' + (pTotal ? "" : " disabled") + ">파기 실행" + (pTotal ? " (" + pTotal + "건)" : "") + "</button></div><p class=\"muted small\">한 달에 한 번 실행을 권장합니다.</p></div>" +
        '<div class="card"><h2>전체 데이터 백업</h2><p class="small" style="margin-top:0">질문·문의·구독자·회원·게시판·감수 기록·정정 이력·설정·활동 기록·통계를 JSON 파일 하나로 내려받습니다. 연락처·이메일이 들어 있으니 안전한 곳에 보관하세요. 회원의 비밀번호 정보는 백업 파일에 넣지 않습니다.</p><a class="btn btn-p" href="/api/admin/export">백업 파일 내려받기</a><p class="muted small">내려받기 기록이 활동 기록에 남습니다. 한 달에 한 번 권장.</p></div>' +
        "</div>";
      var pb = document.getElementById("purge");
      pb.onclick = function () {
        confirmBox("보유기간 지난 데이터를 파기할까요?", "<p>" + pTotal + "건이 영구 삭제됩니다. 되돌릴 수 없으므로 먼저 백업을 권장합니다.</p>", "파기 실행", true).then(function (ok) {
          if (ok) api("purge", { body: {} }).then(function (r) { if (r.ok) { toast("파기했습니다: " + r.detail); viewSystem(main); } else toast(errMsg(r), true); });
        });
      };
    });
  }

  // ============================================================ 운영 가이드
  function viewGuide(main) {
    var bannedRows = [["치료합니다 / 치료 효과 / 완치", "관리에 도움이 될 수 있습니다"], ["약을 끊어도 됩니다 / 줄이세요 / 복용을 중단", "약의 조정은 처방한 의료진과 상의하세요"], ["진단합니다 / ○○입니다(병명 단정)", "○○에 해당할 수 있습니다. 진료 때 확인하세요"], ["발병위험도 ○% / 사망위험도", "사용하지 않음 — 개인 위험도 수치는 제시하지 않습니다"], ["100% / 특효 / 무조건 / 보장", "과장 표현은 삭제합니다"]];
    main.innerHTML = pageHead("운영 가이드", "바른혈압을 운영하는 사람이 같은 기준으로 판단하도록 정리한 원칙입니다.") +
      '<div class="card guide" style="max-width:880px">' +
      "<h2>운영 루틴</h2><table><thead><tr><th>주기</th><th>할 일</th></tr></thead><tbody>" +
      "<tr><td><b>매일</b></td><td>새 질문 확인 → 답변 작성·게시 (응급 신호가 있는 질문은 우선 처리) · 새 문의 회신 · 게시판 신고 확인과 새 글 훑어보기</td></tr>" +
      "<tr><td><b>매주</b></td><td>팩트체크 요청 검토 · 대시보드의 사이트 검색어와 많이 본 페이지를 보고 다음 글 주제 정하기 · 주간 레터 발송</td></tr>" +
      "<tr><td><b>매월</b></td><td>감수 진행(감수 전 콘텐츠 줄이기, 재감수 도래 처리) · 보유기간 파기 · 전체 데이터 백업</td></tr>" +
      "<tr><td><b>지침 개정 시</b></td><td>관련 글 갱신 → 정정 이력 기록 → 사이트 공지로 안내</td></tr></tbody></table>" +
      "<h2>답변 원칙</h2><ul><li><b>판정하지 않습니다.</b> 개인의 수치가 정상인지, 약을 바꿔도 되는지는 답하지 않고 ‘진료 때 무엇을 물어볼지’로 안내합니다.</li><li><b>근거를 붙입니다.</b> 사이트의 관련 글이나 공공기관 자료로 연결합니다. ‘관련 글 링크’ 버튼을 쓰세요.</li><li><b>응급 신호를 먼저 봅니다.</b> 심한 두통·가슴 통증·마비·말 어눌함·시야 이상이 언급되면 ‘응급 신호 안내’ 틀을 첫머리에 넣습니다.</li><li><b>개인정보를 지웁니다.</b> 질문에 이름·연락처·병원명이 있으면 질문 칸에서 지운 뒤 게시합니다(원문은 내부 기록으로만 남습니다).</li><li><b>경험담은 경험으로 표시됩니다.</b> 약 이름·용량을 권하는 내용은 편집하거나 게시하지 않습니다.</li></ul>" +
      "<h2>표현 기준 (금칙어)</h2><p>답변을 게시할 때 아래 표현이 있으면 확인 창이 뜹니다. 부정문 등 문맥상 문제가 없을 때만 확인 후 게시합니다.</p><table><thead><tr><th>쓰지 않는 표현</th><th>대신 쓰는 표현</th></tr></thead><tbody>" + bannedRows.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table>" +
      "<h2>감수 원칙</h2><ul><li>실제로 의료진이 내용을 확인한 경우에만 감수 기록을 남깁니다.</li><li>공개 화면에 감수자 이름을 표시하려면 본인의 공개 동의가 있어야 합니다.</li><li>감수 후 12개월이 지나면 ‘재감수 도래’로 표시됩니다. 지침이 바뀌면 기간과 관계없이 다시 감수합니다.</li><li>‘수정 필요’ 결과가 나온 글은 고친 뒤 다시 승인 기록을 남깁니다.</li></ul>" +
      "<h2>역할</h2><table><thead><tr><th>역할</th><th>할 수 있는 일</th></tr></thead><tbody><tr><td><b>관리자</b></td><td>모든 기능 (게시·삭제·문의·구독자·회원·게시판·공지·파기·백업)</td></tr><tr><td><b>감수자</b></td><td>감수 요청된 답변 검토(검토 완료·수정 요청), 콘텐츠 감수 기록, 정정 이력 보기</td></tr></tbody></table>" +
      "<h2>게시판 운영</h2><ul><li><b>숨김이 기본, 삭제는 예외입니다.</b> 원칙에 어긋난 글은 사유를 골라 숨깁니다. 글쓴이에게 사유가 보이고, 이의가 오면 다시 볼 수 있습니다. 완전 삭제는 개인정보 노출·불법 정보에만 씁니다.</li><li><b>숨길 글:</b> 약을 시작·중단·변경하라고 권하는 글, 특정 제품·병원 홍보, 다른 사람의 연락처·진료기록, 근거 없이 ‘이것만 먹으면 낫는다’는 글, 욕설·비방.</li><li><b>그대로 둘 글:</b> 본인의 경험담(“저는 이렇게 했어요”), 서비스에 대한 불만·비판, 편집팀 글에 대한 반론. 마음에 들지 않는다는 이유로 숨기지 않습니다.</li><li><b>응급 신호가 보이는 글</b>(심한 두통·가슴 통증·마비)에는 숨기기 전에 119 안내 댓글이 필요한지 먼저 판단합니다.</li><li><b>이용 제한</b>은 같은 위반이 반복될 때 씁니다. 사유를 회원 메모에 남깁니다.</li><li><b>공지</b>는 ‘게시판 관리 → 공지 쓰기’로 올리고, 필요하면 상단에 고정합니다.</li></ul>" +
      "<h2>회원 문의 대응</h2><ul><li><b>비밀번호 분실:</b> 먼저 ‘비밀번호 재설정’ 페이지의 복구 코드를 안내합니다. 코드가 없으면, 요청 메일의 보낸 주소가 회원 정보의 이메일과 같은지 확인한 뒤 임시 비밀번호를 발급해 그 주소로만 회신합니다.</li><li><b>이메일을 등록하지 않은 계정</b>은 본인 확인 방법이 없습니다. 새로 가입하도록 안내합니다.</li><li><b>게시 중단 요청</b>(명예훼손·사생활 침해 주장)이 오면 해당 글을 먼저 숨기고, 3영업일 안에 처리 결과를 회신합니다.</li></ul>" +
      "<h2>개인정보 처리</h2><ul><li>혈압 기록은 이용자 브라우저에만 있고 서버에는 없습니다. 관리자도 볼 수 없습니다.</li><li>방문 통계는 페이지 주소·날짜·유입 사이트·도구 이름만 날짜별 합계로 남습니다.</li><li>문의 연락처는 회신 목적에만 쓰고, 처리 후 1년이 지나면 파기합니다.</li><li>CSV·백업 파일은 개인 PC에 오래 두지 말고 필요한 작업 후 지웁니다.</li></ul>" +
      "<h2>콘텐츠 추가·수정</h2><p>글은 저장소의 생성기(<code>_src/gen</code>)로 만들어집니다. 새 글 추가나 큰 수정은 생성기를 고친 뒤 다시 빌드해 배포합니다. 수정 후에는 이 콘솔의 정정 이력에 기록하세요.</p>" +
      "</div>";
  }

  // ============================================================ 회원
  var MEM_ST = { active: "이용 중", suspended: "이용 제한", deleted: "탈퇴" };
  var MEM_TAG = { active: "t-green", suspended: "t-red", deleted: "" };
  // 회원 비밀번호와 같은 방식(PBKDF2)으로 임시 비밀번호 값을 만든다. 비밀번호 원문은 서버로 보내지 않는다.
  function deriveProof(username, password) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]).then(function (key) {
      return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("bareunbp:v1:" + String(username).toLowerCase()), iterations: 310000 }, key, 256);
    }).then(function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); });
  }
  function tempPassword() {
    var abc = "abcdefghjkmnpqrstuvwxyz23456789", r = crypto.getRandomValues(new Uint8Array(10)), out = "";
    for (var i = 0; i < 10; i++) out += abc[r[i] % abc.length];
    return out.slice(0, 5) + "-" + out.slice(5);
  }
  function viewMembers(main) {
    var st = S.params.status || "current", kw = S.params.q || "", off = 0, items = [];
    function load(append) {
      api("members" + qs({ status: st, q: kw, limit: 50, offset: off })).then(function (j) {
        if (!j.ok) { main.innerHTML = pageHead("회원") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
        items = append ? items.concat(j.items) : j.items;
        var t = j.tabs || {}, counts = { current: (t.active || 0) + (t.suspended || 0), active: t.active || 0, suspended: t.suspended || 0, deleted: t.deleted || 0 };
        var rows = items.map(function (u) {
          return '<tr class="click" data-id="' + u.id + '"><td class="muted small">' + kstDate(u.created_at) + '</td><td><span class="tag ' + MEM_TAG[u.status] + '">' + MEM_ST[u.status] + "</span></td><td><b>" + esc(u.nickname || "-") + '</b><div class="muted small">' + esc(u.status === "deleted" ? "(탈퇴)" : u.username) + '</div></td><td class="hide-m">' + esc(u.email || "-") + '</td><td class="num">' + u.posts + " / " + u.comments + (u.hidden ? ' <span class="tag t-amber">숨김 ' + u.hidden + "</span>" : "") + '</td><td class="hide-m muted small">' + (u.last_login_at ? ago(u.last_login_at) : "-") + "</td></tr>";
        }).join("");
        main.innerHTML = pageHead("회원", "가입한 회원을 봅니다. 이름·전화번호는 받지 않으며, 혈압 기록은 회원 계정과 연결되지 않아 여기서도 볼 수 없습니다.") +
          tabsHtml([["current", "전체 회원"], ["active", "이용 중"], ["suspended", "이용 제한"], ["deleted", "탈퇴"]], st, counts) +
          '<div class="filters"><input class="inp" id="f-q" type="search" placeholder="아이디·닉네임·이메일·메모 검색" value="' + esc(kw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>가입</th><th>상태</th><th>닉네임·아이디</th><th class="hide-m">이메일</th><th>글 / 댓글</th><th class="hide-m">최근 로그인</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">해당하는 회원이 없습니다.</td></tr>') + "</tbody></table></div>" +
          (items.length < j.total ? '<div class="more"><button class="btn btn-s" id="more">더 보기 (' + items.length + " / " + j.total + ")</button></div>" : "");
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { st = b.dataset.tab; off = 0; load(); }; });
        var go = function () { kw = document.getElementById("f-q").value.trim(); off = 0; load(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        var mb = document.getElementById("more"); if (mb) mb.onclick = function () { off = items.length; load(true); };
        main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openMember(items.filter(function (x) { return String(x.id) === tr.dataset.id; })[0], function () { off = 0; load(); }); }; });
        if (S.params.id) { var it = items.filter(function (x) { return String(x.id) === S.params.id; })[0]; S.params.id = null; if (it) openMember(it, function () { off = 0; load(); }); }
      });
    }
    load();
  }
  function openMember(u, done) {
    var gone = u.status === "deleted";
    var body = '<div class="meta"><span>#' + u.id + "</span><span>" + kst(u.created_at) + " 가입</span>" + (u.last_login_at ? "<span>최근 로그인 " + ago(u.last_login_at) + "</span>" : "") + '<span class="tag ' + MEM_TAG[u.status] + '">' + MEM_ST[u.status] + "</span>" + (u.must_change_pw ? '<span class="tag t-amber">임시 비밀번호 상태</span>' : "") + "</div>" +
      '<div class="row2"><div class="field"><label>닉네임</label><div class="box">' + esc(u.nickname || "-") + '</div></div><div class="field"><label>아이디</label><div class="box">' + esc(gone ? "(탈퇴)" : u.username) + "</div></div></div>" +
      '<div class="sec"><h3>이메일 <span>' + (u.email ? '<a class="btn btn-s btn-sm" href="mailto:' + esc(u.email) + '">메일 쓰기</a>' : "") + '</span></h3><div class="box">' + esc(u.email || "(등록하지 않음)") + "</div></div>" +
      '<div class="sec"><h3>활동 <span><a class="btn btn-g btn-sm" href="#/board?user=' + u.id + '">이 회원의 글 보기</a></span></h3><div class="box">글 ' + u.posts + "개 · 댓글 " + u.comments + "개" + (u.hidden ? " · 숨김 처리 " + u.hidden + "건" : "") + "</div></div>" +
      (gone ? '<div class="callout" style="margin-top:12px">탈퇴한 계정입니다. 아이디·닉네임·이메일은 삭제되었습니다.</div>' :
        '<div class="sec"><h3>메모 (내부용)</h3><div class="field"><textarea data-memo rows="3" placeholder="제한 사유, 문의 대응 기록 등">' + esc(u.memo || "") + "</textarea></div></div>" +
        '<div class="sec"><h3>비밀번호를 잊었다는 문의가 오면</h3><div class="callout">가입 때 등록한 이메일(' + esc(u.email || "없음") + ')에서 온 요청인지 먼저 확인하세요. 일치하면 임시 비밀번호를 발급해 <b>그 이메일로만</b> 회신합니다. 이메일이 없는 계정은 본인 확인이 어려우므로 발급하지 않는 것이 원칙입니다.</div><div style="margin-top:10px"><button class="btn btn-s" data-temp' + (u.email ? "" : " disabled") + ">임시 비밀번호 발급</button></div><div data-temp-out></div></div>" +
        '<div class="sec"><h3>강제 탈퇴</h3><label class="check"><input type="checkbox" data-hide> <span>이 회원이 쓴 글·댓글도 함께 삭제</span></label><div style="margin-top:8px"><button class="btn btn-d btn-sm" data-del>강제 탈퇴 처리</button></div></div>');
    var foot = gone ? "" : '<div class="left">' + (u.status === "active" ? '<button class="btn btn-d btn-sm" data-st="suspended">이용 제한</button>' : '<button class="btn btn-t btn-sm" data-st="active">제한 해제</button>') + '</div><button class="btn btn-p" data-save>메모 저장</button>';
    var d = openDrawer("회원 #" + u.id, body, foot);
    if (gone) return;
    var memo = function () { return d.querySelector("[data-memo]").value; };
    d.querySelector("[data-save]").onclick = function () { api("members/" + u.id, { body: { memo: memo() } }).then(function (j) { if (j.ok) { toast("저장했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); }); };
    d.querySelector("[data-st]").onclick = function () {
      var to = this.dataset.st;
      confirmBox(to === "suspended" ? "이용을 제한할까요?" : "제한을 해제할까요?", to === "suspended" ? "<p>글·댓글 쓰기가 막히고, 로그인된 기기는 모두 로그아웃됩니다. 사유를 메모에 남겨 주세요.</p>" : "<p>다시 글과 댓글을 쓸 수 있게 됩니다.</p>", to === "suspended" ? "이용 제한" : "제한 해제", to === "suspended").then(function (ok) {
        if (ok) api("members/" + u.id, { body: { status: to, memo: memo() } }).then(function (j) { if (j.ok) { toast("처리했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
      });
    };
    d.querySelector("[data-temp]").onclick = function () {
      var btn = this, out = d.querySelector("[data-temp-out]");
      confirmBox("임시 비밀번호를 발급할까요?", "<p>기존 비밀번호는 더 이상 쓸 수 없고, 로그인된 기기는 모두 로그아웃됩니다. 회원은 임시 비밀번호로 로그인한 뒤 새 비밀번호를 정해야 합니다.</p>", "발급").then(function (ok) {
        if (!ok) return;
        var pw = tempPassword(); btn.disabled = true;
        deriveProof(u.username, pw).then(function (proof) { return api("members/" + u.id + "/temppw", { body: { proof: proof } }); }).then(function (j) {
          btn.disabled = false;
          if (!j.ok) { toast(errMsg(j), true); return; }
          out.innerHTML = '<div class="callout warn" style="margin-top:10px"><b>임시 비밀번호</b> — 지금만 표시됩니다. 등록된 이메일로 전달하세요.<div class="box q" style="margin-top:8px;font-family:ui-monospace,monospace;font-size:18px;letter-spacing:.06em;user-select:all">' + esc(pw) + '</div><div style="margin-top:8px"><button class="btn btn-s btn-sm" data-copy>복사</button> <a class="btn btn-s btn-sm" href="mailto:' + esc(u.email) + "?subject=" + encodeURIComponent("[바른혈압] 임시 비밀번호 안내") + "&body=" + encodeURIComponent("안녕하세요, 바른혈압입니다.\n\n요청하신 임시 비밀번호를 안내드립니다.\n\n아이디: " + u.username + "\n임시 비밀번호: " + pw + "\n\n로그인 후 마이페이지 > 계정 설정에서 새 비밀번호를 정해 주세요.\n본인이 요청하지 않았다면 이 메일에 회신해 알려 주세요.\n\n바른혈압 드림") + '">메일 작성 열기</a></div></div>';
          out.querySelector("[data-copy]").onclick = function () { navigator.clipboard && navigator.clipboard.writeText(pw).then(function () { toast("복사했습니다."); }); };
          toast("임시 비밀번호를 발급했습니다.");
        }).catch(function () { btn.disabled = false; toast("이 브라우저에서는 발급할 수 없습니다.", true); });
      });
    };
    d.querySelector("[data-del]").onclick = function () {
      var hide = d.querySelector("[data-hide]").checked;
      confirmBox("강제 탈퇴 처리할까요?", "<p>아이디·닉네임·이메일·저장 목록이 즉시 삭제되고 되돌릴 수 없습니다." + (hide ? " 쓴 글과 댓글도 함께 삭제됩니다." : " 쓴 글은 ‘탈퇴한 회원’으로 남습니다.") + "</p>", "강제 탈퇴", true).then(function (ok) {
        if (ok) api("members/" + u.id + "/delete", { body: { hide_posts: hide } }).then(function (j) { if (j.ok) { toast("탈퇴 처리했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
      });
    };
  }

  // ============================================================ 게시판 관리
  var UGC_ST = { visible: "공개", hidden: "숨김", deleted: "삭제됨" };
  var UGC_TAG = { visible: "t-green", hidden: "t-red", deleted: "" };
  var HIDE_REASONS = ["의료 조언·약 권유", "광고·홍보", "개인정보 노출", "허위·과장 정보", "욕설·비방", "도배·중복 게시", "기타 운영 원칙 위반"];
  function reasonSelect() { return '<select data-reason>' + HIDE_REASONS.map(function (r) { return "<option>" + r + "</option>"; }).join("") + "</select>"; }
  function boardTabs(cur, c) {
    return '<div class="tabs">' + [["posts", "글"], ["comments", "댓글"], ["reports", "신고"]].map(function (t) {
      return '<button data-btab="' + t[0] + '" class="' + (t[0] === cur ? "on" : "") + '">' + t[1] + (t[0] === "reports" && c ? '<span class="c">' + c + "</span>" : "") + "</button>";
    }).join("") + "</div>";
  }
  function viewBoard(main) {
    var tab = S.params.tab || "posts", openReports = 0;
    var head = function () {
      return pageHead("게시판 관리", "자유게시판의 글·댓글·신고를 관리합니다. 원칙에 어긋난 글은 ‘숨김’으로 처리하면 글쓴이에게 사유가 표시됩니다. 완전 삭제는 불법 정보·개인정보 노출처럼 남겨 둘 수 없는 경우에만 씁니다.",
        '<a class="btn btn-s btn-sm" href="/community/board/" target="_blank" rel="noopener">게시판 열기</a><button class="btn btn-p btn-sm" id="notice-add">공지 쓰기</button>') + boardTabs(tab, openReports);
    };
    var bindHead = function () {
      main.querySelectorAll("[data-btab]").forEach(function (b) { b.onclick = function () { tab = b.dataset.btab; draw(); }; });
      document.getElementById("notice-add").onclick = function () { openNotice(null, draw); };
    };
    var refreshBadge = function () { api("dashboard").then(function (d) { if (d.ok) { setBadges(d.counts); } }); };
    function draw() {
      api("dashboard").then(function (d) { openReports = d.ok ? d.counts.ugc_reports_open : 0; if (d.ok) setBadges(d.counts); (tab === "comments" ? drawComments : tab === "reports" ? drawReports : drawPosts)(); });
    }
    // ---- 글
    var pst = S.params.status || "visible", pkw = "", puser = S.params.user || "", poff = 0, posts = [];
    function drawPosts(append) {
      api("board" + qs({ status: pst, q: pkw, user: puser, limit: 50, offset: poff })).then(function (j) {
        if (!j.ok) { main.innerHTML = head() + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; bindHead(); return; }
        posts = append ? posts.concat(j.items) : j.items;
        var t = j.tabs || {}, counts = { visible: t.visible || 0, hidden: t.hidden || 0, deleted: t.deleted || 0, all: (t.visible || 0) + (t.hidden || 0) + (t.deleted || 0) };
        var rows = posts.map(function (p) {
          return '<tr class="click" data-id="' + p.id + '"><td class="num hide-m">' + p.id + '</td><td><span class="tag ' + UGC_TAG[p.status] + '">' + UGC_ST[p.status] + "</span>" + (p.pinned ? ' <span class="tag t-blue">고정</span>' : "") + (p.report_count ? ' <span class="tag t-amber">신고 ' + p.report_count + "</span>" : "") + "</td><td><b>" + esc(p.title) + '</b><div class="ex muted">' + esc(p.body.slice(0, 90)) + '</div></td><td class="hide-m">' + esc(p.category) + '</td><td class="hide-m">' + esc(p.author_label || p.nickname || "탈퇴한 회원") + '</td><td class="num hide-m">' + p.views + " · " + p.like_count + " · " + p.comment_count + '</td><td class="muted small">' + ago(p.created_at) + "</td></tr>";
        }).join("");
        main.innerHTML = head() + tabsHtml([["visible", "공개"], ["hidden", "숨김"], ["reported", "신고된 글"], ["deleted", "삭제됨"], ["all", "전체"]], pst, counts) +
          '<div class="filters"><input class="inp" id="f-q" type="search" placeholder="제목·내용·글쓴이 검색" value="' + esc(pkw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button>' + (puser ? '<span class="tag t-blue">회원 #' + esc(puser) + ' 글만 보는 중</span><button class="btn btn-g btn-sm" id="f-clear">전체 보기</button>' : "") + "</div>" +
          '<div class="table-wrap"><table><thead><tr><th class="hide-m">#</th><th>상태</th><th>제목</th><th class="hide-m">말머리</th><th class="hide-m">글쓴이</th><th class="hide-m">조회·공감·댓글</th><th>작성</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">해당하는 글이 없습니다.</td></tr>') + "</tbody></table></div>" +
          (posts.length < j.total ? '<div class="more"><button class="btn btn-s" id="more">더 보기 (' + posts.length + " / " + j.total + ")</button></div>" : "");
        bindHead();
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { pst = b.dataset.tab; poff = 0; drawPosts(); }; });
        var go = function () { pkw = document.getElementById("f-q").value.trim(); poff = 0; drawPosts(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        var fc = document.getElementById("f-clear"); if (fc) fc.onclick = function () { puser = ""; poff = 0; drawPosts(); };
        var mb = document.getElementById("more"); if (mb) mb.onclick = function () { poff = posts.length; drawPosts(true); };
        main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openPost(posts.filter(function (x) { return String(x.id) === tr.dataset.id; })[0], function () { poff = 0; draw(); }); }; });
      });
    }
    // ---- 댓글
    var cst = "visible", ckw = "", coff = 0, comments = [];
    function drawComments(append) {
      api("comments" + qs({ status: cst, q: ckw, limit: 50, offset: coff })).then(function (j) {
        if (!j.ok) { main.innerHTML = head() + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; bindHead(); return; }
        comments = append ? comments.concat(j.items) : j.items;
        var t = j.tabs || {}, counts = { visible: t.visible || 0, hidden: t.hidden || 0, all: (t.visible || 0) + (t.hidden || 0) + (t.deleted || 0) };
        var rows = comments.map(function (c) {
          var acts = c.status === "deleted" ? "" : (c.status === "visible" ? '<button class="btn btn-g btn-sm" data-ca="hide" data-id="' + c.id + '">숨김</button>' : '<button class="btn btn-g btn-sm" data-ca="show" data-id="' + c.id + '">다시 보이기</button>') + '<button class="btn btn-g btn-sm" data-ca="delete" data-id="' + c.id + '">삭제</button>';
          return '<tr><td><span class="tag ' + UGC_TAG[c.status] + '">' + UGC_ST[c.status] + "</span>" + (c.report_count ? ' <span class="tag t-amber">신고 ' + c.report_count + "</span>" : "") + '</td><td><div style="white-space:pre-wrap">' + esc(c.body) + '</div><div class="muted small" style="margin-top:4px">글: <a href="/community/board/post/?id=' + c.post_id + '" target="_blank" rel="noopener">' + esc(c.post_title || "삭제된 글") + "</a>" + (c.hidden_reason ? " · 사유: " + esc(c.hidden_reason) : "") + '</div></td><td class="hide-m">' + esc(c.nickname || "탈퇴한 회원") + '</td><td class="muted small">' + ago(c.created_at) + '</td><td style="white-space:nowrap">' + acts + "</td></tr>";
        }).join("");
        main.innerHTML = head() + tabsHtml([["visible", "공개"], ["hidden", "숨김"], ["reported", "신고된 댓글"], ["all", "전체"]], cst, counts) +
          '<div class="filters"><input class="inp" id="f-q" type="search" placeholder="댓글·글쓴이 검색" value="' + esc(ckw) + '"><button class="btn btn-s btn-sm" id="f-go">검색</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>상태</th><th>댓글</th><th class="hide-m">글쓴이</th><th>작성</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">해당하는 댓글이 없습니다.</td></tr>') + "</tbody></table></div>" +
          (comments.length < j.total ? '<div class="more"><button class="btn btn-s" id="more">더 보기</button></div>' : "");
        bindHead();
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { cst = b.dataset.tab; coff = 0; drawComments(); }; });
        var go = function () { ckw = document.getElementById("f-q").value.trim(); coff = 0; drawComments(); };
        document.getElementById("f-go").onclick = go; document.getElementById("f-q").onkeydown = function (e) { if (e.key === "Enter") go(); };
        var mb = document.getElementById("more"); if (mb) mb.onclick = function () { coff = comments.length; drawComments(true); };
        main.querySelectorAll("[data-ca]").forEach(function (b) {
          b.onclick = function () {
            var a = b.dataset.ca, cid = b.dataset.id, after = function (j) { if (j.ok) { toast("처리했습니다."); coff = 0; draw(); } else toast(errMsg(j), true); };
            lastReason = HIDE_REASONS[0];
            if (a === "hide") confirmBox("댓글을 숨길까요?", '<p>다른 사람에게는 ‘숨김 처리된 댓글’로 보입니다.</p><div class="field"><label>사유</label>' + reasonSelect() + "</div>", "숨김", true).then(function (ok) { if (ok) api("comments/" + cid, { body: { status: "hidden", hidden_reason: lastReason } }).then(after); });
            else if (a === "show") api("comments/" + cid, { body: { status: "visible" } }).then(after);
            else confirmBox("댓글을 완전히 삭제할까요?", "<p>되돌릴 수 없습니다. 개인정보 노출·불법 정보처럼 남겨 둘 수 없는 경우에만 삭제하세요.</p>", "삭제", true).then(function (ok) { if (ok) api("comments/" + cid + "/delete", { body: {} }).then(after); });
          };
        });
      });
    }
    // ---- 신고
    var rst = "open", reports = [];
    function drawReports() {
      api("ugcreports" + qs({ status: rst, limit: 100 })).then(function (j) {
        if (!j.ok) { main.innerHTML = head() + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; bindHead(); return; }
        reports = j.items;
        var rows = reports.map(function (r, i) {
          return '<tr class="click" data-i="' + i + '"><td><span class="tag ' + (r.target_type === "post" ? "t-blue" : "t-teal") + '">' + (r.target_type === "post" ? "글" : "댓글") + '</span></td><td><div class="ex">' + esc((r.body || "(삭제된 대상)").slice(0, 120)) + '</div><div class="muted small">' + esc(r.post_title || "") + '</div></td><td class="num"><b>' + r.n + '</b>건</td><td class="hide-m">' + esc(r.reasons || "") + '</td><td><span class="tag ' + (UGC_TAG[r.target_status] || "") + '">' + (UGC_ST[r.target_status] || "없음") + '</span></td><td class="muted small">' + ago(r.last_at) + "</td></tr>";
        }).join("");
        main.innerHTML = head() + tabsHtml([["open", "처리 대기"], ["resolved", "처리 완료"], ["all", "전체"]], rst, { open: openReports }) +
          '<div class="table-wrap"><table><thead><tr><th>대상</th><th>내용</th><th>신고</th><th class="hide-m">사유</th><th>현재 상태</th><th>최근 신고</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">' + (rst === "open" ? "처리할 신고가 없습니다." : "신고 기록이 없습니다.") + "</td></tr>") + "</tbody></table></div>" +
          '<div class="callout" style="margin-top:14px">서로 다른 회원 5명이 신고한 글·댓글은 확인 전까지 자동으로 숨겨집니다. 문제가 없으면 ‘문제 없음’으로 처리해 다시 보이게 하세요.</div>';
        bindHead();
        main.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { rst = b.dataset.tab; drawReports(); }; });
        main.querySelectorAll("tr[data-i]").forEach(function (tr) { tr.onclick = function () { openUgcReport(reports[parseInt(tr.dataset.i, 10)], draw); }; });
      });
    }
    draw();
  }
  var lastReason = HIDE_REASONS[0];
  document.addEventListener("change", function (e) { if (e.target && e.target.matches && e.target.matches("[data-reason]")) lastReason = e.target.value; });
  document.addEventListener("focusin", function (e) { if (e.target && e.target.matches && e.target.matches("[data-reason]")) lastReason = e.target.value; });
  function openPost(p, done) {
    var staff = !!p.author_label;
    var body = '<div class="meta"><span>#' + p.id + "</span><span>" + kst(p.created_at) + "</span>" + (p.updated_at ? "<span>수정 " + ago(p.updated_at) + "</span>" : "") + "<span>" + esc(p.category) + '</span><span class="tag ' + UGC_TAG[p.status] + '">' + UGC_ST[p.status] + "</span>" + (p.pinned ? '<span class="tag t-blue">상단 고정</span>' : "") + "</div>" +
      '<div class="sec"><h3>글쓴이 <span>' + (p.user_id && p.user_status !== "deleted" ? '<a class="btn btn-g btn-sm" href="#/members?id=' + p.user_id + '&status=current">회원 정보</a>' : "") + '</span></h3><div class="box">' + esc(p.author_label || p.nickname || "탈퇴한 회원") + (p.username && p.user_status !== "deleted" ? ' <span class="muted">(' + esc(p.username) + ")</span>" : "") + "</div></div>" +
      (staff ? '<div class="sec"><h3>제목</h3><div class="field"><input data-title maxlength="80" value="' + esc(p.title) + '"></div></div><div class="sec"><h3>내용</h3><div class="field"><textarea data-body rows="10">' + esc(p.body) + "</textarea></div></div>"
        : '<div class="sec"><h3>제목</h3><div class="box q">' + esc(p.title) + '</div></div><div class="sec"><h3>내용 <span><a class="btn btn-g btn-sm" href="/community/board/post/?id=' + p.id + '" target="_blank" rel="noopener">사이트에서 보기 ↗</a></span></h3><div class="box" style="white-space:pre-wrap;max-height:360px;overflow:auto">' + esc(p.body) + "</div></div>") +
      '<div class="sec"><h3>반응</h3><div class="box">조회 ' + p.views + " · 공감 " + p.like_count + " · 댓글 " + p.comment_count + " · 신고 " + p.report_count + "</div></div>" +
      (p.status === "hidden" ? '<div class="callout warn" style="margin-top:12px"><b>숨김 사유</b> — ' + esc(p.hidden_reason || "-") + (p.handled_by ? " (" + esc(p.handled_by) + ")" : "") + "</div>" : "") +
      (p.status === "visible" && !staff ? '<div class="sec"><h3>숨김 처리</h3><div class="field"><label>사유 (글쓴이에게 표시됩니다)</label>' + reasonSelect() + "</div></div>" : "") +
      (p.status !== "deleted" ? '<label class="check" style="margin-top:12px"><input type="checkbox" data-pin' + (p.pinned ? " checked" : "") + "> <span>목록 맨 위에 고정</span></label>" : "");
    var foot = '<div class="left"><button class="btn btn-d btn-sm" data-del>완전 삭제</button></div>' + (p.status === "deleted" ? "" : (p.status === "visible" ? (staff ? "" : '<button class="btn btn-d" data-st="hidden">숨김</button>') : '<button class="btn btn-t" data-st="visible">다시 보이기</button>') + '<button class="btn btn-p" data-save>저장</button>');
    var d = openDrawer(staff ? "공지 #" + p.id : "글 #" + p.id, body, foot);
    var send = function (payload, msg) { api("board/" + p.id, { body: payload }).then(function (j) { if (j.ok) { toast(msg); closeDrawer(); done(); } else toast(errMsg(j), true); }); };
    var common = function () { var o = { pinned: d.querySelector("[data-pin]") ? d.querySelector("[data-pin]").checked : !!p.pinned }; if (staff) { o.title = d.querySelector("[data-title]").value; o.body = d.querySelector("[data-body]").value; } return o; };
    var sv = d.querySelector("[data-save]"); if (sv) sv.onclick = function () { send(common(), "저장했습니다."); };
    var stb = d.querySelector("[data-st]");
    if (stb) stb.onclick = function () {
      var o = common(); o.status = stb.dataset.st;
      if (o.status === "hidden") o.hidden_reason = d.querySelector("[data-reason]").value;
      send(o, o.status === "hidden" ? "숨김 처리했습니다." : "다시 보이게 했습니다.");
    };
    d.querySelector("[data-del]").onclick = function () {
      confirmBox("글을 완전히 삭제할까요?", "<p>글과 딸린 댓글·공감·신고 기록이 모두 지워지고 되돌릴 수 없습니다. 보통은 ‘숨김’으로 충분합니다.</p>", "완전 삭제", true).then(function (ok) {
        if (ok) api("board/" + p.id + "/delete", { body: {} }).then(function (j) { if (j.ok) { toast("삭제했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
      });
    };
  }
  function openNotice(_, done) {
    var body = '<div class="callout">운영팀 이름으로 올라가는 공지입니다. 게시판 이용 안내, 점검·변경 사항처럼 회원에게 알릴 내용만 씁니다.</div>' +
      '<div class="sec"><h3>제목</h3><div class="field"><input data-title maxlength="80" placeholder="예: 자유게시판을 열었습니다"></div></div>' +
      '<div class="sec"><h3>내용</h3><div class="field"><textarea data-body rows="12" placeholder="공지 내용"></textarea></div></div>' +
      '<label class="check" style="margin-top:10px"><input type="checkbox" data-pin checked> <span>목록 맨 위에 고정</span></label>';
    var d = openDrawer("공지 쓰기", body, '<button class="btn btn-p" data-save>공지 올리기</button>');
    d.querySelector("[data-save]").onclick = function () {
      api("board", { body: { title: d.querySelector("[data-title]").value, body: d.querySelector("[data-body]").value, pinned: d.querySelector("[data-pin]").checked } }).then(function (j) { if (j.ok) { toast("공지를 올렸습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
  }
  function openUgcReport(r, done) {
    var isPost = r.target_type === "post";
    var body = '<div class="meta"><span>' + (isPost ? "글" : "댓글") + " #" + r.target_id + "</span><span>신고 " + r.n + "건</span><span>" + kst(r.first_at) + ' ~</span><span class="tag ' + (UGC_TAG[r.target_status] || "") + '">' + (UGC_ST[r.target_status] || "삭제된 대상") + "</span></div>" +
      '<div class="sec"><h3>' + (isPost ? "신고된 글" : "신고된 댓글") + ' <span><a class="btn btn-g btn-sm" href="/community/board/post/?id=' + r.post_id + '" target="_blank" rel="noopener">사이트에서 보기 ↗</a></span></h3>' + (r.post_title ? '<div class="muted small" style="margin-bottom:4px">' + esc(r.post_title) + "</div>" : "") + '<div class="box" style="white-space:pre-wrap;max-height:300px;overflow:auto">' + esc(r.body || "(이미 삭제된 대상입니다)") + '</div><div class="muted small" style="margin-top:4px">글쓴이: ' + esc(r.nickname || "탈퇴한 회원") + "</div></div>" +
      '<div class="sec"><h3>신고 사유</h3><div class="box">' + esc(r.reasons || "-") + (r.details ? '<div class="muted" style="margin-top:6px;white-space:pre-wrap">' + esc(r.details) + "</div>" : "") + "</div></div>" +
      (r.status === "open" ? '<div class="sec"><h3>숨김 사유 (신고를 인정할 때)</h3><div class="field">' + reasonSelect() + "</div></div>" : '<div class="callout" style="margin-top:12px">처리 완료된 신고입니다' + (r.handled_by ? " (" + esc(r.handled_by) + ")" : "") + ".</div>");
    var d = openDrawer("신고 확인", body, r.status === "open" ? '<button class="btn btn-s" data-act="dismiss">문제 없음 (그대로 둠)</button><button class="btn btn-d" data-act="hide">숨김 처리</button>' : "");
    d.querySelectorAll("[data-act]").forEach(function (b) {
      b.onclick = function () {
        var hide = b.dataset.act === "hide";
        api("ugcreports/resolve", { body: { target_type: r.target_type, target_id: r.target_id, action: hide ? "hide" : "dismiss", hidden_reason: hide ? d.querySelector("[data-reason]").value : "" } }).then(function (j) {
          if (j.ok) { toast(hide ? "숨김 처리했습니다." : "문제 없음으로 처리했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true);
        });
      };
    });
  }

  // ============================================================ 영상 관리
  var VIDEO_CATS = ["측정", "기본 이해", "생활습관", "음식", "약", "합병증·응급", "기타"];
  function viewVideos(main) {
    api("videos").then(function (j) {
      if (!j.ok) { main.innerHTML = pageHead("영상 관리") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
      var rows = j.items.map(function (v) {
        return '<tr class="click" data-id="' + v.id + '"><td style="width:132px"><img src="https://i.ytimg.com/vi/' + esc(v.youtube_id) + '/mqdefault.jpg" alt="" width="120" height="68" style="border-radius:6px;display:block;object-fit:cover" loading="lazy"></td><td><b>' + esc(v.title) + '</b><div class="muted small">' + esc(v.source || "") + (v.note ? " · " + esc(v.note) : "") + '</div></td><td class="hide-m">' + esc(v.category || "-") + '</td><td><span class="tag ' + (v.status === "visible" ? "t-green" : "") + '">' + (v.status === "visible" ? "공개" : "숨김") + '</span></td><td class="hide-m muted small">' + kstDate(v.created_at) + "</td></tr>";
      }).join("");
      main.innerHTML = pageHead("영상 관리", "‘영상으로 배우기’ 페이지에 보여 줄 유튜브 영상을 추가합니다. 여기서 추가한 영상은 기본으로 실려 있는 영상 뒤에 5분 안에 나타납니다.", '<a class="btn btn-s btn-sm" href="/videos/" target="_blank" rel="noopener">영상 페이지 열기</a><button class="btn btn-p btn-sm" id="add">영상 추가</button>') +
        '<div class="callout warn" style="margin-bottom:14px"><b>등록 기준</b> — 질병관리청·식약처·건강보험공단 같은 공공기관, 대한고혈압학회 등 학회, 대학병원 공식 채널의 영상만 올립니다. 제품 광고, 특정 음식·보조제로 혈압을 고친다는 영상, 약을 끊으라고 권하는 영상은 올리지 않습니다. 올리기 전에 끝까지 직접 확인하세요.</div>' +
        '<div class="table-wrap"><table><thead><tr><th></th><th>제목·출처</th><th class="hide-m">분류</th><th>상태</th><th class="hide-m">등록</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">추가한 영상이 없습니다. 기본 영상은 영상 페이지에서 볼 수 있습니다.</td></tr>') + "</tbody></table></div>";
      var reload = function () { viewVideos(main); };
      document.getElementById("add").onclick = function () { openVideo(null, reload); };
      main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openVideo(j.items.filter(function (x) { return String(x.id) === tr.dataset.id; })[0], reload); }; });
    });
  }
  function openVideo(v, done) {
    v = v || {};
    var body = '<div class="field"><label>유튜브 주소</label><input data-url placeholder="https://www.youtube.com/watch?v=..." value="' + esc(v.youtube_id ? "https://www.youtube.com/watch?v=" + v.youtube_id : "") + '"><div class="hint">영상 페이지의 주소를 그대로 붙여 넣으세요.</div></div>' +
      '<div data-pv style="margin-top:10px"></div>' +
      '<div class="field" style="margin-top:10px"><label>제목</label><input data-title maxlength="120" value="' + esc(v.title || "") + '"></div>' +
      '<div class="row2" style="margin-top:10px"><div class="field"><label>출처 (채널·기관명)</label><input data-source maxlength="60" placeholder="예: 대한고혈압학회" value="' + esc(v.source || "") + '"></div><div class="field"><label>분류</label><select data-cat>' + VIDEO_CATS.map(function (c) { return "<option" + (c === v.category ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="field" style="margin-top:10px"><label>한 줄 소개 (선택)</label><input data-note maxlength="300" value="' + esc(v.note || "") + '"></div>' +
      '<div class="row2" style="margin-top:10px"><div class="field"><label>정렬 순서 (클수록 앞)</label><input data-sort type="number" value="' + (v.sort || 0) + '"></div><div class="field"><label>상태</label><select data-st><option value="visible"' + (v.status !== "hidden" ? " selected" : "") + '>공개</option><option value="hidden"' + (v.status === "hidden" ? " selected" : "") + ">숨김</option></select></div></div>";
    var d = openDrawer(v.id ? "영상 수정" : "영상 추가", body, (v.id ? '<div class="left"><button class="btn btn-d btn-sm" data-del>삭제</button></div>' : "") + '<button class="btn btn-p" data-save>' + (v.id ? "저장" : "추가") + "</button>");
    var url = d.querySelector("[data-url]"), pv = d.querySelector("[data-pv]");
    var show = function () {
      var m = url.value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/) || url.value.match(/^([A-Za-z0-9_-]{11})$/);
      pv.innerHTML = m ? '<img src="https://i.ytimg.com/vi/' + m[1] + '/mqdefault.jpg" alt="영상 미리보기" width="240" height="135" style="border-radius:8px;display:block"> <a class="small" href="https://www.youtube.com/watch?v=' + m[1] + '" target="_blank" rel="noopener">유튜브에서 열어 확인 ↗</a>' : "";
    };
    url.oninput = show; show();
    d.querySelector("[data-save]").onclick = function () {
      var payload = { url: url.value.trim(), title: d.querySelector("[data-title]").value, source: d.querySelector("[data-source]").value, category: d.querySelector("[data-cat]").value, note: d.querySelector("[data-note]").value, sort: d.querySelector("[data-sort]").value, status: d.querySelector("[data-st]").value };
      api("videos" + (v.id ? "/" + v.id : ""), { body: payload }).then(function (j) { if (j.ok) { toast("저장했습니다. 5분 안에 영상 페이지에 반영됩니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
    var del = d.querySelector("[data-del]");
    if (del) del.onclick = function () { confirmBox("영상을 목록에서 삭제할까요?", "<p>영상 페이지에서 사라집니다.</p>", "삭제", true).then(function (ok) { if (ok) api("videos/" + v.id + "/delete", { body: {} }).then(function (j) { if (j.ok) { toast("삭제했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); }); }); };
  }

  // ============================================================ KPI 대시보드
  var SRC_LABEL = { naver: "네이버 검색", google: "구글 검색", daum: "다음 검색", bing: "빙 검색", naver_etc: "네이버 블로그·카페 등", band: "밴드", kakao: "카카오", facebook: "페이스북", instagram: "인스타그램", youtube: "유튜브", x: "X(트위터)", threads: "스레드", ai: "AI 검색(챗GPT 등)", other: "기타 사이트", direct: "직접 방문·앱·메신저" };
  var PAGE_LABEL = { "/": "홈", "/check7/": "7일 혈압 기록", "/measure/": "바르게 재기", "/info/": "건강정보 목록", "/food/": "음식·식단", "/food/recipes/": "저염 레시피 목록", "/factcheck/": "팩트체크 목록", "/tools/": "도구 모음",
    "/tools/timer/": "측정 타이머", "/tools/sodium/": "나트륨 계산기", "/tools/meds/": "복약 체크", "/tools/log-sheet/": "인쇄용 기록지", "/community/": "커뮤니티", "/community/board/": "자유게시판", "/community/board/post/": "게시글 보기",
    "/mall/": "바른혈압몰", "/report/": "진료 준비 리포트", "/videos/": "영상으로 배우기", "/search/": "사이트 검색", "/devices/": "혈압계 가이드", "/products/": "관리용품 가이드", "/clinic/": "진료 준비", "/family/": "가족과 함께",
    "/glossary/": "용어사전", "/faq/": "자주 묻는 질문", "/stats/": "숫자로 보는 고혈압", "/news/": "고혈압 소식", "/library/": "자료실", "/my/": "마이페이지", "/account/login/": "로그인", "/account/signup/": "회원가입", "/about/": "소개", "/404": "없는 페이지(404)" };
  function pageName(p) { return PAGE_LABEL[p] || titleOf(p); }
  function isContent(p) { return /^\/(info|factcheck|food)\/[a-z0-9-]+$|^\/food\/recipes\/[a-z0-9-]+$/.test(p); }
  function nf(n, d) { n = Number(n) || 0; return n.toLocaleString("ko-KR", { maximumFractionDigits: d == null ? 0 : d }); }
  function pct(a, b, d) { return b ? nf((a / b) * 100, d == null ? 1 : d) + "%" : "-"; }
  function dur(sec) { sec = Math.round(sec || 0); if (!sec) return "-"; var m = Math.floor(sec / 60), s2 = sec % 60; return m ? m + "분 " + s2 + "초" : s2 + "초"; }
  function delta(cur, prev, lowerIsBetter) {
    if (!prev && !cur) return "";
    if (!prev) return '<em class="dl up">새로 생김</em>';
    var r = (cur - prev) / prev * 100, good = lowerIsBetter ? r < 0 : r > 0;
    if (Math.abs(r) < 0.5) return '<em class="dl">변화 없음</em>';
    return '<em class="dl ' + (good ? "up" : "down") + '">' + (r > 0 ? "▲ " : "▼ ") + nf(Math.abs(r), 0) + "%</em>";
  }
  function kcard(label, val, sub, tip) { return '<div class="kpi"' + (tip ? ' title="' + esc(tip) + '"' : "") + "><small>" + label + '</small><b class="num">' + val + "</b>" + (sub || "") + "</div>"; }
  function barList(rows, label, opt) {
    opt = opt || {};
    if (!rows || !rows.length) return '<p class="muted small" style="margin:0">' + (opt.empty || "아직 기록이 없습니다.") + "</p>";
    var total = opt.total || rows.reduce(function (a, r) { return a + r.n; }, 0), mx = rows[0].n || 1;
    return '<ul class="list">' + rows.slice(0, opt.limit || 10).map(function (r) {
      return "<li><span>" + label(r.key) + '</span><span class="num"><i class="bar" style="width:' + Math.max(4, Math.round((r.n / mx) * 70)) + 'px"></i>' + nf(r.n) + (opt.share ? ' <span class="muted small">' + pct(r.n, total, 0) + "</span>" : "") + "</span></li>";
    }).join("") + "</ul>";
  }
  function trendSvg(days, series) {
    var W = 720, H = 190, n = days.length, bw = W / n;
    var max = Math.max.apply(null, days.map(function (d) { return series.pv[d] || 0; }).concat([5]));
    var y = function (v) { return H - 22 - Math.round((v / max) * (H - 40)); };
    var bars = days.map(function (d, i) {
      var pv = series.pv[d] || 0, uv = series.uv[d] || 0, x = i * bw;
      return '<rect x="' + (x + bw * 0.12) + '" y="' + y(pv) + '" width="' + Math.max(1, bw * 0.76) + '" height="' + (H - 22 - y(pv)) + '" rx="2" fill="#c9dcf2"><title>' + d + " · 페이지뷰 " + pv + " · 방문자 " + uv + "</title></rect>";
    }).join("");
    var line = days.map(function (d, i) { return (i ? "L" : "M") + (i * bw + bw / 2).toFixed(1) + " " + y(series.uv[d] || 0); }).join(" ");
    var step = Math.ceil(n / 10), labels = days.map(function (d, i) { return i % step === 0 || i === n - 1 ? '<text x="' + (i * bw + bw / 2) + '" y="' + (H - 6) + '" font-size="10" fill="#8a98a8" text-anchor="middle">' + d.slice(5).replace("-", "/") + "</text>" : ""; }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="기간별 방문 추이">' + bars + '<path d="' + line + '" fill="none" stroke="#1f5aa6" stroke-width="2"/>' + labels + "</svg>" +
      '<div class="legend"><span><i style="background:#c9dcf2"></i>페이지뷰</span><span><i style="background:#1f5aa6;height:3px"></i>방문자</span></div>';
  }
  function loadMallProducts() {
    if (S.mallProducts) return Promise.resolve(S.mallProducts);
    return fetch("/mall/products.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { S.mallProducts = j; return j; }).catch(function () { S.mallProducts = []; return []; });
  }
  function csvDownload(name, rows) {
    var csv = "﻿" + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  function viewKpi(main) {
    var days = parseInt(S.params.days || "30", 10) || 30;
    Promise.all([api("kpi?days=" + days), loadMallProducts()]).then(function (res) {
      var j = res[0], prods = res[1];
      if (!j.ok) { main.innerHTML = pageHead("KPI 대시보드") + '<div class="callout bad">' + esc(errMsg(j)) + "</div>"; return; }
      var C = j.cur || {}, P = j.prev || {}, g = function (o, k) { return o[k] || 0; };
      var CMP = j.range.compare !== false, dl = function (a, b, low) { return CMP ? delta(a, b, low) : ""; };
      var dim = {}; (j.dims || []).forEach(function (r) { (dim[r.kind] = dim[r.kind] || []).push({ key: r.key, n: r.n }); });
      Object.keys(dim).forEach(function (k) { dim[k].sort(function (a, b) { return b.n - a.n; }); });
      var ev = {}; (dim.event || []).forEach(function (r) { ev[r.key] = r.n; });
      // ---- 페이지별
      var pg = {};
      (j.pages || []).forEach(function (r) { var o = pg[r.key] = pg[r.key] || { p: r.key }; o[r.kind] = r.n; });
      (dim.ev_p || []).forEach(function (r) { var i = r.key.indexOf("|"), e = r.key.slice(0, i), p = r.key.slice(i + 1); var o = pg[p] = pg[p] || { p: p }; if (e === "share" || e === "save") o[e] = (o[e] || 0) + r.n; });
      var pages = Object.keys(pg).map(function (k) { return pg[k]; }).filter(function (o) { return o.pv; }).sort(function (a, b) { return b.pv - a.pv; });
      // ---- 핵심 숫자
      var uv = g(C, "uv"), pv = g(C, "pv_total"), ses = g(C, "session"), ses2 = g(C, "session2"), nv = g(C, "visitor");
      var tsum = g(C, "tsum"), tcnt = g(C, "tcnt"), eng = g(C, "eng"), read = g(C, "read");
      var Puv = g(P, "uv"), Ppv = g(P, "pv_total"), Pses = g(P, "session"), Pses2 = g(P, "session2"), Pnv = g(P, "visitor");
      var avg = tcnt ? tsum / tcnt : 0, Pavg = g(P, "tcnt") ? g(P, "tsum") / g(P, "tcnt") : 0;
      var bounce = ses ? (1 - ses2 / ses) : 0, Pbounce = Pses ? (1 - Pses2 / Pses) : 0;
      var clicks = (ev.cta || 0) + (ev.out || 0) + (ev.mall_click || 0) + (ev.mall_box || 0);
      var imp = g(C, "mall_imp"), mclk = g(C, "mall_click"), Pimp = g(P, "mall_imp"), Pmclk = g(P, "mall_click");
      var mallPv = (pg["/mall/"] || {}).pv || 0;
      var u = j.ugc || {};
      // 쿠팡 실적 (입력값) — 기간에 걸친 달
      var fromM = j.range.from.slice(0, 7), toM = j.range.to.slice(0, 7);
      var reps = (j.reports || []).filter(function (r) { return r.month >= fromM && r.month <= toM; });
      var rsum = function (k) { return reps.reduce(function (a, r) { return a + (r[k] || 0); }, 0); };
      var orders = rsum("orders"), cclicks = rsum("clicks"), gmv = rsum("gmv"), comm = rsum("commission");
      var monthClicks = {}; (j.months || []).forEach(function (r) { if (r.kind === "mall_click") monthClicks[r.month] = r.n; });
      var ourClicksInMonths = reps.reduce(function (a, r) { return a + (monthClicks[r.month] || 0); }, 0);
      var periodTxt = days === 1 ? "오늘" : "최근 " + days + "일";

      var periodBtns = [[1, "오늘"], [7, "7일"], [30, "30일"], [90, "90일"], [365, "1년"]].map(function (x) { return '<button data-days="' + x[0] + '" class="' + (x[0] === days ? "on" : "") + '">' + x[1] + "</button>"; }).join("");
      var traffic =
        kcard("방문자수", nf(uv), dl(uv, Puv), "하루 단위 순방문자를 기간 동안 더한 값. 같은 사람이 이틀 오면 2로 셉니다.") +
        kcard("신규 방문자", nf(nv), dl(nv, Pnv), "이 브라우저로 처음 방문한 수") +
        kcard("방문(세션)", nf(ses), dl(ses, Pses), "30분 넘게 쉬면 새 방문으로 셉니다.") +
        kcard("페이지뷰", nf(pv), dl(pv, Ppv)) +
        kcard("방문당 페이지", ses ? nf(pv / ses, 1) : "-", Pses ? dl(pv / ses, Ppv / Pses) : "") +
        kcard("평균 체류시간", dur(avg), dl(avg, Pavg), "화면에 보인 시간만 센 페이지당 평균") +
        kcard("이탈률", ses ? pct(ses - ses2, ses) : "-", Pses ? dl(bounce, Pbounce, true) : "", "한 페이지만 보고 떠난 방문의 비율 (낮을수록 좋음)") +
        kcard("완독률", pct(read, tcnt), "", "글의 75% 이상까지 내리고 15초 넘게 머문 비율");
      var engage =
        kcard("클릭수", nf(clicks), "", "버튼·바깥 링크·쿠팡 상품·관련 제품 상자 클릭 합계") +
        kcard("공유", nf(ev.share || 0)) + kcard("저장", nf((ev.save || 0))) + kcard("영상 재생", nf(ev.video_play || 0)) +
        kcard("혈압 기록 저장", nf((ev.record_saved || 0) + (ev.quick_entry || 0))) + kcard("사이트 검색", nf(ev.search || 0)) +
        kcard("신규 회원", nf(u.signups), delta(u.signups || 0, u.signups_prev || 0)) + kcard("게시글·댓글", nf((u.posts || 0) + (u.comments || 0)), delta((u.posts || 0) + (u.comments || 0), (u.posts_prev || 0) + (u.comments_prev || 0))) +
        kcard("레터 구독", nf(u.newsletter), delta(u.newsletter || 0, u.newsletter_prev || 0)) + kcard("질문·경험담", nf(u.qna), delta(u.qna || 0, u.qna_prev || 0));
      var mall =
        kcard("몰 방문(페이지뷰)", nf(mallPv)) +
        kcard("상품 노출", nf(imp), dl(imp, Pimp), "상품 카드가 화면에 절반 이상 보인 횟수 (방문당 상품별 1회)") +
        kcard("쿠팡 링크 클릭", nf(mclk), dl(mclk, Pmclk)) +
        kcard("클릭률(CTR)", pct(mclk, imp), "", "쿠팡 링크 클릭 ÷ 상품 노출") +
        kcard("몰 방문 대비 클릭", pct(mclk, mallPv), "", "쿠팡 링크 클릭 ÷ 바른혈압몰 페이지뷰") +
        kcard("관련 제품 상자 클릭", nf(ev.mall_box || 0), "", "글 끝 상자에서 바른혈압몰로 넘어간 횟수") +
        kcard("구매 건수", reps.length ? nf(orders) : "입력 전", reps.length ? '<em class="muted">' + reps.map(function (r) { return r.month; }).join(", ") + " 입력값</em>" : "", "쿠팡 파트너스 리포트에서 옮겨 적은 값") +
        kcard("구매전환율", reps.length && cclicks ? pct(orders, cclicks, 2) : "-", reps.length && ourClicksInMonths ? '<em class="muted">우리 집계 클릭 기준 ' + pct(orders, ourClicksInMonths, 2) + "</em>" : "", "구매 건수 ÷ 쿠팡이 집계한 클릭") +
        kcard("수익", reps.length ? nf(comm) + "원" : "-", reps.length && gmv ? '<em class="muted">구매 금액 ' + nf(gmv) + "원</em>" : "") +
        kcard("1천 페이지뷰당 수익", reps.length && pv ? nf(comm / (pv / 1000)) + "원" : "-", "", "입력한 달의 수익 ÷ 기간 페이지뷰 × 1,000 (RPM)");

      // ---- 추이 그래프
      var dlist = [], sp = { pv: {}, uv: {} };
      for (var i = days - 1; i >= 0; i--) dlist.push(kstDay(i));
      (j.series || []).forEach(function (r) { if (r.kind === "pv_total") sp.pv[r.day] = r.n; if (r.kind === "uv") sp.uv[r.day] = r.n; });
      // ---- 유입·기기
      var src = dim.src || [], dev = dim.device || [];
      // ---- 인기 정보
      var popular = pages.filter(function (o) { return isContent(o.p); }).slice(0, 10);
      var popRows = popular.map(function (o, i) {
        return "<tr><td class=\"num\">" + (i + 1) + '</td><td><a href="' + esc(o.p) + '" target="_blank" rel="noopener">' + esc(pageName(o.p)) + '</a><div class="muted small">' + esc(o.p) + '</div></td><td class="num">' + nf(o.pv) + '</td><td class="num hide-m">' + nf(o.upv || 0) + '</td><td class="num">' + dur(o.tcnt ? o.tsum / o.tcnt : 0) + '</td><td class="num hide-m">' + pct(o.read || 0, o.tcnt || 0, 0) + "</td></tr>";
      }).join("");
      // ---- 페이지별 표
      var pageRow = function (o) {
        return '<tr><td><a href="' + esc(o.p) + '" target="_blank" rel="noopener">' + esc(pageName(o.p)) + '</a><div class="muted small">' + esc(o.p) + '</div></td><td class="num">' + nf(o.pv) + '</td><td class="num">' + nf(o.upv || 0) + '</td><td class="num">' + dur(o.tcnt ? o.tsum / o.tcnt : 0) + '</td><td class="num hide-m">' + pct(o.read || 0, o.tcnt || 0, 0) + '</td><td class="num hide-m">' + nf(o.land || 0) + '</td><td class="num hide-m">' + nf((o.share || 0) + (o.save || 0)) + "</td></tr>";
      };
      // ---- 상품별
      var pname = {}; (prods || []).forEach(function (x) { pname[x.id] = x.name; });
      var pstat = {}; (dim.mall_imp || []).forEach(function (r) { (pstat[r.key] = pstat[r.key] || { id: r.key, imp: 0, clk: 0 }).imp = r.n; });
      (dim.mall_click || []).forEach(function (r) { (pstat[r.key] = pstat[r.key] || { id: r.key, imp: 0, clk: 0 }).clk = r.n; });
      var plist = Object.keys(pstat).map(function (k) { return pstat[k]; }).sort(function (a, b) { return b.clk - a.clk || b.imp - a.imp; });
      var prodRows = plist.slice(0, 15).map(function (x) { return "<tr><td>" + esc(pname[x.id] || "추가 상품 " + x.id) + '</td><td class="num">' + nf(x.imp) + '</td><td class="num">' + nf(x.clk) + '</td><td class="num">' + pct(x.clk, x.imp) + "</td></tr>"; }).join("");

      var sub = esc(j.range.stat_from || j.range.from) + " ~ " + esc(j.range.to) + (CMP ? " · 비교 기간 " + esc(j.range.prev_from) + " ~ " + esc(j.range.prev_to) + " (화살표는 비교 기간 대비 증감)" : "") +
        (j.range.stat_from && j.range.stat_from > j.range.from ? " · 방문자·체류시간·클릭 지표는 " + esc(j.range.since) + "부터 집계해 그 전 날짜는 합계에서 뺐습니다." : "");
      main.innerHTML = pageHead("KPI 대시보드", sub,
        '<div class="tabs" id="pd" style="margin:0">' + periodBtns + '</div><button class="btn btn-s btn-sm" id="csv">페이지별 CSV</button>') +
        '<h3 class="kh">트래픽</h3><div class="kpis">' + traffic + "</div>" +
        '<div class="card"><h2>방문 추이 <small>' + periodTxt + " · 막대는 페이지뷰, 선은 방문자</small></h2><div class=\"chart\">" + trendSvg(dlist, sp) + "</div></div>" +
        '<h3 class="kh">참여·커뮤니티</h3><div class="kpis">' + engage + "</div>" +
        '<h3 class="kh">바른혈압몰 · 쿠팡 파트너스</h3><div class="kpis">' + mall + "</div>" +
        (reps.length ? "" : '<div class="callout warn" style="margin-bottom:14px">구매 건수·전환율·수익은 쿠팡 파트너스 리포트의 숫자를 옮겨 적어야 계산됩니다. <a href="#/mall">바른혈압몰 메뉴</a>에서 월별 실적을 입력하세요.</div>') +
        '<div class="grid g2" style="margin-top:14px">' +
        '<div class="card"><h2>가장 인기 있는 정보 <small>' + periodTxt + " · 건강정보·음식·팩트체크·레시피</small></h2>" + (popRows ? '<div class="table-wrap" style="border:0"><table><thead><tr><th>#</th><th>글</th><th>조회</th><th class="hide-m">순방문</th><th>평균 체류</th><th class="hide-m">완독률</th></tr></thead><tbody>' + popRows + "</tbody></table></div>" : '<p class="muted small" style="margin:0">아직 기록이 없습니다.</p>') + "</div>" +
        '<div class="card"><h2>유입 경로 <small>방문이 시작된 곳</small></h2>' + barList(src, function (k) { return esc(SRC_LABEL[k] || k); }, { share: 1, limit: 12, empty: "아직 기록이 없습니다." }) +
        '<h2 style="margin-top:16px">기기</h2>' + barList(dev, function (k) { return k === "mobile" ? "모바일·태블릿" : "PC"; }, { share: 1 }) + "</div>" +
        '<div class="card"><h2>바른혈압몰 상품별 <small>노출 · 클릭 · 클릭률</small></h2>' + (prodRows ? '<div class="table-wrap" style="border:0"><table><thead><tr><th>상품</th><th>노출</th><th>클릭</th><th>CTR</th></tr></thead><tbody>' + prodRows + "</tbody></table></div>" : '<p class="muted small" style="margin:0">아직 기록이 없습니다.</p>') + "</div>" +
        '<div class="card"><h2>많이 들어온 사이트 <small>도메인</small></h2>' + barList(dim.ref, function (k) { return esc(k); }, { empty: "외부 유입 기록이 없습니다." }) + "</div>" +
        '<div class="card"><h2>많이 누른 버튼</h2>' + barList(dim.cta, function (k) { var i = k.indexOf(" ▸ "); return esc(k.slice(i + 3)) + ' <span class="muted small">' + esc(pageName(k.slice(0, i))) + "</span>"; }, { limit: 12 }) + "</div>" +
        '<div class="card"><h2>바깥 링크 클릭 <small>출처·공유 등</small></h2>' + barList(dim.out, function (k) { return esc(k); }) + "</div>" +
        '<div class="card"><h2>첫 페이지(랜딩) <small>방문이 시작된 페이지</small></h2>' + barList(pages.filter(function (o) { return o.land; }).map(function (o) { return { key: o.p, n: o.land }; }).sort(function (a, b) { return b.n - a.n; }), function (k) { return esc(pageName(k)); }, { share: 1 }) + "</div>" +
        '<div class="card"><h2>사이트 검색어 <small>콘텐츠 기획에 활용</small></h2>' + barList(dim.search, function (k) { return esc(k); }, { limit: 12 }) + "</div>" +
        '<div class="card"><h2>도구 이용·참여</h2>' + barList((dim.event || []).filter(function (r) { return ["search", "mall_view", "cta", "out"].indexOf(r.key) < 0; }), function (k) { return esc(EVENT_LABEL[k] || k); }, { limit: 14 }) + "</div>" +
        "</div>" +
        '<div class="card" style="margin-top:14px"><h2>페이지별 성과 <small>' + periodTxt + " · 조회수 순</small></h2>" + tabsHtml([["all", "전체"], ["content", "글만"], ["other", "도구·기타"]], S.params.pt || "all") +
        '<div class="table-wrap"><table><thead><tr><th>페이지</th><th>조회수</th><th>순방문자</th><th>평균 체류</th><th class="hide-m">완독률</th><th class="hide-m">첫 페이지</th><th class="hide-m">공유·저장</th></tr></thead><tbody id="ptb"></tbody></table></div>' +
        '<p class="muted small" id="pmore"></p></div>' +
        '<details class="card" style="margin-top:14px"><summary><b>지표를 어떻게 세나요?</b></summary><ul class="small" style="line-height:1.8;margin:10px 0 0">' +
        "<li><b>방문자수</b> — 하루 단위 순방문자. 브라우저에 오늘 날짜만 저장해 그날 첫 페이지인지 확인합니다. 기간 합계라 같은 사람이 이틀 오면 2로 셉니다.</li>" +
        "<li><b>방문(세션)</b> — 페이지를 열 때마다 이어지는 한 번의 방문. 30분 넘게 쉬었다 오면 새 방문입니다. <b>이탈률</b>은 페이지 하나만 보고 떠난 방문의 비율입니다.</li>" +
        "<li><b>체류시간</b> — 화면에 실제로 보인 시간만 셉니다(최대 30분). 페이지를 떠날 때 한 번 보냅니다. <b>완독률</b>은 75% 이상 스크롤하고 15초 넘게 머문 비율입니다.</li>" +
        "<li><b>상품 노출·클릭</b> — 상품 카드가 화면에 절반 이상 보이면 노출 1회(방문당 상품별 한 번), ‘쿠팡에서 보기’ 또는 사진을 누르면 클릭 1회입니다.</li>" +
        "<li><b>구매 건수·수익</b> — 쿠팡은 구매 정보를 바른혈압에 보내지 않으므로, 쿠팡 파트너스 리포트의 숫자를 바른혈압몰 메뉴에 월별로 입력하면 계산됩니다.</li>" +
        "<li>로봇, 추적 거부(Do Not Track·GPC) 설정 브라우저, 관리자 화면은 세지 않습니다. 이름·IP·쿠키 ID 같은 식별자는 저장하지 않습니다.</li></ul></details>";
      // 기간 버튼
      main.querySelectorAll("#pd button").forEach(function (b) { b.onclick = function () { location.hash = "#/kpi?days=" + b.dataset.days; }; });
      // 페이지 표
      var drawPages = function (tab) {
        var list = pages.filter(function (o) { return tab === "content" ? isContent(o.p) : tab === "other" ? !isContent(o.p) : true; });
        var show = S.params.all ? list : list.slice(0, 40);
        document.getElementById("ptb").innerHTML = show.map(pageRow).join("") || '<tr><td colspan="7" class="empty">아직 기록이 없습니다.</td></tr>';
        document.getElementById("pmore").innerHTML = list.length > show.length ? "상위 40개만 표시했습니다. 전체 " + list.length + '개 — <a href="#" id="pall">모두 보기</a>' : "";
        var a = document.getElementById("pall"); if (a) a.onclick = function (e) { e.preventDefault(); S.params.all = 1; drawPages(tab); };
      };
      drawPages(S.params.pt || "all");
      main.querySelectorAll(".card .tabs button[data-tab]").forEach(function (b) { b.onclick = function () { main.querySelectorAll(".card .tabs button[data-tab]").forEach(function (x) { x.classList.toggle("on", x === b); }); drawPages(b.dataset.tab); }; });
      document.getElementById("csv").onclick = function () {
        csvDownload("바른혈압_페이지별_" + j.range.from + "_" + j.range.to + ".csv", [["주소", "제목", "조회수", "순방문자", "평균 체류(초)", "완독률(%)", "첫 페이지", "공유", "저장"]].concat(pages.map(function (o) {
          return [o.p, pageName(o.p), o.pv, o.upv || 0, o.tcnt ? Math.round(o.tsum / o.tcnt) : "", o.tcnt ? Math.round((o.read || 0) / o.tcnt * 100) : "", o.land || 0, o.share || 0, o.save || 0];
        })));
      };
    });
  }

  // ============================================================ 바른혈압몰
  var MALL_CATS = [["record", "기록·복약 관리"], ["body", "허리둘레·걷기"], ["kitchen", "덜 짜게 요리하기"], ["exercise", "집에서 하는 운동"]];
  var MALL_CAT_NAME = {}; MALL_CATS.forEach(function (c) { MALL_CAT_NAME[c[0]] = c[1]; });
  function viewMall(main) {
    Promise.all([api("mall"), api("kpi?days=30"), loadMallProducts()]).then(function (res) {
      var m = res[0], k = res[1], prods = res[2] || [];
      if (!m.ok) { main.innerHTML = pageHead("바른혈압몰") + '<div class="callout bad">' + esc(errMsg(m)) + "</div>"; return; }
      var hidden = {}; (m.hidden || []).forEach(function (x) { hidden[x] = 1; });
      var st = {};
      if (k.ok) (k.dims || []).forEach(function (r) { if (r.kind === "mall_imp" || r.kind === "mall_click") { var o = st[r.key] = st[r.key] || { imp: 0, clk: 0 }; if (r.kind === "mall_imp") o.imp = r.n; else o.clk = r.n; } });
      var monthStat = {}; if (k.ok) (k.months || []).forEach(function (r) { (monthStat[r.month] = monthStat[r.month] || {})[r.kind] = r.n; });
      var thisMonth = kstDay().slice(0, 7);
      // 월별 실적 표
      var reps = m.reports || [];
      var repRows = reps.map(function (r) {
        var ms = monthStat[r.month] || {}, our = ms.mall_click || 0;
        return '<tr class="click" data-m="' + esc(r.month) + '"><td><b>' + esc(r.month) + '</b></td><td class="num">' + nf(our) + '</td><td class="num">' + (r.clicks == null ? "-" : nf(r.clicks)) + '</td><td class="num">' + (r.orders == null ? "-" : nf(r.orders)) + '</td><td class="num">' + (r.clicks ? pct(r.orders || 0, r.clicks, 2) : "-") + '</td><td class="num hide-m">' + (r.gmv == null ? "-" : nf(r.gmv) + "원") + '</td><td class="num">' + (r.commission == null ? "-" : nf(r.commission) + "원") + '</td><td class="num hide-m">' + (r.clicks && r.commission != null ? nf(r.commission / r.clicks) + "원" : "-") + '</td><td class="num hide-m">' + (ms.pv_total && r.commission != null ? nf(r.commission / (ms.pv_total / 1000)) + "원" : "-") + "</td></tr>";
      }).join("");
      // 상품 표 (기본 상품 + 추가 상품)
      var rowsStatic = prods.map(function (p) {
        var s2 = st[p.id] || { imp: 0, clk: 0 }, off = !!hidden[p.id];
        return '<tr' + (off ? ' style="opacity:.55"' : "") + '><td style="width:64px"><img src="' + esc(p.img) + '" alt="" width="52" height="52" referrerpolicy="no-referrer" style="border-radius:8px;object-fit:contain;background:#f3f5f8;display:block" loading="lazy"></td><td><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.cat_name) + ' · 기본 상품 · <a href="' + esc(p.url) + '" target="_blank" rel="noopener">링크 확인</a></div></td><td class="num">' + nf(s2.imp) + '</td><td class="num">' + nf(s2.clk) + '</td><td class="num">' + pct(s2.clk, s2.imp) + '</td><td><button class="btn btn-sm ' + (off ? "btn-p" : "btn-s") + '" data-hide="' + esc(p.id) + '" data-on="' + (off ? 0 : 1) + '">' + (off ? "다시 보이기" : "숨기기") + "</button></td></tr>";
      }).join("");
      var rowsExtra = (m.items || []).map(function (p) {
        var s2 = st[p.pid] || { imp: 0, clk: 0 };
        return '<tr class="click" data-id="' + p.id + '"' + (p.status === "hidden" ? ' style="opacity:.55"' : "") + '><td style="width:64px">' + (p.img ? '<img src="' + esc(p.img) + '" alt="" width="52" height="52" referrerpolicy="no-referrer" style="border-radius:8px;object-fit:contain;background:#f3f5f8;display:block" loading="lazy">' : "") + '</td><td><b>' + esc(p.name) + '</b><div class="muted small">' + esc(MALL_CAT_NAME[p.cat] || p.cat) + " · 추가 상품" + (p.status === "hidden" ? " · 숨김" : "") + '</div></td><td class="num">' + nf(s2.imp) + '</td><td class="num">' + nf(s2.clk) + '</td><td class="num">' + pct(s2.clk, s2.imp) + '</td><td><span class="muted small">눌러서 수정</span></td></tr>';
      }).join("");
      var cur = reps.filter(function (r) { return r.month === thisMonth; })[0] || {}, cms = monthStat[thisMonth] || {};
      main.innerHTML = pageHead("바른혈압몰", "쿠팡 파트너스 제휴 상품과 실적을 관리합니다. 노출·클릭은 자동으로 집계되고, 구매·수익은 쿠팡 파트너스 리포트의 숫자를 월별로 옮겨 적습니다.",
        '<a class="btn btn-s btn-sm" href="/mall/" target="_blank" rel="noopener">바른혈압몰 열기</a><a class="btn btn-s btn-sm" href="https://partners.coupang.com/" target="_blank" rel="noopener">쿠팡 파트너스</a><button class="btn btn-p btn-sm" id="add">상품 추가</button>') +
        '<div class="kpis">' +
        kcard("이번 달 상품 노출", nf(cms.mall_imp || 0)) + kcard("이번 달 쿠팡 클릭", nf(cms.mall_click || 0), '<em class="muted">우리 집계</em>') +
        kcard("클릭률", pct(cms.mall_click || 0, cms.mall_imp || 0)) +
        kcard("이번 달 구매 건수", cur.orders == null ? "입력 전" : nf(cur.orders)) +
        kcard("구매전환율", cur.clicks ? pct(cur.orders || 0, cur.clicks, 2) : "-", '<em class="muted">쿠팡 클릭 기준</em>') +
        kcard("이번 달 수익", cur.commission == null ? "-" : nf(cur.commission) + "원") + "</div>" +
        '<div class="card"><h2>쿠팡 실적 입력 <small>쿠팡 파트너스 → 리포트 → 기간별 리포트의 ‘이번 달 집계’를 옮겨 적으세요. 같은 달을 다시 저장하면 덮어씁니다.</small></h2>' +
        '<div class="mform"><div class="field"><label>월</label><input id="r-month" value="' + esc(thisMonth) + '" placeholder="2026-11"></div><div class="field"><label>클릭(쿠팡 집계)</label><input id="r-clicks" inputmode="numeric" value="' + (cur.clicks == null ? "" : cur.clicks) + '"></div><div class="field"><label>구매 건수</label><input id="r-orders" inputmode="numeric" value="' + (cur.orders == null ? "" : cur.orders) + '"></div><div class="field"><label>취소 건수</label><input id="r-cancels" inputmode="numeric" value="' + (cur.cancels == null ? "" : cur.cancels) + '"></div><div class="field"><label>합산 금액(원)</label><input id="r-gmv" inputmode="numeric" value="' + (cur.gmv == null ? "" : cur.gmv) + '"></div><div class="field"><label>수익(원)</label><input id="r-comm" inputmode="numeric" value="' + (cur.commission == null ? "" : cur.commission) + '"></div><div class="field" style="grid-column:1/-1"><label>메모 (선택)</label><input id="r-memo" maxlength="200" value="' + esc(cur.memo || "") + '"></div></div>' +
        '<div style="margin-top:10px"><button class="btn btn-p btn-sm" id="r-save">저장</button></div>' +
        '<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>월</th><th>클릭(우리)</th><th>클릭(쿠팡)</th><th>구매</th><th>전환율</th><th class="hide-m">구매 금액</th><th>수익</th><th class="hide-m">클릭당 수익</th><th class="hide-m">1천 PV당 수익</th></tr></thead><tbody>' + (repRows || '<tr><td colspan="9" class="empty">아직 입력한 실적이 없습니다.</td></tr>') + "</tbody></table></div>" +
        '<p class="muted small" style="margin:8px 0 0">‘클릭(우리)’는 바른혈압이 직접 센 쿠팡 링크 클릭입니다. 쿠팡 집계와 차이가 나는 것은 정상입니다(로봇 제외 방식, 추적 거부 브라우저, 중복 클릭 처리 차이). 행을 누르면 그 달 값을 입력란에 불러옵니다.</p></div>' +
        '<div class="card" style="margin-top:14px"><h2>상품 <small>최근 30일 노출·클릭 · 기본 상품은 숨기기만, 추가 상품은 수정·삭제 가능</small></h2>' +
        '<div class="table-wrap" style="border:0"><table><thead><tr><th></th><th>상품</th><th>노출</th><th>클릭</th><th>CTR</th><th></th></tr></thead><tbody>' + rowsExtra + rowsStatic + "</tbody></table></div>" +
        '<div class="callout warn" style="margin-top:12px"><b>상품을 고를 때</b> — 바른혈압 글의 생활 관리와 바로 이어지는 물건만 올립니다. 혈압계 같은 의료기기, 건강기능식품·영양제, ‘혈압을 낮춘다’는 식으로 효능을 내세우는 제품은 올리지 않습니다. 상품 설명에도 효능·순위·‘최고’ 같은 표현을 쓰지 않습니다.</div></div>';
      var reload = function () { viewMall(main); };
      document.getElementById("add").onclick = function () { openMallItem(null, reload); };
      document.getElementById("r-save").onclick = function () {
        var v = function (id) { return document.getElementById(id).value; };
        api("mall/report", { body: { month: v("r-month").trim(), clicks: v("r-clicks"), orders: v("r-orders"), cancels: v("r-cancels"), gmv: v("r-gmv"), commission: v("r-comm"), memo: v("r-memo") } }).then(function (j) { if (j.ok) { toast("저장했습니다."); reload(); } else toast(errMsg(j), true); });
      };
      main.querySelectorAll("tr[data-m]").forEach(function (tr) { tr.onclick = function () {
        var r = reps.filter(function (x) { return x.month === tr.dataset.m; })[0]; if (!r) return;
        var set = function (id, val) { document.getElementById(id).value = val == null ? "" : val; };
        set("r-month", r.month); set("r-clicks", r.clicks); set("r-orders", r.orders); set("r-cancels", r.cancels); set("r-gmv", r.gmv); set("r-comm", r.commission); set("r-memo", r.memo);
        document.getElementById("r-month").scrollIntoView({ behavior: "smooth", block: "center" });
      }; });
      main.querySelectorAll("[data-hide]").forEach(function (b) { b.onclick = function (e) {
        e.stopPropagation();
        api("mall/hide", { body: { pid: b.dataset.hide, hidden: b.dataset.on === "1" } }).then(function (j) { if (j.ok) { toast(b.dataset.on === "1" ? "숨겼습니다. 5분 안에 바른혈압몰에 반영됩니다." : "다시 보이게 했습니다."); reload(); } else toast(errMsg(j), true); });
      }; });
      main.querySelectorAll("tr[data-id]").forEach(function (tr) { tr.onclick = function () { openMallItem((m.items || []).filter(function (x) { return String(x.id) === tr.dataset.id; })[0], reload); }; });
    });
  }
  function openMallItem(it, done) {
    it = it || {};
    var body = '<div class="callout" style="margin-bottom:12px">쿠팡 파트너스에서 <b>링크 생성 → 상품 검색 → 링크 생성</b>을 누르면 나오는 <b>단축 URL</b>(https://link.coupang.com/a/…)을 붙여 넣으세요. 사진 주소는 같은 화면의 상품 사진에서 마우스 오른쪽 → ‘이미지 주소 복사’로 가져옵니다.</div>' +
      '<div class="row2"><div class="field"><label>분류</label><select data-cat>' + MALL_CATS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === it.cat ? " selected" : "") + ">" + c[1] + "</option>"; }).join("") + '</select></div><div class="field"><label>쿠팡 상품번호 (선택)</label><input data-pid inputmode="numeric" placeholder="예: 7054527545" value="' + esc(it.pid && /^\d+$/.test(it.pid) ? it.pid : "") + '"' + (it.id ? " disabled" : "") + '><div class="hint">넣어 두면 통계에서 상품을 구분하기 쉽습니다.</div></div></div>' +
      '<div class="field" style="margin-top:10px"><label>상품 이름 (사이트에 보일 이름)</label><input data-name maxlength="60" value="' + esc(it.name || "") + '"></div>' +
      '<div class="field" style="margin-top:10px"><label>쿠팡 파트너스 링크</label><input data-url placeholder="https://link.coupang.com/a/..." value="' + esc(it.url || "") + '"></div>' +
      '<div class="field" style="margin-top:10px"><label>사진 주소</label><input data-img placeholder="https://thumbnail...coupangcdn.com/..." value="' + esc(it.img || "") + '"><div data-pv style="margin-top:8px"></div></div>' +
      '<div class="field" style="margin-top:10px"><label>설명 (한두 문장, 효능·순위 표현 없이)</label><textarea data-note maxlength="200">' + esc(it.note || "") + "</textarea></div>" +
      '<div class="row2" style="margin-top:10px"><div class="field"><label>정렬 (클수록 앞)</label><input data-sort type="number" value="' + (it.sort || 0) + '"></div><div class="field"><label>상태</label><select data-st><option value="visible"' + (it.status !== "hidden" ? " selected" : "") + '>공개</option><option value="hidden"' + (it.status === "hidden" ? " selected" : "") + ">숨김</option></select></div></div>";
    var d = openDrawer(it.id ? "상품 수정" : "상품 추가", body, (it.id ? '<div class="left"><button class="btn btn-d btn-sm" data-del>삭제</button></div>' : "") + '<button class="btn btn-p" data-save>' + (it.id ? "저장" : "추가") + "</button>");
    var img = d.querySelector("[data-img]"), pv = d.querySelector("[data-pv]");
    var show = function () { var u = img.value.trim(); pv.innerHTML = /^https:\/\/[a-z0-9.-]+\.coupangcdn\.com\//.test(u) ? '<img src="' + esc(u) + '" alt="미리보기" width="120" height="120" referrerpolicy="no-referrer" style="border-radius:8px;object-fit:contain;background:#f3f5f8">' : (u ? '<span class="muted small">쿠팡 이미지 주소(…coupangcdn.com)만 쓸 수 있습니다.</span>' : ""); };
    img.oninput = show; show();
    d.querySelector("[data-save]").onclick = function () {
      var q2 = function (s2) { return d.querySelector(s2).value; };
      api("mall/item", { body: { id: it.id || 0, cat: q2("[data-cat]"), pid: q2("[data-pid]"), name: q2("[data-name]"), url: q2("[data-url]").trim(), img: q2("[data-img]").trim(), note: q2("[data-note]"), sort: q2("[data-sort]"), status: q2("[data-st]") } })
        .then(function (j) { if (j.ok) { toast("저장했습니다. 5분 안에 바른혈압몰에 반영됩니다."); closeDrawer(); done(); } else toast(errMsg(j), true); });
    };
    var del = d.querySelector("[data-del]");
    if (del) del.onclick = function () { confirmBox("상품을 삭제할까요?", "<p>바른혈압몰에서 사라집니다. 지난 클릭 기록은 남습니다.</p>", "삭제", true).then(function (ok) { if (ok) api("mall/item/delete", { body: { id: it.id } }).then(function (j) { if (j.ok) { toast("삭제했습니다."); closeDrawer(); done(); } else toast(errMsg(j), true); }); }); };
  }

  // ============================================================ 시작
  api("me").then(function (j) {
    if (j.ok) { S.me = { role: j.role, name: j.name, reviewer_enabled: j.reviewer_enabled }; shell(); loadContent().then(route); api("dashboard").then(function (d) { if (d.ok) setBadges(d.counts); }); }
    else if (j.error === "not_configured") renderLogin(setupHtml("db"));
    else renderLogin();
  }).catch(function () {});
})();
