/** Shared UI bits — WIP badges, launch labels */
export function wipBadgeHTML() {
  return '<span class="wip-badge">WIP</span>';
}

export function launchLabel(app) {
  if (app.wip) return `View ${app.name} on GitHub`;
  return `Launch ${app.name}`;
}

export function launchHref(app) {
  return app.wip ? app.pitchUrl || app.url : app.url;
}
