/* Theme */
(function applyStoredTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#121210' : '#f4f0e8';
})();

const toggleBtn = document.getElementById('themeToggle');
if (toggleBtn) {
  const refreshThemeLabel = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  refreshThemeLabel();
  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === 'dark' ? '#121210' : '#f4f0e8';
    refreshThemeLabel();
  });
}

/* Placeholder blog link */
document.querySelectorAll('[data-blog-placeholder]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    link.animate(
      [
        { color: 'var(--muted)' },
        { color: 'var(--signal)' },
        { color: 'var(--muted)' }
      ],
      { duration: 700, easing: 'ease-out' }
    );
  });
});

/* Footer */
document.querySelectorAll('#year').forEach((year) => {
  year.textContent = new Date().getFullYear();
});

document.querySelectorAll('[data-footer-cat]').forEach((button) => {
  const face = button.querySelector('[data-cat-face]');
  const status = button.querySelector('[data-cat-status]');
  const restingFace = ' /\\_/\\\n( o.o )\n > ^ <';
  const happyFace = ' /\\_/\\\n( ^.^ )\n > ♡ <';
  let resetTimer = 0;

  button.addEventListener('click', () => {
    window.clearTimeout(resetTimer);
    button.dataset.petted = 'true';
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', 'The cat is purring');
    if (face) face.textContent = happyFace;
    if (status) status.textContent = 'The cat purrs.';

    resetTimer = window.setTimeout(() => {
      delete button.dataset.petted;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Pet the cat');
      if (face) face.textContent = restingFace;
      if (status) status.textContent = '';
    }, 1600);
  });
});

/* Home page cat pet — draggable + cat moods */
document.querySelectorAll('[data-cat-pet]').forEach((button) => {
  const status = button.querySelector('[data-cat-pet-status]');
  const bubble = button.querySelector('[data-cat-bubble]');
  const storageKey = 'chirag-portfolio-cat-position-v1';
  const dragThreshold = 6;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moods = {
    idle: { bubble: '', label: 'Pet the cat. Drag to move.', live: '' },
    purr: { bubble: 'purrrr', label: 'The cat is purring', live: 'The cat purrs.' },
    sleep: { bubble: 'zzz', label: 'The cat is napping. Drag to move.', live: 'The cat falls asleep.' },
    stretch: { bubble: 'mrrp', label: 'The cat is stretching. Drag to move.', live: 'The cat stretches.' },
    play: { bubble: '!', label: 'The cat is playful. Drag to move.', live: 'The cat hops around.' },
    curious: { bubble: '?', label: 'The cat is curious. Drag to move.', live: 'The cat looks around.' },
    loaf: { bubble: 'warm', label: 'The cat is loafing. Drag to move.', live: 'The cat becomes a loaf.' }
  };

  let moodTimer = 0;
  let idleTimer = 0;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;
  let moved = false;
  let busy = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function readSavedPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || !Number.isFinite(saved.left) || !Number.isFinite(saved.top)) return null;
      return { left: saved.left, top: saved.top };
    } catch {
      return null;
    }
  }

  function applyPosition(left, top) {
    const maxLeft = Math.max(0, window.innerWidth - button.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - button.offsetHeight);
    const nextLeft = clamp(left, 0, maxLeft);
    const nextTop = clamp(top, 0, maxTop);
    button.style.left = `${nextLeft}px`;
    button.style.top = `${nextTop}px`;
    button.style.right = 'auto';
    button.style.bottom = 'auto';
    return { left: nextLeft, top: nextTop };
  }

  function persistPosition(left, top) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ left, top }));
    } catch {
      /* ignore quota / private mode */
    }
  }

  function setMood(mood, { duration = 2200 } = {}) {
    const config = moods[mood] || moods.idle;
    window.clearTimeout(moodTimer);
    button.dataset.mood = mood;
    button.setAttribute('aria-pressed', mood === 'purr' ? 'true' : 'false');
    button.setAttribute('aria-label', config.label);
    if (bubble) bubble.textContent = config.bubble;
    if (status) status.textContent = config.live;

    if (mood === 'idle') {
      busy = false;
      return;
    }

    busy = true;
    moodTimer = window.setTimeout(() => {
      busy = false;
      setMood('idle');
      scheduleIdleBehavior();
    }, duration);
  }

  function petCat() {
    setMood('purr', { duration: 1800 });
  }

  function scheduleIdleBehavior() {
    window.clearTimeout(idleTimer);
    if (reduceMotion) return;
    const delay = 3500 + Math.random() * 4500;
    idleTimer = window.setTimeout(() => {
      if (busy || button.dataset.dragging === 'true') {
        scheduleIdleBehavior();
        return;
      }
      const roll = Math.random();
      if (roll < 0.22) setMood('sleep', { duration: 4200 });
      else if (roll < 0.4) setMood('stretch', { duration: 2000 });
      else if (roll < 0.58) setMood('curious', { duration: 2200 });
      else if (roll < 0.74) setMood('loaf', { duration: 3200 });
      else if (roll < 0.9) setMood('play', { duration: 1600 });
      else setMood('purr', { duration: 1600 });
    }, delay);
  }

  const saved = readSavedPosition();
  if (saved) {
    requestAnimationFrame(() => applyPosition(saved.left, saved.top));
  }
  setMood('idle');
  scheduleIdleBehavior();

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerId = event.pointerId;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;

    const rect = button.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;
    applyPosition(originLeft, originTop);

    button.setPointerCapture(pointerId);
    button.dataset.dragging = 'true';
  });

  button.addEventListener('pointermove', (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < dragThreshold) return;
    moved = true;
    applyPosition(originLeft + dx, originTop + dy);
  });

  function endDrag(event) {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const wasMoved = moved;
    const rect = button.getBoundingClientRect();
    const next = applyPosition(rect.left, rect.top);
    if (wasMoved) persistPosition(next.left, next.top);

    try {
      button.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }

    pointerId = null;
    delete button.dataset.dragging;

    if (!wasMoved) petCat();
    else scheduleIdleBehavior();
  }

  button.addEventListener('pointerup', endDrag);
  button.addEventListener('pointercancel', endDrag);

  button.addEventListener('click', (event) => {
    event.preventDefault();
  });

  window.addEventListener('resize', () => {
    const rect = button.getBoundingClientRect();
    if (button.style.left || button.style.top) {
      const next = applyPosition(rect.left, rect.top);
      persistPosition(next.left, next.top);
    }
  });
});

