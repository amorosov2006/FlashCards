# FlashCards — Codebase Structure

## Overview

React 18 + Vite 5 PWA. Two study modes (Practice, Quiz), two bundled deck groups (NCA-GENL Prep, Interview Prep), plus user-importable JSON decks. Hosted on GitHub Pages; installable as a PWA on iPhone and desktop.

---

## Directory layout

```
FlashCards/
├── index.html                  # SPA shell; PWA meta tags for iOS
├── vite.config.js              # Vite + React plugin + vite-plugin-pwa
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Top-level state machine (view + navigation)
│   ├── styles.css              # All CSS (dark theme, 3D flip, quiz choices)
│   ├── config.js               # QUIZ_CHOICES = 4
│   ├── components/
│   │   ├── GroupPicker.jsx     # Top-level set picker (NCA-GENL / Interview / Your Decks)
│   │   ├── DeckPicker.jsx      # Second-level: individual decks within a group
│   │   ├── Practice.jsx        # 3D flip flashcard mode
│   │   ├── Quiz.jsx            # Multiple-choice quiz mode
│   │   └── ImportDeck.jsx      # JSON file upload / paste
│   └── lib/
│       ├── deck.js             # JSON parsing & normalization → internal deck shape
│       ├── quiz.js             # shuffle(), buildQuestion(), buildQuiz()
│       └── storage.js          # localStorage: imported decks + per-deck best scores
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── pwa-192.png / pwa-512.png / pwa-maskable-512.png
│   └── decks/
│       ├── index.json          # Grouped manifest (see below)
│       ├── nca-genl-01-core-ml-ai.json
│       ├── nca-genl-02-software-dev-nvidia.json
│       ├── nca-genl-03-experimentation-prompting.json
│       ├── nca-genl-04-data-analysis-viz.json
│       ├── nca-genl-05-trustworthy-ai.json
│       ├── nca-genl-06-nvidia-stack-deployment.json
│       ├── leetprep-01-genai-llm-fundamentals.json
│       ├── leetprep-02-rag-systems.json
│       ├── leetprep-03-finetuning-and-quantization.json
│       ├── leetprep-04-agents-mcp-langgraph.json
│       ├── leetprep-05-system-design.json
│       ├── leetprep-06-distributed-systems-event-driven.json
│       ├── leetprep-07-cloud-aws-serverless.json
│       ├── leetprep-08-java-spring-backend.json
│       ├── leetprep-09-sql-and-databases.json
│       ├── leetprep-10-behavioral-star.json
│       └── leetprep-11-tricky-leveling-and-weak-claims.json
├── scripts/
│   └── gen-icons.mjs           # Dependency-free PNG icon generator (run once)
└── .github/workflows/
    └── deploy.yml              # CI: build → upload artifact → deploy to Pages
```

---

## Navigation state machine (`App.jsx`)

Two state variables drive every view transition:

| `view`       | `groupId`      | What renders            |
|-------------|----------------|-------------------------|
| `'home'`    | `null`         | `GroupPicker`           |
| `'home'`    | `'nca-genl'`   | `DeckPicker` (that group) |
| `'practice'`| any            | `Practice`              |
| `'quiz'`    | any            | `Quiz`                  |
| `'import'`  | any            | `ImportDeck`            |

Key navigation functions:

- `goHome()` — resets both `view → 'home'` and `groupId → null` (top level)
- `exitToDecks()` — `view → 'home'`, keeps `groupId` (stays inside current group)
- `startMode(deckId, mode)` — sets `activeDeckId` and `view`

The logo always calls `goHome()`; the "← Decks" topbar button calls `handleTopBack()`, which goes to `goHome()` from import or `exitToDecks()` from practice/quiz.

---

## Data flow

```
public/decks/index.json
    │  (fetched on mount via loadBuiltinGroups())
    ▼
[{ id, title, description, decks: [filename, ...] }]
    │  each filename → loadDeckFile() → normalizeDeck()
    ▼
groups: [{ id, title, description, decks: [NormalizedDeck] }]
    │
    ├── builtinGroups (state)
    └── imported (state, from localStorage)
            │  merged via useMemo → groups
            ▼
        GroupPicker → DeckPicker → Practice / Quiz
```

`NormalizedDeck` shape (produced by `normalizeDeck()` in `deck.js`):
```js
{
  id: string,           // 'builtin:<filename>' or 'c-<timestamp>-<n>'
  title: string,
  description: string,
  source: 'builtin' | 'imported',
  cardCount: number,
  cards: NormalizedCard[]
}
```

