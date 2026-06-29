import { useEffect, useMemo, useState } from 'react'
import DeckPicker from './components/DeckPicker.jsx'
import Practice from './components/Practice.jsx'
import Quiz from './components/Quiz.jsx'
import ImportDeck from './components/ImportDeck.jsx'
import { normalizeDeck } from './lib/deck.js'
import { getImportedDecks, deleteImportedDeck } from './lib/storage.js'

const BASE = import.meta.env.BASE_URL

// Load the bundled decks listed in public/decks/index.json
async function loadBuiltinDecks() {
  try {
    const res = await fetch(`${BASE}decks/index.json`, { cache: 'no-cache' })
    if (!res.ok) return []
    const files = await res.json()
    const decks = await Promise.all(
      files.map(async (file) => {
        try {
          const r = await fetch(`${BASE}decks/${file}`, { cache: 'no-cache' })
          if (!r.ok) return null
          const data = await r.json()
          return normalizeDeck(data, { id: `builtin:${file}`, source: 'builtin' })
        } catch {
          return null
        }
      })
    )
    return decks.filter(Boolean)
  } catch {
    return []
  }
}

export default function App() {
  const [builtin, setBuiltin] = useState([])
  const [imported, setImported] = useState(() => getImportedDecks())
  const [view, setView] = useState('home') // 'home' | 'practice' | 'quiz' | 'import'
  const [activeDeckId, setActiveDeckId] = useState(null)

  useEffect(() => {
    loadBuiltinDecks().then(setBuiltin)
  }, [])

  const decks = useMemo(() => [...imported, ...builtin], [imported, builtin])
  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId) || null,
    [decks, activeDeckId]
  )

  function refreshImported() {
    setImported(getImportedDecks())
  }

  function startMode(deckId, mode) {
    setActiveDeckId(deckId)
    setView(mode)
  }

  function handleDelete(id) {
    deleteImportedDeck(id)
    refreshImported()
  }

  function goHome() {
    setView('home')
    setActiveDeckId(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="Home">
          <span className="brand-mark">🃏</span>
          <span className="brand-text">FlashCards</span>
        </button>
        {view !== 'home' && (
          <button className="btn ghost" onClick={goHome}>
            ← Decks
          </button>
        )}
      </header>

      <main className="main">
        {view === 'home' && (
          <DeckPicker
            decks={decks}
            onStart={startMode}
            onImport={() => setView('import')}
            onDelete={handleDelete}
          />
        )}

        {view === 'import' && (
          <ImportDeck
            onDone={() => {
              refreshImported()
              setView('home')
            }}
            onCancel={goHome}
          />
        )}

        {view === 'practice' && activeDeck && (
          <Practice deck={activeDeck} onExit={goHome} onQuiz={() => setView('quiz')} />
        )}

        {view === 'quiz' && activeDeck && (
          <Quiz deck={activeDeck} onExit={goHome} onPractice={() => setView('practice')} />
        )}

        {(view === 'practice' || view === 'quiz') && !activeDeck && (
          <div className="empty">
            <p>That deck is no longer available.</p>
            <button className="btn" onClick={goHome}>Back to decks</button>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Works offline · Add to Home Screen for an app-like experience</span>
      </footer>
    </div>
  )
}
