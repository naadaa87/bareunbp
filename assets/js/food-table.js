/* 외식 나트륨표 — 검색·분류 필터 */
(function () {
  "use strict";
  var q = document.getElementById("dish-q"), tabs = document.querySelectorAll("#dish-cat button"), rows = document.querySelectorAll("#dish-table tbody tr");
  if (!q) return;
  var cat = "all";
  function apply() {
    var v = q.value.trim();
    rows.forEach(function (tr) {
      var okC = cat === "all" || tr.dataset.cat === cat;
      var okQ = !v || tr.cells[0].textContent.indexOf(v) > -1;
      tr.style.display = okC && okQ ? "" : "none";
    });
  }
  q.addEventListener("input", apply);
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      cat = b.dataset.cat;
      tabs.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      apply();
    });
  });
})();
