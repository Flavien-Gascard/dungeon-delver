import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Room, RoomPublicState, Token } from './types';

const DB_PATH = path.join(__dirname, '../../data/rooms.json');
const SALT_ROUNDS = 10;

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
    dmSocketId: null,
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

load();

// ── Room operations ───────────────────────────────────────────────────────────

export async function createRoom(
  id: string,
  name: string,
  dmPassword: string,
  playerPassword: string,
): Promise<Room> {
  const [dmPasswordHash, playerPasswordHash] = await Promise.all([
    bcrypt.hash(dmPassword, SALT_ROUNDS),
    bcrypt.hash(playerPassword, SALT_ROUNDS),
  ]);

  const room: Room = {
    id,
    name,
    dmPasswordHash,
    playerPasswordHash,
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

export async function verifyDmPassword(room: Room, password: string): Promise<boolean> {
  return bcrypt.compare(password, room.dmPasswordHash);
}

export async function verifyPlayerPassword(room: Room, password: string): Promise<boolean> {
  return bcrypt.compare(password, room.playerPasswordHash);
}

/** Initialize fog grid when a map is loaded */
export function initFog(room: Room, cols: number, rows: number): void {
  room.fogCols = cols;
  room.fogRows = rows;
  room.fog = Array.from({ length: rows }, () => Array(cols).fill(false));
  save();
}

/** Serialize room state for broadcast (strips passwords, converts Map to array) */
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
