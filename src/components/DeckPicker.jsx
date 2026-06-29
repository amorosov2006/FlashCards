import { getStats } from '../lib/storage.js'

export default function DeckPicker({ decks, onStart, onImport, onDelete }) {
  const stats = getStats()

  return (
    <div className="picker">
      <div className="picker-head">
        <h1>Your decks</h1>
        <button className="btn primary" onClick={onImport}>+ Import JSON</button>
      </div>

      {decks.length === 0 && (
        <div className="empty card-surface">
          <p>No decks yet.</p>
          <p className="muted">Import a JSON deck or paste cards to get started.</p>
          <button className="btn primary" onClick={onImport}>Import a deck</button>
        </div>
      )}

      <div className="deck-grid">
        {decks.map((deck) => {
          const s = stats[deck.id]
          return (
            <div key={deck.id} className="deck-card card-surface">
              <div className="deck-card-top">
                <h2 className="deck-title">{deck.title}</h2>
                {deck.source === 'imported' && (
                  <button
                    className="icon-btn"
                    title="Delete deck"
                    aria-label="Delete deck"
                    onClick={() => {
                      if (confirm(`Delete "${deck.title}"? This only removes it from this device.`)) {
                        onDelete(deck.id)
                      }
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {deck.description && <p className="deck-desc">{deck.description}</p>}

              <div className="deck-meta">
                <span className="chip">{deck.cardCount} cards</span>
                <span className={`chip ${deck.source === 'builtin' ? 'chip-builtin' : 'chip-mine'}`}>
                  {deck.source === 'builtin' ? 'Sample' : 'Yours'}
                </span>
                {s && <span className="chip chip-score">Best {s.bestPct}%</span>}
              </div>

              <div className="deck-actions">
                <button className="btn" onClick={() => onStart(deck.id, 'practice')}>Practice</button>
                <button className="btn primary" onClick={() => onStart(deck.id, 'quiz')}>Quiz</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
