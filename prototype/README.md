# Home of Mind Drift: book prototype

A proof of concept for the page-turning experience. Not the full site: placeholder text only.

## Open it

Open `index.html` in a browser, or serve the folder (`python3 -m http.server` and visit
http://localhost:8000). An internet connection is needed for GSAP and the fonts.

## What it does

- **Typewriter intro** on a cream screen, then the book opens. "Skip intro" or Enter skips it.
- **Sound** is off by default; the toggle (top right) turns on typewriter clicks and page swishes.
  Both sounds are generated in the browser, so there are no audio files.
- **Contents:** each entry turns every page between here and there, in order. Contents to
  Chapter 5 turns 6 pages; Preface turns 1. PETRAFIED turns 4 pages like any other entry; its
  page has a "Visit PETRAFIED" button that opens petrafiedofficial.com in a new tab.
- **Speed follows distance:** one page takes 0.95s. In longer jumps the pages riffle: each sheet
  turns faster and the next one lifts before the last has landed, so several are in the air at
  once. A 6-page jump takes about 1.5s and a 30-page jump about 2.5s.
- **Fast swipes and clicks don't wait:** a new swipe, Next/Previous click or arrow key lifts the
  next page while the previous one is still landing. A released page carries on at the speed of
  the finger.
- **Reduced motion:** with the system's reduce-motion setting on, a long jump turns one thick
  bundle of pages instead of riffling.
- **Test a longer book:** add `?pages=30` to the address (http://localhost:8080/?pages=30) to pad
  the sections with numbered test pages until there are 30 pages to turn.
- **The page bends as it turns.** The sheet is drawn as thin hinged strips that curl, with
  shading that follows the curve, a shadow cast on the page beneath, and page-edge stacks
  that show how far through the book you are.
- **Drag to turn:** on phones (finger) and desktop (mouse) the page follows your hand. Let go past
  halfway, or flick, and it turns; otherwise it falls back. Vertical swipes still scroll.
- **Navigation:** Previous / Next, the Contents button (turns back to the contents), and the
  arrow, Home and End keys.
- **Phones** (760px and narrower) show a full-screen page, like a reading app. Every page appears,
  cover and chapter openers included, starting from the cover. A turning page curls back from its
  right edge and rolls across the screen, showing its reverse with the ink faintly mirrored
  through. The bar at the bottom has round arrows, the page number, a Contents link and a thin
  progress line. Rotating or resizing across 760px switches layout and keeps your place.
- **Turning on a phone:**
  - A released swipe carries on at the thumb's own speed and settles, so a flick never brakes
    when the thumb lifts.
  - An arrow tap turns the page in 0.62s, moving from the first frame.
  - A second swipe or tap hurries the last page down, so it never waits behind it.
  - Swiping back on a page that is still turning catches it mid-air and takes the turn back.
  - At the cover and the last page the page gives a little under the thumb and springs back.
  - A thumb's arc counts as a sideways swipe, and the screen doesn't bounce or pull to refresh.
  - The next and previous pages are prepared while the book is at rest, so a swipe starts on
    its first frame.
  - The bottom bar fades in with the book instead of sitting on the intro.

## Look and loading

- **Fonts:** Cormorant Garamond for titles, the cover and chapter numbers; EB Garamond for reading
  text (sturdier at phone size); Special Elite for the typewriter intro. Only the weights in use
  are downloaded.
- **Colours:** cream, navy and charcoal only. Every colour is a token at the top of `styles.css`.
- **Book details:** navy cloth cover with a cream foil frame, paper grain, running heads, drop
  caps, and lining figures so "01" reads as a number.
- **Logo:** the dashed circle on the cover is a placeholder. Put Petra's logo file next to
  `index.html` and set `BOOK.cover.logo` in `app.js` (for example `'logo.svg'`).
- **Loading:** the cream screen and blinking cursor show at once. Typing waits for the
  typewriter font (2 seconds at most), and the book waits briefly for its own fonts, which
  download during the intro, so letters never change typeface on screen.

## Edit text and tune the feel

All words are in the `BOOK` object at the top of `app.js`; the comment there explains each field.
Page-turn speed, lift and how much the paper bends (`curl`) are in `TIMING`, just below it.

## Files

- `index.html`: page structure
- `styles.css`: layout, palette, page and turn styling
- `app.js`: content, typewriter, page turns, navigation, sound
