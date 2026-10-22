/**
 * FFT Concept Visualizer: Rotating Compass & Frequency Resonance
 * Illustrates Euler's formula, rotating phasors, signal correlation, and frequency detection.
 */

(function () {
  'use strict';

  function initFFTVisualizer() {
    const container = document.getElementById('fft-visualizer-app');
    if (!container) return;

    // Elements
    const canvasSignal = container.querySelector('#fft-canvas-signal');
    const canvasCompass = container.querySelector('#fft-canvas-compass');
    const canvasSpectrum = container.querySelector('#fft-canvas-spectrum');

    if (!canvasSignal || !canvasCompass || !canvasSpectrum) return;

    const ctxSignal = canvasSignal.getContext('2d');
    const ctxCompass = canvasCompass.getContext('2d');
    const ctxSpectrum = canvasSpectrum.getContext('2d');

    const btnPlay = container.querySelector('#fft-btn-play');
    const btnAutoSweep = container.querySelector('#fft-btn-sweep');
    const selectSignal = container.querySelector('#fft-signal-select');
    const sliderFreq = container.querySelector('#fft-freq-slider');
    const freqDisplay = container.querySelector('#fft-freq-display');
    const statusBadge = container.querySelector('#fft-status-badge');
    const metaSignal = container.querySelector('#fft-meta-signal');
    const metaCompass = container.querySelector('#fft-meta-compass');
    const metaSpectrum = container.querySelector('#fft-meta-spectrum');
    const insightText = container.querySelector('#fft-insight-text');
    const presetChips = container.querySelectorAll('.preset-chip');

    // State
    let isPlaying = true;
    let isAutoSweep = true;
    let probeFreq = 2.0; // Current probe frequency in Hz
    let sweepSpeed = 0.008; // Hz per frame in auto sweep
    let sweepDir = 1;
    let animFrameId = null;
    let time = 0; // Simulation time in seconds
    let signalPreset = 'composite'; // 'composite', 'single', 'square', 'noisy'

    // Signal presets definition
    const PRESETS = {
      composite: {
        name: '합성파 (2.0Hz + 5.0Hz)',
        formula: 'x(t) = 1.0·cos(2π·2t) + 0.7·cos(2π·5t)',
        peaks: [2.0, 5.0],
        func: (t) => Math.cos(2 * Math.PI * 2.0 * t) + 0.7 * Math.cos(2 * Math.PI * 5.0 * t),
        chips: [
          { freq: 2.0, label: '2.0 Hz (피크)' },
          { freq: 3.5, label: '3.5 Hz (상쇄)' },
          { freq: 5.0, label: '5.0 Hz (피크)' }
        ]
      },
      single: {
        name: '단일 사인파 (3.0Hz)',
        formula: 'x(t) = 1.2·cos(2π·3t)',
        peaks: [3.0],
        func: (t) => 1.2 * Math.cos(2 * Math.PI * 3.0 * t),
        chips: [
          { freq: 1.5, label: '1.5 Hz (불일치)' },
          { freq: 3.0, label: '3.0 Hz (공진 피크)' },
          { freq: 4.5, label: '4.5 Hz (불일치)' }
        ]
      },
      square: {
        name: '구형파 고조파 (1.5Hz + 4.5Hz + 7.5Hz)',
        formula: 'x(t) ≈ 기본파(1.5Hz) + 3차(4.5Hz) + 5차(7.5Hz)',
        peaks: [1.5, 4.5, 7.5],
        func: (t) => {
          return 1.1 * (Math.cos(2 * Math.PI * 1.5 * t) +
            (1 / 3) * Math.cos(2 * Math.PI * 4.5 * t) +
            (1 / 5) * Math.cos(2 * Math.PI * 7.5 * t));
        },
        chips: [
          { freq: 1.5, label: '1.5 Hz (기본파)' },
          { freq: 4.5, label: '4.5 Hz (3차 고조파)' },
          { freq: 7.5, label: '7.5 Hz (5차 고조파)' }
        ]
      },
      noisy: {
        name: '노이즈 속 단일 신호 (2.5Hz)',
        formula: 'x(t) = 1.0·cos(2π·2.5t) + noise',
        peaks: [2.5],
        func: (t) => {
          // Deterministic pseudorandom noise based on time
          const noise = 0.35 * Math.sin(t * 71.3) * Math.cos(t * 133.7);
          return Math.cos(2 * Math.PI * 2.5 * t) + noise;
        },
        chips: [
          { freq: 1.5, label: '1.5 Hz (노이즈)' },
          { freq: 2.5, label: '2.5 Hz (신호 검출)' },
          { freq: 4.0, label: '4.0 Hz (노이즈)' }
        ]
      }
    };

    // Color extraction helper (theme aware)
    function getThemeColors() {
      const style = window.getComputedStyle(container);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      return {
        isDark,
        bg: style.getPropertyValue('--code-bg').trim() || (isDark ? '#252525' : '#f8fafc'),
        cardBg: style.getPropertyValue('--card-bg').trim() || '#ffffff',
        border: style.getPropertyValue('--border-color').trim() || '#e2e8f0',
        text: style.getPropertyValue('--text-color').trim() || '#333333',
        textMuted: style.getPropertyValue('--text-muted').trim() || '#757575',
        primary: style.getPropertyValue('--primary').trim() || '#037c6e',
        accent: '#e65100', // Bright orange for resonance
        accentCyan: '#0288d1', // Real axis / cosine
        accentPurple: '#7b1fa2', // Imag axis / sine
        grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'
      };
    }

    // HiDPI Canvas setup helper
    function resizeCanvas(canvas) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      return { width: w, height: h, dpr };
    }

    // Precalculate Discrete Fourier Transform magnitude for frequency range
    function computeSpectrum(presetKey) {
      const preset = PRESETS[presetKey];
      const freqs = [];
      const magnitudes = [];
      const minF = 0.2;
      const maxF = 8.0;
      const steps = 180;
      const T_obs = 3.0; // Observation window
      const dt = 0.005;
      const N = Math.floor(T_obs / dt);

      for (let s = 0; s <= steps; s++) {
        const f = minF + (s / steps) * (maxF - minF);
        freqs.push(f);

        let sumRe = 0;
        let sumIm = 0;
        for (let i = 0; i < N; i++) {
          const tau = i * dt;
          const val = preset.func(tau);
          const angle = -2 * Math.PI * f * tau;
          sumRe += val * Math.cos(angle);
          sumIm += val * Math.sin(angle);
        }
        sumRe /= N;
        sumIm /= N;
        const mag = 2 * Math.sqrt(sumRe * sumRe + sumIm * sumIm);
        magnitudes.push(mag);
      }

      return { freqs, magnitudes, minF, maxF };
    }

    let cachedSpectrum = computeSpectrum(signalPreset);

    // Update preset chips buttons in UI
    function updateChipsUI() {
      const preset = PRESETS[signalPreset];
      const chipsContainer = container.querySelector('#fft-preset-chips');
      if (!chipsContainer) return;

      chipsContainer.innerHTML = '';
      preset.chips.forEach((c) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preset-chip' + (Math.abs(probeFreq - c.freq) < 0.15 ? ' active' : '');
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
          probeFreq = c.freq;
          sliderFreq.value = c.freq.toFixed(2);
          freqDisplay.textContent = `${c.freq.toFixed(2)} Hz`;
          isAutoSweep = false;
          btnAutoSweep.classList.remove('active');
          btnAutoSweep.textContent = '🔄 자동 탐색';
          updateChipsUI();
        });
        chipsContainer.appendChild(btn);
      });
    }

    // --- DRAW PANEL 1: Input Signal in Black Box ---
    function drawSignalPanel(colors) {
      const { width: w, height: h, dpr } = resizeCanvas(canvasSignal);
      ctxSignal.save();
      ctxSignal.scale(dpr, dpr);

      // Background
      ctxSignal.fillStyle = colors.bg;
      ctxSignal.fillRect(0, 0, w, h);

      // Black Box Frame & Grid
      const padX = 14;
      const padY = 16;
      const plotW = w - padX * 2;
      const plotH = h - padY * 2;
      const midY = padY + plotH / 2;

      // Center baseline
      ctxSignal.strokeStyle = colors.grid;
      ctxSignal.lineWidth = 1;
      ctxSignal.beginPath();
      ctxSignal.moveTo(padX, midY);
      ctxSignal.lineTo(padX + plotW, midY);
      ctxSignal.stroke();

      // Time span shown: 2.0 seconds
      const timeWindow = 2.0;
      const preset = PRESETS[signalPreset];

      // Draw scrolling waveform
      ctxSignal.beginPath();
      ctxSignal.strokeStyle = colors.primary;
      ctxSignal.lineWidth = 2.2;
      ctxSignal.lineJoin = 'round';

      const samples = 140;
      for (let i = 0; i < samples; i++) {
        const px = padX + (i / (samples - 1)) * plotW;
        // Current sample time moves with 'time'
        const tSample = time - timeWindow + (i / (samples - 1)) * timeWindow;
        const val = preset.func(tSample);
        // Scale val (-2.0 ~ 2.0 mapped to plotH)
        const py = midY - (val / 2.5) * (plotH * 0.45);
        if (i === 0) ctxSignal.moveTo(px, py);
        else ctxSignal.lineTo(px, py);
      }
      ctxSignal.stroke();

      // Current probe sampling cursor (at rightmost point x(t))
      const currentVal = preset.func(time);
      const curX = padX + plotW;
      const curY = midY - (currentVal / 2.5) * (plotH * 0.45);

      // Glow pulse
      ctxSignal.fillStyle = colors.accent;
      ctxSignal.beginPath();
      ctxSignal.arc(curX - 2, curY, 5, 0, Math.PI * 2);
      ctxSignal.fill();

      // Annotation text inside canvas
      ctxSignal.fillStyle = colors.textMuted;
      ctxSignal.font = '11px sans-serif';
      ctxSignal.fillText('x(t) 입력 신호', padX + 6, padY + 14);

      ctxSignal.font = '11px monospace';
      ctxSignal.fillStyle = colors.text;
      ctxSignal.fillText(`val = ${currentVal.toFixed(2)}`, padX + 6, h - padY - 4);

      // "Black Box" watermark in corner
      ctxSignal.textAlign = 'right';
      ctxSignal.fillStyle = colors.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
      ctxSignal.font = 'bold 12px monospace';
      ctxSignal.fillText('[ SYSTEM IN ]', w - padX - 4, padY + 14);
      ctxSignal.textAlign = 'left';

      ctxSignal.restore();
    }

    // --- DRAW PANEL 2: Rotating Compass & Euler Phasor ---
    function drawCompassPanel(colors) {
      const { width: w, height: h, dpr } = resizeCanvas(canvasCompass);
      ctxCompass.save();
      ctxCompass.scale(dpr, dpr);

      ctxCompass.fillStyle = colors.bg;
      ctxCompass.fillRect(0, 0, w, h);

      const cx = w * 0.48;
      const cy = h * 0.5;
      const radius = Math.min(cx, cy) - 22;

      // Compass dial ring
      ctxCompass.strokeStyle = colors.border;
      ctxCompass.lineWidth = 1.5;
      ctxCompass.beginPath();
      ctxCompass.arc(cx, cy, radius, 0, Math.PI * 2);
      ctxCompass.stroke();

      // Inner faint circles
      ctxCompass.strokeStyle = colors.grid;
      ctxCompass.beginPath();
      ctxCompass.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
      ctxCompass.stroke();

      // Orthogonal Axes (X: Real / Cosine, Y: Imag / Sine)
      ctxCompass.beginPath();
      ctxCompass.moveTo(cx - radius - 8, cy);
      ctxCompass.lineTo(cx + radius + 8, cy);
      ctxCompass.moveTo(cx, cy - radius - 8);
      ctxCompass.lineTo(cx, cy + radius + 8);
      ctxCompass.stroke();

      // Axis labels
      ctxCompass.fillStyle = colors.textMuted;
      ctxCompass.font = '10px monospace';
      ctxCompass.fillText('Re (+X: cos)', cx + radius - 30, cy - 6);
      ctxCompass.fillText('Im (+Y: -sin)', cx + 6, cy - radius + 12);

      // Compute trail of points wound around the compass
      // Winding trail over recent window of duration T_obs
      const preset = PRESETS[signalPreset];
      const trailPoints = 120;
      const T_trail = 1.6; // duration in seconds
      const dt = T_trail / trailPoints;

      let sumX = 0;
      let sumY = 0;

      ctxCompass.beginPath();
      ctxCompass.strokeStyle = colors.isDark ? 'rgba(77, 182, 172, 0.45)' : 'rgba(38, 166, 154, 0.35)';
      ctxCompass.lineWidth = 1.5;

      for (let i = 0; i < trailPoints; i++) {
        const tau = time - T_trail + i * dt;
        const sigVal = preset.func(tau);
        const theta = -2 * Math.PI * probeFreq * tau;

        const vx = sigVal * Math.cos(theta);
        const vy = sigVal * Math.sin(theta);

        sumX += vx;
        sumY += vy;

        const px = cx + (vx / 2.4) * radius;
        const py = cy + (vy / 2.4) * radius;

        if (i === 0) ctxCompass.moveTo(px, py);
        else ctxCompass.lineTo(px, py);
      }
      ctxCompass.stroke();

      // Center of Mass (적분 / 평균 벡터 Z)
      const avgX = sumX / trailPoints;
      const avgY = sumY / trailPoints;
      const mag = Math.sqrt(avgX * avgX + avgY * avgY);
      const isResonant = mag > 0.32; // Resonance threshold

      const comPx = cx + (avgX / 2.4) * radius;
      const comPy = cy + (avgY / 2.4) * radius;

      // Draw Center of Mass vector from origin (0, 0)
      ctxCompass.beginPath();
      ctxCompass.lineWidth = isResonant ? 3.5 : 2;
      ctxCompass.strokeStyle = isResonant ? colors.accent : colors.primary;
      ctxCompass.moveTo(cx, cy);
      ctxCompass.lineTo(comPx, comPy);
      ctxCompass.stroke();

      // Center of Mass Head
      ctxCompass.fillStyle = isResonant ? colors.accent : colors.primary;
      ctxCompass.beginPath();
      ctxCompass.arc(comPx, comPy, isResonant ? 6 : 4, 0, Math.PI * 2);
      ctxCompass.fill();

      // Instantaneous rotating compass needle (current time)
      const curTheta = -2 * Math.PI * probeFreq * time;
      const needleLength = radius * 0.95;
      const nx = cx + Math.cos(curTheta) * needleLength;
      const ny = cy + Math.sin(curTheta) * needleLength;

      // Reference rotating needle (thin dashed)
      ctxCompass.save();
      ctxCompass.setLineDash([3, 3]);
      ctxCompass.strokeStyle = colors.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
      ctxCompass.lineWidth = 1;
      ctxCompass.beginPath();
      ctxCompass.moveTo(cx, cy);
      ctxCompass.lineTo(nx, ny);
      ctxCompass.stroke();
      ctxCompass.restore();

      // Compass needle pivot
      ctxCompass.fillStyle = colors.text;
      ctxCompass.beginPath();
      ctxCompass.arc(cx, cy, 3, 0, Math.PI * 2);
      ctxCompass.fill();

      // Resonance indicator text
      ctxCompass.font = 'bold 11px sans-serif';
      if (isResonant) {
        ctxCompass.fillStyle = colors.accent;
        ctxCompass.fillText('★ 공진 (중심 이동)', cx - radius + 4, h - 8);
      } else {
        ctxCompass.fillStyle = colors.textMuted;
        ctxCompass.fillText('중심 ≈ (0, 0) 상쇄', cx - radius + 4, h - 8);
      }

      ctxCompass.restore();

      return { isResonant, mag };
    }

    // --- DRAW PANEL 3: Frequency Spectrum & Scanner ---
    function drawSpectrumPanel(colors) {
      const { width: w, height: h, dpr } = resizeCanvas(canvasSpectrum);
      ctxSpectrum.save();
      ctxSpectrum.scale(dpr, dpr);

      ctxSpectrum.fillStyle = colors.bg;
      ctxSpectrum.fillRect(0, 0, w, h);

      const padL = 28;
      const padR = 16;
      const padTop = 24;
      const padBtm = 26;
      const plotW = w - padL - padR;
      const plotH = h - padTop - padBtm;
      const baseLineY = padTop + plotH;

      // Axis lines
      ctxSpectrum.strokeStyle = colors.border;
      ctxSpectrum.lineWidth = 1;
      ctxSpectrum.beginPath();
      ctxSpectrum.moveTo(padL, baseLineY);
      ctxSpectrum.lineTo(padL + plotW, baseLineY);
      ctxSpectrum.moveTo(padL, padTop);
      ctxSpectrum.lineTo(padL, baseLineY);
      ctxSpectrum.stroke();

      // Frequency tick marks (1 to 7 Hz)
      ctxSpectrum.fillStyle = colors.textMuted;
      ctxSpectrum.font = '10px monospace';
      ctxSpectrum.textAlign = 'center';
      for (let f = 1; f <= 7; f++) {
        const tx = padL + ((f - cachedSpectrum.minF) / (cachedSpectrum.maxF - cachedSpectrum.minF)) * plotW;
        ctxSpectrum.fillText(`${f}k`, tx, baseLineY + 14);

        ctxSpectrum.strokeStyle = colors.grid;
        ctxSpectrum.beginPath();
        ctxSpectrum.moveTo(tx, baseLineY);
        ctxSpectrum.lineTo(tx, padTop);
        ctxSpectrum.stroke();
      }

      // Draw Spectrum Curve / Area
      const { freqs, magnitudes } = cachedSpectrum;
      const maxMag = 1.6;

      ctxSpectrum.beginPath();
      ctxSpectrum.moveTo(padL, baseLineY);

      for (let i = 0; i < freqs.length; i++) {
        const fx = padL + ((freqs[i] - cachedSpectrum.minF) / (cachedSpectrum.maxF - cachedSpectrum.minF)) * plotW;
        const fy = baseLineY - (magnitudes[i] / maxMag) * plotH;
        ctxSpectrum.lineTo(fx, fy);
      }
      ctxSpectrum.lineTo(padL + plotW, baseLineY);
      ctxSpectrum.closePath();

      // Gradient Fill
      const grad = ctxSpectrum.createLinearGradient(0, padTop, 0, baseLineY);
      grad.addColorStop(0, colors.isDark ? 'rgba(38, 166, 154, 0.45)' : 'rgba(3, 124, 110, 0.35)');
      grad.addColorStop(1, 'rgba(3, 124, 110, 0.02)');
      ctxSpectrum.fillStyle = grad;
      ctxSpectrum.fill();

      // Outline
      ctxSpectrum.strokeStyle = colors.primary;
      ctxSpectrum.lineWidth = 2;
      ctxSpectrum.beginPath();
      for (let i = 0; i < freqs.length; i++) {
        const fx = padL + ((freqs[i] - cachedSpectrum.minF) / (cachedSpectrum.maxF - cachedSpectrum.minF)) * plotW;
        const fy = baseLineY - (magnitudes[i] / maxMag) * plotH;
        if (i === 0) ctxSpectrum.moveTo(fx, fy);
        else ctxSpectrum.lineTo(fx, fy);
      }
      ctxSpectrum.stroke();

      // Active Probe Frequency Cursor (Vertical Line)
      const curFx = padL + ((probeFreq - cachedSpectrum.minF) / (cachedSpectrum.maxF - cachedSpectrum.minF)) * plotW;

      ctxSpectrum.strokeStyle = colors.accent;
      ctxSpectrum.lineWidth = 2;
      ctxSpectrum.setLineDash([4, 3]);
      ctxSpectrum.beginPath();
      ctxSpectrum.moveTo(curFx, padTop - 6);
      ctxSpectrum.lineTo(curFx, baseLineY);
      ctxSpectrum.stroke();
      ctxSpectrum.setLineDash([]);

      // Top pointer / frequency badge on cursor
      ctxSpectrum.fillStyle = colors.accent;
      ctxSpectrum.beginPath();
      ctxSpectrum.arc(curFx, padTop - 6, 4, 0, Math.PI * 2);
      ctxSpectrum.fill();

      ctxSpectrum.font = 'bold 10px monospace';
      ctxSpectrum.fillStyle = colors.accent;
      ctxSpectrum.textAlign = 'center';
      ctxSpectrum.fillText(`${probeFreq.toFixed(1)}Hz`, Math.max(padL + 20, Math.min(padL + plotW - 20, curFx)), padTop - 12);

      // Label
      ctxSpectrum.textAlign = 'left';
      ctxSpectrum.fillStyle = colors.textMuted;
      ctxSpectrum.font = '10px sans-serif';
      ctxSpectrum.fillText('주파수 스펙트럼 |X(f)|', padL + 4, padTop + 12);

      ctxSpectrum.restore();
    }

    // Spectrum canvas click: jump probe frequency directly!
    canvasSpectrum.addEventListener('click', (evt) => {
      const rect = canvasSpectrum.getBoundingClientRect();
      const clickX = evt.clientX - rect.left;
      const padL = 28;
      const padR = 16;
      const plotW = rect.width - padL - padR;

      if (clickX >= padL && clickX <= padL + plotW) {
        const ratio = (clickX - padL) / plotW;
        const clickedFreq = cachedSpectrum.minF + ratio * (cachedSpectrum.maxF - cachedSpectrum.minF);
        probeFreq = Math.round(clickedFreq * 20) / 20; // 0.05 step
        sliderFreq.value = probeFreq.toFixed(2);
        freqDisplay.textContent = `${probeFreq.toFixed(2)} Hz`;
        isAutoSweep = false;
        btnAutoSweep.classList.remove('active');
        btnAutoSweep.textContent = '🔄 자동 탐색';
        updateChipsUI();
      }
    });

    // Update dynamic educational text
    function updateInsightText(isResonant, mag) {
      const preset = PRESETS[signalPreset];
      const nearPeak = preset.peaks.find((p) => Math.abs(p - probeFreq) < 0.25);

      if (nearPeak) {
        statusBadge.textContent = `✨ ${nearPeak.toFixed(1)} Hz 공진 감지!`;
        statusBadge.className = 'fft-status-badge active-resonance';
        insightText.innerHTML = `<strong>🎯 [공진(Resonance) 발생!]</strong> 나침반의 회전 주기(<strong>${probeFreq.toFixed(2)} Hz</strong>)가 신호 속 <strong>${nearPeak.toFixed(1)} Hz</strong> 성분과 일치합니다. 나침반 바늘의 투영 벡터가 한 방향으로 지속적으로 누적되어 중심점(적분값)이 원점에서 크게 멀어집니다. 이것이 푸리에 변환이 특정 주파수를 짚어내는 원리입니다.`;
      } else {
        statusBadge.textContent = '주파수 탐색 중...';
        statusBadge.className = 'fft-status-badge';
        insightText.innerHTML = `<strong>🔄 [주파수 불일치]</strong> 나침반 회전 주기(<strong>${probeFreq.toFixed(2)} Hz</strong>)가 신호 주파수와 어긋납니다. 나침반 바늘이 360도 전 방향으로 골고루 흩어져 서로 상쇄(Cancel-out)되므로, 중심점 합계(적분값: ${mag.toFixed(2)})는 0 근처에 머뭅니다.`;
      }

      metaSignal.textContent = `t=${time.toFixed(1)}s`;
      metaCompass.textContent = `f=${probeFreq.toFixed(2)}Hz`;
      metaSpectrum.textContent = `진폭: ${(mag * 2).toFixed(2)}`;
    }

    // Main animation loop
    function animate() {
      if (!isPlaying) return;

      time += 0.016; // Advance simulated time (~60fps)

      // Auto sweep frequency logic
      if (isAutoSweep) {
        probeFreq += sweepSpeed * sweepDir;
        if (probeFreq >= 7.6) {
          probeFreq = 7.6;
          sweepDir = -1;
        } else if (probeFreq <= 0.6) {
          probeFreq = 0.6;
          sweepDir = 1;
        }
        sliderFreq.value = probeFreq.toFixed(2);
        freqDisplay.textContent = `${probeFreq.toFixed(2)} Hz`;
        updateChipsUI();
      }

      const colors = getThemeColors();

      drawSignalPanel(colors);
      const { isResonant, mag } = drawCompassPanel(colors);
      drawSpectrumPanel(colors);

      updateInsightText(isResonant, mag);

      animFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!animFrameId) {
        isPlaying = true;
        animFrameId = requestAnimationFrame(animate);
      }
    }

    function stopAnimation() {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }

    // UI Event Handlers
    btnPlay.addEventListener('click', () => {
      isPlaying = !isPlaying;
      btnPlay.innerHTML = isPlaying ? '⏸ 일시정지' : '▶ 재생';
      if (isPlaying) startAnimation();
      else stopAnimation();
    });

    btnAutoSweep.addEventListener('click', () => {
      isAutoSweep = !isAutoSweep;
      if (isAutoSweep) {
        btnAutoSweep.classList.add('active');
        btnAutoSweep.textContent = '🔄 자동 탐색 중';
        if (!isPlaying) {
          isPlaying = true;
          btnPlay.innerHTML = '⏸ 일시정지';
          startAnimation();
        }
      } else {
        btnAutoSweep.classList.remove('active');
        btnAutoSweep.textContent = '🔄 자동 탐색';
      }
    });

    selectSignal.addEventListener('change', (e) => {
      signalPreset = e.target.value;
      cachedSpectrum = computeSpectrum(signalPreset);
      updateChipsUI();
    });

    sliderFreq.addEventListener('input', (e) => {
      probeFreq = parseFloat(e.target.value);
      freqDisplay.textContent = `${probeFreq.toFixed(2)} Hz`;
      // User manual adjustment pauses auto sweep
      isAutoSweep = false;
      btnAutoSweep.classList.remove('active');
      btnAutoSweep.textContent = '🔄 자동 탐색';
      updateChipsUI();
    });

    // Handle Modern Web Guidance: Efficient Background Processing
    // 1. contentvisibilityautostatechange event (Direct listener on heavy-component)
    container.addEventListener('contentvisibilityautostatechange', (event) => {
      if (event.skipped) {
        stopAnimation();
      } else if (isPlaying) {
        startAnimation();
      }
    });

    // 2. Fallback using IntersectionObserver for older browsers
    const isSupported = 'contentVisibility' in document.documentElement.style;
    if (!isSupported) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && isPlaying) {
              startAnimation();
            } else {
              stopAnimation();
            }
          });
        },
        { rootMargin: '200px' }
      );
      observer.observe(container);
    }

    // Handle window resize smoothly
    window.addEventListener('resize', () => {
      if (!isPlaying) {
        const colors = getThemeColors();
        drawSignalPanel(colors);
        drawCompassPanel(colors);
        drawSpectrumPanel(colors);
      }
    });

    // Initialize Chips UI & Start
    updateChipsUI();
    startAnimation();
  }

  // Ensure DOM is ready before init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFFTVisualizer);
  } else {
    initFFTVisualizer();
  }
})();
