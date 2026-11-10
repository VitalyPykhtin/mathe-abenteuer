# Mathe-Abenteuer im Zahlenland

Игра-тренажёр по математике для 4 класса (немецкая школа, Берлин): сюжет в 3D-сценах, тренировка, блиц, пробная контрольная. Покрывает программу всего учебного года.

Играть: https://mathe-abenteuer.ermakov.dev/ (после первого открытия работает без интернета).

Чистая статика: никаких сборок и зависимостей, кроме `three.min.js` (лежит рядом).

## Что есть в игре

- **📖 Geschichte** — сюжет в двух частях (15 глав). Teil 1: «Die sieben Zahlenkristalle», Teil 2: «Der zerbrochene Rechenstern».
  Вторая часть сюжета открывается после прохождения первой; тренировать её темы можно сразу (Training, Klassenarbeit).
- **🎯 Training** — 15 миров, каждый мир = одна тема, 3 уровня, 45 карточек животных. Тему для тренировки выбирает сам ребёнок (или родитель).
- **📝 Klassenarbeit**, **⚡ Blitz-Runde**, **🪄 Schwächen-Zauber** — на экране перед стартом есть блок
  **«Welche Themen sollen drankommen?»**: отмечаете темы, которые будут в ближайшей контрольной, и задания берутся только из них.
  Кнопки «Nur Teil 1», «Nur Teil 2», «Alle Themen» — быстрый выбор. Выбор запоминается и общий для всех трёх режимов.
  По умолчанию выбраны темы первой части.
- **🦉 Eulen-Pause** — защита от бездумного угадывания. Если подряд идут неверные ответы (быстрые считаются «тяжелее»),
  Frau Eule зовёт на паузу: показывает и читает вслух памятку по текущей теме, предлагает пару раз вдохнуть вместе со звездой,
  а в следующих заданиях кнопка «Prüfen» включается только через несколько секунд («Erst denken»). За первый верный ответ после
  паузы ребёнок получает «Eulenfeder» 🪶 и бонусные монеты — то есть думать выгоднее, чем угадывать. В блице и контрольной паузы нет.
- **🏰 Meine Welt**, **Tieralbum** — награды: 3D-мир и тематический набор стикеров за каждую пройденную главу (стикеры покупаются за монеты), фото-карточки за тренировки.

## Lehrplan Klasse 4 und die passenden Teile im Spiel

Grundlage ist der **Rahmenlehrplan Berlin/Brandenburg, Teil C Mathematik (Jahrgangsstufen 1–10)**. Er ist nach fünf
Themenbereichen gegliedert; am Ende von Klasse 4 soll in der Regel **Niveaustufe C** erreicht sein (Niveaustufe D bis Ende Klasse 6).
Die Reihenfolge unten folgt dem üblichen Aufbau der Schulbücher für Klasse 4. Jede Schule legt ihre eigene Reihenfolge fest –
deshalb lassen sich die Themen im Spiel frei auswählen.

