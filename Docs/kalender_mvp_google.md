# Kalender-MVP med Google Calendar (två konton) + zoombar horisontell multi-dag-vy

## Mål
Bygg en webbapp som ger en **översiktlig kalender** med:
- **Horisontell multi-dag-vy**: flera dagar bredvid varandra, oändlig scroll vänster/höger.
- **Zoom**: från “detaljerad (timmar)” till “översikt (30–50 dagar i bredd)”.
- **Google Calendar integration**: **read-only** i MVP.
- **Två Google-inlogg** samtidigt (jobb + privat), och visa event från båda i samma UI.

Fokus: snabb MVP som är användbar direkt.

---

## Arkitektur (två alternativ)

### Alternativ A (MVP snabbast): Frontend-only + read-only
- React-app gör OAuth (Google Identity Services) och anropar Calendar API direkt från browsern.
- För varje konto sparas access token + expiry lokalt (t.ex. i `localStorage`).

**Tradeoffs**
- Tokens löper ut → ibland behöver du reconnecta.
- Tokens finns i browsern (OK för MVP).

### Alternativ B (nästa steg, bättre UX): FastAPI “token vault” + refresh
- Frontend initierar login, backend tar emot authorization code och byter till access/refresh token.
- Backend kallar Calendar API och skickar normaliserade events till frontend.
- Stabilt över tid (refresh tokens).

**Rekommendation**
- Bygg **Alternativ A** först för att få UI + logik rätt.
- Lägg till **Alternativ B** när du vill slippa reconnects och få säkrare token-hantering.

---

## Google Calendar: scopes och API-anrop

### Scopes (read-only)
- Välj helst **EN** scope i MVP för enklare consent:
  - `https://www.googleapis.com/auth/calendar.readonly` (räcker för att lista events)

### Hämta events
Använd `events.list` med:
- `calendarId=primary`
- `timeMin`, `timeMax`
- `singleEvents=true`
- `orderBy=startTime`
- `maxResults=<rimligt värde>` (och paginera med `nextPageToken`)
- `showDeleted=false`
- `timeZone=<din render-timezone>` (för konsekvent tolkning)

Obs (edge cases du behöver hantera):
- **All-day events** kommer som `start.date` / `end.date` (inte `dateTime`)
- **Pagination** via `nextPageToken` (loop tills tom)
- Sätt rimligt `maxResults` och var beredd på rate limits (retry/backoff)

---

## UX / UI-krav

### Kärnvy
- Varje dag = kolumn
- Vertikal axel = timmar (0–24) när inzoomad
- Horisontell scroll mellan dagar

### Zoom
- Styr via `pxPerDay`
- Inzoomat: tim-grid
- Utzoomat: komprimerad dagvy (chips / sammanfattning)

### Oändlig scroll
- Rendera t.ex. 120 dagar (60 före/efter)
- Flytta fönstret när man når kanter

### Virtualisering
- Använd `react-window` eller liknande

---

## Datamodell

```ts
type AccountId = "work" | "private";

type CalEvent = {
  id: string;
  accountId: AccountId;
  title: string;
  allDay: boolean;
  // "Raw" från Google: antingen dateTime (timade) eller date (all-day)
  start: string; // ISO dateTime eller YYYY-MM-DD
  end: string;   // ISO dateTime eller YYYY-MM-DD
  timeZone?: string; // t.ex. "Europe/Stockholm" (om du vill vara explicit)

  // Normaliserat för rendering/sortering (valfritt men rekommenderat)
  startTs?: number; // ms since epoch
  endTs?: number;   // ms since epoch
};
```

---

## Google Cloud setup (kort)
1. Skapa Google Cloud-projekt
2. Aktivera Google Calendar API
3. OAuth consent screen (lägg till dig själv)
4. Skapa OAuth Client

---

## Frontend-only (Alternativ A)

### Teknik
- Vite + React + TypeScript
- `react-window`
- `date-fns` eller `luxon`

### Två konton
- Knapp: “Connect work”
- Knapp: “Connect private”
- Spara tokens separat per konto (work/private)
- UX: vid connect bör du tvinga konto-val (så du inte kopplar fel Google-session), t.ex. “select account” + “consent”

### Fetch
- Hämta events per konto
- Merge + sortera

### Token-lagring (MVP)
- Default: `sessionStorage` (säkrare, minskar risk om datorn delas)
- Option: `localStorage` om du vill ha “kom ihåg mig” och accepterar risk

---

## Backend (Alternativ B – senare)

### Endpoints
- `/auth/login/{accountId}`
- `/auth/callback/{accountId}`
- `/api/events?accountId=work&start=YYYY-MM-DD&end=YYYY-MM-DD`

### Lagring
- SQLite: tokens per konto

### Nästa steg för bättre nytta (valfritt efter MVP)
- Lista kalendrar via `calendarList.list` och låt användaren välja vilka kalendrar per konto som ska visas (inte bara `primary`)

---

## UI-rendering

### Inzoomat
- 24h-grid
- Event positioneras via tid

### Utzoomat
- Ingen tim-grid
- Sammanfattning per dag

---

## Projektstruktur

### Frontend
```
frontend/
  src/
    components/
    auth/
    api/
    utils/
```

### Backend
```
backend/
  app/
```

---

## MVP-checklista
- [ ] Koppla två Google-konton
- [ ] Visa events från båda
- [ ] Multi-dag-vy
- [ ] Zoom
- [ ] Oändlig scroll
