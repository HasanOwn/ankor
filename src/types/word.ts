export interface Word {
  id: number;
  set?: string;
  korean: string;
  uzbek?: string;
  meaning?: string;
  romanization?: string;
  example?: string;
  createdAt: number;
  isKnown?: boolean;
}

export type SortOption = 'alphabetical' | 'date';
