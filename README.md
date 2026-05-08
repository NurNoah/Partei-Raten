# Partei Raten

Ein modernes Web-Quiz, bei dem du die Parteizugehörigkeit deutscher Politiker:innen anhand ihrer Bilder erraten musst.

## Features

- **Live-Daten:** Politiker:innen und Parteien werden live über Abgeordnetenwatch und Wikidata geladen.
- **Modernes Design:** Dunkles, minimalistisches Interface mit flüssigen Animationen (Framer Motion).
- **Gamification:** Punkte-Zähler, Streak-Tracking und Speicherung des Fortschritts im `localStorage`.
- **Responsive:** Optimiert für Mobile und Desktop.
- **Backend-frei:** Die App ist ein reines Frontend-Projekt und benötigt keine eigene Datenbank.

## So funktioniert's

Die App sendet eine SPARQL-Abfrage an `https://query.wikidata.org/sparql`, um zufällige deutsche Politiker:innen zu finden, die:
1. Eine deutsche Staatsangehörigkeit haben.
2. Ein hinterlegtes Porträtbild besitzen.
3. Einer Partei angehören.

Der Name der Partei wird normalisiert (z. B. "Christlich Demokratische Union Deutschlands" -> "CDU"), um mit einer festen Liste bekannter deutscher Parteien abgeglichen zu werden.

## Installation & Start

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. **Produktions-Build:**
   ```bash
   npm run build
   ```

## Technologien

- **React 19**
- **Vite**
- **Tailwind CSS 4**
- **Framer Motion** (Animationen)
- **Lucide React** (Icons)
- **Wikidata API** (SPARQL)

## Bildrechte

Die Bilder stammen von **Wikimedia Commons** via Wikidata. Alle Bilder unterliegen freien Lizenzen (z. B. Creative Commons). Ein direkter Link zur Wikidata-Quelle ist nach jeder Antwort verfügbar.