/* Email address assembly */
const emailButton = document.querySelector('[data-email-contact]');
if (emailButton) {
  emailButton.addEventListener('click', () => {
    const encodedAddress = emailButton.dataset.emailContact;
    if (!encodedAddress) return;
    window.location.href = `mailto:${encodedAddress.split('').reverse().join('')}`;
  });
}

/* GitHub activity */
const grid = document.getElementById('activityGrid');
const activityScroll = document.getElementById('activityScroll');
const total = document.getElementById('activity-total');
const note = document.getElementById('activityNote');

function levelFor(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function renderActivity(days, fallback = false) {
  if (!grid) return;
  grid.replaceChildren();
  const recentDays = days.slice(-364);
  recentDays.forEach(({ date, count }) => {
    const cell = document.createElement('span');
    cell.className = 'activity-cell';
    cell.dataset.level = String(levelFor(count));
    cell.title = `${count} contribution${count === 1 ? '' : 's'} on ${date}`;
    grid.append(cell);
  });
  grid.setAttribute('aria-busy', 'false');
  if (activityScroll && window.matchMedia('(max-width: 720px)').matches) {
    requestAnimationFrame(() => {
      activityScroll.scrollLeft = activityScroll.scrollWidth - activityScroll.clientWidth;
    });
  }
  const contributionCount = recentDays.reduce((sum, day) => sum + day.count, 0);
  if (total) total.textContent = fallback ? 'activity graph unavailable' : `${contributionCount.toLocaleString()} public contributions`;
  if (note && fallback) note.textContent = 'live activity could not load. visit GitHub for the current graph.';
}

function fallbackDays() {
  return Array.from({ length: 364 }, (_, index) => ({ date: `Day ${index + 1}`, count: 0 }));
}

if (grid) {
  renderActivity(fallbackDays());
  fetch('https://github-contributions-api.jogruber.de/v4/ctxnn?y=last')
    .then((response) => {
      if (!response.ok) throw new Error('Contribution request failed');
      return response.json();
    })
    .then((data) => {
      const contributions = data.contributions?.map(({ date, count }) => ({ date, count: Number(count) || 0 }));
      if (!contributions?.length) throw new Error('No contribution data');
      renderActivity(contributions);
    })
    .catch(() => renderActivity(fallbackDays(), true));
}

/* Browser-local interaction trail */
const dashboard = document.querySelector('[data-interaction-dashboard]');
{
  const storageKey = 'chirag-portfolio-interactions-v1';
  const historyLength = 24;
  const blankHistory = () => Array.from({ length: historyLength }, () => 0);
  const defaultState = () => ({
    clicks: 0,
    distance: 0,
    keys: 0,
    history: { clicks: blankHistory(), distance: blankHistory(), keys: blankHistory() }
  });

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function normalizeHistory(value) {
    const source = Array.isArray(value) ? value.slice(-historyLength).map(safeNumber) : [];
    return [...Array.from({ length: historyLength - source.length }, () => 0), ...source];
  }

  function loadInteractionState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved) return defaultState();
      return {
        clicks: safeNumber(saved.clicks),
        distance: safeNumber(saved.distance),
        keys: safeNumber(saved.keys),
        history: {
          clicks: normalizeHistory(saved.history?.clicks),
          distance: normalizeHistory(saved.history?.distance),
          keys: normalizeHistory(saved.history?.keys)
        }
      };
    } catch {
      return defaultState();
    }
  }

  let interactionState = loadInteractionState();
  let persistTimer = 0;
  let lastPointer = null;

  function persistInteractions() {
    window.clearTimeout(persistTimer);
    persistTimer = 0;
    try {
      localStorage.setItem(storageKey, JSON.stringify(interactionState));
    } catch {
      const status = dashboard?.querySelector('[data-tracking-status]');
      if (status) status.textContent = 'tracking for this page only';
    }
  }

  function queuePersist() {
    if (persistTimer) return;
    persistTimer = window.setTimeout(persistInteractions, 500);
  }

  function formatDistance(value) {
    if (value < 1000) return `${Math.round(value)} px`;
    if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}k px`;
    return `${(value / 1000000).toFixed(2)}m px`;
  }

  function chartPoints(values) {
    const width = 240;
    const top = 7;
    const bottom = 64;
    const max = Math.max(1, ...values);
    return values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = bottom - (value / max) * (bottom - top);
      return [Number(x.toFixed(2)), Number(y.toFixed(2))];
    });
  }

  function renderMetric(metric) {
    const card = dashboard?.querySelector(`[data-metric="${metric}"]`);
    if (!card) return;
    const value = card.querySelector('[data-metric-value]');
    const points = chartPoints(interactionState.history[metric]);
    const pointString = points.map(([x, y]) => `${x},${y}`).join(' ');
    const line = card.querySelector('[data-chart-line]');
    const area = card.querySelector('[data-chart-area]');
    if (line) line.setAttribute('points', pointString);
    if (area) area.setAttribute('d', `M0,72 L${pointString.replaceAll(' ', ' L')} L240,72 Z`);
    if (value) {
      value.textContent = metric === 'distance'
        ? formatDistance(interactionState.distance)
        : Math.round(interactionState[metric]).toLocaleString();
    }
  }

  function renderInteractions() {
    renderMetric('clicks');
    renderMetric('distance');
    renderMetric('keys');
  }

  function addInteraction(metric, amount = 1) {
    interactionState[metric] += amount;
    interactionState.history[metric][historyLength - 1] += amount;
    renderMetric(metric);
    queuePersist();
  }

  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-reset-interactions]')) return;
    addInteraction('clicks');
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const point = { x: event.clientX, y: event.clientY };
    if (lastPointer) {
      const distance = Math.hypot(point.x - lastPointer.x, point.y - lastPointer.y);
      if (distance > 0 && distance < 500) addInteraction('distance', distance);
    }
    lastPointer = point;
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    lastPointer = null;
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat || ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;
    addInteraction('keys');
  });

  window.setInterval(() => {
    Object.keys(interactionState.history).forEach((metric) => {
      interactionState.history[metric] = [...interactionState.history[metric].slice(1), 0];
    });
    renderInteractions();
    queuePersist();
  }, 5000);

  const resetButton = dashboard?.querySelector('[data-reset-interactions]');

  resetButton?.addEventListener('click', () => {
    interactionState = defaultState();
    lastPointer = null;
    persistInteractions();
    renderInteractions();
  });

  window.addEventListener('pagehide', persistInteractions);
  renderInteractions();
}
