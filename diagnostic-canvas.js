(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  var canvas = document.getElementById('waveCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  var MOUSE_RADIUS = 130;
  var mouse = { x: -9999, y: -9999, inCanvas: false };

  var waves = [
    { freq: 1.6, baseAmp: 8,  phase: 0.0, speed: 0.0022, brass: false, baseOpacity: 0.42 },
    { freq: 2.5, baseAmp: 11, phase: 1.2, speed: 0.0028, brass: false, baseOpacity: 0.30 },
    { freq: 1.1, baseAmp: 10, phase: 2.5, speed: 0.0019, brass: true,  baseOpacity: 0.55 },
    { freq: 3.1, baseAmp: 7,  phase: 0.8, speed: 0.0040, brass: false, baseOpacity: 0.38 },
    { freq: 2.0, baseAmp: 9,  phase: 3.7, speed: 0.0025, brass: false, baseOpacity: 0.34 },
    { freq: 1.8, baseAmp: 8,  phase: 5.1, speed: 0.0033, brass: false, baseOpacity: 0.40 },
  ];

  // Waves confined to lower portion of hero, clear of headline text
  var yFractions = [0.64, 0.71, 0.77, 0.83, 0.89, 0.95];

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

      // Mouse proximity boost — smooth falloff
      var dy = Math.abs(mouse.y - cy);
      var prox = mouse.inCanvas && dy < MOUSE_RADIUS
        ? 1 - dy / MOUSE_RADIUS
        : 0;

      var amp     = wave.baseAmp + prox * wave.baseAmp * 0.55;
      var opacity = wave.baseOpacity + (wave.brass ? 0 : prox * 0.22);

      var k = (2 * Math.PI * wave.freq) / W;

      ctx.beginPath();
      for (var x = 0; x <= W; x += 2) {
        var y = cy + Math.sin(x * k + wave.phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }

      if (wave.brass) {
        ctx.strokeStyle = 'rgba(138,107,42,' + opacity + ')';
        ctx.lineWidth   = 1.2;
      } else {
        ctx.strokeStyle = 'rgba(58,54,48,' + opacity + ')';
        ctx.lineWidth   = 1;
      }
      ctx.stroke();

      wave.phase += wave.speed;
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

  function onMouseLeave() {
    mouse.inCanvas = false;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  canvas.addEventListener('mouseleave', onMouseLeave, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(resize, 100); });

  resize();
  requestAnimationFrame(function () {
    canvas.classList.add('is-ready');
    requestAnimationFrame(frame);
  });
})();
