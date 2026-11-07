(function () {
  var tree = document.querySelector('.project-tree');
  if (!tree) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CELL = 8, PAD = 48, STEP = 4;

  function phosphor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--phosphor').trim() || '#3ddc4a';
  }

  // Retro 2D pixel explosion drawn over the panel. mode: 'open' reveals the panel, 'close' hides it.
  function burst(wrap, panel, mode, done) {
    var w = panel.offsetWidth, h = panel.offsetHeight;
    var cv = document.createElement('canvas');
    cv.className = 'pixel-fx';
    cv.width = w + PAD * 2;
    cv.height = h + PAD * 2;
    cv.style.left = -PAD + 'px';
    cv.style.top = -PAD + 'px';
    wrap.appendChild(cv);
    var ctx = cv.getContext('2d');
    var color = phosphor();
    var cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
    var cx = cols / 2, cy = rows / 2, maxd = Math.hypot(cx, cy) || 1;
    var LIFE = 360, cells = [], end = 0, c, r;

    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var dx = (c - cx) / maxd, dy = (r - cy) / maxd, sp = 0.08 + Math.random() * 0.2;
        var cell = {
          x: c * CELL + PAD, y: r * CELL + PAD,
          vx: (dx + (Math.random() - 0.5) * 0.8) * sp,
          vy: (dy + (Math.random() - 0.5) * 0.8) * sp,
          a: 0, e: 0
        };
        if (mode === 'open') {
          cell.e = Math.hypot(dx, dy) * 180 + Math.random() * 100;
        } else {
          cell.a = Math.random() * 160;
          cell.e = 180 + Math.random() * 100;
        }
        if (cell.e > end) end = cell.e;
        cells.push(cell);
      }
    }
    end += LIFE;

    if (mode === 'close') wrap.style.height = h + 'px';
    var start = null, hidden = false;

    function frame(now) {
      if (start === null) start = now;
      var t = now - start;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = color;
      if (mode === 'close' && !hidden && t >= 170) {
        panel.style.visibility = 'hidden';
        hidden = true;
      }
      for (var i = 0; i < cells.length; i++) {
        var k = cells[i];
        if (t < k.a) continue;
        if (t < k.e) {
          ctx.fillRect(k.x, k.y, CELL, CELL);
        } else {
          var age = t - k.e;
          if (age >= LIFE) continue;
          var size = age < LIFE * 0.6 ? CELL : CELL / 2;
          ctx.globalAlpha = age < LIFE * 0.75 ? 1 : 0.5;
          var px = Math.round((k.x + k.vx * age) / STEP) * STEP;
          var py = Math.round((k.y + k.vy * age) / STEP) * STEP;
          ctx.fillRect(px, py, size, size);
          ctx.globalAlpha = 1;
        }
      }
      if (t < end) requestAnimationFrame(frame);
      else { cv.remove(); done(); }
    }

    // First frame is drawn synchronously so the panel never flashes uncovered.
    if (mode === 'open') {
      ctx.fillStyle = color;
      for (var j = 0; j < cells.length; j++) ctx.fillRect(cells[j].x, cells[j].y, CELL, CELL);
    }
    requestAnimationFrame(frame);
  }

  function setState(btn, open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.tree-marker').textContent = open ? '▾' : '▸';
  }

  function toggle(btn) {
    var wrap = document.getElementById(btn.getAttribute('aria-controls'));
    var panel = wrap.firstElementChild;
    if (wrap.dataset.busy) return;
    var open = btn.getAttribute('aria-expanded') === 'true';

    if (reduce) {
      wrap.hidden = open;
      setState(btn, !open);
      return;
    }

    wrap.dataset.busy = '1';
    setState(btn, !open);
    if (open) {
      burst(wrap, panel, 'close', function () {
        wrap.hidden = true;
        wrap.style.height = '';
        panel.style.visibility = '';
        delete wrap.dataset.busy;
      });
    } else {
      wrap.hidden = false;
      burst(wrap, panel, 'open', function () { delete wrap.dataset.busy; });
    }
  }

  tree.querySelectorAll('.tree-entry').forEach(function (btn) {
    btn.addEventListener('click', function () { toggle(btn); });
  });
})();
