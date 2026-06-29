import { useRef, useState } from 'react'
import { parseDeckJSON } from '../lib/deck.js'
import { saveImportedDeck } from '../lib/storage.js'

const SAMPLE = `{
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
}`

export default function ImportDeck({ onDone, onCancel }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const fileRef = useRef(null)

  function tryImport(raw, title) {
    setError('')
    setOk('')
    try {
      const deck = parseDeckJSON(raw, { source: 'imported' })
      if (title && (!deck.title || deck.title === 'Untitled deck')) deck.title = title
      saveImportedDeck(deck)
      setOk(`Imported "${deck.title}" (${deck.cardCount} cards).`)
      setTimeout(onDone, 600)
    } catch (e) {
      setError(e.message)
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const name = file.name.replace(/\.json$/i, '')
      tryImport(String(reader.result), name)
    }
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsText(file)
  }

  return (
    <div className="import">
      <h1>Import a deck</h1>
      <p className="muted">
        Upload a <code>.json</code> file or paste JSON below. Decks are saved on this
        device only — no account needed.
      </p>

      <div className="import-row">
        <button className="btn primary" onClick={() => fileRef.current?.click()}>
          📁 Choose .json file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={onFile}
        />
      </div>

      <div className="divider"><span>or paste</span></div>

      <textarea
        className="json-input"
        spellCheck={false}
        placeholder={SAMPLE}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="import-actions">
        <button className="btn" onClick={() => setText(SAMPLE)}>Use sample</button>
        <button
          className="btn primary"
          onClick={() => tryImport(text)}
          disabled={!text.trim()}
        >
          Import pasted JSON
        </button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}
      {ok && <div className="alert success">✓ {ok}</div>}

      <details className="format-help">
        <summary>Expected JSON format</summary>
        <pre>{SAMPLE}</pre>
        <ul className="muted">
          <li><code>front</code> / <code>back</code> are required (aliases: question/answer, term/definition).</li>
          <li><code>hint</code> is optional, shown in practice mode.</li>
          <li><code>quizAnswer</code> is an optional short version of <code>back</code> shown in quiz mode (so its length matches the distractors). Practice mode always shows the long <code>back</code>.</li>
          <li><code>distractors</code> is a pool of wrong answers (5+ recommended). Quiz mode shows the correct answer plus 3 chosen at random.</li>
          <li>Legacy <code>options</code> + <code>answer</code> still work; without either, quiz builds choices from other cards.</li>
          <li>A bare array of cards (no wrapper object) also works.</li>
        </ul>
      </details>
    </div>
  )
}
