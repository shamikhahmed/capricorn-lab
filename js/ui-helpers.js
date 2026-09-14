/** Shared UI bits — badges, launch labels (HUB-P0-01 private beta) */
export function wipBadgeHTML() {
  return '<span class="wip-badge">WIP</span>';
}

export function privateBetaBadgeHTML() {
  return '<span class="wip-badge">Private beta</span>';
}

export function statusBadgeHTML(app) {
  if (app.privateBeta) return privateBetaBadgeHTML();
  if (app.wip) return wipBadgeHTML();
  return '';
}

export function launchLabel(app) {
  if (app.privateBeta) return 'Private beta — no public install';
  if (app.wip) return `View ${app.name} on GitHub`;
  return `Launch ${app.name}`;
}

export function launchHref(app) {
  if (app.privateBeta) return 'https://shamikhahmed.github.io/support.html#deefoodie';
  return app.wip ? app.pitchUrl || app.url : app.url;
}

export function secondaryLabel(app) {
  if (app.privateBeta) return 'Support';
  if (app.wip) return 'Repository';
  return 'Pitch deck';
}

export function secondaryHref(app) {
  if (app.privateBeta) return 'https://shamikhahmed.github.io/support.html';
  return app.pitchUrl || app.url || 'https://shamikhahmed.github.io/support.html';
}
