# Feature Research

**Domain:** Single-purpose postal delivery status utility web app (Finnish market)
**Researched:** 2026-03-03
**Confidence:** MEDIUM — No live web research available. Analysis based on PROJECT.md requirements (primary source), domain knowledge of postal/utility web apps, and comparable services. Confidence is MEDIUM rather than LOW because the project requirements in PROJECT.md are themselves highly specific and clearly authored with strong domain understanding.

---

## Note on Research Method

WebSearch and WebFetch were unavailable during this research session. Findings are based on:
1. PROJECT.md — the primary, authoritative source for this specific app's feature decisions (HIGH confidence for this app's scope)
2. Domain knowledge of utility web apps ("Is it X today?" pattern), postal service websites, and delivery status apps (MEDIUM confidence — knowledge cutoff August 2025, not independently verified)
3. Reasoning from the Finnish postal/delivery context (MEDIUM confidence)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Clear YES/NO answer for today | The entire reason the user opened the app — any ambiguity here is a failure | LOW | Must be the visually dominant element. Green/red coloring reinforces the answer. |
| Postal code input | Mail delivery is postal-code-specific in Finland. Without it, the answer is meaningless | MEDIUM | Autocomplete over ~3000 Finnish postal codes is required for usability |
| Week view of delivery days | Users often want "when is the next delivery?" not just today — displaying the full week answers this proactively | LOW | 7-day grid. Posti API returns `deliveryDates` array naturally suited to this |
| Remember my postal code | Returning users expect not to re-enter their code every visit — this is standard behavior in any location-aware app | LOW | localStorage. No backend needed. |
| Mobile-friendly layout | Most "quick answer" lookups happen on mobile. If it's broken on phone, users leave | MEDIUM | Responsive design with large tap targets and readable text on small screens |
| Fast load time | A utility app that loads slowly destroys its own value proposition (the value is speed of answer) | LOW | Static-first Next.js with no heavy runtime data fetching solves this |
| Graceful error handling for API failure | Posti API has no SLA guarantee. If it returns nothing, the app must tell the user clearly rather than silently showing wrong data | MEDIUM | Display a clear "couldn't check today, try again" state rather than a blank page |

### Differentiators (Competitive Advantage)

Features that set this product apart. Not universally required, but add meaningful value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Finnish dialect humor | This is the entire personality of the app. "Does Posti deliver today?" is a mundane question; answering it in Savonian, Tampere slang, or Southwestern dialect transforms a utility into a delight. Users remember and share it. | MEDIUM | 11 dialects in content.json. Random selection per page load keeps it fresh for repeat visitors. |
| Geolocation for postal code | Eliminates the primary friction point — user doesn't have to know or type their postal code. One tap, done. | MEDIUM | Browser Geolocation API → reverse-geocode to postal code. Requires HTTPS. Must degrade gracefully when denied. |
| Smart autocomplete (code + area + municipality) | Searching across all three fields (code, area name, municipality name) covers how users actually think about location — "I live in Tampere" not "I live in 33100" | MEDIUM | Groups by municipality → postal area gives mental model alignment. Fuzzy matching helps with typos. |
| Multilingual UI (Finnish, English, Swedish) | Finland is constitutionally bilingual (Finnish + Swedish). English matters for expats. Offering Swedish is respectful, legally significant for Swedish-speaking Finns, and sets the app apart from single-language utilities. | MEDIUM | UI chrome only — dialect content stays Finnish in all language modes, which is itself a charming choice. |
| Dialect shown regardless of UI language | Dialect humor is the identity of the app. Switching to English UI doesn't mean you lose the Finnish soul. This is a deliberate, personality-forward decision. | LOW | Simple logic: language selection controls UI strings, never dialect content. |
| Visual YES/NO emphasis with color | Bright green/red with large typography means users get the answer before they've finished reading. This is faster than any text label alone. | LOW | Color alone is not sufficient for accessibility — must also have text label and consider colorblindness. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like natural extensions but create problems disproportionate to their value.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Push notifications for delivery days | "Remind me when mail runs" seems useful | Requires a service worker, notification permission prompt, and a backend to schedule pushes. This triples the app complexity for a feature that a calendar event covers better. Also, delivery schedules are predictable — users can figure it out once they see the week view. | Display the week view clearly so users can plan ahead themselves |
| Multiple postal code tracking | Power users want to track multiple addresses (home, office, parents) | Requires account/auth system or complex localStorage management. The app's value is a single, instant answer — list management makes it a dashboard. | Allow easy code switching via the autocomplete — fast enough for occasional use |
| Historical delivery data | "Did mail run last Tuesday?" occasionally comes up | Posti API doesn't support historical queries. Building it requires scraping and storing past results. The use case is rare enough that it doesn't justify infrastructure. | The week view showing upcoming delivery days is sufficient for the real user need (planning) |
| User accounts / backend database | "Save my preferences across devices" sounds nice | Completely unnecessary for a no-auth app. localStorage covers 99% of the use case. Adding auth adds security burden, GDPR complexity, and maintenance cost with no clear return. | localStorage for code + language preference covers all real needs |
| Parcel/package tracking (by tracking number) | A natural extension of "postal stuff" | This is a completely different product. Parcel tracking involves real-time logistics, carrier APIs, and tracking number parsing. It's out of scope and dilutes the focused identity of the app. | Keep scope narrow: this app answers one question — does mail run today at my address? |
| Dark mode toggle | UX-conscious users expect it | The app has a playful, warm visual style with a handwritten font — dark mode may clash with that aesthetic and requires testing all color states. The visual identity is part of the differentiator. | System-level dark mode via CSS `prefers-color-scheme` is low effort and respectful without adding a toggle control to the UI |
| PWA / installable app | "Add to home screen" for utility apps | The app is explicitly out-of-scope per PROJECT.md. Install prompts add friction on first visit and the app works perfectly from the browser. | Ensure the URL is bookmarkable and the page title clearly identifies the app for browser history |

