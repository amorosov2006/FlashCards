// Persist user-imported decks (and a little progress) in localStorage so they
// survive reloads on phone and desktop without any backend.

const DECKS_KEY = 'flashcards.importedDecks.v1'
const STATS_KEY = 'flashcards.stats.v1'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full / unavailable – ignore */
  }
}

export function getImportedDecks() {
  const decks = read(DECKS_KEY, [])
  return Array.isArray(decks) ? decks : []
}

export function saveImportedDeck(deck) {
  const decks = getImportedDecks()
  const idx = decks.findIndex((d) => d.id === deck.id)
  if (idx >= 0) decks[idx] = deck
  else decks.push(deck)
  write(DECKS_KEY, decks)
  return deck
}

export function deleteImportedDeck(id) {
  write(DECKS_KEY, getImportedDecks().filter((d) => d.id !== id))
}

// --- lightweight per-deck best quiz score ---------------------------------

export function getStats() {
  return read(STATS_KEY, {})
}

export function recordQuizScore(deckId, correct, total) {
  const stats = getStats()
  const prev = stats[deckId] || { bestPct: 0, attempts: 0 }
  const pct = total ? Math.round((correct / total) * 100) : 0
  stats[deckId] = {
    bestPct: Math.max(prev.bestPct, pct),
    attempts: prev.attempts + 1,
    lastPct: pct,
  }
  write(STATS_KEY, stats)
  return stats[deckId]
}
