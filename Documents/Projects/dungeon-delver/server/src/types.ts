export interface Token {
  id: string;
  name: string;
  imageUrl: string | null;
  x: number; // grid column
  y: number; // grid row
  hp: number;
  maxHp: number;
  ownerId: string | null; // socket id of the player who owns this token
}

export interface InitiativeEntry {
  tokenId: string;
  name: string;
  value: number;
}

export interface Room {
  id: string;
  name: string;
  dmPasswordHash: string;        // bcrypt hash
  playerPasswordHash: string;    // bcrypt hash
  mapImage: string | null;       // filename under uploads/maps/
  gridSize: number;              // px per cell (default 50)
  fogCols: number;
  fogRows: number;
  tokens: Map<string, Token>;
  fog: boolean[][];              // [row][col] — true = revealed
  initiative: InitiativeEntry[];
  dmSocketId: string | null;
}

// Payloads sent over the wire (no Maps, no passwords)
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
  roller: string;    // socket id
  expression: string;
  rolls: number[];
  total: number;
}
