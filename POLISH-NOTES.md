# Circuit Breaker Pattern Simulator — polish notes (Nov 21, 2026)

Source: Robert's pasted single-file simulator (pybreaker). His file is kept
byte-identical at `index.original.html`; the polished file is `index.html`.

## What changed (polish only — no new features, design untouched)

1. **Frame-rate-independent packets** — packet speed was per-frame
   (`progress += speed`), so packets flew ~2x faster on 120Hz screens than
   60Hz. Now `progress += speed * dt * 60`. `dt` is clamped to 0.05s so a
   tab-switch can't teleport packets.
2. **Console log capped at 200 lines** — long auto-traffic sessions grew the
   DOM without bound; oldest lines now drop off.
3. **"Fails: N/M" badge sized to fit** — the pill was a fixed 64px, so
   `Fails: 10/10` (fail_max 10) overflowed it. Width is now measured from
   the text. Also added a plain-`rect` fallback if `ctx.roundRect` is
   missing (older browsers).
4. **Reset All is now a true reset** — it used to leave the DB state and
   both sliders untouched (a demo leaves reset_timeout at 6s). Reset now
   restores DB DOWN, fail_max 3, reset_timeout 10s, sliders synced.
5. **Canvas resize hardening** — `ctx.setTransform(1,0,0,1,0,0)` before
   scaling, so transforms can never compound across resizes.
6. **Small a11y/meta** — `aria-label` on the sound toggle, `aria-live`
   on the console, meta description tag.

## Playtest (headless Chromium, `playtest.js`)

26/26 checks passed: CLOSED → OPEN after 3 failures → fast-fail while OPEN
→ HALF-OPEN after timeout → failed probe re-opens → recover DB → probe
closes → Reset All restores everything → log cap at 200 → scripted demo
ends CLOSED with total 5 / success 1 / failed 3 / blocked 1. Zero page JS
errors. Screenshots in `shots/` (page is unstyled headless because the
Tailwind/Fonts/Tone CDNs are unreachable there; in a real browser they load).

## Left alone (observed, not a bug)

- After a failed HALF-OPEN probe the HUD can read `4 / 3` — that is the
  real consecutive-failure count, and the state machine's behavior is
  unchanged. Not touched.

## Status

Local-only. NOT published to the portfolio site, NOT on GitHub, NOT in the
portfolio catalog. Publish only on Robert's word.

---

# Round 2 — review fixes + timeline (Nov 21, 2026)