---

## Feature Dependencies

```
[Postal code resolution]
    └──requires──> [Autocomplete dropdown] (fallback when geolocation denied)
    └──requires──> [Geolocation detection] (primary path on first visit)

[Delivery status display (YES/NO)]
    └──requires──> [Postal code resolution] (no code = no answer)
    └──requires──> [Posti API integration] (no API = no answer)

[Week view]
    └──requires──> [Posti API integration] (same API call returns deliveryDates array)
    └──enhances──> [Delivery status display] (gives context beyond today)

[Remember postal code]
    └──requires──> [Postal code resolution] (must have a code to save)
    └──enhances──> [Geolocation] (skip geolocation prompt on return visits)

[Autocomplete dropdown]
    └──requires──> [Postal code dataset JSON] (build-time data processing script)

[Multilingual UI]
    └──requires──> [i18n setup] (next-intl or similar)
    └──requires──> [Language detection] (browser Accept-Language header)
    └──enhances──> [Autocomplete dropdown] (area/municipality names in correct language)

[Dialect display]
    └──requires──> [content.json] (dialect variations source)
    └──independent of──> [Multilingual UI] (intentionally decoupled)

[Postal code dataset JSON]
    └──requires──> [Data processing script] (XLSX → JSON at build time)
```

### Dependency Notes

- **Delivery status display requires postal code:** The core value proposition is postal-code-specific. The app cannot show a meaningful answer without knowing which postal area to query. This means postal code resolution must be the first thing the app does on a fresh visit.
- **Week view is free with postal code:** The Posti API returns a `deliveryDates` array — showing the week view adds no extra API call, only UI effort. It's a nearly free differentiator once the core API call is in place.
- **Autocomplete requires the dataset JSON:** The postal code dataset (Statistics Finland XLSX → JSON build script) must be completed before autocomplete can work. This is a build-time dependency.
- **Dialect display is intentionally decoupled from i18n:** This prevents the i18n system from accidentally gating the dialect content behind language selection. Keep `content.json` loading independent of the i18n locale setup.
- **Remember postal code enhances geolocation:** On return visits, if localStorage has a saved code, skip geolocation entirely. This avoids re-prompting users who already made a choice.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — validates the concept with real users.

