/*
 * Home of Mind Drift: interactive book prototype
 * =============================================
 *
 * HOW TO CHANGE CHAPTER TITLES AND TEXT
 * -------------------------------------
 * All of the book's words live in the BOOK object just below. You do not need
 * to touch anything else in this file.
 *
 *   BOOK.cover          The title, subtitle and logo on the cover page.
 *   BOOK.intro          The welcome message the typewriter types. "\n" starts a new line.
 *   BOOK.chapters       One entry per section, in reading order. Each entry has:
 *       tocLabel        The line shown in the table of contents.
 *       kicker          The small capital label above the title (e.g. "Chapter 1").
 *       opener          The large mark on the section's left-hand page (e.g. "01").
 *       title           The heading on the section's right-hand page.
 *       paragraphs      The body text. Each item in the list is one paragraph.
 *       externalUrl     Optional. When set, the section's page shows a button that
 *                       opens this address in a new tab. Its table-of-contents
 *                       entry still turns the pages to the section, like any other.
 *       linkLabel       Optional. The text on that button.
 *
 * To add a section, copy one entry, paste it where it belongs and edit it. To
 * remove a section, delete its entry. Page numbers, the table of contents and
 * the navigation all update by themselves.
 *
 * Text is inserted as plain text, so characters like < and & display as typed.
 *
 * HOW THE BOOK IS BUILT
 * ---------------------
 * The book is a list of page sides: [cover, contents, opener 1, body 1, opener 2, ...].
 * Spread n shows side 2n on the left and side 2n+1 on the right. Spread 0 is the
 * cover and contents. Sheet k is the piece of paper between spread k and spread
 * k+1: turning it moves one spread, so a jump from the contents to section 6 turns
 * six sheets. Several sheets can be in the air at once: a long jump fans them over
 * like a riffled book, and a swipe can lift the next page while the last one lands.
 *
 * TESTING A LONGER BOOK
 * ---------------------
 * Add ?pages=30 to the address (for example http://localhost:8080/?pages=30) to pad
 * each section with numbered test pages until the book has 30 pages to turn.
 * Without it the book is exactly as written below.
 *
 * Page-turn feel is tuned in TIMING below.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Content: edit freely                                                */
  /* ------------------------------------------------------------------ */

  const BOOK = {
    cover: {
      title: 'Home of Mind Drift',
      subtitle: 'A publishing and creative company',
      logo: '' // path to Petra's logo (e.g. 'logo.svg'); empty shows a placeholder circle
    },

    intro: 'Welcome to Home of Mind Drift.\n\nTurn the page to begin.',

    chapters: [
      {
        tocLabel: 'Preface',
        kicker: 'Preface',
        opener: 'Preface',
        title: 'About Home of Mind Drift',
        paragraphs: [
          'Placeholder text. This page will introduce Home of Mind Drift, the publishing and creative company behind the books and projects in the chapters that follow.'
        ]
      },
      {
        // Name still to be confirmed with Petra: "Hartwell Academic Press" or "The Hartwell Guides".
        tocLabel: 'Chapter 1: Hartwell Academic Press',
        kicker: 'Chapter 1',
        opener: '01',
        title: 'Hartwell Academic Press',
        paragraphs: [
          'Placeholder text. This chapter will present the Hartwell imprint and its books, with covers, short descriptions and links to each Amazon listing.'
        ]
      },
      {
        tocLabel: 'Chapter 2: Mind Drift',
        kicker: 'Chapter 2',
        opener: '02',
        title: 'Mind Drift',
        paragraphs: [
          'Placeholder text. Reflective essays and news of upcoming books will be collected here.'
        ]
      },
      {
        tocLabel: 'Chapter 3: PETRAFIED',
        kicker: 'Chapter 3',
        opener: '03',
        title: 'PETRAFIED',
        paragraphs: [
          'Placeholder text. A short introduction to PETRAFIED, with a link to the full site.'
        ],
        externalUrl: 'https://petrafiedofficial.com',
        linkLabel: 'Visit PETRAFIED'
      },
      {
        tocLabel: 'Chapter 4: Behind the Pages',
        kicker: 'Chapter 4',
        opener: '04',
        title: 'Behind the Pages',
        paragraphs: [
          'Placeholder text. The story behind the work: how the books are made and the people who make them.'
        ]
      },
      {
        tocLabel: 'Chapter 5: Say Hello',
        kicker: 'Chapter 5',
        opener: '05',
        title: 'Say Hello',
        paragraphs: [
          'Placeholder text. Contact details and a short note on how to get in touch will go here.'
        ]
      }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* Page-turn timing: tune by feel                                      */
  /* ------------------------------------------------------------------ */

  const TIMING = {
    singleTurn: 0.95,  // seconds for one page turn (Next, Previous, a one-page jump)
    speedUp: 0.8,      // in a jump, each extra page shortens every sheet's turn by this factor...
    riffleTurn: 0.45,  // ...but no sheet takes less than this to cross the book
    firstGap: 0.32,    // in a two-page jump, the second sheet lifts this long after the first
    gapSpeedUp: 0.88,  // each extra page shortens the gap between sheets by this factor...
    fastestGap: 0.07,  // ...down to this. A 30-page jump takes about 2.5 seconds.
    leaves: 8,         // most sheets that can be in the air at once
    lift: 18,          // how far (px) a page lifts off the book at the middle of a turn
    curl: 85,          // how much the paper bends while turning (degrees across the sheet; 0 = stiff)
    strips: 10,        // slices used to draw the bend: more is smoother, fewer is lighter
    phoneStrips: 24,   // phones curl the page around a roll, which needs finer slices
    rollRadius: 0.12,  // on phones: radius of the curl, as a share of the page width
    release: 0.24,     // after a swipe, the page takes at least this long to finish turning
    phoneTurn: 0.62,   // phones: seconds for a Next/Previous turn. A released swipe never takes longer.
    phoneLaunch: 1.2,  // phones: a button turn sets off at this multiple of its average speed, then settles
    phoneHurry: 0.18,  // phones: a new turn hurries the page still landing, so it's down within this
    ease: 'power2.inOut',      // a single, unhurried turn
    riffleEase: 'power1.inOut' // pages in a multi-page jump, so they flow into each other
  };

  /* ------------------------------------------------------------------ */
  /* Setup                                                               */
  /* ------------------------------------------------------------------ */

  const $ = (id) => document.getElementById(id);
  const els = {
    body: document.body,
    intro: $('intro'),
    introSheet: $('introSheet'),
    typed: $('typed'),
    skip: $('skipIntro'),
    sound: $('soundToggle'),
    wrap: $('bookWrap'),
    book: $('book'),
    left: $('pageLeft'),
    right: $('pageRight'),
    leaf: $('leaf'),
    underShade: $('underShade'),
    cast: $('cast'),
    edgesLeft: $('edgesLeft'),
    edgesRight: $('edgesRight'),
    prev: $('prevBtn'),
    next: $('nextBtn'),
    position: $('position'),
    contents: $('contentsBtn'),
    progress: $('progressFill'),
    themeColor: document.querySelector('meta[name="theme-color"]')
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionScale = reducedMotion ? 0.55 : 1;

  const TEST_PAGES = readTestPages();
  const chapterStart = []; // the desktop spread where each section begins
  const pages = buildSides(BOOK); // every page side in reading order, as printed

  /*
   * Two layouts. Desktop shows spreads of two pages. Phones show one page at a time
   * filling the screen, and every page appears, cover and section openers included.
   * Both use the same engine: on phones each "spread" is an empty left side (never
   * shown) and one real page on the right, so turning one sheet moves one page.
   */
  const phoneQuery = window.matchMedia('(max-width: 760px)');
  let phone = phoneQuery.matches;
  let sides = [];
  let LAST_SPREAD = 0;
  let strips = TIMING.strips;
  const BLANK = { type: 'blank' };

  function buildLayout() {
    sides = phone
      ? pages.filter((side) => side.type !== 'blank').flatMap((side) => [BLANK, side])
      : pages;
    LAST_SPREAD = sides.length / 2 - 1;
    strips = phone ? TIMING.phoneStrips : TIMING.strips;
  }
  buildLayout();

  // Convert a position between layouts: desktop spread s holds pages 2s and 2s+1.
  const toPhone = (spread) => spread * 2;
  const toDesktop = (spread) => Math.floor(spread / 2);

  /*
   * Where the book is. Sheets before `lo` lie on the left, sheets from `hi` on lie
   * on the right, and sheets lo..hi-1 are in the air. At rest lo === hi, the spread
   * on screen.
   */
  let lo = 0;
  let hi = 0;
  const flights = [];     // sheets in the air, in the order they lifted
  let flightDir = 0;      // +1 forward, -1 back: every sheet in the air turns the same way
  let jumping = false;    // a contents jump is still lifting its sheets
  let drag = null;        // the sheet a finger or the mouse is holding
  let bookReady = false;  // true once the intro has finished
  let introDone = false;
  let soundOn = false;

  // The spread the book is heading for: where it will be once every sheet has landed.
  const destination = () => (flights.length && flightDir > 0 ? hi : lo);
  const isBusy = () => jumping || !!drag || flights.length > 0;

  /* ------------------------------------------------------------------ */
  /* Book model and rendering                                            */
  /* ------------------------------------------------------------------ */

  // Test mode: ?pages=30 in the address. Returns 0 when it is not set.
  function readTestPages() {
    try {
      const n = parseInt(new URLSearchParams(window.location.search).get('pages'), 10);
      return n > 0 ? Math.min(n, 200) : 0;
    } catch (err) {
      return 0;
    }
  }

  function buildSides(book) {
    const list = [{ type: 'cover' }, { type: 'toc' }];
    const count = book.chapters.length;
    const extra = Math.max(0, TEST_PAGES - count); // test mode only: spreads of filler pages
    let filler = 0;
    book.chapters.forEach((chapter, i) => {
      chapterStart[i] = list.length / 2;
      list.push({ type: 'opener', chapter }, { type: 'body', chapter });
      const spreads = Math.floor((extra * (i + 1)) / count) - Math.floor((extra * i) / count);
      for (let k = 0; k < spreads * 2; k++) list.push({ type: 'test', chapter, n: ++filler });
    });
    list.forEach((side, i) => { side.folio = i; });
    if (list.length % 2) list.push({ type: 'blank', folio: list.length });
    return list;
  }

  // Spread that holds a given section (0-based chapter index): its opener page.
  const spreadForChapter = (index) => (phone ? toPhone(chapterStart[index]) : chapterStart[index]);
  // Printed page number of a section's first page.
  const pageForChapter = (index) => pages[chapterStart[index] * 2].folio;
  // The contents page: the right of the first spread on desktop, the second page on phones.
  const contentsSpread = () => (phone ? 1 : 0);
  // Section a spread belongs to, or -1 for the cover and contents.
  function chapterAt(spread) {
    const s = phone ? toDesktop(spread) : spread;
    let found = -1;
    chapterStart.forEach((start, i) => { if (start <= s) found = i; });
    return found;
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tocHTML() {
    // Every entry turns the pages to its section, including sections that link to
    // another site: the link itself is the button on that section's page.
    const items = BOOK.chapters.map((ch, i) =>
      `<li><button class="toc-item" type="button" data-chapter="${i}">` +
        `<span class="toc-num">${i + 1}</span>` +
        `<span class="toc-name">${esc(ch.tocLabel)}</span>` +
        '<span class="toc-lead" aria-hidden="true"></span>' +
        `<span class="toc-page toc-page-num">${pageForChapter(i)}</span></button></li>`
    );
    return `<ul class="toc">${items.join('')}</ul>`;
  }

  // The line across the top of a page: the book's title on the left, the section's on the right.
  const runningHead = (text) => `<p class="running-head" aria-hidden="true">${esc(text)}</p>`;

  function pageHTML(side) {
    const ch = side.chapter;
    let html = '';
    switch (side.type) {
      case 'cover': {
        const logo = BOOK.cover.logo
          ? `<img class="cover-logo" src="${esc(BOOK.cover.logo)}" alt="">`
          : '<span class="cover-logo-slot" aria-hidden="true">Logo</span>';
        html = `<div class="cover-inner">${logo}` +
          `<h1>${esc(BOOK.cover.title)}</h1><div class="rule"></div>` +
          `<p class="cover-sub">${esc(BOOK.cover.subtitle)}</p></div>`;
        break;
      }
      case 'toc':
        html = '<p class="kicker">Table of contents</p><h2>Contents</h2><div class="rule"></div>' + tocHTML();
        break;
      case 'opener': {
        const isWord = ch.opener.length > 3 ? ' is-word' : '';
        html = runningHead(BOOK.cover.title) + '<div class="opener">' +
          `<p class="kicker">${esc(ch.kicker)}</p>` +
          `<p class="opener-mark${isWord}">${esc(ch.opener)}</p>` +
          '<div class="rule"></div>' +
          `<p class="opener-title">${esc(ch.title)}</p></div>`;
        break;
      }
      case 'body':
        html = runningHead(ch.title) +
          `<p class="kicker">${esc(ch.kicker)}</p><h2>${esc(ch.title)}</h2><div class="rule"></div>` +
          ch.paragraphs.map((p, i) => `<p class="text${i === 0 ? ' lead' : ''}">${esc(p)}</p>`).join('');
        if (ch.externalUrl) {
          html += `<a class="page-link" href="${esc(ch.externalUrl)}" target="_blank" rel="noopener noreferrer">` +
            `${esc(ch.linkLabel || 'Visit site')} <span aria-hidden="true">&#8599;</span>` +
            '<span class="sr-only"> (opens in a new tab)</span></a>';
        }
        break;
      case 'test':
        html = runningHead(side.n % 2 ? BOOK.cover.title : ch.title) +
          `<p class="kicker">${esc(ch.kicker)} · test page</p><h2>Test page ${side.n}</h2>` +
          '<div class="rule"></div><p class="text">Added by ?pages= in the address to try long jumps. ' +
          'Not part of the book.</p>';
        break;
      default:
        html = '';
    }
    if (side.type !== 'cover' && side.folio !== undefined) html += `<span class="folio">${side.folio}</span>`;
    return html;
  }

  function paint(el, side, baseClass) {
    el.className = baseClass + (side.type === 'cover' ? ' is-cover' : '');
    el.innerHTML = pageHTML(side);
  }

  /*
   * Each static page has two buffers. A repaint fills the hidden one and swaps,
   * leaving the old content in place (hidden) until the next repaint. This
   * matters on touch screens: the element a finger is resting on must stay in
   * the document for the rest of that gesture, or the browser loses track of it.
   */
  const statics = {
    left: { els: [els.left, els.left.cloneNode(false)], shown: 0, side: -1 },
    right: { els: [els.right, els.right.cloneNode(false)], shown: 0, side: -1 }
  };
  Object.values(statics).forEach((pair) => {
    pair.els[1].removeAttribute('id');
    pair.els[0].after(pair.els[1]);
  });

  function paintStatic(name, side) {
    const pair = statics[name];
    const next = pair.els[1 - pair.shown];
    paint(next, side, `page page-${name} is-shown`);
    pair.els[pair.shown].classList.remove('is-shown');
    pair.shown = 1 - pair.shown;
    return next;
  }

  /*
   * The still pages are what lies beneath the sheets in the air: the left page of
   * spread `lo` and the right page of spread `hi`. While anything is turning they
   * can't be clicked.
   */
  function paintStatics() {
    const inert = flights.length > 0;
    [['left', 2 * lo], ['right', 2 * hi + 1]].forEach(([name, index]) => {
      const pair = statics[name];
      if (pair.side !== index) {
        paintStatic(name, sides[index]);
        pair.side = index;
      }
      pair.els[pair.shown].toggleAttribute('inert', inert);
    });
  }

  function updateUI() {
    const dest = destination();
    if (layoutPending && !jumping && !drag) setTimeout(applyLayout, 0); // a layout switch was waiting for this
    // A page under a finger hasn't turned yet, so the controls keep showing where the
    // drag began. They don't dim or vanish on every swipe; taps are ignored until it ends.
    const settled = drag ? drag.from : dest;
    els.prev.disabled = jumping || settled === 0;
    els.next.disabled = jumping || settled === LAST_SPREAD;
    els.contents.disabled = jumping || settled === contentsSpread();
    els.book.dataset.spread = String(dest);
    if (els.progress) els.progress.style.transform = `scaleX(${(settled / Math.max(1, LAST_SPREAD)).toFixed(4)})`;
    // While sheets are landing, show how far the reader has got so far.
    const reached = flights.length ? (flightDir > 0 ? lo : hi) : lo;
    const chapter = chapterAt(reached);
    if (phone) {
      // Phones show every page, so say which page this is.
      const page = sides[2 * reached + 1];
      if (page.type === 'cover') els.position.textContent = 'Cover';
      else if (page.type === 'toc') els.position.textContent = 'Contents';
      else els.position.textContent = `${BOOK.chapters[chapter].kicker} · page ${page.folio} of ${LAST_SPREAD}`;
    } else if (chapter < 0) {
      els.position.textContent = 'Contents';
    } else {
      els.position.textContent = `${BOOK.chapters[chapter].kicker} · ${chapter + 1} of ${BOOK.chapters.length}`;
    }
  }

  // Page-edge stacks: thicker on the side holding more paper.
  let edgeSheets = -1;
  function updateEdges() {
    let left = lo;
    flights.forEach((f) => { if ((f.dir > 0) === (f.shown >= 0.5)) left += f.count; });
    if (left === edgeSheets) return;
    edgeSheets = left;
    els.edgesLeft.style.setProperty('--sheets', String(left));
    els.edgesRight.style.setProperty('--sheets', String(LAST_SPREAD - left));
  }

  /* ------------------------------------------------------------------ */
  /* Page turning                                                        */
  /* ------------------------------------------------------------------ */

  /*
   * How a jump of `pages` pages moves: how long each sheet takes to cross the book,
   * and how long after one sheet lifts the next one follows. The farther the jump,
   * the quicker each sheet and the closer they follow, so long jumps riffle.
   */
  function jumpTiming(pages) {
    const turn = phone ? TIMING.phoneTurn : TIMING.singleTurn;
    const duration = Math.max(TIMING.riffleTurn, turn * Math.pow(TIMING.speedUp, pages - 1));
    const gap = Math.max(TIMING.fastestGap, TIMING.firstGap * Math.pow(TIMING.gapSpeedUp, pages - 2));
    return { duration: Math.min(duration, turn) * motionScale, gap: gap * motionScale };
  }

  /*
   * An ease that sets off at `launch` times its average speed and comes smoothly to
   * rest (a cubic Hermite curve). Phones use it so a released page carries on at the
   * thumb's own speed instead of braking the moment the thumb lifts. launch = 3 is
   * GSAP's power2.out; launch = 0 starts from rest (a smoothstep).
   */
  function settleEase(launch) {
    const m = clamp(launch, 0, 3);
    return (t) => ((m - 2) * t + (3 - 2 * m)) * t * t + m * t;
  }

  /*
   * A turning sheet is drawn as TIMING.strips thin vertical strips, each hinged
   * to the previous one. Rotating each a little more than the last makes the paper
   * curl. Each strip has a front face (its slice of the right-hand page) and a back
   * face (its slice of the left-hand page it becomes once turned).
   *
   * There are TIMING.leaves of these sheets, so several pages can be in the air.
   * Each has its own cast shadow.
   */
  const DEG = Math.PI / 180;
  const leaves = buildLeaves(TIMING.leaves);
  let geom = null; // spine position and page width, measured as the first sheet lifts

  // After switching layouts: slice every sheet again (phones use finer slices).
  function rebuildLeaves() {
    leaves.forEach((leaf) => {
      leaf.root.textContent = '';
      leaf.parts = buildStrips(leaf.root);
      leaf.key = '';
    });
  }

  function buildLeaves(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const root = i === 0 ? els.leaf : els.leaf.cloneNode(false);
      const cast = i === 0 ? els.cast : els.cast.cloneNode(false);
      if (i > 0) {
        root.removeAttribute('id');
        cast.removeAttribute('id');
        els.leaf.parentNode.appendChild(root);
        els.cast.parentNode.appendChild(cast);
      }
      list.push({ root, cast, parts: buildStrips(root), flight: null, key: '' });
    }
    return list;
  }

  function buildStrips(root) {
    root.style.setProperty('--strips', String(strips));
    const parts = [];
    let parent = root;
    for (let k = 0; k < strips; k++) {
      const strip = document.createElement('div');
      strip.className = 'strip'; // hinged to the previous strip's right edge by its transform (see renderTurn)
      // Back faces are mirrored, so strip k shows the slice k strips in from the spine.
      const front = makeFace('face face-front', k);
      const back = makeFace('face face-back', strips - 1 - k);
      strip.append(front.face, back.face);
      parent.appendChild(strip);
      parent = strip;
      parts.push({ strip, front, back });
    }
    return parts;
  }

  function makeFace(className, slice) {
    const face = document.createElement('div');
    face.className = className;
    const page = document.createElement('div');
    page.style.left = `calc(var(--page-w) * ${(-slice / strips).toFixed(5)})`;
    const shadeA = document.createElement('div');
    shadeA.className = 'face-shade shade-a';
    const shadeB = document.createElement('div');
    shadeB.className = 'face-shade shade-b';
    face.append(page, shadeA, shadeB);
    return { face, page, shadeA, shadeB };
  }

  // Write an opacity or transform only when it changes, to keep per-frame style work
  // small: on a phone most strips lie flat, and their transforms stay the same.
  function setOpacity(el, value) {
    if (el.__opacity === value) return;
    el.__opacity = value;
    el.style.opacity = value;
  }
  function setTransform(el, value) {
    if (el.__transform === value) return;
    el.__transform = value;
    el.style.transform = value;
  }

  /*
   * Filling a sheet means writing its two pages into every strip (48 copies on a
   * phone), too slow for the frame in which a finger starts a swipe. So each sheet
   * remembers what it holds, and while the book is at rest the sheets for the next
   * and previous page are filled ahead of time. A swipe then only has to show one.
   */
  const leafKey = (first, count) => `${2 * first + 1}/${2 * (first + count)}`;
  let prepared = []; // keys of the sheets filled ahead for the page on screen

  function freeLeaf(key) {
    const free = leaves.filter((leaf) => !leaf.flight);
    return free.find((leaf) => leaf.key === key) ||
      free.find((leaf) => !prepared.includes(leaf.key)) ||
      free[0];
  }

  let prepareTimer = 0;
  function schedulePrepare() {
    if (prepareTimer) return;
    const run = () => { prepareTimer = 0; prepareLeaves(); };
    prepareTimer = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 400 }) : setTimeout(run, 120);
  }

  function prepareLeaves() {
    if (isBusy()) return; // the next landing asks again
    const wanted = [];
    if (lo < LAST_SPREAD) wanted.push(lo);  // the page a forward swipe lifts
    if (lo > 0) wanted.push(lo - 1);        // the page a backward swipe lifts
    prepared = wanted.map((first) => leafKey(first, 1));
    wanted.forEach((first) => {
      const key = leafKey(first, 1);
      if (leaves.some((leaf) => leaf.key === key)) return;
      const leaf = freeLeaf(key);
      if (leaf) paintLeaf(leaf, first, 1);
    });
  }

  function paintLeaf(leaf, first, count) {
    const key = leafKey(first, count);
    if (leaf.key === key) return; // already holds these pages
    leaf.key = key;
    const frontSide = sides[2 * first + 1];
    const backSide = sides[2 * (first + count)];
    const frontHTML = pageHTML(frontSide);
    const frontClass = 'page leaf-front' + (frontSide.type === 'cover' ? ' is-cover' : '');
    let backHTML = pageHTML(backSide);
    let backClass = 'page leaf-back' + (backSide.type === 'cover' ? ' is-cover' : '');
    if (phone) {
      // On a phone the back of the turning page is its own reverse side: plain paper
      // with the page's ink showing faintly through, mirrored. The cover's inside is plain.
      backHTML = frontSide.type === 'cover' ? '' : frontHTML;
      backClass = 'page leaf-back show-through';
    }
    leaf.parts.forEach(({ front, back }) => {
      front.page.className = frontClass;
      front.page.innerHTML = frontHTML;
      back.page.className = backClass;
      back.page.innerHTML = backHTML;
    });
  }

  // Darker the more a slice of paper is tilted away from the reader.
  const shadeFor = (angle) => ((1 - Math.abs(Math.cos(angle * DEG))) * 0.5).toFixed(3);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /*
   * Draw a sheet at progress q (0 = not started, 1 = landed) of a turn in
   * direction dir. The free edge leads and the spine side lags, so the page
   * lifts from its outer edge the way a hand turns it. Returns how high the
   * sheet stands (0 lying flat, 1 upright).
   */
  function renderTurn(leaf, dir, q) {
    const p = dir > 0 ? q : 1 - q;          // 0 = lying on the right, 1 = lying on the left
    const sliceW = geom.pageW / strips;
    const angles = new Array(strips);
    let arc = 0;
    if (phone) {
      /*
       * Phones: the page rolls back from its right edge, the way a page curls under
       * a thumb, and the roll travels across the screen to the left. Paper to the
       * left of the roll lies flat; the rest wraps around it and lies on top,
       * showing its reverse side.
       */
      const r = geom.pageW * TIMING.rollRadius;
      const roll = geom.pageW - p * (geom.pageW + Math.PI * r); // where the paper starts to curl
      for (let k = 0; k < strips; k++) {
        angles[k] = -clamp(((k + 0.5) * sliceW - roll) / r, 0, Math.PI) / DEG;
      }
    } else {
      arc = Math.sin(Math.PI * p);          // 0 at rest, 1 standing upright
      const base = -180 * p;
      const bend = TIMING.curl * arc * dir;
      for (let k = 0; k < strips; k++) {
        angles[k] = clamp(base - bend * (k / (strips - 1) - 0.5), -180, 0);
      }
    }

    /*
     * Each strip sits one strip-width along from the one before it. That step goes in
     * the transform, not in `left`: browsers round a 3D layer's left offset to a whole
     * device pixel, and nested 24 deep the rounding added up to about 6px, so the
     * paper fell short of its own shadow and left a bright line along the curl.
     */
    const step = `translateX(${sliceW.toFixed(3)}px) `;
    // The reader's eye (the book's perspective point), in the sheet's own coordinates.
    const eyeX = geom.eyeX - geom.spineX;
    const eyeZ = geom.depth - arc * TIMING.lift;
    let previous = 0;
    let tipX = 0;  // where the free edge is, measured from the spine
    let tipZ = 0;  // and how far it stands off the page, toward the reader
    let edgeX = 0; // the rightmost point of the paper
    for (let k = 0; k < strips; k++) {
      const part = leaf.parts[k];
      const a = angles[k] * DEG;
      setTransform(part.strip, `${k > 0 ? step : ''}rotateY(${(angles[k] - previous).toFixed(2)}deg)`);
      previous = angles[k];
      /*
       * Show the side of this strip that faces the reader and hide the other. The
       * strip is flat, so its facing side is whichever side of its plane the eye is
       * on: the plane's normal (sin a, cos a) against the line from the strip to the eye.
       */
      const front = Math.sin(a) * (eyeX - tipX) + Math.cos(a) * (eyeZ - tipZ) > 0;
      setOpacity(part.front.face, front ? '1' : '0');
      setOpacity(part.back.face, front ? '0' : '1');
      tipX += sliceW * Math.cos(a);
      tipZ -= sliceW * Math.sin(a);
      edgeX = Math.max(edgeX, tipX);
      const a0 = shadeFor(k === 0 ? angles[0] : (angles[k - 1] + angles[k]) / 2);
      const a1 = shadeFor(k === strips - 1 ? angles[k] : (angles[k] + angles[k + 1]) / 2);
      // Each face's shading runs from a0 at one edge to a1 at the other: two opposite
      // fades whose opacities are the edge values. Opacity alone keeps this on the GPU,
      // so the paper and its text are never repainted while the sheet moves.
      setOpacity(part.front.shadeA, a0);
      setOpacity(part.front.shadeB, a1);
      setOpacity(part.back.shadeA, a1);
      setOpacity(part.back.shadeB, a0);
    }

    // Shadows start TUCK px under the paper's edge. Starting exactly at it, the edge's
    // antialiased pixels let the bright page beneath show through as a hairline.
    const TUCK = 2;
    if (phone) {
      // The roll's shadow falls on the page being revealed, just right of the curl.
      setTransform(leaf.root, 'none');
      setTransform(leaf.cast, `translateX(${(geom.spineX + edgeX - TUCK).toFixed(1)}px)`);
      setOpacity(leaf.cast, (0.8 * Math.min(1, p * 12) * Math.min(1, (1 - p) * 6)).toFixed(3));
      return 0;
    }
    setTransform(leaf.root, `translateZ(${(arc * TIMING.lift).toFixed(2)}px)`);
    // The cast shadow sits just beyond the free edge, on whichever side it is over.
    const side = tipX >= 0 ? 1 : -1;
    setTransform(leaf.cast, `translateX(${(geom.spineX + tipX - TUCK * side).toFixed(1)}px) scaleX(${side})`);
    setOpacity(leaf.cast, (arc * 0.9).toFixed(3));
    return arc;
  }

  /*
   * A flight is a sheet in the air. (With reduced motion a long jump turns one
   * thick bundle of sheets instead, so a flight can carry `count` sheets.)
   *
   * Lifting one moves lo or hi, so the still pages beneath always show what a
   * reader would see under the paper in a real book. Sheets land in the order they
   * lifted, and none can overtake the sheet ahead of it.
   */
  // Spine position and page width, read from the still right-hand page (which sits
  // where a sheet does) before anything is written, so no layout is forced mid-gesture.
  // The width is the exact one (offsetWidth rounds to whole pixels), because the strips
  // are spaced by it.
  function measure() {
    const page = statics.right.els[statics.right.shown];
    const bookW = els.book.offsetWidth;
    const depth = parseFloat(getComputedStyle(els.book).perspective); // NaN for 'none'
    return {
      spineX: page.offsetLeft,
      pageW: page.getBoundingClientRect().width,
      bookW,
      eyeX: bookW / 2,                        // perspective-origin is the book's centre
      depth: depth > 0 ? depth : 1e6          // how far the reader's eye is from the page
    };
  }

  // Would a sheet turning this way have paper to turn? False at the first and last page.
  const canTurn = (dir) => (dir > 0 ? hi < LAST_SPREAD : lo > 0);

  function startFlight(dir, count = 1) {
    if (flights.length && flightDir !== dir) finishAll(); // turning the other way: land what's in the air
    settleFalling();
    const first = dir > 0 ? hi : lo - count;
    if (first < 0 || first + count > LAST_SPREAD) return null;
    const key = leafKey(first, count);
    let leaf = freeLeaf(key);
    if (!leaf && flights[0] && flights[0].tween) {
      flights[0].tween.progress(1); // every sheet is in use: land the oldest now
      leaf = freeLeaf(key);
    }
    if (!leaf) return null;

    if (!flights.length) geom = measure();
    if (dir > 0) hi += count; else lo -= count;
    flightDir = dir;
    const flight = { first, count, dir, leaf, q: 0, shown: 0, arc: 0, tween: null, target: 1, duration: 0, done: false };
    leaf.flight = flight;
    flights.push(flight);
    paintLeaf(leaf, first, count); // usually filled ahead already, so this costs nothing
    leaf.root.style.display = 'block';
    paintStatics();
    setQ(flight, 0);
    updateUI();
    return flight;
  }

  function setQ(flight, q) {
    flight.q = q;
    drawFrom(flights.indexOf(flight));
  }

  // Draw the sheet at index i, then any later sheets it was holding back.
  function drawFrom(i) {
    for (let k = i; k >= 0 && k < flights.length; k++) {
      const f = flights[k];
      const shown = k > 0 ? Math.min(f.q, flights[k - 1].shown) : f.q;
      if (k > i && shown === f.shown) break;
      f.shown = shown;
      f.arc = renderTurn(f.leaf, f.dir, shown);
      // Still on the side it lifted from: older sheets are on top. Past the spine: newer ones are.
      const z = shown < 0.5 ? 50 - k : 50 + k;
      if (f.z !== z) {
        f.z = z;
        f.leaf.root.style.zIndex = String(z);
      }
    }
    let arc = 0;
    flights.forEach((f) => { arc = Math.max(arc, f.arc); });
    setOpacity(els.underShade, arc.toFixed(3));
    updateEdges();
  }

  // Animate a sheet to 1 (landed) or 0 (back where it lifted from).
  function flyTo(flight, target, duration, ease) {
    if (flight.tween) flight.tween.kill();
    flight.target = target;
    flight.duration = duration;
    const state = { q: flight.q };
    flight.tween = gsap.to(state, {
      q: target,
      duration,
      ease,
      onUpdate: () => setQ(flight, state.q),
      onComplete() {
        flight.tween = null;
        flight.done = true;
        land();
      }
    });
  }

  function land() {
    let moved = false;
    for (;;) {
      const first = flights[0];
      const last = flights[flights.length - 1];
      let f = null;
      if (first && first.done && first.target === 1) f = flights.shift();     // landings go in lift order
      else if (last && last.done && last.target === 0) f = flights.pop();     // a sheet that fell back is the newest
      if (!f) break;
      if (f.target === 1) {
        if (f.dir > 0) lo += f.count; else hi -= f.count;
        const ahead = f.dir > 0;
        document.dispatchEvent(new CustomEvent('book:turn', {
          detail: { from: ahead ? f.first : f.first + f.count, to: ahead ? f.first + f.count : f.first, duration: f.duration }
        }));
      } else if (f.dir > 0) {
        hi -= f.count;
      } else {
        lo += f.count;
      }
      releaseLeaf(f);
      moved = true;
    }
    if (!moved) return;
    if (flights.length) {
      drawFrom(0); // the next sheet may have been held back by the one that just landed
    } else {
      flightDir = 0;
      setOpacity(els.underShade, '0');
    }
    paintStatics();
    updateEdges();
    updateUI();
    if (!flights.length) schedulePrepare(); // at rest: fill the sheets the next swipe will need
  }

  function releaseLeaf(flight) {
    if (flight.tween) flight.tween.kill();
    flight.leaf.root.style.display = 'none';
    setOpacity(flight.leaf.cast, '0');
    flight.leaf.flight = null;
  }

  /*
   * Phones: a new turn hurries any sheet still landing out of its way. A sheet can't
   * overtake the one ahead of it, so without this a quick second swipe would sit
   * stuck behind the first page instead of following the thumb.
   */
  function hurryAhead(flight) {
    if (!phone) return;
    flights.forEach((f) => {
      if (f === flight || !f.tween || f.target !== 1) return;
      const scale = f.tween.timeScale();
      const left = (f.tween.duration() * (1 - f.tween.progress())) / scale; // real seconds to go
      if (left > TIMING.phoneHurry) f.tween.timeScale((scale * left) / TIMING.phoneHurry);
    });
  }

  // Land everything in the air at once.
  function finishAll() {
    flights.slice().forEach((f) => { if (f.tween) f.tween.progress(1); });
  }

  // A sheet falling back has to be down before another one lifts.
  function settleFalling() {
    const last = flights[flights.length - 1];
    if (last && last.tween && last.target === 0) last.tween.progress(1);
  }

  /*
   * Move to a spread by turning every page in between, in order. The farther the
   * target, the quicker each sheet turns and the closer the next one follows, so
   * long jumps riffle with several pages in the air.
   */
  async function goTo(target) {
    if (!bookReady || jumping || drag) return;
    settleFalling();
    target = clamp(target, 0, LAST_SPREAD);
    const from = destination();
    if (target === from) return;
    const dir = target > from ? 1 : -1;
    const pages = Math.abs(target - from);

    // Reduced motion: one bundle of pages carries the whole jump instead of a riffle.
    if (reducedMotion && pages > 1) {
      const flight = startFlight(dir, pages);
      const duration = TIMING.singleTurn * motionScale;
      if (flight) {
        playTurnSound(duration);
        flyTo(flight, 1, duration, TIMING.ease);
      }
      return;
    }

    const { duration, gap } = jumpTiming(pages);
    // A single turn on a phone moves off the moment the button is tapped, then settles.
    const single = phone ? settleEase(TIMING.phoneLaunch) : TIMING.ease;
    const ease = pages === 1 ? single : TIMING.riffleEase;
    const volume = pages === 1 ? 1 : Math.min(1, (2 * gap) / duration); // overlapping swishes, softer
    jumping = pages > 1;
    updateUI();
    for (let i = 0; i < pages; i++) {
      if (i > 0) await delay(gap);
      const flight = startFlight(dir);
      if (!flight) break;
      if (pages === 1) hurryAhead(flight); // tapping again doesn't wait for the last page
      playTurnSound(duration, volume);
      flyTo(flight, 1, duration, ease);
    }
    jumping = false;
    updateUI();
  }

  // Waits on the animation clock, so jumps stay in step with the sheets.
  const delay = (seconds) => new Promise((resolve) => gsap.delayedCall(seconds, resolve));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ------------------------------------------------------------------ */
  /* Sound (synthesised, off by default)                                 */
  /* ------------------------------------------------------------------ */

  let audio = null;

  function getAudio() {
    try {
      if (!audio) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audio = new Ctx();
      }
      if (audio.state === 'suspended') audio.resume();
      return audio;
    } catch (err) {
      return null;
    }
  }

  function noise(ctx, seconds) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  // A short mechanical tick for each typed character.
  function playKeySound() {
    if (!soundOn) return;
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = noise(ctx, 0.03);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200 + Math.random() * 900;
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  }

  // A soft paper swish for each page turn. Quieter when many pages turn together.
  function playTurnSound(duration, volume = 1) {
    if (!soundOn) return;
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const length = Math.min(0.7, duration * 0.9);
    const src = noise(ctx, length);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.linearRampToValueAtTime(2600, now + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * volume, now + length * 0.3);
    gain.gain.linearRampToValueAtTime(0, now + length);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  }

  function toggleSound() {
    soundOn = !soundOn;
    els.sound.setAttribute('aria-pressed', String(soundOn));
    els.sound.textContent = soundOn ? 'Sound: on' : 'Sound: off';
    if (soundOn && getAudio()) playKeySound();
  }

  /* ------------------------------------------------------------------ */
  /* Typewriter intro                                                    */
  /* ------------------------------------------------------------------ */

  function keyDelay(ch) {
    if (ch === '\n') return 380;
    if (ch === '.' || ch === ',') return 420;
    if (ch === ' ') return 70;
    return 45 + Math.random() * 65; // uneven, like a real typist
  }

  /*
   * Loading. The cream screen and the blinking cursor show from the first paint.
   * Typing waits for the typewriter font, so no letter changes typeface mid-word,
   * and the book waits for its own fonts, which download while the intro plays.
   * Neither waits forever: on a slow connection the fallback font is used instead.
   */
  const FONTS = {
    typewriter: ['1em "Special Elite"'],
    book: ['500 1em "Cormorant Garamond"', '1em "Cormorant Garamond"', 'italic 1em "Cormorant Garamond"',
      '1em "EB Garamond"', 'italic 1em "EB Garamond"', '500 1em "EB Garamond"']
  };

  function loadFonts(list, timeoutMs) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const loads = Promise.all(list.map((font) => document.fonts.load(font).catch(() => null)));
    return Promise.race([loads, wait(timeoutMs)]);
  }

  async function runIntro() {
    loadFonts(FONTS.book, 0); // start the book's fonts downloading now; openBook waits for them
    await loadFonts(FONTS.typewriter, 2000);
    for (const ch of BOOK.intro) {
      if (introDone) return;
      els.typed.textContent += ch;
      if (ch.trim()) playKeySound();
      await wait(keyDelay(ch) * motionScale);
    }
    await wait(1100 * motionScale);
    openBook();
  }

  function skipIntro() {
    if (introDone) return;
    els.typed.textContent = BOOK.intro;
    openBook();
  }

  // Fade the typed sheet away and bring the open book up in its place.
  async function openBook() {
    if (introDone) return;
    introDone = true;
    // Give the book's fonts a moment if they're still on their way (skipping early on a slow connection).
    await loadFonts(FONTS.book, 1500);
    els.body.classList.remove('in-intro');
    setThemeColor();

    gsap.timeline({
      onComplete() {
        els.intro.style.display = 'none';
        bookReady = true;
        updateUI();
      }
    })
      .to(els.introSheet, { y: -36, opacity: 0, duration: 0.7 * motionScale, ease: 'power2.out' }, 0)
      .to(els.skip, { opacity: 0, duration: 0.3 * motionScale }, 0)
      .to(els.intro, { opacity: 0, duration: 0.9 * motionScale, ease: 'power1.inOut' }, 0.45 * motionScale)
      .fromTo(els.wrap,
        // On a phone the page is the whole screen, so it rises gently instead of tilting up like a book on a desk.
        phone
          ? { opacity: 0, y: 14, scale: 0.985 }
          : { opacity: 0, y: 34, scale: 0.96, transformPerspective: 1600, rotateX: 9 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: (phone ? 0.9 : 1.15) * motionScale, ease: 'power3.out', clearProps: 'transform' },
        0.6 * motionScale);
  }

  /* ------------------------------------------------------------------ */
  /* Input: buttons, contents, keys, swipe                               */
  /* ------------------------------------------------------------------ */

  function bindInput() {
    els.sound.addEventListener('click', toggleSound);
    els.skip.addEventListener('click', skipIntro);
    // Clicking again while a page is still turning lifts the next one straight away.
    els.prev.addEventListener('click', () => goTo(destination() - 1));
    els.next.addEventListener('click', () => goTo(destination() + 1));
    els.contents.addEventListener('click', () => goTo(contentsSpread())); // turns every page back to the contents

    let suppressClick = false; // swallows the click that ends a drag

    // Contents entries: each turns the pages to its section.
    els.book.addEventListener('click', (event) => {
      const entry = event.target.closest('[data-chapter]');
      if (!entry) return;
      if (suppressClick) return;
      goTo(spreadForChapter(Number(entry.dataset.chapter)));
    });

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!introDone) {
        if (event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') {
          if (document.activeElement === els.sound) return;
          event.preventDefault();
          skipIntro();
        }
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goTo(destination() + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goTo(destination() - 1); }
      if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      if (event.key === 'End') { event.preventDefault(); goTo(LAST_SPREAD); }
    });

    /*
     * Drag to turn (finger or mouse). Once a press moves sideways, the page
     * follows it. Let go past halfway, or flick, and the page turns; otherwise
     * it falls back. Vertical movement is left to the browser for scrolling.
     *
     * A new swipe doesn't wait for the last page to land: it lifts the next
     * sheet while the previous one is still settling, so fast swipes riffle.
     */
    const FLICK = 0.15;          // px per ms: a release at least this fast counts as a flick
    const VELOCITY_WINDOW = 100; // ms of movement used to measure the release speed
    let press = null;            // pointer down on the book, not yet a drag

    els.wrap.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || !bookReady || jumping || drag) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp };
    });

    els.wrap.addEventListener('pointermove', (event) => {
      if (drag) {
        if (event.pointerId === drag.id) moveDrag(event);
        return;
      }
      if (!press || event.pointerId !== press.id) return;
      const dx = event.clientX - press.x;
      const ax = Math.abs(dx);
      const ay = Math.abs(event.clientY - press.y);
      // A phone has nothing to scroll, so a thumb's natural arc still counts as sideways,
      // and the swipe starts a little sooner.
      if (phone) {
        if (ay > 18 && ay > ax * 1.25) { press = null; return; }
        if (ax < 8 || ax < ay * 0.8) return;
      } else {
        if (ay > 14 && ay > ax) { press = null; return; } // scrolling
        if (ax < 10 || ax < ay * 1.2) return;
      }
      if (jumping) { press = null; return; }
      startDrag(event, dx < 0 ? 1 : -1);
    });

    els.wrap.addEventListener('pointerup', (event) => {
      if (drag && event.pointerId === drag.id) endDrag(false, event);
      press = null;
    });
    els.wrap.addEventListener('pointercancel', (event) => {
      if (drag && event.pointerId === drag.id) endDrag(true, event);
      press = null;
    });

    /*
     * Phones: the page still in the air may be the one this swipe is reaching for: a
     * page falling back, swiped the same way again, or a page landing, swiped back.
     * Then the thumb catches it where it is, instead of snapping it down and lifting
     * another, so a turn can be taken back or retried mid-air.
     */
    function catchable(dir) {
      if (!phone) return null;
      const last = flights[flights.length - 1];
      if (!last || !last.tween) return null;
      return (last.target === 0 ? last.dir === dir : last.dir === -dir) ? last : null;
    }

    function startDrag(event, dir) {
      const from = destination();
      let flight = catchable(dir);
      // The press itself is the first sample, so even a swipe with a single move has a speed.
      let start = { x: press.x, t: press.t };
      if (flight) {
        flight.tween.kill();
        flight.tween = null;
        start = { x: event.clientX, t: event.timeStamp }; // carry on from where the page is: no jump
      } else if (phone && !flights.length && !canTurn(dir)) {
        startStretch(event, dir, from); // first or last page: nothing to turn
        return;
      } else {
        flight = startFlight(dir);
        if (!flight) { press = null; return; } // already at the first or last page
        hurryAhead(flight);
      }
      suppressClick = true;
      // Distance the pointer travels for a full turn: across both pages on desktop. On a phone
      // it is the whole distance the curl travels, so the curl moves exactly with the thumb.
      const span = phone
        ? geom.pageW * (1 + Math.PI * TIMING.rollRadius)
        : geom.bookW * (geom.bookW > geom.pageW * 1.5 ? 0.85 : 0.9);
      drag = { id: event.pointerId, from, x0: start.x, q0: flight.q, dir: flight.dir, flight, span, samples: [start] };
      press = null;
      updateUI();
      try { els.wrap.setPointerCapture(event.pointerId); } catch (err) { /* not critical */ }
      moveDrag(event);
    }

    /*
     * Phones, at the cover or the last page: there is nothing to turn, so the page
     * gives a little under the thumb, more reluctantly the further it's pulled, and
     * springs back when let go. A dead stop would feel like the screen had frozen.
     */
    function startStretch(event, dir, from) {
      const el = statics.right.els[statics.right.shown];
      let base = 0; // a page still springing back is caught where it is
      try { base = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41 || 0; } catch (err) { base = 0; }
      el.style.transition = 'none';
      suppressClick = true;
      drag = { stretch: true, id: event.pointerId, from, x0: press.x, dir, el, base, reach: el.offsetWidth * 0.5, samples: [{ x: press.x, t: press.t }] };
      press = null;
      try { els.wrap.setPointerCapture(event.pointerId); } catch (err) { /* not critical */ }
      moveDrag(event);
    }

    function moveStretch(event) {
      const pulled = Math.max(0, (drag.x0 - event.clientX) * drag.dir); // px in the swipe's direction
      const give = drag.reach * (1 - 1 / ((pulled * 0.55) / drag.reach + 1)); // rubber band
      setTransform(drag.el, `translateX(${(drag.base - drag.dir * give).toFixed(1)}px)`);
    }

    function endStretch(el) {
      el.style.transition = 'transform .5s cubic-bezier(0.23, 1, 0.32, 1)';
      setTransform(el, '');
    }

    function addSample(event) {
      const samples = drag.samples;
      samples.push({ x: event.clientX, t: event.timeStamp });
      while (samples.length > 2 && samples[1].t < event.timeStamp - VELOCITY_WINDOW) samples.shift();
    }

    function moveDrag(event) {
      addSample(event);
      if (drag.stretch) { moveStretch(event); return; }
      setQ(drag.flight, clamp(drag.q0 + ((drag.x0 - event.clientX) * drag.dir) / drag.span, 0, 1));
    }

    function endDrag(cancelled, event) {
      addSample(event); // where the finger left the glass: holding still first means no flick
      if (drag.stretch) {
        const { el } = drag;
        drag = null;
        endStretch(el);
        updateUI();
        setTimeout(() => { suppressClick = false; }, 80);
        return;
      }
      const { flight, dir, samples, span } = drag;
      drag = null;
      const last = samples[samples.length - 1];
      const first = samples.find((s) => s.t >= last.t - VELOCITY_WINDOW) || last;
      // px per ms, positive = in the turning direction.
      const speed = ((first.x - last.x) * dir) / Math.max(1, last.t - first.t);
      const q = flight.q;
      // Past the tipping point it turns unless flicked back; before it only a flick turns it.
      // On phones the curl has further to go, so the tipping point comes sooner.
      const tip = phone ? 0.35 : 0.5;
      const commit = !cancelled && (q >= tip ? speed > -FLICK : speed > FLICK);
      const target = commit ? 1 : 0;
      const remaining = Math.abs(target - q);
      let duration;
      let ease;
      const toward = commit ? speed : -speed; // px per ms in the direction the sheet goes next
      if (phone) {
        // The page leaves at the thumb's own speed and settles, so a flick never brakes
        // the moment the thumb lifts; a page let go at rest starts from rest. The time
        // scales with the distance left, up to a button turn, so the curl is always seen.
        const distance = remaining * span; // px still to travel
        duration = TIMING.phoneTurn * (0.35 + 0.65 * remaining) * motionScale;
        if (toward > 0 && distance > 1) {
          // settleEase can leave at up to 3x its average speed, hence the 3.
          duration = clamp((3 * distance) / (toward * 1000), 0.22 * motionScale, duration);
        }
        ease = settleEase(distance > 1 ? (Math.max(0, toward) * duration * 1000) / distance : 0);
      } else {
        duration = Math.max(TIMING.release, TIMING.singleTurn * 0.85 * remaining);
        if (toward > FLICK) {
          // A flick carries on at the speed the mouse let go, then comes to rest.
          // power2.out starts at three times its average speed, hence the 3.
          duration = clamp((3 * remaining * span) / (toward * 1000), TIMING.release, duration);
        }
        ease = 'power2.out';
        duration *= motionScale;
      }
      if (commit) playTurnSound(duration);
      flyTo(flight, target, duration, ease);
      updateUI();
      setTimeout(() => { suppressClick = false; }, 80);
    }

    // While a page is being dragged the gesture is ours: stop the browser from also
    // treating it as a scroll or fling (a fling would swallow the next tap).
    let touchStart = null;
    els.wrap.addEventListener('touchstart', (event) => {
      const t = event.touches[0];
      touchStart = event.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
    }, { passive: true });
    els.wrap.addEventListener('touchmove', (event) => {
      if (!event.cancelable) return;
      if (drag) { event.preventDefault(); return; }
      const t = event.touches[0];
      if (touchStart && Math.abs(t.clientX - touchStart.x) > Math.abs(t.clientY - touchStart.y)) event.preventDefault();
    }, { passive: false });

    // Stop a drag that started on a link from following it.
    els.wrap.addEventListener('click', (event) => {
      if (suppressClick && event.target.closest('a')) event.preventDefault();
    }, true);
  }

  /* ------------------------------------------------------------------ */
  /* Start                                                               */
  /* ------------------------------------------------------------------ */

  // The browser's own bar colour follows the scene: cream for the intro, then the
  // desk behind the book on desktop, or the paper itself on a phone.
  function setThemeColor() {
    if (!els.themeColor) return;
    els.themeColor.setAttribute('content', !introDone ? '#f5efe1' : phone ? '#fbf7ee' : '#262629');
  }

  /*
   * Crossing the phone/desktop breakpoint (rotating a tablet, resizing a window):
   * land anything in the air, rebuild the page list for the other layout and stay
   * on the same page. Waits for a drag or a jump to finish first.
   */
  let layoutPending = false;
  function applyLayout() {
    if (phone === phoneQuery.matches) return;
    if (drag || jumping) { layoutPending = true; return; }
    layoutPending = false;
    if (window.gsap) finishAll();
    const at = destination();
    phone = phoneQuery.matches;
    const spread = phone ? toPhone(at) : toDesktop(at);
    buildLayout();
    rebuildLeaves();
    lo = hi = clamp(spread, 0, LAST_SPREAD);
    statics.left.side = statics.right.side = -1;
    edgeSheets = -1;
    paintStatics();
    updateEdges();
    updateUI();
    setThemeColor();
    schedulePrepare();
  }
  const watchLayout = () => applyLayout();
  if (phoneQuery.addEventListener) phoneQuery.addEventListener('change', watchLayout);
  else if (phoneQuery.addListener) phoneQuery.addListener(watchLayout);

  paintStatics();
  updateEdges();
  updateUI();

  if (!window.gsap) {
    // Animation library failed to load: show the book without the intro or turns.
    els.intro.style.display = 'none';
    els.body.classList.remove('in-intro');
    els.wrap.style.opacity = '1';
    els.position.textContent = 'Animations could not load. Please refresh the page.';
    return;
  }

  bindInput();
  schedulePrepare(); // fills the first sheet while the intro types
  runIntro();

  // Small hook for testing and debugging in the browser console.
  window.mindDriftBook = {
    goTo,
    get spread() { return destination(); },
    get busy() { return isBusy(); },
    get inAir() { return flights.length; },
    jumpTiming
  };
})();
