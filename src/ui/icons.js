// Pictos vectoriels (trait fin, couleur = celle du texte), à la place des emojis.
const NS = 'http://www.w3.org/2000/svg';
const P = {
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  learn: ['M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z', 'M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z'],
  repeat: ['M17 2l4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'M7 22l-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3'],
  pencil: ['M17 3l4 4L8 20l-5 1 1-5z', 'M14 6l4 4'],
  user: ['M4 21c0-4 4-6 8-6s8 2 8 6', 'circle:12,8,4'],
  headphones: ['M3 14v-2a9 9 0 0 1 18 0v2', 'M3 14h4v6H5a2 2 0 0 1-2-2z', 'M21 14h-4v6h2a2 2 0 0 0 2-2z'],
  layers: ['M12 2l10 5-10 5L2 7z', 'M2 12l10 5 10-5', 'M2 17l10 5 10-5'],
  zap: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  message: ['M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h6'],
  shuffle: ['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
  play: ['fill:M7 4.5v15l13-7.5z'],
  pause: ['fill:M6 4h4v16H6z', 'fill:M14 4h4v16h-4z'],
  prev: ['fill:M19 20L9 12l10-8z', 'M5 19V5'],
  next: ['fill:M5 4l10 8-10 8z', 'M19 5v14'],
  volume: ['M11 5L6 9H2v6h4l5 4z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M19 5a10 10 0 0 1 0 14'],
  flame: ['M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z'],
  target: ['circle:12,12,10', 'circle:12,12,6', 'circle:12,12,2'],
  trophy: ['M8 21h8', 'M12 17v4', 'M7 4h10v5a5 5 0 0 1-10 0z', 'M7 6H4a3 3 0 0 0 3 4', 'M17 6h3a3 3 0 0 1-3 4'],
  check: ['circle:12,12,10', 'M8 12l3 3 5-6'],
  sparkles: ['M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z', 'M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z'],
  back: ['M19 12H5', 'M12 19l-7-7 7-7'],
  star: ['M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z'],
};

export function icon(name, size = 22) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('class', 'svg-ico');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const part of P[name] || []) {
    let el;
    if (part.startsWith('circle:')) {
      const [cx, cy, r] = part.slice(7).split(',');
      el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r);
    } else {
      el = document.createElementNS(NS, 'path');
      const fill = part.startsWith('fill:');
      el.setAttribute('d', fill ? part.slice(5) : part);
      if (fill) el.setAttribute('class', 'solid');
    }
    svg.append(el);
  }
  return svg;
}
