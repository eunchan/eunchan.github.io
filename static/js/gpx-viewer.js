/**
 * GPX Map Viewer for eunchan.kim
 * Powered by Leaflet & leaflet-gpx
 */
(function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function extractNotes(rawDesc) {
    if (!rawDesc) return '';

    // Check if onX key-value format (contains "name=" or "notes=" or "id=")
    if (/notes=/i.test(rawDesc) || /id=[0-9a-f-]{36}/i.test(rawDesc)) {
      const match = rawDesc.match(/notes=(.*?)(?=(?:\r?\n[a-z_]+=|[\r\n]*$))/is);
      if (match && match[1]) {
        return match[1].trim();
      }
      return '';
    }

    // Normal description: return trimmed text
    return rawDesc.trim();
  }

  function formatWaypointPopup(name, rawDesc) {
    const note = extractNotes(rawDesc);
    let html = '<div class="gpx-waypoint-popup">';
    html += '<div class="gpx-waypoint-title">📍 ' + escapeHtml(name) + '</div>';
    if (note) {
      html += '<div class="gpx-waypoint-notes">' + escapeHtml(note).replace(/\n/g, '<br>') + '</div>';
    }
    html += '</div>';
    return html;
  }

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

    // Custom SVG Waypoint Pin (Bottom tip exact at x=13, y=34)
    const wptIcon = L.divIcon({
      className: 'gpx-wpt-wrapper',
      html: `<div class="gpx-wpt-pin" title="경유지">
        <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.82 20.18 0 13 0Z" fill="#e11d48"/>
          <circle cx="13" cy="13" r="5" fill="#ffffff"/>
        </svg>
      </div>`,
      iconSize: [26, 34],
      iconAnchor: [13, 34], // Anchored precisely at bottom tip
      popupAnchor: [0, -32]
    });

    // Custom Start and End Markers (Circle badges centered at x=13, y=13)
    const startIcon = L.divIcon({
      className: 'gpx-marker-wrapper',
      html: '<div class="gpx-marker gpx-start-marker" title="출발점"><span>S</span></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -14]
    });

    const endIcon = L.divIcon({
      className: 'gpx-marker-wrapper',
      html: '<div class="gpx-marker gpx-end-marker" title="도착점"><span>E</span></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -14]
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

      // Stat elements
      const distEl = container.querySelector('[data-stat="distance"]');
      const eleGainEl = container.querySelector('[data-stat="elevation-gain"]');
      const eleMaxEl = container.querySelector('[data-stat="elevation-max"]');
      const timeEl = container.querySelector('[data-stat="moving-time"]');

      // Load GPX Track
      const gpx = new L.GPX(gpxSrc, {
        async: true,
        marker_options: {
          startIconUrl: null,
          endIconUrl: null,
          shadowUrl: null,
          wptIcons: { '': '' } // Prevents missing pin-icon-wpt.png 404
        },
        polyline_options: {
          color: trackColor,
          opacity: 0.95,
          weight: 4.5,
          lineCap: 'round',
          lineJoin: 'round'
        }
      });

      // Intercept and customize markers on creation
      gpx.on('addpoint', function (e) {
        if (e.point_type === 'waypoint') {
          e.point.setIcon(wptIcon);
          e.point.closePopup();

          const nameEl = e.element.getElementsByTagName('name');
          const name = nameEl.length ? nameEl[0].textContent : '';
          const descEl = e.element.getElementsByTagName('desc');
          const rawDesc = descEl.length ? descEl[0].textContent : '';

          const popupContent = formatWaypointPopup(name, rawDesc);
          e.point.bindPopup(popupContent, {
            offset: [0, -28],
            className: 'gpx-waypoint-custom-popup',
            autoPan: true
          });
        } else if (e.point_type === 'start') {
          e.point.setIcon(startIcon);
          e.point.bindPopup('<div class="gpx-waypoint-title">🟢 출발점 (Start)</div>', {
            offset: [0, -10],
            className: 'gpx-waypoint-custom-popup'
          });
        } else if (e.point_type === 'end') {
          e.point.setIcon(endIcon);
          e.point.bindPopup('<div class="gpx-waypoint-title">🏁 도착점 (Finish)</div>', {
            offset: [0, -10],
            className: 'gpx-waypoint-custom-popup'
          });
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

      // Fit bounds button
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
