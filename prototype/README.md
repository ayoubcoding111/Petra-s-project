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
  Chapter 5 turns 6 pages; Preface turns 1. PETRAFIED opens petrafiedofficial.com in a new tab.
- **Speed follows distance:** one page takes 0.95s; in a 6-page jump each page takes 0.31s.
- **Navigation:** Previous / Next, the Contents button (turns back to the contents), swipe on
  phones (or drag with a mouse), and the arrow, Home and End keys.
- **Phones** (760px and narrower) show one page at a time; the turned page leaves to the left.

## Edit text and tune the feel

All words are in the `BOOK` object at the top of `app.js`; the comment there explains each field.
Page-turn speed and lift are in `TIMING`, just below it.

## Files

- `index.html`: page structure
- `styles.css`: layout, palette, page and turn styling
- `app.js`: content, typewriter, page turns, navigation, sound
