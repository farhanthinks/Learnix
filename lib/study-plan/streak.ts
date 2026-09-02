function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Longest run of consecutive days, counting back from today, on which the
 * student logged at least one completed study session. Today doesn't break
 * an active streak just because nothing's logged yet — the day isn't over,
 * so an empty "today" falls back to counting from yesterday instead.
 */
export function computeStreak(studiedDates: Set<string>, todayIso: string): number {
  let cursor = studiedDates.has(todayIso) ? todayIso : addDaysIso(todayIso, -1);
  let streak = 0;
  while (studiedDates.has(cursor)) {
    streak++;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive studied days anywhere in the history, not just counting back from today. */
export function computeLongestStreak(studiedDates: Set<string>): number {
  let longest = 0;
  for (const date of studiedDates) {
    const prevDay = addDaysIso(date, -1);
    if (studiedDates.has(prevDay)) continue; // not the start of a run

    let cursor = date;
    let run = 0;
    while (studiedDates.has(cursor)) {
      run++;
      cursor = addDaysIso(cursor, 1);
    }
    if (run > longest) longest = run;
  }
  return longest;
}
