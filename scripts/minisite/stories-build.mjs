/**
 * Story pages for Cap mini-sites — loaded by build-minisites.mjs.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const NEEDS = ['family', 'health', 'money', 'travel', 'learning', 'fun'];

export function loadStoryBundles(contentDir) {
  const dir = join(contentDir, 'stories');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'schema.json')
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(dir, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function personaShortId(personaId) {
  const i = personaId.lastIndexOf('-');
  return i >= 0 ? personaId.slice(i + 1) : personaId;
}

export function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function featureLabel(app, fid, esc) {
  const ids = app.featureIds || [];
  const i = ids.indexOf(fid);
  if (i >= 0 && app.features?.[i]) return esc(app.features[i]);
  return esc(fid.replace(/-/g, ' '));
}

/** existsFn(relWithExt) — path relative to content/stories/<slug>/ e.g. ayesha/01-home.webp */
function storyMediaSrc(rel, existsFn) {
  if (!rel) return null;
  for (const ext of ['.webp', '.png', '.jpg']) {
    if (existsFn(`${rel}${ext}`)) return `media/${rel}${ext}`;
  }
  return null;
}

function copyStoryAssets(bundle, contentDir, outSlugDir) {
  const srcRoot = join(contentDir, 'stories', bundle.slug);
  const destRoot = join(outSlugDir, 'stories', 'media');
  mkdirSync(destRoot, { recursive: true });
  for (const p of bundle.personas) {
    const sub = personaShortId(p.id);
    const from = join(srcRoot, sub);
    if (!existsSync(from)) continue;
    const dest = join(destRoot, sub);
    mkdirSync(dest, { recursive: true });
    for (const f of readdirSync(from, { withFileTypes: true })) {
      if (!f.isFile()) continue; // skip _devices/ and other dirs (v7 weight budget)
      if (f.name === 'README.md' || f.name === '.gitkeep') continue;
      cpSync(join(from, f.name), join(dest, f.name), { force: true });
    }
  }
}

