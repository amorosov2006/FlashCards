// Deck parsing, validation and normalization.
//
// Accepted JSON shapes (all normalized to the same internal structure):
//
// 1) Full object:
//    {
//      "title": "Spanish Basics",
//      "description": "optional",
//      "cards": [
//        { "front": "hola", "back": "hello" },
//        { "front": "2 + 2", "back": "4", "hint": "addition" },
//        { "front": "Capital of France?", "back": "Paris",
//          "options": ["Paris", "Lyon", "Nice", "Madrid"], "answer": "Paris" }
//      ]
//    }
//
// 2) Bare array of cards: [ { "front": "...", "back": "..." }, ... ]
//
// Card fields:
//   front   (required) – prompt shown first
//   back    (required) – answer shown after flip
//   hint    (optional) – small hint text in practice mode
//   options (optional) – array of choices for quiz mode (multiple choice)
//   answer  (optional) – the correct option (string) or 0-based index into options
//
// If a card has no options/answer, quiz mode auto-generates multiple-choice
// options using the answers of other cards in the deck.

let autoId = 0
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(autoId++).toString(36)}`

function asText(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return String(v)
}

export function normalizeCard(raw, index) {
  if (raw == null || typeof raw !== 'object') {
    throw new Error(`Card #${index + 1} is not an object.`)
  }
  // Be forgiving about common alternate key names.
  const front = raw.front ?? raw.question ?? raw.q ?? raw.term ?? raw.prompt
  const back = raw.back ?? raw.answer ?? raw.a ?? raw.definition ?? raw.response

  if (front == null || asText(front).trim() === '') {
    throw new Error(`Card #${index + 1} is missing a "front" (or "question"/"term").`)
  }
  if (back == null || asText(back).trim() === '') {
    throw new Error(`Card #${index + 1} is missing a "back" (or "answer"/"definition").`)
  }

  // Short version of the correct answer, shown in quiz mode so its length
  // matches the distractors. Practice mode still shows the long `back`.
  const quizAnswer =
    raw.quizAnswer != null ? asText(raw.quizAnswer)
    : raw.shortAnswer != null ? asText(raw.shortAnswer)
    : null

  // Explicit pool of wrong answers (preferred format for this project). Quiz
  // mode shows the correct answer plus a random subset of these.
  const distractors = Array.isArray(raw.distractors)
    ? [...new Set(raw.distractors.map(asText).map((s) => s.trim()).filter(Boolean))]
    : null

  let options = Array.isArray(raw.options) ? raw.options.map(asText) : null
  let answer = raw.answer ?? raw.correct ?? null

  // When explicit options exist, resolve the correct answer to a string.
  let answerText = null
  if (options && options.length) {
    if (typeof answer === 'number' && options[answer] != null) {
      answerText = asText(options[answer])
    } else if (answer != null && options.includes(asText(answer))) {
      answerText = asText(answer)
    } else {
      // Fall back to the card back if it is one of the options.
      answerText = options.includes(asText(back)) ? asText(back) : asText(options[0])
    }
  } else {
    options = null
  }

  return {
    id: raw.id ? String(raw.id) : uid('c'),
    front: asText(front),
    back: asText(back),
    hint: raw.hint != null ? asText(raw.hint) : '',
    options,
    answer: answerText,
    quizAnswer,
    distractors,
  }
}

export function normalizeDeck(raw, { id, source = 'imported' } = {}) {
  let title = 'Untitled deck'
  let description = ''
  let cardsRaw

  if (Array.isArray(raw)) {
    cardsRaw = raw
  } else if (raw && typeof raw === 'object' && Array.isArray(raw.cards)) {
    cardsRaw = raw.cards
    title = asText(raw.title || raw.name || title)
    description = asText(raw.description || '')
  } else {
    throw new Error('Deck must be an array of cards or an object with a "cards" array.')
  }

  if (!cardsRaw.length) {
    throw new Error('Deck has no cards.')
  }

  const cards = cardsRaw.map((c, i) => normalizeCard(c, i))

  return {
    id: id || uid('deck'),
    title,
    description,
    source, // 'builtin' | 'imported'
    cardCount: cards.length,
    cards,
  }
}

export function parseDeckJSON(text, opts) {
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`)
  }
  return normalizeDeck(data, opts)
}
