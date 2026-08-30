/* ── Constantes de geometría ── */
const cx = 390, cy = 390, HOLE = 190;
const rS0 = 192, rS1 = 232;
const rT0 = 235, rT1 = 300;
const rY0 = 303, rY1 = 372;

/* Mapa categoría → clave corta para data-cat */
const CAT_KEY = {
  'Grand Slam':       'gs',
  'Masters 1000':     'm1000',
  'Torneo de Maestros':'finals',
  'ATP 500':          'atp500',
  'ATP 250':          'atp250',
  'Oro olímpico':     'olympic',
};

let N = 0;
S.forEach(s => s.T.forEach(t => N += t[3].length));
const step = 360 / N;

const P = (r, a) => {
  const k = (a - 90) * Math.PI / 180;
  return [cx + r * Math.cos(k), cy + r * Math.sin(k)];
};

/* ── Generadores SVG ── */
function arc(r0, r1, a0, a1, f, at) {
  const [x1,y1]=P(r1,a0), [x2,y2]=P(r1,a1), [x3,y3]=P(r0,a1), [x4,y4]=P(r0,a0);
  const L = (a1 - a0) > 180 ? 1 : 0;
  return `<path ${at} class="hot" d="M${x1} ${y1}A${r1} ${r1} 0 ${L} 1 ${x2} ${y2}L${x3} ${y3}A${r0} ${r0} 0 ${L} 0 ${x4} ${y4}Z" fill="${f}" stroke="#FBFAF7" stroke-width="0.9"/>`;
}

function fit(s, fs, avail) {
  const w = String(s).length * fs * 0.545;
  return w > avail ? ` textLength="${avail.toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : '';
}

function radial(r, a, s, fs, fill, w, avail, at, halo) {
  const [x,y] = P(r, a);
  const rot = a > 180 ? a + 90 : a - 90;
  return `<text ${at} x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="${w}" fill="${fill}" stroke="${halo}" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round"${fit(s, fs, avail)}>${s}</text>`;
}

function bandPath(id, r, a0, a1, flip) {
  const [x1,y1]=P(r,a0), [x2,y2]=P(r,a1);
  const L = (a1 - a0) > 180 ? 1 : 0;
  return flip
    ? `<path id="${id}" fill="none" d="M${x2} ${y2}A${r} ${r} 0 ${L} 0 ${x1} ${y1}"/>`
    : `<path id="${id}" fill="none" d="M${x1} ${y1}A${r} ${r} 0 ${L} 1 ${x2} ${y2}"/>`;
}

/* ── Texturas de superficie ── */
const tex = (id, base, marks) =>
  `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${base}"/>${marks}</pattern>`;

const clay  = m => `<circle cx="3" cy="4" r="1.2" fill="${m[0]}"/><circle cx="9" cy="2" r="0.9" fill="${m[1]}"/><circle cx="12" cy="8" r="1.3" fill="${m[0]}"/><circle cx="6" cy="10" r="1" fill="${m[1]}"/><circle cx="2" cy="11" r="0.8" fill="${m[0]}"/><circle cx="10" cy="12.5" r="0.7" fill="${m[1]}"/>`;
const hard  = m => `<circle cx="2" cy="3" r="0.7" fill="${m[0]}"/><circle cx="8" cy="6" r="0.6" fill="${m[1]}"/><circle cx="12" cy="11" r="0.7" fill="${m[0]}"/><circle cx="5" cy="12" r="0.6" fill="${m[1]}"/>`;
const grass = m => `<rect width="14" height="7" fill="${m[0]}"/><path d="M1 14v-4M4 14v-5M7 14v-4M10 14v-5M13 14v-4M2 7V3M6 7V2M11 7V3" stroke="${m[1]}" stroke-width="0.7" opacity=".55"/>`;

