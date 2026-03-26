import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { getRoom, toPublicState, saveRoom } from '../roomStore';
import { DiceRollResult, InitiativeEntry, Token } from '../types';

// Track which rooms each socket is in and whether they're DM
const socketMeta = new Map<string, { roomId: string; isDM: boolean; name: string }>();

function rollDice(expression: string): { rolls: number[]; total: number } | null {
  const match = expression.toLowerCase().match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count = Math.min(parseInt(match[1], 10), 20); // cap at 20 dice
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + modifier };
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── JOIN ─────────────────────────────────────────────────────────────────
    socket.on('room:join', (payload: { roomId: string; dmPassword?: string; playerName: string }) => {
      const room = getRoom(payload.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const isDM = payload.dmPassword === room.dmPassword;
      if (isDM) room.dmSocketId = socket.id;

      socketMeta.set(socket.id, { roomId: room.id, isDM, name: payload.playerName });
      socket.join(room.id);

      // Send full state to the joiner
      socket.emit('room:state', toPublicState(room));

      // Announce to others
      socket.to(room.id).emit('room:player-joined', {
        socketId: socket.id,
        name: payload.playerName,
        isDM,
      });

      console.log(`[socket] ${payload.playerName} joined room ${room.id} as ${isDM ? 'DM' : 'player'}`);
    });

    // ── TOKEN ADD ────────────────────────────────────────────────────────────
    socket.on('token:add', (payload: { name: string; x: number; y: number; hp: number; maxHp: number; ownerId?: string }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      if (!meta.isDM) { socket.emit('error', { message: 'Only the DM can add tokens' }); return; }

      const token: Token = {
        id: uuidv4(),
        name: payload.name,
        imageUrl: null,
        x: payload.x,
        y: payload.y,
        hp: payload.hp,
        maxHp: payload.maxHp,
        ownerId: payload.ownerId ?? null,
      };

      room.tokens.set(token.id, token);
      saveRoom(room);
      io.to(meta.roomId).emit('token:added', token);
    });

    // ── TOKEN MOVE ───────────────────────────────────────────────────────────
    socket.on('token:move', (payload: { tokenId: string; x: number; y: number }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;

      const token = room.tokens.get(payload.tokenId);
      if (!token) return;

      // DM can move any token; players can only move their own
      if (!meta.isDM && token.ownerId !== socket.id) {
        socket.emit('error', { message: 'You do not own this token' });
        return;
      }

      token.x = payload.x;
      token.y = payload.y;
      saveRoom(room);
      io.to(meta.roomId).emit('token:moved', { tokenId: token.id, x: token.x, y: token.y });
    });

    // ── TOKEN UPDATE (hp, name, etc.) ────────────────────────────────────────
    socket.on('token:update', (payload: Partial<Token> & { tokenId: string }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      if (!meta.isDM) { socket.emit('error', { message: 'Only the DM can update tokens' }); return; }

      const token = room.tokens.get(payload.tokenId);
      if (!token) return;

      if (payload.name !== undefined) token.name = payload.name;
      if (payload.hp !== undefined) token.hp = payload.hp;
      if (payload.maxHp !== undefined) token.maxHp = payload.maxHp;
      if (payload.ownerId !== undefined) token.ownerId = payload.ownerId;

      saveRoom(room);
      io.to(meta.roomId).emit('token:updated', token);
    });

    // ── TOKEN REMOVE ─────────────────────────────────────────────────────────
    socket.on('token:remove', (payload: { tokenId: string }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      if (!meta.isDM) { socket.emit('error', { message: 'Only the DM can remove tokens' }); return; }

      room.tokens.delete(payload.tokenId);
      saveRoom(room);
      io.to(meta.roomId).emit('token:removed', { tokenId: payload.tokenId });
    });

    // ── FOG UPDATE ───────────────────────────────────────────────────────────
    socket.on('fog:update', (payload: { cells: { row: number; col: number; revealed: boolean }[] }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      if (!meta.isDM) { socket.emit('error', { message: 'Only the DM can update fog' }); return; }

      for (const cell of payload.cells) {
        if (room.fog[cell.row]?.[cell.col] !== undefined) {
          room.fog[cell.row][cell.col] = cell.revealed;
        }
      }

      saveRoom(room);
      io.to(meta.roomId).emit('fog:updated', payload.cells);
    });

    // ── DICE ROLL ────────────────────────────────────────────────────────────
    socket.on('dice:roll', (payload: { expression: string }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;

      const result = rollDice(payload.expression.trim());
      if (!result) {
        socket.emit('error', { message: `Invalid dice expression: ${payload.expression}` });
        return;
      }

      const broadcast: DiceRollResult = {
        roller: meta.name,
        expression: payload.expression,
        rolls: result.rolls,
        total: result.total,
      };

      io.to(meta.roomId).emit('dice:rolled', broadcast);
    });

    // ── INITIATIVE ───────────────────────────────────────────────────────────
    socket.on('initiative:set', (payload: { entries: InitiativeEntry[] }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      if (!meta.isDM) { socket.emit('error', { message: 'Only the DM can set initiative' }); return; }

      room.initiative = [...payload.entries].sort((a, b) => b.value - a.value);
      saveRoom(room);
      io.to(meta.roomId).emit('initiative:updated', room.initiative);
    });

    socket.on('initiative:clear', () => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      if (!meta.isDM) return;

      room.initiative = [];
      saveRoom(room);
      io.to(meta.roomId).emit('initiative:updated', []);
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        const room = getRoom(meta.roomId);
        if (room?.dmSocketId === socket.id) room.dmSocketId = null;
        socket.to(meta.roomId).emit('room:player-left', { socketId: socket.id, name: meta.name });
        socketMeta.delete(socket.id);
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}
