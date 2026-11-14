/* 바른혈압 — 자유게시판 (목록 · 글쓰기 · 글 보기 · 댓글) */
(function () {
  "use strict";
  var U = window.BPUser, Save = window.BPSave, esc = window.bpEsc, IC = window.bpIcons;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var params = new URLSearchParams(location.search);
  var HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

  function when(iso) {
    var t = new Date(iso).getTime(), m = Math.round((Date.now() - t) / 60000);
    if (isNaN(t)) return "";
    if (m < 1) return "방금";
    if (m < 60) return m + "분 전";
    if (m < 60 * 24) return Math.round(m / 60) + "시간 전";
    if (m < 60 * 24 * 7) return Math.round(m / 1440) + "일 전";
    var d = new Date(t + 9 * 3600e3);
    return d.getUTCFullYear() + "." + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "." + ("0" + d.getUTCDate()).slice(-2);
  }
  // 본문은 글자 그대로 보여 준다. 이 사이트 안의 주소만 눌러서 이동할 수 있게 한다.
  function bodyHtml(s) {
    var h = esc(s);
    var origin = location.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return h.replace(new RegExp(origin + "(\\/[A-Za-z0-9\\-_\\/.#?=&;%]*)", "g"), function (m, p) { return '<a href="' + p + '">' + m + "</a>"; });
  }
  function catTag(c) { return '<span class="cat' + (c === "공지" ? " cat--notice" : "") + '">' + esc(c) + "</span>"; }
  function errBox(host, text) { host.innerHTML = '<div class="empty-box"><p>' + esc(text) + '</p><a class="btn btn--secondary btn--sm" href="/community/board/">게시판으로</a></div>'; }
  function dialog(html) {
    var bg = document.createElement("div"); bg.className = "dialog-bg";
    bg.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(bg);
    bg.addEventListener("click", function (e) { if (e.target === bg || e.target.closest("[data-close]")) bg.remove(); });
    return bg;
  }
  function confirmBox(title, text, okLabel) {
    return new Promise(function (resolve) {
      var d = dialog("<h3>" + esc(title) + "</h3><p>" + esc(text) + '</p><div class="acts"><button type="button" class="btn btn--secondary btn--sm" data-close>취소</button><button type="button" class="btn btn--primary btn--sm" data-ok>' + esc(okLabel) + "</button></div>");
      $("[data-ok]", d).addEventListener("click", function () { d.remove(); resolve(true); });
    });
  }
  function reportDialog(reasons, url) {
    var d = dialog("<h3>신고하기</h3><p class=\"fine\">운영 원칙에 맞지 않는 글을 알려 주세요. 신고 내용은 운영팀만 봅니다.</p>" +
      reasons.map(function (r, i) { return '<label class="r"><input type="radio" name="rr" value="' + esc(r) + '"' + (i === 0 ? " checked" : "") + "> " + esc(r) + "</label>"; }).join("") +
      '<textarea maxlength="300" placeholder="자세한 내용 (선택)"></textarea><div class="acts"><button type="button" class="btn btn--secondary btn--sm" data-close>취소</button><button type="button" class="btn btn--primary btn--sm" data-send>신고 보내기</button></div>');
    $("[data-send]", d).addEventListener("click", function () {
      var reason = $("input[name=rr]:checked", d).value, detail = $("textarea", d).value.trim();
      U.post(url, { reason: reason, detail: detail }).then(function (j) {
        d.remove();
        bpToast(j.ok ? (j.already ? "이미 신고한 글입니다." : "신고가 접수됐습니다. 운영팀이 확인합니다.") : j.message);
      });
    });
  }

  // ------------------------------------------------------------ 커뮤니티 홈: 최근 글
  var latest = $("#board-latest");
  if (latest) {
    U.get("board").then(function (j) {
      if (!j.ok || !j.items.length) { latest.innerHTML = '<li style="padding:14px 4px;color:var(--muted)">아직 올라온 글이 없습니다. 첫 글을 남겨 보세요.</li>'; return; }
      latest.innerHTML = j.items.slice(0, 6).map(function (p) {
        return '<li><a href="/community/board/post/?id=' + p.id + '">' + catTag(p.category) + "<b>" + esc(p.title) + (p.comments ? ' <span style="color:var(--blue);font-weight:700">' + p.comments + "</span>" : "") + "</b><span>" + esc(p.author) + " · " + when(p.created_at) + "</span></a></li>";
      }).join("");
    });
  }

  // ------------------------------------------------------------ 목록
  var listEl = $("#board-list");
  if (listEl) {
    var st = { cat: params.get("cat") || "", q: params.get("q") || "", sort: params.get("sort") || "", page: Math.max(1, parseInt(params.get("page") || "1", 10) || 1) };
    var chips = $("#board-cats"), search = $("#board-q"), sortSel = $("#board-sort"), pager = $("#board-pager"), count = $("#board-count");
    search.value = st.q; sortSel.value = st.sort;
    function sync() {
      var p = [];
      if (st.cat) p.push("cat=" + encodeURIComponent(st.cat));
      if (st.q) p.push("q=" + encodeURIComponent(st.q));
      if (st.sort) p.push("sort=" + st.sort);
      if (st.page > 1) p.push("page=" + st.page);
      try { history.replaceState(null, "", "/community/board/" + (p.length ? "?" + p.join("&") : "")); } catch (e) {}
      return p.join("&");
    }
    function load() {
      listEl.innerHTML = '<li style="padding:24px 8px;color:var(--muted)">불러오는 중…</li>';
      U.get("board" + (sync() ? "?" + sync() : "")).then(function (j) {
        if (!j.ok) {
          listEl.innerHTML = '<li style="padding:24px 8px;color:var(--muted)">' + (j.error === "not_configured" ? "게시판이 아직 준비되지 않았습니다." : "목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.") + "</li>";
          return;
        }
        if (!chips.dataset.done) {
          chips.dataset.done = "1";
          chips.innerHTML = [""].concat(j.categories).map(function (c) { return '<button type="button" data-cat="' + esc(c) + '" aria-pressed="' + (c === st.cat ? "true" : "false") + '">' + (c ? esc(c) : "전체") + "</button>"; }).join("");
          chips.addEventListener("click", function (e) {
            var b = e.target.closest("[data-cat]"); if (!b) return;
            st.cat = b.dataset.cat; st.page = 1;
            chips.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
            load();
          });
        }
        count.textContent = "글 " + j.total + "개";
        if (!j.items.length) {
          listEl.innerHTML = '<li><div class="empty-box" style="border:0"><p>' + (st.q || st.cat ? "조건에 맞는 글이 없습니다." : "아직 올라온 글이 없습니다. 첫 글을 남겨 보세요.") + '</p><a class="btn btn--primary btn--sm" href="/community/board/write/">글쓰기</a></div></li>';
          pager.innerHTML = ""; return;
        }
        listEl.innerHTML = j.items.map(function (p) {
          return '<li class="' + (p.pinned ? "pinned" : "") + '"><a href="/community/board/post/?id=' + p.id + '"><div class="bt">' + catTag(p.category) + "<b>" + esc(p.title) + "</b>" + (p.comments ? '<span class="cc">[' + p.comments + "]</span>" : "") + '</div><div class="ex">' + esc(p.excerpt) + '</div><div class="bm"><span>' + esc(p.author) + "</span><span>" + when(p.created_at) + "</span><span>조회 " + p.views + "</span><span>공감 " + p.likes + "</span></div></a></li>";
        }).join("");
        var pages = Math.ceil(j.total / j.size), from = Math.max(1, st.page - 2), to = Math.min(pages, from + 4), html = "";
        if (pages > 1) {
          html += '<button type="button" data-p="' + (st.page - 1) + '"' + (st.page <= 1 ? " disabled" : "") + ">이전</button>";
          for (var i = from; i <= to; i++) html += '<button type="button" data-p="' + i + '"' + (i === st.page ? ' aria-current="page"' : "") + ">" + i + "</button>";
          html += '<button type="button" data-p="' + (st.page + 1) + '"' + (st.page >= pages ? " disabled" : "") + ">다음</button>";
        }
        pager.innerHTML = html;
      });
    }
    pager.addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b || b.disabled) return; st.page = parseInt(b.dataset.p, 10); load(); window.scrollTo(0, listEl.getBoundingClientRect().top + window.scrollY - 140); });
    $("#board-search").addEventListener("submit", function (e) { e.preventDefault(); st.q = search.value.trim(); st.page = 1; load(); });
    sortSel.addEventListener("change", function () { st.sort = sortSel.value; st.page = 1; load(); });
    load();
  }

  // ------------------------------------------------------------ 글쓰기 · 수정
  var wf = $("#write-form");
  if (wf) {
    var editId = parseInt(params.get("id") || "0", 10) || 0, box = $("#write-box");
    var draftKey = "bp_board_draft";
    U.me().then(function (user) {
      if (!user) { location.replace("/account/login/?next=" + encodeURIComponent(location.pathname + location.search)); return; }
      if (user.status !== "active") { errBox(box, "이용이 제한된 계정이라 글을 쓸 수 없습니다."); return; }
      $("#write-loading").hidden = true; wf.hidden = false;
      if (editId) {
        $("#write-title").textContent = "글 고치기";
        wf.querySelector("[type=submit]").textContent = "수정 저장";
        U.get("board/" + editId).then(function (j) {
          if (!j.ok || !j.post.mine) { errBox(box, j.ok ? "본인이 쓴 글만 고칠 수 있습니다." : j.message); return; }
          wf.category.value = j.post.category; wf.title.value = j.post.title; wf.body.value = j.post.body; counter();
        });
      } else {
        try { var d = JSON.parse(localStorage.getItem(draftKey) || "null"); if (d) { wf.category.value = d.c || wf.category.value; wf.title.value = d.t || ""; wf.body.value = d.b || ""; if (d.t || d.b) bpToast("쓰던 글을 불러왔습니다."); } } catch (e) {}
      }
      counter();
    });
    function counter() { $("#write-count").textContent = wf.body.value.length + " / 5,000자"; }
    wf.body.addEventListener("input", function () {
      counter();
      if (!editId) { try { localStorage.setItem(draftKey, JSON.stringify({ c: wf.category.value, t: wf.title.value, b: wf.body.value })); } catch (e) {} }
    });
    wf.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = $(".form-msg", wf), show = function (t) { m.className = "form-msg err"; m.textContent = t; };
      if (wf.title.value.trim().length < 2) { show("제목을 2자 이상 입력해 주세요."); return; }
      if (wf.body.value.trim().length < 5) { show("내용을 5자 이상 입력해 주세요."); return; }
      if (!wf.agree.checked) { show("게시판 이용 원칙을 확인하고 체크해 주세요."); return; }
      var b = wf.querySelector("[type=submit]"); b.disabled = true;
      U.post(editId ? "board/" + editId : "board", { category: wf.category.value, title: wf.title.value.trim(), body: wf.body.value }).then(function (j) {
        b.disabled = false;
        if (!j.ok) { show(j.message); return; }
        try { localStorage.removeItem(draftKey); } catch (er) {}
        location.href = "/community/board/post/?id=" + j.id;
      });
    });
  }

  // ------------------------------------------------------------ 글 보기
  var view = $("#post-view");
  if (view) {
    var id = parseInt(params.get("id") || "0", 10) || 0;
    if (!id) { errBox(view, "글 주소가 올바르지 않습니다."); return; }
    var data = null;
    function draw() {
      var p = data.post, me = data.viewer;
      document.title = p.title + " | 자유게시판 | 바른혈압";
      var html = '<article class="post">' + catTag(p.category) + "<h1>" + esc(p.title) + '</h1><div class="pm"><b>' + esc(p.author) + (p.staff ? ' <span class="cat cat--notice">운영팀</span>' : "") + "</b><span>" + when(p.created_at) + (p.updated_at ? " (수정됨)" : "") + "</span><span>조회 " + p.views + "</span></div>" +
        (p.status === "hidden" ? '<div class="caution" style="margin:16px 0 0"><b>숨김 처리된 글</b> — 지금은 다른 사람에게 보이지 않습니다. 사유: ' + esc(p.hidden_reason || "운영 원칙 위반") + ". 이의가 있으면 spaceblank0100@gmail.com 으로 알려 주세요.</div>" : "") +
        '<div class="pb">' + bodyHtml(p.body) + '</div><div class="pa" id="post-acts"><button type="button" class="act-btn" id="like-btn" aria-pressed="' + (p.liked ? "true" : "false") + '">' + HEART + '공감 <span class="n">' + p.likes + '</span></button><span id="post-save"></span><span class="sp"></span>' +
        (p.mine ? '<a class="link-btn" href="/community/board/write/?id=' + p.id + '">고치기</a><button type="button" class="link-btn" id="del-btn">지우기</button>' : (p.staff ? "" : '<button type="button" class="link-btn" id="report-btn">신고</button>')) +
        '</div></article><section class="comments"><h2>댓글 <span id="c-count">' + data.comments.filter(function (c) { return !c.hidden; }).length + '</span></h2><ul class="comment-list" id="c-list">' + data.comments.map(commentHtml).join("") + "</ul>" +
        (me ? (me.status === "active" ? '<form class="form" id="c-form"><div class="field"><label for="c-body">' + esc(me.nickname) + ' 님의 댓글</label><textarea id="c-body" maxlength="1000" style="min-height:90px" placeholder="경험과 생각을 나눠 주세요. 약을 시작·중단하라는 조언, 개인 연락처, 홍보는 올리지 않습니다."></textarea></div><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span class="fine">개인의 약 조정·진단은 의료진과 상의할 영역입니다.</span><button class="btn btn--primary btn--sm" type="submit">댓글 남기기</button></div><div class="form-msg" role="status"></div></form>' : '<div class="notice-soft">이용이 제한된 계정이라 댓글을 쓸 수 없습니다.</div>')
          : '<div class="notice-soft">댓글을 쓰려면 <a href="' + esc(U.loginUrl()) + '"><b>로그인</b></a>해 주세요. 아직 회원이 아니라면 <a href="/account/signup/?next=' + encodeURIComponent(location.pathname + location.search) + '">가입</a>은 1분이면 됩니다.</div>') +
        '</section><p style="margin-top:24px"><a class="btn btn--secondary btn--sm" href="/community/board/">목록으로</a></p>';
      view.innerHTML = html;
      bind();
    }
    function commentHtml(c) {
      if (c.hidden) return '<li><span class="gone">운영 원칙에 따라 숨김 처리된 댓글입니다.</span></li>';
      return '<li data-c="' + c.id + '"><div class="ch"><b>' + esc(c.author) + "</b>" + (c.op ? '<span class="op">글쓴이</span>' : "") + "<span>" + when(c.created_at) + '</span><span class="sp"></span>' + (c.mine ? '<button type="button" class="link-btn" data-cdel="' + c.id + '">지우기</button>' : (data.viewer ? '<button type="button" class="link-btn" data-crep="' + c.id + '">신고</button>' : "")) + '</div><div class="cb">' + bodyHtml(c.body) + "</div></li>";
    }
    function needLogin() { bpToast("로그인이 필요합니다."); setTimeout(function () { location.href = U.loginUrl(); }, 900); }
    function bind() {
      var p = data.post;
      // 저장·공유 버튼 (글 페이지와 같은 버튼을 쓴다)
      if (p.saved && !Save.has("post:" + p.id)) Save.put("post:" + p.id, p.title);
      if (!p.saved && data.viewer && Save.has("post:" + p.id)) Save.drop("post:" + p.id);
      window.bpActions($("#post-save"), "post:" + p.id, p.title, { url: location.origin + "/community/board/post/?id=" + p.id });
      $("#like-btn").addEventListener("click", function () {
        if (!data.viewer) { needLogin(); return; }
        var b = this; b.disabled = true;
        U.post("board/" + p.id + "/like", {}).then(function (j) {
          b.disabled = false;
          if (!j.ok) { bpToast(j.message); return; }
          b.setAttribute("aria-pressed", j.liked ? "true" : "false"); $(".n", b).textContent = j.likes;
        });
      });
      var del = $("#del-btn");
      if (del) del.addEventListener("click", function () {
        confirmBox("글을 지울까요?", "지운 글은 되돌릴 수 없습니다. 달린 댓글도 함께 보이지 않게 됩니다.", "지우기").then(function () {
          U.post("board/" + p.id + "/delete", {}).then(function (j) { if (j.ok) { bpToast("글을 지웠습니다."); setTimeout(function () { location.href = "/community/board/"; }, 700); } else bpToast(j.message); });
        });
      });
      var rep = $("#report-btn");
      if (rep) rep.addEventListener("click", function () { if (!data.viewer) { needLogin(); return; } reportDialog(data.reasons, "board/" + p.id + "/report"); });
      $("#c-list").addEventListener("click", function (e) {
        var d = e.target.closest("[data-cdel]"), r = e.target.closest("[data-crep]");
        if (d) confirmBox("댓글을 지울까요?", "지운 댓글은 되돌릴 수 없습니다.", "지우기").then(function () {
          U.post("board/comment/" + d.dataset.cdel + "/delete", {}).then(function (j) {
            if (!j.ok) { bpToast(j.message); return; }
            var li = d.closest("li"); li.remove(); $("#c-count").textContent = Math.max(0, parseInt($("#c-count").textContent, 10) - 1);
          });
        });
        if (r) reportDialog(data.reasons, "board/comment/" + r.dataset.crep + "/report");
      });
      var cf = $("#c-form");
      if (cf) cf.addEventListener("submit", function (e) {
        e.preventDefault();
        var ta = $("#c-body"), m = $(".form-msg", cf), b = cf.querySelector("[type=submit]");
        if (ta.value.trim().length < 2) { m.className = "form-msg err"; m.textContent = "댓글을 2자 이상 입력해 주세요."; return; }
        b.disabled = true;
        U.post("board/" + p.id + "/comment", { body: ta.value }).then(function (j) {
          b.disabled = false;
          if (!j.ok) { m.className = "form-msg err"; m.textContent = j.message; return; }
          m.className = "form-msg"; ta.value = "";
          data.comments.push(j.comment);
          $("#c-list").insertAdjacentHTML("beforeend", commentHtml(j.comment));
          $("#c-count").textContent = parseInt($("#c-count").textContent, 10) + 1;
        });
      });
    }
    U.get("board/" + id).then(function (j) {
      if (!j.ok) { errBox(view, j.message || (j.error === "not_configured" ? "게시판이 아직 준비되지 않았습니다." : "글을 불러오지 못했습니다.")); return; }
      data = j;
      if (j.viewer) U.setHint({ nickname: j.viewer.nickname });
      draw();
    });
  }
})();
