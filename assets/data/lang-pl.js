/* ============================================================================
   ZARYA — teksty, polski
   ----------------------------------------------------------------------------
   Główna wersja językowa: pracownia stoi w Łodzi i większość klientów pisze
   po polsku. Ton taki sam jak w wersji rosyjskiej — mówi rzemieślnik przy
   palniku, nie dział marketingu.
   ============================================================================ */

window.ZARYA_LANG_PL = {
  code: 'pl',
  htmlLang: 'pl',
  label: 'Polski',

  meta: {
    title: 'ZARYA — ręcznie gięty neon w Łodzi. Złóż szyld i zobacz cenę',
    description: 'Pracownia ręcznie giętych neonów w Łodzi. Kreator na stronie liczy cenę ' +
      'po długości rurki — dokładnie tak, jak liczy to rzemieślnik.',
    ogTitle: 'ZARYA — pracownia ręcznie giętego neonu, Łódź',
    ogDescription: 'Złóż szyld w kreatorze i zobacz uczciwy kosztorys: metry szkła, elektrody, podkład.'
  },

  nav: {
    why: 'Szkło',
    builder: 'Kreator',
    process: 'Jak robimy',
    samples: 'Próbki',
    prices: 'Cennik',
    faq: 'Pytania',
    order: 'Zapytanie',
    skip: 'Przejdź do treści'
  },

  lang: { label: 'Język', switchTo: 'Переключить на русский' },

  hero: {
    kicker: 'Łódź · giniemy szkło od 2014 roku',
    sign: 'ZARYA',
    h1: 'Pracownia ręcznie giętego neonu',
    lead: 'Szklaną rurkę gnie się ręcznie nad palnikiem i napełnia gazem pod niskim ciśnieniem. ' +
      'To nie jest taśma LED „w stylu neonu”. To neon: grzeje się, cicho brzęczy i świeci całą powierzchnią.',
    ctaPrimary: 'Złóż swój szyld',
    ctaSecondary: 'Ile to kosztuje'
  },

  why: {
    kicker: 'Różnica, którą widać',
    h2: 'Rurka czy taśma',
    lead: 'Często porównują nas z neonem elastycznym — silikonowym wężem z diodami w środku. ' +
      'Oto uczciwa różnica, łącznie z tą częścią, która nie działa na naszą korzyść.',
    cards: [
      {
        t: 'Światło',
        d: 'Gaz świeci całą powierzchnią rurki, więc blask jest miękki i przestrzenny. ' +
           'W taśmie świecą punkty pod silikonem: z bliska widać ziarno, na wideo — paski.'
      },
      {
        t: 'Trwałość',
        d: 'Rurka pracuje około 15 000 godzin i nie zmienia barwy: kolor daje gaz, nie farba. ' +
           'Silikon żółknie po dwóch–trzech latach i odcień ucieka.'
      },
      {
        t: 'Naprawa',
        d: 'Pękniętą rurkę można zlutować i napełnić od nowa — szyld żyje dalej. ' +
           'Taśmę przy przerwie wymienia się w całości.'
      },
      {
        t: 'Kiedy taśma jest lepsza',
        d: 'Budżet do 1500 zł, drobny zawiły rysunek, przestrzeń dla dzieci albo wąski ciąg, ' +
           'gdzie szyld ktoś zawadzi. Powiemy to wprost i nie będziemy wciskać szkła.'
      }
    ]
  },

  builder: {
    kicker: 'Kreator',
    h2: 'Złóż swój szyld',
    lead: 'Cena liczy się po długości rurki: strona mierzy kontur Twoich liter i mnoży przez stawkę ' +
      'za metr. Tak samo liczy rzemieślnik, gdy zdejmuje szkło z regału.',

    text1: 'Pierwszy wiersz',
    text2: 'Drugi wiersz',
    text2hint: 'Opcjonalnie',
    placeholder1: 'ZARYA',
    placeholder2: 'NEON',
    counter: 'znaków',
    unsupported: 'Tych znaków jeszcze nie giniemy:',
    empty: 'Wpisz tekst — rurka się zapali.',

    height: 'Wysokość liter',
    heightHint: 'Wielka litera, w centymetrach',
    diameter: 'Średnica rurki',
    diameterHint: 'Cieńsza jest subtelniejsza i droższa za metr',
    gas1: 'Gaz pierwszego wiersza',
    gas2: 'Gaz drugiego wiersza',
    frame: 'Ramka',
    frameHint: 'Też rurka, też metry',
    backing: 'Podkład',
    mount: 'Odbiór',
    extras: 'Dodatki',
    dimmer: 'Ściemniacz z pilotem',
    rush: 'Ekspres (6 dni roboczych zamiast 12)',

    gases: {
      neon: 'Neon, pomarańczowo-czerwony',
      ruby: 'Rubinowy',
      pink: 'Różowy',
      ice: 'Lodowy błękit',
      mint: 'Miętowy',
      violet: 'Fioletowy',
      warm: 'Ciepła biel',
      white: 'Zimna biel'
    },
    frames: { none: 'Bez ramki', rect: 'Prostokątna', underline: 'Podkreślenie' },
    backings: {
      none: 'Bez podkładu, na dystansach',
      clear: 'Bezbarwna pleksi 5 mm',
      black: 'Czarna pleksi 5 mm',
      cut: 'Pleksi cięta po konturze'
    },
    mounts: {
      pickup: 'Odbiór osobisty, Łódź',
      ship: 'Wysyłka na terenie Polski',
      install: 'Montaż naszą ekipą'
    },

    estimateTitle: 'Kosztorys',
    lineTube: 'Szkło, wiersz {n}',
    lineFrame: 'Szkło, ramka',
    lineElectrodes: 'Elektrody i lutowanie',
    lineBacking: 'Podkład',
    linePsu: 'Zasilacz',
    lineDimmer: 'Ściemniacz z pilotem',
    lineMount: 'Odbiór',
    lineMinimum: 'Dopłata do zamówienia minimalnego',
    lineRush: 'Ekspres',
    perMeter: 'zł/m',
    tubesCount: '{n} szt.',
    metersUnit: 'm',
    unitCm: 'cm',
    unitW: 'W',
    areaUnit: 'm²',
    netto: 'Razem netto',
    vat: 'VAT 23%',
    brutto: 'Do zapłaty brutto',
    term: 'Termin',
    days: 'dni roboczych',
    minimumNote: 'Zamówienie minimalne pracowni — 900 zł netto.',

    facts: {
      length: 'Długość rurki',
      tubes: 'Osobnych rurek',
      size: 'Wymiar',
      power: 'Pobór mocy'
    },
    factsHint: 'Długość jest zmierzona po konturze Twoich liter, a nie oszacowana po liczbie znaków.',

    copyLink: 'Link do projektu',
    linkCopied: 'Link skopiowany',
    downloadSvg: 'Pobierz projekt SVG',
    toOrder: 'Wyślij do zapytania',
    reset: 'Wyczyść',
    disclaimer: 'Kosztorys jest wstępny. Ostateczną cenę potwierdzamy po sprawdzeniu projektu: ' +
      'ciasne łuki, drobne detale i rzadkie kolory szkła potrafią zmienić rachunek.'
  },

  process: {
    kicker: 'Pracownia',
    h2: 'Co dzieje się z Twoim szyldem',
    steps: [
      { n: '01', t: 'Projekt 1:1',
        d: 'Drukujemy kontur w skali jeden do jednego i kładziemy na stole. Szkło nie znosi cienkich ' +
           'szeryfów ani ostrych ogonków — gdzie trzeba, przerysowujemy literę, aż da się ją wygiąć.' },
      { n: '02', t: 'Palnik',
        d: 'Rurkę grzeje się do 800 °C i gnie ręcznie na szablonie. Jeden rzemieślnik prowadzi jedną ' +
           'literę od początku do końca: maszyna tego nie umie, a nadgarstek — owszem.' },
      { n: '03', t: 'Odpompowanie i gaz',
        d: 'Z rurki wypompowujemy powietrze, wypalamy prądem resztki wilgoci i wpuszczamy neon albo ' +
           'argon z kroplą rtęci. Kolor daje gaz i barwa szkła, nie farba.' },
      { n: '04', t: 'Wygrzewanie',
        d: 'Lutujemy elektrody i zostawiamy świecące na dwanaście godzin. Rurka, która przetrwała ' +
           'pierwszą noc, przetrwa i dziesięć lat.' },
      { n: '05', t: 'Montaż i pakowanie',
        d: 'Osadzamy na podkładzie, podłączamy transformator, sprawdzamy nagrzewanie i brzęczenie, ' +
           'pakujemy w sztywną skrzynię z pianką. Instrukcja i zapasowy uchwyt są w środku.' }
    ]
  },

  samples: {
    kicker: 'Próbki',
    h2: 'Jak wygląda nasz alfabet',
    lead: 'To nie portfolio zleceń, tylko próbki: te same litery w różnych gazach, średnicach ' +
      'i podkładach. Kliknij próbkę — otworzy się w kreatorze.',
    open: 'Otwórz w kreatorze',
    items: [
      { text: 'PÓŁNOC',   sub: 'Argon, 10 mm, czarna pleksi' },
      { text: 'BARBER',    sub: 'Neon, 12 mm, bez podkładu' },
      { text: 'ŚWIT',      sub: 'Ciepła biel, 8 mm, ramka' },
      { text: 'КОФЕ',      sub: 'Rubinowy, 10 mm, podkreślenie' },
      { text: 'STUDIO 42', sub: 'Lodowy, 8 mm, bezbarwna pleksi' },
      { text: 'ОТКРЫТО',   sub: 'Miętowy, 10 mm, bez podkładu' }
    ]
  },

  prices: {
    kicker: 'Cennik',
    h2: 'Z czego składa się rachunek',
    lead: 'Pełny cennik pracowni. Kreator liczy z tych samych liczb — nic nie jest schowane.',
    thItem: 'Pozycja',
    thPrice: 'Cena',
    thNote: 'Wyjaśnienie',
    rows: [
      { i: 'Rurka 8 mm', p: '195 zł/m', n: 'Cienka, do małych liter i detali' },
      { i: 'Rurka 10 mm', p: '168 zł/m', n: 'Koń roboczy: szyldy od 15 cm' },
      { i: 'Rurka 12 mm', p: '152 zł/m', n: 'Duże litery, najwięcej światła' },
      { i: 'Gaz i powłoka', p: '+0…22%', n: 'Neon najtańszy, fioletowy najdroższy' },
      { i: 'Elektrody i lutowanie', p: '46 zł', n: 'Za każdą osobną rurkę' },
      { i: 'Pleksi bezbarwna', p: '430 zł/m²', n: 'Cięcie, polerowanie krawędzi, otwory' },
      { i: 'Pleksi czarna', p: '470 zł/m²', n: 'W dzień szyld czyta się jako obiekt' },
      { i: 'Pleksi po konturze', p: '690 zł/m²', n: 'Frezowanie w kształt napisu' },
      { i: 'Zasilacz', p: '190 zł', n: 'Jeden na każde 4 metry rurki' },
      { i: 'Ściemniacz z pilotem', p: '160 zł', n: 'Płynna jasność, wyłącznik czasowy' },
      { i: 'Wysyłka po Polsce', p: '95 zł', n: 'Sztywna skrzynia, ubezpieczenie w cenie' },
      { i: 'Montaż w Łodzi', p: '280 zł', n: 'Wiercenie, mocowanie, podłączenie' },
      { i: 'Ekspres', p: '+25%', n: '6 dni roboczych zamiast 12' }
    ],
    note: 'Zamówienie minimalne — 900 zł netto. Ceny bez VAT 23%. ' +
      'Cennik dotyczy standardowego szkła; rzadkie kolory wyceniamy osobno.'
  },

  faq: {
    kicker: 'Pytania',
    h2: 'To, o co pytają przed zamówieniem',
    items: [
      { q: 'Jak długo żyje neon?',
        a: 'Około 15 000 godzin świecenia. Przy sześciu godzinach wieczorami to mniej więcej siedem lat ' +
           'pracy. Potem rurka nie gaśnie nagle, tylko blednie — i można ją napełnić ponownie.' },
      { q: 'Czy dużo zużywa prądu?',
        a: 'Metr rurki to około 30–45 W. Szyld z czterech metrów bierze tyle, co jedna stara żarówka: ' +
           'około 150 W. Za wieczór pracy wychodzi mniej niż złotówka.' },
      { q: 'Czy można powiesić na zewnątrz?',
        a: 'Tak, ale wyłącznie w szczelnej obudowie o klasie IP65 i z transformatorem zewnętrznym. ' +
           'To osobna robota: wyceniamy po oględzinach miejsca.' },
      { q: 'Czy to niebezpieczne? W środku jest wysokie napięcie.',
        a: 'Na elektrodach do 8 kV, ale prąd jest znikomy, a transformator wyłącza się przy przerwaniu ' +
           'obwodu. Montujemy zabezpieczenie i nie wydajemy szyldu bez uziemienia i instrukcji.' },
      { q: 'A jeśli stłucze się w transporcie?',
        a: 'Wozimy w sztywnej skrzyni z wyprofilowaną pianką, przesyłka jest ubezpieczona. ' +
           'Jeśli szkło dojedzie pęknięte — robimy nowe na nasz koszt.' },
      { q: 'Czy można własny krój pisma albo logo?',
        a: 'Tak. Przyślij wektor (SVG, AI, PDF). Odeślemy projekt z uwagami: co da się wygiąć jeden ' +
           'do jednego, a co trzeba uprościć, żeby nie stracić czytelności.' },
      { q: 'Gwarancja?',
        a: '24 miesiące na rurkę i transformator. Uszkodzeń mechanicznych i skoków w sieci nie ' +
           'obejmuje, ale naprawiamy po kosztach.' },
      { q: 'Czy pracujecie z innymi miastami?',
        a: 'Wysyłamy po całej Polsce. Montaż własnymi rękami robimy w Łodzi i w promieniu 60 km; ' +
           'dalej — szczegółowa instrukcja i rozmowa z Twoim elektrykiem.' }
    ]
  },

  order: {
    kicker: 'Zapytanie',
    h2: 'Przyślij projekt — odeślemy dokładny kosztorys',
    lead: 'Odpowiadamy w dzień roboczy. Jeśli kreator jest już złożony, jego ustawienia pojadą razem ' +
      'z zapytaniem.',
    name: 'Jak się do Ciebie zwracać',
    contact: 'E-mail albo telefon',
    contactHint: 'Gdzie wysłać odpowiedź',
    city: 'Miasto',
    message: 'Czego potrzebujesz',
    messageHint: 'Miejsce, wymiar, termin — wszystko, co już wiadomo',
    attached: 'Do zapytania dołączony jest projekt z kreatora',
    attachedNone: 'Projekt nie jest złożony — to nie blokuje zapytania',
    consent: 'Zgadzam się na przetwarzanie danych w celu odpowiedzi na zapytanie',
    consentLink: 'Polityka prywatności',
    submit: 'Wyślij zapytanie',
    sending: 'Wysyłamy…',
    required: 'Pole wymagane',
    errName: 'Napisz, jak się do Ciebie zwracać',
    errContact: 'Potrzebny e-mail albo telefon, inaczej nie odpowiemy',
    errContactFormat: 'Wygląda na literówkę: sprawdź adres albo numer',
    errConsent: 'Bez zgody nie możemy przechowywać Twoich danych',
    errSummary: 'Sprawdź zaznaczone pola',
    noBackend: 'Formularz nie jest jeszcze podłączony do serwera',
    noBackendHint: 'To wersja demonstracyjna strony. Żeby zapytania docierały, podłącz obsługę ' +
      'formularza — jak dokładnie, opisano w pliku README projektu.'
  },

  contact: {
    h2: 'Pracownia',
    address: 'ul. Piotrkowska 000, 90-000 Łódź',
    addressNote: 'Adres demonstracyjny',
    hours: 'Pon–pt 10:00–18:00, sobota po umówieniu',
    phone: '+48 000 000 000',
    email: 'pracownia@zarya.example',
    visit: 'Wpadnij zobaczyć palnik — uprzedź dzień wcześniej.'
  },

  footer: {
    tagline: 'Ręczne gięcie szkła, Łódź',
    rights: 'Projekt demonstracyjny. Dane firmy, adres i telefon są zastępcze.',
    privacy: 'Polityka prywatności',
    backTop: 'Do góry'
  },

  thanks: {
    title: 'Zapytanie wysłane — ZARYA',
    h1: 'Mamy je',
    lead: 'Odpowiemy w najbliższy dzień roboczy. Jeśli sprawa pilna — zadzwoń do pracowni.',
    back: 'Na stronę główną',
    builder: 'Złóż kolejny szyld'
  },

  notFound: {
    title: 'Nie znaleziono strony — ZARYA',
    sign: '404',
    h1: 'Ta rurka nie świeci',
    lead: 'Pod tym adresem nic nie ma. Bywa: gaz uszedł, elektroda się odlutowała, link się zestarzał.',
    home: 'Na stronę główną',
    builder: 'Do kreatora'
  },

  privacy: {
    title: 'Polityka prywatności — ZARYA',
    h1: 'Polityka prywatności',
    updated: 'Aktualizacja: 6 września 2026',
    templateWarn: 'To wzór, a nie dokument prawny. Przed publikacją strony musi go sprawdzić prawnik ' +
      'i wstawić prawdziwe dane administratora danych.',
    back: 'Na stronę główną',
    sections: [
      { t: 'Kto przetwarza dane',
        b: 'Administratorem danych jest pracownia ZARYA; adres i dane rejestrowe podajemy w stopce ' +
           'strony. Kontakt w sprawach danych — adres e-mail z sekcji „Pracownia”.' },
      { t: 'Jakie dane zbieramy',
        b: 'Tylko to, co sam wpiszesz w formularzu: imię, e-mail albo telefon, miasto i treść ' +
           'wiadomości. Do tego ustawienia szyldu, jeśli wyślesz go z kreatora.' },
      { t: 'Po co',
        b: 'Żeby odpowiedzieć na zapytanie i policzyć kosztorys. Podstawa — Twoja zgoda oraz ' +
           'działania przed zawarciem umowy.' },
      { t: 'Jak długo przechowujemy',
        b: 'Do 24 miesięcy od ostatniej wiadomości, potem usuwamy. Jeśli doszło do transakcji — ' +
           'tyle, ile wymaga księgowość.' },
      { t: 'Komu przekazujemy',
        b: 'Dostawcy hostingu i poczty jako podmiotom przetwarzającym technicznie. ' +
           'Nie sprzedajemy i nie przekazujemy danych do celów reklamowych.' },
      { t: 'Cookies i analityka',
        b: 'Strona nie ustawia reklamowych ani analitycznych cookies. Jedyne, co zapisuje przeglądarka, ' +
           'to wybór języka i ustawienia kreatora. To dane techniczne i nie opuszczają Twojego urządzenia. Jasny lub ciemny wygląd strona bierze z ustawień Twojego systemu i nigdzie go nie zapisuje.' },
      { t: 'Twoje prawa',
        b: 'Dostęp do danych, sprostowanie, usunięcie, ograniczenie przetwarzania, wycofanie zgody ' +
           'oraz skarga do organu nadzorczego (w Polsce — UODO).' }
    ]
  }
};
