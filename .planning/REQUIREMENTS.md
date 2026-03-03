# Requirements: Posti-days

**Defined:** 2026-03-03
**Core Value:** Instantly answer "Is Posti delivering mail today?" for the user's postal code — with a smile.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Display

- [ ] **DISP-01**: User sees a clear YES or NO answer for whether Posti delivers mail today at their postal code
- [ ] **DISP-02**: YES answer displays in green, NO answer displays in red
- [ ] **DISP-03**: User sees a random Finnish dialect version of the question and answer on each page load (from content.json)
- [ ] **DISP-04**: User sees the dialect name and region displayed alongside the question/answer
- [ ] **DISP-05**: User sees all delivery dates for the current week in a human-readable list

### Postal Code Resolution

- [ ] **POST-01**: App requests browser geolocation on first visit to determine postal code
- [ ] **POST-02**: If geolocation is denied, user sees an autocomplete dropdown to search postal codes
- [ ] **POST-03**: Autocomplete searches across postal code, area name (fi), area name (sv), and municipality name
- [ ] **POST-04**: Autocomplete groups results by municipality, then by postal area within each municipality
- [ ] **POST-05**: App remembers selected postal code in localStorage for return visits
- [ ] **POST-06**: User can re-check geolocation or select a different postal code at any time

### Internationalization

- [ ] **I18N-01**: UI chrome supports Finnish, English, and Swedish
- [ ] **I18N-02**: App auto-detects language from browser/device settings, falls back to English if no match
- [ ] **I18N-03**: User can manually switch language via a language selector
- [ ] **I18N-04**: App remembers manual language selection for return visits
- [ ] **I18N-05**: Dialect content (question/answer) always displays in Finnish regardless of selected language

### Data Pipeline

- [ ] **DATA-01**: Build-time script parses Statistics Finland XLSX and outputs postal codes JSON
- [ ] **DATA-02**: Script extracts: postal_code, postal_area_name (fi), postal_area_name_sv, municipality_name
- [ ] **DATA-03**: Script dynamically uses the current year in the XLSX download URL
- [ ] **DATA-04**: Swedish municipality names are sourced and included in the postal codes dataset

### API Integration

- [ ] **API-01**: App queries Posti mail delivery API server-side (proxied via Route Handler to avoid CORS)
- [ ] **API-02**: App displays a clear error message when Posti API is unavailable or returns an error

### Visual Design

- [ ] **VIS-01**: App uses a handwritten-style font for the main question/answer display
- [ ] **VIS-02**: App has a playful, warm visual aesthetic matching the dialect humor
- [ ] **VIS-03**: App is fully responsive and mobile-friendly
- [ ] **VIS-04**: App respects system dark mode preference via CSS prefers-color-scheme

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhancements

- **ENH-01**: Share link with postal code pre-filled via URL parameter
- **ENH-02**: Additional dialect content beyond the initial 11 variants

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| PWA / installable app | Just a website — no service worker complexity needed |
| Push notifications | Calendar or week view covers the use case; notification infra is disproportionate |
| Multiple postal code tracking | Single-purpose app — fast code switching via autocomplete is sufficient |
| Historical delivery data | Posti API doesn't support it; week view covers planning needs |
| User accounts / backend database | localStorage covers all persistence needs; no GDPR burden |
| Parcel / package tracking | Completely different product; dilutes focus |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISP-01 | — | Pending |
| DISP-02 | — | Pending |
| DISP-03 | — | Pending |
| DISP-04 | — | Pending |
| DISP-05 | — | Pending |
| POST-01 | — | Pending |
| POST-02 | — | Pending |
| POST-03 | — | Pending |
| POST-04 | — | Pending |
| POST-05 | — | Pending |
| POST-06 | — | Pending |
| I18N-01 | — | Pending |
| I18N-02 | — | Pending |
| I18N-03 | — | Pending |
| I18N-04 | — | Pending |
| I18N-05 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DATA-04 | — | Pending |
| API-01 | — | Pending |
| API-02 | — | Pending |
| VIS-01 | — | Pending |
| VIS-02 | — | Pending |
| VIS-03 | — | Pending |
| VIS-04 | — | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 ⚠️

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after initial definition*
