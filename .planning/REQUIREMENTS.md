# Requirements: Posti-days

**Defined:** 2026-03-03
**Core Value:** Instantly answer "Is Posti delivering mail today?" for the user's postal code — with a smile.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Display

- [x] **DISP-01**: User sees a clear YES or NO answer for whether Posti delivers mail today at their postal code
- [x] **DISP-02**: YES answer displays in green, NO answer displays in red
- [x] **DISP-03**: User sees a random Finnish dialect version of the question and answer on each page load (from content.json)
- [x] **DISP-04**: User sees the dialect name and region displayed alongside the question/answer
- [x] **DISP-05**: User sees all delivery dates for the current week in a human-readable list

### Postal Code Resolution

- [ ] **POST-01**: App requests browser geolocation on first visit to determine postal code
- [ ] **POST-02**: If geolocation is denied, user sees an autocomplete dropdown to search postal codes
- [ ] **POST-03**: Autocomplete searches across postal code, area name (fi), area name (sv), and municipality name
- [ ] **POST-04**: Autocomplete groups results by municipality, then by postal area within each municipality
- [ ] **POST-05**: App remembers selected postal code in localStorage for return visits
- [ ] **POST-06**: User can re-check geolocation or select a different postal code at any time

### Internationalization

- [x] **I18N-01**: UI chrome supports Finnish, English, and Swedish
- [x] **I18N-02**: App auto-detects language from browser/device settings, falls back to English if no match
- [x] **I18N-03**: User can manually switch language via a language selector
- [x] **I18N-04**: App remembers manual language selection for return visits
- [x] **I18N-05**: Dialect content (question/answer) always displays in Finnish regardless of selected language

### Data Pipeline

- [x] **DATA-01**: Build-time script parses Statistics Finland XLSX and outputs postal codes JSON
- [x] **DATA-02**: Script extracts: postal_code, postal_area_name (fi), postal_area_name_sv, municipality_name
- [x] **DATA-03**: Script dynamically uses the current year in the XLSX download URL
- [x] **DATA-04**: Swedish municipality names are sourced and included in the postal codes dataset

### API Integration

- [x] **API-01**: App queries Posti mail delivery API server-side (proxied via Route Handler to avoid CORS)
- [x] **API-02**: App displays a clear error message when Posti API is unavailable or returns an error

### Visual Design

- [x] **VIS-01**: App uses a handwritten-style font for the main question/answer display
- [x] **VIS-02**: App has a playful, warm visual aesthetic matching the dialect humor
- [x] **VIS-03**: App is fully responsive and mobile-friendly
- [x] **VIS-04**: App respects system dark mode preference via CSS prefers-color-scheme

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
| DISP-01 | Phase 3 | Complete |
| DISP-02 | Phase 3 | Complete |
| DISP-03 | Phase 3 | Complete |
| DISP-04 | Phase 3 | Complete |
| DISP-05 | Phase 3 | Complete |
| POST-01 | Phase 4 | Pending |
| POST-02 | Phase 4 | Pending |
| POST-03 | Phase 4 | Pending |
| POST-04 | Phase 4 | Pending |
| POST-05 | Phase 4 | Pending |
| POST-06 | Phase 4 | Pending |
| I18N-01 | Phase 2 | Complete |
| I18N-02 | Phase 2 | Complete |
| I18N-03 | Phase 2 | Complete |
| I18N-04 | Phase 2 | Complete |
| I18N-05 | Phase 2 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| API-01 | Phase 2 | Complete |
| API-02 | Phase 2 | Complete |
| VIS-01 | Phase 3 | Complete |
| VIS-02 | Phase 3 | Complete |
| VIS-03 | Phase 3 | Complete |
| VIS-04 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after Phase 3 completion (03-02)*
