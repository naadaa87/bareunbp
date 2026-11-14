/* 바른혈압 — 영상으로 배우기: 눌렀을 때만 유튜브 플레이어를 불러온다 */
(function () {
  "use strict";
  var esc = window.bpEsc;
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".video-thumb[data-yt]");
    if (!b) return;
    var id = b.dataset.yt;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    f.title = b.getAttribute("aria-label") || "영상";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    b.innerHTML = ""; b.appendChild(f); b.removeAttribute("data-yt"); b.style.cursor = "default";
    if (window.bpTrack) window.bpTrack("video_play");
  });

  // 썸네일을 못 불러오면 깨진 그림 대신 빈 배경을 보이고, 유튜브에서 내려간 영상(120px 대체 그림)은 카드를 숨긴다
  function watchThumbs(root) {
    root.querySelectorAll(".video-thumb img").forEach(function (im) {
      if (im.dataset.w) return;
      im.dataset.w = "1";
      var check = function () {
        if (!im.naturalWidth) im.classList.add("is-missing");
        else if (im.naturalWidth <= 120) { var c = im.closest(".video-card"); if (c) c.hidden = true; }
      };
      if (im.complete) check();
      im.addEventListener("load", check);
      im.addEventListener("error", function () { im.classList.add("is-missing"); });
    });
  }
  watchThumbs(document);

  // 운영자가 관리자 콘솔에서 추가한 영상
  var more = document.getElementById("video-more");
  if (!more) return;
  fetch("/api/videos").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j || !j.ok || !j.items.length) return;
    var have = {};
    document.querySelectorAll(".video-thumb[data-yt]").forEach(function (b) { have[b.dataset.yt] = 1; });
    var groups = {}, order = [];
    j.items.forEach(function (v) {
      if (have[v.youtube_id] || !/^[A-Za-z0-9_-]{11}$/.test(v.youtube_id)) return;
      var c = v.category || "더 보기";
      if (!groups[c]) { groups[c] = []; order.push(c); }
      groups[c].push(v);
    });
    more.innerHTML = order.map(function (c) {
      return "<h2>" + esc(c) + ' <span class="badge">추가 영상</span></h2><div class="video-grid">' + groups[c].map(function (v) {
        return '<div class="video-card"><button type="button" class="video-thumb" data-yt="' + v.youtube_id + '" aria-label="재생: ' + esc(v.title) + '"><img src="https://i.ytimg.com/vi/' + v.youtube_id + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="play"></span></button>' +
          '<div class="vb"><b>' + esc(v.title) + '</b><span class="vs">' + esc(v.source || "") + "</span>" + (v.note ? '<p class="vn">' + esc(v.note) + "</p>" : "") +
          '<a class="vl" href="https://www.youtube.com/watch?v=' + v.youtube_id + '" target="_blank" rel="noopener">유튜브에서 보기</a></div></div>';
      }).join("") + "</div>";
    }).join("");
    watchThumbs(more);
  }).catch(function () {});
})();