let defs =
  tex('tex-clay-d',  '#8E4225', clay(['#7A3419','#A65533'])) +
  tex('tex-clay-m',  '#B85C38', clay(['#A24C2C','#CE7A55'])) +
  tex('tex-hard-d',  '#1B4E7C', hard(['#153F66','#2A6394'])) +
  tex('tex-hard-m',  '#2C6EA8', hard(['#245E92','#4183BC'])) +
  tex('tex-grass-d', '#3C6524', grass(['#345823','#4E7A2F'])) +
  tex('tex-grass-m', '#5B8F3A', grass(['#527F33','#6EA349']));

/* ── Construcción del SVG ── */
let rings = '', labels = '', cur = 0, ti = 0;
const META = [];

S.forEach((s, si) => {
  const sp = s.T.reduce((a, t) => a + t[3].length, 0) * step;
  const s0 = cur, mid = s0 + sp / 2, flip = mid > 90 && mid < 270;

  rings += arc(rS0, rS1, s0, s0 + sp, `url(#tex-${s.k}-d)`, `data-s="${si}"`);
  defs  += bandPath('sp' + si, flip ? rS0 + 15 : rS1 - 16, s0 + 1.5, s0 + sp - 1.5, flip);
  labels += `<text data-s="${si}" font-size="13" font-weight="600" letter-spacing="1.6" fill="${s.tc}" stroke="rgba(20,14,10,.45)" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round" dominant-baseline="middle" class="surf-label"><textPath href="#sp${si}" startOffset="50%" text-anchor="middle">${s.n.toUpperCase()}</textPath></text>`;

  s.T.forEach(t => {
    const tp = t[3].length * step, t0 = cur;
    const catKey = CAT_KEY[t[2]] || 'other';
    const isGS   = catKey === 'gs';
    META[ti] = { full: t[1], cat: t[2], catKey, n: t[3].length, years: t[3], surf: s.n, k: s.k, gs: isGS };

    const catAttr = ` data-cat="${catKey}"${isGS ? ' data-gs="1"' : ''}`;
    rings += arc(rT0, rT1, t0, t0 + tp, `url(#tex-${s.k}-m)`, `data-t="${ti}" data-s="${si}"${catAttr}`);

    t[3].slice().sort((a, b) => a - b).forEach(y => {
      rings  += arc(rY0, rY1, cur, cur + step, s.c[2], `data-t="${ti}" data-s="${si}" data-y="${y}"${catAttr}`);
      labels += radial((rY0+rY1)/2, cur+step/2, y, 11.5, s.yc, 500, rY1-rY0-16, `data-t="${ti}" data-s="${si}"${catAttr}`, 'rgba(251,250,247,.92)');
      cur += step;
    });

    labels += radial((rT0+rT1)/2, t0+tp/2, t[0], 11.5, s.tc, 500, rT1-rT0-12, `data-t="${ti}" data-s="${si}"${catAttr}`, 'rgba(20,14,10,.45)');
    ti++;
  });
});

const iw = 566, ih = iw * 346 / 780;
document.getElementById('chart').insertAdjacentHTML('afterbegin',
  `<svg id="svg" viewBox="0 0 780 786" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs>${defs}</defs>
${rings}
<circle cx="${cx}" cy="${cy}" r="${HOLE}" fill="#F2F0EB"/>
<image href="assets/djokovic.png" x="${cx-iw/2}" y="${cy-ih/2}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet" pointer-events="none"/>
${labels}</svg>`);

/* ── Interacción ── */
const svg   = document.getElementById('svg');
const tip   = document.getElementById('tip');
const chart = document.getElementById('chart');
const all   = [...svg.querySelectorAll('[data-t],[data-s]')];

let locked    = null; /* filtro permanente (click) */
let previewing = null; /* filtro temporal (hover chip) */

const LIT_CLASS = { hard: 'lit-hard', clay: 'lit-clay', grass: 'lit-grass' };

function getLitClass(el) {
  if (el.dataset.gs === '1') return 'lit-gs';
  const si = el.dataset.s;
  return LIT_CLASS[S[si]?.k] || 'lit-hard';
}

