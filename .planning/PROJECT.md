# Posti-days

## What This Is

A Next.js web app that tells users whether Posti (Finnish postal service) delivers mail today, presented through the lens of Finnish dialect humor. Users see a random Finnish dialect version of "Does mail run today? Yes/No" on each page load, alongside a week view of all delivery dates. The app detects the user's postal code via geolocation or manual selection and remembers it for future visits.

## Core Value

Instantly answer "Is Posti delivering mail today?" for the user's postal code — with a smile.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Query Posti mail delivery API with postal code and display yes/no answer
- [ ] Show random Finnish dialect question/answer on each page load (from content.json)
- [ ] Display all delivery dates for the current week in human-readable format
- [ ] Green styling for "yes" (mail today), red for "no" (no mail today)
- [ ] Request browser geolocation on first visit to determine postal code
- [ ] Autocomplete dropdown for manual postal code selection if geolocation denied
- [ ] Autocomplete searches across all fields (postal code, area name, municipality)
- [ ] Autocomplete groups results by municipality → postal area
- [ ] Remember selected postal code in localStorage for return visits
- [ ] Option to re-check location or select a different postal code
- [ ] Support 3 languages: Finnish, English, Swedish (for UI chrome)
- [ ] Auto-detect language from browser/device, fallback to English
- [ ] Manual language switcher with remembered selection
- [ ] Dialect content always shown regardless of selected language
- [ ] Data script to parse Statistics Finland XLSX into JSON (postal codes, area names, municipality names)
- [ ] Script uses current year in XLSX URL (dynamic year resolution)
- [ ] Include Swedish municipality names (sourced separately, not in XLSX)
- [ ] Playful, warm visual style with handwritten-style font
- [ ] Deploy to Vercel

### Out of Scope

- PWA / installable app — just a website
- Push notifications for delivery days
- Historical delivery data
- Multiple postal code tracking
- User accounts or backend database

## Context

- **Posti API:** `https://www.posti.fi/maildelivery-api-proxy/?q={postalCode}` returns `[{postalCode, deliveryDates: ["YYYY-MM-DD"]}]`
- **Postal code data:** Statistics Finland publishes yearly XLSX at `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_{year}_fi.xlsx`
- **Fields needed from XLSX:** Postinumeroalue (postal_code), Postinumeroalueen nimi (postal_area_name), Postinumeroalueen nimi sv (postal_area_name_sv), Kunnan nimi (municipality_name)
- **Missing data:** Swedish municipality names not in the XLSX — need to source from another dataset (e.g., Statistics Finland municipality registry or DVV)
- **Content:** `content.json` at project root contains 11 Finnish dialect variations with question/yes/no text and humorous comments
- **Dialect display:** The dialect name and region are metadata; the app shows the question and yes/no answer text, randomized per page load

## Constraints

- **Tech stack:** Next.js (React), deployed on Vercel
- **API dependency:** Posti mail delivery API — no authentication required, but availability not guaranteed
- **Data freshness:** Postal code XLSX updates yearly; script must handle year rollover
- **Geolocation:** Browser geolocation API requires HTTPS and user permission; must gracefully handle denial
- **Languages:** UI strings in Finnish, English, Swedish; dialect content is always Finnish

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dialects always visible regardless of language | Core personality of the app — the humor is the differentiator | — Pending |
| Geolocation first, autocomplete fallback | Most users visit once, set their code, and never change it | — Pending |
| Static JSON for postal codes (not runtime XLSX parsing) | Build-time data processing keeps the app fast and simple | — Pending |
| Vercel deployment | Natural fit for Next.js, free tier sufficient | — Pending |

---
*Last updated: 2026-03-03 after initialization*
