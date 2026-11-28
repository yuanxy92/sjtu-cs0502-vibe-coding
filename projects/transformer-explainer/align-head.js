/* align-head.js：把注意力头面板里 Query 的每一行，对齐到注意力矩阵的对应行
 *
 * 为什么需要：上游把 6 个查询词按约 10.6px 的行距排成一列，而注意力矩阵的行距
 * 是 19px（矩阵大小随句子里的词数变化），于是「第 i 个查询词」和「矩阵第 i 行」
 * 在视觉上对不上，看起来像是整体偏了。
 *
 * 做法：用 transform 移动 Query 的每一格（不改布局、不影响面板其余排布），
 * 让每格的中心落到矩阵对应行圆点的中心上。矩阵尺寸、词数变化时都能自适应。
 *
 * 时机：上游画连线时读的是元素的实时位置，只要我们在它画线之前完成对齐，
 * 连线就会自动跟上；之后如果上游重画连线，位置也是对齐后的。
 */
(function () {
  var EPS = 0.5; // 小于这个像素差就不动，避免反复重排
  var applied = new WeakMap(); // 每个格子已经加过的偏移
  var stats = { runs: 0, moved: 0, ok: 0, started: 0, ready: document.readyState };
  window.__alignHead = stats;

  function alignOnce() {
    stats.runs++;
    var blocks = document.querySelectorAll('.head-block');
    var moved = 0;

    Array.prototype.forEach.call(blocks, function (hb) {
      var column = hb.querySelector('.column.query');
      if (!column) return;
      var cells = column.querySelectorAll('.cell');
      if (!cells.length) return;

      // 找到与词数一致的、可见的那个矩阵
      var centers = null;
      Array.prototype.forEach.call(hb.querySelectorAll('.attention-matrix'), function (m) {
        if (centers) return;
        var rows = m.querySelectorAll('g.g-row');
        if (rows.length !== cells.length) return;
        var svg = m.querySelector('svg');
        if (!svg) return;
        var box = svg.getBoundingClientRect();
        if (box.width < 10) return; // 隐藏的矩阵不算
        var list = [];
        Array.prototype.forEach.call(rows, function (row) {
          var dot = row.querySelector('circle.cell');
          if (!dot) { list.length = 0; return; }
          var b = dot.getBoundingClientRect();
          list.push(b.top + b.height / 2);
        });
        if (list.length === cells.length) centers = list;
      });
      if (!centers) return;

      var firstTop = null;
      Array.prototype.forEach.call(cells, function (cell, i) {
        var b = cell.getBoundingClientRect();
        var delta = centers[i] - (b.top + b.height / 2);
        // 已经加过的偏移要累加，否则每次重排都会把增量当绝对值，越漂越远
        var prev = applied.get(cell) || 0;
        var next = prev + delta;
        if (Math.abs(delta) < EPS && prev) return;
        applied.set(cell, next);
        cell.style.transform = 'translateY(' + next.toFixed(2) + 'px)';
        moved++;
        if (firstTop === null) firstTop = b.top + next;
      });

      // 标题「Query」也跟着第一行走，否则词挪走后标题会孤零零留在上面
      var title = column.querySelector('.title');
      if (title && firstTop !== null) {
        var colTop = column.getBoundingClientRect().top;
        var baseTop = parseFloat(getComputedStyle(title).top) || 0; // 上游给的 top:-1.7rem
        var want = firstTop - colTop - title.offsetHeight - 4 - baseTop;
        var cur = parseFloat(title.dataset.alignTop || 'NaN');
        if (!(Math.abs(want - cur) < EPS)) {
          title.dataset.alignTop = String(want);
          title.style.transform = 'translate(-50%, ' + want.toFixed(2) + 'px)';
        }
      }

      if (moved) stats.ok++;
    });

    stats.moved += moved;
    if (moved) requestRedraw();
    return moved;
  }

  // 上游把连线画在组件内部的 x() 里，而且是在我们移动元素之前画的，
  // 所以挪完位置要让它重画一次。我们在 bundle 里把 x() 暴露成了 window.__drawLinks。
  var lastRedraw = 0;
  function requestRedraw() {
    var now = Date.now();
    if (now - lastRedraw < 300) return;
    lastRedraw = now;
    if (typeof window.__drawLinks !== 'function') return;
    window.__drawLinks();
  }

  function schedule() {
    // 用 setTimeout 而不是 requestAnimationFrame：标签页在后台时 rAF 会被挂起，
    // 对齐就不会生效（讲堂大屏/切走的标签页都会踩到）。
    // 延迟 300ms：上游的转场动画期间 DOM 一直在变，等它安静下来再动手，
    // 免得跟动画抢位置、把动画搞乱。
    window.clearTimeout(schedule.timer);
    schedule.timer = window.setTimeout(alignOnce, 300);
  }

  function start() {
    stats.started++;
    var root = document.body;
    if (!root) return;
    var observer = new MutationObserver(function () { schedule(); });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    window.addEventListener('resize', schedule);
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
