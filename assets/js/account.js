/* 바른혈압 — 가입 · 로그인 · 비밀번호 재설정 · 마이페이지 */
(function () {
  "use strict";
  var U = window.BPUser, Save = window.BPSave, esc = window.bpEsc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var params = new URLSearchParams(location.search);
  function nextUrl() {
    var n = params.get("next") || "";
    return /^\/(?!\/)[A-Za-z0-9\-_\/.?=&%#]*$/.test(n) && n.indexOf("/account/") !== 0 ? n : "/my/";
  }
  function msg(form, kind, html) {
    var el = $(".form-msg", form); if (!el) return;
    el.className = "form-msg " + (kind || ""); el.innerHTML = html || "";
  }
  function busy(form, on, label) {
    var b = $("[type=submit]", form); if (!b) return;
    if (on) { b.dataset.l = b.textContent; b.textContent = label || "처리 중…"; b.disabled = true; }
    else { b.textContent = b.dataset.l || b.textContent; b.disabled = false; }
  }
  function unsupported(form) { msg(form, "err", "이 브라우저에서는 보안 기능을 쓸 수 없어 진행할 수 없습니다. 최신 크롬·사파리·엣지에서 다시 시도해 주세요."); }
  var WEAK = ["12345678", "123456789", "1234567890", "password", "qwer1234", "qwerty123", "11111111", "00000000", "abcd1234", "asdf1234", "1q2w3e4r", "iloveyou"];
  function pwError(pw, username) {
    if (pw.length < 8) return "비밀번호는 8자 이상으로 정해 주세요.";
    if (WEAK.indexOf(pw.toLowerCase()) > -1 || /^(.)\1+$/.test(pw)) return "너무 쉬운 비밀번호입니다. 다른 비밀번호를 정해 주세요.";
    if (username && pw.toLowerCase() === username.toLowerCase()) return "아이디와 같은 비밀번호는 쓸 수 없습니다.";
    return "";
  }
  function showCode(host, code, username, after) {
    host.innerHTML = '<div class="card stack"><h2 style="margin:0">복구 코드를 보관해 주세요</h2>' +
      '<p style="margin:0">비밀번호를 잊었을 때 <b>이 코드로 직접 비밀번호를 다시 정할 수 있습니다.</b> 지금 한 번만 보여 드리니, 사진을 찍거나 적어서 보관해 주세요.</p>' +
      '<div class="code-box" id="rc">' + esc(code) + "</div>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn--secondary btn--sm" id="rc-copy">코드 복사</button><button type="button" class="btn btn--secondary btn--sm" id="rc-file">파일로 저장</button></div>' +
      '<p class="fine" style="margin:0">코드를 잃어버렸고 비밀번호도 기억나지 않으면, 가입 때 등록한 이메일로 운영팀에 요청해 임시 비밀번호를 받을 수 있습니다. 이메일을 등록하지 않았다면 본인 확인이 어려울 수 있습니다.</p>' +
      '<a class="btn btn--primary" id="rc-go" href="' + esc(after) + '">보관했습니다. 계속하기</a></div>';
    $("#rc-copy").onclick = function () { navigator.clipboard && navigator.clipboard.writeText(code).then(function () { bpToast("복구 코드를 복사했습니다."); }); };
    $("#rc-file").onclick = function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["바른혈압 복구 코드\n아이디: " + username + "\n복구 코드: " + code + "\n\n비밀번호를 잊었을 때 " + location.origin + "/account/reset/ 에서 사용합니다.\n다른 사람에게 보여 주지 마세요.\n"], { type: "text/plain;charset=utf-8" }));
      a.download = "바른혈압_복구코드.txt"; document.body.appendChild(a); a.click(); a.remove();
    };
    window.scrollTo(0, 0);
  }
  function afterLogin(user) {
    U.setHint(user);
    return Save.syncUp().catch(function () {});
  }

  // ------------------------------------------------------------ 로그인
  var loginForm = $("#login-form");
  if (loginForm) {
    U.me().then(function (u) { if (u) location.replace(nextUrl()); });
    if (params.get("joined")) msg(loginForm, "ok", "가입이 완료됐습니다. 로그인해 주세요.");
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var username = loginForm.username.value.trim().toLowerCase(), pw = loginForm.password.value;
      if (!username || !pw) { msg(loginForm, "err", "아이디와 비밀번호를 입력해 주세요."); return; }
      busy(loginForm, true, "확인 중…");
      U.derive(username, pw).then(function (proof) { return U.post("auth/login", { username: username, proof: proof }); }).then(function (j) {
        if (!j.ok) { busy(loginForm, false); msg(loginForm, "err", esc(j.message)); return; }
        return afterLogin(j.user).then(function () { location.replace(j.user.must_change_pw ? "/my/?tab=account&temp=1" : nextUrl()); });
      }).catch(function () { busy(loginForm, false); unsupported(loginForm); });
    });
  }

  // ------------------------------------------------------------ 가입
  var signForm = $("#signup-form");
  if (signForm) {
    U.me().then(function (u) { if (u) location.replace("/my/"); });
    var all = $("#agree-all"), boxes = signForm.querySelectorAll(".consent input[data-c]");
    all.addEventListener("change", function () { boxes.forEach(function (b) { b.checked = all.checked; }); });
    boxes.forEach(function (b) { b.addEventListener("change", function () { all.checked = Array.prototype.every.call(boxes, function (x) { return x.checked; }); }); });
    var timers = {};
    function liveCheck(field, param) {
      var input = signForm[field], hint = $('[data-hint="' + field + '"]');
      input.addEventListener("input", function () {
        clearTimeout(timers[field]);
        var v = input.value.trim(); if (field === "username") v = v.toLowerCase();
        if (!v) { hint.className = "hint"; hint.textContent = hint.dataset.d; return; }
        timers[field] = setTimeout(function () {
          U.get("auth/check?" + param + "=" + encodeURIComponent(v)).then(function (j) {
            if (!j.ok || input.value.trim().toLowerCase() !== v.toLowerCase()) return;
            var m = j[param];
            hint.className = "hint " + (m ? "err" : "ok"); hint.textContent = m || "사용할 수 있습니다.";
          });
        }, 350);
      });
    }
    liveCheck("username", "username"); liveCheck("nickname", "nickname");
    signForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = signForm, username = f.username.value.trim().toLowerCase(), pw = f.password.value, nickname = f.nickname.value.trim(), email = f.email.value.trim();
      if (f.website.value) return;
      if (!/^[a-z][a-z0-9_]{3,19}$/.test(username)) { msg(f, "err", "아이디는 영문 소문자로 시작하는 4~20자(영문 소문자·숫자·밑줄)로 정해 주세요."); f.username.focus(); return; }
      var pe = pwError(pw, username);
      if (pe) { msg(f, "err", pe); f.password.focus(); return; }
      if (pw !== f.password2.value) { msg(f, "err", "비밀번호 확인이 일치하지 않습니다."); f.password2.focus(); return; }
      if (!nickname) { msg(f, "err", "닉네임을 입력해 주세요."); f.nickname.focus(); return; }
      if (!f.age14.checked || !f.agree_terms.checked || !f.agree_privacy.checked) { msg(f, "err", "필수 항목에 동의해 주세요."); return; }
      if (f.newsletter.checked && !email) { msg(f, "err", "주간 혈압 레터를 받으려면 이메일을 입력해 주세요."); f.email.focus(); return; }
      busy(f, true, "가입 처리 중…");
      U.derive(username, pw).then(function (proof) {
        return U.post("auth/signup", { username: username, nickname: nickname, email: email, proof: proof, age14: true, agree_terms: true, agree_privacy: true, newsletter: f.newsletter.checked });
      }).then(function (j) {
        if (!j.ok) { busy(f, false); msg(f, "err", esc(j.message)); return; }
        afterLogin(j.user).then(function () { showCode($("#signup-box"), j.recovery_code, username, nextUrl()); });
      }).catch(function () { busy(f, false); unsupported(f); });
    });
  }

  // ------------------------------------------------------------ 비밀번호 재설정 (복구 코드)
  var resetForm = $("#reset-form");
  if (resetForm) {
    resetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = resetForm, username = f.username.value.trim().toLowerCase(), pw = f.password.value;
      var pe = pwError(pw, username);
      if (!username || !f.code.value.trim()) { msg(f, "err", "아이디와 복구 코드를 입력해 주세요."); return; }
      if (pe) { msg(f, "err", pe); return; }
      if (pw !== f.password2.value) { msg(f, "err", "비밀번호 확인이 일치하지 않습니다."); return; }
      busy(f, true);
      U.derive(username, pw).then(function (proof) { return U.post("auth/reset", { username: username, code: f.code.value, proof: proof }); }).then(function (j) {
        if (!j.ok) { busy(f, false); msg(f, "err", esc(j.message)); return; }
        afterLogin(j.user).then(function () { showCode($("#reset-box"), j.recovery_code, username, "/my/"); bpToast("비밀번호를 바꿨습니다. 새 복구 코드를 보관해 주세요."); });
      }).catch(function () { busy(f, false); unsupported(f); });
    });
  }

  // ------------------------------------------------------------ 마이페이지
  var my = $("#my");
  if (!my) return;
  var TYPE = { info: "건강정보", food: "음식·식단", factcheck: "팩트체크", recipe: "레시피", guide: "안내·도구", policy: "정책", post: "자유게시판" };
  var cmap = {};
  function date(iso) { return (iso || "").slice(0, 10).replace(/-/g, "."); }
  function tab(name) {
    my.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.tab === name ? "true" : "false"); });
    my.querySelectorAll(".my-panel").forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    try { history.replaceState(null, "", "/my/?tab=" + name); } catch (e) {}
  }
  my.querySelectorAll("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { tab(b.dataset.tab); }); });

  function drawSaved() {
    var list = Save.list(), box = $("#saved-list");
    if (!list.length) {
      box.innerHTML = '<div class="empty-box"><p>아직 저장한 글이 없습니다. 글 위쪽의 ‘저장’ 버튼을 누르면 여기에 모입니다.</p><a class="btn btn--secondary btn--sm" href="/info/">건강정보 둘러보기</a></div>';
      return;
    }
    box.innerHTML = '<ul class="my-list">' + list.map(function (x) {
      var isPost = x.k.indexOf("post:") === 0, c = cmap[x.k];
      var href = isPost ? "/community/board/post/?id=" + x.k.slice(5) : x.k;
      var title = (c && c.t) || x.t || (isPost ? "(삭제되었거나 숨김 처리된 글)" : x.k);
      var kind = isPost ? TYPE.post : (c ? TYPE[c.k] || "" : "");
      return '<li><div><a class="t" href="' + esc(href) + '">' + esc(title) + '</a><div class="m">' + esc(kind) + (kind ? " · " : "") + date(x.at) + ' 저장</div></div><button type="button" class="link-btn" data-unsave="' + esc(x.k) + '">저장 취소</button></li>';
    }).join("") + "</ul>";
    box.querySelectorAll("[data-unsave]").forEach(function (b) {
      b.addEventListener("click", function () { Save.toggle(b.dataset.unsave, "").then(function () { drawSaved(); bpToast("저장을 취소했습니다."); }); });
    });
  }
  function drawMine() {
    var box = $("#mine-list");
    U.get("board/mine").then(function (j) {
      if (!j.ok) { box.innerHTML = '<div class="empty-box"><p>목록을 불러오지 못했습니다.</p></div>'; return; }
      var st = function (s) { return s === "hidden" ? '<span class="st">숨김 처리됨</span>' : ""; };
      var posts = j.posts.map(function (p) { return '<li><div><a class="t" href="/community/board/post/?id=' + p.id + '">' + esc(p.title) + "</a>" + st(p.status) + '<div class="m">' + esc(p.category) + " · " + date(p.created_at) + " · 조회 " + p.views + " · 공감 " + p.likes + " · 댓글 " + p.comments + "</div></div></li>"; }).join("");
      var comments = j.comments.map(function (c) { return '<li><div><a class="t" href="/community/board/post/?id=' + c.post_id + '">' + esc(c.body) + "</a>" + st(c.status) + '<div class="m">' + esc(c.post_title || "삭제된 글") + " · " + date(c.created_at) + "</div></div></li>"; }).join("");
      box.innerHTML = "<h3>내가 쓴 글 " + j.posts.length + "</h3>" + (posts ? '<ul class="my-list">' + posts + "</ul>" : '<div class="empty-box"><p>아직 쓴 글이 없습니다.</p><a class="btn btn--secondary btn--sm" href="/community/board/write/">첫 글 쓰기</a></div>') +
        '<h3 style="margin-top:28px">내가 쓴 댓글 ' + j.comments.length + "</h3>" + (comments ? '<ul class="my-list">' + comments + "</ul>" : '<div class="empty-box"><p>아직 쓴 댓글이 없습니다.</p></div>');
    });
  }

  fetch("/content-index.json").then(function (r) { return r.json(); }).then(function (l) { l.forEach(function (c) { cmap[c.p] = c; }); }).catch(function () {}).then(function () {
    return U.me();
  }).then(function (user) {
    $("#my-loading").hidden = true;
    if (!user) {
      // 로그인 전: 이 기기에 저장한 글만 보여 준다
      $("#my-guest").hidden = false;
      $("#my-guest-login").href = "/account/login/?next=/my/";
      my.querySelectorAll('[data-tab="mine"],[data-tab="account"]').forEach(function (b) { b.hidden = true; });
      tab("saved"); drawSaved();
      return;
    }
    $("#my-user").hidden = false;
    $("#my-nick").textContent = user.nickname;
    $("#my-id").textContent = user.username + " · " + date(user.created_at) + " 가입";
    if (user.status === "suspended") $("#my-suspended").hidden = false;
    var pf = $("#profile-form"); pf.nickname.value = user.nickname; pf.email.value = user.email || "";
    var want = params.get("tab");
    tab(want === "mine" || want === "account" ? want : "saved");
    if (params.get("temp") || user.must_change_pw) { $("#temp-note").hidden = false; tab("account"); }
    Save.refresh().then(drawSaved);
    drawMine();

    pf.addEventListener("submit", function (e) {
      e.preventDefault(); busy(pf, true);
      U.post("auth/profile", { nickname: pf.nickname.value.trim(), email: pf.email.value.trim() }).then(function (j) {
        busy(pf, false);
        if (!j.ok) { msg(pf, "err", esc(j.message)); return; }
        U.setHint(j.user); $("#my-nick").textContent = j.user.nickname; msg(pf, "ok", "저장했습니다.");
      });
    });
    var pw = $("#password-form");
    pw.addEventListener("submit", function (e) {
      e.preventDefault();
      var pe = pwError(pw.next.value, user.username);
      if (pe) { msg(pw, "err", pe); return; }
      if (pw.next.value !== pw.next2.value) { msg(pw, "err", "새 비밀번호 확인이 일치하지 않습니다."); return; }
      busy(pw, true);
      Promise.all([U.derive(user.username, pw.current.value), U.derive(user.username, pw.next.value)]).then(function (p) {
        return U.post("auth/password", { current: p[0], next: p[1] });
      }).then(function (j) {
        busy(pw, false);
        if (!j.ok) { msg(pw, "err", esc(j.message)); return; }
        pw.reset(); $("#temp-note").hidden = true; msg(pw, "ok", "비밀번호를 바꿨습니다. 다른 기기에서는 다시 로그인해야 합니다.");
      }).catch(function () { busy(pw, false); unsupported(pw); });
    });
    var rc = $("#recovery-form");
    rc.addEventListener("submit", function (e) {
      e.preventDefault(); busy(rc, true);
      U.derive(user.username, rc.current.value).then(function (p) { return U.post("auth/recovery", { current: p }); }).then(function (j) {
        busy(rc, false);
        if (!j.ok) { msg(rc, "err", esc(j.message)); return; }
        rc.reset(); msg(rc, "ok", '새 복구 코드입니다. 이전 코드는 더 이상 쓸 수 없습니다.<div class="code-box" style="margin-top:10px">' + esc(j.recovery_code) + "</div>");
      }).catch(function () { busy(rc, false); unsupported(rc); });
    });
    $("#logout-btn").addEventListener("click", function () {
      U.post("auth/logout", {}).then(function () {
        U.setHint(null); try { localStorage.removeItem("bp_saved"); } catch (e) {}
        location.href = "/";
      });
    });
    var wd = $("#withdraw-form");
    wd.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!wd.sure.checked) { msg(wd, "err", "안내를 확인하고 체크해 주세요."); return; }
      busy(wd, true);
      U.derive(user.username, wd.current.value).then(function (p) { return U.post("auth/withdraw", { current: p, delete_posts: wd.delete_posts.checked }); }).then(function (j) {
        busy(wd, false);
        if (!j.ok) { msg(wd, "err", esc(j.message)); return; }
        U.setHint(null); try { localStorage.removeItem("bp_saved"); } catch (er) {}
        my.innerHTML = '<div class="empty-box"><p><b>탈퇴가 처리됐습니다.</b> 그동안 이용해 주셔서 고맙습니다.<br>이 기기에 남아 있는 혈압 기록은 그대로이며, 필요하면 <a href="/tools/backup/">기록 백업·복원</a>에서 지울 수 있습니다.</p><a class="btn btn--secondary btn--sm" href="/">홈으로</a></div>';
      }).catch(function () { busy(wd, false); unsupported(wd); });
    });
  });
})();
