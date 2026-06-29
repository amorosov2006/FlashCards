import { useEffect, useMemo, useState } from 'react'
import GroupPicker from './components/GroupPicker.jsx'
import DeckPicker from './components/DeckPicker.jsx'
import Practice from './components/Practice.jsx'
import Quiz from './components/Quiz.jsx'
import ImportDeck from './components/ImportDeck.jsx'
import { normalizeDeck } from './lib/deck.js'
import { getImportedDecks, deleteImportedDeck } from './lib/storage.js'

const BASE = import.meta.env.BASE_URL

async function loadDeckFile(file) {
  try {
    const r = await fetch(`${BASE}decks/${file}`, { cache: 'no-cache' })
    if (!r.ok) return null
    const data = await r.json()
    return normalizeDeck(data, { id: `builtin:${file}`, source: 'builtin' })
  } catch {
    return null
  }
}

// Load the bundled decks, grouped by origin, from public/decks/index.json.
// Supports the grouped format { groups: [{ id, title, description, decks: [...] }] }
// and falls back to a flat array (one implicit group) for older manifests.
async function loadBuiltinGroups() {
  try {
    const res = await fetch(`${BASE}decks/index.json`, { cache: 'no-cache' })
    if (!res.ok) return []
    const idx = await res.json()
    const groupsRaw = Array.isArray(idx)
      ? [{ id: 'decks', title: 'Decks', description: '', decks: idx }]
      : idx.groups || []
    const groups = await Promise.all(
      groupsRaw.map(async (g) => ({
        id: g.id,
        title: g.title,
        description: g.description || '',
        decks: (await Promise.all((g.decks || []).map(loadDeckFile))).filter(Boolean),
      }))
    )
    return groups.filter((g) => g.decks.length)
  } catch {
    return []
  }
}

export default function App() {
  const [builtinGroups, setBuiltinGroups] = useState([])
  const [imported, setImported] = useState(() => getImportedDecks())
  const [view, setView] = useState('home') // 'home' | 'import' | 'practice' | 'quiz'
  const [groupId, setGroupId] = useState(null)
  const [activeDeckId, setActiveDeckId] = useState(null)

  useEffect(() => {
    loadBuiltinGroups().then(setBuiltinGroups)
  }, [])

  // Imported (user) decks form their own group, shown only when present.
  const groups = useMemo(() => {
    const g = [...builtinGroups]
    if (imported.length) {
      g.push({
        id: 'imported',
        title: 'Your Decks',
        description: 'Decks you imported on this device.',
        decks: imported,
      })
    }
    return g
  }, [builtinGroups, imported])

  const allDecks = useMemo(() => groups.flatMap((g) => g.decks), [groups])
  const activeDeck = useMemo(
    () => allDecks.find((d) => d.id === activeDeckId) || null,
    [allDecks, activeDeckId]
  )
  const selectedGroup = groups.find((g) => g.id === groupId) || null

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

  // Return to the current group's deck list (e.g. after a quiz).
  function exitToDecks() {
    setView('home')
    setActiveDeckId(null)
  }

  // Full reset to the top-level set picker.
  function goHome() {
    setView('home')
    setActiveDeckId(null)
    setGroupId(null)
  }

  function handleTopBack() {
    if (view === 'import') goHome()
    else exitToDecks()
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="Home">
          <span className="brand-mark">🃏</span>
          <span className="brand-text">FlashCards</span>
        </button>
        {view !== 'home' && (
          <button className="btn ghost" onClick={handleTopBack}>
            ← Decks
          </button>
        )}
      </header>

      <main className="main">
        {view === 'home' &&
          (selectedGroup ? (
            <DeckPicker
              group={selectedGroup}
              onStart={startMode}
              onDelete={handleDelete}
              onBack={() => setGroupId(null)}
            />
          ) : (
            <GroupPicker
              groups={groups}
              onSelect={setGroupId}
              onImport={() => setView('import')}
            />
          ))}

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
          <Practice deck={activeDeck} onExit={exitToDecks} onQuiz={() => setView('quiz')} />
        )}

        {view === 'quiz' && activeDeck && (
          <Quiz deck={activeDeck} onExit={exitToDecks} onPractice={() => setView('practice')} />
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
