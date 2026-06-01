export type ExerciseType = 'timed_hold' | 'explosive_reps' | 'reverse_kegel' | 'isolation' | 'mixed_sequence'
export type MuscleTarget = 'ic' | 'bs' | 'pc' | 'ic_bs' | 'bs_isolated'

export interface MuscleInfo {
  id: string
  name: string
  role: string
}

export interface ExerciseDefinition {
  key: string
  name: string
  type: ExerciseType
  muscle_target: MuscleTarget
  muscles: MuscleInfo[]
  position: string
  cue: string
  how_to_feel: string
  common_mistakes: string[]
}

export const EXERCISES: ExerciseDefinition[] = [
  {
    key: 'quick_flicks',
    name: 'Quick Flicks — eksplozja IC+BS',
    type: 'explosive_reps',
    muscle_target: 'ic_bs',
    muscles: [
      {
        id: 'ic',
        name: 'Ischiocavernosus (IC)',
        role: 'Główny — eksplozywna kompresja żylna, generuje ciśnienie wewnątrzjamiste, odpowiada za twardość kątową prącia.',
      },
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Wspierający — pompuje krew do żołędzi, kompresuje żyłę grzbietową głęboką.',
      },
    ],
    position: 'Stojąca. Stopy na szerokość bioder, kolana lekko ugięte, pośladki świadomie rozluźnione przez cały czas.',
    cue: 'Maksymalnie szybki skurcz IC+BS (1 sekunda) → pełne, świadome rozluźnienie (2 sekundy). Tempo ekspresowe — relaks absolutny.',
    how_to_feel: 'Połóż dwa palce u nasady prącia po boku, przy kości łonowej. Wyobraź sobie że próbujesz unieść prącie w górę bez dotykania — poczujesz twarde napięcie po bokach nasady. To IC. Drugi palec na środku krocza między moszną a odbytem — to BS. Prawidłowy skurcz angażuje oba punkty jednocześnie.',
    common_mistakes: [
      'Napięcie w pośladkach — jeśli czujesz pośladki, technika jest zła.',
      'Niepełny relaks między powtórzeniami — każde powtórzenie zaczyna się od zera napięcia.',
      'Ruch "do tyłu" zamiast "do przodu i w górę" — to angażuje PC, nie IC.',
    ],
  },
  {
    key: 'iso_hold_ic',
    name: 'Izometria eksplozywna IC',
    type: 'timed_hold',
    muscle_target: 'ic',
    muscles: [
      {
        id: 'ic',
        name: 'Ischiocavernosus (IC)',
        role: 'Jedyny cel — izometryczna kompresja żylna utrzymana pod pełnym napięciem przez zadany czas.',
      },
    ],
    position: 'Faza 1–2: siedząca. Faza 3 i Cykl 2: stojąca (większe ciśnienie śródbrzuszne).',
    cue: 'Eksplozja do 100% napięcia IC → trzymaj przez zadany czas → kontrolowane rozluźnienie przez tyle samo sekund co czas trzymania.',
    how_to_feel: 'U nasady prącia, po bokach — napięcie głębokie, boczne, przy kości. Prącie lekko się unosi lub twardnieje u nasady. Zero ruchu w pośladkach i odbycie.',
    common_mistakes: [
      'Zaciśnięcie pośladków jako kompensacja siły.',
      'Wstrzymanie oddechu — oddychaj spokojnie przez cały czas trzymania.',
      'Skracanie czasu pod zmęczeniem — lepiej mniej serii, ale pełny czas każdej.',
    ],
  },
  {
    key: 'iso_hold_ic_lunge',
    name: 'Izometria IC — pozycja wykroku',
    type: 'timed_hold',
    muscle_target: 'ic',
    muscles: [
      {
        id: 'ic',
        name: 'Ischiocavernosus (IC)',
        role: 'Praca w asymetrycznym obciążeniu bioder — symuluje warunki dynamiczne aktywności seksualnej.',
      },
    ],
    position: 'Wykrok: jedna noga wysunięta do przodu (kolano nad stopą), tylna noga wyprostowana. Biodra opuszczone nisko. Zmiana strony po połowie serii.',
    cue: 'Identyczny skurcz IC jak w wersji stojącej — eksplozja do 100% → trzymanie → pełne rozluźnienie. Pozycja wykroku to dodatkowy bodziec, nie zmiana techniki skurczu.',
    how_to_feel: 'W wykroku biodra są w asymetrycznym rozciągnięciu — dno miednicy pracuje w nowym zakresie ruchu. Napięcie IC może być trudniejsze do izolacji — poświęć pierwszą serię na kalibrację.',
    common_mistakes: [
      'Zbyt wysoka pozycja bioder — kolano nogi przedniej musi być wyraźnie ugięte.',
      'Napięcie ud jako kompensacja — skurcz pochodzi z krocza, nie z nóg.',
      'Pominięcie zmiany strony — obie nogi muszą być obciążone równo.',
    ],
  },
  {
    key: 'endurance_hold_bs',
    name: 'Wytrzymałość BS — długie trzymanie',
    type: 'timed_hold',
    muscle_target: 'bs',
    muscles: [
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Główny — wytrzymałość izometryczna, budowanie bazy do kontroli ejakulacyjnej.',
      },
    ],
    position: 'Siedząca na twardym krześle lub taborecie. Kontakt twardego siedzenia z kością kulszową aktywuje propriocepcję miednicy.',
    cue: 'Płynny skurcz do 50–65% napięcia (nie maksimum!) → trzymaj równomiernie przez zadany czas → płynne rozluźnienie przez 5 sekund. Oddech nie przerywa się ani nie zmienia rytmu.',
    how_to_feel: 'Środek krocza między moszną a odbytem. Zatrzymanie strumienia moczu w połowie — to BS. Napięcie płytsze i bardziej centralne niż IC, ruch do przodu a nie do tyłu.',
    common_mistakes: [
      'Napięcie 100% zamiast 50–65% — to ćwiczenie wytrzymałościowe, nie siłowe. Zbyt duże napięcie buduje hypertonię.',
      'Przerywanie oddechu pod napięciem.',
      'Mylenie BS z PC — ruch powinien być do przodu, nie do tyłu w kierunku odbytu.',
    ],
  },
  {
    key: 'endurance_hold_bs_standing',
    name: 'Wytrzymałość BS — pozycja stojąca',
    type: 'timed_hold',
    muscle_target: 'bs',
    muscles: [
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Praca wytrzymałościowa pod zwiększonym ciśnieniem śródbrzusznym w pozycji grawitacyjnej.',
      },
    ],
    position: 'Stojąca. Stopy na szerokość bioder, kolana lekko ugięte, pośladki rozluźnione. Ręce swobodnie opuszczone.',
    cue: 'Identyczna technika jak Wytrzymałość BS siedząca — 50–65% napięcia, równy oddech, płynne trzymanie. Pozycja stojąca zwiększa ciśnienie narządów na dno miednicy.',
    how_to_feel: 'W pozycji stojącej odczucie BS może być trudniejsze do izolacji ze względu na większe ciśnienie. Jeśli czujesz kompensację pośladków — wróć do siedzącej i powtórz kalibrację.',
    common_mistakes: [
      'Napięcie pośladków jako wsparcie dla BS w pozycji stojącej.',
      'Zbyt duże napięcie — efekt "starania się bardziej" w trudniejszej pozycji. Trzymaj 50–65%.',
      'Wstrzymywanie oddechu pod zwiększonym ciśnieniem śródbrzusznym.',
    ],
  },
  {
    key: 'reverse_kegel',
    name: 'Reverse Kegel — downtraining',
    type: 'reverse_kegel',
    muscle_target: 'ic_bs',
    muscles: [
      {
        id: 'ic',
        name: 'Ischiocavernosus (IC)',
        role: 'Aktywne rozluźnienie i wydłużenie — prewencja hipertonii po intensywnym treningu Type II.',
      },
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Aktywne rozluźnienie — reset napięcia spoczynkowego po sesjach wytrzymałościowych.',
      },
    ],
    position: 'Leżąca z ugiętymi kolanami (faza nauki) lub głęboki przysiad słowiański — pięty na podłodze, kolana na zewnątrz (faza zaawansowana).',
    cue: 'Głęboki wdech przeponowy → na szczycie wdechu aktywne "otwarcie" krocza w dół i na boki — jakby przestrzeń między kośćmi kulszowymi się poszerzała → trzymaj 3 sekundy bez żadnego napięcia → bierny powrót na wydechu.',
    how_to_feel: 'To jest "odmowa napięcia" — mięsień który normalnie się spina, teraz świadomie odpuszcza. Jeśli czujesz parcie w dół jak przy defekacji — to błąd, zatrzymaj się. Prawidłowo: odczucie otwarcia, lekkości, poszerzenia.',
    common_mistakes: [
      'Parcie w dół (manewr Valsalvy) — to nie jest Reverse Kegel, to błąd z ryzykiem hemoroidów i przepukliny.',
      'Oddychanie szczytowe (piersiowe) zamiast przeponowego — uniemożliwia prawidłowy mechanizm hydrauliczny.',
      'Zbyt krótkie trzymanie — minimum 3 sekundy na szczycie wdechu dla reset neurologiczny.',
    ],
  },
  {
    key: 'bs_isolation',
    name: 'Izolacja BS bez IC i PC',
    type: 'isolation',
    muscle_target: 'bs_isolated',
    muscles: [
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Jedyny cel — precyzyjna izolacja neurologiczna bez jakiejkolwiek kompensacji IC lub PC. To jest fundament wolicjonalnej kontroli ejakulacyjnej.',
      },
    ],
    position: 'Siedząca, wyprostowany kręgosłup, stopy płasko na podłodze.',
    cue: 'Wciągnij cewkę moczową do przodu i w górę, pod spojenie łonowe. Ruch czysto do przodu — zero ruchu w odbycie, zero w pośladkach, zero w IC. Trzymaj 3–5 sekund.',
    how_to_feel: 'Test trzech palców: jeden palec na środku krocza (BS), drugi przy nasadzie bocznej (IC), trzeci przy odbycie (PC). Prawidłowo: czujesz napięcie tylko pod palcem środkowym. Jeśli czujesz ruch przy odbycie — to PC, zresetuj. Jeśli czujesz napięcie przy nasadzie — to IC, zresetuj.',
    common_mistakes: [
      'Ruch do tyłu w kierunku odbytu — to PC, nie BS. Cały ruch musi być do przodu.',
      'Jednoczesne napięcie IC — sprawdź palcem czy boki nasady są rozluźnione.',
      'Napięcie ud lub brzucha jako kompensacja — bardzo częste przy próbie "starania się bardziej".',
    ],
  },
  {
    key: 'squat_integration',
    name: 'Integracja w przysiadzie',
    type: 'mixed_sequence',
    muscle_target: 'ic_bs',
    muscles: [
      {
        id: 'ic',
        name: 'Ischiocavernosus (IC)',
        role: 'Eksplozywna praca pod maksymalnym ciśnieniem śródbrzusznym i w pełnym rozciągnięciu.',
      },
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Wytrzymałościowa praca w pozycji symulującej warunki aktywności seksualnej.',
      },
    ],
    position: 'Głęboki przysiad słowiański: pięty na podłodze, kolana na zewnątrz, biodra poniżej kolan. Ręce złożone przed sobą dla równowagi. Jeśli pięty się unoszą — podłóż coś pod pięty.',
    cue: 'W pozycji przysiadu (bez wstawania): 5 × Quick Flicks (100% napięcia, pełny relaks) → bez przerwy → 5 × Endurance Hold 5 sekund (50% napięcia). Cała sekwencja to jedna seria.',
    how_to_feel: 'W głębokim przysiadzie dno miednicy jest w pełnym rozciągnięciu i pracuje przeciwko grawitacji i ciśnieniu narządów wewnętrznych jednocześnie. To najtrudniejsza pozycja w programie — odczucie izolacji IC i BS jest tutaj trudniejsze niż w leżeniu czy siedzeniu.',
    common_mistakes: [
      'Pięty uniesione — jeśli nie możesz utrzymać pięt na podłodze, podłóż pod nie złożony ręcznik lub deski.',
      'Napięcie pośladków w przysiadzie — kolana aktywnie na zewnątrz, pośladki rozluźnione.',
      'Wstawanie między seriami — cała sekwencja odbywa się w przysiadzie.',
    ],
  },
  {
    key: 'squat_integration_dynamic',
    name: 'Integracja dynamiczna — przysiad do stania',
    type: 'mixed_sequence',
    muscle_target: 'ic_bs',
    muscles: [
      {
        id: 'ic',
        name: 'Ischiocavernosus (IC)',
        role: 'Utrzymanie skurczu podczas zmiany pozycji — trening automatyzacji odruchu.',
      },
      {
        id: 'bs',
        name: 'Bulbospongiosus (BS)',
        role: 'Ciągłość napięcia przez pełny zakres ruchu bioder.',
      },
    ],
    position: 'Start: głęboki przysiad słowiański. Ruch: wstawanie do pełnego wyprostu bioder. Powrót do przysiadu. Skurcz utrzymywany przez cały ruch.',
    cue: 'Zainicjuj skurcz IC+BS w przysiadzie → utrzymuj napięcie podczas wstawania → utrzymuj w pozycji stojącej 2 sekundy → utrzymuj podczas opadania do przysiadu → pełne rozluźnienie w dolnej pozycji → następne powtórzenie.',
    how_to_feel: 'Główne wyzwanie: napięcie IC+BS musi być utrzymane gdy pozycja bioder się zmienia. To symuluje kontrolę podczas dynamicznej aktywności. Jeśli tracisz napięcie przy wstawaniu — spowolnij ruch do połowy tempa.',
    common_mistakes: [
      'Utrata skurczu w połowie ruchu — to norma na początku, wymaga kilku tygodni automatyzacji.',
      'Zbyt szybkie tempo wstawania — spowolnij do 3 sekund na wejście i 3 sekundy na zejście.',
      'Wstrzymanie oddechu podczas ruchu — oddychaj naturalnie przez cały ruch.',
    ],
  },
]
