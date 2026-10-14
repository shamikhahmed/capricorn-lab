/**
 * Privacy Monitor — measured, not claimed.
 * Reads the browser's own Resource Timing entries for this page and counts
 * every request by origin. "First party" = this hub's own origin(s); anything
 * else is third party and shown as-is (if a number is ever non-zero, we show it).
 */

const FIRST_PARTY = new Set([location.origin, 'https://shamikhahmed.github.io']);

function originOf(url) {
  try {
    const u = new URL(url, location.href);
    if (u.protocol === 'data:' || u.protocol === 'blob:') return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function networkStats() {
  const nav = performance.getEntriesByType?.('navigation')?.[0];
  const res = performance.getEntriesByType?.('resource') || [];
  const origins = new Map();
  let bytes = 0;
  let requests = 0;

  const add = (url, size) => {
    const o = originOf(url);
    if (!o) return;
    requests += 1;
    bytes += size || 0;
    const row = origins.get(o) || { origin: o, count: 0, bytes: 0, first: FIRST_PARTY.has(o) };
    row.count += 1;
    row.bytes += size || 0;
    origins.set(o, row);
  };

  if (nav) add(nav.name, nav.transferSize || nav.encodedBodySize);
  res.forEach((r) => add(r.name, r.transferSize || r.encodedBodySize));

  const rows = [...origins.values()].sort((a, b) => Number(b.first) - Number(a.first) || b.count - a.count);
  const third = rows.filter((r) => !r.first).reduce((n, r) => n + r.count, 0);
  return { requests, bytes, third, first: requests - third, rows };
}

export function formatBytes(n) {
  if (!n) return '0 KB';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** One-line proof for the clock widget / lock screen. */
export function proofLine(s = networkStats()) {
  return s.third === 0
    ? '0 trackers · 0 third-party requests'
    : `${s.third} third-party request${s.third === 1 ? '' : 's'} — see Privacy Monitor`;
}

/** Calls back on every new request the page makes (buffered + live). */
export function watchNetwork(cb) {
  let raf = 0;
  const fire = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => cb(networkStats()));
  };
  let obs = null;
  try {
    obs = new PerformanceObserver(fire);
    obs.observe({ type: 'resource', buffered: true });
  } catch { /* old browsers: one-shot */ }
  fire();
  return () => {
    obs?.disconnect();
    cancelAnimationFrame(raf);
  };
}

export function privacyMonitorHTML() {
  return `
    <div class="sys-panel sys-panel--privacy">
      <div class="sys-panel__hero">
        <span class="pm-shield" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 4 5v6c0 5.05 3.41 9.76 8 11 4.59-1.24 8-5.95 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z"/></svg>
        </span>
        <div>
          <h2>Privacy Monitor</h2>
          <p>Live from your browser's own network log — not a slogan.</p>
        </div>
      </div>
      <div class="pm-stats">
        <div class="pm-stat pm-stat--hero"><strong class="num" data-pm="third">0</strong><span>third-party requests</span></div>
        <div class="pm-stat"><strong class="num" data-pm="first">0</strong><span>first-party requests</span></div>
        <div class="pm-stat"><strong class="num" data-pm="bytes">0 KB</strong><span>downloaded this visit</span></div>
        <div class="pm-stat"><strong class="num" data-pm="cookies">0</strong><span>cookies readable here</span></div>
      </div>
      <h3 class="pm-sub">Every origin this page has talked to</h3>
      <ul class="pm-list" data-pm="rows"></ul>
      <p class="pm-note">First party = <code>${location.host}</code>${location.origin !== 'https://shamikhahmed.github.io' ? ' and <code>shamikhahmed.github.io</code>' : ''}. No analytics, ads, fonts or CDNs are loaded. Open your browser's DevTools → Network to check us.</p>
    </div>
  `;
}

export function bindPrivacyMonitor(root) {
  const q = (k) => root.querySelector(`[data-pm="${k}"]`);
  return watchNetwork((s) => {
    if (!root.isConnected) return;
    q('third').textContent = String(s.third);
    q('third').closest('.pm-stat')?.classList.toggle('is-bad', s.third > 0);
    q('first').textContent = String(s.first);
    q('bytes').textContent = formatBytes(s.bytes);
    q('cookies').textContent = String(document.cookie ? document.cookie.split(';').filter((c) => c.trim()).length : 0);
    q('rows').innerHTML = s.rows.map((r) => `
      <li class="${r.first ? 'is-first' : 'is-third'}">
        <span class="pm-dot" aria-hidden="true"></span>
        <code>${r.origin.replace(/^https?:\/\//, '')}</code>
        <em>${r.first ? 'first party' : 'third party'}</em>
        <strong class="num">${r.count}</strong>
      </li>`).join('');
  });
}
