export interface Word {
  id: number;
  set?: string;
  korean: string;
  uzbek: string;
  romanization: string;
  meaning?: string;
  example?: string;
  createdAt: number;
  isKnown?: boolean;
}

export interface VocabSet {
  id: string;
  name: string;
  words: Word[];
  createdAt: number;
}

export type SortOption = 'alphabetical' | 'date';
