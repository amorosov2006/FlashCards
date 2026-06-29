# FlashCards

A custom flashcard app (React + Vite) that loads decks from JSON, with **Practice**
and **Quiz** modes. Installable as a PWA, so it works like a native app on iPhone
and desktop, and it works offline.

## Features

- **Practice mode** — flip cards (tap / spacebar), navigate, shuffle, mark cards as known.
- **Quiz mode** — multiple-choice questions, instant feedback, score, retry missed cards.
  Options are read from the JSON if provided, otherwise auto-generated from other cards.
- **Bring your own decks** — upload a `.json` file or paste JSON; saved on-device (localStorage).
- **Bundled sample decks** to start with.
- **Installable PWA** — "Add to Home Screen" on iPhone for an app-like, offline experience.

## Deck JSON format

```json
{
  "title": "My Deck",
  "description": "optional",
  "cards": [
    {
      "front": "Largest planet in the solar system?",
      "back": "Jupiter",
      "distractors": ["Saturn", "Neptune", "Earth", "Mars", "The Sun"]
    },
    { "front": "2 + 2", "back": "4", "hint": "addition" }
  ]
}
```

- `front` / `back` are required. `back` is the **correct** answer. Aliases accepted:
  `question`/`answer`, `term`/`definition`.
- `hint` (optional) shows in practice mode.
- **`quizAnswer`** (optional) is a short version of `back` shown in **quiz** mode, so the correct
  option's length matches the distractors and doesn't give itself away. **Practice** mode always
  shows the full `back`. If omitted, quiz falls back to `back`.
- **`distractors`** (preferred) is a pool of wrong answers — author **5 or more** per card.
  Quiz mode shows the correct answer plus `QUIZ_CHOICES - 1` (default **3**) distractors
  picked at random, so repeated attempts surface different options.
- Legacy `options` + `answer` are still supported (explicit fixed choice list). Without
  either field, quiz mode builds choices from other cards' answers.
- A bare array of cards (no wrapper object) also works.

The number of choices shown per quiz question is set by `QUIZ_CHOICES` in
[`src/config.js`](src/config.js) (default 4).

Bundled decks live in `public/decks/` and are listed in `public/decks/index.json`.

## Develop locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # regenerates icons + builds to dist/
npm run preview    # preview the production build
```

## Deploy to GitHub Pages (free)

1. Create a GitHub repo and push this project to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with the correct
   base path (`/<repo-name>/`) and publishes. Your app appears at
   `https://<your-username>.github.io/<repo-name>/`.

Open that URL on your iPhone in Safari → Share → **Add to Home Screen**. On desktop
Chrome/Edge, use the install icon in the address bar.

> The base path is derived automatically from the repo name, so you don't need to edit
> `vite.config.js`. Using a custom domain or a `username.github.io` repo? Set `VITE_BASE=/`.
