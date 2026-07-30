(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  var canvas = document.getElementById('writingCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  var MOUSE_RADIUS = 140;
  var mouse = { x: -9999, y: -9999, inCanvas: false };

  // Each line uses layered sine components to produce organic, non-repeating motion.
  // Irrational frequency ratios mean the combined curve never visibly loops.
  var lines = [
    {
      comps: [
        { f: 1.3, a: 12, t: 0.0, spd: 0.0026 },
        { f: 0.4, a:  8, t: 2.1, spd: 0.0015 },
        { f: 2.7, a:  4, t: 4.8, spd: 0.0038 },
      ],
      brass: true,  baseWidth: 1.8, baseOpacity: 1.00, widthT: 0.0,
    },
    {
      comps: [
        { f: 0.8, a: 10, t: 1.2, spd: 0.0022 },
        { f: 2.1, a:  6, t: 3.6, spd: 0.0031 },
      ],
      brass: false, baseWidth: 1.0, baseOpacity: 0.42, widthT: 2.4,
    },
    {
      comps: [
        { f: 1.7, a:  9, t: 0.5, spd: 0.0018 },
        { f: 3.2, a:  5, t: 5.2, spd: 0.0041 },
        { f: 0.6, a:  7, t: 2.8, spd: 0.0012 },
      ],
      brass: false, baseWidth: 1.0, baseOpacity: 0.36, widthT: 5.1,
    },
    {
      comps: [
        { f: 1.0, a: 11, t: 3.0, spd: 0.0024 },
        { f: 2.4, a:  5, t: 0.9, spd: 0.0033 },
      ],
      brass: false, baseWidth: 1.0, baseOpacity: 0.46, widthT: 1.7,
    },
  ];

  // Lines confined to lower hero, well clear of eyebrow + H1
  var yFractions = [0.74, 0.82, 0.89, 0.96];

  function getY(x, line) {
    var y = 0;
    for (var c = 0; c < line.comps.length; c++) {
      var co = line.comps[c];
      y += Math.sin(x * (2 * Math.PI * co.f / W) + co.t) * co.a;
    }
    return y;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = canvas.getBoundingClientRect().height;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // Draw each line in 40px segments to allow stroke-width to vary along the path,
  // approximating the look of ink that thins and thickens as a pen moves.
  var SEG = 40;

  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var cy   = H * yFractions[i];

      var dy   = Math.abs(mouse.y - cy);
      var prox = mouse.inCanvas && dy < MOUSE_RADIUS ? 1 - dy / MOUSE_RADIUS : 0;

      var opacity = line.baseOpacity + (line.brass ? 0 : prox * 0.20);
      var color   = line.brass
        ? 'rgba(201,168,76,' + opacity + ')'
        : 'rgba(58,54,48,'   + opacity + ')';

      for (var xs = 0; xs < W; xs += SEG) {
        var xe = Math.min(xs + SEG, W);
        var xm = (xs + xe) * 0.5;

        // Stroke-width oscillates slowly along x — absolute sine so it never goes negative
        var wFactor = 0.65 + 0.60 * Math.abs(Math.sin(xm * 0.009 + line.widthT));
        var bw = line.baseWidth + prox * (line.brass ? 0.4 : 0.15);

        ctx.lineWidth   = bw * wFactor;
        ctx.strokeStyle = color;

        ctx.beginPath();
        ctx.moveTo(xs, cy + getY(xs, line));
        for (var x = xs + 2; x <= xe; x += 2) {
          ctx.lineTo(x, cy + getY(x, line));
        }
        ctx.stroke();
      }

      // Advance each component's phase independently
      for (var c = 0; c < line.comps.length; c++) {
        line.comps[c].t += line.comps[c].spd;
      }
      // Slowly drift the width-variation pattern so it never freezes
      line.widthT += 0.0006;
    }

    requestAnimationFrame(frame);
  }

  function onMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.inCanvas = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom
    );
    if (mouse.inCanvas) {
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  canvas.addEventListener('mouseleave', function () { mouse.inCanvas = false; }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(resize, 100); });

  resize();
  requestAnimationFrame(function () {
    canvas.classList.add('is-ready');
    requestAnimationFrame(frame);
  });
})();
