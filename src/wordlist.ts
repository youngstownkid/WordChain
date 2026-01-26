// Cache for loaded word sets by length
const WORD_CACHE: Map<number, Set<string>> = new Map();

// Get the base URL for assets (handles GitHub Pages deployment)
const getBaseUrl = (): string => {
  // Use import.meta.env.BASE_URL which Vite sets based on the base config
  return import.meta.env.BASE_URL || '/';
};

// Load words for a specific length on-demand
const loadWordsForLength = async (length: number): Promise<Set<string>> => {
  // Check cache first
  if (WORD_CACHE.has(length)) {
    return WORD_CACHE.get(length)!;
  }

  const words = new Set<string>();

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}words/${length}.txt`);
    const text = await response.text();
    const wordArray = text.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
    wordArray.forEach(word => words.add(word));

    // Cache the loaded words
    WORD_CACHE.set(length, words);
  } catch (error) {
    console.error(`Failed to load words of length ${length}:`, error);
    // Cache empty set to avoid repeated failed requests
    WORD_CACHE.set(length, words);
  }

  return words;
};

// Pre-load common word lengths (2-7 letters) for better UX
export const loadWordList = async (): Promise<void> => {
  // Pre-load the most common word lengths in parallel
  const commonLengths = [2, 3, 4, 5, 6, 7];
  await Promise.all(commonLengths.map(length => loadWordsForLength(length)));
};

export const isValidWord = async (word: string): Promise<boolean> => {
  const upperWord = word.toUpperCase();
  const length = upperWord.length;

  // Load words for this specific length if not already cached
  const wordsForLength = await loadWordsForLength(length);

  return wordsForLength.has(upperWord);
};

// Find all valid words that can be formed from a set of letters
export const findWordsFromLetters = async (
  letters: string[],
  minLength: number = 2,
  maxLength: number = 7,
): Promise<string[]> => {
  const results: string[] = [];
  const availableLetters = letters.map((l) => l.toUpperCase());

  // Check each word length
  for (let len = Math.min(maxLength, letters.length); len >= minLength; len--) {
    const wordsForLength = await loadWordsForLength(len);

    for (const word of wordsForLength) {
      // Check if word can be formed from available letters
      const lettersCopy = [...availableLetters];
      let canForm = true;

      for (const char of word) {
        const idx = lettersCopy.indexOf(char);
        if (idx === -1) {
          canForm = false;
          break;
        }
        lettersCopy.splice(idx, 1); // Remove used letter
      }

      if (canForm) {
        results.push(word);
      }
    }
  }

  return results;
};
