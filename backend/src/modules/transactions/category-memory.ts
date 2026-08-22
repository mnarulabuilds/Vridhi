import { normalizeLabel } from '../../common/money/insights';

export interface MemoryCandidate {
  title: string;
  merchant?: string | null;
  categoryId: string;
  categoryName: string;
}

export function pickCategoryMemory(query: string, candidates: MemoryCandidate[]): MemoryCandidate | null {
  const needle = normalizeLabel(query);
  if (needle.length < 2) return null;

  const scored = candidates
    .map((candidate) => {
      const merchant = normalizeLabel(candidate.merchant ?? '');
      const title = normalizeLabel(candidate.title);
      let score = 0;
      if (merchant && merchant === needle) score = 4;
      else if (title === needle) score = 3;
      else if (merchant && (merchant.includes(needle) || needle.includes(merchant))) score = 2;
      else if (title.includes(needle) || needle.includes(title)) score = 1;
      return { candidate, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.candidate ?? null;
}
