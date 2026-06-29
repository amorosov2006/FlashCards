// Top-level picker: choose a set (e.g. NCA-GENL Prep, Interview Prep, Your Decks).
// Selecting one drills into that set's individual decks (DeckPicker).
export default function GroupPicker({ groups, onSelect, onImport }) {
  return (
    <div className="picker">
      <div className="picker-head">
        <h1>Choose a set</h1>
        <button className="btn primary" onClick={onImport}>+ Import JSON</button>
      </div>

      {groups.length === 0 && (
        <div className="empty card-surface">
          <p>No decks yet.</p>
          <p className="muted">Import a JSON deck or paste cards to get started.</p>
          <button className="btn primary" onClick={onImport}>Import a deck</button>
        </div>
      )}

      <div className="deck-grid">
        {groups.map((g) => {
          const cards = g.decks.reduce((n, d) => n + d.cardCount, 0)
          return (
            <button key={g.id} className="deck-card card-surface group-card" onClick={() => onSelect(g.id)}>
              <h2 className="deck-title">{g.title}</h2>
              {g.description && <p className="deck-desc">{g.description}</p>}
              <div className="deck-meta">
                <span className="chip">{g.decks.length} {g.decks.length === 1 ? 'deck' : 'decks'}</span>
                <span className="chip">{cards} cards</span>
              </div>
              <span className="group-go">Open →</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
