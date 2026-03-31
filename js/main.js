/* =========================================
   LIVE ARK ODYSSEY 2026 — Main JS (Tab UI)
   ========================================= */

(function () {
  'use strict';

  /* ----- Intro → App transition ----- */
  function initIntro() {
    const intro = document.getElementById('intro');
    const app = document.getElementById('app');
    const symbol = document.getElementById('introSymbol');
    if (!intro || !app || !symbol) return;

    const introText = document.getElementById('introText');
    const line1 = intro.querySelector('.intro__line--1');
    const line2 = intro.querySelector('.intro__line--2');

    // Phase 1: Logo fades in (CSS animation, 1.2s + 0.3s delay = ~1.5s)
    // Phase 2: After logo appears, show typewriter text
    setTimeout(() => {
      if (introText) {
        introText.classList.add('intro__text--visible');
        // Start typing line 1
        if (line1) {
          line1.classList.add('intro__line--typing');
          // After line 1 finishes (1.2s), start line 2
          setTimeout(() => {
            line1.classList.add('intro__line--done');
            if (line2) {
              line2.classList.add('intro__line--typing');
              setTimeout(() => {
                line2.classList.add('intro__line--done');
              }, 1000);
            }
          }, 1200);
        }
      }
    }, 1800);

    // Phase 3: After text is done, fly symbol to corner
    setTimeout(() => {
      // Fade out intro text
      if (introText) introText.classList.add('intro__text--fade-out');

      // Temporarily show app (behind intro) so we can measure target position
      app.hidden = false;
      app.style.opacity = '0';

      requestAnimationFrame(() => {
        const target = document.querySelector('.tab-bar__symbol');
        if (target) {
          const symbolRect = symbol.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();

          const dx = targetRect.left + targetRect.width / 2 - (symbolRect.left + symbolRect.width / 2);
          const dy = targetRect.top + targetRect.height / 2 - (symbolRect.top + symbolRect.height / 2);
          const scaleVal = targetRect.width / symbolRect.width;

          symbol.style.setProperty('--fly-transform', `translate(${dx}px, ${dy}px) scale(${scaleVal})`);
        } else {
          symbol.style.setProperty('--fly-transform', 'translate(-40vw, -40vh) scale(0.2)');
        }

        symbol.classList.add('intro__symbol--fly');

        // Phase 4: Fade out intro, reveal app underneath
        setTimeout(() => {
          app.style.transition = 'opacity 0.6s ease';
          app.style.opacity = '1';
          intro.classList.add('intro-screen--hidden');
        }, 400);
      });
    }, 5700);
  }

  /* ----- Tab switching ----- */
  function initTabs() {
    const tabs = document.querySelectorAll('.tab-bar__tab');
    const panels = document.querySelectorAll('.tab-panel');
    const tabPanels = document.getElementById('tabPanels');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        switchTab(targetId, tabs, panels, tabPanels);
      });
    });

    // Home button → switch to news tab
    const homeBtn = document.getElementById('tabHome');
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('news', tabs, panels, tabPanels);
      });
    }

    // Keyboard nav: left/right arrows
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        navigateTab(e.key === 'ArrowRight' ? 1 : -1, tabs, panels, tabPanels);
      }
    });

    // Swipe nav: left/right swipe on tab panels
    initSwipe(tabPanels, tabs, panels);

    // PC tab navigation arrows
    const prevBtn = document.getElementById('tabPrev');
    const nextBtn = document.getElementById('tabNext');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateTab(-1, tabs, panels, tabPanels));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateTab(1, tabs, panels, tabPanels));
  }

  function navigateTab(direction, tabs, panels, tabPanels) {
    // Only consider visible (not hidden) tabs
    const visibleTabs = Array.from(tabs).filter(t => !t.hidden);
    const activeIdx = visibleTabs.findIndex(t => t.classList.contains('is-active'));
    const nextIdx = (activeIdx + direction + visibleTabs.length) % visibleTabs.length;
    switchTab(visibleTabs[nextIdx].dataset.tab, tabs, panels, tabPanels);
  }

  function initSwipe(tabPanels, tabs, panels) {
    if (!tabPanels) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    tabPanels.addEventListener('touchstart', (e) => {
      // Ignore swipes that start inside the carousel
      if (e.target.closest('.carousel')) {
        tracking = false;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    tabPanels.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Only trigger if horizontal swipe is dominant and long enough
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        // Swipe left → next tab, swipe right → prev tab
        navigateTab(dx < 0 ? 1 : -1, tabs, panels, tabPanels);
      }
    }, { passive: true });
  }

  function switchTab(targetId, tabs, panels, tabPanels) {
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === targetId));
    panels.forEach(p => {
      const isTarget = p.id === `panel-${targetId}`;
      p.classList.toggle('is-active', isTarget);
    });
    // Scroll panel to top
    if (tabPanels) tabPanels.scrollTop = 0;

    // Stagger schedule cards
    const activePanel = document.getElementById(`panel-${targetId}`);
    if (activePanel) {
      activePanel.querySelectorAll('.schedule__card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
      });

      // Re-measure SVGs
      activePanel.querySelectorAll('.heading-svg').forEach(svg => {
        measureAndFitSVG(svg);
      });

      // Re-init carousels after layout settles
      setTimeout(() => {
        activePanel.querySelectorAll('.carousel').forEach(c => {
          initCarouselControls(c);
        });
      }, 50);
    }

  }

  /* ----- Show data (embedded) ----- */
  let allShows = [
    {"id":1,"date":"2026-08-10","city":"青森","venue":"青森Quarter","capacity":330,"phase":1,"status":"upcoming","ticket_url":null,"open":"14:30","start":"15:00","map_url":"https://maps.app.goo.gl/rDGaPyrgcDe4C3Pc8"},
    {"id":2,"date":"2026-08-16","city":"秋田","venue":"秋田Club SWINDLE","capacity":300,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:00","start":"16:30","map_url":"https://maps.app.goo.gl/AfNcgUTP2Esizkfg9"},
    {"id":3,"date":"2026-08-23","city":"宮城","venue":"仙台Rensa","capacity":700,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:00","start":"16:45","map_url":"https://maps.app.goo.gl/J2KkJsJsyRFkEPTCA"},
    {"id":4,"date":"2026-08-29","city":"新潟","venue":"新潟LOTS","capacity":700,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:15","start":"17:00","map_url":"https://maps.app.goo.gl/WzxjxHaYpuifS39R7"},
    {"id":5,"date":"2026-09-06","city":"茨城","venue":"水戸ライトハウス","capacity":350,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:30","start":"17:00","map_url":"https://maps.app.goo.gl/SFPqWnifA6iYAjkeA"},
    {"id":6,"date":"2026-09-13","city":"埼玉","venue":"HEAVEN'S ROCK 熊谷 VJ-1","capacity":300,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:30","start":"17:00","map_url":"https://maps.app.goo.gl/kptqLGRZKZjrnhN18"},
    {"id":7,"date":"2026-09-20","city":"石川","venue":"金沢エイトホール","capacity":500,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:00","start":"16:30","map_url":"https://maps.app.goo.gl/Q6dAUB7dvhNhBeW37"},
    {"id":8,"date":"2026-09-22","city":"富山","venue":"富山SOUL POWER","capacity":250,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:00","start":"16:30","map_url":"https://maps.app.goo.gl/KzWWUSYDwWqLjiqRA"},
    {"id":9,"date":"2026-10-04","city":"神奈川","venue":"横浜Bayhall","capacity":800,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:15","start":"17:00","map_url":"https://maps.app.goo.gl/CH3eQF1GBE9sh7ty5"},
    {"id":10,"date":"2026-10-10","city":"静岡","venue":"浜松窓枠","capacity":500,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:30","start":"17:00","map_url":"https://maps.app.goo.gl/ddd7UzrNLnkNKNC59"},
    {"id":11,"date":"2026-10-17","city":"大阪","venue":"BIGCAT","capacity":600,"phase":1,"status":"upcoming","ticket_url":null,"open":"15:45","start":"16:30","map_url":"https://maps.app.goo.gl/WrCw2PiKqzghE8am9"},
    {"id":12,"date":"2026-10-24","city":"愛知","venue":"名古屋クアトロ","capacity":550,"phase":1,"status":"upcoming","ticket_url":null,"open":"15:45","start":"16:30","map_url":"https://maps.app.goo.gl/AuLwQpqumchdAs7q7"},
    {"id":13,"date":"2026-10-31","city":"兵庫","venue":"神戸VARIT","capacity":350,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:00","start":"16:30","map_url":"https://maps.app.goo.gl/qJowrk237homXFo2A"},
    {"id":14,"date":"2026-11-07","city":"広島","venue":"広島LIVE VANQUISH","capacity":450,"phase":1,"status":"upcoming","ticket_url":null,"open":"16:00","start":"16:30","map_url":"https://maps.app.goo.gl/DadSeSbsj2o5xMjUA"},
    {"id":15,"date":"2026-11-15","city":"鹿児島","venue":"鹿児島CAPARVO HALL","capacity":450,"phase":1,"status":"upcoming","ticket_url":null,"open":"17:00","start":"17:30","map_url":"https://maps.app.goo.gl/GrujU9m2YQsP3Qby8"},
    {"id":16,"date":"2026-12-06","city":"北海道","venue":"Zepp Sapporo","phase":2,"status":"upcoming","ticket_url":null,"open":"16:00","start":"17:00","map_url":"https://maps.app.goo.gl/am64qm6Fpo7w5tEc9","guests":[{"name":"天月","x_url":"https://x.com/_amatsuki_"},{"name":"KOOL","x_url":"https://x.com/KOOLizm2525"}]},
    {"id":17,"date":"2026-12-12","city":"福岡","venue":"Zepp Fukuoka","phase":2,"status":"upcoming","ticket_url":null,"open":"17:00","start":"18:00","map_url":"https://maps.app.goo.gl/JTDCbjqi15hqxJM97","guests":[{"name":"ウォルピスカーター","x_url":"https://x.com/wolpis_kater"},{"name":"タラチオ","x_url":"https://x.com/tarachi"}]},
    {"id":18,"date":"2026-12-20","city":"愛知","venue":"Zepp Nagoya","phase":2,"status":"upcoming","ticket_url":null,"open":"16:00","start":"17:00","map_url":"https://maps.app.goo.gl/1XP6GMGEL1QfMH3K9","guests":[{"name":"センラ","x_url":"https://x.com/sen_sen_sen_sen"},{"name":"そらる","x_url":"https://x.com/soraruru"}]},
    {"id":19,"date":"2026-12-24","city":"大阪","venue":"Zepp Osaka Bayside","phase":2,"status":"upcoming","ticket_url":null,"open":"17:30","start":"18:30","map_url":"https://maps.app.goo.gl/BD5d8JmPsWBf6UMj8","guests":[{"name":"超学生","x_url":"https://x.com/tyougakusei"},{"name":"悠佑","x_url":"https://x.com/ireisu_yusuke"}]},
    {"id":20,"date":"2026-12-26","city":"神奈川","venue":"KT Zepp Yokohama","phase":2,"status":"upcoming","ticket_url":null,"open":"16:30","start":"17:30","map_url":"https://maps.app.goo.gl/G3ZL1mRnq3YkVoTeA","solo":true}
  ];

  function loadShows() {
    try {

      const phase1List = document.getElementById('phase1-list');
      const phase2List = document.getElementById('phase2-list');

      const xIconSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="guest__x-icon"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

      allShows.forEach((show) => {
        const li = document.createElement('li');
        li.dataset.showId = show.id;

        const dateStr = formatDate(show.date);
        const venueStr = show.venue && show.venue !== '会場未定' ? show.venue : '';

        if (show.phase === 1) {
          li.className = 'schedule__card';
          const timeStr = show.open && show.start ? `${show.open}/${show.start}` : '';
          li.innerHTML = `
            <span class="schedule__date">${dateStr}</span>
            <span class="schedule__city">${show.city}</span>
            <span class="schedule__venue">${venueStr}</span>
            ${timeStr ? `<span class="schedule__time">${timeStr}</span>` : ''}
          `;
          li.addEventListener('click', () => openShowModal(show));
          phase1List.appendChild(li);
        } else {
          li.className = 'schedule__card schedule__card--zepp';
          let guestHTML = '';
          if (show.guests && show.guests.length > 0) {
            const guestLinks = show.guests.map(g =>
              `<a href="${g.x_url}" target="_blank" rel="noopener" class="guest__link">${xIconSVG}<span>${g.name}</span></a>`
            ).join('');
            guestHTML = `<div class="schedule__card-guests">GUEST: ${guestLinks}</div>`;
          } else if (show.solo) {
            guestHTML = `<div class="schedule__card-guests schedule__card-guests--solo">SOLO</div>`;
          }
          const timeStr = show.open && show.start ? `${show.open}/${show.start}` : '';
          li.innerHTML = `
            <div class="schedule__card-line1">
              <span class="schedule__date">${dateStr}</span>
              <span class="schedule__city">${show.city}</span>
              ${timeStr ? `<span class="schedule__time">${timeStr}</span>` : ''}
            </div>
            <div class="schedule__card-line2">${venueStr}</div>
            ${guestHTML}
          `;
          li.addEventListener('click', (e) => {
            if (!e.target.closest('a')) openShowModal(show);
          });
          phase2List.appendChild(li);
        }
      });

      // Stagger initial card animations
      document.querySelectorAll('.schedule__card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
      });

      initModal();
    } catch (err) {
      console.warn('Shows data not available:', err.message);
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    return `${month}/${day} (${weekday})`;
  }

  /* =========================================
     SVG Heading Renderer
     ========================================= */
  function createSVGText(text, grad, opts = {}) {
    const strokeWidth = opts.strokeWidth || 3.5;
    const fontSize = opts.fontSize || 120;
    const gradId = `heading-grad-${Math.random().toString(36).slice(2, 8)}`;
    const stops = grad.map(s => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'heading-svg');
    svg.setAttribute('aria-label', text);
    svg.setAttribute('role', 'img');

    svg.innerHTML = `
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          ${stops}
        </linearGradient>
      </defs>
      <text
        x="0"
        y="0"
        dominant-baseline="hanging"
        font-family="'Anton', 'Arial Black', sans-serif"
        font-weight="400"
        letter-spacing="0.02em"
        fill="url(#${gradId})"
        fill-opacity="0.15"
        stroke="url(#${gradId})"
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
        stroke-linecap="round"
        paint-order="stroke"
        text-rendering="geometricPrecision"
        shape-rendering="geometricPrecision"
      >${text}</text>
    `;

    svg.setAttribute('viewBox', '0 0 1500 300');
    svg.querySelector('text').setAttribute('font-size', fontSize);

    return svg;
  }

  function measureAndFitSVG(svg) {
    const textEl = svg.querySelector('text');
    if (!textEl) return;
    const bbox = textEl.getBBox();
    if (bbox.width === 0) return; // Not visible yet
    const strokeW = parseFloat(textEl.getAttribute('stroke-width')) || 1.5;
    const pad = strokeW + 6;
    svg.setAttribute('viewBox',
      `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
    );
  }

  function initSVGHeadings() {
    const gradients = {
      'news':    [{offset:'0%', color:'#d4c5a0'}, {offset:'50%', color:'#a89060'}, {offset:'100%', color:'#6b5d4f'}],
      'phase1':  [{offset:'0%', color:'#c9a84c'}, {offset:'45%', color:'#e8d5a0'}, {offset:'100%', color:'#8b6a2f'}],
      'phase2':  [{offset:'0%', color:'#a0b8c9'}, {offset:'40%', color:'#d8e0e8'}, {offset:'100%', color:'#5a7a8b'}],
      'goods':   [{offset:'0%', color:'#b8a0c9'}, {offset:'40%', color:'#e0d8f0'}, {offset:'100%', color:'#6b5a8b'}],
      'journal': [{offset:'0%', color:'#8ba8a0'}, {offset:'40%', color:'#c8e0d8'}, {offset:'100%', color:'#4a6b5d'}],
      'notice':  [{offset:'0%', color:'#c9b88a'}, {offset:'40%', color:'#e8dcc0'}, {offset:'100%', color:'#8b7a5a'}],
      'contact': [{offset:'0%', color:'#8a9ab8'}, {offset:'40%', color:'#c0c8e0'}, {offset:'100%', color:'#5a6a8b'}],
    };
    const defaultGrad = [{offset:'0%', color:'#c9a84c'}, {offset:'40%', color:'#f0e8d8'}, {offset:'70%', color:'#c9a84c'}, {offset:'100%', color:'#8b3a3a'}];

    document.querySelectorAll('.heading__en').forEach((el) => {
      const text = el.textContent.trim();
      if (!text) return;

      // Find which panel this heading is in
      const panel = el.closest('.tab-panel');
      const panelId = panel ? panel.id.replace('panel-', '') : '';
      const grad = gradients[panelId] || defaultGrad;

      const svg = createSVGText(text, grad);
      el.innerHTML = '';
      el.appendChild(svg);
    });

    // Measure visible SVGs
    requestAnimationFrame(() => {
      document.querySelectorAll('.tab-panel.is-active .heading-svg').forEach(measureAndFitSVG);
    });
  }

  /* =========================================
     Countdown timer
     ========================================= */
  function initCountdown() {
    const daysEl = document.getElementById('countdown-days');
    if (!daysEl) return;

    const targetDate = new Date('2026-08-10T00:00:00+09:00');

    function update() {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        daysEl.textContent = '0';
        const label = document.querySelector('.countdown__label');
        if (label) label.textContent = '旅は始まった';
        return;
      }

      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      daysEl.textContent = days.toString();
      daysEl.setAttribute('data-text', days.toString());
    }

    update();
    setInterval(update, 3600000);
  }

  /* =========================================
     Show Detail Modal
     ========================================= */
  function initModal() {
    const overlay = document.getElementById('showModal');
    const closeBtn = document.getElementById('modalClose');
    if (!overlay || !closeBtn) return;

    closeBtn.addEventListener('click', closeShowModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeShowModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeShowModal();
    });
  }

  function formatDateLong(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    return `${year}.${month}.${day} (${weekday})`;
  }

  function openShowModal(show) {
    const overlay = document.getElementById('showModal');
    if (!overlay) return;

    document.getElementById('modalDate').textContent = formatDateLong(show.date);
    document.getElementById('modalCity').textContent = show.city;
    document.getElementById('modalVenue').textContent = show.venue || '会場未定';
    document.getElementById('modalOpen').textContent = show.open || 'TBA';
    document.getElementById('modalStart').textContent = show.start || 'TBA';

    // Guest info
    const guestContainer = document.getElementById('modalGuests');
    if (show.guests && show.guests.length > 0) {
      const xIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="guest__x-icon"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
      const guestLinks = show.guests.map(g =>
        `<a href="${g.x_url}" target="_blank" rel="noopener" class="guest__link">${xIcon}<span>${g.name}</span></a>`
      ).join('');
      guestContainer.innerHTML = `<span class="modal__guest-label">GUEST</span>${guestLinks}`;
      guestContainer.style.display = 'flex';
    } else {
      guestContainer.innerHTML = '';
      guestContainer.style.display = 'none';
    }

    // Google Maps embed
    const mapContainer = document.getElementById('modalMap');
    const query = encodeURIComponent(show.venue + ' ' + show.city);
    mapContainer.innerHTML = `<iframe
      src="https://maps.google.com/maps?q=${query}&t=m&z=16&ie=UTF8&iwloc=&output=embed"
      allowfullscreen
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"></iframe>`;

    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeShowModal() {
    const overlay = document.getElementById('showModal');
    if (!overlay) return;

    overlay.classList.remove('is-active');
    document.body.style.overflow = '';

    setTimeout(() => {
      const mapContainer = document.getElementById('modalMap');
      if (mapContainer) mapContainer.innerHTML = '';
    }, 350);
  }

  /* =========================================
     Share button (Web Share API / fallback)
     ========================================= */
  function initShare() {
    const btn = document.getElementById('shareBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const shareData = {
        title: 'LIVE ARK ODYSSEY 2026 | あらき',
        text: 'あらき 全国ツアー LIVE ARK ODYSSEY 2026',
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback: copy URL
          await navigator.clipboard.writeText(window.location.href);
          showShareToast();
        }
      } catch (e) {
        // User cancelled or error
      }
    });
  }

  function showShareToast() {
    const toast = document.createElement('div');
    toast.textContent = 'URLをコピーしました';
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: rgba(201, 168, 76, 0.9); color: #1a1611;
      padding: 8px 20px; border-radius: 20px; font-size: 0.8rem;
      font-family: var(--font-body); z-index: 99999;
      animation: toast-in 0.3s ease, toast-out 0.3s ease 1.5s forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  /* =========================================
     Photo Journal — Multi-section Carousel + Lightbox
     ========================================= */
  // All photos flattened for lightbox navigation
  let allJournalPhotos = [];

  function initJournal() {
    const container = document.getElementById('journalSections');
    if (!container) return;

    // Try loading from JSON, fallback to embedded data
    loadJournalData().then(data => {
      if (!data || !data.sections || data.sections.length === 0) {
        container.innerHTML = '<p class="journal__placeholder-note">写真は準備中です</p>';
        return;
      }

      // Flatten all photos for lightbox
      allJournalPhotos = [];
      data.sections.forEach(section => {
        section.photos.sort((a, b) => (a.order || 0) - (b.order || 0));
        section.photos.forEach(photo => {
          allJournalPhotos.push(photo);
        });
      });

      // Render sections
      data.sections.forEach(section => {
        if (section.photos.length === 0) return;
        const sectionEl = createJournalSection(section);
        container.appendChild(sectionEl);
      });

      // Init lightbox
      initLightbox();
    });
  }

  async function loadJournalData() {
    return {
      sections: [
        {
          id: 'past',
          title: '過去のライブ写真',
          subtitle: 'PAST LIVE PHOTOS',
          photos: [
            { src: 'img/journal/past/1.jpg', caption: '', order: 1 },
            { src: 'img/journal/past/2.JPG', caption: '', order: 2 },
            { src: 'img/journal/past/3.JPG', caption: '', order: 3 },
            { src: 'img/journal/past/4.jpg', caption: '', order: 4 },
            { src: 'img/journal/past/5.jpg', caption: '', order: 5 },
            { src: 'img/journal/past/6.jpg', caption: '', order: 6 },
            { src: 'img/journal/past/7.JPG', caption: '', order: 7 },
            { src: 'img/journal/past/8.jpeg', caption: '', order: 8 },
            { src: 'img/journal/past/9.jpg', caption: '', order: 9 },
            { src: 'img/journal/past/10.JPG', caption: '', order: 10 }
          ]
        }
      ]
    };
  }

  function createJournalSection(section) {
    const wrapper = document.createElement('div');
    wrapper.className = 'journal__section';
    wrapper.dataset.sectionId = section.id;

    // Section header
    const header = document.createElement('div');
    header.className = 'journal__section-header';
    header.innerHTML = `
      <span class="journal__section-subtitle">${section.subtitle || ''}</span>
      <h3 class="journal__section-title">${section.title}</h3>
    `;
    wrapper.appendChild(header);

    // Carousel
    // --- Carousel (exact demo structure) ---
    // .carousel > .carousel__container > .carousel__inner + nav buttons
    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    const container = document.createElement('div');
    container.className = 'carousel__container';

    const inner = document.createElement('div');
    inner.className = 'carousel__inner';

    // Layer A: Invisible scroll layer
    const scrollLayer = document.createElement('div');
    scrollLayer.className = 'carousel__scroll';

    const spacerStart = document.createElement('div');
    spacerStart.className = 'carousel__spacer';
    scrollLayer.appendChild(spacerStart);

    section.photos.forEach((photo, i) => {
      // Snap target (transparent)
      const snap = document.createElement('div');
      snap.className = 'carousel__snap';
      scrollLayer.appendChild(snap);

      // Visual card (absolute positioned)
      const slide = document.createElement('div');
      slide.className = 'carousel__slide';
      const globalIdx = allJournalPhotos.indexOf(photo);
      slide.dataset.globalIndex = globalIdx;
      slide.dataset.localIndex = i;

      // Card link wrapper (holds border-radius + shadow)
      const cardLink = document.createElement('div');
      cardLink.className = 'carousel__card-link';

      const img = document.createElement('img');
      img.className = 'carousel__img';
      img.src = photo.src;
      img.alt = photo.caption || '';
      img.loading = 'lazy';

      // Card overlay (gradient + caption)
      if (photo.caption) {
        const overlay = document.createElement('div');
        overlay.className = 'carousel__card-overlay';
        overlay.innerHTML = `<h3>${photo.caption}</h3>`;
        cardLink.appendChild(overlay);
      }

      cardLink.appendChild(img);
      slide.appendChild(cardLink);
      inner.appendChild(slide);
    });

    const spacerEnd = document.createElement('div');
    spacerEnd.className = 'carousel__spacer';
    scrollLayer.appendChild(spacerEnd);

    inner.appendChild(scrollLayer);
    container.appendChild(inner);

    carousel.appendChild(container);

    // Navigation row: prev arrow + dots + next arrow
    const navRow = document.createElement('div');
    navRow.className = 'carousel__nav-row';

    const arrowSvgPrev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const arrowSvgNext = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel__arrow carousel__arrow--prev';
    prevBtn.setAttribute('aria-label', '前へ');
    prevBtn.innerHTML = arrowSvgPrev;

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel__dots';
    section.photos.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot';
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel__arrow carousel__arrow--next';
    nextBtn.setAttribute('aria-label', '次へ');
    nextBtn.innerHTML = arrowSvgNext;

    navRow.appendChild(prevBtn);
    navRow.appendChild(dotsContainer);
    navRow.appendChild(nextBtn);
    carousel.appendChild(navRow);

    wrapper.appendChild(carousel);

    return wrapper;
  }

  /*
   * 3D Fan Carousel — direct port of 3d-fan-carousel-demo.html
   *
   * Transform values (atobeach.com measured):
   *   offset 0:  tx=0,   rotateY=0°,  scale=1.0, opacity=1.0, z=30
   *   offset ±1: tx=±220, rotateY=∓21°, scale=0.8, opacity=1.0, z=20
   *   offset ±2: tx=±380, rotateY=∓25°, scale=0.7, opacity=0.6, z=10
   */
  const CAROUSEL_VISIBLE_RANGE = 2.5;
  const CAROUSEL_CARD_WIDTH = 260;

  function initCarouselControls(carousel) {
    const scrollEl = carousel.querySelector('.carousel__scroll');
    const cardEls = carousel.querySelectorAll('.carousel__slide');
    const prevBtn = carousel.querySelector('.carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.carousel__arrow--next');
    if (!scrollEl || cardEls.length === 0) return;

    const innerEl = carousel.querySelector('.carousel__inner');
    const containerW = innerEl.offsetWidth;
    if (containerW === 0) return;

    const isMobile = window.innerWidth <= 768;
    const cardW = isMobile ? 220 : CAROUSEL_CARD_WIDTH;
    const spacerW = Math.floor(containerW / 2 - cardW / 2);

    // Set spacer widths
    carousel.querySelectorAll('.carousel__spacer').forEach(s => {
      s.style.width = spacerW + 'px';
    });

    // Set snap item widths (match card width)
    carousel.querySelectorAll('.carousel__snap').forEach(s => {
      s.style.width = cardW + 'px';
    });

    // Set card dimensions via inline style (same as demo's buildCarousel)
    const cardH = isMobile ? 290 : 340;
    cardEls.forEach((card, i) => {
      card.style.cssText = `width:${cardW}px; height:${cardH}px; left:calc(50% - ${cardW/2}px);`;
    });

    // Dot elements
    const dots = carousel.querySelectorAll('.carousel__dot');

    // --- updateCards: exact copy of demo + dot update ---
    function updateCards() {
      const mobile = window.innerWidth <= 768;
      const cw = mobile ? 220 : CAROUSEL_CARD_WIDTH;
      const scrollLeft = scrollEl.scrollLeft;
      const activeIndex = Math.round(scrollLeft / cw);

      cardEls.forEach((card, i) => {
        const offset = i - scrollLeft / cw;
        const absO = Math.abs(offset);
        const sign = offset >= 0 ? 1 : -1;

        if (absO > CAROUSEL_VISIBLE_RANGE) {
          card.style.opacity = '0';
          card.style.zIndex = '0';
          return;
        }

        const tx = sign * (220 * Math.min(absO, 1) + 160 * Math.max(0, absO - 1));
        const ryDeg = -sign * (21 * Math.min(absO, 1) + 4 * Math.max(0, absO - 1));
        const ry = ryDeg * Math.PI / 180;
        const s = Math.max(0.5, 1.0 - 0.2 * Math.min(absO, 1) - 0.1 * Math.max(0, absO - 1));
        const op = absO <= 1.5 ? 1.0 : Math.max(0, 1.0 - (absO - 1.5) * 0.8);
        const z = Math.max(0, 30 - Math.round(absO) * 10);

        const cosR = Math.cos(ry);
        const sinR = Math.sin(ry);
        card.style.transform = `matrix3d(${(s*cosR).toFixed(6)},0,${(-sinR).toFixed(6)},0,0,${s.toFixed(6)},0,0,${(sinR*s).toFixed(6)},0,${cosR.toFixed(6)},0,${tx.toFixed(2)},0,0,1)`;
        card.style.opacity = op.toFixed(4);
        card.style.zIndex = z.toString();
      });

      // Update dot indicator (same as demo)
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-active', i === activeIndex);
      }
    }

    // Store for external access
    carousel._updateCards = updateCards;
    carousel._cardWidth = cardW;

    // Helper: get current cardW (recalculate like demo does)
    function getCurrentCardW() {
      return window.innerWidth <= 768 ? 220 : CAROUSEL_CARD_WIDTH;
    }

    function onScroll() {
      requestAnimationFrame(updateCards);
    }

    // Bind events (once only — DOM is built once, not rebuilt on resize)
    if (!carousel._eventsBound) {
      carousel._eventsBound = true;

      // Scroll → update transforms
      scrollEl.addEventListener('scroll', onScroll, { passive: true });

      // Card click → lightbox (center card) or scroll (side card)
      scrollEl.addEventListener('click', (e) => {
        const cw = getCurrentCardW();
        const centerIdx = Math.round(scrollEl.scrollLeft / cw);
        const clampedIdx = Math.max(0, Math.min(cardEls.length - 1, centerIdx));
        const mobile = window.innerWidth <= 768;

        if (!mobile) {
          // PC: determine which card was clicked by position
          const rect = innerEl.getBoundingClientRect();
          const clickOffset = (e.clientX - rect.left - rect.width / 2) / cw;
          const targetIdx = Math.round(clampedIdx + clickOffset);
          const finalIdx = Math.max(0, Math.min(cardEls.length - 1, targetIdx));

          if (Math.abs(finalIdx - clampedIdx) >= 1) {
            scrollEl.scrollTo({ left: finalIdx * cw, behavior: 'smooth' });
            return;
          }
        }

        // Center card (or any tap on mobile) → lightbox
        const slide = cardEls[clampedIdx];
        if (slide) {
          const globalIdx = parseInt(slide.dataset.globalIndex);
          if (!isNaN(globalIdx)) openLightbox(globalIdx);
        }
      });

      // Nav buttons — same as demo (scrollBy + recalculate cardW)
      if (prevBtn) prevBtn.addEventListener('click', () => {
        const cw = getCurrentCardW();
        scrollEl.scrollBy({ left: -cw, behavior: 'smooth' });
      });
      if (nextBtn) nextBtn.addEventListener('click', () => {
        const cw = getCurrentCardW();
        scrollEl.scrollBy({ left: cw, behavior: 'smooth' });
      });

      // Dot click → scroll to that card
      dots.forEach((dot) => {
        dot.addEventListener('click', () => {
          const cw = getCurrentCardW();
          const idx = parseInt(dot.dataset.index);
          scrollEl.scrollTo({ left: idx * cw, behavior: 'smooth' });
        });
      });
    }

    // Initial scroll position & render (call directly, rAF unreliable in setTimeout)
    scrollEl.scrollLeft = 0;
    updateCards();
  }

  /* --- Lightbox (shared across all carousels) --- */
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lbClose = lightbox.querySelector('.lightbox__close');
    const lbPrev = lightbox.querySelector('.lightbox__arrow--prev');
    const lbNext = lightbox.querySelector('.lightbox__arrow--next');

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => lightboxNav(-1));
    if (lbNext) lbNext.addEventListener('click', () => lightboxNav(1));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
    });
  }

  let lightboxIndex = 0;

  function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    if (!lightbox || !lightboxImg || index < 0 || index >= allJournalPhotos.length) return;

    lightboxIndex = index;
    const photo = allJournalPhotos[index];
    lightboxImg.src = photo.src;
    if (lightboxCaption) {
      lightboxCaption.textContent = photo.caption || '';
      lightboxCaption.style.display = photo.caption ? 'block' : 'none';
    }
    lightbox.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  function lightboxNav(dir) {
    const newIdx = (lightboxIndex + dir + allJournalPhotos.length) % allJournalPhotos.length;
    openLightbox(newIdx);
  }

  /* ----- Init ----- */
  document.addEventListener('DOMContentLoaded', () => {
    initIntro();
    initTabs();
    initCountdown();
    loadShows();
    initShare();
    initJournal();
  });

})();
