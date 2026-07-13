import quotesData from './quotes.json';

export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = quotesData;

/**
 * Returns a random quote. Optionally pass a quote to exclude so the next
 * quote is guaranteed to be different (useful for auto-rotating displays).
 */
export const getRandomQuote = (exclude?: Quote): Quote => {
  if (quotes.length === 0) {
    return { text: 'Keep learning, keep growing.', author: 'Secure Study Hub' };
  }

  if (quotes.length === 1 || !exclude) {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  let next = quotes[Math.floor(Math.random() * quotes.length)];
  while (next.text === exclude.text && quotes.length > 1) {
    next = quotes[Math.floor(Math.random() * quotes.length)];
  }
  return next;
};

/**
 * Returns a deterministic "quote of the day" so the same quote shows for the
 * whole calendar day rather than changing on every render.
 */
export const getDailyQuote = (): Quote => {
  if (quotes.length === 0) {
    return { text: 'Keep learning, keep growing.', author: 'Secure Study Hub' };
  }
  const now = new Date();
  const dayIndex = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000,
  );
  return quotes[dayIndex % quotes.length];
};