export function buildStoriesForApp(app, bundle, ctx) {
  const { contentDir, outDir, BASE, esc, head, topbar, deviceFigure } = ctx;
  if (!bundle?.personas?.length) return { htmlPatches: null, storyUrls: [] };

  copyStoryAssets(bundle, contentDir, outDir);
  const pal = ctx.pal;
  const storyUrls = [];
  const personas = bundle.personas;

  const existsMedia = (relPath) => existsSync(join(contentDir, 'stories', bundle.slug, relPath));

  for (let pi = 0; pi < personas.length; pi++) {
    const p = personas[pi];
    const prev = personas[(pi + personas.length - 1) % personas.length];
    const next = personas[(pi + 1) % personas.length];
    const pageDir = join(outDir, 'stories', p.id);
    mkdirSync(pageDir, { recursive: true });

    const deviceDims = { iphone: [402, 874], ipad: [820, 1180], mac: [1280, 800] };
    const normDevice = (d) => (d === 'ipad' || d === 'mac' ? d : 'iphone');

    const heroShot = p.day[0];
    const heroRel = storyMediaSrc(heroShot?.shot, existsMedia);
    const heroExt = heroShot?.shot && existsMedia(`${heroShot.shot}.webp`)
      ? '.webp'
      : heroShot?.shot && existsMedia(`${heroShot.shot}.png`)
        ? '.png'
        : null;
    const heroDevice = normDevice(heroShot?.device);
    const [heroW, heroH] = deviceDims[heroDevice];
    const heroDev = heroRel && heroExt
      ? { device: heroDevice, src: `../media/${heroShot.shot}${heroExt}`, screen: heroShot.title, w: heroW, h: heroH, theme: 'light' }
      : null;

    const timeline = p.day
      .map((step, si) => {
        const rel = storyMediaSrc(step.shot, existsMedia);
        const ext = existsMedia(`${step.shot}.webp`) ? '.webp' : existsMedia(`${step.shot}.png`) ? '.png' : null;
        const device = normDevice(step.device);
        const [dw, dh] = deviceDims[device];
        const img = rel && ext
          ? `<button type="button" class="shot story-shot" data-story-i="${si}" aria-label="${esc(step.title)} — open larger">
          ${deviceFigure({ device, src: `../media/${step.shot}${ext}`, screen: step.title, w: dw, h: dh }, '')}</button>`
          : `<div class="story-shot__ph" role="status">Screenshot pending capture</div>`;
        return `<li class="story-step story-step--${device}${si % 2 ? ' story-step--alt' : ''}">
          <time datetime="${esc(step.time)}">${esc(step.time)} <span class="story-step__device">${device === 'mac' ? 'Mac' : device === 'ipad' ? 'iPad' : 'iPhone'}</span></time>
          <div class="story-step__body prose">
            <h3>${esc(step.title)}</h3>
            <p>${esc(step.text)}</p>
            ${img}
          </div>
        </li>`;
      })
      .join('');

    const beforeCol = p.before.map((m) => `<div class="metric"><span class="metric__val">${esc(m.value)}</span><span class="metric__lbl">${esc(m.label)}</span></div>`).join('');
    const afterCol = p.after.map((m) => `<div class="metric"><span class="metric__val">${esc(m.value)}</span><span class="metric__lbl">${esc(m.label)}</span></div>`).join('');

    const chips = p.features_used
      .map((fid) => `<a class="story-chip" href="/apps/${esc(app.slug)}/#feat-${esc(fid)}">${featureLabel(app, fid, esc)}</a>`)
      .join('');

    const hasVideo = ['mp4', 'webm'].some((k) => p.video?.[k] && existsMedia(p.video[k]));
    const poster = p.video?.poster && existsMedia(p.video.poster) ? `../media/${p.video.poster}` : '';
    const vtt = p.video?.vtt && existsMedia(p.video.vtt) ? `../media/${p.video.vtt}` : '';

    const videoBlock = `<section class="section story-video" aria-labelledby="watch-h">
      <div class="section__head"><div><h2 id="watch-h">Watch it</h2><p>A day across devices — silent walkthrough with captions. No autoplay with sound.</p></div></div>
      ${hasVideo
        ? `<figure class="story-video__fig">
          <video controls playsinline preload="none" ${poster ? `poster="${esc(poster)}"` : ''} width="960" height="540">
            ${p.video.webm && existsMedia(p.video.webm) ? `<source src="../media/${esc(p.video.webm)}" type="video/webm">` : ''}
            ${p.video.mp4 && existsMedia(p.video.mp4) ? `<source src="../media/${esc(p.video.mp4)}" type="video/mp4">` : ''}
            ${vtt ? `<track kind="captions" srclang="en" label="English" src="${esc(vtt)}" default>` : ''}
          </video>
        </figure>`
        : `<p class="story-video__pending prose">Video capture pending — run <code>capture-story.mjs</code> for this persona.</p>`}
      <details class="story-transcript prose"><summary>Read transcript</summary><p>${esc(p.video?.transcript || '')}</p></details>
    </section>`;

    const canonical = `${BASE}/apps/${app.slug}/stories/${p.id}/`;
    const html = `${head({ title: `${p.headline} — ${app.name}`, desc: p.summary, canonical, og: `${BASE}/apps/${app.slug}/og.png`, pal })}
<body data-app="${esc(app.slug)}" data-story="1">
${topbar(app, true, true)}
<main id="main" class="story-main">
  <p class="story-fictional"><span class="chip">Fictional example</span> ${esc(bundle.disclaimer)}</p>
  <section class="story-hero" aria-labelledby="story-h1">
    <div class="story-hero__text prose">
      <p class="eyebrow">${esc(app.name)} · ${esc(p.city)}</p>
      <h1 id="story-h1">${esc(p.headline)}</h1>
      <p class="hero__lead">${esc(p.summary)}</p>
      <figure class="persona-card card" aria-label="Fictional persona">
        <span class="persona-card__av" aria-hidden="true">${esc(initials(p.name))}</span>
        <span class="persona-card__meta"><strong>${esc(p.name)}</strong>, ${p.age} <span class="chip chip--sm">Fictional</span><br>${esc(p.goal)}</span>
        <blockquote class="persona-card__quote">“${esc(p.quote)}”</blockquote>
      </figure>
    </div>
    ${heroDev ? `<div class="story-hero__shot">${deviceFigure(heroDev, 'eager')}</div>` : ''}
  </section>

  <section class="section story-compare" aria-labelledby="compare-h">
    <div class="section__head"><div><h2 id="compare-h">Before and after</h2><p>Made-up numbers for a fictional week — not a real customer case.</p></div></div>
    <div class="story-compare__grid">
      <div class="card story-compare__col"><h3>Before</h3>${beforeCol}</div>
      <div class="card story-compare__col story-compare__col--after"><h3>After ${esc(app.name)}</h3>${afterCol}</div>
    </div>
  </section>

  <section class="section story-day" aria-labelledby="day-h">
    <div class="section__head"><div><h2 id="day-h">A fictional day with ${esc(p.name.split(' ')[0])}</h2><p>Sample screens for the story — not a recorded real session.</p></div></div>
    <ol class="story-timeline">${timeline}</ol>
  </section>

  ${videoBlock}

  <section class="section" aria-labelledby="feat-h">
    <div class="section__head"><div><h2 id="feat-h">Features ${esc(p.name.split(' ')[0])} uses</h2></div></div>
    <div class="story-chips">${chips}</div>
  </section>

  <nav class="story-nav" aria-label="More examples">
    <a class="btn btn--ghost" href="/apps/${esc(app.slug)}/stories/${esc(prev.id)}/">← ${esc(prev.name.split(' ')[0])}</a>
    <a class="btn btn--fill" href="${esc(app.url || `/apps/${app.slug}/`)}#install">Try ${esc(app.name)}</a>
    <a class="btn btn--ghost" href="/apps/${esc(app.slug)}/stories/${esc(next.id)}/">${esc(next.name.split(' ')[0])} →</a>
  </nav>
  <p class="story-fictional story-fictional--foot">${esc(bundle.disclaimer)}</p>
</main>
<footer class="foot">
  <nav class="foot__links" aria-label="Footer"><a href="/apps/${esc(app.slug)}/">${esc(app.name)}</a><a href="/stories/">All examples</a><a href="/apps/">All Caps</a><a href="/">Capricorn OS</a></nav>
  <p class="foot__fine">© ${new Date().getFullYear()} Capricorn Systems, Karachi.</p>
</footer>
<dialog class="lightbox" id="lightbox" aria-label="Screenshot">
  <button type="button" class="lightbox__close" data-lb="close" aria-label="Close">✕</button>
  <button type="button" class="lightbox__nav lightbox__nav--prev" data-lb="-1" aria-label="Previous">‹</button>
  <figure><img id="lbImg" alt="" decoding="async"><figcaption id="lbCap"></figcaption></figure>
  <button type="button" class="lightbox__nav lightbox__nav--next" data-lb="1" aria-label="Next">›</button>
</dialog>
<script type="application/json" id="story-shots">${JSON.stringify(p.day.map((s) => ({ title: s.title, alt: s.alt, src: existsMedia(`${s.shot}.webp`) ? `../media/${s.shot}.webp` : existsMedia(`${s.shot}.png`) ? `../media/${s.shot}.png` : '' }))).replace(/</g, '\\u003c')}</script>
<script src="/apps/assets/minisite.js" defer></script>
</body>
</html>`;

    writeFileSync(join(pageDir, 'index.html'), html);
    storyUrls.push(canonical);
  }

  return { storyUrls, personas, bundle };
}

