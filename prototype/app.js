/*
 * Home of Mind Drift: interactive book prototype
 * =============================================
 *
 * HOW TO CHANGE CHAPTER TITLES AND TEXT
 * -------------------------------------
 * All of the book's words live in the BOOK object just below. You do not need
 * to touch anything else in this file.
 *
 *   BOOK.cover          The title and subtitle on the cover page.
 *   BOOK.intro          The welcome message the typewriter types. "\n" starts a new line.
 *   BOOK.chapters       One entry per section, in reading order. Each entry has:
 *       tocLabel        The line shown in the table of contents.
 *       kicker          The small capital label above the title (e.g. "Chapter 1").
 *       opener          The large mark on the section's left-hand page (e.g. "01").
 *       title           The heading on the section's right-hand page.
 *       paragraphs      The body text. Each item in the list is one paragraph.
 *       externalUrl     Optional. When set, the table-of-contents entry opens this
 *                       address in a new tab instead of turning pages, and the
 *                       section's page shows a button linking to it.
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
 * cover and contents; section k (counting from 1) is spread k. Turning one page
 * moves one spread, so a jump from the contents to section 6 turns six pages.
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
      subtitle: 'A publishing and creative company'
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
    singleTurn: 0.95,  // seconds for one page turn (Next, Previous, swipe, a one-page jump)
    fastestTurn: 0.24, // no turn is ever quicker than this, however long the jump
    speedUp: 0.8,      // each extra page in a jump multiplies the per-page time by this
    lift: 18,          // how far (px) a page lifts off the book at the middle of a turn
    curl: 85,          // how much the paper bends while turning (degrees across the sheet; 0 = stiff)
    strips: 10,        // slices used to draw the bend: more is smoother, fewer is lighter
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
    contents: $('contentsBtn')
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionScale = reducedMotion ? 0.55 : 1;

  const sides = buildSides(BOOK);
  const LAST_SPREAD = sides.length / 2 - 1;

  let current = 0;        // spread on screen
  let busy = false;       // true while pages are turning
  let bookReady = false;  // true once the intro has finished
  let introDone = false;
  let soundOn = false;

  /* ------------------------------------------------------------------ */
  /* Book model and rendering                                            */
  /* ------------------------------------------------------------------ */

  function buildSides(book) {
    const list = [{ type: 'cover' }, { type: 'toc' }];
    book.chapters.forEach((chapter) => {
      list.push({ type: 'opener', chapter }, { type: 'body', chapter });
    });
    list.forEach((side, i) => { side.folio = i; });
    if (list.length % 2) list.push({ type: 'blank', folio: list.length });
    return list;
  }

  // Spread that holds a given section (0-based chapter index).
  const spreadForChapter = (index) => index + 1;
  // Printed page number of a section's first page.
  const pageForChapter = (index) => sides[spreadForChapter(index) * 2].folio;

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tocHTML() {
    const items = BOOK.chapters.map((ch, i) => {
      const inner =
        `<span class="toc-num">${i + 1}</span>` +
        `<span class="toc-name">${esc(ch.tocLabel)}</span>` +
        '<span class="toc-lead" aria-hidden="true"></span>';
      if (ch.externalUrl) {
        return `<li><a class="toc-item" href="${esc(ch.externalUrl)}" target="_blank" rel="noopener noreferrer">` +
          `${inner}<span class="toc-page" aria-hidden="true">&#8599;</span>` +
          '<span class="sr-only"> (opens in a new tab)</span></a></li>';
      }
      return `<li><button class="toc-item" type="button" data-chapter="${i}">` +
        `${inner}<span class="toc-page toc-page-num">${pageForChapter(i)}</span></button></li>`;
    });
    return `<ul class="toc">${items.join('')}</ul>`;
  }

  function pageHTML(side) {
    const ch = side.chapter;
    let html = '';
    switch (side.type) {
      case 'cover':
        html = '<div class="cover-inner">' +
          `<h1>${esc(BOOK.cover.title)}</h1><div class="rule"></div>` +
          `<p class="cover-sub">${esc(BOOK.cover.subtitle)}</p></div>`;
        break;
      case 'toc':
        html = '<p class="kicker">Table of contents</p><h2>Contents</h2><div class="rule"></div>' + tocHTML();
        break;
      case 'opener': {
        const isWord = ch.opener.length > 3 ? ' is-word' : '';
        html = '<div class="opener">' +
          `<p class="kicker">${esc(ch.kicker)}</p>` +
          `<p class="opener-mark${isWord}">${esc(ch.opener)}</p>` +
          '<div class="rule"></div>' +
          `<p class="opener-title">${esc(ch.title)}</p></div>`;
        break;
      }
      case 'body':
        html = `<p class="kicker">${esc(ch.kicker)}</p><h2>${esc(ch.title)}</h2><div class="rule"></div>` +
          ch.paragraphs.map((p) => `<p class="text">${esc(p)}</p>`).join('');
        if (ch.externalUrl) {
          html += `<a class="page-link" href="${esc(ch.externalUrl)}" target="_blank" rel="noopener noreferrer">` +
            `${esc(ch.linkLabel || 'Visit site')} <span aria-hidden="true">&#8599;</span>` +
            '<span class="sr-only"> (opens in a new tab)</span></a>';
        }
        break;
      default:
        html = '';
    }
    if (side.type !== 'cover') html += `<span class="folio">${side.folio}</span>`;
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
    left: { els: [els.left, els.left.cloneNode(false)], shown: 0 },
    right: { els: [els.right, els.right.cloneNode(false)], shown: 0 }
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

  function showSpread(index) {
    paintStatic('left', sides[index * 2]).removeAttribute('inert');
    paintStatic('right', sides[index * 2 + 1]).removeAttribute('inert');
  }

  function updateUI() {
    els.prev.disabled = busy || current === 0;
    els.next.disabled = busy || current === LAST_SPREAD;
    els.contents.disabled = busy || current === 0;
    els.book.dataset.spread = String(current);
    els.edgesLeft.style.setProperty('--sheets', String(current));
    els.edgesRight.style.setProperty('--sheets', String(LAST_SPREAD - current));
    if (current === 0) {
      els.position.textContent = 'Contents';
    } else {
      const ch = BOOK.chapters[current - 1];
      els.position.textContent = `${ch.kicker} · ${current} of ${BOOK.chapters.length}`;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Page turning                                                        */
  /* ------------------------------------------------------------------ */

  // Time for each page in a jump of `pages` pages: long jumps flip quickly.
  function turnDuration(pages) {
    const t = TIMING.singleTurn * Math.pow(TIMING.speedUp, pages - 1);
    return Math.max(TIMING.fastestTurn, t) * motionScale;
  }

  /*
   * The turning sheet is drawn as TIMING.strips thin vertical strips, each hinged
   * to the previous one. Rotating each a little more than the last makes the paper
   * curl. Each strip has a front face (its slice of the right-hand page) and a back
   * face (its slice of the left-hand page it becomes once turned).
   */
  const STRIPS = TIMING.strips;
  const DEG = Math.PI / 180;
  const leafParts = buildLeaf();

  function buildLeaf() {
    els.leaf.style.setProperty('--strips', String(STRIPS));
    const parts = [];
    let parent = els.leaf;
    for (let k = 0; k < STRIPS; k++) {
      const strip = document.createElement('div');
      strip.className = 'strip';
      if (k > 0) strip.style.left = '100%'; // hinged to the right edge of the previous strip
      // Back faces are mirrored, so strip k shows the slice k strips in from the spine.
      const front = makeFace('face face-front', k);
      const back = makeFace('face face-back', STRIPS - 1 - k);
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
    page.style.left = `calc(var(--page-w) * ${(-slice / STRIPS).toFixed(5)})`;
    const shade = document.createElement('div');
    shade.className = 'face-shade';
    face.append(page, shade);
    return { face, page, shade };
  }

  function paintLeaf(frontSide, backSide) {
    const frontHTML = pageHTML(frontSide);
    const backHTML = pageHTML(backSide);
    const frontClass = 'page leaf-front' + (frontSide.type === 'cover' ? ' is-cover' : '');
    const backClass = 'page leaf-back' + (backSide.type === 'cover' ? ' is-cover' : '');
    leafParts.forEach(({ front, back }) => {
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
   * Draw the sheet at progress q (0 = not started, 1 = landed) of a turn in
   * direction dir. The free edge leads and the spine side lags, so the page
   * lifts from its outer edge the way a hand turns it.
   */
  function renderTurn(dir, q, geom) {
    const p = dir > 0 ? q : 1 - q;          // 0 = lying on the right, 1 = lying on the left
    const arc = Math.sin(Math.PI * p);      // 0 at rest, 1 standing upright
    const base = -180 * p;
    const bend = TIMING.curl * arc * dir;
    const angles = new Array(STRIPS);
    for (let k = 0; k < STRIPS; k++) {
      angles[k] = clamp(base - bend * (k / (STRIPS - 1) - 0.5), -180, 0);
    }

    const sliceW = geom.pageW / STRIPS;
    let previous = 0;
    let tipX = 0; // where the free edge is, measured from the spine
    for (let k = 0; k < STRIPS; k++) {
      const part = leafParts[k];
      part.strip.style.transform = `rotateY(${(angles[k] - previous).toFixed(3)}deg)`;
      previous = angles[k];
      tipX += sliceW * Math.cos(angles[k] * DEG);
      const a0 = shadeFor(k === 0 ? angles[0] : (angles[k - 1] + angles[k]) / 2);
      const a1 = shadeFor(k === STRIPS - 1 ? angles[k] : (angles[k] + angles[k + 1]) / 2);
      part.front.shade.style.background = `linear-gradient(90deg, rgba(19,28,51,${a0}), rgba(19,28,51,${a1}))`;
      part.back.shade.style.background = `linear-gradient(90deg, rgba(19,28,51,${a1}), rgba(19,28,51,${a0}))`;
    }

    els.leaf.style.transform = `translateZ(${(arc * TIMING.lift).toFixed(2)}px)`;
    els.underShade.style.opacity = arc.toFixed(3);
    // The cast shadow sits just beyond the free edge, on whichever side it is over.
    els.cast.style.transform = `translateX(${(geom.spineX + tipX).toFixed(1)}px) scaleX(${tipX >= 0 ? 1 : -1})`;
    els.cast.style.opacity = (arc * 0.9).toFixed(3);
  }

  /*
   * Set up one sheet to turn in direction dir (+1 forward, -1 back) and return a
   * handle to drive it: set(q) draws it at progress q, complete() lands it and
   * moves to the next spread, revert() puts it back.
   *
   * While a sheet turns, the static pages underneath show what the reader would see
   * beneath it in a real book.
   */
  function beginTurn(dir) {
    const s = current; // spread we are leaving
    let front, back, underLeft, underRight;
    if (dir > 0) {
      front = sides[2 * s + 1];      // the right page being lifted
      back = sides[2 * s + 2];       // its reverse: the next left page
      underLeft = sides[2 * s];      // stays put until covered
      underRight = sides[2 * s + 3]; // revealed as the sheet lifts
    } else {
      front = sides[2 * s - 1];      // lands as the new right page
      back = sides[2 * s];           // the left page being lifted
      underLeft = sides[2 * s - 2];  // revealed as the sheet lifts
      underRight = sides[2 * s + 1]; // stays put until covered
    }

    // Pages underneath can't be used mid-turn.
    paintStatic('left', underLeft).setAttribute('inert', '');
    paintStatic('right', underRight).setAttribute('inert', '');
    paintLeaf(front, back);
    els.leaf.style.display = 'block';

    const geom = { spineX: els.leaf.offsetLeft, pageW: els.leaf.offsetWidth };
    const handle = {
      dir,
      q: 0,
      set(q) { handle.q = q; renderTurn(dir, q, geom); },
      complete() { current += dir; endTurn(); },
      revert() { endTurn(); }
    };
    handle.set(0);
    return handle;
  }

  function endTurn() {
    showSpread(current);
    els.leaf.style.display = 'none';
    els.underShade.style.opacity = '0';
    els.cast.style.opacity = '0';
  }

  function announceTurn(from, duration) {
    document.dispatchEvent(new CustomEvent('book:turn', { detail: { from, to: current, duration } }));
  }

  // Turn one sheet all the way with an animation. Resolves once it has landed.
  function turnOne(dir, duration, ease) {
    const turn = beginTurn(dir);
    playTurnSound(duration);
    const state = { q: 0 };
    return new Promise((resolve) => {
      gsap.to(state, {
        q: 1,
        duration,
        ease,
        onUpdate: () => turn.set(state.q),
        onComplete() { turn.complete(); resolve(); }
      });
    });
  }

  /*
   * Move to a spread by turning every page in between, in order, one after another.
   * The farther the target, the more pages turn and the quicker each one goes.
   */
  async function goTo(target) {
    if (!bookReady || busy) return;
    target = Math.max(0, Math.min(LAST_SPREAD, target));
    if (target === current) return;

    const dir = target > current ? 1 : -1;
    const pages = Math.abs(target - current);
    const duration = turnDuration(pages);
    const ease = pages === 1 ? TIMING.ease : TIMING.riffleEase;

    busy = true;
    updateUI();

    for (let i = 0; i < pages; i++) {
      const from = current;
      await turnOne(dir, duration, ease);
      updateUI();
      announceTurn(from, duration);
      if (i < pages - 1) await nextFrame();
    }

    busy = false;
    updateUI();
  }

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
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

  // A soft paper swish for each page turn.
  function playTurnSound(duration) {
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
    gain.gain.linearRampToValueAtTime(0.18, now + length * 0.3);
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

  async function runIntro() {
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
  function openBook() {
    if (introDone) return;
    introDone = true;
    els.body.classList.remove('in-intro');

    gsap.timeline({
      onComplete() {
        els.intro.style.display = 'none';
        bookReady = true;
        updateUI();
      }
    })
      .to(els.introSheet, { y: -36, opacity: 0, duration: 0.7 * motionScale, ease: 'power2.in' }, 0)
      .to(els.skip, { opacity: 0, duration: 0.3 * motionScale }, 0)
      .to(els.intro, { opacity: 0, duration: 0.9 * motionScale, ease: 'power1.inOut' }, 0.45 * motionScale)
      .fromTo(els.wrap,
        { opacity: 0, y: 34, scale: 0.96, transformPerspective: 1600, rotateX: 9 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.15 * motionScale, ease: 'power3.out', clearProps: 'transform' },
        0.6 * motionScale);
  }

  /* ------------------------------------------------------------------ */
  /* Input: buttons, contents, keys, swipe                               */
  /* ------------------------------------------------------------------ */

  function bindInput() {
    els.sound.addEventListener('click', toggleSound);
    els.skip.addEventListener('click', skipIntro);
    els.prev.addEventListener('click', () => goTo(current - 1));
    els.next.addEventListener('click', () => goTo(current + 1));
    els.contents.addEventListener('click', () => goTo(0)); // turns every page back to the contents

    let suppressClick = false; // swallows the click that ends a drag

    // Contents entries. External links (PETRAFIED) are ordinary links and open by themselves.
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
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goTo(current + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goTo(current - 1); }
      if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      if (event.key === 'End') { event.preventDefault(); goTo(LAST_SPREAD); }
    });

    /*
     * Drag to turn (finger or mouse). Once a press moves sideways, the page
     * follows it. Let go past halfway, or flick, and the page turns; otherwise
     * it falls back. Vertical movement is left to the browser for scrolling.
     */
    let press = null; // pointer down on the book, not yet a drag
    let drag = null;  // a page being dragged

    els.wrap.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || !bookReady || busy || drag) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });

    els.wrap.addEventListener('pointermove', (event) => {
      if (drag) {
        if (event.pointerId === drag.id) moveDrag(event);
        return;
      }
      if (!press || event.pointerId !== press.id) return;
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { press = null; return; } // scrolling
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const dir = dx < 0 ? 1 : -1;
      if (busy || (dir > 0 && current === LAST_SPREAD) || (dir < 0 && current === 0)) { press = null; return; }
      startDrag(event, dir);
    });

    els.wrap.addEventListener('pointerup', (event) => {
      if (drag && event.pointerId === drag.id) endDrag(false, event.timeStamp);
      press = null;
    });
    els.wrap.addEventListener('pointercancel', (event) => {
      if (drag && event.pointerId === drag.id) endDrag(true, event.timeStamp);
      press = null;
    });

    function startDrag(event, dir) {
      busy = true;
      updateUI();
      suppressClick = true;
      const turn = beginTurn(dir);
      // Distance the pointer travels for a full turn: across both pages on desktop, one on phones.
      const twoPages = els.book.offsetWidth > els.leaf.offsetWidth * 1.5;
      const span = els.book.offsetWidth * (twoPages ? 0.85 : 0.9);
      drag = { id: event.pointerId, x0: press.x, dir, turn, span, samples: [] };
      press = null;
      try { els.wrap.setPointerCapture(event.pointerId); } catch (err) { /* not critical */ }
      moveDrag(event);
    }

    function moveDrag(event) {
      const q = clamp(((drag.x0 - event.clientX) * drag.dir) / drag.span, 0, 1);
      drag.turn.set(q);
      drag.samples.push({ x: event.clientX, t: event.timeStamp });
      if (drag.samples.length > 5) drag.samples.shift();
    }

    function endDrag(cancelled, releasedAt) {
      const { turn, dir, samples } = drag;
      drag = null;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = Math.max(1, last.t - first.t);
      // px per ms, positive = in the turning direction. Holding still before letting go = no flick.
      const speed = releasedAt - last.t > 120 ? 0 : ((first.x - last.x) * dir) / dt;
      const q = turn.q;
      // Past halfway it turns unless flicked back; before halfway only a flick turns it.
      const commit = !cancelled && (q >= 0.5 ? speed > -0.3 : speed > 0.3);
      const target = commit ? 1 : 0;
      const duration = Math.max(0.16, TIMING.singleTurn * 0.75 * Math.abs(target - q)) * motionScale;
      if (commit) playTurnSound(duration);

      const state = { q };
      gsap.to(state, {
        q: target,
        duration,
        ease: 'power2.out',
        onUpdate: () => turn.set(state.q),
        onComplete() {
          const from = current;
          if (commit) turn.complete(); else turn.revert();
          busy = false;
          updateUI();
          if (commit) announceTurn(from, duration);
        }
      });
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

  showSpread(0);
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
  runIntro();

  // Small hook for testing and debugging in the browser console.
  window.mindDriftBook = {
    goTo,
    get spread() { return current; },
    get busy() { return busy; },
    turnDuration
  };
})();
