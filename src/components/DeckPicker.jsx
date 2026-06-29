import { getStats } from '../lib/storage.js'

// Second-level picker: the individual decks within one selected set.
export default function DeckPicker({ group, onStart, onDelete, onBack }) {
  const stats = getStats()

  return (
    <div className="picker">
      <div className="picker-head">
        <div>
          <button className="btn ghost back-link" onClick={onBack}>← All sets</button>
          <h1>{group.title}</h1>
        </div>
      </div>

      <div className="deck-grid">
        {group.decks.map((deck) => {
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
                {deck.source === 'imported' && <span className="chip chip-mine">Yours</span>}
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
