// Helpers for shuffling and building quiz questions.
import { QUIZ_CHOICES } from '../config.js'

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build a multiple-choice question for `card`, showing exactly `maxChoices`
// options: the correct answer plus (maxChoices - 1) distractors chosen at
// random from the card's available distractor pool.
//
// Distractor pool, in priority order:
//   1. card.distractors – an explicit pool of wrong answers (5+ recommended)
//   2. card.options      – explicit choice list (legacy), minus the correct one
//   3. other cards' answers in the same deck (fallback)
export function buildQuestion(card, allCards, maxChoices = QUIZ_CHOICES) {
  // Quiz shows a SHORT correct answer (quizAnswer) so it isn't obvious by length;
  // practice mode still shows the long `back`. Fall back to answer/back if absent.
  const correct = card.quizAnswer ?? card.answer ?? card.back

  let pool
  if (card.distractors && card.distractors.length) {
    pool = card.distractors
  } else if (card.options && card.options.length) {
    pool = card.options.filter((o) => o !== correct)
  } else {
    pool = allCards.filter((c) => c.id !== card.id && c.back !== correct).map((c) => c.back)
  }

  // De-dupe and never let the correct answer leak into the distractors.
  pool = [...new Set(pool)].filter((t) => t !== correct)

  const distractors = shuffle(pool).slice(0, Math.max(0, maxChoices - 1))
  const choices = shuffle([correct, ...distractors])

  return {
    cardId: card.id,
    prompt: card.front,
    choices: choices.map((text) => ({ text, correct: text === correct })),
    correctText: correct,
  }
}

export function buildQuiz(cards, maxChoices = QUIZ_CHOICES) {
  return shuffle(cards).map((c) => buildQuestion(c, cards, maxChoices))
}
