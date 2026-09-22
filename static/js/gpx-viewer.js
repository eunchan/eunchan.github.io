/**
 * GPX Map Viewer for eunchan.kim
 * Powered by Leaflet & leaflet-gpx
 */
(function () {
  'use strict';

  function initGpxMaps() {
    if (typeof L === 'undefined' || typeof L.GPX === 'undefined') {
      setTimeout(initGpxMaps, 100);
      return;
    }

    const containers = document.querySelectorAll('.gpx-map-container:not([data-initialized="true"])');
    if (!containers.length) return;

    // Base Tile Layers
    const createTileLayers = () => ({
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      }),
      osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap'
      })
    });

    containers.forEach((container, index) => {
      container.setAttribute('data-initialized', 'true');

      const viewport = container.querySelector('.gpx-map-viewport');
      if (!viewport) return;

      const gpxSrc = container.getAttribute('data-gpx-src');
      if (!gpxSrc) return;

      const trackColor = container.getAttribute('data-track-color') || '#ff5722';
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

      // Assign unique ID if none
      if (!viewport.id) {
        viewport.id = 'gpx-viewport-' + index + '-' + Date.now();
      }

      // Initialize Map
      const layers = createTileLayers();
      const initialLayerKey = isDarkMode ? 'dark' : 'topo';
      let currentLayer = layers[initialLayerKey];

      const map = L.map(viewport.id, {
        layers: [currentLayer],
        scrollWheelZoom: false, // Prevent accidental scrolling
        zoomControl: true
      });

      // Layer Toggle Buttons
      const layerButtons = container.querySelectorAll('.gpx-layer-btn');
      layerButtons.forEach((btn) => {
        const layerKey = btn.getAttribute('data-layer');
        if (layerKey === initialLayerKey) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }

        btn.addEventListener('click', () => {
          if (layers[layerKey] && currentLayer !== layers[layerKey]) {
            map.removeLayer(currentLayer);
            currentLayer = layers[layerKey];
            map.addLayer(currentLayer);

            layerButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
          }
        });
      });

      // Custom Start and End Markers
      const startIcon = L.divIcon({
        className: 'gpx-marker-wrapper',
        html: '<div class="gpx-marker gpx-start-marker" title="출발점"><span>S</span></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const endIcon = L.divIcon({
        className: 'gpx-marker-wrapper',
        html: '<div class="gpx-marker gpx-end-marker" title="도착점"><span>E</span></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      // Stat elements
      const distEl = container.querySelector('[data-stat="distance"]');
      const eleGainEl = container.querySelector('[data-stat="elevation-gain"]');
      const eleMaxEl = container.querySelector('[data-stat="elevation-max"]');
      const timeEl = container.querySelector('[data-stat="moving-time"]');

      // Load GPX Track
      const gpx = new L.GPX(gpxSrc, {
        async: true,
        marker_options: {
          startIcon: startIcon,
          endIcon: endIcon,
          shadowUrl: null,
          wptIcons: {}
        },
        polyline_options: {
          color: trackColor,
          opacity: 0.95,
          weight: 4.5,
          lineCap: 'round',
          lineJoin: 'round'
        }
      });

      gpx.on('loaded', function (e) {
        map.fitBounds(e.target.getBounds(), {
          padding: [35, 35]
        });

        // 1. Distance
        const distMeters = e.target.get_distance();
        if (distMeters && distEl) {
          const km = distMeters / 1000;
          const miles = km * 0.621371;
          distEl.textContent = `${km.toFixed(1)} km (${miles.toFixed(1)} mi)`;
        }

        // 2. Elevation Gain & Max
        const gainMeters = e.target.get_elevation_gain();
        const maxMeters = e.target.get_elevation_max();
        if (gainMeters > 0 && eleGainEl) {
          eleGainEl.textContent = `+${Math.round(gainMeters).toLocaleString()} m`;
          const parentItem = eleGainEl.closest('.gpx-stat-item');
          if (parentItem) parentItem.style.display = 'flex';
        }
        if (maxMeters > 0 && eleMaxEl) {
          eleMaxEl.textContent = `${Math.round(maxMeters).toLocaleString()} m`;
          const parentItem = eleMaxEl.closest('.gpx-stat-item');
          if (parentItem) parentItem.style.display = 'flex';
        }

        // 3. Moving Time
        const durationTotal = e.target.get_total_time();
        if (durationTotal > 0 && timeEl) {
          const hours = Math.floor(durationTotal / 3600000);
          const mins = Math.round((durationTotal % 3600000) / 60000);
          timeEl.textContent = `${hours}시간 ${mins}분`;
          const parentItem = timeEl.closest('.gpx-stat-item');
          if (parentItem) parentItem.style.display = 'flex';
        }
      });

      gpx.on('error', function (err) {
        console.error('Failed to load GPX track:', err);
        if (distEl) distEl.textContent = 'GPX 로딩 실패';
      });

      gpx.addTo(map);

      // Fit bounds button if present
      const resetBtn = container.querySelector('.gpx-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          map.fitBounds(gpx.getBounds(), { padding: [35, 35] });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGpxMaps);
  } else {
    initGpxMaps();
  }
})();
