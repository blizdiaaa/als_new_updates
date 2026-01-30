
export interface Unit {
  id: string;
  name: string;
  imageUrl: string;
  status?: 'Evo' | 'Unevo';
}

export interface ContentItem {
  id: string;
  type: string;
  title: string;
  description: string;
}

export interface CodeEntry {
  code: string;
  reward: string;
}

export interface GameUpdate {
  id: string;
  name: string;
  units: Unit[];
  contentItems: ContentItem[];
  buffs: ContentItem[];
  nerfs: ContentItem[];
  qol: ContentItem[];
  codes: CodeEntry[];
}

export type StorageData = {
  updates: GameUpdate[];
  activeUpdateId: string;
  isAdmin: boolean;
};
