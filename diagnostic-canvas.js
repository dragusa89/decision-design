(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  var canvas = document.getElementById('waveCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  // 6 wave lines: one brass "active" line, five dimmed.
  // freq  = full sine cycles across the canvas width (tighter = more cycles)
  // amp   = peak displacement in px
  // phase = current offset, incremented each frame by speed
  // speed = phase increment per frame — kept very slow for an ambient feel
  var waves = [
    { freq: 1.6, amp: 12, phase: 0.0,  speed: 0.0022, brass: false, opacity: 0.52 },
    { freq: 2.5, amp: 28, phase: 1.2,  speed: 0.0028, brass: false, opacity: 0.38 },
    { freq: 1.1, amp: 22, phase: 2.5,  speed: 0.0019, brass: true,  opacity: 1.00 },
    { freq: 3.1, amp: 9,  phase: 0.8,  speed: 0.0040, brass: false, opacity: 0.46 },
    { freq: 2.0, amp: 18, phase: 3.7,  speed: 0.0025, brass: false, opacity: 0.42 },
    { freq: 1.8, amp: 14, phase: 5.1,  speed: 0.0033, brass: false, opacity: 0.50 },
  ];

  // Vertical positions as fractions of hero height
  var yFractions = [0.22, 0.36, 0.49, 0.61, 0.73, 0.84];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = canvas.getBoundingClientRect().height;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < waves.length; i++) {
      var wave = waves[i];
      var cy = H * yFractions[i];
      var k  = (2 * Math.PI * wave.freq) / W;

      ctx.beginPath();
      for (var x = 0; x <= W; x += 2) {
        var y = cy + Math.sin(x * k + wave.phase) * wave.amp;
        if (x === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }

      if (wave.brass) {
        ctx.strokeStyle = 'rgba(201,168,76,' + wave.opacity + ')';
        ctx.lineWidth   = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(58,54,48,' + wave.opacity + ')';
        ctx.lineWidth   = 1;
      }
      ctx.stroke();

      wave.phase += wave.speed;
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(resize, 100); });

  resize();
  requestAnimationFrame(function () {
    canvas.classList.add('is-ready');
    requestAnimationFrame(frame);
  });
})();