export function renderWhoUses(app, bundle, esc) {
  if (!bundle?.personas?.length) return '';
  const cards = bundle.personas
    .map(
      (p) => `<a class="persona-teaser card" href="/apps/${esc(app.slug)}/stories/${esc(p.id)}/">
      <span class="persona-teaser__av" aria-hidden="true">${esc(initials(p.name))}</span>
      <span class="persona-teaser__body">
        <strong>${esc(p.name)}</strong><span class="persona-teaser__meta">${p.age} · ${esc(p.city)}</span>
        <span class="persona-teaser__goal">${esc(p.goal)}</span>
        <span class="persona-teaser__quote">“${esc(p.quote)}”</span>
      </span>
    </a>`,
    )
    .join('');
  return `<section class="section" id="stories" aria-labelledby="who-h">
    <div class="section__head"><div><h2 id="who-h">Example days with ${esc(app.name)}</h2><p>Fictional walkthroughs — people, screenshots, and numbers are made up for the story.</p></div><a class="btn btn--ghost btn--sm" href="/stories/?app=${esc(app.slug)}">All examples</a></div>
    <div class="persona-grid">${cards}</div>
  </section>`;
}

export function renderStoriesIndex(allEntries, APPS, versions, ctx) {
  const { BASE, esc, head, topbar, pal } = ctx;
  if (!pal?.light?.bg) throw new Error('renderStoriesIndex requires ctx.pal from build-minisites');
  const cards = allEntries
    .map(({ app, persona, bundle }) => {
      const needs = (persona.needs || []).join(' ');
      return `<li class="story-index__item" data-needs="${esc(needs)}" data-app="${esc(app.slug)}" data-search="${esc(`${persona.name} ${persona.city} ${persona.goal} ${persona.headline} ${app.name}`.toLowerCase())}">
        <a class="story-index__link card" href="/apps/${esc(app.slug)}/stories/${esc(persona.id)}/">
          <span class="persona-teaser__av" aria-hidden="true">${esc(initials(persona.name))}</span>
          <span>
            <span class="eyebrow">${esc(app.name)}</span>
            <strong class="story-index__title">${esc(persona.headline)}</strong>
            <span class="persona-teaser__meta">${esc(persona.name)}, ${persona.age} · ${esc(persona.city)}</span>
          </span>
        </a>
      </li>`;
    })
    .join('');

  const appChips = APPS.filter((a) => allEntries.some((e) => e.app.slug === a.slug))
    .map((a) => `<button type="button" class="story-filter" data-filter-app="${esc(a.slug)}">${esc(a.name)}</button>`)
    .join('');

  const needChips = NEEDS.map((n) => `<button type="button" class="story-filter" data-filter-need="${n}">${n.charAt(0).toUpperCase() + n.slice(1)}</button>`).join('');

  return `${head({ title: 'Example stories — Capricorn Caps', desc: 'Fictional example days with each Cap. People, screenshots, and numbers are made up — not real customer stories.', canonical: `${BASE}/stories/`, og: `${BASE}/assets/og.png`, pal })}
<body data-stories-index="1">
${topbar(null, false)}
<main id="main">
  <section class="hero hero--index" aria-labelledby="h1">
    <div class="hero__text prose">
      <p class="eyebrow">Capricorn Systems</p>
      <h1 id="h1">Example stories</h1>
      <p class="hero__lead">Fictional walkthroughs for each Cap. People, screenshots, and numbers are made up — not real customers or case studies.</p>
    </div>
  </section>
  <section class="section story-index" aria-labelledby="find-h">
    <div class="section__head"><div><h2 id="find-h">Find an example</h2></div></div>
    <label class="story-search">
      <span class="visually-hidden">Search examples</span>
      <input type="search" id="storySearch" enterkeyhint="search" autocomplete="off" placeholder="Search by name, city or app">
    </label>
    <div class="story-filters" role="group" aria-label="Filter by need">
      <button type="button" class="story-filter is-on" data-filter-need="all">All</button>
      ${needChips}
    </div>
    <div class="story-filters" role="group" aria-label="Filter by app">
      <button type="button" class="story-filter is-on" data-filter-app="all">All apps</button>
      ${appChips}
    </div>
    <p id="storyEmpty" class="story-empty" hidden>No examples match. Try clearing filters.</p>
    <ul class="story-index__list" id="storyList">${cards}</ul>
  </section>
</main>
<footer class="foot"><nav class="foot__links" aria-label="Footer"><a href="/apps/">All Caps</a><a href="/">Capricorn OS</a><a href="/support.html">Support</a></nav><p class="foot__fine">© ${new Date().getFullYear()} Capricorn Systems, Karachi.</p></footer>
<script src="/apps/assets/minisite.js" defer></script>
</body>
</html>`;
}

export { NEEDS };
