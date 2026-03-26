import fs from 'fs';
import path from 'path';
import { Room, RoomPublicState, Token } from './types';

const DB_PATH = path.join(__dirname, '../../data/rooms.json');

const rooms = new Map<string, Room>();

// ── Persistence ───────────────────────────────────────────────────────────────

function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function save() {
  ensureDataDir();
  const serialized = Array.from(rooms.values()).map(r => ({
    ...r,
    tokens: Array.from(r.tokens.values()),
    dmSocketId: null, // don't persist socket IDs
  }));
  fs.writeFileSync(DB_PATH, JSON.stringify(serialized, null, 2));
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as any[];
    for (const r of raw) {
      const tokenMap = new Map<string, Token>();
      for (const t of r.tokens ?? []) tokenMap.set(t.id, t);
      rooms.set(r.id, { ...r, tokens: tokenMap, dmSocketId: null });
    }
    console.log(`[store] loaded ${rooms.size} room(s) from disk`);
  } catch (e) {
    console.warn('[store] failed to load rooms.json:', e);
  }
}

// Load on startup
load();

// ── Room operations ───────────────────────────────────────────────────────────

export function createRoom(id: string, name: string, dmPassword: string): Room {
  const room: Room = {
    id,
    name,
    dmPassword,
    mapImage: null,
    gridSize: 50,
    fogCols: 0,
    fogRows: 0,
    tokens: new Map(),
    fog: [],
    initiative: [],
    dmSocketId: null,
  };
  rooms.set(id, room);
  save();
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function listRooms(): { id: string; name: string }[] {
  return Array.from(rooms.values()).map((r) => ({ id: r.id, name: r.name }));
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
  save();
}

export function saveRoom(_room: Room): void {
  save();
}

/** Initialize fog grid when a map is loaded */
export function initFog(room: Room, cols: number, rows: number): void {
  room.fogCols = cols;
  room.fogRows = rows;
  room.fog = Array.from({ length: rows }, () => Array(cols).fill(false));
  save();
}

/** Serialize room state for broadcast (strips password, converts Map to array) */
export function toPublicState(room: Room): RoomPublicState {
  return {
    id: room.id,
    name: room.name,
    mapImage: room.mapImage,
    gridSize: room.gridSize,
    fogCols: room.fogCols,
    fogRows: room.fogRows,
    tokens: Array.from(room.tokens.values()),
    fog: room.fog,
    initiative: room.initiative,
  };
}
