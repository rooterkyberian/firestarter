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
| `getBio` (structural: longest free-prose leaf in card; legacy `SELECTORS.bioSection` fallback) | `src/features/profileAnalyzer/index.ts` | bio extraction |
| `PATTERNS.distance` | `src/shared/utils/selectors.ts` | distance filter |
| `getHeight` (structured `### cm` / `#.## m` value chip; bio-text fallback) | `src/features/profileAnalyzer/index.ts` | height extraction |
| `knownInterests` list + XPath | `src/features/profileAnalyzer/` | interests scan |
| `relationshipIntents` list (text match) | `src/features/profileAnalyzer/relationshipIntents.ts` | "Looking for" extraction |
| `getReportButton` (`innerText` starts with `REPORT `) | `src/features/profileAnalyzer/index.ts` | social-link injection anchor, report lookups |
| `getProfileFingerprint` (first `background-image` URL / `[aria-label]`) | `src/features/profileAnalyzer/index.ts` | re-entrancy guard |
| `expandProfile` (click front info bar `[itemprop="name"]`, semantic — no classes) | `src/features/keyboardShortcuts/index.ts` | auto-expand |
| `revertChoice` (`//a[contains(.,'Back')]`, `//button[contains(.,'Rewind')]`) | `src/features/keyboardShortcuts/index.ts` | undo swipe |
| `nextImage` (`.profileCard__card`, `bullet--active`) | `src/features/keyboardShortcuts/index.ts` | next photo |

## Feature checklist

- [ ] **Auto-expand** — On a new card, the profile expands to show full bio/interests.
  - _Expected:_ bio and interests are visible without manual scrolling.
- [ ] **Distance filter** (`autoSwipeLeft` on, low `distanceLimit`) — a far profile is rejected.
  - _Expected:_ console logs `Auto-rejecting due to: {type: 'distance', ...}`; card swipes left. Confirm `PATTERNS.distance` matches the card's "… km away" text (km vs miles, localisation).
- [ ] **Height filter** (low `heightLimit`) — a profile listing a tall height is rejected.
  - _Expected:_ rejection with `type: 'height'`; the logged profile JSON has the right `height`. `getHeight` reads the structured essentials chip (`188 cm` / `1.88 m`) first, then any height in the bio. If null, check the chip wording (cm/m, imperial).
- [ ] **Interests blacklist** (add an interest you can see on a profile) — that profile is rejected.
  - _Expected:_ rejection with `type: 'interests'`. If it never matches, the interests XPath/`knownInterests` may be stale.
- [ ] **"Looking for" extraction** — the parsed profile JSON logged to the console (`Firestarter: profile detected …`) has a non-null `lookingFor` matching the card's relationship intent.
  - _Expected:_ e.g. `"lookingFor": "Long-term partner"`. If null, Tinder reworded the label — update `relationshipIntents.ts`.
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
- [ ] **Keyboard: `Ctrl+Shift+Y`** — captures the whole page (see below).

## Selector instrumentation

Every brittle DOM lookup is a named entry in
`src/shared/selectors/registry.ts`. `analyzeProfileWithReport()`
(`src/features/profileAnalyzer/`) runs the analysis while recording which named
selectors resolved, returning a `SelectorReport` whose `failed: string[]` is the
actionable "what broke" list. This is what the recorder stores per capture.

## Recording captures from live Tinder

You can harvest real cards instead of hand-writing fixtures:

1. Load the extension and open `tinder.com/app/recs`.
2. Press **Ctrl+Shift+Y** (or open the popup → **Developer** → **Capture
   page**). The whole page is analyzed and stored **verbatim** (raw HTML) in
   `chrome.storage.local` (never synced) along with its `SelectorReport`. A
   notification confirms the save.
3. Open the popup → **Developer** → **Export captures** to download a JSON
   bundle. Export is **raw too** (real data) — each entry carries the raw
   `html`, the `report` (`failed` selectors), and an `extracted` summary
   (including `lookingFor`). Inspect `report.failed` to see what broke live.
4. **Before committing a capture as a test fixture**, scrub it with
   `anonymizeHtml` (`src/features/recorder/anonymize.ts`): photo URLs, names,
   age, bio prose and social handles → synthetic same-shape tokens; script/style
   bodies → `redacted`; known interest + "Looking for" labels preserved. This is
   a deliberate, separate step — captures and exports are never auto-anonymized.

## Fixture-based regression tests

Implemented in `src/shared/selectors/registry.test.ts` against
`src/shared/selectors/__fixtures__/*.html` (basic, bio+height+distance+interests,
social, and a `changed-dom` redesign that must fail gracefully). To add a new
regression case: take the `html` of an exported capture, save it under
`__fixtures__/`, load it into `document.body.innerHTML`, run
`analyzeProfileWithReport()`, and assert the extracted data and report. These run
in CI (`npm test`) so selector drift fails the build — though a live pass through
the checklist above is still required after a Tinder redesign.

### TODO

- A one-click "Export as fixture" in the popup that writes a ready-to-commit
  `.html` file (today you copy the `html` field out of the JSON bundle).
