/**
 * FFT Phase & Complex Value Simulator
 * Demonstrates how initial starting point / phase maps to Real, Imaginary, and Complex Phasor in FFT bins.
 */

(function () {
  'use strict';

  function initPhaseSimulator() {
    const container = document.getElementById('fft-phase-app');
    if (!container) return;

    const canvasSignal = document.getElementById('fft-phase-canvas-signal');
    const canvasComplex = document.getElementById('fft-phase-canvas-complex');
    const canvasSpectrum = document.getElementById('fft-phase-canvas-spectrum');

    const sliderPhase = document.getElementById('fft-phase-slider-phase');
    const inputPhase = document.getElementById('fft-phase-input-phase');
    const displayPhaseDeg = document.getElementById('fft-phase-display-deg');
    const displayPhaseRad = document.getElementById('fft-phase-display-rad');
    const displayStartVal = document.getElementById('fft-phase-display-startval');

    const selectK = document.getElementById('fft-phase-select-k');
    const selectSpectrumMode = document.getElementById('fft-phase-select-specmode');
    const btnPlay = document.getElementById('fft-phase-btn-play');
    const badgeStatus = document.getElementById('fft-phase-status-badge');
    const insightText = document.getElementById('fft-phase-insight-text');
    const presetChips = document.getElementById('fft-phase-preset-chips');

    const statReal = document.getElementById('fft-phase-stat-real');
    const statImag = document.getElementById('fft-phase-stat-imag');
    const statMag = document.getElementById('fft-phase-stat-mag');
    const statAngle = document.getElementById('fft-phase-stat-angle');

    if (!canvasSignal || !canvasComplex || !sliderPhase) return;

    const ctxSignal = canvasSignal.getContext('2d');
    const ctxComplex = canvasComplex.getContext('2d');
    const ctxSpectrum = canvasSpectrum ? canvasSpectrum.getContext('2d') : null;

    // Simulation Parameters
    const N = 32; // 32-point FFT
    let currentK = parseInt(selectK ? selectK.value : '4', 10) || 4;
    let phaseDeg = parseFloat(sliderPhase.value) || 0.0; // Phase in degrees
    let specMode = selectSpectrumMode ? selectSpectrumMode.value : 'both'; // 'both', 'mag', 'phase'
    let isRotating = false;
    let animId = null;

    // Presets
    const presets = [
      { label: '0° (코사인파, 시작=+1.0)', deg: 0.0, desc: '실수부 100%, 허수부 0 (순수 코사인파)' },
      { label: '+90° (시작=0.0, 하강)', deg: 90.0, desc: '실수부 0, 허수부 음수 (시작점 0에서 하강)' },
      { label: '-90° (사인파, 시작=0.0, 상승)', deg: -90.0, desc: '순수 사인파: 실수부 0, 허수부 양수' },
      { label: '180° (반전파, 시작=-1.0)', deg: 180.0, desc: '실수부 -1.0, 허수부 0 (반전 코사인파)' },
      { label: '45° (대각선, 시작=+0.71)', deg: 45.0, desc: '실수부와 허수부가 동일한 크기로 배분' }
    ];

    if (presetChips) {
      presetChips.innerHTML = '';
      presets.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fft-preset-btn';
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
          setPhase(p.deg);
          if (isRotating) toggleRotation(false);
        });
        presetChips.appendChild(btn);
      });
    }

    // High-DPI Canvas Resizing
    function resizeCanvas(canvas, ctx) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.resetTransform?.();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width: w, height: h };
    }

    // Compute Discrete FFT: x[n] = cos(2*pi*k*n/N + phi)
    function computeFFT() {
      const phiRad = (phaseDeg * Math.PI) / 180.0;
      const bins = [];

      for (let k = 0; k <= N / 2; k++) {
        let real = 0;
        let imag = 0;
        for (let n = 0; n < N; n++) {
          const x = Math.cos((2 * Math.PI * currentK * n) / N + phiRad);
          const angle = (2 * Math.PI * k * n) / N;
          real += x * Math.cos(angle);
          imag -= x * Math.sin(angle);
        }
        // Normalize for single-sided representation
        const factor = (k === 0 || k === N / 2) ? 1.0 : 2.0;
        const normReal = (factor / N) * real;
        const normImag = (factor / N) * imag;
        const mag = Math.sqrt(normReal * normReal + normImag * normImag);
        // Phase in degrees
        let phase = (Math.atan2(normImag, normReal) * 180.0) / Math.PI;
        bins.push({ k, real: normReal, imag: normImag, mag, phase });
      }
      return bins;
    }

    // 1. Render Time Signal x[n] with Initial Phase Point
    function drawSignal() {
      const dims = resizeCanvas(canvasSignal, ctxSignal);
      const w = dims.width;
      const h = dims.height;

      ctxSignal.clearRect(0, 0, w, h);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colorBg = isDark ? '#1a1d24' : '#f8f9fa';
      const colorGrid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      const colorAxis = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      const colorText = isDark ? '#9ca3af' : '#6b7280';
      const colorWave = isDark ? '#38bdf8' : '#0284c7';
      const colorSample = isDark ? '#818cf8' : '#4f46e5';
      const colorStart = isDark ? '#f43f5e' : '#e11d48';

      const padX = 40;
      const padY = 24;
      const plotW = w - padX * 2;
      const plotH = h - padY * 2;
      const midY = padY + plotH / 2;

      ctxSignal.fillStyle = colorBg;
      ctxSignal.fillRect(0, 0, w, h);

      // Baseline Grid
      ctxSignal.strokeStyle = colorGrid;
      ctxSignal.lineWidth = 1;
      ctxSignal.beginPath();
      ctxSignal.moveTo(padX, midY);
      ctxSignal.lineTo(padX + plotW, midY);
      ctxSignal.stroke();

      // Continuous Waveform
      const phiRad = (phaseDeg * Math.PI) / 180.0;
      ctxSignal.strokeStyle = colorWave;
      ctxSignal.lineWidth = 2.2;
      ctxSignal.beginPath();
      const numPts = 300;
      for (let i = 0; i <= numPts; i++) {
        const nFrac = (i / numPts) * (N - 1);
        const yVal = Math.cos((2 * Math.PI * currentK * nFrac) / N + phiRad);
        const px = padX + (nFrac / (N - 1)) * plotW;
        const py = midY - yVal * (plotH * 0.42);
        if (i === 0) ctxSignal.moveTo(px, py);
        else ctxSignal.lineTo(px, py);
      }
      ctxSignal.stroke();

      // Discrete Sample Points
      for (let n = 0; n < N; n++) {
        const yVal = Math.cos((2 * Math.PI * currentK * n) / N + phiRad);
        const px = padX + (n / (N - 1)) * plotW;
        const py = midY - yVal * (plotH * 0.42);

        // Stem
        ctxSignal.strokeStyle = n === 0 ? colorStart : colorSample;
        ctxSignal.lineWidth = n === 0 ? 2.5 : 1.2;
        ctxSignal.beginPath();
        ctxSignal.moveTo(px, midY);
        ctxSignal.lineTo(px, py);
        ctxSignal.stroke();

        // Marker
        ctxSignal.fillStyle = n === 0 ? colorStart : colorSample;
        ctxSignal.beginPath();
        ctxSignal.arc(px, py, n === 0 ? 5.5 : 2.5, 0, Math.PI * 2);
        ctxSignal.fill();
      }

      // Starting Point x[0] Callout
      const startYVal = Math.cos(phiRad);
      const startPy = midY - startYVal * (plotH * 0.42);
      ctxSignal.font = 'bold 10px var(--family-sans, sans-serif)';
      ctxSignal.fillStyle = colorStart;
      ctxSignal.textAlign = 'left';
      ctxSignal.fillText(`시작점 x[0] = ${startYVal.toFixed(2)} (cos ${phaseDeg.toFixed(0)}°)`, padX + 10, startPy < midY ? startPy - 8 : startPy + 16);

      // Frame Boundary Label
      ctxSignal.font = '10px var(--family-sans, sans-serif)';
      ctxSignal.fillStyle = colorText;
      ctxSignal.textAlign = 'left';
      ctxSignal.fillText('n = 0 (시작)', padX, h - 8);
      ctxSignal.textAlign = 'right';
      ctxSignal.fillText(`n = ${N - 1} (끝)`, padX + plotW, h - 8);
    }

    // 2. Render Complex Phasor Plane (Argand Diagram for Bin k)
    function drawComplex(binK) {
      const dims = resizeCanvas(canvasComplex, ctxComplex);
      const w = dims.width;
      const h = dims.height;

      ctxComplex.clearRect(0, 0, w, h);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colorBg = isDark ? '#1a1d24' : '#f8f9fa';
      const colorGrid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      const colorAxis = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)';
      const colorText = isDark ? '#9ca3af' : '#6b7280';
      const colorCircle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
      const colorReal = isDark ? '#38bdf8' : '#0284c7';
      const colorImag = isDark ? '#fb923c' : '#ea580c';
      const colorVector = isDark ? '#ec4899' : '#db2777';

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.38;

      ctxComplex.fillStyle = colorBg;
      ctxComplex.fillRect(0, 0, w, h);

      // Unit Circle
      ctxComplex.strokeStyle = colorCircle;
      ctxComplex.lineWidth = 1.5;
      ctxComplex.beginPath();
      ctxComplex.arc(cx, cy, radius, 0, Math.PI * 2);
      ctxComplex.stroke();

      // Axis Lines
      ctxComplex.strokeStyle = colorAxis;
      ctxComplex.lineWidth = 1.5;
      ctxComplex.beginPath();
      ctxComplex.moveTo(15, cy);
      ctxComplex.lineTo(w - 15, cy);
      ctxComplex.moveTo(cx, 15);
      ctxComplex.lineTo(cx, h - 15);
      ctxComplex.stroke();

      // Axis Labels
      ctxComplex.font = 'bold 10px var(--family-sans, sans-serif)';
      ctxComplex.fillStyle = colorReal;
      ctxComplex.textAlign = 'right';
      ctxComplex.fillText('실수부 Re (+)', w - 18, cy - 6);
      ctxComplex.textAlign = 'left';
      ctxComplex.fillText('Re (-)', 18, cy - 6);

      ctxComplex.fillStyle = colorImag;
      ctxComplex.textAlign = 'center';
      ctxComplex.fillText('허수부 Im (+j)', cx, 16);
      ctxComplex.fillText('Im (-j)', cx, h - 8);

      // Target Bin Phasor Coordinates
      // Note: In DFT, X[k] = sum x[n] e^{-i*omega*n}. For x[n] = cos(omega*n + phi) = 0.5(e^{i phi} e^{i omega n} + ...),
      // X[k] contains e^{i phi} (normalized).
      // On canvas, Y axis is inverted (down is positive), so positive Imag goes UP (-Y).
      const vx = cx + binK.real * radius;
      const vy = cy - binK.imag * radius; // invert Y for Cartesian

      // Projections on Real & Imaginary axes
      // Real Projection (horizontal line on axis)
      ctxComplex.strokeStyle = colorReal;
      ctxComplex.lineWidth = 3;
      ctxComplex.beginPath();
      ctxComplex.moveTo(cx, cy);
      ctxComplex.lineTo(vx, cy);
      ctxComplex.stroke();

      // Imag Projection (vertical line on axis)
      ctxComplex.strokeStyle = colorImag;
      ctxComplex.lineWidth = 3;
      ctxComplex.beginPath();
      ctxComplex.moveTo(cx, cy);
      ctxComplex.lineTo(cx, vy);
      ctxComplex.stroke();

      // Dash helpers
      ctxComplex.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
      ctxComplex.lineWidth = 1;
      ctxComplex.setLineDash([3, 3]);
      ctxComplex.beginPath();
      ctxComplex.moveTo(vx, cy);
      ctxComplex.lineTo(vx, vy);
      ctxComplex.moveTo(cx, vy);
      ctxComplex.lineTo(vx, vy);
      ctxComplex.stroke();
      ctxComplex.setLineDash([]);

      // Phasor Vector (Arrow)
      ctxComplex.strokeStyle = colorVector;
      ctxComplex.lineWidth = 3;
      ctxComplex.beginPath();
      ctxComplex.moveTo(cx, cy);
      ctxComplex.lineTo(vx, vy);
      ctxComplex.stroke();

      // Phasor Head Dot
      ctxComplex.fillStyle = colorVector;
      ctxComplex.beginPath();
      ctxComplex.arc(vx, vy, 6, 0, Math.PI * 2);
      ctxComplex.fill();

      // Phase Angle Arc
      const angleRad = Math.atan2(binK.imag, binK.real);
      ctxComplex.strokeStyle = isDark ? '#e2e8f0' : '#334155';
      ctxComplex.lineWidth = 1.2;
      ctxComplex.beginPath();
      ctxComplex.arc(cx, cy, radius * 0.35, 0, -angleRad, angleRad > 0);
      ctxComplex.stroke();

      // Phasor Coordinate Label
      ctxComplex.font = 'bold 10px var(--family-mono, monospace)';
      ctxComplex.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctxComplex.textAlign = vx > cx ? 'left' : 'right';
      const lblOffset = vx > cx ? 10 : -10;
      ctxComplex.fillText(`(${binK.real.toFixed(2)}, ${binK.imag >= 0 ? '+' : ''}${binK.imag.toFixed(2)}j)`, vx + lblOffset, vy);
    }

    // 3. Render Spectrum Breakdown (Real & Imaginary Bars)
    function drawSpectrum(bins) {
      if (!canvasSpectrum || !ctxSpectrum) return;

      const dims = resizeCanvas(canvasSpectrum, ctxSpectrum);
      const w = dims.width;
      const h = dims.height;

      ctxSpectrum.clearRect(0, 0, w, h);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colorBg = isDark ? '#1a1d24' : '#f8f9fa';
      const colorGrid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      const colorAxis = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      const colorText = isDark ? '#9ca3af' : '#6b7280';
      const colorReal = isDark ? '#38bdf8' : '#0284c7';
      const colorImag = isDark ? '#fb923c' : '#ea580c';
      const colorMag = isDark ? '#a855f7' : '#9333ea';

      const padX = 40;
      const padYTop = 24;
      const padYBottom = 30;
      const plotW = w - padX * 2;
      const plotH = h - padYTop - padYBottom;
      const midY = padYTop + plotH / 2; // zero line for Re/Im (-1.0 to +1.0)
      const baseY = padYTop + plotH; // zero line for Mag (0 to 1.0)

      ctxSpectrum.fillStyle = colorBg;
      ctxSpectrum.fillRect(0, 0, w, h);

      const maxK = N / 2;

      if (specMode === 'mag') {
        // Magnitude Spectrum Only (0 to 1.1)
        ctxSpectrum.strokeStyle = colorAxis;
        ctxSpectrum.lineWidth = 1.5;
        ctxSpectrum.beginPath();
        ctxSpectrum.moveTo(padX, baseY);
        ctxSpectrum.lineTo(padX + plotW, baseY);
        ctxSpectrum.stroke();

        bins.forEach(bin => {
          const px = padX + (bin.k / maxK) * plotW;
          const py = baseY - (bin.mag / 1.1) * plotH;

          ctxSpectrum.strokeStyle = colorMag;
          ctxSpectrum.lineWidth = bin.k === currentK ? 4 : 2;
          ctxSpectrum.beginPath();
          ctxSpectrum.moveTo(px, baseY);
          ctxSpectrum.lineTo(px, py);
          ctxSpectrum.stroke();

          ctxSpectrum.fillStyle = colorMag;
          ctxSpectrum.beginPath();
          ctxSpectrum.arc(px, py, bin.k === currentK ? 5 : 3, 0, Math.PI * 2);
          ctxSpectrum.fill();

          ctxSpectrum.fillStyle = colorText;
          ctxSpectrum.font = '9.5px var(--family-sans, sans-serif)';
          ctxSpectrum.textAlign = 'center';
          ctxSpectrum.fillText(`${bin.k}`, px, baseY + 14);

          if (bin.mag > 0.1) {
            ctxSpectrum.font = 'bold 9.5px var(--family-mono, monospace)';
            ctxSpectrum.fillText(`${bin.mag.toFixed(2)}`, px, py - 6);
          }
        });
      } else {
        // Real & Imaginary Bipolar Spectrum (-1.1 to +1.1)
        ctxSpectrum.strokeStyle = colorAxis;
        ctxSpectrum.lineWidth = 1.5;
        ctxSpectrum.beginPath();
        ctxSpectrum.moveTo(padX, midY);
        ctxSpectrum.lineTo(padX + plotW, midY);
        ctxSpectrum.stroke();

        ctxSpectrum.font = '9px var(--family-sans, sans-serif)';
        ctxSpectrum.fillStyle = colorText;
        ctxSpectrum.textAlign = 'right';
        ctxSpectrum.fillText('+1.0', padX - 4, padYTop + 6);
        ctxSpectrum.fillText('0.0', padX - 4, midY + 3);
        ctxSpectrum.fillText('-1.0', padX - 4, baseY);

        bins.forEach(bin => {
          const px = padX + (bin.k / maxK) * plotW;
          const barWidth = 4;

          // Real Stem (blue)
          const pyReal = midY - (bin.real / 1.1) * (plotH / 2);
          ctxSpectrum.strokeStyle = colorReal;
          ctxSpectrum.lineWidth = 2.5;
          ctxSpectrum.beginPath();
          ctxSpectrum.moveTo(px - 3, midY);
          ctxSpectrum.lineTo(px - 3, pyReal);
          ctxSpectrum.stroke();
          ctxSpectrum.fillStyle = colorReal;
          ctxSpectrum.beginPath();
          ctxSpectrum.arc(px - 3, pyReal, 3.5, 0, Math.PI * 2);
          ctxSpectrum.fill();

          // Imag Stem (orange)
          const pyImag = midY - (bin.imag / 1.1) * (plotH / 2);
          ctxSpectrum.strokeStyle = colorImag;
          ctxSpectrum.lineWidth = 2.5;
          ctxSpectrum.beginPath();
          ctxSpectrum.moveTo(px + 3, midY);
          ctxSpectrum.lineTo(px + 3, pyImag);
          ctxSpectrum.stroke();
          ctxSpectrum.fillStyle = colorImag;
          ctxSpectrum.beginPath();
          ctxSpectrum.arc(px + 3, pyImag, 3.5, 0, Math.PI * 2);
          ctxSpectrum.fill();

          // Bin Label
          ctxSpectrum.fillStyle = bin.k === currentK ? (isDark ? '#fff' : '#000') : colorText;
          ctxSpectrum.font = bin.k === currentK ? 'bold 10px var(--family-sans, sans-serif)' : '9.5px var(--family-sans, sans-serif)';
          ctxSpectrum.textAlign = 'center';
          ctxSpectrum.fillText(`${bin.k}`, px, baseY + 18);
        });
      }

      ctxSpectrum.fillStyle = colorText;
      ctxSpectrum.font = '10px var(--family-sans, sans-serif)';
      ctxSpectrum.textAlign = 'right';
      ctxSpectrum.fillText('주파수 Bin (k = 0 ~ 16)', padX + plotW, baseY + 20);
    }

    // Update Numerical Readouts & Insight Card
    function updateReadouts(binK) {
      const phiRad = (phaseDeg * Math.PI) / 180.0;
      const startVal = Math.cos(phiRad);

      if (displayPhaseDeg) displayPhaseDeg.textContent = `${phaseDeg.toFixed(1)}°`;
      if (displayPhaseRad) displayPhaseRad.textContent = `${(phiRad / Math.PI).toFixed(2)}π rad`;
      if (displayStartVal) displayStartVal.textContent = startVal.toFixed(3);

      if (statReal) statReal.textContent = binK.real.toFixed(3);
      if (statImag) statImag.textContent = `${binK.imag >= 0 ? '+' : ''}${binK.imag.toFixed(3)} j`;
      if (statMag) statMag.textContent = binK.mag.toFixed(3);
      if (statAngle) statAngle.textContent = `${phaseDeg.toFixed(1)}°`;

      // Badge & Insight Text
      if (Math.abs(phaseDeg) < 2.0) {
        if (badgeStatus) {
          badgeStatus.textContent = '순수 코사인 (Re = 1.0, Im = 0)';
          badgeStatus.className = 'fft-status-badge match-exact';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>순수 실수 (Real-only):</strong> 위상 0°에서 파형은 $x[0] = +1.0$에서 시작합니다. FFT Bin ${currentK}의 복소수 값은 실수부만 $1.0$이고 허수부는 $0$이 됩니다. 즉, <strong>오일러 평면에서 정확히 양의 실수축 위에 위치</strong>합니다.`;
        }
      } else if (Math.abs(phaseDeg - 90.0) < 2.0 || Math.abs(phaseDeg + 90.0) < 2.0) {
        if (badgeStatus) {
          badgeStatus.textContent = '순수 사인파 (Re = 0, Im = ±1.0)';
          badgeStatus.className = 'fft-status-badge match-leak';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>순수 허수 (Imaginary-only):</strong> 위상이 ±90° 회전하면 파형의 시작점은 $x[0] = 0.0$이 됩니다. FFT Bin의 실수부는 완전히 $0$이 되고, <strong>모든 에너지가 허수부(Im)로 이동</strong>합니다. 코사인과 사인의 90° 직교성이 복소 평면의 $X$축과 $Y$축으로 정확히 분리되는 것을 보여줍니다.`;
        }
      } else if (Math.abs(Math.abs(phaseDeg) - 180.0) < 2.0) {
        if (badgeStatus) {
          badgeStatus.textContent = '반전 코사인 (Re = -1.0, Im = 0)';
          badgeStatus.className = 'fft-status-badge match-exact';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>위상 180° 반전:</strong> 시작점이 골($-1.0$)에서 시작합니다. 복소 평면에서 정확히 음의 실수축(Re = -1.0, Im = 0)을 가리킵니다.`;
        }
      } else {
        if (badgeStatus) {
          badgeStatus.textContent = `임의 위상 분배 (Re = ${binK.real.toFixed(2)}, Im = ${binK.imag.toFixed(2)}j)`;
          badgeStatus.className = 'fft-status-badge match-leak';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>복소 위상 분배:</strong> 시작점이 $x[0] = ${startVal.toFixed(2)}$일 때, FFT Bin ${currentK}는 크기 $|X|=1.0$을 유지하면서 실수부(${binK.real.toFixed(2)})와 허수부(${binK.imag.toFixed(2)}j)로 에너지를 배분합니다. <strong>오일러 공식 $e^{j\\phi} = \\cos\\phi + j\\sin\\phi$에 따라 회전</strong>하는 원리입니다.`;
        }
      }
    }

    // Set Phase Value and Re-render
    function setPhase(deg) {
      phaseDeg = deg;
      while (phaseDeg > 180.0) phaseDeg -= 360.0;
      while (phaseDeg < -180.0) phaseDeg += 360.0;

      sliderPhase.value = phaseDeg.toFixed(1);
      if (inputPhase) inputPhase.value = phaseDeg.toFixed(1);

      const bins = computeFFT();
      const binK = bins[currentK] || { real: 0, imag: 0, mag: 0, phase: 0 };

      drawSignal();
      drawComplex(binK);
      drawSpectrum(bins);
      updateReadouts(binK);
    }

    // Event Listeners
    sliderPhase.addEventListener('input', (e) => {
      setPhase(parseFloat(e.target.value));
      if (isRotating) toggleRotation(false);
    });

    if (inputPhase) {
      inputPhase.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setPhase(val);
        if (isRotating) toggleRotation(false);
      });
    }

    if (selectK) {
      selectK.addEventListener('change', (e) => {
        currentK = parseInt(e.target.value, 10);
        setPhase(phaseDeg);
      });
    }

    if (selectSpectrumMode) {
      selectSpectrumMode.addEventListener('change', (e) => {
        specMode = e.target.value;
        setPhase(phaseDeg);
      });
    }

    // Continuous Phase Rotation Animation
    function toggleRotation(forceState) {
      isRotating = typeof forceState === 'boolean' ? forceState : !isRotating;
      if (btnPlay) {
        btnPlay.textContent = isRotating ? '⏸ 위상 회전 일시정지' : '🔄 위상 회전 재생 (360°)';
        btnPlay.classList.toggle('active', isRotating);
      }

      if (isRotating) {
        let lastTime = performance.now();
        function stepRotation(now) {
          if (!isRotating) return;
          const dt = (now - lastTime) / 1000;
          lastTime = now;

          // Rotate 45 degrees per second
          let nextDeg = phaseDeg + dt * 50.0;
          if (nextDeg > 180.0) nextDeg -= 360.0;
          setPhase(nextDeg);
          animId = requestAnimationFrame(stepRotation);
        }
        animId = requestAnimationFrame(stepRotation);
      } else if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => toggleRotation());
    }

    // Modern Web Guidance: Efficient Background Processing
    container.addEventListener('contentvisibilityautostatechange', (e) => {
      if (e.skipped && isRotating) toggleRotation(false);
    });

    if (!('contentVisibility' in document.documentElement.style)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && isRotating) toggleRotation(false);
        });
      }, { rootMargin: '200px' });
      observer.observe(container);
    }

    // Theme observer
    const themeObserver = new MutationObserver(() => {
      setPhase(phaseDeg);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    window.addEventListener('resize', () => {
      setPhase(phaseDeg);
    });

    // Initial render
    setPhase(phaseDeg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhaseSimulator);
  } else {
    initPhaseSimulator();
  }
})();
