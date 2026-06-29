import { useEffect, useMemo, useState } from 'react'
import { buildQuiz } from '../lib/quiz.js'
import { recordQuizScore } from '../lib/storage.js'

export default function Quiz({ deck, onExit, onPractice }) {
  const [questions, setQuestions] = useState(() => buildQuiz(deck.cards))
  const [pos, setPos] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([]) // { cardId, correct }
  const [finished, setFinished] = useState(false)

  const q = questions[pos]
  const total = questions.length
  const correctCount = answers.filter((a) => a.correct).length

  function restart(onlyWrong = false) {
    let cards = deck.cards
    if (onlyWrong) {
      const wrongIds = new Set(answers.filter((a) => !a.correct).map((a) => a.cardId))
      cards = deck.cards.filter((c) => wrongIds.has(c.id))
    }
    setQuestions(buildQuiz(cards))
    setPos(0)
    setSelected(null)
    setAnswers([])
    setFinished(false)
  }

  function choose(choice) {
    if (selected) return // already answered this question
    setSelected(choice)
    setAnswers((prev) => [...prev, { cardId: q.cardId, correct: choice.correct }])
  }

  function advance() {
    if (pos + 1 >= total) {
      setFinished(true)
    } else {
      setPos((p) => p + 1)
      setSelected(null)
    }
  }

  // Keyboard answering: A–D pick a choice, Enter/Space advances after answering.
  useEffect(() => {
    if (finished) return
    function onKeyDown(e) {
      if (e.target.closest('input, textarea, [contenteditable="true"]')) return
      const key = e.key.toLowerCase()
      const idx = ['a', 'b', 'c', 'd'].indexOf(key)
      if (idx !== -1 && q && idx < q.choices.length) {
        e.preventDefault()
        choose(q.choices[idx])
      } else if ((e.key === 'Enter' || e.key === ' ') && selected) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selected, finished, pos, total])

  // Record best score once when the quiz finishes.
  useEffect(() => {
    if (finished) recordQuizScore(deck.id, correctCount, total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const progressPct = useMemo(() => Math.round((pos / total) * 100), [pos, total])

  if (finished) {
    const pct = total ? Math.round((correctCount / total) * 100) : 0
    const wrong = total - correctCount
    return (
      <div className="mode quiz">
        <div className="results card-surface">
          <div className={`score-ring ${pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'low'}`}>
            <span className="score-num">{pct}%</span>
          </div>
          <h1>{pct >= 80 ? 'Great job! 🎉' : pct >= 50 ? 'Nice work 👍' : 'Keep practicing 💪'}</h1>
          <p className="muted">{correctCount} of {total} correct</p>
          <div className="results-actions">
            {wrong > 0 && (
              <button className="btn" onClick={() => restart(true)}>Retry {wrong} missed</button>
            )}
            <button className="btn primary" onClick={() => restart(false)}>Restart quiz</button>
            <button className="btn ghost" onClick={onPractice}>Practice mode</button>
            <button className="btn ghost" onClick={onExit}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mode quiz">
      <div className="mode-head">
        <div>
          <h1>{deck.title}</h1>
          <p className="muted">Quiz · pick the right answer</p>
        </div>
        <button className="btn ghost" onClick={onPractice}>Switch to Practice →</button>
      </div>

      <div className="progress">
        <div className="progress-bar"><span style={{ width: `${progressPct}%` }} /></div>
        <div className="progress-text">
          <span>Question {pos + 1} / {total}</span>
          <span>{correctCount} correct</span>
        </div>
      </div>

      <div className="question card-surface">
        <span className="face-label">Question</span>
        <div className="question-prompt">{q.prompt}</div>
      </div>

      <div className="choices">
        {q.choices.map((choice, i) => {
          let cls = 'choice'
          if (selected) {
            if (choice.correct) cls += ' correct'
            else if (choice === selected) cls += ' incorrect'
            else cls += ' dim'
          }
          return (
            <button key={i} className={cls} onClick={() => choose(choice)} disabled={!!selected}>
              <span className="choice-key">{String.fromCharCode(65 + i)}</span>
              <span className="choice-text">{choice.text}</span>
              {selected && choice.correct && <span className="choice-mark">✓</span>}
              {selected && choice === selected && !choice.correct && <span className="choice-mark">✕</span>}
            </button>
          )
        })}
      </div>

      <div className="controls">
        {selected
          ? <button className="btn primary wide" onClick={advance}>
              {pos + 1 >= total ? 'See results →' : 'Next question →'}
            </button>
          : <p className="muted center">Select an answer above (or press A–D)</p>}
      </div>
    </div>
  )
}