Robert pasted an outside review of the polished version. Audited claim by
claim before building: 5 of 6 held (packet cap's flood premise was invented
— speed is hardcoded, packets resolve in parallel — but the guard is cheap
defense-in-depth, so it went in anyway); the state-labels suggestion was
rejected (the banner already translates HALF-OPEN, and the badge keeps
pybreaker's real state names).

## What changed

1. **Packet cap** — `MAX_PACKETS = 100` in `dispatchRequest()`. A dropped
   request never leaves the client: not counted, but logged. Steady state
   is ~2 in flight.
2. **Demo cancel** — Reset All during a demo now stops it. `resetSimulation()`
   flags `demoCancelled`; the demo checks after every `sleep()` and unwinds
   through a `finally` that re-enables the button and logs "Demo cancelled
   by Reset". The demo re-arms the flag right after its own opening reset.
3. **Trip count + success rate** — two new stat cells (strip is now 2×3):
   Circuit Trips (increments on every transition to OPEN) and Success Rate
   (`—` until the first request).
4. **X over the DB line** — while OPEN, a red X is drawn at the midpoint of
   the dashed Breaker → DB wire.
5. **Highlight auto-clear with generation guard** — code highlights clear
   after 1.2s, but only if no newer highlight replaced them (a plain
   `setTimeout` would have wiped newer highlights).
6. **State Timeline panel** — new card under the metrics strip, newest on
   top, capped at 50 rows, cleared on Reset (with its own Clear button).
   Rows: timestamp + colored dot + key + label. Records trips, probe
   outcomes, individual failures (`Fail #n`), and DB health flips, so
   packets, logs and states can be correlated at a glance.

## Playtest (headless Chromium, `playtest.js` — extended)

42/42 checks passed across two consecutive full runs: everything from
round 1, plus trips 1→2, success rate 17% (1 of 6) then 20% after the
demo, packet cap at exactly 100 in flight with dropped requests uncounted
and logged, demo cancel unwinds cleanly with the button re-enabled,
highlight auto-clear verified, timeline rows verified at trip / DB
recovery / close, and Reset clearing trips, rate and timeline. Zero page
JS errors. Screenshots in `shots/` (page unstyled headless only — CDNs
unreachable there; fine in a real browser).

One test expectation was wrong on the first run (I wrote 20% where the
sim correctly showed 17% — 1 success of 6 requests, not 5); the sim was
right, the test was fixed.

---

# Round 3 — release prep for v1.0.0 (Nov 21, 2026)

Robert pasted a release checklist (readiness judgment + avatar video
script). Audited before building anything.

## Release pack — all prepared locally, nothing published

- `README.md` — features, states, run/deploy instructions (local server +
  GitHub Pages), Mermaid architecture diagrams (topology flowchart +
  state diagram), project layout, browser-testing table, credits, license.
- `LICENSE` — MIT, Copyright (c) 2026 Robert Louis Bostick.
- `shots/styled-open.png` (README hero) and `shots/styled-demo-done.png`
  (full dashboard + timeline) — real styled screenshots, captured from a
  vendored test copy (local Tailwind / Tone.js / fonts) because headless
  Chromium cannot reach the CDNs. Zero page errors in that run. The
  earlier headless shots are unstyled and stay out of the README.
- `avatar-video-script.md` — the pasted script saved with production
  notes: 242 words ≈ 97s at 150 wpm, just over the 60–90s target (trim
  ~20–40 words or deliver briskly); closing-frame URL is a placeholder
  (`YOURUSERNAME`) — becomes `Rionangelfire/circuit-breaker-simulator`
  once the repo exists; do not record the closing frame until then.

## Checklist status

- README / LICENSE / architecture diagram / deployment instructions /
  credits — done.
- Screenshots — done (PNG). GIFs not made; optional for v1.0.0.
- Cross-browser — Chrome tested (42/42 playtest). Edge shares the
  Chromium engine, not run separately. Firefox and Mobile Safari NOT
  tested — open item, needs a real browser on those platforms.
- Release name — v1.0.0, his call.

## Standing-rule flag (needs his word)

Publishing this to GitHub as a portfolio project is a NEW portfolio
project, which the standing rule blocks unless he names it an exception
(like GeoShield, Enumeration Suite and AERO-GRID were). The paste said
"ready for an initial release" — a readiness judgment, not a publish
order. No repo created, nothing pushed. Awaiting his publish decision.

## Approved and publishing — v1.0.0 (Nov 21, 2026, ~16:35)

Robert said "update how you would like and post" — taken as the named
exception + publish authorization for this repo. Final updates before
posting, all his latitude:

- Banner moved to bottom-left on desktop (`sm:left-4 sm:right-auto`) —
  the Fallback Cache node was hidden behind it; verified in the
  recaptured `shots/styled-open.png`. Playtest still passes; styled
  screenshots recaptured (zero page errors).
- README links the 10-second avatar teaser video
  (`shots/avatar-teaser-10s.mp4`).
- 90-second script cut saved in `avatar-video-script.md` (205 words,
  ~82s at 150 wpm) alongside the full 242-word original.
- Repo to create: `Rionangelfire/circuit-breaker-simulator` (public),
  GitHub Pages from the root. Expected live URL:
  https://rionangelfire.github.io/circuit-breaker-simulator/
  (to be verified live before this entry is marked done; the avatar
  script's closing-frame URL gets the real repo URL after publishing.)

## Observed quirk (not fixed, his design)

- The floating state banner overlaps the Fallback Cache node on desktop
  widths (~1280px) — the banner sits bottom-right over the cache circle.
  Cosmetic; visible in `shots/styled-open.png`.
