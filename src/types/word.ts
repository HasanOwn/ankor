export interface Word {
  id: number;
  set?: string;
  // Storage uses legacy field names for backward compatibility:
  // `korean` = front/term, `uzbek` = back/translation, `romanization` = pronunciation
  korean: string;
  uzbek: string;
  romanization: string;
  meaning?: string;
  example?: string;
  category?: string;
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
  language?: string; // BCP-47 code for pronunciation, e.g. "ko-KR", "en-US"
  createdAt: number;
}

export type SortOption = 'alphabetical' | 'date';