- [ ] **Delivery YES/NO answer with color** — The entire reason the app exists. Without this, there is no product.
- [ ] **Postal code input via autocomplete** — Required for any useful answer. Geolocation is nice but autocomplete is the fallback that must always work.
- [ ] **Week view of delivery days** — Nearly free given the API response shape, and answers the follow-up question users always have ("okay, so when's the next one?").
- [ ] **Remember postal code in localStorage** — Without this, every visit is friction. Single visit users won't care, but repeat users (the target audience) need this.
- [ ] **Finnish dialect display (random per load)** — This is the app's identity and differentiator. Shipping without it is shipping a plain, forgettable utility.
- [ ] **Geolocation on first visit** — Primary UX path. Significantly reduces time-to-answer for first-time users.
- [ ] **Basic error state for API failure** — Must not show wrong or no data silently. The Posti API has no availability guarantee.
- [ ] **Finnish and English UI** — Finnish is primary market; English covers expats. Swedish can follow quickly.

### Add After Validation (v1.x)

Features to add once core is working and users are engaged.

- [ ] **Swedish UI language** — Add once Finnish + English ship. The i18n infrastructure will already be in place.
- [ ] **System dark mode via CSS media query** — Low effort, respectful of user preference, fits after visual polish phase.
- [ ] **Re-check / change postal code flow** — Polish for returning users who move or want to check another address.

### Future Consideration (v2+)

Features to defer until there is evidence of demand.

- [ ] **Dialect content expansion** — Add more regional dialects if users request specific regions.
- [ ] **Share link with postal code pre-filled** — `?q=00100` URL parameter for sharing. Low effort technically but low demand to verify first.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Delivery YES/NO answer + color | HIGH | LOW | P1 |
| Postal code autocomplete | HIGH | MEDIUM | P1 |
| Posti API integration | HIGH | LOW | P1 |
| Week view of delivery days | HIGH | LOW | P1 |
| Finnish dialect display | HIGH | LOW | P1 |
| localStorage persistence | HIGH | LOW | P1 |
| Geolocation first visit | MEDIUM | MEDIUM | P1 |
| Graceful API error state | HIGH | LOW | P1 |
| Finnish + English UI | MEDIUM | MEDIUM | P1 |
| Data processing script (XLSX → JSON) | HIGH | MEDIUM | P1 (build-time dependency) |
| Swedish UI | MEDIUM | LOW | P2 |
| Re-check / change code flow | MEDIUM | LOW | P2 |
| CSS dark mode (prefers-color-scheme) | LOW | LOW | P2 |
| URL parameter for pre-filled code | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

Note: Competitor analysis based on domain knowledge only (no live web research). Confidence: MEDIUM.

| Feature | Posti.fi (official) | Generic "Is it X today" apps | This App |
|---------|---------------------|------------------------------|----------|
| Delivery YES/NO | Yes, but buried in navigation | N/A | Dominant, above the fold |
| Postal code awareness | Yes, with postcode lookup | N/A | Yes, with geolocation + autocomplete |
| Week view | Yes (calendar format) | N/A | Yes (inline week grid) |
| Personality / humor | None — corporate tone | Varies (IsItChristmas.com = minimal, charming) | Finnish dialect humor — core differentiator |
| Multilingual | Finnish, Swedish (partial) | Typically single language | Finnish, English, Swedish |
| Mobile UX | Reasonable but general-purpose nav | Usually excellent (simple UI) | Optimized for single-question flow |
| Remember preference | Session-based | Varies | localStorage (persistent) |
| Geolocation | No | N/A | Yes |
| Load speed | Slow (heavy portal) | Fast | Fast (static-first Next.js) |

**Key insight:** Posti.fi answers the same question but as one page among hundreds in a full portal. The differentiator is not features — it is focus, speed, and personality. This app does one thing and does it with delight.

---

## Sources

- PROJECT.md — primary source for feature requirements and explicit out-of-scope decisions (HIGH confidence)
- Domain knowledge: Finnish postal service (Posti), delivery scheduling patterns, utility web app UX conventions — MEDIUM confidence, based on training data up to August 2025, not independently verified in this session
- "Is it X today" single-purpose utility app pattern (IsItChristmas.com, Is It A Bank Holiday, etc.) — MEDIUM confidence
- Posti API context from PROJECT.md: `https://www.posti.fi/maildelivery-api-proxy/?q={postalCode}` returns deliveryDates array — HIGH confidence (sourced from PROJECT.md)
- Statistics Finland XLSX context from PROJECT.md — HIGH confidence (sourced from PROJECT.md)

---
*Feature research for: Finnish postal delivery status utility web app (posti-days)*
*Researched: 2026-03-03*
