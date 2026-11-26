# Project memory

## Product intent & audience

- VenueDesk: venue management / POS-style application for multi-outlet hospitality venues.
- Outlets include: Events, Bean, Bites, Cocktail — each with per-outlet branding.
- Core flows: sign-in/authentication, cashier/till operations, financial overview, calendar, room management.
- Audience: venue staff (cashiers, event coordinators, outlet managers).

## Brand personality & voice

- Professional hospitality tool with premium feel.
- Per-outlet branding differentiates sections visually.
- Tone: operational, clear, financially precise.

## Visual design & UX direction

- Deep venue-green chrome; warm cream workspace in light mode.
- Premium split-screen sign-in layout.
- Large financial hierarchy: oversized financial cards, calendar cells, room cards, till controls.
- Rounded panels throughout.
- Light/dark theme switch with persisted user preference (`localStorage`).
- Design screenshots stored in `design-screenshots/before` and `design-screenshots/after`.
- Redesign must be visibly transformative, not just icon swaps.
- Mockup-driven: user provides visual mockups to guide direction.

## Decisions, constraints & rationale

- Per-file line limit: 300 lines max; split files when exceeding (e.g., sign-in block extracted to own file).
- CSS architecture: separate files for theme, redesign tokens, app styles — wired through a style entry point.
- Build must pass cleanly (`npm run build`); no errors before delivery.
- Attribute inventory tracked (196 data/id/name hooks); all must survive redesigns.
- Protected items (never changed in redesign): behavior files, currency, text content, dependencies.
- Duplicate/obsolete uploads may be deleted if confirmed copies.
- Stale stylesheet errors investigated as file-sync timing issues, not real build failures.

## Open questions & assumptions

- Shared login passwords need rotation before production deployment (flagged but not yet actioned).
- Dark mode palette specifics inferred from light-mode system; exact dark tokens may need refinement.
- Per-outlet branding scope: assumed to be color/accent differentiation only, not structural layout changes.