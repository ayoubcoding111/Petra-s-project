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
    lift: 28,          // how far (px) a page lifts off the book at the middle of a turn
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
    leafFront: $('leafFront'),
    leafBack: $('leafBack'),
    underShade: $('underShade'),
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

  function showSpread(index) {
    paint(els.left, sides[index * 2], 'page page-left');
    paint(els.right, sides[index * 2 + 1], 'page page-right');
    // Only the visible spread should be reachable by keyboard and screen readers.
    els.left.removeAttribute('inert');
    els.right.removeAttribute('inert');
  }

  function updateUI() {
    els.prev.disabled = busy || current === 0;
    els.next.disabled = busy || current === LAST_SPREAD;
    els.contents.disabled = busy || current === 0;
    els.book.dataset.spread = String(current);
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
   * Turn one sheet. dir = +1 turns forward (right page over to the left),
   * dir = -1 turns back. Resolves when the sheet has landed and the spread is updated.
   *
   * While a sheet turns, the static pages underneath show what the reader would see
   * beneath it in a real book, and the leaf carries the two faces of the moving sheet.
   */
  function turnOne(dir, duration, ease) {
    const s = current; // spread we are leaving
    let front, back, underLeft, underRight, from, to;

    if (dir > 0) {
      front = sides[2 * s + 1];      // the right page being lifted
      back = sides[2 * s + 2];       // its reverse: the next left page
      underLeft = sides[2 * s];      // stays put until covered
      underRight = sides[2 * s + 3]; // revealed as the sheet lifts
      from = 0; to = 1;
    } else {
      front = sides[2 * s - 1];      // lands as the new right page
      back = sides[2 * s];           // the left page being lifted
      underLeft = sides[2 * s - 2];  // revealed as the sheet lifts
      underRight = sides[2 * s + 1]; // stays put until covered
      from = 1; to = 0;
    }

    paint(els.left, underLeft, 'page page-left');
    paint(els.right, underRight, 'page page-right');
    paint(els.leafFront, front, 'page leaf-front');
    paint(els.leafBack, back, 'page leaf-back');
    els.left.setAttribute('inert', '');
    els.right.setAttribute('inert', '');

    const state = { p: from }; // 0 = lying on the right, 1 = lying on the left
    const apply = () => {
      const p = state.p;
      const arc = Math.sin(Math.PI * p); // 0 at rest, 1 when standing upright
      els.leaf.style.transform =
        `translateZ(${(arc * TIMING.lift).toFixed(2)}px) rotateY(${(-180 * p).toFixed(3)}deg)`;
      els.leaf.style.setProperty('--shade', (arc * 0.6).toFixed(3));
      els.underShade.style.opacity = arc.toFixed(3);
    };

    apply();
    els.leaf.style.display = 'block';
    playTurnSound(duration);

    return new Promise((resolve) => {
      gsap.to(state, {
        p: to,
        duration,
        ease,
        onUpdate: apply,
        onComplete() {
          current += dir;
          showSpread(current);
          els.leaf.style.display = 'none';
          els.underShade.style.opacity = '0';
          resolve();
        }
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
      document.dispatchEvent(new CustomEvent('book:turn', { detail: { from, to: current, duration } }));
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

    let swipedRecently = false; // suppresses the click that ends a swipe

    // Contents entries. External links (PETRAFIED) are ordinary links and open by themselves.
    els.book.addEventListener('click', (event) => {
      const entry = event.target.closest('[data-chapter]');
      if (!entry) return;
      if (swipedRecently) return;
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

    // Swipe: a mostly horizontal drag of 40px or more turns one page.
    let start = null;
    els.wrap.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary) return;
      start = { x: event.clientX, y: event.clientY };
    });
    els.wrap.addEventListener('pointerup', (event) => {
      if (!start || !event.isPrimary) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swipedRecently = true;
        setTimeout(() => { swipedRecently = false; }, 50);
        goTo(current + (dx < 0 ? 1 : -1));
      }
    });
    els.wrap.addEventListener('pointercancel', () => { start = null; });
    // Stop a swipe that started on a link from following it.
    els.wrap.addEventListener('click', (event) => {
      if (swipedRecently && event.target.closest('a')) event.preventDefault();
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