| Nr. | Themenbereich (RLP) | Thema im Unterricht | Inhalte | Im Spiel (Kapitel · Trainingswelt) | Kürzel |
|---|---|---|---|---|---|
| 1 | Zahlen und Operationen | **Zahlen bis 1 Million** | Stellenwerttafel, Zahlwörter, Vorgänger/Nachfolger, Nachbartausender/-zehntausender/-hunderttausender, Zahlen vergleichen und ordnen | Kap. 1 Der Zahlenwald · 🌲 Zahlenwald | `wald` |
| 2 | Zahlen und Operationen | **Zahlenstrahl** | Skalierung erkennen, Zahlen ablesen und eintragen | Kap. 2 Die weite Savanne · 🦒 Zahlenstrahl-Savanne | `savanne` |
| 3 | Zahlen und Operationen | **Runden** | Runden auf T, ZT, HT; Rundungsgrenzen | Kap. 3 Das Eismeer · 🧊 Rundungs-Eismeer | `eis` |
| 4 | Raum und Form | **Kreis** | Mittelpunkt, Radius, Durchmesser, Kreislinie; Zirkel; Kreise vergleichen und begründen | Kap. 4 Das Korallenriff · 🐠 Kreis-Riff | `ozean` |
| 5 | Raum und Form | **Vierecke** | Parallele Seiten, Quadrat, Rechteck, Parallelogramm, Raute, Trapez, Drachenviereck | Kap. 5 Der tiefe Dschungel · 🦜 Vierecks-Dschungel | `dschungel` |
| 6 | Raum und Form | **Parallel und senkrecht** | Lagebeziehungen von Linien, Stadtplan, Parallelogramm ergänzen | Kap. 6 Das hohe Gebirge · ⛰️ Linien-Gebirge | `berge` |
| – | – | *Wiederholung Teil 1* | Mix wie in der Klassenarbeit | Kap. 7 Die Insel der Meister · 🏝️ Insel der Meister | `insel` |
| 7 | Zahlen und Operationen | **Schriftliche Addition und Subtraktion** | Schriftlich rechnen bis 1 Million (auch drei Summanden, Zahlen mit Nullen), Überschlag, Kopfrechnen mit ZT/HT, Ergänzen zur Million, Umkehraufgabe, Fehler finden, Sachaufgaben | Kap. 8 Der Marktplatz · 🧺 Rechen-Markt | `markt` |
| 8 | Zahlen und Operationen | **Multiplikation** | Malnehmen mit Zehner-/Hunderter-/Tausenderzahlen, halbschriftlich, schriftlich mit ein- und zweistelligem Faktor, Überschlag, Sachaufgaben | Kap. 9 Die Bienenwiese · 🐝 Mal-Wiese | `wiese` |
| 9 | Zahlen und Operationen | **Division** | Teilen mit Zehnerzahlen, halbschriftlich, Division mit Rest, schriftliche Division durch einstellige Zahlen¹, Teiler und Vielfache, Teilbarkeit durch 2, 5, 10, Sachaufgaben mit Rest | Kap. 10 Die Piratenbucht · 🏴‍☠️ Teiler-Bucht | `piraten` |
| 10 | Größen und Messen | **Größen** | Gewichte (g, kg, t), Längen (mm, cm, m, km), Hohlmaße (ml, l), Kommaschreibweise, Stützgrößen/Schätzen, Zeit (Zeitpunkte, Zeitspannen, s–min–h), Rechnen mit Größen | Kap. 11 Die Zuckerbäckerei · 🧁 Zuckerbäckerei | `zucker` |
| 11 | Größen und Messen · Raum und Form | **Umfang und Flächeninhalt, Maßstab** | Umfang und Flächeninhalt von Rechteck und Quadrat, zusammengesetzte Figuren im Kästchengitter, fehlende Seite, Umfang ≠ Fläche, Maßstab 1 : 10 bis 1 : 100 000 | Kap. 12 Der Schlossgarten · 🏰 Schlossgarten | `schloss` |
| 12 | Raum und Form | **Körper und Symmetrie** | Würfel, Quader, Kugel, Zylinder, Kegel, Pyramide; Ecken–Kanten–Flächen; Würfelnetze; Würfelgebäude und Rauminhalt mit Einheitswürfeln; Spiegelbilder, Symmetrieachsen | Kap. 13 Die Pyramiden-Wüste · 🐪 Pyramiden-Wüste | `wueste` |
| 13 | Daten und Zufall | **Daten, Zufall, Kombinatorik** | Säulendiagramme lesen, sicher – möglich – unmöglich, Wahrscheinlichkeiten vergleichen (Glücksrad, Lostopf, Würfel), Möglichkeiten zählen; einfache Brüche (½, ¼, ¾ …)¹ | Kap. 14 Der Jahrmarkt · 🎡 Zufalls-Jahrmarkt | `jahrmarkt` |
| 14 | Gleichungen und Funktionen | **Rechenregeln, Gleichungen, Knobeln** | Punkt vor Strich, Klammern, Term zur Sachaufgabe finden, Platzhalter-Aufgaben, Zahlenrätsel (rückwärts rechnen), Zahlenfolgen, Sachaufgaben in zwei Schritten | Kap. 15 Die Sternwarte · 🚀 Sternwarte der Meister | `sterne` |

¹ Im Rahmenlehrplan gehören die schriftliche Division und das Rechnen mit Brüchen zur Niveaustufe D (Klasse 5/6). Viele Schulbücher
für Klasse 4 beginnen aber schon damit; im Spiel sind es deshalb die schwereren Aufgaben (Level 2–3) bzw. ein Ausblick.

Замечание об источнике: официальный PDF плана с сайта Берлина из среды разработки открыть не удалось, поэтому таблица собрана
по структуре Rahmenlehrplan (пять Themenbereiche, Niveaustufe C) и типичному порядку тем в учебниках 4 класса. Порядок тем в
конкретной школе может отличаться — сверяйте по заголовкам контрольных и отмечайте нужные темы в игре.

## Где что лежит

| Файл | Что внутри |
|---|---|
| `tasks.js` | Часть 1: генераторы заданий (`gen…`), фото-карточки животных (`ANIMALS`), миры тренировки (`WORLDS`) |
| `tasks2.js` | Часть 2: генераторы заданий, животные и миры; наборы заданий для контрольной (`EXPOOL`) и блица (`BLITZPOOL`) по темам |
| `story.js` | Персонажи (`ACT`) и сюжет части 1: главы и сцены (`CHAPTERS`) |
| `story2.js` | Названия частей (`PARTS`), персонажи и сюжет части 2 |
| `world3d.js` | 3D-локации на three.js (`BUILD.wald`, `BUILD.markt`, …) и анимация персонажей |
| `game.js` | Вся логика: выбор героя, история, тренировка, блиц, контрольная, «Schwächen-Zauber», «Meine Welt» |
| `img/e/*.png` | Персонажи и стикеры (Fluent Emoji 3D, MIT) |
| `img/*.jpg` | Фото животных для коллекционных карточек (Wikimedia Commons) |

## Как добавить новую тему

