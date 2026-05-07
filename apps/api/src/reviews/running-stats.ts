/**
 * Pure helpers for the cleaner's running rating aggregate.
 * Stored as Float — accumulated additions/subtractions are subject to FP drift.
 * Acceptable for MVP; a periodic re-aggregate job is the long-term answer.
 */
export function addRating(
  oldAvg: number,
  oldCount: number,
  rating: number,
): { avg: number; count: number } {
  const newCount = oldCount + 1;
  const avg = (oldAvg * oldCount + rating) / newCount;
  return { avg, count: newCount };
}

export function removeRating(
  oldAvg: number,
  oldCount: number,
  rating: number,
): { avg: number; count: number } {
  const newCount = oldCount - 1;
  if (newCount <= 0) {
    return { avg: 0, count: 0 };
  }
  const avg = (oldAvg * oldCount - rating) / newCount;
  return { avg, count: newCount };
}
