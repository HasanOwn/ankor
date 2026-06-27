import { Word, CardState } from '@/types/word';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

const MIN_EASE = 1.3;
const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

export interface SRSPreview {
  interval: number; // days (fractional ok)
  label: string;
}

function formatInterval(days: number): string {
  if (days < 1) {
    const mins = Math.max(1, Math.round(days * 24 * 60));
    return `${mins} min`;
  }
  if (days < 30) return `${Math.round(days)} d`;
  if (days < 365) return `${(days / 30).toFixed(1)} mo`;
  return `${(days / 365).toFixed(1)} y`;
}

export function previewIntervals(word: Word): Record<Rating, SRSPreview> {
  const ease = word.ease ?? 2.5;
  const interval = word.interval ?? 0;
  const isNew = !word.state || word.state === 'new' || interval === 0;

  const again = 10 / (24 * 60); // 10 min
  const hard = isNew ? 2 / 24 : Math.max(2 / 24, interval * 1.2);
  const good = isNew ? 1 : Math.max(1, interval * ease);
  const easy = isNew ? 4 : Math.max(1, interval * ease * 1.3);

  return {
    again: { interval: again, label: formatInterval(again) },
    hard: { interval: hard, label: formatInterval(hard) },
    good: { interval: good, label: formatInterval(good) },
    easy: { interval: easy, label: formatInterval(easy) },
  };
}

export function applyRating(word: Word, rating: Rating): Word {
  const now = Date.now();
  let ease = word.ease ?? 2.5;
  let interval = word.interval ?? 0;
  let lapses = word.lapses ?? 0;
  let state: CardState = word.state ?? 'new';
  const isNew = state === 'new' || interval === 0;

  switch (rating) {
    case 'again':
      ease = Math.max(MIN_EASE, ease - 0.2);
      interval = 10 / (24 * 60);
      lapses += 1;
      state = 'learning';
      break;
    case 'hard':
      ease = Math.max(MIN_EASE, ease - 0.15);
      interval = isNew ? 2 / 24 : Math.max(2 / 24, interval * 1.2);
      state = 'review';
      break;
    case 'good':
      interval = isNew ? 1 : Math.max(1, interval * ease);
      state = 'review';
      break;
    case 'easy':
      ease = ease + 0.15;
      interval = isNew ? 4 : Math.max(1, interval * ease * 1.3);
      state = 'review';
      break;
  }

  const dueAt = rating === 'again'
    ? now + 10 * MIN
    : now + Math.round(interval * DAY);

  return { ...word, ease, interval, lapses, state, due: dueAt };
}

export function bucketCounts(words: Word[]) {
  const now = Date.now();
  let n = 0, l = 0, r = 0, due = 0;
  for (const w of words) {
    const s = w.state ?? 'new';
    if (s === 'new') n++;
    else if (s === 'learning') l++;
    else r++;
    if ((w.due ?? 0) <= now) due++;
  }
  return { new: n, learning: l, review: r, due };
}
