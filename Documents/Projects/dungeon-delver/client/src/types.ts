export interface Token {
  id: string;
  name: string;
  imageUrl: string | null;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  ownerId: string | null;
}

export interface InitiativeEntry {
  tokenId: string;
  name: string;
  value: number;
}

export interface RoomPublicState {
  id: string;
  name: string;
  mapImage: string | null;
  gridSize: number;
  fogCols: number;
  fogRows: number;
  tokens: Token[];
  fog: boolean[][];
  initiative: InitiativeEntry[];
}

export interface DiceRollResult {
  roller: string;
  expression: string;
  rolls: number[];
  total: number;
}
