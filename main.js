/* ── Theme toggle ──────────────────────────────────── */
(function () {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#000000' : '#fbfbfd';
})();

const toggleBtn = document.getElementById('themeToggle');
if (toggleBtn) {
  function applyIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  applyIcon();
  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === 'dark' ? '#000000' : '#fbfbfd';
    applyIcon();
  });
}

/* ── Footer year ──────────────────────────────────── */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

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
  if (total) total.textContent = fallback ? 'Activity graph unavailable' : `${contributionCount.toLocaleString()} public contributions`;
  if (note && fallback) note.textContent = 'Live activity could not load. Visit GitHub for the current graph.';
}

function fallbackDays() {
  return Array.from({ length: 364 }, (_, index) => ({
    date: `Day ${index + 1}`,
    count: 0
  }));
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
