// Hero canvas — Decision Architecture line field.
// A grid of subtle nodes connected by hairlines. The cursor acts as an
// "attention" point: lines whose midpoints are near the cursor brighten
// and slightly bend toward it, suggesting decision pathways converging
// on a focal moment. Calm, low-contrast, non-intrusive.
//
// Usage: place <canvas class="hero-canvas"></canvas> inside a section
// with position:relative. Optional data attributes:
//   data-density="0.6"   — multiplier for node count (default 1)
//   data-intensity="0.7" — multiplier for line/node alpha (default 1)
//   data-influence="200" — cursor radius in px (default 240)

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvases = document.querySelectorAll('canvas.hero-canvas, #heroCanvas');
  if (!canvases.length) return;

  canvases.forEach(initInstance);

  function initInstance(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const densityMul = parseFloat(canvas.dataset.density) || 1;
    const intensityMul = parseFloat(canvas.dataset.intensity) || 1;
    const INFLUENCE = parseFloat(canvas.dataset.influence) || 240;

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let nodes = [];
    let edges = [];
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

    // Tuning ----------------------------------------------------------------
    const baseGridX = 11, baseGridY = 7;
    const GRID_X = Math.max(5, Math.round(baseGridX * Math.sqrt(densityMul)));
    const GRID_Y = Math.max(4, Math.round(baseGridY * Math.sqrt(densityMul)));
    const JITTER = 0.28;
    const NODE_R = 1.2;
    const LINE_BASE_ALPHA = 0.07 * intensityMul;
    const LINE_HOVER_ALPHA = 0.55 * intensityMul;
    const NODE_BASE_ALPHA = 0.18 * intensityMul;
    const NODE_HOVER_ALPHA = 0.9 * intensityMul;
    const EDGE_DIST_FACTOR = 1.55;

    const LINE_COLOR = '201, 168, 76';
    const NODE_COLOR = '216, 209, 196';
    const FOCAL_COLOR = '201, 168, 76';

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = window.innerWidth;
      H = rect.height;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildField();
    }

    function buildField() {
      nodes = [];
      edges = [];
      if (W < 10 || H < 10) return;
      const cellW = W / (GRID_X - 1);
      const cellH = H / (GRID_Y - 1);
      function prand(i, j) {
        const s = Math.sin(i * 374.21 + j * 911.7) * 43758.5453;
        return s - Math.floor(s);
      }
      for (let j = 0; j < GRID_Y; j++) {
        for (let i = 0; i < GRID_X; i++) {
          const dx = (prand(i, j) - 0.5) * 2 * JITTER * cellW;
          const dy = (prand(i + 7, j + 13) - 0.5) * 2 * JITTER * cellH;
          nodes.push({
            x: i * cellW + dx,
            y: j * cellH + dy,
            baseX: i * cellW + dx,
            baseY: j * cellH + dy,
            phase: prand(i + 3, j + 5) * Math.PI * 2,
          });
        }
      }
      const maxDist = Math.max(cellW, cellH) * EDGE_DIST_FACTOR;
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const dx = nodes[a].baseX - nodes[b].baseX;
          const dy = nodes[a].baseY - nodes[b].baseY;
          const d = Math.hypot(dx, dy);
          if (d <= maxDist) {
            const isDiagonal = Math.abs(dx) > 1 && Math.abs(dy) > 1;
            if (isDiagonal && Math.random() > 0.45) continue;
            edges.push({ a, b });
          }
        }
      }
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
      mouse.active = true;
    }
    function onMouseLeave() {
      mouse.tx = -9999;
      mouse.ty = -9999;
      mouse.active = false;
    }

    // Autonomous drift focal — provides movement without a cursor (mobile,
    // touch devices, and desktop before first mousemove). Lissajous path so
    // it never repeats too obviously and feels organic.
    function driftPoint(t) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      // Amplitudes scale with viewport so the path stays inside the canvas.
      const ax = W * 0.32;
      const ay = H * 0.34;
      const x = cx + Math.sin(t * 0.11) * ax + Math.sin(t * 0.27 + 1.3) * ax * 0.18;
      const y = cy + Math.cos(t * 0.09 + 0.7) * ay + Math.cos(t * 0.31 + 2.1) * ay * 0.14;
      return { x, y };
    }

    let t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;

      // If the cursor isn't active, target the drift point instead so the
      // field always has something to react to.
      if (!mouse.active) {
        const d = driftPoint(t);
        mouse.tx = d.x;
        mouse.ty = d.y;
      }

      if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const ax = Math.cos(t * 0.18 + n.phase) * 1.6;
        const ay = Math.sin(t * 0.22 + n.phase * 0.9) * 1.2;
        let tx = n.baseX + ax;
        let ty = n.baseY + ay;
        const dx = mouse.x - tx;
        const dy = mouse.y - ty;
        const d = Math.hypot(dx, dy);
        if (d < INFLUENCE) {
          const k = (1 - d / INFLUENCE) * 0.18;
          tx += dx * k;
          ty += dy * k;
        }
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < edges.length; i++) {
        const A = nodes[edges[i].a];
        const B = nodes[edges[i].b];
        const mx = (A.x + B.x) * 0.5;
        const my = (A.y + B.y) * 0.5;
        const dx = mouse.x - mx;
        const dy = mouse.y - my;
        const d = Math.hypot(dx, dy);
        let alpha = LINE_BASE_ALPHA;
        if (d < INFLUENCE) {
          const k = 1 - d / INFLUENCE;
          alpha = LINE_BASE_ALPHA + (LINE_HOVER_ALPHA - LINE_BASE_ALPHA) * k * k;
        }
        ctx.strokeStyle = `rgba(${LINE_COLOR}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        let alpha = NODE_BASE_ALPHA;
        let r = NODE_R;
        if (d < INFLUENCE) {
          const k = 1 - d / INFLUENCE;
          alpha = NODE_BASE_ALPHA + (NODE_HOVER_ALPHA - NODE_BASE_ALPHA) * k;
          r = NODE_R + k * 1.6;
        }
        ctx.fillStyle = `rgba(${NODE_COLOR}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Active connections: lines drawn from the focal point (cursor or
      // drift) to the nearest nodes. These threads make the cursor feel
      // *connected* to the field rather than merely passing through it.
      if (mouse.x > -1000) {
        // Score nodes by distance, take top N within INFLUENCE.
        const candidates = [];
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < INFLUENCE) candidates.push({ n, d });
        }
        candidates.sort((a, b) => a.d - b.d);
        const MAX_THREADS = 7;
        const top = candidates.slice(0, MAX_THREADS);
        for (let i = 0; i < top.length; i++) {
          const { n, d } = top[i];
          const k = 1 - d / INFLUENCE;
          // Closer threads brighter; farther ones whisper.
          const a = (0.18 + k * 0.45) * intensityMul * (mouse.active ? 1 : 0.7);
          ctx.strokeStyle = `rgba(${LINE_COLOR}, ${a})`;
          ctx.lineWidth = 0.9 + k * 0.5;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
          // Small bright cap on the connected node so the link reads cleanly.
          ctx.fillStyle = `rgba(${NODE_COLOR}, ${(0.55 + k * 0.4) * intensityMul})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, NODE_R + k * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // The focal pulse should also draw when drifting (not only on real
      // cursor activity), so mobile/touch users see the brass focal moving.
      if (mouse.x > -1000) {
        const pulse = 0.5 + Math.sin(t * 1.6) * 0.5;
        const baseAlpha = mouse.active ? 0.12 : 0.08;
        ctx.strokeStyle = `rgba(${FOCAL_COLOR}, ${(baseAlpha + pulse * 0.05) * intensityMul})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 22 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${FOCAL_COLOR}, ${((mouse.active ? 0.05 : 0.035) + pulse * 0.025) * intensityMul})`;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestAnimationFrame(frame);
    }

    // Track cursor on the parent section so it works over text/CTAs too.
    const section = canvas.closest('section, .closing-cta, .pullquote') || canvas.parentElement;
    if (section) {
      section.addEventListener('mousemove', onMouseMove, { passive: true });
      section.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }
    window.addEventListener('resize', resize);

    resize();
    requestAnimationFrame(() => {
      canvas.classList.add('is-ready');
      requestAnimationFrame(frame);
    });
  }
})();
