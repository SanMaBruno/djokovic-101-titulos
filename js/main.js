/* ── Constantes de geometría ── */
const cx = 390, cy = 390, HOLE = 190;
const rS0 = 192, rS1 = 232;
const rT0 = 235, rT1 = 300;
const rY0 = 303, rY1 = 372;

const GRAND_SLAMS = new Set(['Grand Slam']);

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
  labels += `<text data-s="${si}" font-size="13" font-weight="600" letter-spacing="1.6" fill="${s.tc}" stroke="rgba(20,14,10,.45)" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round" dominant-baseline="middle"><textPath href="#sp${si}" startOffset="50%" text-anchor="middle">${s.n.toUpperCase()}</textPath></text>`;

  s.T.forEach(t => {
    const tp = t[3].length * step, t0 = cur;
    const isGS = GRAND_SLAMS.has(t[2]);
    META[ti] = { full: t[1], cat: t[2], n: t[3].length, surf: s.n, k: s.k, gs: isGS };

    const gsAttr = isGS ? ' data-gs="1"' : '';
    rings += arc(rT0, rT1, t0, t0 + tp, `url(#tex-${s.k}-m)`, `data-t="${ti}" data-s="${si}"${gsAttr}`);

    t[3].slice().sort((a, b) => a - b).forEach(y => {
      rings  += arc(rY0, rY1, cur, cur + step, s.c[2], `data-t="${ti}" data-s="${si}" data-y="${y}"${gsAttr}`);
      labels += radial((rY0+rY1)/2, cur+step/2, y, 11.5, s.yc, 500, rY1-rY0-16, `data-t="${ti}" data-s="${si}"`, 'rgba(251,250,247,.92)');
      cur += step;
    });

    labels += radial((rT0+rT1)/2, t0+tp/2, t[0], 11.5, s.tc, 500, rT1-rT0-12, `data-t="${ti}" data-s="${si}"`, 'rgba(20,14,10,.45)');
    ti++;
  });
});

const iw = 566, ih = iw * 346 / 780;
document.getElementById('chart').insertAdjacentHTML('afterbegin',
  `<svg id="svg" viewBox="0 0 780 786" role="img" xmlns="http://www.w3.org/2000/svg">
<title>Los 101 títulos ATP de Novak Djokovic por superficie, torneo y año</title>
<desc>Gráfico radial: anillo exterior con el año de cada título, anillo medio con el torneo y anillo interior con la superficie. 72 títulos en pista dura, 21 en arcilla y 8 en césped.</desc>
<defs>${defs}</defs>
${rings}
<circle cx="${cx}" cy="${cy}" r="${HOLE}" fill="#FBFAF7"/>
<image href="assets/djokovic.png" x="${cx-iw/2}" y="${cy-ih/2}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet"/>
${labels}</svg>`);

/* ── Interacción ── */
const svg   = document.getElementById('svg');
const tip   = document.getElementById('tip');
const chart = document.getElementById('chart');
const all   = [...svg.querySelectorAll('[data-t],[data-s]')];

/* locked puede ser: null | { type:'surf', idx:string } | { type:'gs' } */
let locked = null;

const LIT_CLASS = { hard: 'lit-hard', clay: 'lit-clay', grass: 'lit-grass' };

function getLitClass(el) {
  if (el.dataset.gs === '1') return 'lit-gs';
  const si = el.dataset.s;
  return LIT_CLASS[S[si]?.k] || 'lit-hard';
}

function paint(sel) {
  all.forEach(el => {
    let on = true;

    /* Filtro activo */
    if (locked) {
      if (locked.type === 'surf')  on = el.dataset.s === locked.idx;
      else if (locked.type === 'gs') on = el.dataset.gs === '1';
    }

    /* Hover adicional */
    if (on && sel) {
      if (sel.t !== undefined) on = el.dataset.t === sel.t;
      else if (sel.s !== undefined) on = el.dataset.s === sel.s;
      else if (sel.gs) on = el.dataset.gs === '1';
    }

    /* Limpiar clases de luz */
    el.classList.remove('dim', 'lit-hard', 'lit-clay', 'lit-grass', 'lit-gs');

    if (!on) {
      el.classList.add('dim');
    } else if (sel) {
      el.classList.add(getLitClass(el));
    }
  });
}

function show(html, e) {
  tip.innerHTML = html;
  tip.style.opacity = 1;
  const r = chart.getBoundingClientRect();
  tip.style.left = Math.max(90, Math.min(r.width - 90, e.clientX - r.left)) + 'px';
  tip.style.top  = (e.clientY - r.top - 8) + 'px';
}

svg.addEventListener('mousemove', e => {
  const el = e.target.closest('[data-t],[data-s]');
  if (!el) { tip.style.opacity = 0; paint(null); return; }

  if (el.dataset.t !== undefined) {
    const m = META[el.dataset.t];
    const y = el.dataset.y;
    const gsBadge = m.gs ? '<span class="gs-badge">GRAND SLAM</span>' : '';
    show(`<b>${m.full}${gsBadge}</b>${y ? y + ' · ' : ''}${m.cat}<br><i>${m.surf} · ${m.n} ${m.n === 1 ? 'título' : 'títulos'}</i>`, e);
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

/* ── Chips de leyenda ── */
document.getElementById('legend').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;

  const f = b.dataset.f;
  const allChips = document.querySelectorAll('.chip');

  if (f === 'gs') {
    /* Toggle Grand Slam */
    const active = locked?.type === 'gs';
    locked = active ? null : { type: 'gs' };
    allChips.forEach(c => c.setAttribute('aria-pressed', String(!active && c === b)));
  } else {
    /* Toggle superficie */
    const idx = String(S.findIndex(s => s.k === f));
    const active = locked?.type === 'surf' && locked.idx === idx;
    locked = active ? null : { type: 'surf', idx };
    allChips.forEach(c => c.setAttribute('aria-pressed', String(!active && c === b)));
  }

  paint(null);
});
