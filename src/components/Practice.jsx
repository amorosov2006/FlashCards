import { useEffect, useMemo, useState, useCallback } from 'react'
import { shuffle } from '../lib/quiz.js'

export default function Practice({ deck, onExit, onQuiz }) {
  const [order, setOrder] = useState(() => deck.cards.map((_, i) => i))
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(() => new Set())

  const cardIndex = order[pos]
  const card = deck.cards[cardIndex]
  const total = deck.cards.length
  const knownCount = known.size

  const reset = useCallback((shuffled) => {
    const base = deck.cards.map((_, i) => i)
    setOrder(shuffled ? shuffle(base) : base)
    setPos(0)
    setFlipped(false)
    setKnown(new Set())
  }, [deck])

  const next = useCallback(() => {
    setFlipped(false)
    setPos((p) => Math.min(p + 1, total - 1))
  }, [total])

  const prev = useCallback(() => {
    setFlipped(false)
    setPos((p) => Math.max(p - 1, 0))
  }, [])

  const toggleKnown = useCallback(() => {
    setKnown((prevSet) => {
      const s = new Set(prevSet)
      if (s.has(card.id)) s.delete(card.id)
      else s.add(card.id)
      return s
    })
  }, [card])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f) }
      else if (e.code === 'ArrowRight') next()
      else if (e.code === 'ArrowLeft') prev()
      else if (e.key.toLowerCase() === 'k') toggleKnown()
      else if (e.key.toLowerCase() === 's') reset(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleKnown, reset])

  const atEnd = pos === total - 1
  const progressPct = useMemo(() => Math.round(((pos + 1) / total) * 100), [pos, total])
  const isKnown = known.has(card.id)

  return (
    <div className="mode practice">
      <div className="mode-head">
        <div>
          <h1>{deck.title}</h1>
          <p className="muted">Practice · tap card to flip</p>
        </div>
        <button className="btn ghost" onClick={onQuiz}>Switch to Quiz →</button>
      </div>

      <div className="progress">
        <div className="progress-bar"><span style={{ width: `${progressPct}%` }} /></div>
        <div className="progress-text">
          <span>Card {pos + 1} / {total}</span>
          <span>{knownCount} known</span>
        </div>
      </div>

      <div className={`flashcard ${flipped ? 'is-flipped' : ''} ${isKnown ? 'known' : ''}`}
           onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0}>
        <div className="flashcard-inner">
          <div className="flashcard-face front">
            <span className="face-label">Question</span>
            <div className="face-content">{card.front}</div>
            {card.hint && <div className="hint">💡 {card.hint}</div>}
            <span className="flip-hint">tap / space to flip</span>
          </div>
          <div className="flashcard-face back">
            <span className="face-label">Answer</span>
            <div className="face-content">{card.back}</div>
            <span className="flip-hint">tap / space to flip</span>
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="btn" onClick={prev} disabled={pos === 0}>← Prev</button>
        <button className={`btn ${isKnown ? 'success' : ''}`} onClick={toggleKnown}>
          {isKnown ? '✓ Known' : 'Mark known'}
        </button>
        {atEnd
          ? <button className="btn primary" onClick={() => reset(false)}>↺ Restart</button>
          : <button className="btn primary" onClick={next}>Next →</button>}
      </div>

      <div className="subcontrols">
        <button className="btn ghost" onClick={() => reset(true)}>🔀 Shuffle</button>
        <button className="btn ghost" onClick={() => reset(false)}>Reset</button>
        <button className="btn ghost" onClick={onExit}>Done</button>
      </div>
    </div>
  )
}