1. **Задания** — в `tasks2.js` написать генератор: функцию, которая при каждом вызове возвращает новое задание. Типы:
   - `mc(вопрос, верный, [неверные…], объяснение)` — выбор ответа; `tf(…)` — «Stimmt / Stimmt nicht»;
   - `{ type: 'fields', q, parts: ['текст', { ans: 123 }, …], explain }` — ввод чисел;
   - `{ type: 'col', q, col: addCol([a, b]) | subCol(a, b) | mulCol1(n, f) | mulCol2(n, f), explain }` — письменный счёт в клеточках (ввод справа налево);
   - `{ type: 'cells', q, mirror: {W, H, vert, given, ans}, explain }` — закрасить клетки (зеркальное отражение);
   - `{ type: 'line', q, line: {start, major, sub, majors}, ans, explain }` — числовой луч;
   - `{ type: 'grid', q, grid: {A, B, C, D}, ans, explain }` — точка на клетчатом поле.
   Поле `explain` — разбор, который показывается после ошибки. `visual` — любая SVG-картинка к вопросу.
2. **Тренировка** — добавить объект в `WORLDS` (три уровня — три списка генераторов, три животных из `ANIMALS`; `part: 1` — вторая часть).
   В «мастерских» мирах задание можно записать как `[генератор, 'тема']`, чтобы статистика шла в нужную тему.
3. **Контрольная и блиц** — дописать тему в `EXPOOL` (сначала самые важные задания) и `BLITZPOOL` (только быстрые) в конце `tasks2.js`.
4. **Глава истории** — добавить объект в `CHAPTERS`. Сцена:
   `{ bg: 'wald', a: 'polina@20 finn@40 nelli@70!hop', l: ['nelli: Hallo!'], intro: 'Текст к заданию', g: genЧтоТо }`.
   Сцена без `g` — просто кусок мультфильма. `bg` — любая 3D-локация (с `2` на конце — другой ракурс).
   Чтобы сцены не были одинаковыми, есть дополнительные поля:
   - `g: [genA, genB, genC]` или `n: 3` — несколько заданий подряд («тройной замок», дуэль); `pip: ['🔒', '🔓']` — значки прогресса, `steps: […]` — текст к каждому шагу;
   - `time: 45` — задание на время (после первой неудачи таймер отключается, чтобы не было стресса); `timeIcon`, `late` — значок и текст;
   - `pick: [{ icon, label, sub, g, coins, intro }, …]` — выбор из двух путей с разной сложностью и наградой;
   - `bonus: 'rad' | 'kiste' | 'stern' | 'honig' | 'torte'` — сюрприз с монетами после сцены;
   - `win: ['emote kroko 💦']` — что происходит на сцене после верного ответа;
   - строки диалога, начинающиеся с `*`, — режиссёрские команды: `*enter figur@70!hop`, `*exit figur`, `*move figur 60`,
     `*emote figur ❗`, `*jump [figur]`, `*shake`, `*flash [цвет]`, `*coins 3 Текст`.
5. Если у главы/мира новый `id` — дописать его в `TOPIC`, `ENVCSS`, `BUDDIES` в начале `game.js`; для собственной 3D-локации — добавить `BUILD.<id>` в `world3d.js`.
6. Поднять номер `?v=` в `index.html` и `V` в `sw.js`, чтобы браузер не взял старые файлы из кэша.

## Развёртывание

Сайт раздаёт Cloudflare (https://mathe-abenteuer.ermakov.dev/) из ветки `main`. На домашнем сервере файлы лежат в `~/src/mathe-abenteuer`, их раздаёт пользовательский сервис systemd
`mathe-abenteuer.service` (`python3 -m http.server 8083`). Обновить:

```bash
scp -r index.html style.css *.js img user@server:~/src/mathe-abenteuer/
```

Прогресс (монеты, кристаллы, карточки) хранится в браузере устройства (`localStorage`).

## Офлайн-режим

`sw.js` (service worker) при первом открытии сохраняет на устройство всю игру: код, шрифты, three.js и все картинки
(список картинок считается из данных игры, вручную его вести не нужно). Внешних запросов в интернет игра не делает.
После изменений в игре поднимите `V` в `sw.js` и `?v=` в `index.html`.

Важно: браузеры включают service worker только на **HTTPS** или `localhost`. По адресу `http://<домашний-сервер>:8083`
игра работает без интернета, но только пока доступен сам сервер. На главном экране появляется значок
«✈️ Offline bereit», когда игра сохранена на устройстве.

**Родительский раздел** (спрятан от ребёнка): на главном экране держать палец на заголовке 3 секунды, либо открыть адрес игры с `#reset` на конце. В нём:

- **резервная копия прогресса** — код, который можно скопировать или отправить себе; из него прогресс восстанавливается на этом же или другом устройстве (например, если иконку удалили с домашнего экрана или очистили данные Safari);
- номер версии игры — чтобы проверить, что обновление дошло до устройства;
- полный сброс (нужно ввести `RESET`).

**Как обновить установленную на iPad игру:** полностью закрыть её (смахнуть в переключателе приложений) и открыть снова при включённом интернете. Если версия в родительском разделе осталась старой — закрыть и открыть ещё раз. Прогресс при обновлении не теряется.

Фото и остальные материалы: см. [CREDITS.md](CREDITS.md).
