export interface Word {
  id: number;
  korean: string;
  meaning: string;
  example?: string;
  createdAt: number;
  isKnown?: boolean;
}

export type SortOption = 'alphabetical' | 'date';
