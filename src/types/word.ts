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

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface VocabSet {
  id: string;
  name: string;
  words: Word[];
  documents?: Document[];
  createdAt: number;
}

export type SortOption = 'alphabetical' | 'date';
