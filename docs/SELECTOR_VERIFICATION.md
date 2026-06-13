# Selector & Regex Verification

Firestarter depends on Tinder's DOM structure, which Tinder changes without
notice and ships with obfuscated class names. The selectors and patterns below
are **best-effort** and must be confirmed against the live site after any Tinder
update or before trusting a build. This checklist can't be run in CI (it needs a
logged-in Tinder session) — it's a manual smoke test.

## How to run

1. `npm run build` and load `dist/` unpacked (`chrome://extensions` → Developer
   mode → Load unpacked).
2. Open <https://tinder.com/app/recs>, open DevTools, watch the Console.
3. Work through each feature below and confirm the **Expected** behaviour. When
   something fails, note the offending selector/pattern and the current DOM
   (right-click → Inspect) so it can be updated.

## Selectors / patterns and where they live

| What | Source | Used by |
| --- | --- | --- |
| `SELECTORS.profileCard` | `src/shared/utils/selectors.ts` | interests scan, profile fingerprint |
| `SELECTORS.bioSection` | `src/shared/utils/selectors.ts` | bio extraction |
| `PATTERNS.distance` | `src/shared/utils/selectors.ts` | distance filter |
| `PATTERNS.heightCm` | `src/shared/utils/selectors.ts` | height extraction |
| `knownInterests` list + XPath | `src/features/profileAnalyzer/` | interests scan |
| `getReportButton` (`innerText` starts with `REPORT `) | `src/features/profileAnalyzer/index.ts` | social-link injection anchor, report lookups |
| `getProfileFingerprint` (first `background-image` URL / `[aria-label]`) | `src/features/profileAnalyzer/index.ts` | re-entrancy guard |
| `expandProfile` (ArrowUp + click `.recCard`) | `src/features/keyboardShortcuts/index.ts` | auto-expand |
| `revertChoice` (`//a[contains(.,'Back')]`, `//button[contains(.,'Rewind')]`) | `src/features/keyboardShortcuts/index.ts` | undo swipe |
| `nextImage` (`.profileCard__card`, `bullet--active`) | `src/features/keyboardShortcuts/index.ts` | next photo |

## Feature checklist

- [ ] **Auto-expand** — On a new card, the profile expands to show full bio/interests.
  - _Expected:_ bio and interests are visible without manual scrolling.
- [ ] **Distance filter** (`autoSwipeLeft` on, low `distanceLimit`) — a far profile is rejected.
  - _Expected:_ console logs `Auto-rejecting due to: {type: 'distance', ...}`; card swipes left. Confirm `PATTERNS.distance` matches the card's "… km away" text (km vs miles, localisation).
- [ ] **Height filter** (low `heightLimit`) — a profile listing a tall height is rejected.
  - _Expected:_ rejection with `type: 'height'`. Confirm `bioExtractHeight` reads the bio (e.g. `188cm`, `1.88`).
- [ ] **Interests blacklist** (add an interest you can see on a profile) — that profile is rejected.
  - _Expected:_ rejection with `type: 'interests'`. If it never matches, the interests XPath/`knownInterests` may be stale.
- [ ] **Required bio regex** (set a pattern absent from a bio) — that profile is rejected.
  - _Expected:_ rejection with `type: 'regexp'`. Confirm `getBio` returns the bio text.
- [ ] **VIP/social filter** — a profile advertising a "VIP" handle is rejected.
  - _Expected:_ rejection with `type: 'social'`.
- [ ] **Social link injection** — a profile with an IG/Snap/FB handle shows clickable links.
  - _Expected:_ a `#socialLinks` block appears near the Report button; links open the right profile. If missing, check `getReportButton` (injection anchor).
- [ ] **Re-entrancy guard** — leaving a card on screen does not spam the console or re-swipe.
  - _Expected:_ each card is processed once; no tight loop. If it re-processes, `getProfileFingerprint` isn't producing a stable id for the current card.
- [ ] **Keyboard: `Insert`** — toggles activation (notification + console line).
- [ ] **Keyboard: `PageDown`** — rewinds the last swipe (Back → Rewind).
- [ ] **Keyboard: `Numpad 0`** — advances to the next profile photo.
- [ ] **Keyboard: `Numpad .`** — reloads the page.

## TODO: fixture-based test harness

Manual verification is the only correctness signal today. To make selectors
regression-testable without a live login:

1. Capture sanitised Tinder card HTML (scrub PII) into
   `src/**/__fixtures__/*.html` for: a basic card, a card with bio + height, a
   card with interests, and a card with social handles.
2. Add jsdom unit tests (Vitest) that load each fixture into `document.body` and
   assert `getBio`, `getDistance`, `bioExtractHeight`, `getInterests`,
   `getProfileFingerprint`, and `getReportButton` behave as expected.
3. Run these in CI so selector drift fails the build with a clear message, even
   though the live behaviour still needs the manual pass above after Tinder
   redesigns.
