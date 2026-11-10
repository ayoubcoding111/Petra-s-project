# Home of Mind Drift: Full Project Details

## A. Client

- **Company:** Home of Mind Drift LLC, a publishing and creative company
- **Contact:** Petra
- **Current website:** homeofminddrift.com, hosted on Hostinger

## B. Goal

Replace the current website design with an interactive, book-style site. Visitors read by turning pages, not by scrolling a conventional site. Petra says the most important part is the immersive book experience, not a standard website.

## C. Scope

- Six chapters at launch
- Typewriter intro that leads into the book
- Clickable table of contents with physical page-turn movement
- Forward and backward navigation
- Responsive mobile layout
- Agreed animations
- Content management so the team can update books and text independently
- Automatic publishing of updates through the existing hosting
- Links to Amazon book listings and to existing websites
- Shop-ready structure for later, without building a shop now

## D. Site Structure

| # | Section | Content |
|---|---------|---------|
| 1 | Preface | About Home of Mind Drift |
| 2 | Chapter 1 | Hartwell Academic Press: books and publishing imprint |
| 3 | Chapter 2 | Mind Drift: reflective essays and upcoming books |
| 4 | Chapter 3 | PETRAFIED: links to the existing site, https://petrafiedofficial.com |
| 5 | Chapter 4 | Behind the Pages |
| 6 | Chapter 5 | Say Hello: contact details |

**Note:** Petra first called Chapter 1 "The Hartwell Guides," then "Hartwell Academic Press." Confirm the name before publishing.

## E. Typewriter Intro

- Cream-colored screen
- A vintage typewriter types a welcome message
- The animation transitions into the interactive book with the table of contents
- Optional sound, which the visitor can turn on or off

## F. Book Navigation

- **Realistic page turns:** the book should look and move like a physical book
- **Table of contents:** every entry is clickable
- **Chapter jumps turn pages, they don't redirect:**
  - Nearby sections turn one page (example: section 1 from the cover)
  - Distant sections flip several pages in succession (example: section 6)
  - The farther the section, the more pages turn
  - Petra likes the idea of speed adjusting with distance
- **Backward navigation:** the same logic in reverse
- **Controls:** previous and next buttons, plus swipe on phones

## G. Design

- Elegant literary look
- Cream, navy, and charcoal palette
- Spacious, uncluttered layout, not crowded
- The design should feel polished, not like a template

## H. Mobile

- Fully responsive
- Same page-turn experience on phones, using swipe
- Test at phone width (375px), tablet (768px), and desktop (1280px)

## I. Content

- Covers, logos, and brand files: Petra says she has them
- Most written content: Petra says it's ready; the rest comes during the project
- Content is limited, but it will grow with new books, covers, descriptions, and purchase links
- Future additions may include merchandise and a possible online shop

## J. Content Management

- Petra and her team must be able to add, edit, organize, and remove content without a developer
- They must not pay a fee for each item
- The book design, typewriter intro, and page-turn navigation stay the same. Only the content changes.
- **Recommended approach (proposal, not yet agreed):** Decap CMS, a free browser-based editor that stores content in GitHub
- Petra asked whether they'll have an easy-to-use dashboard for uploading images, adding books, editing text, and creating links. The answer depends on the editor chosen.

## K. Automatic Publishing

- Saved content changes should publish to the existing Hostinger hosting automatically
- Petra asked for the result, not a specific method
- **Proposed method (not yet agreed):** a GitHub Actions workflow that uploads the built site to Hostinger over FTP. This needs a small auth proxy for the editor login.

## L. Hosting and Domain

- Keep the existing Hostinger account
- Keep the domain homeofminddrift.com
- No change of hosting provider
- Petra wants to review on a staging link before going live

## M. Ownership and Costs

- Petra will own the complete website and source code
- No mandatory ongoing developer fees
- Recurring costs should be limited to the existing Hostinger plan and domain renewal
- Free-tier terms for any editor or service must be confirmed before signing

## N. Commercial Terms

- **Price:** $400 fixed, including CMS setup and training. Petra has said this is reasonable.
- **Payment:** Petra won't pay until she's satisfied. The current step is a paid prototype, with the fee credited toward the $400 if she continues.
- **Fiverr:** Move the agreement into a custom offer with escrow once she agrees to pay.
- **Milestones (proposed):** 50% to start, 50% after staging approval
- **Revisions (proposed, not yet discussed with Petra):** two rounds after staging review

## O. Process and Phases

1. **Prototype (current step):** typewriter intro, two-page book, table of contents with distance-based page turns (forward and backward), mobile swipe, placeholder content. Petra reviews it.
2. **Full site, after approval:** all six chapters, final design, mobile layout, sound toggle, accessibility
3. **Content layer:** move content into editable files
4. **CMS setup and training:** Petra's team adds and edits content without a developer
5. **Deployment:** publish to Hostinger, test on a staging link
6. **Handover:** source code, documentation, and client guide

## P. Timeline

Not agreed yet. Don't promise a date until the prototype works on a real phone.

## Q. Open Items to Confirm with Petra

- Hartwell name (Academic Press or Guides)
- Revision rounds and whether they're included in the $400
- Whether the automatic publishing and login setup are included in the $400
- Staging access and Hostinger FTP or hPanel access
- Amazon links for each book
- Typewriter sound file, if she wants one
- Final text for Preface, Behind the Pages, and Say Hello
- Timeline and start date

## R. Risks

1. **Page-turn feel:** the main feature she's paying for. It hasn't been tested yet.
2. **Scope creep:** her expectations have grown from the original brief, so keep the $400 scope fixed and quote extras separately.
3. **Automatic publishing:** needs a working deploy and login setup, which may add time or cost.
4. **Payment:** she won't pay upfront. Use a paid prototype and a Fiverr custom offer.

## S. Portfolio Note

There is no shipped book-style site yet. The closest example to share is "Marginalia, an interactive book" (ayoubcoding111.github.io/First-project), an early personal project. Describe it honestly.
