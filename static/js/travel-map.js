/**
 * TravelMap: Interactive World Map and Chronological Journey Timeline Controller
 */
(function () {
  function initTravel() {
    const dataEl = document.getElementById('travel-places-data');
    if (!dataEl) return;

    let trips = [];
    try {
      trips = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error('Failed to parse travel places data:', e);
      return;
    }

    if (!Array.isArray(trips) || trips.length === 0) return;

    // 1. Sort trips chronologically (past -> present: 2006 -> 2023)
    trips.sort(function (a, b) {
      const da = a.date || '2000-01-01';
      const db = b.date || '2000-01-01';
      return da.localeCompare(db);
    });

    // 2. Render Featured Epic Series
    renderFeaturedSeries(trips);

    // 3. Render Chronological Timeline
    renderTimeline(trips);

    // 4. Initialize Leaflet Map
    initMap(trips);
  }

  function renderFeaturedSeries(trips) {
    const container = document.getElementById('featured-cards-grid');
    if (!container) return;

    const featured = trips.filter(function (t) {
      return t.featured === true;
    });

    if (featured.length === 0) {
      const sec = document.getElementById('featured-series');
      if (sec) sec.style.display = 'none';
      return;
    }

    container.innerHTML = featured
      .map(function (t) {
        const bgStyle = t.image
          ? `background-image: url('${t.image}');`
          : 'background-color: var(--code-bg);';
        return `
        <article class="featured-card">
          <a href="${t.permalink}" class="featured-card-media" style="${bgStyle}" aria-label="${t.title}">
            ${t.badge ? `<span class="featured-card-badge">${t.badge}</span>` : ''}
          </a>
          <div class="featured-card-content">
            <div class="featured-card-meta">
              <span class="meta-country">${t.country}</span>
              <span class="meta-period">${t.period || ''}</span>
            </div>
            <h3 class="featured-card-title"><a href="${t.permalink}">${t.title}</a></h3>
            <p class="featured-card-summary">${t.summary || ''}</p>
            <div class="featured-card-footer">
              <a href="${t.permalink}" class="featured-btn">시리즈 정주행하기 &rarr;</a>
            </div>
          </div>
        </article>
      `;
      })
      .join('');
  }

  function renderTimeline(trips) {
    const container = document.getElementById('travel-timeline');
    if (!container) return;

    container.innerHTML = trips
      .map(function (t) {
        const year = t.date ? t.date.slice(0, 4) : '';
        const hasImg = Boolean(t.image);
        const bgStyle = hasImg ? `background-image: url('${t.image}');` : '';

        return `
        <div class="timeline-item" id="trip-${t.id}">
          <div class="timeline-marker">
            <span class="timeline-dot"></span>
            <span class="timeline-year">${year}</span>
          </div>
          <div class="timeline-card">
            ${
              hasImg
                ? `
            <a href="${t.permalink}" class="timeline-card-thumb" style="${bgStyle}" aria-label="${t.title}">
              ${t.badge ? `<span class="timeline-badge">${t.badge}</span>` : ''}
            </a>`
                : ''
            }
            <div class="timeline-card-body">
              <div class="timeline-meta">
                <span class="timeline-country">${t.country}</span>
                <span class="timeline-period">${t.period || t.date}</span>
                ${!hasImg && t.badge ? `<span class="timeline-badge-inline">${t.badge}</span>` : ''}
              </div>
              <h3 class="timeline-title"><a href="${t.permalink}">${t.title}</a></h3>
              ${t.location ? `<div class="timeline-location">📍 ${t.location}</div>` : ''}
              <p class="timeline-desc">${t.summary || ''}</p>
              <div class="timeline-actions">
                <a href="${t.permalink}" class="timeline-btn-primary">여행기 읽기 &rarr;</a>
                ${
                  t.lat && t.lng
                    ? `<button type="button" class="timeline-btn-map" data-id="${t.id}" data-lat="${t.lat}" data-lng="${t.lng}">🗺️ 지도에서 보기</button>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }

  function initMap(trips) {
    const mapEl = document.getElementById('travel-map');
    if (!mapEl || typeof L === 'undefined') return;

    if (L.Icon.Default.prototype.options) {
      L.Icon.Default.prototype.options.imagePath = '/vendor/leaflet/images/';
    }

    const map = L.map('travel-map', {
      scrollWheelZoom: false,
      center: [25, 10],
      zoom: 2,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const featureGroup = L.featureGroup().addTo(map);
    const markerMap = {};

    trips.forEach(function (t) {
      if (t.lat == null || t.lng == null || (t.lat === 0 && t.lng === 0)) return;

      const imgHtml = t.image
        ? `<div class="travel-popup-thumb" style="background-image: url('${t.image}');"></div>`
        : '';

      const popupContent = `
        <div class="travel-popup">
          ${imgHtml}
          <div class="travel-popup-content">
            <div class="travel-popup-meta">
              <span class="popup-country">${t.country}</span>
              <span class="popup-period">${t.period || t.date}</span>
            </div>
            <h4 class="travel-popup-title"><a href="${t.permalink}">${t.title}</a></h4>
            ${t.location ? `<p class="travel-popup-loc">📍 ${t.location}</p>` : ''}
            ${t.summary ? `<p class="travel-popup-desc">${t.summary}</p>` : ''}
            <div class="travel-popup-actions">
              <a href="${t.permalink}" class="popup-btn-primary">여행기 읽기 &rarr;</a>
              <a href="#trip-${t.id}" class="popup-btn-secondary" data-jump-id="trip-${t.id}">타임라인 보기 &darr;</a>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([t.lat, t.lng]).bindPopup(popupContent, {
        maxWidth: 320,
        className: 'travel-custom-popup',
      });

      marker.addTo(featureGroup);
      markerMap[t.id] = marker;
    });

    if (Object.keys(markerMap).length > 0) {
      map.fitBounds(featureGroup.getBounds(), {
        padding: [50, 50],
        maxZoom: 9,
      });
    }

    // Region Controls
    const controls = document.getElementById('travel-map-controls');
    if (controls) {
      controls.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-region]');
        if (!btn) return;

        controls.querySelectorAll('button').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        const region = btn.dataset.region;
        filterRegion(region);
      });
    }

    function filterRegion(region) {
      if (region === 'all') {
        map.fitBounds(featureGroup.getBounds(), {
          padding: [50, 50],
          maxZoom: 9,
        });
        return;
      }

      const matchingMarkers = [];
      trips.forEach(function (t) {
        const marker = markerMap[t.id];
        if (!marker) return;

        const c = (t.country || '').toLowerCase();
        let match = false;

        if (region === 'americas') {
          match = c.includes('canada') || c.includes('usa') || c.includes('mexico');
        } else if (region === 'europe') {
          match = c.includes('europe') || c.includes('england') || c.includes('france');
        } else if (region === 'asia_oceania') {
          match = c.includes('japan') || c.includes('china') || c.includes('new zealand');
        } else if (region === 'africa') {
          match = c.includes('egypt');
        }

        if (match) {
          matchingMarkers.push(marker);
        }
      });

      if (matchingMarkers.length > 0) {
        const group = L.featureGroup(matchingMarkers);
        map.fitBounds(group.getBounds(), {
          padding: [60, 60],
          maxZoom: 8,
        });
      }
    }

    // Event Delegation for "지도에서 보기" button in timeline
    document.addEventListener('click', function (e) {
      const mapBtn = e.target.closest('.timeline-btn-map');
      if (mapBtn) {
        const id = mapBtn.dataset.id;
        const lat = parseFloat(mapBtn.dataset.lat);
        const lng = parseFloat(mapBtn.dataset.lng);
        const marker = markerMap[id];

        const mapSection = document.getElementById('travel-map-section');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        setTimeout(function () {
          map.setView([lat, lng], 8, { animate: true });
          if (marker) {
            marker.openPopup();
          }
        }, 500);
        return;
      }

      // Event Delegation for "타임라인 보기" inside popup
      const jumpLink = e.target.closest('a[data-jump-id]');
      if (jumpLink) {
        e.preventDefault();
        const targetId = jumpLink.dataset.jumpId;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.classList.add('highlight-pulse');
          setTimeout(function () {
            targetEl.classList.remove('highlight-pulse');
          }, 2000);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTravel);
  } else {
    initTravel();
  }
})();
