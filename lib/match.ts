/**
 * Arabic-aware answer matching for the play engine.
 *
 * Players type free-form guesses; we must accept reasonable spelling variants
 * (alef forms, hamza, taa marbuta, yaa/alef-maqsura, diacritics, tatweel, the
 * definite article "ال", and minor typos) so the game feels fair.
 */

export function normalizeArabic(input: string): string {
  return (input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '') // tashkeel + dagger alef
    .replace(/ـ/g, '') // tatweel ـ
    .replace(/[آأإٱ]/g, 'ا') // آأإٱ -> ا
    .replace(/ى/g, 'ي') // ى -> ي
    .replace(/ؤ/g, 'و') // ؤ -> و
    .replace(/ئ/g, 'ي') // ئ -> ي
    .replace(/ة/g, 'ه') // ة -> ه
    .replace(/[^؀-ۿ0-9a-z\s]/gi, '') // strip punctuation/symbols
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop a leading definite article so "الرياض" matches "رياض". */
function stripArticle(s: string): string {
  return s.startsWith('ال') && s.length > 4 ? s.slice(2) : s;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j += 1) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i += 1) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1, // deletion
        dp[i - 1] + 1, // insertion
        prev + (a[i - 1] === b[j - 1] ? 0 : 1), // substitution
      );
      prev = tmp;
    }
  }
  return dp[m];
}

/** True when a guess should be accepted as equal to a target answer. */
export function isMatch(guess: string, answer: string): boolean {
  const g = stripArticle(normalizeArabic(guess));
  const a = stripArticle(normalizeArabic(answer));
  if (!g || !a) return false;
  if (g === a) return true;
  // Tolerate a single typo on reasonably long answers.
  const tolerance = a.length >= 6 ? 2 : a.length >= 4 ? 1 : 0;
  return tolerance > 0 && levenshtein(g, a) <= tolerance;
}

/**
 * Returns the index of the first answer matching the guess that is not already
 * in `revealed`, or -1 if there is no match.
 */
export function findAnswerIndex(
  guess: string,
  answers: { text: string }[],
  revealed: ReadonlySet<number>,
): number {
  for (let i = 0; i < answers.length; i += 1) {
    if (revealed.has(i)) continue;
    if (isMatch(guess, answers[i].text)) return i;
  }
  return -1;
}