function paint(sel) {
  const active = locked || previewing; /* locked tiene prioridad */
  all.forEach(el => {
    let on = true;
    if (active) {
      if (active.type === 'surf') on = el.dataset.s === active.idx;
      else if (active.type === 'cat') on = el.dataset.cat === active.catKey;
    }
    if (on && sel) {
      if (sel.t !== undefined) on = el.dataset.t === sel.t;
      else if (sel.s !== undefined) on = el.dataset.s === sel.s;
    }
    el.classList.remove('dim', 'lit-hard', 'lit-clay', 'lit-grass', 'lit-gs');
    if (!on) el.classList.add('dim');
    else if (sel || previewing) el.classList.add(getLitClass(el));
  });
}

function chipToFilter(f) {
  const surfKeys = { hard: true, clay: true, grass: true };
  if (surfKeys[f]) {
    const idx = String(S.findIndex(s => s.k === f));
    return { type: 'surf', idx };
  }
  return { type: 'cat', catKey: f };
}

function show(html, e) {
  tip.innerHTML = html;
  tip.style.opacity = 1;
  const r = chart.getBoundingClientRect();
  tip.style.left = Math.max(90, Math.min(r.width - 90, e.clientX - r.left)) + 'px';
  tip.style.top  = (e.clientY - r.top - 8) + 'px';
}

function buildTip(m, y) {
  const isOlympic    = m.catKey === 'olympic';
  const isFirstTitle = m.catKey === 'atp250' && m.n === 1 && m.full === 'Dutch Open';
  const badge = m.gs        ? '<span class="gs-badge">GRAND SLAM</span>'
              : isOlympic   ? '<span class="olympic-badge">ORO OLÍMPICO</span>'
              : isFirstTitle ? '<span class="first-badge">PRIMER TÍTULO</span>'
              : '';
  /* Si ganó solo una vez, mostrar año aunque sea hover sobre el arco del torneo */
  const displayYear = m.n === 1
    ? (y || m.years?.[0] || '')
    : y;
  const catLine = (m.gs || isOlympic || isFirstTitle) ? '' : m.cat + ' · ';
  return `<b>${m.full}${badge}</b>${displayYear ? displayYear + ' · ' : ''}${catLine}${m.surf}<br><i>${m.n} ${m.n === 1 ? 'título' : 'títulos'}</i>`;
}

svg.addEventListener('mousemove', e => {
  const el = e.target.closest('[data-t],[data-s]');
  if (!el) { tip.style.opacity = 0; paint(null); return; }

  if (el.dataset.t !== undefined) {
    const m = META[el.dataset.t];
    /* Si solo ganó 1 vez, el año del arco exterior = el único año */
    const y = m.n === 1 ? (el.dataset.y || '') : (el.dataset.y || '');
    show(buildTip(m, y), e);
    paint({ t: el.dataset.t });
  } else {
    const s = S[el.dataset.s];
    const n = s.T.reduce((a, t) => a + t[3].length, 0);
    show(`<b>${s.n}</b>${n} títulos · ${Math.round(n / N * 100)}% del total`, e);
    paint({ s: el.dataset.s });
  }
});

svg.addEventListener('mouseleave', () => {
  tip.style.opacity = 0;
  paint(null);
});

/* ── Preview de chip al hover (sin bloquear) ── */
document.getElementById('filters').addEventListener('mouseover', e => {
  const b = e.target.closest('.chip');
  if (!b || locked) return; /* si hay filtro activo, no preview */
  previewing = chipToFilter(b.dataset.f);
  paint(null);
});
document.getElementById('filters').addEventListener('mouseout', e => {
  if (e.target.closest('.chip') && !e.relatedTarget?.closest('.chip')) {
    previewing = null;
    paint(null);
  }
});

/* ── Chips de filtro ── */
document.getElementById('filters').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;

  const f = b.dataset.f;
  const newFilter = chipToFilter(f);
  const isActive  = locked && JSON.stringify(locked) === JSON.stringify(newFilter);

  previewing = null;
  locked = isActive ? null : newFilter;

  document.querySelectorAll('.chip').forEach(c =>
    c.setAttribute('aria-pressed', String(!isActive && c === b))
  );
  paint(null);
});
