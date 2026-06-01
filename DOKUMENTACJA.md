# KegelForge — Dokumentacja funkcjonalna

> Wersja 0.1.0 · Next.js 14 + Supabase · PWA mobile-first

---

## Spis treści

1. [Cel aplikacji](#cel-aplikacji)
2. [Stos technologiczny](#stos-technologiczny)
3. [Struktura projektu](#struktura-projektu)
4. [Baza danych (Supabase)](#baza-danych-supabase)
5. [Program treningowy](#program-treningowy)
6. [Ekrany i funkcje](#ekrany-i-funkcje)
   - [Dzisiaj (strona główna)](#dzisiaj-strona-główna)
   - [Sesja treningowa](#sesja-treningowa)
   - [Podsumowanie sesji](#podsumowanie-sesji)
   - [Historia](#historia)
   - [Ustawienia](#ustawienia)
7. [Powiadomienia push i Service Worker](#powiadomienia-push-i-service-worker)
8. [Stan sesji (Zustand)](#stan-sesji-zustand)
9. [Uruchomienie i konfiguracja](#uruchomienie-i-konfiguracja)

---

## Cel aplikacji

KegelForge to progresywna aplikacja webowa (PWA) do prowadzenia ustrukturyzowanego programu ćwiczeń Kegla. Aplikacja:

- prowadzi użytkownika przez **12-tygodniowy program** podzielony na 3 fazy,
- generuje plan **trzech dziennych sesji** (rano, południe, wieczór) dostosowany do bieżącego tygodnia i fazy,
- mierzy czas ćwiczeń i przerw za pomocą wizualnego timera,
- zapisuje historię treningów w chmurze (Supabase),
- działa offline jako PWA i wysyła powiadomienia push o końcu przerwy.

---

## Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Język | TypeScript |
| Style | Tailwind CSS |
| Backend / baza danych | Supabase (PostgreSQL) |
| Stan globalny sesji | Zustand |
| PWA / powiadomienia | Service Worker (`/sw.js`) + Web Notifications API |
| Deploy | Vercel |

---

## Struktura projektu

```
src/
├── app/
│   ├── layout.tsx              # Root layout: nawigacja, font, max-width 430px
│   ├── page.tsx                # Ekran główny "Dzisiaj"
│   ├── session/[type]/page.tsx # Ekran aktywnej sesji treningowej
│   ├── summary/page.tsx        # Podsumowanie po sesji
│   ├── history/page.tsx        # Historia treningów
│   ├── settings/page.tsx       # Ustawienia i konfiguracja programu
│   └── globals.css
├── components/
│   ├── BottomNav.tsx           # Dolna nawigacja (Dzisiaj / Historia / Ustawienia)
│   └── ServiceWorkerRegistrar.tsx
└── lib/
    ├── program.ts              # Logika programu treningowego
    ├── sessionStore.ts         # Zustand store — stan bieżącej sesji
    └── supabase.ts             # Klient Supabase (lazy singleton)
```

---

## Baza danych (Supabase)

### Tabela `program_config`

Przechowuje pojedynczy rekord (id = 1) z datą startu programu.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | integer | Zawsze `1` (singleton) |
| `start_date` | date | Data rozpoczęcia programu przez użytkownika |

### Tabela `sessions`

Każdy ukończony trening zapisywany jest jako jeden wiersz.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | uuid | Klucz główny |
| `session_date` | date | Data treningu (YYYY-MM-DD) |
| `session_type` | text | `morning` / `midday` / `evening` |
| `phase` | integer | Faza programu (1–3) |
| `week_in_phase` | integer | Tydzień w fazie (1–4) |
| `is_deload` | boolean | Czy był to tydzień deload |
| `duration_sec` | integer | Całkowity czas sesji w sekundach |
| `completed_at` | timestamptz | Czas zakończenia (auto) |

### Tabela `sets`

Szczegółowe dane o każdej serii w ramach sesji.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | uuid | Klucz główny |
| `session_id` | uuid | FK → `sessions.id` |
| `exercise_key` | text | Identyfikator ćwiczenia |
| `set_number` | integer | Numer serii |
| `reps` | integer | Liczba powtórzeń (dla ćwiczeń repetycyjnych) |
| `hold_sec` | integer | Czas trzymania w sekundach (dla ćwiczeń czasowych) |
| `completed` | boolean | Czy seria została ukończona |

---

## Program treningowy

### Struktura cyklu (`src/lib/program.ts`)

Program trwa **12 tygodni**, podzielony na **3 fazy** po 4 tygodnie każda. Czwarty tydzień każdej fazy to zawsze **deload** (odciążenie).

```
Tygodnie 1–4   → Faza 1 (tydzień 4 = deload)
Tygodnie 5–8   → Faza 2 (tydzień 8 = deload)
Tygodnie 9–12  → Faza 3 (tydzień 12 = deload)
Po 12 tygodniach cykl zaczyna się od nowa.
```

Aktualna faza i tydzień są obliczane **dynamicznie** na podstawie `start_date` z bazy — bez przechowywania stanu postępu.

### Typy ćwiczeń

| Klucz | Nazwa | Opis |
|---|---|---|
| `type2_hold` | Spięcia z trzymaniem (Typ II) | 100% napięcia, pełny relaks po każdym powtórzeniu, bez kompensacji |
| `power_flutter` | Szybkie uderzenia (Power) | Maksymalny skurcz → pełny luz, tempo 1-0-1 |
| `type1_endurance` | Długie trzymanie (Typ I) | 65–70% napięcia, równomierny oddech, bez kompensacji |

### Plan sesji według fazy

#### Sesja poranna

| Faza | Ćwiczenia |
|---|---|
| 1 | 3×3s trzymania (Typ II) + 2×10 powtórzeń (Power) |
| 2 | 4×5s trzymania (Typ II) + 3×10 powtórzeń (Power) |
| 3 | 4×8s trzymania (Typ II) + 3×10 powtórzeń (Power) |
| Deload | 2×serie trzymania (Typ II), zredukowane |

#### Sesja południowa

| Faza | Ćwiczenia |
|---|---|
| 1 | 3×45–50s trzymania (Typ I) |
| 2 | 3×60–65s trzymania (Typ I) |
| 3 | 3×75–90s trzymania (Typ I) |
| Deload | 2×serie (Typ I), zredukowane |

#### Sesja wieczorna

| Faza | Ćwiczenia |
|---|---|
| 1 | 3×Typ I + 2×20 Power |
| 2 | 3×Typ I + 3×20 Power |
| 3 | 3×Typ I + 3×25 Power |
| Deload | 2×Typ I, zredukowane |

W tygodniach 3–4 każdej fazy (z wyłączeniem deload) czas trzymania w sesjach Typ I jest automatycznie zwiększany o 5–15 sekund (progresja w ramach fazy).

---

## Ekrany i funkcje

### Dzisiaj (strona główna)

**Ścieżka:** `/`

Wyświetla plan dnia z trzema kartami sesji (Rano, Południe, Wieczór).

**Funkcje:**
- Pokazuje bieżącą fazę, tydzień w fazie i numer tygodnia ogólnego.
- Dla tygodnia deload wyświetla badge `DELOAD`.
- Każda karta pokazuje: ikonę pory dnia, liczbę ćwiczeń, szacowany czas (w minutach), pigułki z parametrami serii.
- Ukończone sesje (z danego dnia) są oznaczone zielonym checkmarkiem i obramowaniem.
- Jeśli `program_config` nie istnieje, następuje przekierowanie do `/settings` (pierwsze uruchomienie).

---

### Sesja treningowa

**Ścieżka:** `/session/[type]` (gdzie `type` = `morning` | `midday` | `evening`)

Prowadzi użytkownika przez kolejne ćwiczenia i przerwy.

**Komponenty wewnętrzne:**

#### CircleTimer
Okrągły licznik SVG animowany przez `stroke-dashoffset`. Pokazuje pozostały czas w sekundach wewnątrz okręgu.

#### TimedView (ćwiczenia z trzymaniem)
- Wyświetla nazwę ćwiczenia, opis, numer serii.
- Przed startem pokazuje docelowy czas — przycisk **START** uruchamia odliczanie.
- `AudioContext` tworzony przy pierwszym kliknięciu (wymóg przeglądarek).
- Po zakończeniu odliczania: dźwięk beep (800 Hz, 200ms) + wibracja `[200, 100, 200]` ms.

#### RepsView (ćwiczenia powtórzeniowe)
- Wyświetla dużą liczbę powtórzeń.
- Przycisk **ZROBIONE ✓** ręcznie potwierdza ukończenie serii.

#### RestView (przerwa między seriami)
- Automatyczny odliczający pasek postępu.
- Przycisk **POMIŃ** skraca przerwę.
- Wysyła powiadomienie push przez Service Worker (gdy przerwa upłynie a aplikacja jest w tle).

**Przebieg sesji:**
1. Załadowanie planu z Supabase + obliczenie stanu programu.
2. Inicjalizacja Zustand store (`initSession`).
3. Sekwencja: ćwiczenie → przerwa → ćwiczenie → ... → `done`.
4. Po ukończeniu (`phase === 'done'`) zapis do Supabase: tabela `sessions` + `sets`.
5. Przekierowanie do `/summary?session_id=<id>`.

**Pasek postępu** u góry ekranu (kropki) pokazuje postęp przez ćwiczenia w sesji.

---

### Podsumowanie sesji

**Ścieżka:** `/summary?session_id=<uuid>`

Wyświetla statystyki po ukończeniu treningu.

**Pokazuje:**
- Czas trwania sesji (format `mm:ss`).
- Liczbę ukończonych serii.
- Liczbę ćwiczeń.
- Rozbicie na poszczególne ćwiczenia z liczbą serii.
- Przycisk powrotu do ekranu głównego.

---

### Historia

**Ścieżka:** `/history`

Przegląd wszystkich ukończonych treningów.

**Sekcje:**

#### Statystyki
- **Seria (streak)** — liczba kolejnych dni z co najmniej jedną sesją (liczona wstecz od dziś lub wczoraj).
- **Ten tydzień** — liczba sesji od poniedziałku bieżącego tygodnia (maks. 18 w pełnym tygodniu: 3 sesje × 6 dni).

#### Heatmapa (ostatnie 5 tygodni)
Siatka 7 kolumn × 5 wierszy (dni tygodnia). Intensywność koloru:
- Szary (`bg-zinc-800`) — brak sesji
- Ciemnozielony — 1–2 sesje
- Jasnozielony — 3+ sesje

Dzisiejsza komórka wyróżniona białą ramką.

#### Lista ostatnich sesji
14 ostatnich sesji z: ikoną pory dnia, etykietą, fazą, tygodniem, datą i czasem trwania.

---

### Ustawienia

**Ścieżka:** `/settings`

Dwa tryby wyświetlania:

#### Pierwsze uruchomienie (`FirstRunScreen`)
Wyświetlany gdy brak rekordu w `program_config`. Umożliwia ustawienie daty startu (można podać datę wsteczną — aplikacja obliczy bieżącą fazę automatycznie).

#### Ekran ustawień (`SettingsScreen`)
- Wyświetla: datę startu, aktualną fazę, tydzień w fazie (z badge DELOAD), tydzień ogólny.
- **Zmień datę startu** — modal z date pickerem; zmiana przelicza fazę, historia pozostaje.
- **Resetuj cały program** — modal z potwierdzeniem; usuwa wszystkie rekordy z `sessions` i `sets`, ustawia datę startu na dziś.
- Wersja aplikacji: `0.1.0`.

---

## Powiadomienia push i Service Worker

Plik `/sw.js` (w katalogu `public/`) obsługuje wiadomości z aplikacji:

| Wiadomość | Działanie |
|---|---|
| `SCHEDULE_NOTIFICATION` | Planuje powiadomienie na czas końca przerwy |
| `CANCEL_NOTIFICATION` | Anuluje zaplanowane powiadomienie |

Aplikacja prosi o zgodę na powiadomienia przy pierwszym uruchomieniu `RestView`. Powiadomienia działają nawet gdy karta przeglądarki jest w tle.

Rejestracja Service Workera odbywa się przez komponent `ServiceWorkerRegistrar` montowany w root layoutcie.

---

## Stan sesji (Zustand)

`src/lib/sessionStore.ts` — globalny store zarządzający przebiegiem aktywnej sesji.

| Stan | Opis |
|---|---|
| `currentExerciseIndex` | Indeks bieżącego ćwiczenia w planie |
| `currentSetIndex` | Indeks bieżącej serii |
| `completedSets` | Lista ukończonych serii (do zapisu w Supabase) |
| `sessionStartTime` | Czas startu (do obliczenia `duration_sec`) |
| `phase` | `'exercise'` / `'rest'` / `'done'` |

**Akcje:**

| Akcja | Opis |
|---|---|
| `initSession()` | Resetuje store i ustawia czas startu |
| `recordSet(set)` | Dodaje serię do listy ukończonych |
| `goToRest()` | Przełącza fazę na `'rest'` |
| `advanceSet(setsInExercise, totalExercises)` | Przechodzi do kolejnej serii / ćwiczenia lub ustawia `'done'` |
| `resetSession()` | Czyści store |

---

## Uruchomienie i konfiguracja

### Zmienne środowiskowe

Utwórz plik `.env.local` w katalogu głównym:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<twoj-projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<twoj-anon-key>
```

### Komendy

```bash
# Instalacja zależności
npm install

# Tryb deweloperski
npm run dev

# Budowanie produkcyjne
npm run build

# Uruchomienie buildu
npm start
```

### Wymagane tabele w Supabase

Przed pierwszym uruchomieniem utwórz w projekcie Supabase następujące tabele:

```sql
-- Konfiguracja programu (singleton)
create table program_config (
  id integer primary key,
  start_date date not null
);

-- Sesje treningowe
create table sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_type text not null,
  phase integer not null,
  week_in_phase integer not null,
  is_deload boolean not null default false,
  duration_sec integer,
  completed_at timestamptz default now()
);

-- Serie w ramach sesji
create table sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  exercise_key text not null,
  set_number integer not null,
  reps integer,
  hold_sec integer,
  muscle_target text,
  completed boolean not null default true
);
```

### Migracja bazy danych (v0.1 → v0.2)

Jeśli baza danych istnieje już z wersji 0.1, wykonaj poniższe migracje:

```sql
-- Dodanie kolumny cycle do sesji
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS cycle integer NOT NULL DEFAULT 1;

-- Zmiana dopuszczalnych wartości session_type
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_type_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_type_check
  CHECK (session_type IN ('session_a', 'session_b', 'session_c', 'morning', 'midday', 'evening'));

-- Dodanie muscle_target do serii
ALTER TABLE sets
  ADD COLUMN IF NOT EXISTS muscle_target text;

-- Opcjonalnie: wyczyść stare dane jeśli nie są potrzebne
-- TRUNCATE sessions CASCADE;
```

### Deploy na Vercel

Projekt zawiera `vercel.json` z konfiguracją frameworku Next.js. Wystarczy podłączyć repozytorium do Vercel i uzupełnić zmienne środowiskowe w panelu projektu.
