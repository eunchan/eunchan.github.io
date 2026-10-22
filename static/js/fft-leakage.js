/**
 * FFT Spectral Leakage & Sinc Splatting Interactive Simulator
 * Explains how non-integer bin frequencies spread across FFT bins.
 */

(function () {
  'use strict';

  function initLeakageSimulator() {
    const container = document.getElementById('fft-leakage-app');
    if (!container) return;

    // Elements
    const canvasSignal = document.getElementById('fft-leak-canvas-signal');
    const canvasSpectrum = document.getElementById('fft-leak-canvas-spectrum');
    const sliderK = document.getElementById('fft-leak-slider-k');
    const inputK = document.getElementById('fft-leak-input-k');
    const displayK = document.getElementById('fft-leak-display-k');
    const windowSelect = document.getElementById('fft-leak-window-select');
    const scaleSelect = document.getElementById('fft-leak-scale-select');
    const btnPlay = document.getElementById('fft-leak-btn-play');
    const badgeStatus = document.getElementById('fft-leak-status-badge');
    const insightText = document.getElementById('fft-leak-insight-text');
    const tableBody = document.getElementById('fft-leak-table-body');
    const presetChips = document.getElementById('fft-leak-preset-chips');

    if (!canvasSignal || !canvasSpectrum || !sliderK) return;

    const ctxSignal = canvasSignal.getContext('2d');
    const ctxSpectrum = canvasSpectrum.getContext('2d');

    // Simulation Parameters
    const N = 32; // 32-point FFT
    const Fs = 32.0; // 32 MHz sampling frequency (delta f = 1 MHz)
    let currentK = parseFloat(sliderK.value) || 8.0; // Target bin frequency
    let windowType = windowSelect ? windowSelect.value : 'rect'; // 'rect' or 'hann'
    let scaleType = scaleSelect ? scaleSelect.value : 'linear'; // 'linear' or 'db'
    let isSweeping = false;
    let sweepDir = 1;
    let animId = null;
    let hoveredBin = null;

    // Presets
    const presets = [
      { label: '정수 Bin (k=8.0)', k: 8.0, desc: '누설 0%: 모든 정수 Bin이 Sinc 함수의 영점(Zero)과 일치' },
      { label: '미세 어긋남 (k=8.2)', k: 8.2, desc: '인접 Bin으로 에너지가 스며들기 시작함' },
      { label: '최대 누설 (k=8.5)', k: 8.5, desc: '최악의 누설: Sinc 피크가 양 Bin 사이에 걸치며 Scalloping Loss 최대 (-3.92dB)' },
      { label: '다음 Bin (k=9.0)', k: 9.0, desc: '다시 정수 Bin으로 이동하여 누설이 완전히 사라짐' }
    ];

    if (presetChips) {
      presetChips.innerHTML = '';
      presets.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fft-preset-btn';
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
          setK(p.k);
          if (isSweeping) toggleSweep(false);
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

    // Window Functions
    function getWindow(n, N, type) {
      if (type === 'hann') {
        return 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      }
      return 1.0; // Rectangular
    }

    function getWindowCoherentGain(type) {
      if (type === 'hann') return 0.5;
      return 1.0;
    }

    // Compute Discrete FFT Bins for Real Cosine: x[n] = cos(2*pi*k0*n/N)
    function computeFFT(k0, winType) {
      const bins = [];
      const winGain = getWindowCoherentGain(winType);

      for (let k = 0; k <= N / 2; k++) {
        let real = 0;
        let imag = 0;
        for (let n = 0; n < N; n++) {
          const w = getWindow(n, N, winType);
          const x = Math.cos((2 * Math.PI * k0 * n) / N) * w;
          const angle = (2 * Math.PI * k * n) / N;
          real += x * Math.cos(angle);
          imag -= x * Math.sin(angle);
        }
        // Normalized magnitude (single-sided spectrum amplitude)
        const factor = (k === 0 || k === N / 2) ? 1.0 : 2.0;
        const mag = (factor / (N * winGain)) * Math.sqrt(real * real + imag * imag);
        const power = mag * mag;
        const db = 20 * Math.log10(Math.max(mag, 1e-4));
        bins.push({ k, mag, power, db, real, imag });
      }
      return bins;
    }

    // Compute Continuous DTFT Spectrum Envelope at frequency nu
    function computeDTFT(nu, k0, winType) {
      const winGain = getWindowCoherentGain(winType);
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const w = getWindow(n, N, winType);
        const x = Math.cos((2 * Math.PI * k0 * n) / N) * w;
        const angle = (2 * Math.PI * nu * n) / N;
        real += x * Math.cos(angle);
        imag -= x * Math.sin(angle);
      }
      const mag = (2.0 / (N * winGain)) * Math.sqrt(real * real + imag * imag);
      const db = 20 * Math.log10(Math.max(mag, 1e-4));
      return { mag, db };
    }

    // Render 1: Windowed Time Signal x[n]
    function drawSignal() {
      const dims = resizeCanvas(canvasSignal, ctxSignal);
      const w = dims.width;
      const h = dims.height;

      ctxSignal.clearRect(0, 0, w, h);

      // Colors from CSS
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colorBg = isDark ? '#1a1d24' : '#f8f9fa';
      const colorGrid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      const colorAxis = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      const colorText = isDark ? '#9ca3af' : '#6b7280';
      const colorWave = isDark ? '#38bdf8' : '#0284c7';
      const colorSample = isDark ? '#f43f5e' : '#e11d48';
      const colorWindow = isDark ? 'rgba(234, 179, 8, 0.45)' : 'rgba(202, 138, 4, 0.5)';

      const padX = 40;
      const padY = 24;
      const plotW = w - padX * 2;
      const plotH = h - padY * 2;
      const midY = padY + plotH / 2;

      // Background & Axis
      ctxSignal.fillStyle = colorBg;
      ctxSignal.fillRect(0, 0, w, h);

      // Grid
      ctxSignal.strokeStyle = colorGrid;
      ctxSignal.lineWidth = 1;
      ctxSignal.beginPath();
      ctxSignal.moveTo(padX, midY);
      ctxSignal.lineTo(padX + plotW, midY);
      ctxSignal.stroke();

      // Continuous Waveform Curve
      ctxSignal.strokeStyle = colorWave;
      ctxSignal.lineWidth = 2;
      ctxSignal.beginPath();
      const numPts = 300;
      for (let i = 0; i <= numPts; i++) {
        const nFrac = (i / numPts) * (N - 1);
        const wVal = getWindow(nFrac, N, windowType);
        const yVal = Math.cos((2 * Math.PI * currentK * nFrac) / N) * wVal;
        const px = padX + (nFrac / (N - 1)) * plotW;
        const py = midY - yVal * (plotH * 0.42);
        if (i === 0) ctxSignal.moveTo(px, py);
        else ctxSignal.lineTo(px, py);
      }
      ctxSignal.stroke();

      // Window Envelope (Hann)
      if (windowType === 'hann') {
        ctxSignal.strokeStyle = colorWindow;
        ctxSignal.lineWidth = 1.5;
        ctxSignal.setLineDash([4, 3]);
        ctxSignal.beginPath();
        for (let i = 0; i <= numPts; i++) {
          const nFrac = (i / numPts) * (N - 1);
          const wVal = getWindow(nFrac, N, windowType);
          const px = padX + (nFrac / (N - 1)) * plotW;
          const pyTop = midY - wVal * (plotH * 0.42);
          if (i === 0) ctxSignal.moveTo(px, pyTop);
          else ctxSignal.lineTo(px, pyTop);
        }
        ctxSignal.stroke();
        ctxSignal.setLineDash([]);
      }

      // Discrete Sample Stems & Points
      for (let n = 0; n < N; n++) {
        const wVal = getWindow(n, N, windowType);
        const yVal = Math.cos((2 * Math.PI * currentK * n) / N) * wVal;
        const px = padX + (n / (N - 1)) * plotW;
        const py = midY - yVal * (plotH * 0.42);

        // Stem
        ctxSignal.strokeStyle = colorSample;
        ctxSignal.lineWidth = 1.5;
        ctxSignal.beginPath();
        ctxSignal.moveTo(px, midY);
        ctxSignal.lineTo(px, py);
        ctxSignal.stroke();

        // Dot
        ctxSignal.fillStyle = colorSample;
        ctxSignal.beginPath();
        ctxSignal.arc(px, py, 2.5, 0, Math.PI * 2);
        ctxSignal.fill();
      }

      // Boundary Periodicity Highlight
      // Check if start sample and end sample match (integer cycle)
      const isInteger = Math.abs(currentK - Math.round(currentK)) < 0.02;
      const startY = Math.cos(0);
      const endY = Math.cos((2 * Math.PI * currentK * (N - 1)) / N);
      const isDiscontinuous = !isInteger && windowType === 'rect';

      // Start/End Badges
      ctxSignal.font = '10px var(--family-sans, sans-serif)';
      ctxSignal.fillStyle = colorText;
      ctxSignal.textAlign = 'left';
      ctxSignal.fillText('n = 0', padX, h - 8);
      ctxSignal.textAlign = 'right';
      ctxSignal.fillText(`n = ${N - 1}`, padX + plotW, h - 8);

      // Periodicity Warning/Badge
      ctxSignal.textAlign = 'center';
      if (isDiscontinuous) {
        ctxSignal.fillStyle = isDark ? '#fb7185' : '#e11d48';
        ctxSignal.fillText(`⚠️ 윈도우 끝부분 불연속 (주기 어긋남 → 주파수 누설 발생)`, padX + plotW / 2, 16);
      } else {
        ctxSignal.fillStyle = isDark ? '#4ade80' : '#16a34a';
        ctxSignal.fillText(`✓ 윈도우 내 주기 일치 (끝부분 연속 → 단일 Bin에 집중)`, padX + plotW / 2, 16);
      }
    }

    // Render 2: Continuous Sinc vs Discrete FFT Bins
    function drawSpectrum() {
      const dims = resizeCanvas(canvasSpectrum, ctxSpectrum);
      const w = dims.width;
      const h = dims.height;

      ctxSpectrum.clearRect(0, 0, w, h);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colorBg = isDark ? '#1a1d24' : '#f8f9fa';
      const colorGrid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      const colorAxis = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      const colorText = isDark ? '#9ca3af' : '#6b7280';
      const colorSincFill = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)';
      const colorSincStroke = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.65)';
      const colorBinStem = isDark ? '#f59e0b' : '#d97706';
      const colorBinDot = isDark ? '#fbbf24' : '#b45309';
      const colorPeakTarget = isDark ? '#f43f5e' : '#e11d48';

      const padX = 42;
      const padYTop = 32;
      const padYBottom = 34;
      const plotW = w - padX * 2;
      const plotH = h - padYTop - padYBottom;
      const baseY = padYTop + plotH;

      ctxSpectrum.fillStyle = colorBg;
      ctxSpectrum.fillRect(0, 0, w, h);

      // Value to Y coordinate converter
      function valToY(val, dbVal) {
        if (scaleType === 'db') {
          // Range: 0 dB to -50 dB
          const minDb = -50;
          const clamped = Math.max(minDb, Math.min(0, dbVal));
          return padYTop + (1 - (clamped - minDb) / (0 - minDb)) * plotH;
        } else {
          // Linear: 0 to 1.15 (to leave headroom)
          const clamped = Math.max(0, Math.min(1.15, val));
          return baseY - (clamped / 1.15) * plotH;
        }
      }

      // Grid Lines & Axis Labels
      ctxSpectrum.strokeStyle = colorGrid;
      ctxSpectrum.lineWidth = 1;
      ctxSpectrum.fillStyle = colorText;
      ctxSpectrum.font = '10px var(--family-sans, sans-serif)';

      if (scaleType === 'db') {
        const dBs = [0, -10, -20, -30, -40, -50];
        dBs.forEach(db => {
          const y = valToY(0, db);
          ctxSpectrum.beginPath();
          ctxSpectrum.moveTo(padX, y);
          ctxSpectrum.lineTo(padX + plotW, y);
          ctxSpectrum.stroke();
          ctxSpectrum.textAlign = 'right';
          ctxSpectrum.fillText(`${db}dB`, padX - 6, y + 3);
        });
      } else {
        const steps = [0.0, 0.25, 0.5, 0.75, 1.0];
        steps.forEach(v => {
          const y = valToY(v, 0);
          ctxSpectrum.beginPath();
          ctxSpectrum.moveTo(padX, y);
          ctxSpectrum.lineTo(padX + plotW, y);
          ctxSpectrum.stroke();
          ctxSpectrum.textAlign = 'right';
          ctxSpectrum.fillText(v.toFixed(2), padX - 6, y + 3);
        });
      }

      // X-axis baseline
      ctxSpectrum.strokeStyle = colorAxis;
      ctxSpectrum.lineWidth = 1.5;
      ctxSpectrum.beginPath();
      ctxSpectrum.moveTo(padX, baseY);
      ctxSpectrum.lineTo(padX + plotW, baseY);
      ctxSpectrum.stroke();

      // Continuous Sinc / DTFT Spectrum Curve
      const maxK = N / 2; // 16
      const numCurvePts = 450;
      const curvePts = [];

      for (let i = 0; i <= numCurvePts; i++) {
        const nu = (i / numCurvePts) * maxK;
        const dtft = computeDTFT(nu, currentK, windowType);
        const px = padX + (nu / maxK) * plotW;
        const py = valToY(dtft.mag, dtft.db);
        curvePts.push({ x: px, y: py });
      }

      // Sinc Fill
      ctxSpectrum.fillStyle = colorSincFill;
      ctxSpectrum.beginPath();
      ctxSpectrum.moveTo(curvePts[0].x, baseY);
      curvePts.forEach(pt => ctxSpectrum.lineTo(pt.x, pt.y));
      ctxSpectrum.lineTo(curvePts[curvePts.length - 1].x, baseY);
      ctxSpectrum.closePath();
      ctxSpectrum.fill();

      // Sinc Outline
      ctxSpectrum.strokeStyle = colorSincStroke;
      ctxSpectrum.lineWidth = 2;
      ctxSpectrum.beginPath();
      curvePts.forEach((pt, idx) => {
        if (idx === 0) ctxSpectrum.moveTo(pt.x, pt.y);
        else ctxSpectrum.lineTo(pt.x, pt.y);
      });
      ctxSpectrum.stroke();

      // Compute Discrete FFT Bins
      const fftBins = computeFFT(currentK, windowType);

      // Draw Target Input Frequency Indicator (dashed vertical line)
      const targetPx = padX + (currentK / maxK) * plotW;
      ctxSpectrum.strokeStyle = colorPeakTarget;
      ctxSpectrum.lineWidth = 1.5;
      ctxSpectrum.setLineDash([3, 3]);
      ctxSpectrum.beginPath();
      ctxSpectrum.moveTo(targetPx, padYTop - 6);
      ctxSpectrum.lineTo(targetPx, baseY);
      ctxSpectrum.stroke();
      ctxSpectrum.setLineDash([]);

      ctxSpectrum.fillStyle = colorPeakTarget;
      ctxSpectrum.textAlign = 'center';
      ctxSpectrum.fillText(`입력 f₀ = ${currentK.toFixed(2)} MHz`, targetPx, padYTop - 12);

      // Draw Discrete FFT Bins (Stems and Dots)
      fftBins.forEach(bin => {
        const px = padX + (bin.k / maxK) * plotW;
        const py = valToY(bin.mag, bin.db);
        const isHovered = hoveredBin === bin.k;

        // Stem
        ctxSpectrum.strokeStyle = isHovered ? colorPeakTarget : colorBinStem;
        ctxSpectrum.lineWidth = isHovered ? 3.5 : 2.5;
        ctxSpectrum.beginPath();
        ctxSpectrum.moveTo(px, baseY);
        ctxSpectrum.lineTo(px, py);
        ctxSpectrum.stroke();

        // Dot
        ctxSpectrum.fillStyle = isHovered ? colorPeakTarget : colorBinDot;
        ctxSpectrum.beginPath();
        ctxSpectrum.arc(px, py, isHovered ? 5.5 : 4, 0, Math.PI * 2);
        ctxSpectrum.fill();

        // X-axis Bin Labels
        ctxSpectrum.fillStyle = isHovered ? colorPeakTarget : colorText;
        ctxSpectrum.font = isHovered ? 'bold 11px var(--family-sans, sans-serif)' : '10px var(--family-sans, sans-serif)';
        ctxSpectrum.textAlign = 'center';
        ctxSpectrum.fillText(`${bin.k}`, px, baseY + 15);

        // Value annotation for top bins
        if (bin.mag > 0.08 || isHovered) {
          ctxSpectrum.fillStyle = isHovered ? colorPeakTarget : (isDark ? '#e2e8f0' : '#1e293b');
          ctxSpectrum.font = 'bold 9.5px var(--family-sans, sans-serif)';
          const labelText = scaleType === 'db' ? `${bin.db.toFixed(1)}dB` : `${bin.mag.toFixed(2)}`;
          ctxSpectrum.fillText(labelText, px, py - 8);
        }
      });

      // Axis Title
      ctxSpectrum.fillStyle = colorText;
      ctxSpectrum.font = '10px var(--family-sans, sans-serif)';
      ctxSpectrum.textAlign = 'right';
      ctxSpectrum.fillText('주파수 Bin (k = 0 ~ 16 MHz)', padX + plotW, baseY + 28);

      // Update Quantitative Breakdown Table
      updateBreakdownTable(fftBins);
    }

    // Update Energy Breakdown & Insight Card
    function updateBreakdownTable(bins) {
      if (!tableBody) return;

      // Find top 4 bins by magnitude
      const sorted = [...bins].sort((a, b) => b.mag - a.mag);
      const totalPower = bins.reduce((sum, b) => sum + b.power, 0);

      let html = '';
      sorted.slice(0, 5).forEach((b, idx) => {
        const pct = totalPower > 0 ? ((b.power / totalPower) * 100).toFixed(1) : '0.0';
        const isTarget = Math.abs(b.k - Math.round(currentK)) === 0;
        const rowClass = isTarget ? 'row-target' : '';
        html += `<tr class="${rowClass}">
          <td><strong>Bin ${b.k}</strong> (${b.k} MHz)</td>
          <td>${b.mag.toFixed(3)}</td>
          <td>${b.db.toFixed(1)} dB</td>
          <td>
            <div class="fft-leak-bar-wrap">
              <div class="fft-leak-bar-fill" style="width: ${Math.min(100, pct)}%"></div>
              <span>${pct}%</span>
            </div>
          </td>
        </tr>`;
      });
      tableBody.innerHTML = html;

      // Update Status Badge & Educational Insight
      const diffFromInt = Math.abs(currentK - Math.round(currentK));
      const peakBin = sorted[0];

      if (diffFromInt < 0.02) {
        if (badgeStatus) {
          badgeStatus.textContent = '🎯 정수 Bin 일치 (누설 0%)';
          badgeStatus.className = 'fft-status-badge match-exact';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>정수 Bin 일치:</strong> 입력 신호 주파수(${currentK.toFixed(1)} MHz)가 FFT Bin ${Math.round(currentK)}에 정확히 일치합니다. Sinc 함수의 영점(Zero-crossing)이 다른 모든 정수 Bin 위치와 완벽히 맞아떨어져, <strong>에너지의 100%가 단 1개의 Bin에 집중</strong>되며 주변 누설이 전혀 발생하지 않습니다.`;
        }
      } else if (Math.abs(diffFromInt - 0.5) < 0.03) {
        if (badgeStatus) {
          badgeStatus.textContent = '🌊 최악의 누설 (Scalloping Loss 최대)';
          badgeStatus.className = 'fft-status-badge match-leak-max';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>최대 스펙트럼 누설 (Worst-Case):</strong> 입력 주파수(${currentK.toFixed(2)} MHz)가 두 Bin(Bin ${Math.floor(currentK)}와 ${Math.ceil(currentK)})의 정중앙에 위치합니다. Sinc 피크가 양 Bin 사이에 걸치면서 피크 진폭이 1.0에서 <strong>0.64 (-3.92 dB Scalloping Loss)</strong>로 뚝 떨어지고, 에너지가 양옆 Bin들과 먼 사이드로브까지 넓게 퍼집니다.`;
        }
      } else {
        if (badgeStatus) {
          badgeStatus.textContent = `⚡ 스펙트럼 누설 진행 중 (${diffFromInt.toFixed(2)} Bin 오차)`;
          badgeStatus.className = 'fft-status-badge match-leak';
        }
        if (insightText) {
          insightText.innerHTML = `<strong>스펙트럼 누설(Spectral Leakage):</strong> 유한한 시간 윈도우로 잘라낸 신호의 끝부분이 불연속을 이루면서, 주파수 도메인에서 Sinc 함수 형태로 에너지가 인접 Bin들(Bin ${sorted.map(s => s.k).slice(0, 3).join(', ')})로 퍼져나갑니다.`;
        }
      }
    }

    // Set K Value and Re-render
    function setK(newK) {
      currentK = Math.max(1.0, Math.min(15.0, Math.round(newK * 100) / 100));
      sliderK.value = currentK.toFixed(2);
      if (inputK) inputK.value = currentK.toFixed(2);
      if (displayK) displayK.textContent = `${currentK.toFixed(2)} MHz`;

      drawSignal();
      drawSpectrum();
    }

    // Event Listeners
    sliderK.addEventListener('input', (e) => {
      setK(parseFloat(e.target.value));
      if (isSweeping) toggleSweep(false);
    });

    if (inputK) {
      inputK.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setK(val);
        if (isSweeping) toggleSweep(false);
      });
    }

    if (windowSelect) {
      windowSelect.addEventListener('change', (e) => {
        windowType = e.target.value;
        drawSignal();
        drawSpectrum();
      });
    }

    if (scaleSelect) {
      scaleSelect.addEventListener('change', (e) => {
        scaleType = e.target.value;
        drawSpectrum();
      });
    }

    // Canvas Hover Interaction for Spectrum
    canvasSpectrum.addEventListener('mousemove', (e) => {
      const rect = canvasSpectrum.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const padX = 42;
      const plotW = rect.width - padX * 2;
      const maxK = N / 2;

      const normX = (mouseX - padX) / plotW;
      if (normX >= 0 && normX <= 1) {
        const binIndex = Math.round(normX * maxK);
        if (binIndex !== hoveredBin) {
          hoveredBin = binIndex;
          drawSpectrum();
        }
      } else if (hoveredBin !== null) {
        hoveredBin = null;
        drawSpectrum();
      }
    });

    canvasSpectrum.addEventListener('mouseleave', () => {
      if (hoveredBin !== null) {
        hoveredBin = null;
        drawSpectrum();
      }
    });

    // Auto-Sweep Animation
    function toggleSweep(forceState) {
      isSweeping = typeof forceState === 'boolean' ? forceState : !isSweeping;
      if (btnPlay) {
        btnPlay.textContent = isSweeping ? '⏸ 자동 탐색 일시정지' : '🔄 자동 주파수 스위프';
        btnPlay.classList.toggle('active', isSweeping);
      }

      if (isSweeping) {
        let lastTime = performance.now();
        function sweepStep(now) {
          if (!isSweeping) return;
          const dt = (now - lastTime) / 1000;
          lastTime = now;

          let nextK = currentK + sweepDir * dt * 0.75;
          if (nextK >= 9.2) {
            nextK = 9.2;
            sweepDir = -1;
          } else if (nextK <= 7.8) {
            nextK = 7.8;
            sweepDir = 1;
          }
          setK(nextK);
          animId = requestAnimationFrame(sweepStep);
        }
        animId = requestAnimationFrame(sweepStep);
      } else if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => toggleSweep());
    }

    // Modern Web Guidance: Efficient Background Processing
    // Pause animation/rendering when off-screen using contentvisibilityautostatechange
    container.addEventListener('contentvisibilityautostatechange', (e) => {
      if (e.skipped) {
        if (isSweeping) toggleSweep(false);
      }
    });

    // Fallback IntersectionObserver for older browsers
    if (!('contentVisibility' in document.documentElement.style)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && isSweeping) {
            toggleSweep(false);
          }
        });
      }, { rootMargin: '200px' });
      observer.observe(container);
    }

    // Theme change observer
    const themeObserver = new MutationObserver(() => {
      drawSignal();
      drawSpectrum();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Window resize
    window.addEventListener('resize', () => {
      drawSignal();
      drawSpectrum();
    });

    // Initial Render
    setK(currentK);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeakageSimulator);
  } else {
    initLeakageSimulator();
  }
})();
