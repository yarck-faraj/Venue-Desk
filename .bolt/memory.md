# Project memory

## Product intent & audience

- VenueDesk: venue management / POS-style application for multi-outlet hospitality venues.
- Outlets include: Events, Bean, Bites, Cocktail — each with per-outlet branding.
- Core flows: sign-in/authentication, cashier/till operations, financial overview, calendar, room management, bookings, reports.
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
- Theme toggle: fixed-size switch, consistent across full-screen, desktop, mobile, sign-in, cashier; no responsive stretching or shape-shifting.
- Dark mode must cover ALL surfaces: main workspace, cards, rooms, timelines, reports, forms, labels, headings, legacy white panels — no section may revert to light palette.
- Outlet theme selectors must follow `html[data-theme]` state for every outlet (Events, Bean, Bites, Cocktail).
- Redesign must be visibly transformative: stronger visual hierarchy across Bookings, Calendar, Rooms, Reports — not just icon swaps.
- User has high expectations for redesign depth; icon-only changes are insufficient.
- Mockup-driven: user provides visual mockups to guide direction.
- Design screenshots stored in `design-screenshots/before` and `design-screenshots/after`.

## Decisions, constraints & rationale

- Per-file line limit: 300 lines max; split files when exceeding.
- CSS architecture: separate files for theme, redesign tokens, app styles — wired through a style entry point.
- Build must pass cleanly (`npm run build`); no errors before delivery.
- Attribute inventory tracked (196 data/id/name hooks); all must survive redesigns.
- Protected items (never changed in redesign): behavior files, currency, text content, dependencies.
- Duplicate/obsolete uploads may be deleted if confirmed copies.
- Stale stylesheet errors investigated as file-sync timing issues, not real build failures.
- Dark mode fixes applied to legacy surfaces that were missing dark tokens; outlet selectors corrected to prevent light-palette fallback.

## Open questions & assumptions

- Shared login passwords need rotation before production deployment (flagged but not yet actioned).
- Dark mode palette specifics inferred from light-mode system; exact dark tokens may still need refinement for edge-case surfaces.
- Per-outlet branding scope: assumed to be color/accent differentiation only, not structural layout changes.
- User still not fully impressed with redesign; further visual transformation may be requested.