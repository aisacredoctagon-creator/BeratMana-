/**
 * Ikon SVG inline. Selalu `currentColor` (warna diatur CSS lewat token) dan berukuran lewat kelas `.icon`.
 * Chevron, api, suara, jeda diambil dari frame Figma; sisanya digambar dalam gaya yang sama.
 */
export type IconName =
  | 'chevronLeft'
  | 'chevronRight'
  | 'fire'
  | 'star'
  | 'sound'
  | 'pause'
  | 'check'
  | 'cross'
  | 'heart'
  | 'heartLost'
  | 'trophy'
  | 'share'
  | 'plus'
  | 'minus'
  | 'times'
  | 'divide'
  | 'fraction'
  | 'decimal'
  | 'help'
  | 'music'
  | 'target'
  | 'streak'
  | 'timer';

interface IconDef {
  viewBox: string;
  body: string;
  className?: string;
}

const STROKE = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

const ICONS: Record<IconName, IconDef> = {
  chevronLeft: {
    viewBox: '0 0 40 40',
    body: `<path d="M25 31.6667L13.3333 20L25 8.33333" ${STROKE} stroke-width="5.83333"/>`,
  },
  chevronRight: {
    viewBox: '0 0 40 40',
    body: `<path d="M15 8.33333L26.6667 20L15 31.6667" ${STROKE} stroke-width="5.83333"/>`,
  },
  fire: {
    viewBox: '0 0 20 20',
    body: '<path fill="currentColor" d="M16.291 9.16406C15.9118 8.31066 15.3606 7.54469 14.6719 6.91406L14.1035 6.39258C14.0842 6.37536 14.061 6.36314 14.0359 6.35699C14.0107 6.35084 13.9845 6.35095 13.9594 6.35732C13.9344 6.36368 13.9112 6.3761 13.8921 6.39349C13.8729 6.41087 13.8584 6.43269 13.8496 6.45703L13.5957 7.18555C13.4375 7.64258 13.1465 8.10938 12.7344 8.56836C12.707 8.59766 12.6758 8.60547 12.6543 8.60742C12.6328 8.60938 12.5996 8.60547 12.5703 8.57813C12.543 8.55469 12.5293 8.51953 12.5312 8.48438C12.6035 7.30859 12.252 5.98242 11.4824 4.53906C10.8457 3.33984 9.96094 2.4043 8.85547 1.75195L8.04883 1.27734C7.94336 1.21484 7.80859 1.29687 7.81445 1.41992L7.85742 2.35742C7.88672 2.99805 7.8125 3.56445 7.63672 4.03516C7.42188 4.61133 7.11328 5.14648 6.71875 5.62695C6.44419 5.96087 6.13299 6.26289 5.79102 6.52734C4.96739 7.16048 4.29768 7.97175 3.83203 8.90039C3.36753 9.83714 3.12557 10.8685 3.125 11.9141C3.125 12.8359 3.30664 13.7285 3.66602 14.5703C4.01302 15.3808 4.51379 16.1164 5.14063 16.7363C5.77344 17.3613 6.50781 17.8535 7.32617 18.1953C8.17383 18.5508 9.07227 18.7305 10 18.7305C10.9277 18.7305 11.8262 18.5508 12.6738 18.1973C13.4902 17.8575 14.2325 17.3619 14.8594 16.7383C15.4922 16.1133 15.9883 15.3828 16.334 14.5723C16.6928 13.7328 16.8769 12.829 16.875 11.916C16.875 10.9629 16.6797 10.0371 16.291 9.16406Z"/>',
  },
  star: {
    viewBox: '0 0 24 24',
    body: '<path fill="currentColor" d="M12 2.8l2.78 5.93 6.47.8-4.77 4.45 1.24 6.4L12 17.2l-5.72 3.18 1.24-6.4L2.75 9.53l6.47-.8z"/>',
  },
  sound: {
    viewBox: '0 0 20 20',
    body: `<path d="M12.9467 7.05333C13.7283 7.83477 14.1674 8.89474 14.1674 10C14.1674 11.1053 13.7283 12.1652 12.9467 12.9467M15.3033 4.69667C16.7099 6.10319 17.5001 8.01086 17.5001 10C17.5001 11.9891 16.7099 13.8968 15.3033 15.3033M4.655 12.5H3.33333C2.8731 12.5 2.5 12.1269 2.5 11.6667V8.33333C2.5 7.8731 2.8731 7.5 3.33333 7.5H4.655L8.5775 3.5775C9.1025 3.0525 10 3.42417 10 4.16667V15.8333C10 16.5758 9.1025 16.9475 8.5775 16.4225L4.655 12.5" ${STROKE} stroke-width="2.08333"/>`,
  },
  pause: {
    viewBox: '0 0 16 16',
    body: '<path fill="currentColor" d="M5.33333 3.33333C6.06922 3.33333 6.66667 3.93078 6.66667 4.66667V11.3333C6.66667 12.0692 6.06922 12.6667 5.33333 12.6667C4.59745 12.6667 4 12.0692 4 11.3333V4.66667C4 3.93078 4.59745 3.33333 5.33333 3.33333ZM10.6667 3.33333C11.4026 3.33333 12 3.93078 12 4.66667V11.3333C12 12.0692 11.4026 12.6667 10.6667 12.6667C9.93078 12.6667 9.33333 12.0692 9.33333 11.3333V4.66667C9.33333 3.93078 9.93078 3.33333 10.6667 3.33333Z"/>',
  },
  check: {
    viewBox: '0 0 24 24',
    body: `<path d="M5 12.5l4.5 4.5L19 7.5" ${STROKE} stroke-width="3.2"/>`,
    className: 'icon--check',
  },
  cross: {
    viewBox: '0 0 24 24',
    body: `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ${STROKE} stroke-width="3.2"/>`,
    className: 'icon--cross',
  },
  heart: {
    viewBox: '0 0 24 24',
    body: '<path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>',
    className: 'icon--heart',
  },
  heartLost: {
    viewBox: '0 0 24 24',
    body: `<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" ${STROKE} stroke-width="2.4"/>`,
    className: 'icon--heart-lost',
  },
  trophy: {
    viewBox: '0 0 24 24',
    body: `<path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v1.5A3.5 3.5 0 007.5 11M17 6h3v1.5a3.5 3.5 0 01-3.5 3.5M12 14v3.5M8.5 20h7M9.5 17.5h5V20h-5z" ${STROKE} stroke-width="2"/>`,
  },
  share: {
    viewBox: '0 0 24 24',
    body: `<path d="M12 3.5v11.5M8 7l4-4 4 4M5 12v6.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V12" ${STROKE} stroke-width="2.2"/>`,
  },
  plus: {
    viewBox: '0 0 24 24',
    body: `<path d="M12 5v14M5 12h14" ${STROKE} stroke-width="2.4"/>`,
  },
  minus: {
    viewBox: '0 0 24 24',
    body: `<path d="M5 12h14" ${STROKE} stroke-width="2.4"/>`,
  },
  times: {
    viewBox: '0 0 24 24',
    body: `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ${STROKE} stroke-width="2.4"/>`,
  },
  divide: {
    viewBox: '0 0 24 24',
    body: `<path d="M5 12h14" ${STROKE} stroke-width="2.4"/><circle cx="12" cy="5.8" r="1.9" fill="currentColor"/><circle cx="12" cy="18.2" r="1.9" fill="currentColor"/>`,
  },
  /** Pie dengan satu bagian kosong (pecahan = sebagian dari utuh). */
  fraction: {
    viewBox: '0 0 24 24',
    body: `<circle cx="12" cy="12" r="8.8" ${STROKE} stroke-width="2.1"/><path d="M12 12V3.2M12 12h8.8" ${STROKE} stroke-width="2.1"/><path d="M12 12h6.2A6.2 6.2 0 1 1 12 5.8z" fill="currentColor"/>`,
  },
  decimal: {
    viewBox: '0 0 24 24',
    body: `<ellipse cx="6.6" cy="12" rx="3" ry="4.6" ${STROKE} stroke-width="2.1"/><path d="M11.3 18.4l-.9 2.3" ${STROKE} stroke-width="2.4"/><path d="M20.6 7.6h-4.5l-.6 4c.5-.3 1.1-.5 1.8-.5 1.7 0 2.9 1.1 2.9 2.9 0 1.8-1.3 3-3.2 3-1 0-1.9-.4-2.6-1.1" ${STROKE} stroke-width="2.1"/>`,
  },
  help: {
    viewBox: '0 0 24 24',
    body: `<circle cx="12" cy="12" r="9" ${STROKE} stroke-width="2.2"/><path d="M9.3 9.6a2.8 2.8 0 1 1 4.1 2.5c-.9.5-1.4 1.1-1.4 2" ${STROKE} stroke-width="2.2"/><circle cx="12" cy="17.1" r="1.2" fill="currentColor"/>`,
  },
  music: {
    viewBox: '0 0 24 24',
    body: `<path d="M9 17.5V6l10-2v11.5" ${STROKE} stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="2.7" fill="currentColor"/><circle cx="16.5" cy="15.5" r="2.7" fill="currentColor"/>`,
  },
  target: {
    viewBox: '0 0 24 24',
    body: `<circle cx="12" cy="12" r="8.5" ${STROKE} stroke-width="2.2"/><circle cx="12" cy="12" r="4" ${STROKE} stroke-width="2.2"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
  },
  streak: {
    viewBox: '0 0 20 20',
    body: '<path fill="currentColor" d="M10 18.73c-3.9 0-6.88-2.8-6.88-6.82 0-1 .24-2 .7-3 .46-.9 1.1-1.7 1.97-2.38.34-.26.65-.56.92-.9.4-.48.7-1 .93-1.6.18-.47.25-1.03.22-1.67l-.04-.94c0-.12.13-.2.24-.14l.8.47c1.1.65 2 1.6 2.63 2.8.77 1.44 1.12 2.77 1.05 3.95 0 .03.01.07.04.1.03.03.06.03.08.03.02 0 .05-.01.08-.04.41-.46.7-.93.86-1.4l.26-.73c.03-.1.15-.14.24-.06l.57.52a7.6 7.6 0 012.14 3.8c.16.76.19 1.5.1 2.2-.2 2.8-3.1 6.8-6.9 6.8z"/>',
  },
  timer: {
    viewBox: '0 0 20 20',
    body: '<circle class="timer-ring__track" cx="10" cy="10" r="8.6" fill="none" stroke-width="2.2"/><circle class="timer-ring__bar" cx="10" cy="10" r="8.6" fill="none" stroke-width="2.5" stroke-linecap="round" pathLength="100" transform="rotate(-90 10 10)"/>',
    className: 'timer-ring',
  },
};

const NS = 'http://www.w3.org/2000/svg';

/** Membuat elemen <svg> dari definisi ikon. `extraClass` ditambahkan di samping `.icon`. */
export function icon(name: IconName, extraClass = ''): SVGSVGElement {
  const def = ICONS[name];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', def.viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', ['icon', def.className, extraClass].filter(Boolean).join(' '));
  svg.innerHTML = def.body; // markup statis milik kode ini, bukan masukan pengguna
  return svg;
}