`NormalizedCard` shape:
```js
{
  id: string,
  front: string,        // question shown in both modes
  back: string,         // LONG answer shown in Practice after flip
  hint: string,         // optional, shown under front in Practice
  quizAnswer: string|null,  // SHORT answer shown in Quiz (≈15 words, matches distractor length)
  distractors: string[]|null, // pool of 5+ wrong answers
  options: string[]|null,     // legacy explicit choices
  answer: string|null,        // legacy correct answer text
}
```

---

## Quiz mechanics (`lib/quiz.js`)

`buildQuiz(cards)` shuffles all cards and maps each through `buildQuestion()`.

`buildQuestion(card, allCards)`:
1. Correct answer = `card.quizAnswer ?? card.answer ?? card.back`
2. Distractor pool priority: `card.distractors` → `card.options` minus correct → other cards' `back` values
3. Randomly samples `QUIZ_CHOICES - 1` (= 3) distractors from the pool
4. Shuffles correct + distractors together into `choices: [{ text, correct }]`

The quiz UI re-runs the effect on every question change, so each question gets fresh random distractors from the 5+ pool.

---

## Keyboard shortcuts

### Practice mode (`Practice.jsx`)
| Key | Action |
|-----|--------|
| Space | Flip card |
| ← / → | Previous / Next card |
| K | Toggle "Known" |
| S | Shuffle deck |

### Quiz mode (`Quiz.jsx`)
| Key | Action |
|-----|--------|
| A / B / C / D | Select answer choice 1–4 |
| Enter or Space | Advance to next question (after answering) |

All handlers guard against `input`/`textarea` focus so typing in the Import screen isn't intercepted.

---

## Deck JSON format

Minimal valid deck:
```json
{
  "title": "My Deck",
  "cards": [
    { "front": "Question?", "back": "Long detailed answer for practice mode." }
  ]
}
```

Full format used by bundled decks:
```json
{
  "title": "Deck Name",
  "description": "optional subtitle",
  "cards": [
    {
      "front": "Question?",
      "back": "Long answer shown after flipping in Practice mode.",
      "quizAnswer": "Short ~15-word answer shown as the correct choice in Quiz.",
      "hint": "Optional hint shown under the question in Practice.",
      "distractors": [
        "Wrong answer 1 (~same word count as quizAnswer)",
        "Wrong answer 2",
        "Wrong answer 3",
        "Wrong answer 4",
        "Wrong answer 5"
      ]
    }
  ]
}
```

`front`/`back` are required. Accepted aliases: `question`/`answer`, `term`/`definition`, `q`/`a`, `prompt`/`response`.

`distractors` should have 5+ entries of similar visual length to `quizAnswer` so the correct option isn't obvious by length.

---

## Adding a new bundled deck

1. Create `public/decks/<name>.json` following the format above.
2. Add the filename to the appropriate group in `public/decks/index.json`:
   ```json
   { "id": "interview", "title": "Interview Prep", "decks": ["...", "<name>.json"] }
   ```
3. The app fetches and precaches deck JSON at build time via Workbox.

---

## Persistence (`lib/storage.js`)

All client-side, no backend.

| Key | Contents |
|-----|----------|
| `flashcards.importedDecks.v1` | Array of full `NormalizedDeck` objects |
| `flashcards.stats.v1` | `{ [deckId]: { bestPct, attempts, lastPct } }` |

---

## Build & deploy

### Local dev
```
npm install
npm run dev        # Vite dev server at http://localhost:5173
```

### GitHub Pages CI (`.github/workflows/deploy.yml`)
- Triggered on push to `main` or manual dispatch
- `actions/configure-pages@v5` with `enablement: true` — enables Pages on first run
- `npm run build` with `VITE_BASE=/<repo-name>/`
- Artifact uploaded and deployed via `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`
- Node 22 (avoids deprecated Node 20 warning)

### PWA (`vite.config.js`)
- `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- Workbox precaches all `*.{js,css,html,ico,png,svg,json,webmanifest}` — decks work offline
- Manifest: `display: standalone`, `orientation: portrait`, three icon sizes
- iOS: `apple-mobile-web-app-capable` + `apple-touch-icon.png` for Add to Home Screen

---

## CSS design tokens (`styles.css`)

```css
--bg: #0f172a          /* page background */
--surface: #1e293b     /* card background */
--surface-2: #334155   /* secondary surface / choice key bg */
--border: #334155
--text: #e2e8f0
--muted: #94a3b8
--primary: #6366f1     /* indigo */
--primary-2: #4f46e5
--success: #22c55e     /* correct answer green */
--danger: #ef4444      /* wrong answer red */
--warn: #f59e0b        /* hint amber */
--radius: 16px
```

Key layout classes: `.app` (max-width 720px, centered), `.deck-grid` (1 or 2 columns), `.flashcard` + `.flashcard-inner` (3D perspective flip), `.choice` + `.choice-key` (quiz option with A/B/C/D badge), `.score-ring` (results circle).
