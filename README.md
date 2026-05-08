# Partei Raten

Ein modernes Web-Quiz, bei dem du die Parteizugehörigkeit deutscher Politiker:innen anhand ihrer Bilder erraten musst.

## Features

- **Live-Daten:** Politiker:innen und Parteien werden live über Abgeordnetenwatch und Wikidata geladen.
- **Modernes Design:** Dunkles, minimalistisches Interface mit flüssigen Animationen (Framer Motion).
- **Gamification:** Punkte-Zähler, Streak-Tracking und Speicherung des Fortschritts im `localStorage`.
- **Responsive:** Optimiert für Mobile und Desktop.
- **Backend-frei:** Die App ist ein reines Frontend-Projekt und benötigt keine eigene Datenbank.

## So funktioniert's

Die App lädt zufällige Politiker:innen über Abgeordnetenwatch und ergänzt die Porträtbilder über Wikidata. Dabei werden nur Personen genutzt, die:
1. Einer der unterstützten Parteien angehören.
2. Eine Wikidata-ID besitzen.
3. Ein hinterlegtes Porträtbild besitzen.

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
- **Abgeordnetenwatch API**
- **Wikidata API**

## Bildrechte

Die Bilder stammen von **Wikimedia Commons** via Wikidata. Alle Bilder unterliegen freien Lizenzen (z. B. Creative Commons). Ein direkter Link zur Wikidata-Quelle ist nach jeder Antwort verfügbar.
