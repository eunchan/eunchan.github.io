/**
 * SkyMap: Modular map controller for Nightsky observation sites.
 *
 * Implements an adapter pattern so the underlying map provider (Leaflet, Google Maps, etc.)
 * can be swapped without touching page markup, data attributes, or UI buttons.
 */
class LeafletAdapter {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.markers = [];
    this.featureGroup = null;
  }

  init(places) {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded.');
      return;
    }

    // Set local icon path
    if (L.Icon.Default.prototype.options) {
      L.Icon.Default.prototype.options.imagePath = '/vendor/leaflet/images/';
    }

    this.map = L.map(this.containerId, {
      scrollWheelZoom: false,
    });

    // Standard OpenStreetMap tile layer (zero API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.featureGroup = L.featureGroup().addTo(this.map);
    this.markers = [];

    function createSkyPin(place) {
      const pinColor = '#0f766e';
      return L.divIcon({
        className: 'sky-pin-wrapper',
        html: `
          <div class="sky-pin" title="${place.title}">
            <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.2 10.8 28.8 11.37 29.3C11.74 29.6 12.26 29.6 12.63 29.3C13.2 28.8 24 20.2 24 12C24 5.37258 18.6274 0 12 0Z" fill="${pinColor}"/>
              <circle cx="12" cy="11.5" r="4.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [24, 30],
        iconAnchor: [12, 30],
        popupAnchor: [0, -28],
      });
    }

    places.forEach((place) => {
      if (place.lat == null || place.lng == null) return;

      const popupContent = `
        <div class="sky-popup">
          <h4 class="sky-popup-title"><a href="${place.url}">${place.title}</a></h4>
          ${place.bright ? `<p class="sky-popup-meta"><strong>밝기:</strong> Bortle ${place.bright}</p>` : ''}
          ${place.descript ? `<p class="sky-popup-desc">${place.descript}</p>` : ''}
          <div class="sky-popup-link"><a href="${place.url}">장소 관측지 정보 &rarr;</a></div>
        </div>
      `;

      const marker = L.marker([place.lat, place.lng], {
        icon: createSkyPin(place),
      }).bindPopup(popupContent);
      marker.addTo(this.featureGroup);
      this.markers.push({ place, marker });
    });

    this.fitAll();
  }

  fitAll() {
    if (this.markers.length > 0) {
      this.map.fitBounds(this.featureGroup.getBounds(), {
        padding: [40, 40],
        maxZoom: 11,
      });
    }
  }

  showRegion(regionKey) {
    if (!this.map) return;
    if (regionKey === 'kr') {
      // Korea sites (양평 벗고개, 공림사, 용인)
      this.map.setView([37.0, 127.6], 8, { animate: true });
    } else if (regionKey === 'us') {
      // US California sites (Big Sur, Lake Tahoe, San Jose)
      this.map.setView([37.7, -120.8], 7, { animate: true });
    } else {
      this.fitAll();
    }
  }
}

class SkyMapController {
  constructor(options = {}) {
    this.containerId = options.containerId || 'sky-map';
    this.dataElementId = options.dataElementId || 'sky-places-data';
    this.buttonsContainerId = options.buttonsContainerId || 'sky-map-controls';
    this.adapter = new LeafletAdapter(this.containerId, options);
  }

  init() {
    const container = document.getElementById(this.containerId);
    const dataEl = document.getElementById(this.dataElementId);
    if (!container || !dataEl) return;

    let places = [];
    try {
      places = JSON.parse(dataEl.textContent || '[]');
    } catch (e) {
      console.error('Failed to parse sky places data:', e);
      return;
    }

    this.adapter.init(places);
    this.setupButtons();
  }

  setupButtons() {
    const controls = document.getElementById(this.buttonsContainerId);
    if (!controls) return;

    const buttons = controls.querySelectorAll('button[data-region]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const region = btn.getAttribute('data-region');
        this.adapter.showRegion(region);
      });
    });
  }
}

window.SkyMap = {
  Controller: SkyMapController,
  LeafletAdapter: LeafletAdapter,
  init: (options) => {
    const controller = new SkyMapController(options);
    controller.init();
    return controller;
  },
};
